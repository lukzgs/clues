import type React from 'react';
import { useTranslation } from '../../../i18n/index.tsx';
import { GamePhase, type GameState, type Player } from '../../../types';
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
    <div
      className={`w-full bg-[#1A1A1A]/30 border border-white/10 rounded-2xl p-4 shrink-0 transition-all duration-300 ${isMobileScoreOpen ? 'invisible opacity-0' : 'visible opacity-100'} fixed bottom-0 left-0 right-0 z-50 md:relative md:bottom-auto md:left-auto md:right-auto md:z-10 md:bg-transparent md:border-0 md:p-0`}
    >
      {/* Mobile Handle */}
      <div className="md:hidden absolute -top-8 left-0 right-0 flex justify-center pointer-events-auto items-end gap-2 px-4 pb-1">
        <button
          onClick={() => setIsMobileScoreOpen(true)}
          className="bg-black/60 backdrop-blur-md text-amber-300 border border-white/10 px-3 py-1.5 rounded-t-xl text-[10px] uppercase font-sans font-bold flex items-center gap-1.5 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
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

      <div className="w-full md:bg-transparent md:border-0 md:p-0 bg-[#1A1A1A]/30 border border-white/10 rounded-2xl p-4 md:py-8 shrink-0 flex items-center justify-center gap-4 pointer-events-auto overflow-visible">
        {/* Center Side: The Cards */}
        <div className="flex-1 flex justify-center py-2 overflow-visible w-full min-h-[10rem] md:min-h-0">
          <div
            className={`
            flex pointer-events-auto justify-center overflow-visible
            ${
              layout === 'row'
                ? 'flex-row items-end justify-center -space-x-8 md:-space-x-6 overflow-x-auto md:overflow-x-visible overflow-y-visible md:overflow-y-visible px-8 py-2 w-full hide-scrollbar snap-x snap-mandatory'
                : layout === 'grid-2'
                  ? 'grid grid-cols-2 gap-4 max-w-[400px] w-full mx-auto max-h-[50vh] overflow-y-auto hide-scrollbar pb-2'
                  : 'flex flex-col gap-6 max-w-[280px] w-full mx-auto max-h-[60vh] overflow-y-auto hide-scrollbar pb-2'
            }
          `}
          >
            {currentPlayer.hand.map((card, index) => {
              const isSelected = selectedCard === card.id.toString();
              const rotation =
                layout === 'row'
                  ? (index - (currentPlayer.hand.length - 1) / 2) * 5
                  : 0;
              const yOffset =
                layout === 'row'
                  ? Math.abs(index - (currentPlayer.hand.length - 1) / 2) * 6
                  : 0;

              return (
                <div
                  key={card.id}
                  className={`
                    transition-all duration-500 cursor-pointer group origin-bottom flex-shrink-0 overflow-visible
                    ${layout === 'row' ? 'snap-center' : ''}
                    ${isSelected ? 'z-30 scale-110 md:scale-[1.15]' : 'z-10 hover:z-20 hover:-translate-y-4 md:hover:-translate-y-12'}
                  `}
                  style={
                    layout === 'row'
                      ? {
                          transform: `rotate(${rotation}deg) translateY(${isSelected ? '-20px' : `${yOffset}px`})`,
                        }
                      : undefined
                  }
                  onClick={() => onCardSelect(card.id.toString())}
                >
                  <GameCard
                    card={card}
                    size={
                      layout === 'grid-2'
                        ? 'sm'
                        : layout === 'grid-1'
                          ? 'table'
                          : 'lg'
                    }
                    isSelected={isSelected}
                    className={`shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-shadow duration-300 ${!isSelected && 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.25),0_20px_40px_rgba(0,0,0,0.6)]'}`}
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
