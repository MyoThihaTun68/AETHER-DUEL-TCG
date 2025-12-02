import { Card, CardType, SlotType, MageEffect, UnitAbility } from './types';

export const MAX_HAND_SIZE = 7;
export const INITIAL_HAND_SIZE = 3;
export const INITIAL_HP = 30;
export const INITIAL_MANA = 1;
export const MAX_MANA = 10;
export const MAX_BOARD_SLOTS = 8; // Updated to 8 slots
export const MIN_DECK_SIZE = 10;
export const MAX_DECK_SIZE = 20;

// Slot Configuration Map
// Layout: 1 Leader, 2 Tanks, 3 Units, 2 Mages
export const SLOT_CONFIG: Record<number, SlotType> = {
  0: SlotType.LEADER,
  1: SlotType.TANK,
  2: SlotType.TANK,
  3: SlotType.UNIT,
  4: SlotType.UNIT,
  5: SlotType.MAGE,
  6: SlotType.MAGE,
  7: SlotType.UNIT, // New 3rd unit slot

};

// --- IMAGE ASSETS ---
// To use local images:
// 1. Place your images in the 'public/images' folder.
// 2. Update the paths below to match your filenames (e.g., '/images/my-card.png').
const CARD_IMAGES = {
  STRIKE: '/images/strike.png',
  FIREBALL: '/images/fireball.png',
  HEAL: '/images/heal.png',
  SHIELD: '/images/shield.png',
  KNIGHT: '/images/knight.png',
  GOBLIN: '/images/goblin.png',
  GOLEM: '/images/golem.png',
  DRAGON: '/images/dragon.png',
  WIZARD: '/images/wizard.png',
  PYRO: '/images/pyro.png',
  CLERIC: '/images/cleric.png',
  LEADER: '/images/leader.png',
  WOLF: '/images/wolf.png',
  DARK_TANKER: '/images/darktanker.png',
  ICE_VANGUARD: '/images/ice_vanguard.png',
  ICE_SPEAR: '/images/ice_spear.png',
  FOOTMAN: '/images/recruit_footman.png',
  SKELETON: '/images/skeleton_warrior.png',
  FIRE_TANKER: '/images/fireTankerKnight.png',
};

// Define unique card types/templates available in the game
export const CARD_TEMPLATES: Card[] = [
  // --- UNITS ---
  {
    id: 't_u1',
    name: 'Iron Guard',
    cost: 2,
    value: 0,
    attack: 2,
    health: 4,
    maxHealth: 4,
    type: CardType.UNIT,
    description: 'Solid defense.',
    image: CARD_IMAGES.KNIGHT,
  },
  {
    id: 't_u2',
    name: 'Goblin Raider',
    cost: 1,
    value: 0,
    attack: 3,
    health: 1,
    maxHealth: 1,
    type: CardType.UNIT,
    description: 'High attack, low health.',
    image: CARD_IMAGES.GOBLIN,
  },
  {
    id: 't_u3',
    name: 'Stone Golem',
    cost: 4,
    value: 0,
    attack: 2,
    health: 6,
    maxHealth: 6,
    type: CardType.UNIT, // Ideally placed in Tank slot
    description: 'A heavy tank.',
    image: CARD_IMAGES.GOLEM,
  },
  {
    id: 't_u4',
    name: 'Drake',
    cost: 5,
    value: 0,
    attack: 5,
    health: 4,
    maxHealth: 4,
    type: CardType.UNIT,
    description: 'Fearsome attacker.',
    image: CARD_IMAGES.DRAGON,
  },
  {
    id: 't_u5',
    name: 'Spirit Caller',
    cost: 3,
    value: 0,
    attack: 2,
    health: 3,
    maxHealth: 3,
    type: CardType.SUMMONER,
    description: 'Summons a 0-cost Spirit Wolf to hand.',
    image: CARD_IMAGES.WIZARD,
  },
  {
    id: 't_u6',
    name: 'Recruit footman',
    cost: 1,
    value: 0,
    attack: 2,
    health: 2,
    maxHealth: 3,
    type: CardType.UNIT,
    description: 'Recruits a footman .',
    image: CARD_IMAGES.FOOTMAN,
  },
  {
    id: 't_u7',
    name: 'Skeleton Warrior',
    cost: 1,
    value: 0,
    attack: 2,
    health: 2,
    maxHealth: 3,
    type: CardType.UNIT,
    description: 'Skeleton Warrior.',
    image: CARD_IMAGES.SKELETON,
  },
  {
    id: 't_u_dark_tanker',
    name: 'Dark Tanker',
    cost: 4,
    value: 0,
    attack: 3,
    health: 3,
    maxHealth: 3,
    type: CardType.UNIT,
    description: '🛡️ Gains +3 Health if played in a Tank slot (Front Row).',
    image: CARD_IMAGES.DARK_TANKER,
  },
  {
    id: 't_u_ice_vanguard',
    name: 'Ice Vanguard',
    cost: 5,
    value: 0,
    attack: 2,
    health: 4,
    maxHealth: 4,
    type: CardType.UNIT,
    description: '❄️ On Play: Add a 0-cost Ice Spear to your hand Every Turn.',
    image: CARD_IMAGES.ICE_VANGUARD,
  },
  {
    id: 't_u_fire_tanker',
    name: 'Fire Tanker Knight',
    cost: 6,
    value: 0,
    attack: 2,
    health: 6,
    maxHealth: 6,
    type: CardType.UNIT,
    unitAbility: UnitAbility.AOE_FIRE_DAMAGE_TURN,
    description: '🔥 Deals 1 DMG to all enemy units each turn.',
    image: CARD_IMAGES.FIRE_TANKER,
  },
  {
    id: 't_s_ice_spear',
    name: 'Ice Spear',
    cost: 0,
    value: 1,
    type: CardType.SPELL_DAMAGE,
    description: '❄️ Deal 1 damage to an enemy.',
    image: '/images/ice_spear.png',
  },

  // --- SPECIAL ---
  {
    id: 't_token_wolf',
    name: 'Spirit Wolf',
    cost: 0,
    value: 0,
    attack: 2,
    health: 2,
    maxHealth: 2,
    type: CardType.TOKEN,
    description: 'Fast and free.',
    image: CARD_IMAGES.WOLF,
  },
  {
    id: 't_leader',
    name: 'Hero Commander',
    cost: 0,
    value: 0,
    attack: 0,
    health: 30,
    maxHealth: 30,
    type: CardType.LEADER,
    description: 'Your base. Protect it.',
    image: CARD_IMAGES.LEADER,
  },

  // --- MAGES ---
  {
    id: 't_mage_pyro',
    name: 'Pyromancer',
    cost: 4,
    value: 0,
    attack: 2,
    health: 3,
    maxHealth: 3,
    type: CardType.MAGE,
    mageEffect: MageEffect.DAMAGE_ENEMY_TANKS,
    description: 'Passive: Deals 2 DMG to Enemy Tanks each turn.',
    image: CARD_IMAGES.PYRO,
  },
  {
    id: 't_mage_cleric',
    name: 'Lifebinder',
    cost: 3,
    value: 0,
    attack: 1,
    health: 4,
    maxHealth: 4,
    type: CardType.MAGE,
    mageEffect: MageEffect.HEAL_ALL_FRIENDLY,
    description: 'Passive: Heals ALL Friendly Units 1 HP each turn.',
    image: CARD_IMAGES.CLERIC,
  },

  // --- SPELLS ---
  {
    id: 't_c1',
    name: 'Quick Strike',
    cost: 1,
    value: 3,
    type: CardType.ATTACK,
    description: 'Deal 3 damage.',
    image: CARD_IMAGES.STRIKE,
  },
  {
    id: 't_c2',
    name: 'Fireball',
    cost: 3,
    value: 3,
    type: CardType.SPELL_DAMAGE,
    description: 'Deal 3 damage.',
    image: CARD_IMAGES.FIREBALL,
  },
  {
    id: 't_c3',
    name: 'Holy Light',
    cost: 2,
    value: 2,
    type: CardType.SPELL_HEAL,
    description: 'Restore 2 Health to Hero.',
    image: CARD_IMAGES.HEAL,
  },
  {
    id: 't_c4',
    name: 'Iron Defense',
    cost: 3,
    value: 5,
    type: CardType.DEFENSE,
    description: 'Hero gains 5 Shield.',
    image: CARD_IMAGES.SHIELD,
  },
];

// Default deck if none provided
export const BASE_DECK: Card[] = [
  CARD_TEMPLATES[0], CARD_TEMPLATES[0], // 2 Guards
  CARD_TEMPLATES[1], CARD_TEMPLATES[1], // 2 Goblins
  CARD_TEMPLATES[4], // 1 Spirit Caller
  CARD_TEMPLATES[5], // 1 Dark Tanker (NEW!)
  CARD_TEMPLATES[6], // 1 Ice Vanguard (NEW!)
  CARD_TEMPLATES[9], CARD_TEMPLATES[9], // 2 Strikes
  CARD_TEMPLATES[10], // 1 Fireball
  CARD_TEMPLATES[11], // 1 Heal
  CARD_TEMPLATES[12], // 1 Shield
  CARD_TEMPLATES[2], // 1 Golem
  CARD_TEMPLATES[7], // 1 Pyromancer (Mage)
  CARD_TEMPLATES[8], // 1 Lifebinder (Mage)
];

export const generateDeck = (templates: Card[] = BASE_DECK): Card[] => {
  return templates.map(card => {
    // Safety fallback if a template is missing/undefined in the deck list
    if (!card) return null;
    return {
      ...card,
      id: Math.random().toString(36).substr(2, 9),
      isExhausted: true,
      canAttack: false,
    };
  }).filter(c => c !== null) as Card[];
};

export const createLeaderCard = (): Card => {
  return {
    ...CARD_TEMPLATES.find(c => c.type === CardType.LEADER)!,
    id: 'leader_' + Math.random().toString(36).substr(2, 5),
    isExhausted: true,
    canAttack: false,
  };
};

export const createTokenCard = (): Card => {
  return {
    ...CARD_TEMPLATES.find(c => c.id === 't_token_wolf')!,
    id: 'token_' + Math.random().toString(36).substr(2, 9),
    isExhausted: true,
    canAttack: false
  };
}