import React, { useState } from 'react';
import { Card, CardType } from '../types';
import { CARD_TEMPLATES, MIN_DECK_SIZE, MAX_DECK_SIZE } from '../constants';
import { CardComponent } from './CardComponent';
import { soundManager } from '../services/soundService';

// Inline Icons to avoid external dependency issues
const Icons = {
    ArrowLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>,
    Plus: ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>,
    Minus: ({ size }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>,
    Trash2: ({ size }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>,
    Save: ({ size }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>,
    X: ({ size }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

interface DeckBuilderProps {
    initialDeck: Card[];
    onSave: (deck: Card[]) => void;
    onBack: () => void;
}

export const DeckBuilder: React.FC<DeckBuilderProps> = ({ initialDeck, onSave, onBack }) => {
    const [currentDeck, setCurrentDeck] = useState<Card[]>(initialDeck);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);

    const handleAddCard = (template: Card) => {
        if (currentDeck.length >= MAX_DECK_SIZE) {
            alert(`Maximum deck size is ${MAX_DECK_SIZE} cards!`);
            return;
        }
        soundManager.play('click');
        setCurrentDeck(prev => [...prev, template]);
    };

    const handleRemoveCard = (index: number) => {
        soundManager.play('click');
        setCurrentDeck(prev => prev.filter((_, i) => i !== index));
    };

    const handleClear = () => {
        soundManager.play('click');
        setCurrentDeck([]);
    };

    const handleSave = () => {
        if (currentDeck.length < MIN_DECK_SIZE) {
            alert(`Deck must have at least ${MIN_DECK_SIZE} cards!`);
            return;
        }
        soundManager.play('victory'); // Success sound
        onSave(currentDeck);
    };

    // Group templates by type for easier browsing
    const units = CARD_TEMPLATES.filter(c =>
        c.type === CardType.UNIT ||
        c.type === CardType.MAGE ||
        c.type === CardType.SUMMONER
    );
    const spells = CARD_TEMPLATES.filter(c =>
        c.type !== CardType.UNIT &&
        c.type !== CardType.MAGE &&
        c.type !== CardType.SUMMONER &&
        c.type !== CardType.LEADER &&
        c.type !== CardType.TOKEN
    );

    const renderCardItem = (card: Card) => {
        const count = currentDeck.filter(c => c.id === card.id).length;
        return (
            <div key={card.id} className="relative group w-[180px] h-[260px] flex-shrink-0">
                {/* Card Click Trigger for Detail */}
                <div
                    className="w-full h-full cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => { soundManager.play('hover'); setSelectedCard(card); }}
                >
                    <div className="scale-75 origin-top-left w-[133%] h-[133%]">
                        <CardComponent card={card} index={0} disableInteractive={true} />
                    </div>
                </div>

                {/* Add Button (Mark Box) */}
                <button
                    onClick={(e) => { e.stopPropagation(); handleAddCard(card); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-slate-800 border-2 border-slate-600 hover:border-green-400 hover:bg-green-900 rounded flex items-center justify-center transition-colors shadow-lg z-10"
                    title="Add to Deck"
                >
                    <Icons.Plus className="text-white w-5 h-5" />
                </button>

                {/* Count Indicator */}
                {count > 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 text-black font-bold rounded-full flex items-center justify-center text-xs shadow-lg z-20 pointer-events-none border border-white">
                        {count}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full h-screen bg-slate-900 flex flex-col text-white overflow-hidden">
            {/* Header */}
            <div className="h-16 bg-slate-950 flex items-center justify-between px-6 border-b border-slate-700 shadow-lg z-20">
                <button onClick={() => { soundManager.play('click'); onBack(); }} className="flex items-center gap-2 hover:text-yellow-400 transition-colors">
                    <Icons.ArrowLeft /> Back
                </button>
                <h1 className="text-2xl font-bold fantasy-font text-yellow-500">Deck Builder</h1>
                <div className="flex items-center gap-4">
                    <span className={`font-mono font-bold ${currentDeck.length < MIN_DECK_SIZE || currentDeck.length > MAX_DECK_SIZE ? 'text-red-500' : 'text-green-400'}`}>
                        {currentDeck.length} / {MAX_DECK_SIZE} Cards
                    </span>
                    <button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded flex items-center gap-2 font-bold shadow-lg transition-all"
                    >
                        <Icons.Save size={18} /> SAVE & PLAY
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Collection (Left) */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-900 custom-scrollbar order-2 md:order-1">
                    <h2 className="text-xl font-bold mb-4 border-b border-slate-700 pb-2">Collection</h2>

                    <div className="mb-8">
                        <h3 className="text-gray-400 font-bold mb-3 uppercase text-sm tracking-wider">Units</h3>
                        <div className="flex flex-wrap gap-4">
                            {units.map(renderCardItem)}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-gray-400 font-bold mb-3 uppercase text-sm tracking-wider">Spells & Actions</h3>
                        <div className="flex flex-wrap gap-4">
                            {spells.map(renderCardItem)}
                        </div>
                    </div>
                </div>

                {/* Current Deck (Right) */}
                <div className="w-full md:w-96 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col shadow-2xl z-10 order-1 md:order-2 h-1/3 md:h-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold">Your Deck</h2>
                        <button onClick={handleClear} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
                            <Icons.Trash2 size={14} /> Clear
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {currentDeck.length === 0 && (
                            <div className="text-center text-gray-600 mt-4 md:mt-10 italic text-sm">
                                Select cards from the collection to build your deck.
                            </div>
                        )}
                        {currentDeck.map((card, idx) => (
                            <div key={`${card.id}-${idx}`} className="bg-slate-800 p-2 rounded flex items-center justify-between border border-slate-700 animate-in slide-in-from-right-10 duration-200">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-900 text-xs flex items-center justify-center font-bold border border-blue-500">
                                        {card.cost}
                                    </div>
                                    <span className="font-bold text-sm truncate w-32">{card.name}</span>
                                </div>
                                <button
                                    onClick={() => handleRemoveCard(idx)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                >
                                    <Icons.Minus size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-slate-800 text-xs text-gray-500 text-center">
                        Min {MIN_DECK_SIZE} - Max {MAX_DECK_SIZE} cards.
                    </div>
                </div>
            </div>

            {/* Detail View Modal (HD) */}
            {selectedCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedCard(null)}>
                    <div className="relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <button
                            className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors p-2"
                            onClick={() => setSelectedCard(null)}
                        >
                            <Icons.X size={32} />
                        </button>

                        <div className="transform scale-150 origin-center shadow-2xl rounded-xl overflow-hidden ring-4 ring-yellow-500/50">
                            <CardComponent card={selectedCard} index={0} disableInteractive={true} />
                        </div>

                        <div className="mt-24 flex gap-4">
                            <button
                                onClick={() => { handleAddCard(selectedCard); }}
                                className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold shadow-xl flex items-center gap-2 transform hover:scale-105 transition-all"
                            >
                                <Icons.Plus /> Add to Deck
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};