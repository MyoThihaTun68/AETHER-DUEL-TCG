# Game Updates - New Features

## 🎮 What's New

### 1. **Enhanced Slot System (8 Slots Total)**
The game board now features **8 slots** instead of 7:

**Slot Layout:**
- **Slot 0**: Leader (Command Center)
- **Slots 1-2**: Tanks (Vanguard - Front Line Defenders)
- **Slots 3-4-7**: Units (Infantry - 3 unit slots total!)
- **Slots 5-6**: Mages (Arcane Support)

**Visual Layout:**
```
Back Row:  [Mage 5] [Leader 0] [Mage 6]
Front Row: [Unit 3] [Tank 1] [Tank 2] [Unit 4] [Unit 7]
```

### 2. **Difficulty Selection System**
Choose your challenge level before battle!

#### 🟢 **Easy Mode**
- Enemy HP: 20 (vs your 30)
- Enemy Starting Mana: 0
- Enemy Shield: 0
- Perfect for learning the game mechanics

#### 🔵 **Normal Mode** (Default)
- Enemy HP: 30
- Enemy Starting Mana: 1
- Enemy Shield: 0
- Balanced and fair challenge

#### 🟠 **Hard Mode**
- Enemy HP: 40
- Enemy Starting Mana: 2
- Enemy Shield: 3
- Enemy has more resources from the start

#### 🔴 **Hardcore Mode** 💀
- Enemy HP: 50
- Enemy Starting Mana: 3
- Enemy Shield: 5
- **EXTREME CHALLENGE** - The enemy is ruthless!
- Pulsing red difficulty badge for intimidation

### 3. **Updated Combat Mechanics**
- All 3 unit slots (3, 4, 7) can now be used for placing units
- Combat targeting updated to include the 3rd unit slot
- AI properly targets all unit positions
- Frontline protection rules apply to all 3 unit slots

### 4. **Visual Improvements**
- Difficulty badge displayed in enemy HUD
- Color-coded difficulty indicators:
  - Green for Easy
  - Blue for Normal
  - Orange for Hard
  - Red (pulsing) for Hardcore with skull emoji 💀
- Adjusted card sizes on battlefield to accommodate 5 front-line units

## 🎯 How to Play

1. **Main Menu**: Select your difficulty level
2. **Deck Builder**: Build your deck (6-10 cards)
3. **Battle**: 
   - Place units strategically across 8 slots
   - Tanks (slots 1-2) protect your backline
   - Units (slots 3, 4, 7) are your main attackers
   - Mages (slots 5-6) provide passive effects
   - Leader (slot 0) is your life - protect it!

## 🔧 Technical Changes

### Files Modified:
1. **types.ts**: Added `DifficultyLevel` enum
2. **constants.ts**: Updated `MAX_BOARD_SLOTS` to 8, added slot 7 as UNIT
3. **App.tsx**: Added difficulty selection UI and state
4. **GameBoard.tsx**: 
   - Added difficulty prop
   - Implemented difficulty modifiers
   - Updated board rendering for 8 slots
   - Updated combat and AI targeting logic
   - Added difficulty indicator badge

### Slot Configuration:
```typescript
SLOT_CONFIG = {
  0: LEADER,
  1: TANK,
  2: TANK,
  3: UNIT,
  4: UNIT,
  5: MAGE,
  6: MAGE,
  7: UNIT  // NEW!
}
```

## 🎨 Strategy Tips

### Easy Mode
- Great for experimenting with deck builds
- Learn card synergies without pressure

### Normal Mode
- Standard balanced gameplay
- Good for casual play

### Hard Mode
- Requires strategic planning
- Enemy's shield makes early aggression difficult
- Focus on building a strong board presence

### Hardcore Mode 💀
- **WARNING**: Very challenging!
- Enemy starts with massive advantages
- Requires perfect plays and optimal deck construction
- Consider using:
  - More defensive cards (shields, heals)
  - High-value units
  - Mages for sustained damage/healing
  - Tank-heavy strategies to survive early game

## 🏆 Good Luck, Commander!

The battlefield awaits. Choose your difficulty and prove your strategic prowess!
