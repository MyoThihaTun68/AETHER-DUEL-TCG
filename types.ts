export enum CardType {
  ATTACK = 'ATTACK', // Instant damage spell
  SPELL_DAMAGE = 'SPELL_DAMAGE',
  SPELL_HEAL = 'SPELL_HEAL',
  SPELL_FREEZE = 'SPELL_FREEZE', // Ice Vanguard - Freeze enemy unit
  SPELL_VAMPIRIC = 'SPELL_VAMPIRIC', // Dark Tanker - Damage + Heal
  DEFENSE = 'DEFENSE',
  UNIT = 'UNIT', // Standard Minion
  SUMMONER = 'SUMMONER', // Summons token on play
  LEADER = 'LEADER', // The Player Hero Card
  TOKEN = 'TOKEN', // Generated unit
  MAGE = 'MAGE', // Ongoing effect unit (Slot 6)
}

export enum SlotType {
  LEADER = 'LEADER', // Slot 0
  TANK = 'TANK',     // Slots 1, 2
  UNIT = 'UNIT',     // Slots 3, 4, 5
  MAGE = 'MAGE',     // Slot 6
}

export enum MageEffect {
  DAMAGE_ENEMY_TANKS = 'DAMAGE_ENEMY_TANKS',
  HEAL_FRIENDLY_TANKS = 'HEAL_FRIENDLY_TANKS',
  HEAL_ALL_FRIENDLY = 'HEAL_ALL_FRIENDLY',
}



export enum UnitAbility {
  DAMAGE_TO_HEAL = 'DAMAGE_TO_HEAL', // First damage converts to healing (Dark Tanker)
  FREEZE_ON_HIT = 'FREEZE_ON_HIT',   // First attack freezes enemy (Ice Vanguard - Old)
  FREEZE_MAGE_ON_PLAY = 'FREEZE_MAGE_ON_PLAY', // Freeze enemy mage on summon (Ice Vanguard - New)
  AOE_FIRE_DAMAGE_TURN = 'AOE_FIRE_DAMAGE_TURN', // Deals 1 damage to all enemy units each turn (Fire Tanker Knight)
}

export interface Card {
  id: string;
  name: string;
  cost: number;
  value: number; // For spells: Damage/Heal. For Units: Initial Attack?
  attack?: number; // Unit Attack
  health?: number; // Unit Health
  maxHealth?: number;
  type: CardType;
  description: string;
  image: string;
  statusEffect?: 'BURN' | 'POISON' | 'FREEZE';
  canAttack?: boolean; // Runtime state
  isExhausted?: boolean; // Summoning sickness
  mageEffect?: MageEffect; // Specific passive for Mage cards
  unitAbility?: UnitAbility; // Special unit abilities
  firstHitTaken?: boolean; // Track if first hit has been taken (for DAMAGE_TO_HEAL)
  hasUsedAbility?: boolean; // Track if ability has been used (for FREEZE_ON_HIT)
}

export interface PlayerState {
  id: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  hand: Card[];
  board: (Card | null)[]; // 7 Slots
  deck: Card[];
  graveyard: Card[];
  shield: number;
  status: {
    burn: number;
    poison: number;
    freeze: number;
  };
}

export enum GamePhase {
  INIT = 'INIT',
  START_TURN = 'START_TURN',
  PLAYER_MAIN = 'PLAYER_MAIN',
  COMBAT_ANIMATION = 'COMBAT_ANIMATION',
  ENEMY_TURN = 'ENEMY_TURN',
  GAME_OVER = 'GAME_OVER',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  HARDCORE = 'HARDCORE',
}

export interface GameState {
  turn: number;
  phase: GamePhase;
  player: PlayerState;
  enemy: PlayerState;
  winner: string | null;
  difficulty: DifficultyLevel;
}