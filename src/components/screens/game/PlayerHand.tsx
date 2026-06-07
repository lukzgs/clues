import React from 'react';
import { GameState, Player, GamePhase } from '../../../types';
import { useTranslation } from '../../../i18n/index.tsx';
import { GameCard } from '../../game/GameCard';

interface PlayerHandProps {
  gameState: GameState;
  currentPlayer: Player | undefined;
  selectedCard: string | null;
  onCardSelect: (cardId: string) => void;
  onConfirmCard: () => void;
  layout: 'row' | 'grid-1' | 'grid-2';
  setLayout: (layout: 'row' | 'grid-1' | 'grid-2') => void;
  isMobileScoreOpen: boolean;
  setIsMobileScoreOpen: (open: boolean) => void;
  hideHand: boolean;
  setHideHand: (hide: boolean) => void;
  shouldShowHand: boolean;
  isNarrator: boolean;
  hasChosenCard: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  gameState,
  currentPlayer,
  selectedCard,
  onCardSelect,
  onConfirmCard,
  layout,
  setLayout,
  isMobileScoreOpen,
  setIsMobileScoreOpen,
  hideHand,
  setHideHand,
  shouldShowHand,
  isNarrator,
  hasChosenCard,
}) => {
  const { t } = useTranslation();

  if (!shouldShowHand || !currentPlayer) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 transform ${hideHand ? 'translate-y-[90%]' : 'translate-y-0'} ${isMobileScoreOpen ? 'invisible opacity-0' : 'visible opacity-100'}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent pointer-events-none h-[150%] bottom-0 top-auto"></div>
      
      {/* Mobile Handle */}
      <div className="md:hidden absolute -top-8 left-0 right-0 flex justify-center pointer-events-auto items-end gap-2 px-4 pb-1">
        <button 
          onClick={() => setIsMobileScoreOpen(true)}
          className="bg-black/60 backdrop-blur-md text-amber-300 border border-white/10 px-3 py-1.5 rounded-t-xl text-[10px] uppercase font-sans font-bold flex items-center gap-1.5 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          PONTUAÇÕES
        </button>
        <button 
          onClick={() => setHideHand(!hideHand)}
          className="w-16 h-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-t-xl flex items-center justify-center flex-col gap-0.5 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]"
        >
          <div className="w-6 h-0.5 bg-white/30 rounded-full"></div>
          <div className="w-4 h-0.5 bg-white/30 rounded-full"></div>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-2 md:px-8 pb-4 md:pb-8 pt-4 md:pt-10 relative pointer-events-auto flex flex-col md:flex-row items-end md:items-center justify-between gap-4 md:gap-8">
        
        {/* Layout toggle (mobile only) */}
        <div className="hidden md:block w-[180px] shrink-0"></div>
        
        {/* Desktop Title & Status */}
        <div className="hidden md:flex flex-col flex-1 text-center shrink-0 w-[200px]">
          <h3 className="text-white/40 text-xs uppercase tracking-[0.2em] font-sans font-bold mb-2">
            SUA MÃO
          </h3>
          {gameState.phase === GamePhase.OTHERS_CHOOSING && !isNarrator && (
            <div className="bg-[#1A1A1A] border border-amber-500/30 rounded-xl py-2 px-4 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                Escolha uma carta para jogar
            </div>
          )}
        </div>

        {/* Action Button & Layout toggle (Mobile) */}
        <div className="w-full md:w-[180px] shrink-0 flex items-center justify-between md:justify-end gap-3 z-10">
          <div className="flex md:hidden bg-black/60 rounded-xl border border-white/10 p-1 backdrop-blur-md">
            <button
              onClick={() => setLayout('row')}
              className={`p-2 rounded-lg transition-all ${layout === 'row' ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-white/40 hover:text-white/80'}`}
              aria-label="Ver em linha"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="18" rx="1" ry="1"/><rect x="18" y="5" width="3" height="14" rx="1" ry="1"/><rect x="3" y="5" width="3" height="14" rx="1" ry="1"/></svg>
            </button>
            <button
              onClick={() => setLayout('grid-2')}
              className={`p-2 rounded-lg transition-all ${layout === 'grid-2' ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-white/40 hover:text-white/80'}`}
              aria-label="Ver 2 por linha"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" ry="1"/><rect x="14" y="3" width="7" height="7" rx="1" ry="1"/><rect x="14" y="14" width="7" height="7" rx="1" ry="1"/><rect x="3" y="14" width="7" height="7" rx="1" ry="1"/></svg>
            </button>
            <button
              onClick={() => setLayout('grid-1')}
              className={`p-2 rounded-lg transition-all ${layout === 'grid-1' ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-white/40 hover:text-white/80'}`}
              aria-label="Ver 1 por linha"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
            </button>
          </div>

          <button
            onClick={onConfirmCard}
            disabled={!selectedCard || hasChosenCard}
            className={`flex-1 md:flex-none py-3 px-6 rounded-xl font-cinzel font-bold uppercase tracking-widest text-sm transition-all duration-300 whitespace-nowrap ${
              selectedCard && !hasChosenCard
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:scale-[1.05] translate-y-0'
                : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed translate-y-0'
            }`}
          >
            {hasChosenCard ? 'PRONTO' : (isNarrator ? 'DAR PISTA' : 'JOGAR CARTA')}
          </button>
        </div>

        {/* The Cards */}
        <div className="absolute bottom-16 md:bottom-20 left-0 right-0 flex justify-center pointer-events-none px-4">
          <div className={`
            flex pointer-events-auto
            ${layout === 'row' 
              ? 'flex-row items-end justify-center -space-x-8 md:-space-x-6 overflow-x-auto overflow-y-visible px-8 py-8 w-full hide-scrollbar snap-x snap-mandatory' 
              : layout === 'grid-2'
                ? 'grid grid-cols-2 gap-4 max-w-[400px] w-full mx-auto max-h-[50vh] overflow-y-auto hide-scrollbar pb-8'
                : 'flex flex-col gap-6 max-w-[280px] w-full mx-auto max-h-[60vh] overflow-y-auto hide-scrollbar pb-8'
            }
          `}>
            {currentPlayer.hand.map((card, index) => {
              const isSelected = selectedCard === card.id.toString();
              const rotation = layout === 'row' ? (index - (currentPlayer.hand.length - 1) / 2) * 5 : 0;
              const yOffset = layout === 'row' ? Math.abs(index - (currentPlayer.hand.length - 1) / 2) * 8 : 0;
              
              return (
                <div 
                  key={card.id}
                  className={`
                    transition-all duration-500 cursor-pointer group origin-bottom flex-shrink-0
                    ${layout === 'row' ? 'snap-center' : ''}
                    ${isSelected ? 'z-30 scale-110 md:scale-[1.15]' : 'z-10 hover:z-20 hover:-translate-y-4 md:hover:-translate-y-8'}
                  `}
                  style={layout === 'row' ? {
                    transform: `rotate(${rotation}deg) translateY(${isSelected ? '-30px' : `${yOffset}px`})`,
                  } : undefined}
                  onClick={() => onCardSelect(card.id.toString())}
                >
                  <GameCard
                    card={card}
                    size={layout === 'grid-2' ? 'sm' : layout === 'grid-1' ? 'lg' : 'full'}
                    isSelected={isSelected}
                    className={`shadow-[0_10px_20px_rgba(0,0,0,0.5)] ${!isSelected && 'group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]'}`}
                  />
                  {/* Indicator for selected card in grid mode */}
                  {isSelected && layout !== 'row' && (
                    <div className="absolute inset-0 border-4 border-amber-400 rounded-2xl md:rounded-[1.75rem] pointer-events-none"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
