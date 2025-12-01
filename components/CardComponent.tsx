
import React, { useRef, useEffect } from 'react';
import { Card, CardType } from '../types';
import gsap from 'gsap';
import { soundManager } from '../services/soundService';

interface CardProps {
  card: Card | null;
  onClick?: (card: Card) => void;
  onMouseDown?: (e: React.MouseEvent, card: Card) => void;
  onContextMenu?: (e: React.MouseEvent, card: Card) => void;
  disabled?: boolean;
  isEnemy?: boolean;
  isRevealed?: boolean;
  isDragging?: boolean;
  isOnBoard?: boolean;
  index: number;
  disableInteractive?: boolean;
  isInspection?: boolean; // NEW: Triggers large, high-detail render
}

export const CardComponent: React.FC<CardProps> = ({ card, onClick, onMouseDown, onContextMenu, disabled, isEnemy, isRevealed, isDragging, isOnBoard, index, disableInteractive, isInspection }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!card) return null;

  // Calculate tank mode early for styling logic
  const isTankMode = isOnBoard && card.type === CardType.UNIT && card.attack === 0;

  // Entrance animation
  useEffect(() => {
    let ctx = gsap.context(() => {
      if (!isDragging && !isOnBoard && !isRevealed && !disableInteractive && !isInspection) {
        gsap.fromTo(cardRef.current,
          { y: isEnemy ? -50 : 50, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.5, delay: index * 0.1, ease: 'power2.out' }
        );
      }
    }, cardRef);
    return () => ctx.revert();
  }, [index, isEnemy, isDragging, isOnBoard, isRevealed, disableInteractive, isInspection]);

  // Flip Animation
  useEffect(() => {
    let ctx = gsap.context(() => {
      if (isEnemy && isRevealed && !isOnBoard && cardRef.current && !isInspection) {
        gsap.to(cardRef.current, { rotationY: 180, duration: 0.6, ease: 'power2.inOut' });
      }
    }, cardRef);
    return () => ctx.revert();
  }, [isRevealed, isEnemy, isOnBoard, isInspection]);

  // Exhaustion / Ready State
  useEffect(() => {
    let ctx = gsap.context(() => {
      if (isInspection) return;
      if (isOnBoard && card.isExhausted && !isEnemy && cardRef.current) {
        gsap.to(cardRef.current, { filter: 'grayscale(0.6) brightness(0.9)', scale: 0.98, duration: 0.3 });
      } else if (isOnBoard && !card.isExhausted && cardRef.current) {
        gsap.to(cardRef.current, { filter: 'grayscale(0) brightness(1.1)', scale: 1, duration: 0.3 });
        // Subtle "Ready" pulse
        gsap.to(cardRef.current, {
          boxShadow: '0 0 15px rgba(250, 204, 21, 0.4)',
          repeat: 1, yoyo: true, duration: 0.8
        });
      }
    }, cardRef);
    return () => ctx.revert();
  }, [card.isExhausted, isOnBoard, isEnemy, isInspection]);

  const handleMouseEnter = () => {
    if (disableInteractive || isInspection) return;
    if (!disabled && !isEnemy && !isRevealed && !isDragging) {
      soundManager.play('hover');
      gsap.to(cardRef.current, {
        y: isOnBoard ? -5 : -40,
        scale: isOnBoard ? 1.05 : 1.15,
        zIndex: 50,
        duration: 0.25,
        ease: 'power3.out',
        boxShadow: '0 20px 30px -10px rgba(0,0,0,0.6)'
      });
    }
  };

  const handleMouseLeave = () => {
    if (disableInteractive || isInspection) return;
    if (!disabled && !isEnemy && !isRevealed && !isDragging) {
      gsap.to(cardRef.current, {
        y: 0,
        scale: 1,
        zIndex: 1,
        duration: 0.3,
        ease: 'power2.out',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      });
    }
  };

  const handleClick = () => {
    if (disableInteractive || isInspection) return;
    if (!disabled && onClick) {
      onClick(card);
    } else if (disabled && !isEnemy) {
      gsap.to(cardRef.current, { x: 4, duration: 0.05, yoyo: true, repeat: 3 });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onContextMenu) onContextMenu(e, card);
  }

  // --- PREMIUM STYLING HELPERS ---
  const getBorderGradient = (type: CardType) => {
    if (isTankMode) return 'bg-gradient-to-br from-blue-300 via-blue-500 to-slate-800'; // Heavy Armor

    switch (type) {
      case CardType.LEADER: return 'bg-gradient-to-br from-yellow-300 via-yellow-600 to-yellow-800'; // Gold
      case CardType.MAGE: return 'bg-gradient-to-br from-fuchsia-400 via-purple-600 to-indigo-900'; // Arcane
      case CardType.SUMMONER: return 'bg-gradient-to-br from-indigo-300 via-indigo-500 to-purple-900'; // Summoner
      case CardType.UNIT: return 'bg-gradient-to-br from-slate-300 via-slate-500 to-slate-700'; // Steel/Iron
      case CardType.ATTACK: return 'bg-gradient-to-br from-red-400 via-red-600 to-red-900'; // Aggression
      case CardType.SPELL_DAMAGE: return 'bg-gradient-to-br from-orange-400 via-orange-600 to-red-900'; // Fire
      case CardType.SPELL_HEAL: return 'bg-gradient-to-br from-emerald-300 via-emerald-500 to-teal-900'; // Nature
      case CardType.SPELL_FREEZE: return 'bg-gradient-to-br from-cyan-300 via-cyan-500 to-blue-900'; // Ice
      case CardType.SPELL_VAMPIRIC: return 'bg-gradient-to-br from-purple-400 via-red-600 to-black'; // Dark/Blood
      default: return 'bg-gradient-to-br from-gray-400 via-gray-600 to-gray-800';
    }
  };

  const getGemStyle = (stat: 'mana' | 'atk' | 'hp') => {
    switch (stat) {
      case 'mana': return 'bg-gradient-to-br from-blue-400 to-blue-700 border-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
      case 'atk': return 'bg-gradient-to-br from-yellow-400 to-orange-700 border-yellow-200 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
      case 'hp': return 'bg-gradient-to-br from-red-400 to-red-700 border-red-200 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
    }
  };

  // Dimensions logic - Handles Normal, Board, and Inspection modes
  let containerClass = '';
  if (isInspection) {
    containerClass = `w-[320px] h-[480px] md:w-[450px] md:h-[630px] relative card-3d cursor-default shadow-2xl`;
  } else if (isOnBoard) {
    containerClass = `w-full h-full relative cursor-pointer select-none transition-all duration-200 card-3d ${isDragging ? 'opacity-0' : 'opacity-100'}`;
  } else {
    containerClass = `w-32 h-48 md:w-40 md:h-56 relative cursor-pointer select-none transition-all duration-200 card-3d ${disabled && !isEnemy ? 'grayscale brightness-75' : ''} ${isDragging ? 'opacity-0' : 'opacity-100'}`;
  }

  const shouldShowFront = isOnBoard || !isEnemy || isRevealed || isInspection;

  // Font Sizing Map based on mode
  const fontSizes = isInspection
    ? { name: 'text-2xl', type: 'text-sm', desc: 'text-lg', stat: 'text-3xl' }
    : { name: 'text-[10px] md:text-xs', type: 'text-[8px]', desc: 'text-[9px]', stat: 'text-xs md:text-sm' };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onMouseDown={(e) => !disableInteractive && !disabled && !isInspection && onMouseDown && onMouseDown(e, card)}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={containerClass}
      style={{ perspective: '1200px' }}
    >
      <div
        className="w-full h-full relative transition-transform duration-500"
        style={{ transformStyle: 'preserve-3d', transform: !shouldShowFront && isEnemy ? 'rotateY(180deg)' : 'none' }}
      >

        {/* --- FRONT FACE --- */}
        <div
          className="absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-2xl"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* 1. Gradient Border (The "Frame") */}
          <div className={`absolute inset-0 p-[3px] rounded-xl ${getBorderGradient(card.type)}`}>
            {/* 2. Inner Dark Background */}
            <div className="absolute inset-[3px] bg-slate-900 rounded-lg overflow-hidden flex flex-col">

              {/* 3. Header / Name Plate */}
              <div className={`${isInspection ? 'h-12' : 'h-7'} bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-600/50 flex items-center justify-center relative z-10`}>
                <span className={`${fontSizes.name} font-bold fantasy-font tracking-wide uppercase truncate px-2 ${card.type === CardType.LEADER ? 'text-yellow-400' : 'text-slate-200'}`}>
                  {isTankMode ? 'DEFENDER' : card.name}
                </span>
              </div>

              {/* 4. Artwork Area */}
              <div className="relative h-1/2 w-full bg-black group-hover:brightness-110 transition-all duration-300">
                <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                {/* Inner Shadow / Vignette */}
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none"></div>

                {/* Gloss Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-50 pointer-events-none"></div>

                {/* Status Icons */}
                {isTankMode && <div className="absolute inset-0 flex items-center justify-center bg-blue-900/30 backdrop-blur-[1px]"><span className={isInspection ? "text-6xl" : "text-2xl"}>🛡️</span></div>}
                {card.type === CardType.MAGE && <div className="absolute top-1 right-1 text-xs animate-pulse drop-shadow-[0_0_5px_rgba(255,255,255,1)]">⚡</div>}
                {card.type === CardType.LEADER && <div className="absolute top-1 right-1 text-xs drop-shadow">👑</div>}
              </div>

              {/* 5. Description Area */}
              <div className="flex-1 bg-[#1a1c23] relative border-t-2 border-slate-700">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>

                {/* Type Label */}
                <div className="flex justify-center -mt-2.5 relative z-10">
                  <span className={`${fontSizes.type} font-black uppercase tracking-widest bg-slate-800 text-slate-400 px-3 py-0.5 rounded-full border border-slate-600 shadow-sm`}>
                    {card.type ? card.type.replace('_', ' ') : 'UNKNOWN'}
                  </span>
                </div>

                {/* Text */}
                {!isOnBoard || isInspection ? (
                  <div className={`px-4 pt-4 pb-6 text-center ${isInspection ? 'flex flex-col justify-center h-full' : ''}`}>
                    <p className={`${fontSizes.desc} leading-relaxed text-slate-300 font-medium font-serif ${isInspection ? '' : 'line-clamp-3'}`}>
                      {card.description}
                    </p>
                    {/* Detailed Stats for Inspection */}
                    {isInspection && card.type === CardType.MAGE && card.mageEffect && (
                      <p className="mt-4 text-purple-400 font-bold text-sm uppercase tracking-wider">
                        PASSIVE: {card.mageEffect.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>

            </div>

            {/* 6. Stats Gems (Overlays) */}

            {/* MANA (Top Left) */}
            {(!isOnBoard || isInspection) && (
              <div className={`absolute -top-2 -left-2 rounded-full flex items-center justify-center border-2 z-20 ${getGemStyle('mana')} ${isInspection ? 'w-14 h-14' : 'w-7 h-7'}`}>
                <span className={`${fontSizes.stat} font-black text-white drop-shadow-md font-serif`}>{card.cost}</span>
              </div>
            )}

            {(card.type === CardType.UNIT || card.type === CardType.MAGE || card.type === CardType.SUMMONER || card.type === CardType.LEADER || card.type === CardType.TOKEN) && (
              <>
                {/* ATTACK (Bottom Left) */}
                {card.type !== CardType.LEADER && (
                  <div className={`absolute bottom-3 left-1 rounded-full flex items-center justify-center border-2 z-20 ${isTankMode ? 'bg-blue-600 border-blue-300' : getGemStyle('atk')} ${isInspection ? 'w-16 h-16 bottom-4 left-4' : 'w-6 h-6 md:w-8 md:h-8'}`}>
                    <span className={`${fontSizes.stat} font-black text-white drop-shadow-md`}>{isTankMode ? '🛡' : card.attack}</span>
                  </div>
                )}
                {/* HEALTH (Bottom Right) */}
                <div className={`absolute bottom-3 right-1 rounded-full flex items-center justify-center border-2 z-20 ${getGemStyle('hp')} ${isInspection ? 'w-16 h-16 bottom-4 right-4' : 'w-6 h-6 md:w-8 md:h-8'}`}>
                  <span className={`${fontSizes.stat} font-black text-white drop-shadow-md`}>{card.health}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* --- BACK FACE --- */}
        <div
          className="absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-2xl bg-slate-900 border-[3px] border-slate-700"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-yellow-700/30 flex items-center justify-center bg-black/40">
              <div className="w-10 h-10 rotate-45 border-2 border-red-900/50 bg-red-900/20"></div>
            </div>
          </div>
          {/* Logo Hint */}
          <div className="absolute bottom-4 w-full text-center text-slate-600 text-[10px] font-bold tracking-[0.2em] opacity-50">AETHER DUEL</div>
        </div>

      </div>
    </div>
  );
};
