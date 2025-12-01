
import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { GameState, GamePhase, Card, CardType, SlotType, MageEffect, DifficultyLevel, UnitAbility } from '../types';
import { INITIAL_HP, INITIAL_MANA, MAX_MANA, generateDeck, MAX_HAND_SIZE, INITIAL_HAND_SIZE, createLeaderCard, createTokenCard, SLOT_CONFIG, MAX_BOARD_SLOTS } from '../constants';
import { CardComponent } from './CardComponent';
import { getEnemyMove } from '../services/botLogic';
import { soundManager } from '../services/soundService';
import { VFXLayer, VFXHandle } from './VFXLayer'; // Import VFX

// --- Utility Components ---

const StatBar: React.FC<{ value: number, max: number, color: string, label: string, icon: string, alignRight?: boolean, size?: 'sm' | 'md' }> = ({ value, max, color, label, icon, alignRight = false, size = 'md' }) => {
    const barRef = useRef<HTMLDivElement>(null);
    const fillRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        gsap.to(fillRef.current, { width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, duration: 0.6, ease: 'power2.out' });
    }, [value, max]);

    const height = size === 'sm' ? 'h-2' : 'h-3 md:h-4';
    const fontSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

    return (
        <div className={`w-full ${alignRight ? 'text-right' : 'text-left'}`}>
            <div className={`flex ${alignRight ? 'flex-row-reverse' : 'flex-row'} items-center justify-between text-yellow-100 ${fontSize} mb-1 font-bold tracking-wider`}>
                <span className="flex items-center gap-1 opacity-80">{icon} {label}</span>
                <span className="font-mono text-white">{value}/{max}</span>
            </div>
            <div ref={barRef} className={`w-full ${height} bg-slate-950 rounded-sm overflow-hidden border border-slate-700 relative shadow-inner`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-10"></div>
                <div ref={fillRef} className={`h-full ${color} relative z-0`}>
                    <div className="absolute top-0 right-0 w-1 h-full bg-white/50 blur-[1px]"></div>
                </div>
            </div>
        </div>
    );
};

const DamageNumber: React.FC<{ value: string, x: number, y: number, color: string }> = ({ value, x, y, color }) => {
    const elRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const tl = gsap.timeline();
        tl.fromTo(elRef.current,
            { opacity: 0, scale: 0, y: 0 },
            { opacity: 1, scale: 1.5, y: -40, duration: 0.4, ease: 'back.out(2)' }
        )
            .to(elRef.current, { y: -100, opacity: 0, duration: 1.0, ease: 'power1.in' });
    }, []);
    return (
        <div ref={elRef} className={`absolute text-4xl font-black ${color} drop-shadow-[0_4px_4px_rgba(0,0,0,1)] pointer-events-none z-[100]`} style={{ left: x, top: y, textShadow: '0 0 10px currentColor' }}>
            {value}
        </div>
    );
};

// --- Game Board Component ---

interface GameBoardProps {
    customDeck: Card[];
    difficulty: DifficultyLevel;
    onExit: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ customDeck, difficulty, onExit }) => {
    // Difficulty Modifiers
    const getDifficultyModifiers = () => {
        switch (difficulty) {
            case DifficultyLevel.EASY:
                return { enemyHp: 20, enemyMana: 0, enemyShield: 0 };
            case DifficultyLevel.NORMAL:
                return { enemyHp: 30, enemyMana: 1, enemyShield: 0 };
            case DifficultyLevel.HARD:
                return { enemyHp: 40, enemyMana: 2, enemyShield: 3 };
            case DifficultyLevel.HARDCORE:
                return { enemyHp: 50, enemyMana: 3, enemyShield: 5 };
            default:
                return { enemyHp: 30, enemyMana: 1, enemyShield: 0 };
        }
    };

    const diffMods = getDifficultyModifiers();

    // Game State
    const [gameState, setGameState] = useState<GameState>({
        turn: 1,
        phase: GamePhase.INIT,
        winner: null,
        difficulty: difficulty,
        player: {
            id: 'player',
            hp: INITIAL_HP,
            maxHp: INITIAL_HP,
            mana: INITIAL_MANA,
            maxMana: MAX_MANA,
            hand: [],
            deck: generateDeck(customDeck),
            graveyard: [],
            board: Array(MAX_BOARD_SLOTS).fill(null),
            shield: 0,
            status: { burn: 0, poison: 0, freeze: 0 }
        },
        enemy: {
            id: 'enemy',
            hp: diffMods.enemyHp,
            maxHp: diffMods.enemyHp,
            mana: diffMods.enemyMana,
            maxMana: MAX_MANA,
            hand: [],
            deck: generateDeck(),
            graveyard: [],
            board: Array(MAX_BOARD_SLOTS).fill(null),
            shield: diffMods.enemyShield,
            status: { burn: 0, poison: 0, freeze: 0 }
        }
    });

    const [floatingTexts, setFloatingTexts] = useState<Array<{ id: number, val: string, x: number, y: number, color: string }>>([]);
    const [showcaseCard, setShowcaseCard] = useState<Card | null>(null);
    const [detailCard, setDetailCard] = useState<Card | null>(null);
    const [showStartScreen, setShowStartScreen] = useState(true);

    // Drag State
    const [dragState, setDragState] = useState<{
        card: Card | null,
        source: 'hand' | 'board',
        slotIndex?: number,
        x: number,
        y: number,
    }>({ card: null, source: 'hand', x: 0, y: 0 });

    const appRef = useRef<HTMLDivElement>(null);
    const vfxRef = useRef<VFXHandle>(null); // Ref for VFX Layer

    const spawnFloatingText = (val: string, x: number, y: number, color: string = 'text-white') => {
        const id = Date.now() + Math.random();
        setFloatingTexts(prev => [...prev, { id, val, x, y, color }]);
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(t => t.id !== id));
        }, 1500);
    };

    const shakeScreen = (intensity: number = 5) => {
        gsap.to(appRef.current, { x: intensity, duration: 0.05, repeat: 5, yoyo: true, clearProps: 'x' });
    };

    const handleStartGame = () => {
        soundManager.init(); // Unlock Audio
        setShowStartScreen(false);
        runGameStartSequence();
    };

    const runGameStartSequence = () => {
        setGameState(prev => {
            const pDeck = [...prev.player.deck];
            const pHand = pDeck.splice(0, INITIAL_HAND_SIZE);
            const eDeck = [...prev.enemy.deck];
            const eHand = eDeck.splice(0, INITIAL_HAND_SIZE);

            const pBoard = [...prev.player.board];
            const eBoard = [...prev.enemy.board];

            pBoard[0] = createLeaderCard();
            eBoard[0] = createLeaderCard();

            return {
                ...prev,
                player: { ...prev.player, deck: pDeck, hand: pHand, board: pBoard },
                enemy: { ...prev.enemy, deck: eDeck, hand: eHand, board: eBoard },
            };
        });

        const tl = gsap.timeline({ onComplete: () => startTurn('player') });
        tl.fromTo(".game-bg", { opacity: 0 }, { opacity: 1, duration: 2 });
        tl.fromTo(".hud-element", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, "-=1");
        soundManager.play('draw');
    };

    // --- Turn Logic ---

    const resolveMageEffects = (activeBoard: (Card | null)[], opponentBoard: (Card | null)[], who: 'player' | 'enemy') => {
        // Check both mage slots (5 and 6)
        [5, 6].forEach(mageSlot => {
            const mage = activeBoard[mageSlot];
            if (mage && mage.type === CardType.MAGE && mage.mageEffect && !mage.isExhausted) {

                let effectTriggered = false;
                const mageSlotEl = document.getElementById(`slot-${who}-${mageSlot}`);
                const mageRect = mageSlotEl?.getBoundingClientRect();

                if (mage.mageEffect === MageEffect.DAMAGE_ENEMY_TANKS) {
                    [1, 2].forEach(idx => {
                        const tank = opponentBoard[idx];
                        if (tank && tank.health && tank.health > 0) {
                            effectTriggered = true;

                            const slotEl = document.getElementById(`slot-${who === 'player' ? 'enemy' : 'player'}-${idx}`);
                            const rect = slotEl?.getBoundingClientRect();

                            // Trigger VFX: Fireball from Mage to Tank
                            if (mageRect && rect && vfxRef.current) {
                                vfxRef.current.playEffect('FIREBALL', mageRect, rect);
                            }

                            // Delayed Damage
                            setTimeout(() => {
                                tank.health! -= 1;
                                spawnFloatingText("-1", rect ? rect.left + rect.width / 2 : 0, rect ? rect.top : 0, 'text-red-500');
                                if (tank.health! <= 0) {
                                    opponentBoard[idx] = null;
                                    soundManager.play('death');
                                } else {
                                    soundManager.play('damage_spell');
                                }
                            }, 1000); // Wait for fireball
                        }
                    });
                } else if (mage.mageEffect === MageEffect.HEAL_FRIENDLY_TANKS) {
                    [1, 2].forEach(idx => {
                        const tank = activeBoard[idx];
                        if (tank && tank.health && tank.maxHealth) {
                            effectTriggered = true;
                            const slotEl = document.getElementById(`slot-${who}-${idx}`);
                            const rect = slotEl?.getBoundingClientRect();

                            // Trigger VFX: Heal
                            if (mageRect && rect && vfxRef.current) {
                                vfxRef.current.playEffect('HEAL', rect, rect); // Heal spawns on target
                            }

                            setTimeout(() => {
                                if (tank.health! < tank.maxHealth!) {
                                    tank.health = Math.min(tank.health! + 1, tank.maxHealth!);
                                    spawnFloatingText("+1 HP", rect ? rect.left + rect.width / 2 : 0, rect ? rect.top : 0, 'text-green-500');
                                } else {
                                    spawnFloatingText("MAX HP", rect ? rect.left + rect.width / 2 : 0, rect ? rect.top : 0, 'text-green-500');
                                }
                                soundManager.play('heal');
                            }, 500);
                        }
                    });
                }

                if (effectTriggered) {
                    soundManager.play('play_spell');
                    if (mageRect) {
                        spawnFloatingText("PASSIVE!", mageRect.left + mageRect.width / 2, mageRect.top, 'text-fuchsia-400');
                    }
                }
            }
        });
        return { activeBoard, opponentBoard };
    };

    const startTurn = (who: 'player' | 'enemy') => {
        setGameState(prev => {
            const active = who === 'player' ? prev.player : prev.enemy;
            const opponent = who === 'player' ? prev.enemy : prev.player;

            let newMana = Math.min(prev.turn + (who === 'player' ? 1 : 0), MAX_MANA);

            if (who === 'player' && prev.phase !== GamePhase.INIT) newMana = Math.min(prev.turn + 1, MAX_MANA);
            else if (who === 'enemy') newMana = Math.min(prev.turn, MAX_MANA);

            let newDeck: Card[] = [...active.deck];
            let newGraveyard: Card[] = [...active.graveyard];
            let newHand = [...active.hand];

            const drawCount = prev.turn > 10 ? 3 : 1;

            for (let i = 0; i < drawCount; i++) {
                if (newDeck.length === 0 && newGraveyard.length > 0) {
                    newDeck = [...newGraveyard].sort(() => Math.random() - 0.5);
                    newGraveyard = [];
                    if (who === 'player') {
                        spawnFloatingText("Deck Refilled!", window.innerWidth / 2, window.innerHeight / 2, "text-blue-400");
                    }
                }
                if (newDeck.length > 0) {
                    const drawn = newDeck.pop();
                    if (drawn) {
                        if (newHand.length < MAX_HAND_SIZE) {
                            newHand.push(drawn);
                        } else {
                            // Burn Card
                            newGraveyard.push(drawn);
                            if (who === 'player') {
                                spawnFloatingText("Hand Full! Card Burned!", window.innerWidth / 2, window.innerHeight / 2, "text-orange-500");
                                soundManager.play('discard');
                            }
                        }
                    }
                }
            }
            if (who === 'player') soundManager.play('draw');

            let newBoard: (Card | null)[] = active.board.map(c => (c && (c.health || 0) > 0) ? { ...c, isExhausted: false, canAttack: true } : null);
            let opponentBoard = [...opponent.board];

            // Only checking passive for active player start logic for now
            const resolved = resolveMageEffects(newBoard, opponentBoard, who);
            newBoard = resolved.activeBoard;
            opponentBoard = resolved.opponentBoard;

            const newState = {
                ...prev,
                phase: who === 'player' ? GamePhase.PLAYER_MAIN : GamePhase.ENEMY_TURN,
                [who]: {
                    ...active,
                    mana: newMana,
                    deck: newDeck,
                    hand: newHand,
                    board: newBoard,
                    graveyard: newGraveyard
                },
                [who === 'player' ? 'enemy' : 'player']: {
                    ...opponent,
                    board: opponentBoard
                }
            };

            if (who === 'player') {
                newState.turn = prev.phase === GamePhase.INIT ? 1 : prev.turn + 1;
                spawnFloatingText(`TURN ${newState.turn}`, window.innerWidth / 2, window.innerHeight / 2, 'text-yellow-400');
                soundManager.play('turn_start');
            }

            return newState;
        });
    };

    // --- Drag Logic ---

    const handleMouseDown = (e: React.MouseEvent, card: Card, source: 'hand' | 'board', slotIndex?: number) => {
        if (e.button === 2) return;
        try {
            if (gameState.phase !== GamePhase.PLAYER_MAIN) return;
            if (source === 'board' && slotIndex === 0) return;

            if (source === 'hand') {
                if (card.cost > gameState.player.mana) {
                    gsap.to(`.card-hand-${card.id}`, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
                    soundManager.play('click');
                    return;
                }
            }

            if (source === 'board') {
                if (card.isExhausted || !card.canAttack || (card.attack === 0)) {
                    gsap.to(`#slot-player-${slotIndex}`, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
                    spawnFloatingText(card.attack === 0 ? "Defender" : "Zzz...", e.clientX, e.clientY, "text-gray-400");
                    soundManager.play('click');
                    return;
                }
            }

            setDragState({
                card,
                source,
                slotIndex,
                x: e.clientX,
                y: e.clientY,
            });
            soundManager.play('hover');
        } catch (err) {
            console.error("Interaction Error:", err);
            setDragState({ card: null, source: 'hand', x: 0, y: 0 });
        }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (dragState.card) {
            setDragState(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
        }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
        if (!dragState.card) return;

        const card = dragState.card;
        const source = dragState.source;

        try {
            let targetSlotIndex = -1;
            let targetOwner: 'player' | 'enemy' | null = null;

            for (let i = 0; i < MAX_BOARD_SLOTS; i++) {
                const el = document.getElementById(`slot-player-${i}`);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        targetSlotIndex = i;
                        targetOwner = 'player';
                        break;
                    }
                }
            }

            if (targetOwner === null) {
                for (let i = 0; i < MAX_BOARD_SLOTS; i++) {
                    const el = document.getElementById(`slot-enemy-${i}`);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                            targetSlotIndex = i;
                            targetOwner = 'enemy';
                            break;
                        }
                    }
                }
            }

            if (source === 'hand') {
                const isUnitType = card.type === CardType.UNIT || card.type === CardType.SUMMONER || card.type === CardType.TOKEN || card.type === CardType.MAGE;

                if (isUnitType && targetOwner === 'player' && targetSlotIndex !== -1) {
                    handleSummonUnit('player', card, targetSlotIndex);
                } else if (!isUnitType && targetOwner === 'enemy') {
                    handleCastSpell('player', card, targetSlotIndex);
                } else if (card.type === CardType.DEFENSE || card.type === CardType.SPELL_HEAL) {
                    handleCastSpell('player', card);
                }
            } else if (source === 'board') {
                if (targetOwner === 'enemy' && targetSlotIndex !== -1) {
                    handleUnitCombat('player', dragState.slotIndex!, targetSlotIndex);
                }
            }
        } catch (error) {
            console.error("Drop Error:", error);
        } finally {
            setDragState({ card: null, source: 'hand', x: 0, y: 0 });
        }
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [dragState.card]);


    // --- Action Handlers ---

    const handleSummonUnit = (who: 'player' | 'enemy', card: Card, slotIndex: number) => {
        const state = who === 'player' ? gameState.player : gameState.enemy;
        const opponentState = who === 'player' ? gameState.enemy : gameState.player;

        let newGraveyard = [...state.graveyard];
        let newBoard = [...state.board];
        let newOpponentBoard = [...opponentState.board];

        if (slotIndex === 6 && card.type === CardType.MAGE && state.board[6]?.type === CardType.MAGE) {
            if (newBoard[6]) newGraveyard.push(newBoard[6]!);
            newBoard[6] = null;
            if (who === 'player') spawnFloatingText("Mage Swapped!", window.innerWidth / 2, window.innerHeight / 2, "text-fuchsia-400");
        }
        if (slotIndex === 5 && card.type === CardType.MAGE && state.board[5]?.type === CardType.MAGE) {
            if (newBoard[5]) newGraveyard.push(newBoard[5]!);
            newBoard[5] = null;
            if (who === 'player') spawnFloatingText("Mage Swapped!", window.innerWidth / 2, window.innerHeight / 2, "text-fuchsia-400");
        }

        if (newBoard[slotIndex] !== null) {
            if (who === 'player') spawnFloatingText("Occupied!", window.innerWidth / 2, window.innerHeight / 2 + 50, "text-red-500");
            return;
        }

        if (slotIndex === 0) return;

        if (card.type === CardType.MAGE) {
            if (slotIndex !== 5 && slotIndex !== 6) {
                if (who === 'player') spawnFloatingText("Mages: Slot 5 or 6", window.innerWidth / 2, window.innerHeight / 2 + 50, "text-red-500");
                return;
            }
        }

        if ((slotIndex === 5 || slotIndex === 6) && card.type !== CardType.MAGE) {
            if (who === 'player') spawnFloatingText("Only Mages here!", window.innerWidth / 2, window.innerHeight / 2 + 50, "text-purple-500");
            return;
        }

        soundManager.play('play_unit');

        const newMana = state.mana - card.cost;
        const newHand = state.hand.filter(c => c.id !== card.id);

        let finalCard = { ...card, isExhausted: true, health: card.maxHealth };

        if (SLOT_CONFIG[slotIndex] === SlotType.TANK && (card.type === CardType.UNIT || card.type === CardType.SUMMONER || card.type === CardType.TOKEN)) {
            const bonusHp = finalCard.attack || 0;
            if (bonusHp > 0) {
                finalCard.health = (finalCard.health || 0) + bonusHp;
                finalCard.maxHealth = finalCard.health;
                finalCard.attack = 0;
                if (who === 'player') spawnFloatingText("TANK UP! (Atk->HP)", window.innerWidth / 2, window.innerHeight / 2, "text-blue-400");
            }
        }

        // 🛡️ DARK TANKER: +3 HP if in Tank Slot
        if (card.name === 'Dark Tanker' && (slotIndex === 1 || slotIndex === 2)) {
            finalCard.health = (finalCard.health || 0) + 3;
            finalCard.maxHealth = (finalCard.maxHealth || 0) + 3;
            if (who === 'player') spawnFloatingText("+3 HP (Tank Bonus)", window.innerWidth / 2, window.innerHeight / 2, "text-green-400");
        }

        newBoard[slotIndex] = finalCard;

        if (card.type === CardType.SUMMONER) {
            const token = createTokenCard();
            if (newHand.length < MAX_HAND_SIZE) {
                newHand.push(token);
                if (who === 'player') spawnFloatingText("+ Spirit Wolf", window.innerWidth / 2, window.innerHeight / 2, "text-cyan-400");
            }
        }

        // ❄️ ICE VANGUARD: Add Ice Spear to Hand
        if (card.name === 'Ice Vanguard') {
            // Find Ice Spear template (it's the one with name 'Ice Spear')
            // We need to import CARD_TEMPLATES or find it dynamically.
            // Since we can't easily import inside the function, we'll assume it's available or create it.
            // Ideally we should use CARD_TEMPLATES from constants.
            // Let's assume we can access it or recreate it for now to avoid import issues if not imported.
            // Actually, CARD_TEMPLATES is not imported in GameBoard.tsx? Let's check imports.
            // It IS imported! (See Step 125, line 5: import { ... generateDeck ... } from '../constants';)
            // Wait, CARD_TEMPLATES is NOT in the import list in Step 125.
            // I should check if I can import it.

            // For now, I'll manually define the Ice Spear here to be safe and fast.
            const iceSpear: Card = {
                id: `generated_ice_spear_${Date.now()}`,
                name: 'Ice Spear',
                cost: 0,
                value: 2,
                type: CardType.SPELL_DAMAGE,
                description: '❄️ Deal 2 damage to an enemy.',
                image: '/assets/cards/ice_spear.png'
            };

            if (newHand.length < MAX_HAND_SIZE) {
                newHand.push(iceSpear);
                if (who === 'player') spawnFloatingText("+ Ice Spear", window.innerWidth / 2, window.innerHeight / 2, "text-cyan-400");
                soundManager.play('draw');
            } else {
                if (who === 'player') spawnFloatingText("Hand Full!", window.innerWidth / 2, window.innerHeight / 2, "text-red-400");
            }
        }


        setGameState(prev => ({
            ...prev,
            [who]: { ...state, mana: newMana, hand: newHand, board: newBoard, graveyard: newGraveyard },
            [who === 'player' ? 'enemy' : 'player']: { ...opponentState, board: newOpponentBoard }
        }));
    };

    const handleCastSpell = (who: 'player' | 'enemy', card: Card, targetUnitIndex?: number) => {
        const casterState = who === 'player' ? gameState.player : gameState.enemy;
        const opponentState = who === 'player' ? gameState.enemy : gameState.player;

        soundManager.play('play_spell');

        const newMana = casterState.mana - card.cost;
        const newHand = casterState.hand.filter(c => c.id !== card.id);
        const newGraveyard = [...casterState.graveyard, card];

        let newOpponentBoard = [...opponentState.board];
        let newCasterShield = casterState.shield;
        let newCasterBoard = [...casterState.board];

        // VFX HANDLER
        const triggerSpellVFX = async (targetId: string, type: 'FIREBALL' | 'HEAL' | 'SHIELD') => {
            if (vfxRef.current) {
                // Get hand card position (approximate if dragging, or center if AI)
                const startRect = who === 'player'
                    ? document.querySelector(`.card-hand-${card.id}`)?.getBoundingClientRect() || new DOMRect(window.innerWidth / 2, window.innerHeight, 10, 10)
                    : new DOMRect(window.innerWidth / 2, 0, 10, 10);

                const targetEl = document.getElementById(targetId);
                const endRect = targetEl?.getBoundingClientRect() || new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 10, 10);

                await vfxRef.current.playEffect(type, startRect, endRect);
            }
        };

        if (card.type === CardType.ATTACK || card.type === CardType.SPELL_DAMAGE) {
            const actualTargetIndex = targetUnitIndex !== undefined ? targetUnitIndex : 0;
            const targetId = `slot-${who === 'player' ? 'enemy' : 'player'}-${actualTargetIndex}`;

            // Fire VFX
            triggerSpellVFX(targetId, 'FIREBALL');

            // Logic delay for impact
            setTimeout(() => {
                const damage = card.value;
                soundManager.play('damage_spell');

                if (newOpponentBoard[actualTargetIndex]) {
                    const unit = { ...newOpponentBoard[actualTargetIndex]! };

                    if (unit.type === CardType.LEADER && opponentState.shield > 0) {
                        const absorbed = Math.min(opponentState.shield, damage);
                        const remainder = damage - absorbed;
                        opponentState.shield -= absorbed;
                        unit.health = (unit.health || 30) - remainder;
                        spawnFloatingText(`Blocked ${absorbed}!`, window.innerWidth / 2, window.innerHeight / 2, 'text-blue-300');
                    } else {
                        unit.health! -= damage;
                    }

                    const slotEl = document.getElementById(targetId);
                    const rect = slotEl?.getBoundingClientRect();
                    spawnFloatingText(`-${damage}`, rect ? rect.left + rect.width / 2 : window.innerWidth / 2, rect ? rect.top : window.innerHeight / 2, 'text-red-500');

                    if (unit.health! <= 0) {
                        newOpponentBoard[actualTargetIndex] = null;
                        setTimeout(() => soundManager.play('death'), 350);
                    } else {
                        newOpponentBoard[actualTargetIndex] = unit;
                    }
                }

                // Commit State Change
                setGameState(prev => ({
                    ...prev,
                    [who]: { ...casterState, shield: newCasterShield, mana: newMana, hand: newHand, graveyard: newGraveyard, board: newCasterBoard },
                    [who === 'player' ? 'enemy' : 'player']: { ...opponentState, board: newOpponentBoard, shield: opponentState.shield }
                }));

            }, 1000); // Wait for flight time
            return; // Exit early as state is set in timeout

        } else if (card.type === CardType.SPELL_HEAL) {
            const targetId = `slot-${who}-0`;
            triggerSpellVFX(targetId, 'HEAL');

            setTimeout(() => {
                const leader = newCasterBoard[0];
                if (leader) {
                    const newLeader = { ...leader };
                    newLeader.health = Math.min((newLeader.health || 30) + card.value, newLeader.maxHealth || 30);
                    newCasterBoard[0] = newLeader;
                }
                spawnFloatingText(`+${card.value}`, window.innerWidth / 2, window.innerHeight / 2, 'text-green-400');
                soundManager.play('heal');

                setGameState(prev => ({
                    ...prev,
                    [who]: { ...casterState, shield: newCasterShield, mana: newMana, hand: newHand, graveyard: newGraveyard, board: newCasterBoard },
                    [who === 'player' ? 'enemy' : 'player']: { ...opponentState, board: newOpponentBoard, shield: opponentState.shield }
                }));
            }, 800);
            return;

        } else if (card.type === CardType.DEFENSE) {
            const targetId = `slot-${who}-0`;
            triggerSpellVFX(targetId, 'SHIELD');

            setTimeout(() => {
                newCasterShield = casterState.shield + card.value;
                spawnFloatingText(`+${card.value} Shield`, window.innerWidth / 2, window.innerHeight / 2, 'text-blue-400');
                soundManager.play('shield');

                setGameState(prev => ({
                    ...prev,
                    [who]: { ...casterState, shield: newCasterShield, mana: newMana, hand: newHand, graveyard: newGraveyard, board: newCasterBoard },
                    [who === 'player' ? 'enemy' : 'player']: { ...opponentState, board: newOpponentBoard, shield: opponentState.shield }
                }));
            }, 800);
            return;
        }
    };

    const handleUnitCombat = (attackerOwner: 'player', attackerIndex: number, defenderIndex: number) => {
        const attacker = gameState.player.board[attackerIndex];
        const defender = gameState.enemy.board[defenderIndex];
        const enemyBoard = gameState.enemy.board;

        if (!attacker || !defender) return;

        const hasTank = (enemyBoard[1] && (enemyBoard[1].health || 0) > 0) || (enemyBoard[2] && (enemyBoard[2].health || 0) > 0);
        const hasUnit = (enemyBoard[3] && (enemyBoard[3].health || 0) > 0) || (enemyBoard[4] && (enemyBoard[4].health || 0) > 0) || (enemyBoard[7] && (enemyBoard[7].health || 0) > 0);

        let isValidTarget = true;

        if (hasTank) {
            // If Tanks exist, MUST attack Tank (1 or 2)
            if (defenderIndex !== 1 && defenderIndex !== 2) isValidTarget = false;
        } else if (hasUnit) {
            // If No Tanks but Units exist, MUST attack Unit (3, 4, or 7)
            if (defenderIndex !== 3 && defenderIndex !== 4 && defenderIndex !== 7) isValidTarget = false;
        } else {
            // If No Tanks and No Units, can attack Backline (0, 5, 6)
            // Implicitly allowed
        }

        if (!isValidTarget) {
            spawnFloatingText("Blocked by Frontline!", window.innerWidth / 2, window.innerHeight / 2, "text-orange-500");
            shakeScreen();
            return;
        }

        soundManager.play('attack_lunge');

        const attSlot = document.getElementById(`slot-player-${attackerIndex}`);
        const defSlot = document.getElementById(`slot-enemy-${defenderIndex}`);

        let rectA: DOMRect | null = null;
        let rectD: DOMRect | null = null;

        if (attSlot && defSlot) {
            rectA = attSlot.getBoundingClientRect();
            rectD = defSlot.getBoundingClientRect();
            const dx = rectD.left - rectA.left;
            const dy = rectD.top - rectA.top;

            gsap.timeline()
                .to(attSlot.firstChild, { x: dx / 2, y: dy / 2, duration: 0.15, ease: 'power1.in' })
                .to(attSlot.firstChild, { x: 0, y: 0, duration: 0.2, ease: 'elastic.out(1, 0.3)' });

            setTimeout(() => {
                soundManager.play('damage_physical');
                spawnFloatingText(`-${attacker.attack}`, rectD!.left + rectD!.width / 2, rectD!.top, 'text-red-500');
                if (defender.attack && defender.attack > 0) {
                    spawnFloatingText(`-${defender.attack}`, rectA!.left + rectA!.width / 2, rectA!.top, 'text-red-500');
                }
            }, 150);
        }

        const dmgToDefender = attacker.attack || 0;
        let dmgToAttacker = defender.attack || 0;

        const newPlayerBoard = [...gameState.player.board];
        const newEnemyBoard = [...gameState.enemy.board];

        const pUnit = { ...newPlayerBoard[attackerIndex]! };
        const eUnit = { ...newEnemyBoard[defenderIndex]! };

        // Debug logging
        console.log('Combat - Player Unit:', pUnit.name, 'Ability:', pUnit.unitAbility, 'HasUsed:', pUnit.hasUsedAbility, 'FirstHit:', pUnit.firstHitTaken);



        // Apply damage to defender
        if (eUnit.type === CardType.LEADER && gameState.enemy.shield > 0) {
            const absorbed = Math.min(gameState.enemy.shield, dmgToDefender);
            const rem = dmgToDefender - absorbed;
            gameState.enemy.shield -= absorbed;
            eUnit.health! -= rem;
        } else {
            eUnit.health! -= dmgToDefender;
        }

        // ⚡ SPECIAL ABILITY: Dark Tanker - First damage converts to healing
        if (pUnit.unitAbility === UnitAbility.DAMAGE_TO_HEAL && !pUnit.firstHitTaken && dmgToAttacker > 0) {
            console.log('⚡ Dark Tanker ability triggered! Damage:', dmgToAttacker);
            pUnit.firstHitTaken = true;
            // Convert damage to healing
            const healAmount = dmgToAttacker;
            pUnit.health = Math.min((pUnit.health || 0) + healAmount, pUnit.maxHealth || 0);
            if (rectA) {
                spawnFloatingText(`⚡ +${healAmount} HP!`, rectA.left + rectA.width / 2, rectA.top - 20, 'text-green-400');
            }
            soundManager.play('heal');
            dmgToAttacker = 0; // No damage taken
        } else {
            // Normal damage to attacker
            if (pUnit.type === CardType.LEADER && gameState.player.shield > 0) {
                const absorbed = Math.min(gameState.player.shield, dmgToAttacker);
                const rem = dmgToAttacker - absorbed;
                gameState.player.shield -= absorbed;
                pUnit.health! -= rem;
            } else {
                pUnit.health! -= dmgToAttacker;
            }
        }

        pUnit.isExhausted = true;

        if (pUnit.health! <= 0) {
            newPlayerBoard[attackerIndex] = null;
            setTimeout(() => soundManager.play('death'), 250);
        } else {
            newPlayerBoard[attackerIndex] = pUnit;
        }

        if (eUnit.health! <= 0) {
            newEnemyBoard[defenderIndex] = null;
            setTimeout(() => soundManager.play('death'), 250);
        } else {
            newEnemyBoard[defenderIndex] = eUnit;
        }

        setGameState(prev => ({
            ...prev,
            player: { ...prev.player, board: newPlayerBoard, shield: gameState.player.shield },
            enemy: { ...prev.enemy, board: newEnemyBoard, shield: gameState.enemy.shield }
        }));
    };

    // --- AI Logic ---
    useEffect(() => {
        if (gameState.phase === GamePhase.ENEMY_TURN && !gameState.winner) {
            const runAI = async () => {
                try {
                    await new Promise(r => setTimeout(r, 800));

                    let enemyBoard = [...gameState.enemy.board];
                    let playerBoard = [...gameState.player.board];

                    for (let i = 0; i < MAX_BOARD_SLOTS; i++) {
                        const unit = enemyBoard[i];
                        if (!unit || (unit.health || 0) <= 0 || unit.isExhausted || unit.type === CardType.LEADER || unit.attack === 0) continue;

                        const hasPTank = playerBoard[1] || playerBoard[2];
                        const hasPUnit = playerBoard[3] || playerBoard[4] || playerBoard[7];

                        let targetIndices: number[] = [];
                        if (hasPTank) targetIndices = [1, 2].filter(idx => playerBoard[idx]);
                        else if (hasPUnit) targetIndices = [3, 4, 7].filter(idx => playerBoard[idx]);
                        else targetIndices = [0, 5, 6].filter(idx => playerBoard[idx]);

                        if (targetIndices.length > 0) {
                            const targetIdx = targetIndices[Math.floor(Math.random() * targetIndices.length)];
                            const pUnit = playerBoard[targetIdx]!;

                            soundManager.play('attack_lunge');
                            const eSlotEl = document.getElementById(`slot-enemy-${i}`);
                            const pSlotEl = document.getElementById(`slot-player-${targetIdx}`);

                            if (eSlotEl && pSlotEl) {
                                const rectE = eSlotEl.getBoundingClientRect();
                                const rectP = pSlotEl.getBoundingClientRect();
                                const dx = rectP.left - rectE.left;
                                const dy = rectP.top - rectE.top;

                                gsap.timeline()
                                    .to(eSlotEl.firstChild, { x: dx / 2, y: dy / 2, duration: 0.15 })
                                    .to(eSlotEl.firstChild, { x: 0, y: 0, duration: 0.2 });
                            }

                            pUnit.health! -= unit.attack!;
                            if (pUnit.attack && pUnit.attack > 0) {
                                unit.health! -= pUnit.attack!;
                            }

                            setTimeout(() => soundManager.play('damage_physical'), 150);

                            if (pSlotEl) {
                                const rect = pSlotEl.getBoundingClientRect();
                                spawnFloatingText(`-${unit.attack}`, rect.left + rect.width / 2, rect.top, 'text-red-500');
                            }

                            if (pUnit.health! <= 0) {
                                playerBoard[targetIdx] = null;
                                setTimeout(() => soundManager.play('death'), 250);
                            }
                            if (unit.health! <= 0) {
                                enemyBoard[i] = null;
                                setTimeout(() => soundManager.play('death'), 250);
                            }

                            await new Promise(r => setTimeout(r, 600));
                        }
                    }

                    setGameState(prev => ({ ...prev, player: { ...prev.player, board: playerBoard }, enemy: { ...prev.enemy, board: enemyBoard } }));

                    const move = await getEnemyMove(gameState);
                    if (move.action === 'PLAY_CARD' && move.cardId) {
                        const card = gameState.enemy.hand.find(c => c.id === move.cardId);
                        if (card) {
                            setShowcaseCard(card);
                            soundManager.play('draw');
                            await new Promise(r => setTimeout(r, 1000));
                            setShowcaseCard(null);

                            if ((card.type === CardType.UNIT || card.type === CardType.SUMMONER || card.type === CardType.MAGE) && move.slotIndex !== undefined) {
                                handleSummonUnit('enemy', card, move.slotIndex);
                            } else {
                                handleCastSpell('enemy', card, 0);
                            }
                        }
                    }
                } catch (error) {
                    console.error("AI Turn Error:", error);
                } finally {
                    await new Promise(r => setTimeout(r, 1000));
                    startTurn('player');
                }
            };
            runAI();
        }
    }, [gameState.phase]);

    // Check Win/Lose Condition
    useEffect(() => {
        const playerLeader = gameState.player.board[0];
        const enemyLeader = gameState.enemy.board[0];

        // Only set Game Over if we aren't already there
        if (gameState.phase !== GamePhase.GAME_OVER && gameState.phase !== GamePhase.INIT) {
            if (!playerLeader || (playerLeader.health || 0) <= 0) {
                setGameState(p => ({ ...p, phase: GamePhase.GAME_OVER, winner: 'ENEMY' }));
                soundManager.play('defeat');
            } else if (!enemyLeader || (enemyLeader.health || 0) <= 0) {
                setGameState(p => ({ ...p, phase: GamePhase.GAME_OVER, winner: 'PLAYER' }));
                soundManager.play('victory');
            }
        }
    }, [gameState.player.board, gameState.enemy.board, gameState.phase]);

    const renderSlot = (owner: 'player' | 'enemy', index: number) => {
        const state = owner === 'player' ? gameState.player : gameState.enemy;
        const card = state.board[index];

        const isSourceSlot = owner === 'player' && dragState.source === 'board' && dragState.slotIndex === index;
        const highlightClass = isSourceSlot ? 'ring-2 ring-yellow-400 scale-105 z-20 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : '';

        const isTargetSlot = owner === 'player' && dragState.source === 'hand' && dragState.card;

        let isValidDrop = false;
        if (isTargetSlot && dragState.card) {
            if (dragState.card.type === CardType.MAGE) {
                // Mages can only go in slots 5 or 6
                isValidDrop = (index === 5 || index === 6);
            } else if (dragState.card.type === CardType.UNIT || dragState.card.type === CardType.SUMMONER || dragState.card.type === CardType.TOKEN) {
                // Units can go in tank slots (1, 2) or unit slots (3, 4, 7)
                isValidDrop = (index === 1 || index === 2 || index === 3 || index === 4 || index === 7);
            }
        }

        const occupiedByMage = card?.type === CardType.MAGE;
        const draggingMage = dragState.card?.type === CardType.MAGE;
        const isMageSwap = (index === 5 || index === 6) && occupiedByMage && draggingMage;

        if (card && !isMageSwap) isValidDrop = false;

        const dropHighlight = (isValidDrop) ? 'border-yellow-500 bg-yellow-900/40 shadow-[inset_0_0_20px_rgba(250,204,21,0.3)] animate-pulse' : 'border-slate-700 bg-slate-900/60';
        const isAttackTarget = owner === 'enemy' && dragState.source === 'board' && card;
        const attackHighlight = isAttackTarget ? 'ring-2 ring-red-500 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : '';

        let label = "INFANTRY";
        if (index === 0) label = "COMMAND";
        else if (index === 1 || index === 2) label = "VANGUARD";
        else if (index === 5 || index === 6) label = "MAGE";

        return (
            <div
                key={`${owner}-${index}`}
                id={`slot-${owner}-${index}`}
                className={`
                relative rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-300
                ${dropHighlight} ${highlightClass} ${attackHighlight}
                w-full h-full aspect-[3/4] overflow-hidden group
            `}
            >
                {card ? (
                    <div
                        className="w-full h-full"
                        onMouseDown={(e) => {
                            if (owner === 'player') handleMouseDown(e, card, 'board', index);
                        }}
                    >
                        <CardComponent
                            key={card.id}
                            card={card}
                            index={index}
                            isEnemy={owner === 'enemy'}
                            isOnBoard={true}
                            isRevealed={true}
                            onContextMenu={(e, c) => setDetailCard(c)}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
                        <span className="text-[10px] font-bold tracking-widest text-slate-300 text-center">{label}</span>
                        {isValidDrop && <span className="text-yellow-400 text-[10px] animate-bounce font-bold mt-1">PLACE</span>}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div ref={appRef} className="h-screen w-full bg-slate-950 flex flex-col font-sans select-none cursor-default overflow-hidden">

            {/* VFX LAYER */}
            <VFXLayer ref={vfxRef} />

            {/* --- START SCREEN (AUDIO PERMISSION) --- */}
            {showStartScreen && (
                <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
                    <h1 className="text-6xl md:text-8xl font-black fantasy-font text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-600 mb-8 drop-shadow-lg">AETHER DUEL</h1>
                    <button
                        onClick={handleStartGame}
                        className="px-10 py-5 bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-2xl rounded shadow-[0_0_30px_rgba(202,138,4,0.6)] transition-all transform hover:scale-105"
                    >
                        ENTER THE ARENA
                    </button>
                    <p className="mt-4 text-slate-500 text-sm">Click to enable audio & animations</p>
                </div>
            )}

            {/* --- BACKGROUND --- */}
            <div className="game-bg fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none opacity-0"></div>

            {floatingTexts.map(ft => <DamageNumber key={ft.id} value={ft.val} x={ft.x} y={ft.y} color={ft.color} />)}

            {/* --- SHOWCASE CARD ANIMATION --- */}
            {showcaseCard && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="scale-150 animate-in zoom-in duration-300 shadow-[0_0_100px_rgba(255,0,0,0.3)] rounded-xl">
                        <CardComponent card={showcaseCard} index={0} isRevealed={true} isEnemy={false} disabled={true} />
                    </div>
                </div>
            )}

            {/* --- TOP: ENEMY HUD (FIXED) --- */}
            <div className="hud-element opacity-0 flex-none h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 z-20 shadow-lg relative">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-900 border border-red-500 flex items-center justify-center text-red-100 font-bold text-xs shadow">AI</div>
                        <div className="text-red-200 font-bold text-sm tracking-widest">ENEMY</div>
                        {/* Difficulty Badge */}
                        <div className={`
                            px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border
                            ${difficulty === DifficultyLevel.EASY ? 'bg-green-900/40 border-green-500 text-green-400' : ''}
                            ${difficulty === DifficultyLevel.NORMAL ? 'bg-blue-900/40 border-blue-500 text-blue-400' : ''}
                            ${difficulty === DifficultyLevel.HARD ? 'bg-orange-900/40 border-orange-500 text-orange-400' : ''}
                            ${difficulty === DifficultyLevel.HARDCORE ? 'bg-red-900/40 border-red-500 text-red-400 animate-pulse' : ''}
                        `}>
                            {difficulty === DifficultyLevel.HARDCORE ? '💀 ' : ''}{difficulty}
                        </div>
                    </div>
                    {gameState.enemy.shield > 0 && <div className="text-blue-400 font-bold text-xs animate-pulse">🛡 {gameState.enemy.shield}</div>}
                    <div className="w-24">
                        <StatBar value={gameState.enemy.mana} max={gameState.enemy.maxMana} color="bg-indigo-600" label="MANA" icon="⚡" size="sm" />
                    </div>
                </div>

                {/* BGM Volume Control */}
                <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded border border-slate-800">
                    <span className="text-xs text-slate-400 font-bold">BGM</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        defaultValue="0.2"
                        className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        onChange={(e) => soundManager.setBGMVolume(parseFloat(e.target.value))}
                    />
                </div>

                <div className="flex gap-1 h-full items-center py-2">
                    {gameState.enemy.hand.map((c, i) => (
                        <div
                            key={i}
                            className="w-8 h-10 bg-gradient-to-b from-red-900 to-red-950 border border-red-700 rounded shadow-md cursor-pointer hover:scale-110 transition-transform"
                        ></div>
                    ))}
                </div>
            </div>

            {/* --- CENTER: SCROLLABLE BATTLEFIELD --- */}
            <div className="hud-element opacity-0 flex-1 w-full overflow-y-auto custom-scrollbar relative z-10">

                {/* GAME MAT BACKGROUND */}
                <div className="min-h-[500px] scale-75 md:min-h-[600px] w-full max-w-6xl mx-auto flex flex-col py-2 md:py-4 relative">
                    <div className="absolute inset-x-0 top-0 bottom-0 bg-slate-900/60 border-x border-slate-800 backdrop-blur-md -z-10 shadow-2xl rounded-xl"></div>

                    {/* --- ENEMY ZONE (Top) --- */}
                    <div className="flex-1 flex flex-col justify-start pt-2 md:pt-4 relative border-b border-slate-800/50">

                        {/* Back Line: Mage - Leader - Mage */}
                        <div className="flex justify-center gap-4 md:gap-8 items-start mb-3 md:mb-6">
                            <div className="w-16 h-24 md:w-24 md:h-32 transform hover:scale-105 transition-transform">{renderSlot('enemy', 5)}</div>
                            <div className="w-20 h-28 md:w-28 md:h-36 transform scale-110 shadow-2xl z-10 border-red-900/50 border-2 rounded-lg">{renderSlot('enemy', 0)}</div>
                            <div className="w-16 h-24 md:w-24 md:h-32 transform hover:scale-105 transition-transform">{renderSlot('enemy', 6)}</div>
                        </div>

                        {/* Front Line: Unit - Tank - Tank - Unit - Unit (ALL SAME ROW) */}
                        <div className="flex justify-center gap-2 md:gap-3 items-center">
                            <div className="w-14 h-20 md:w-20 md:h-28">{renderSlot('enemy', 3)}</div> {/* Unit */}
                            <div className="w-14 h-20 md:w-20 md:h-28">{renderSlot('enemy', 1)}</div> {/* Tank */}
                            <div className="w-14 h-20 md:w-20 md:h-28">{renderSlot('enemy', 2)}</div> {/* Tank */}
                            <div className="w-14 h-20 md:w-20 md:h-28">{renderSlot('enemy', 4)}</div> {/* Unit */}
                            <div className="w-14 h-20 md:w-20 md:h-28">{renderSlot('enemy', 7)}</div> {/* Unit */}
                        </div>
                    </div>

                    {/* --- BATTLE LINE (Divider) --- */}
                    <div className="h-8 md:h-16 w-full relative flex items-center justify-center my-1 md:my-2 pointer-events-none">
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-500/30 to-transparent"></div>
                    </div>

                    {/* --- PLAYER ZONE (Bottom) --- */}
                    <div className="flex-1 flex flex-col justify-end pb-2 md:pb-4 relative">

                        {/* Front Line: Unit - Tank - Tank - Unit - Unit (ALL SAME ROW) */}
                        <div className="flex justify-center gap-2 md:gap-3 items-center mb-3 md:mb-6">
                            <div className="w-14 h-20 md:w-20 md:h-28">{renderSlot('player', 3)}</div> {/* Unit */}
                            <div className="w-14 h-20 md:w-20 md:h-28">{renderSlot('player', 1)}</div> {/* Tank */}
                            <div className="w-14 h-20 md:w-20 md:h-28">{renderSlot('player', 2)}</div> {/* Tank */}
                            <div className="w-14 h-20 md:w-20 md:h-28">{renderSlot('player', 4)}</div> {/* Unit */}
                            <div className="w-14 h-20 md:w-20 md:h-28">{renderSlot('player', 7)}</div> {/* Unit */}
                        </div>

                        {/* Back Line: Mage - Leader - Mage */}
                        <div className="flex justify-center gap-4 md:gap-8 items-end">
                            <div className="w-16 h-24 md:w-24 md:h-32 transform hover:scale-105 transition-transform">{renderSlot('player', 5)}</div>
                            <div className="w-20 h-28 md:w-28 md:h-36 transform scale-110 shadow-2xl z-10 border-blue-900/50 border-2 rounded-lg">{renderSlot('player', 0)}</div>
                            <div className="w-16 h-24 md:w-24 md:h-32 transform hover:scale-105 transition-transform">{renderSlot('player', 6)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BOTTOM: PLAYER HUD (FIXED) --- */}
            <div className="hud-element opacity-0 flex-none h-40 md:h-48 w-full bg-gradient-to-t from-black via-slate-950 to-slate-900/90 border-t border-slate-800 relative z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">

                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

                <div className="w-full h-full max-w-7xl mx-auto flex items-end justify-between px-2 md:px-6 pb-2 md:pb-6 relative">

                    {/* LEFT: Stats */}
                    <div className="w-32 md:w-64 bg-slate-900/80 p-2 md:p-3 rounded border border-slate-700 shadow-xl mb-2 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px] md:text-xs shadow-lg ring-2 ring-blue-400">P1</div>
                            <div className="text-blue-100 font-bold text-xs md:text-sm tracking-widest hidden md:block">COMMANDER</div>
                        </div>
                        <div className="space-y-1 md:space-y-2">
                            <StatBar value={gameState.player.board[0]?.health || 0} max={30} color="bg-emerald-500" label="HP" icon="♥" size="sm" />
                            <StatBar value={gameState.player.mana} max={gameState.player.maxMana} color="bg-indigo-500" label="MANA" icon="⚡" size="sm" />
                        </div>
                        {gameState.player.shield > 0 && <div className="text-center text-blue-300 text-[10px] font-bold mt-1 bg-blue-900/30 py-0.5 rounded border border-blue-500/30">SHIELD: {gameState.player.shield}</div>}
                    </div>

                    {/* CENTER: Hand */}
                    <div className="flex-1 h-full flex items-end justify-center pb-2 px-2 md:px-10 pointer-events-none">
                        <div className="flex items-end justify-center gap-[-10px] md:gap-[-20px] pointer-events-auto" style={{ perspective: '1000px' }}>
                            {gameState.player.hand.map((card, i) => (
                                <div
                                    key={card.id}
                                    className={`transition-all duration-300 card-hand-${card.id} transform hover:-translate-y-16 hover:scale-110 hover:z-50 origin-bottom cursor-pointer`}
                                    style={{
                                        marginLeft: i === 0 ? 0 : window.innerWidth < 768 ? -30 : -50,
                                        zIndex: i,
                                        transform: `rotate(${(i - gameState.player.hand.length / 2) * 3}deg) translateY(10px)`
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = `rotate(0deg) translateY(-60px) scale(1.1)`;
                                        e.currentTarget.style.zIndex = "100";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = `rotate(${(i - gameState.player.hand.length / 2) * 3}deg) translateY(10px)`;
                                        e.currentTarget.style.zIndex = `${i}`;
                                    }}
                                >
                                    <div className="scale-75 md:scale-100 origin-bottom">
                                        <CardComponent
                                            card={card}
                                            index={i}
                                            onMouseDown={(e, c) => handleMouseDown(e, c, 'hand')}
                                            onContextMenu={(e, c) => setDetailCard(c)}
                                            disabled={gameState.phase !== GamePhase.PLAYER_MAIN || card.cost > gameState.player.mana}
                                            isDragging={dragState.card?.id === card.id && dragState.source === 'hand'}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Controls */}
                    <div className="w-24 md:w-48 flex flex-col items-end gap-2 mb-2">
                        <button
                            onClick={() => startTurn('enemy')}
                            disabled={gameState.phase !== GamePhase.PLAYER_MAIN}
                            className="
                        w-full h-12 md:h-16 bg-gradient-to-br from-amber-500 to-yellow-600 
                        hover:from-amber-400 hover:to-yellow-500 
                        text-white font-black text-sm md:text-xl rounded shadow-lg border-b-4 border-yellow-800
                        active:border-b-0 active:translate-y-1 transition-all
                        disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed
                        flex items-center justify-center gap-2 uppercase tracking-widest
                    "
                        >
                            <span className="md:hidden">END</span>
                            <span className="hidden md:inline">End Turn</span>
                        </button>
                        <button onClick={onExit} className="text-slate-500 text-[10px] md:text-xs hover:text-slate-300 transition-colors">SURRENDER</button>
                    </div>

                </div>
            </div>

            {dragState.card && (
                <div
                    className="fixed z-[9999] pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                    style={{
                        left: dragState.x,
                        top: dragState.y,
                        width: '140px',
                        height: '200px',
                        transform: 'translate(-50%, -50%) rotate(5deg)',
                    }}
                >
                    <CardComponent card={dragState.card} index={0} isOnBoard={dragState.source === 'board'} />
                </div>
            )}

            {/* Detail View Overlay (High Graphics) */}
            {detailCard && (
                <div
                    className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300 cursor-pointer"
                    onClick={() => setDetailCard(null)}
                >
                    <div className="relative pointer-events-auto cursor-default animate-in zoom-in-50 duration-300" onClick={(e) => e.stopPropagation()}>
                        <CardComponent
                            card={detailCard}
                            index={0}
                            isRevealed={true}
                            isEnemy={false}
                            disabled={true}
                            disableInteractive={true}
                            isInspection={true} // Triggers High-Res Mode
                        />
                        <div className="absolute -bottom-16 w-full text-center text-slate-400 text-sm tracking-widest uppercase">
                            Click outside to close
                        </div>
                    </div>
                </div>
            )}

            {/* GAME OVER SCREEN */}
            {gameState.phase === GamePhase.GAME_OVER && (
                <div className="fixed inset-0 z-[20000] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-1000">
                    <h1 className={`text-8xl md:text-9xl font-black fantasy-font mb-8 drop-shadow-[0_0_50px_rgba(255,255,255,0.5)] tracking-widest ${gameState.winner === 'PLAYER' ? 'text-yellow-500' : 'text-red-600'}`}>
                        {gameState.winner === 'PLAYER' ? 'VICTORY' : 'DEFEAT'}
                    </h1>
                    <p className="text-2xl text-slate-400 mb-12 font-serif italic">
                        {gameState.winner === 'PLAYER' ? 'The enemy commander has fallen.' : 'Your stronghold lies in ruins.'}
                    </p>
                    <button
                        onClick={onExit}
                        className="px-8 py-4 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-white font-bold text-xl rounded shadow-lg transition-all hover:scale-105"
                    >
                        RETURN TO MENU
                    </button>
                </div>
            )}

        </div>
    );
}
