
import React, { useState, useImperativeHandle, forwardRef, useRef } from 'react';
import gsap from 'gsap';

export type VFXType = 'FIREBALL' | 'HEAL' | 'SHIELD' | 'ARCANE_SHOT';

export interface VFXHandle {
  playEffect: (type: VFXType, startRect: DOMRect, endRect: DOMRect) => Promise<void>;
}

export const VFXLayer = forwardRef<VFXHandle, {}>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeVFX, setActiveVFX] = useState<React.ReactNode[]>([]);
  const [isCinematic, setIsCinematic] = useState(false);
  const [impactFlash, setImpactFlash] = useState(false);

  useImperativeHandle(ref, () => ({
    playEffect: async (type, startRect, endRect) => {
      return new Promise<void>((resolve) => {
        setIsCinematic(true); 

        const id = Math.random().toString(36).substr(2, 9);
        const startX = startRect.left + startRect.width / 2;
        const startY = startRect.top + startRect.height / 2;
        const endX = endRect.left + endRect.width / 2;
        const endY = endRect.top + endRect.height / 2;

        let vfxElements: React.ReactNode[] = [];

        // --- FIREBALL VFX ---
        if (type === 'FIREBALL') {
            vfxElements.push(
                <div key={`${id}-proj`} id={`vfx-${id}`} className="absolute z-[9999] pointer-events-none w-24 h-8 flex items-center">
                    {/* Head */}
                    <div className="absolute right-0 w-8 h-8 bg-orange-100 rounded-full blur-[2px] shadow-[0_0_20px_#f59e0b] z-10 animate-pulse"></div>
                    <div className="absolute right-1 w-6 h-6 bg-white rounded-full blur-[1px] z-20"></div>
                    {/* Trail */}
                    <div className="w-full h-4 bg-gradient-to-l from-orange-500 via-red-600 to-transparent rounded-full blur-[2px] opacity-80"></div>
                    <div className="absolute right-2 w-16 h-6 bg-gradient-to-l from-yellow-400 to-transparent blur-md opacity-60"></div>
                </div>
            );
        } 
        // --- HEAL VFX ---
        else if (type === 'HEAL') {
             // Multiple particles for Heal
             vfxElements.push(
                <div key={`${id}-main`} id={`vfx-${id}`} className="absolute z-[9999] pointer-events-none w-32 h-32 flex items-center justify-center">
                    {/* Inner Holy Ring */}
                    <div className="absolute inset-0 border-2 border-emerald-300 rounded-full opacity-0 scale-0" id={`vfx-${id}-ring`}></div>
                    {/* Crosses */}
                    <div className="text-emerald-400 text-4xl font-bold drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" id={`vfx-${id}-icon`}>+</div>
                </div>
            );
        } 
        // --- SHIELD VFX ---
        else if (type === 'SHIELD') {
            vfxElements.push(
                <div key={`${id}-shield`} id={`vfx-${id}`} className="absolute z-[9999] pointer-events-none w-32 h-32 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]">
                         <path id={`vfx-${id}-hex`} d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" 
                               fill="rgba(59, 130, 246, 0.2)" stroke="#60a5fa" strokeWidth="2" 
                               strokeDasharray="300" strokeDashoffset="300"
                               opacity="0"
                               />
                         <circle cx="50" cy="50" r="10" fill="#bfdbfe" className="animate-ping" opacity="0.5" />
                    </svg>
                </div>
            );
        } 
        // --- ARCANE SHOT VFX ---
        else if (type === 'ARCANE_SHOT') {
            vfxElements.push(
                <div key={`${id}-arcane`} id={`vfx-${id}`} className="absolute z-[9999] pointer-events-none w-16 h-16">
                     <div className="absolute inset-0 bg-fuchsia-500 rounded-full blur-md opacity-80 animate-spin-slow"></div>
                     <div className="absolute inset-2 bg-purple-200 rounded-full blur-[1px]"></div>
                     <div className="absolute -inset-4 border border-fuchsia-400 rounded-full opacity-40 scale-50"></div>
                </div>
            );
        }

        setActiveVFX(prev => [...prev, ...vfxElements]);

        // --- ANIMATION TIMELINES ---
        setTimeout(() => {
            const el = document.getElementById(`vfx-${id}`);
            if (!el) return;

            const tl = gsap.timeline({
                onComplete: () => {
                    setActiveVFX(prev => prev.filter(item => (item as any).key !== `${id}-proj` && (item as any).key !== `${id}-main` && (item as any).key !== `${id}-shield` && (item as any).key !== `${id}-arcane`));
                    setIsCinematic(false);
                    resolve();
                }
            });

            if (type === 'FIREBALL' || type === 'ARCANE_SHOT') {
                const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
                
                // Setup
                tl.set(el, { x: startX - 50, y: startY - 20, rotate: angle, scale: 0.2, opacity: 0 });
                
                // Launch
                tl.to(el, { opacity: 1, scale: 1, duration: 0.1, ease: 'power2.out' });
                
                // Travel (Fast & Impactful)
                tl.to(el, { 
                    x: endX - 50, 
                    y: endY - 20, 
                    duration: 0.6, 
                    ease: 'power2.in',
                    onComplete: () => {
                        // Impact Flash
                        setImpactFlash(true);
                        setTimeout(() => setImpactFlash(false), 100);
                    }
                });
                
                // Dissipate
                tl.to(el, { scale: 2, opacity: 0, duration: 0.15, ease: 'power4.out' });

            } else if (type === 'HEAL') {
                const ring = document.getElementById(`vfx-${id}-ring`);
                const icon = document.getElementById(`vfx-${id}-icon`);

                tl.set(el, { x: endX - 64, y: endY - 64 });
                
                // Icon Rise
                tl.fromTo(icon, 
                    { scale: 0, opacity: 0, y: 20 },
                    { scale: 1.5, opacity: 1, y: -20, duration: 0.5, ease: 'back.out(1.7)' }
                );
                
                // Ring Expand
                tl.to(ring, { scale: 1.2, opacity: 1, duration: 0.3 }, "<");
                tl.to(ring, { scale: 1.8, opacity: 0, duration: 0.4 });
                
                // Fade out
                tl.to(icon, { y: -50, opacity: 0, duration: 0.4 }, "-=0.2");

            } else if (type === 'SHIELD') {
                const hex = document.getElementById(`vfx-${id}-hex`);
                
                tl.set(el, { x: endX - 64, y: endY - 64 });
                
                // Draw Hexagon
                tl.to(hex, { strokeDashoffset: 0, opacity: 1, duration: 0.5, ease: 'power2.inOut' });
                // Fill Flash
                tl.to(hex, { fill: "rgba(59, 130, 246, 0.6)", duration: 0.1, yoyo: true, repeat: 1 });
                // Stable state then fade
                tl.to(hex, { opacity: 0, scale: 1.1, duration: 0.5, delay: 0.2 });
            }

        }, 10);
      });
    }
  }));

  return (
    <>
        {/* Cinematic Backdrop (Dimmer, No Blur) */}
        <div 
            className={`fixed inset-0 bg-slate-950/40 transition-opacity duration-300 z-[9990] pointer-events-none ${isCinematic ? 'opacity-100' : 'opacity-0'}`}
        ></div>
        
        {/* Screen Impact Flash */}
        <div className={`fixed inset-0 bg-white/20 z-[9992] pointer-events-none transition-opacity duration-75 ${impactFlash ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* VFX Container */}
        <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {activeVFX}
        </div>
    </>
  );
});

VFXLayer.displayName = 'VFXLayer';
