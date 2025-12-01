import { GameState, CardType } from "../types";

export interface AIAction {
    action: 'PLAY_CARD' | 'END_TURN';
    cardId?: string;
    slotIndex?: number;
    reasoning?: string;
}

export const getEnemyMove = async (gameState: GameState): Promise<AIAction> => {
    // Simulate "thinking" time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const playableCards = gameState.enemy.hand.filter(c => c.cost <= gameState.enemy.mana);

    if (playableCards.length === 0) {
        return { action: 'END_TURN', reasoning: "No mana" };
    }

    // 1. Try to play Mage if Mage Slots (5 or 6) are empty
    const mageCard = playableCards.find(c => c.type === CardType.MAGE);
    const mageSlot5Empty = gameState.enemy.board[5] === null;
    const mageSlot6Empty = gameState.enemy.board[6] === null;

    if (mageCard) {
        if (mageSlot5Empty) return { action: 'PLAY_CARD', cardId: mageCard.id, slotIndex: 5, reasoning: "Playing Mage (Left)" };
        if (mageSlot6Empty) return { action: 'PLAY_CARD', cardId: mageCard.id, slotIndex: 6, reasoning: "Playing Mage (Right)" };
    }

    // 2. Try to play Unit/Summoner in empty slots (1-4)
    // Indices 1,2 are Tanks. 3,4 are Units.
    const emptySlotIndex = gameState.enemy.board.findIndex((slot, idx) => slot === null && idx !== 0 && idx !== 5 && idx !== 6);
    const unitCard = playableCards.find(c => c.type === CardType.UNIT || c.type === CardType.SUMMONER);

    if (unitCard && emptySlotIndex !== -1) {
        return { action: 'PLAY_CARD', cardId: unitCard.id, slotIndex: emptySlotIndex, reasoning: "Summoning Unit" };
    }

    // 3. Otherwise play whatever (Spells)
    // Prioritize spells that use most mana
    playableCards.sort((a, b) => b.cost - a.cost);
    const bestCard = playableCards[0];

    if (bestCard.type !== CardType.UNIT && bestCard.type !== CardType.MAGE && bestCard.type !== CardType.SUMMONER) {
        return { action: 'PLAY_CARD', cardId: bestCard.id, reasoning: "Playing Spell" };
    }

    return { action: 'END_TURN', reasoning: "No valid moves" };
};
