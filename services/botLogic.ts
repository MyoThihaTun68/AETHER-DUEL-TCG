import { GameState, CardType, Card, MageEffect, UnitAbility } from "../types";

export interface AIAction {
    action: 'PLAY_CARD' | 'END_TURN';
    cardId?: string;
    slotIndex?: number;
    targetSlotIndex?: number;
    reasoning?: string;
}

// Helper: Calculate threat level of a card
const calculateThreat = (card: Card | null): number => {
    if (!card || !card.health || card.health <= 0) return 0;
    const attack = card.attack || 0;
    const health = card.health || 0;
    return attack * 2 + health; // Attack is weighted higher
};

// Helper: Find best slot for a unit based on type
const findBestSlot = (board: (Card | null)[], card: Card): number => {
    // Tanks (high HP, low attack) go in slots 1-2
    const isTank = (card.health || 0) >= 4 && (card.attack || 0) <= 3;

    // Mages go in slots 5-6
    if (card.type === CardType.MAGE) {
        if (!board[5]) return 5;
        if (!board[6]) return 6;
        // Replace weaker mage if both slots full
        const mage5Threat = calculateThreat(board[5]);
        const mage6Threat = calculateThreat(board[6]);
        return mage5Threat < mage6Threat ? 5 : 6;
    }

    // Tanks prefer front (1-2)
    if (isTank) {
        if (!board[1]) return 1;
        if (!board[2]) return 2;
    }

    // Damage dealers prefer back (3-4, 7)
    if (!isTank) {
        if (!board[3]) return 3;
        if (!board[4]) return 4;
        if (!board[7]) return 7;
    }

    // Fallback: any empty slot (1-4, 7)
    for (const idx of [1, 2, 3, 4, 7]) {
        if (!board[idx]) return idx;
    }

    return -1;
};

// Helper: Evaluate if we should play defensively
const shouldPlayDefensive = (gameState: GameState): boolean => {
    const enemyHP = gameState.enemy.board[0]?.health || 0;
    const enemyMaxHP = gameState.enemy.board[0]?.maxHealth || 30;
    const playerThreat = gameState.player.board.reduce((sum, card) => sum + calculateThreat(card), 0);

    return (enemyHP / enemyMaxHP) < 0.4 || playerThreat > 20;
};

// Helper: Find highest threat player unit
const findHighestThreatTarget = (playerBoard: (Card | null)[]): number => {
    let maxThreat = 0;
    let targetIdx = 0;

    playerBoard.forEach((card, idx) => {
        const threat = calculateThreat(card);
        if (threat > maxThreat) {
            maxThreat = threat;
            targetIdx = idx;
        }
    });

    return targetIdx;
};

export const getEnemyMove = async (gameState: GameState): Promise<AIAction> => {
    // Simulate "thinking" time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const playableCards = gameState.enemy.hand.filter(c => c.cost <= gameState.enemy.mana);
    const enemyBoard = gameState.enemy.board;
    const playerBoard = gameState.player.board;
    const enemyHP = enemyBoard[0]?.health || 0;
    const enemyMaxHP = enemyBoard[0]?.maxHealth || 30;
    const isDefensive = shouldPlayDefensive(gameState);

    if (playableCards.length === 0) {
        return { action: 'END_TURN', reasoning: "No playable cards" };
    }

    // === PRIORITY 1: EMERGENCY HEALING ===
    if (enemyHP < enemyMaxHP * 0.3) {
        const healCard = playableCards.find(c => c.type === CardType.SPELL_HEAL);
        if (healCard) {
            return {
                action: 'PLAY_CARD',
                cardId: healCard.id,
                reasoning: "Emergency heal - Low HP!"
            };
        }
    }

    // === PRIORITY 2: PLAY MAGES (Passive effects are powerful) ===
    const mageCard = playableCards.find(c => c.type === CardType.MAGE);
    if (mageCard) {
        const slot5 = enemyBoard[5];
        const slot6 = enemyBoard[6];

        // Prioritize healing mages when defensive
        if (isDefensive && mageCard.mageEffect === MageEffect.HEAL_ALL_FRIENDLY) {
            if (!slot5) return { action: 'PLAY_CARD', cardId: mageCard.id, slotIndex: 5, reasoning: "Playing Healer Mage (Defensive)" };
            if (!slot6) return { action: 'PLAY_CARD', cardId: mageCard.id, slotIndex: 6, reasoning: "Playing Healer Mage (Defensive)" };
        }

        // Play mage if slot empty
        if (!slot5) return { action: 'PLAY_CARD', cardId: mageCard.id, slotIndex: 5, reasoning: "Playing Mage (Left)" };
        if (!slot6) return { action: 'PLAY_CARD', cardId: mageCard.id, slotIndex: 6, reasoning: "Playing Mage (Right)" };

        // Replace weaker mage
        if (slot5 && calculateThreat(slot5) < calculateThreat(mageCard)) {
            return { action: 'PLAY_CARD', cardId: mageCard.id, slotIndex: 5, reasoning: "Upgrading Mage (Left)" };
        }
        if (slot6 && calculateThreat(slot6) < calculateThreat(mageCard)) {
            return { action: 'PLAY_CARD', cardId: mageCard.id, slotIndex: 6, reasoning: "Upgrading Mage (Right)" };
        }
    }

    // === PRIORITY 3: SUMMON UNITS STRATEGICALLY ===
    const unitCards = playableCards.filter(c => c.type === CardType.UNIT || c.type === CardType.SUMMONER);

    if (unitCards.length > 0) {
        // Prioritize high-value units
        unitCards.sort((a, b) => {
            const threatA = calculateThreat(a);
            const threatB = calculateThreat(b);
            return threatB - threatA;
        });

        for (const unit of unitCards) {
            const bestSlot = findBestSlot(enemyBoard, unit);
            if (bestSlot !== -1) {
                const slotType = bestSlot <= 2 ? "Tank" : bestSlot <= 4 || bestSlot === 7 ? "Attacker" : "Mage";
                return {
                    action: 'PLAY_CARD',
                    cardId: unit.id,
                    slotIndex: bestSlot,
                    reasoning: `Summoning ${slotType}: ${unit.name}`
                };
            }
        }
    }

    // === PRIORITY 4: USE DAMAGE SPELLS ON HIGH THREATS ===
    const damageSpell = playableCards.find(c =>
        c.type === CardType.ATTACK ||
        c.type === CardType.SPELL_DAMAGE ||
        c.type === CardType.SPELL_FREEZE ||
        c.type === CardType.SPELL_VAMPIRIC
    );

    if (damageSpell) {
        const targetIdx = findHighestThreatTarget(playerBoard);
        const target = playerBoard[targetIdx];

        if (target && calculateThreat(target) > 5) {
            return {
                action: 'PLAY_CARD',
                cardId: damageSpell.id,
                targetSlotIndex: targetIdx,
                reasoning: `Targeting threat: ${target.name}`
            };
        }
    }

    // === PRIORITY 5: USE SHIELD IF DEFENSIVE ===
    if (isDefensive) {
        const shieldCard = playableCards.find(c => c.type === CardType.DEFENSE);
        if (shieldCard) {
            return {
                action: 'PLAY_CARD',
                cardId: shieldCard.id,
                reasoning: "Defensive shield"
            };
        }
    }

    // === PRIORITY 6: PLAY HIGHEST COST CARD (Value) ===
    playableCards.sort((a, b) => b.cost - a.cost);
    const bestCard = playableCards[0];

    if (bestCard && (bestCard.type === CardType.SPELL_HEAL || bestCard.type === CardType.DEFENSE)) {
        return {
            action: 'PLAY_CARD',
            cardId: bestCard.id,
            reasoning: "Playing support spell"
        };
    }

    return { action: 'END_TURN', reasoning: "No optimal moves available" };
};
