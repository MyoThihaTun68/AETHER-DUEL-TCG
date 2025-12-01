import React, { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { DeckBuilder } from './components/DeckBuilder';
import { BASE_DECK } from './constants';
import { Card, DifficultyLevel } from './types';
import { soundManager } from './services/soundService';

type View = 'MENU' | 'BUILDER' | 'GAME';

export default function App() {
  const [view, setView] = useState<View>('MENU');
  const [customDeck, setCustomDeck] = useState<Card[]>(BASE_DECK);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.NORMAL);

  // Load Deck from LocalStorage
  useEffect(() => {
    const savedDeck = localStorage.getItem('aether_duel_deck');
    if (savedDeck) {
      try {
        setCustomDeck(JSON.parse(savedDeck));
      } catch (e) {
        console.error("Failed to load deck", e);
      }
    }
  }, []);

  // Background Audio
  useEffect(() => {
    const initAudio = () => {
      soundManager.playBGM();
      window.removeEventListener('click', initAudio);
    };
    window.addEventListener('click', initAudio);
    return () => window.removeEventListener('click', initAudio);
  }, []);

  const handleStartGame = () => {
    soundManager.play('click');
    setView('GAME');
  };

  const handleOpenBuilder = () => {
    soundManager.play('click');
    setView('BUILDER');
  };

  const handleSaveDeck = (deck: Card[]) => {
    setCustomDeck(deck);
    localStorage.setItem('aether_duel_deck', JSON.stringify(deck));
    setView('MENU');
  };

  if (view === 'GAME') {
    return <GameBoard customDeck={customDeck} difficulty={difficulty} onExit={() => setView('MENU')} />;
  }

  if (view === 'BUILDER') {
    return <DeckBuilder initialDeck={customDeck} onSave={handleSaveDeck} onBack={() => setView('MENU')} />;
  }

  const difficultyOptions = [
    {
      level: DifficultyLevel.EASY,
      label: 'Easy',
      color: 'green',
      description: 'Enemy starts with less HP and mana'
    },
    {
      level: DifficultyLevel.NORMAL,
      label: 'Normal',
      color: 'blue',
      description: 'Balanced challenge'
    },
    {
      level: DifficultyLevel.HARD,
      label: 'Hard',
      color: 'orange',
      description: 'Enemy has more HP and better cards'
    },
    {
      level: DifficultyLevel.HARDCORE,
      label: 'Hardcore',
      color: 'red',
      description: '💀 EXTREME CHALLENGE - Enemy is ruthless!'
    },
  ];

  return (
    <div className="relative h-screen w-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-black pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 animate-pulse"></div>

      {/* Main Menu Content */}
      <div className="z-10 text-center space-y-8 animate-in zoom-in duration-500">
        <h1 className="text-6xl md:text-8xl font-black fantasy-font text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-600 drop-shadow-[0_5px_5px_rgba(0,0,0,1)]">
          AETHER DUEL
        </h1>
        <p className="text-slate-400 text-lg tracking-widest uppercase mb-12">The Infinite Card Battle</p>

        {/* Difficulty Selection */}
        <div className="mb-8">
          <h2 className="text-slate-300 text-sm font-bold tracking-widest uppercase mb-4">Select Difficulty</h2>
          <div className="grid grid-cols-2 gap-3 w-80 mx-auto">
            {difficultyOptions.map((option) => (
              <button
                key={option.level}
                onClick={() => {
                  soundManager.play('hover');
                  setDifficulty(option.level);
                }}
                className={`
                  relative px-4 py-3 rounded border-2 transition-all
                  ${difficulty === option.level
                    ? `border-${option.color}-500 bg-${option.color}-900/40 shadow-[0_0_20px_rgba(var(--tw-${option.color}-rgb),0.4)] scale-105`
                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                  }
                `}
              >
                <div className={`font-bold text-sm ${difficulty === option.level ? `text-${option.color}-400` : 'text-slate-400'}`}>
                  {option.label}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{option.description}</div>
                {difficulty === option.level && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 w-64 mx-auto">
          <button
            onClick={handleStartGame}
            className="group relative px-8 py-4 bg-slate-900 border border-slate-700 text-white font-bold text-xl rounded-sm hover:bg-slate-800 transition-all hover:scale-105 hover:border-yellow-500 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]"
          >
            <span className="absolute inset-0 w-full h-full bg-yellow-400/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            PLAY GAME
          </button>

          <button
            onClick={handleOpenBuilder}
            className="group relative px-8 py-4 bg-slate-900 border border-slate-700 text-white font-bold text-xl rounded-sm hover:bg-slate-800 transition-all hover:scale-105 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
          >
            <span className="absolute inset-0 w-full h-full bg-blue-400/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            DECK BUILDER
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 text-slate-600 text-xs">
        Built with React & GSAP
      </div>
    </div>
  );
}