import type React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n/index.tsx';
import { useTheme } from '../../../providers/ThemeProvider';
import type { GameState, Player } from '../../../types';
import { GameCard } from '../../game/GameCard';

// -----------------------------------------------------------------------------
// Narrator Choosing View
// -----------------------------------------------------------------------------

interface NarratorChoosingViewProps {
  isNarrator: boolean;
  narrator: Player | undefined;
}

export const NarratorChoosingView: React.FC<NarratorChoosingViewProps> = ({
  isNarrator,
  narrator,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 animate-fade-in z-20 pointer-events-auto">
      {isNarrator ? (
        <div
          className={`backdrop-blur-2xl border p-6 md:p-8 rounded-2xl md:rounded-3xl text-center w-full max-w-md shadow-2xl transition-all duration-300 ${theme.cardBg} ${theme.accentBorder}`}
        >
          <h2
            className={`text-xl md:text-2xl font-cinzel font-bold mb-2 tracking-[0.1em] leading-tight ${theme.accentText}`}
          >
            {t.game.youAreNarrator}
          </h2>
          <p className="text-white/60 font-sans text-xs md:text-sm uppercase tracking-[0.15em] mt-4 font-medium">
            {t.game.narratorSubtitle}
          </p>
        </div>
      ) : (
        <div
          className={`backdrop-blur-2xl border p-6 md:p-8 rounded-2xl md:rounded-3xl text-center w-full max-w-md shadow-2xl transition-all duration-300 ${theme.cardBg} ${theme.accentBorder}`}
        >
          <h2
            className={`text-lg md:text-xl text-white mb-2 font-cinzel font-bold tracking-[0.2em] uppercase ${theme.accentText}`}
          >
            {t.game.waitingNarrator}
          </h2>
          <p className="text-white/60 font-sans text-sm md:text-base tracking-wider mt-4 flex items-center justify-center gap-1.5 flex-wrap">
            <span
              style={{ color: narrator?.color }}
              className={`font-cinzel font-bold uppercase tracking-wider text-xs md:text-sm px-3 py-1 rounded-md shadow-inner ${theme.innerCardBg}`}
            >
              {narrator?.name}
            </span>
            <span className="uppercase tracking-[0.1em] font-sans text-[10px] md:text-xs font-medium">
              {t.game.narratorChoosingCard}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Others Choosing View
// -----------------------------------------------------------------------------

interface OthersChoosingViewProps {
  gameState: GameState;
  isNarrator: boolean;
  hasPlayed: boolean;
}

export const OthersChoosingView: React.FC<OthersChoosingViewProps> = ({
  gameState,
  isNarrator,
  hasPlayed,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 animate-fade-in w-full max-w-7xl z-20 pointer-events-auto">
      {/* Clue Card */}
      <div
        className={`backdrop-blur-2xl border px-10 md:px-14 py-5 md:py-7 rounded-2xl md:rounded-[2rem] text-center inline-flex flex-col items-center justify-center w-auto min-w-[280px] max-w-[90vw] transition-all duration-300 ${theme.cardBg} ${theme.accentBorder}`}
      >
        <p className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-[0.4em] mb-2 md:mb-3 font-sans font-bold">
          {t.game.theClueIs}
        </p>
        <h2
          className={`text-2xl md:text-4xl font-cinzel font-bold tracking-wider leading-tight ${theme.accentText}`}
        >
          "{gameState.currentClue}"
        </h2>
      </div>

      {/* Cards on table (face down) */}
      {gameState.tableCards.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-2 w-full px-4 md:px-8 max-w-7xl mx-auto">
          {gameState.tableCards.map((tc, i) => (
            <div
              key={tc.orderId}
              className="animate-zoom-in shrink-0 w-[140px] sm:w-[160px] md:w-[calc(20%-1.2rem)] max-w-[224px]"
              style={{
                animationDelay: `${i * 0.08}s`,
                animationFillMode: 'both',
              }}
            >
              <GameCard
                card={{ id: -1, imageUrl: '/cards/new/back_001.avif' }}
                size="table"
                disabled
                className="shadow-2xl brightness-90 contrast-125 !w-full !h-auto aspect-[2/3]"
              />
            </div>
          ))}
        </div>
      )}

      {/* Status message */}
      <div className="text-center pt-2">
        {!isNarrator && hasPlayed && (
          <p
            className={`font-sans text-xs md:text-sm flex items-center gap-3 justify-center tracking-[0.2em] uppercase font-bold ${theme.accentText}`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse bg-current`}
            ></span>
            {t.game.cardSent}
          </p>
        )}
        {isNarrator && (
          <p className="text-white/40 font-sans text-xs md:text-sm tracking-[0.2em] uppercase font-medium">
            {t.game.playersChoosing}
          </p>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Voting View
// -----------------------------------------------------------------------------

interface VotingViewProps {
  gameState: GameState;
  isNarrator: boolean;
  hasVoted: boolean;
  selectedCard: string | null;
  onCardSelect: (cardId: string) => void;
  tableMobileView: 'row' | 'grid-1' | 'grid-2';
  setTableMobileView: (layout: 'row' | 'grid-1' | 'grid-2') => void;
  isHost: boolean;
}

export const VotingView: React.FC<VotingViewProps> = ({
  gameState,
  isNarrator,
  hasVoted,
  selectedCard,
  onCardSelect,
  tableMobileView,
  setTableMobileView,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in w-full max-w-7xl pointer-events-auto z-20">
      {/* Clue Card */}
      <div
        className={`backdrop-blur-2xl border px-10 md:px-14 py-5 md:py-6 rounded-2xl md:rounded-[2rem] text-center mx-auto inline-flex flex-col items-center justify-center w-auto min-w-[280px] max-w-[90vw] transition-all duration-300 ${theme.cardBg} ${theme.accentBorder}`}
      >
        <p className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-[0.4em] mb-2 font-sans font-bold">
          {t.game.theClueIs}
        </p>
        <h2
          className={`text-2xl md:text-4xl font-cinzel font-bold tracking-wider px-6 leading-tight ${theme.accentText}`}
        >
          "{gameState.currentClue}"
        </h2>
      </div>

      {/* Table Cards Header with View Toggles (Mobile Only) */}
      <div className="w-full md:hidden flex justify-between items-center px-4 mt-2 mb-[-1rem]">
        <span className="text-white/50 text-[10px] uppercase font-sans font-bold tracking-[0.2em]">
          {t.game.tableCards}
        </span>
        <div
          className={`flex rounded-xl border border-white/10 p-1 backdrop-blur-sm ${theme.innerCardBg}`}
        >
          <button
            type="button"
            onClick={() => setTableMobileView('row')}
            className={`p-2 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${tableMobileView === 'row' ? theme.accentText : 'text-white/40 hover:text-white/80'}`}
            aria-label={t.game.viewCarousel}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="3" width="6" height="18" rx="1" ry="1" />
              <rect x="18" y="5" width="3" height="14" rx="1" ry="1" />
              <rect x="3" y="5" width="3" height="14" rx="1" ry="1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setTableMobileView('grid-2')}
            className={`p-2 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${tableMobileView === 'grid-2' ? theme.accentText : 'text-white/40 hover:text-white/80'}`}
            aria-label={t.game.viewGrid2}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" ry="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" ry="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" ry="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" ry="1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setTableMobileView('grid-1')}
            className={`p-2 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${tableMobileView === 'grid-1' ? theme.accentText : 'text-white/40 hover:text-white/80'}`}
            aria-label={t.game.viewGrid1}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cards on table (face up) */}
      <div
        className={`
        ${
          tableMobileView === 'row'
            ? 'w-full flex md:flex-wrap overflow-x-auto md:overflow-visible hide-scrollbar snap-x snap-mandatory px-4 py-8 md:p-0 md:justify-center md:gap-6 md:px-8 md:max-w-7xl md:mx-auto'
            : tableMobileView === 'grid-2'
              ? 'w-full grid grid-cols-2 gap-4 px-4 overflow-y-auto max-h-[50vh] pb-8 hide-scrollbar md:flex md:flex-wrap md:overflow-visible md:max-h-none md:p-0 md:justify-center md:gap-6 md:px-8 md:max-w-7xl md:mx-auto'
              : 'w-full flex flex-col items-center gap-6 px-4 overflow-y-auto max-h-[60vh] pb-8 hide-scrollbar md:flex md:flex-wrap md:flex-row md:overflow-visible md:max-h-none md:p-0 md:justify-center md:gap-6 md:px-8 md:max-w-7xl md:mx-auto'
        }
      `}
      >
        {gameState.tableCards.map((tc) => {
          const isSelected = selectedCard === tc.card.id.toString();
          const canVoteThisCard = !isNarrator && !hasVoted && !tc.isMine;
          return (
            <div
              key={tc.orderId}
              className={`
                transition-all duration-300 relative group shrink-0
                ${tableMobileView === 'row' ? 'snap-center snap-always pr-6 md:pr-0 last:pr-0' : ''}
                ${isSelected ? 'z-20 scale-[1.02]' : 'z-10'}
                ${!isMobile || tableMobileView === 'row' ? 'w-[160px] md:w-[calc(20%-1.2rem)] max-w-[224px]' : 'w-full'}
              `}
            >
              <GameCard
                card={tc.card}
                size={
                  !isMobile
                    ? 'table'
                    : tableMobileView === 'grid-2'
                      ? 'sm'
                      : tableMobileView === 'grid-1'
                        ? 'lg'
                        : 'table'
                }
                isSelected={isSelected}
                disabled={!canVoteThisCard}
                dimWhenDisabled={!tc.isMine}
                onClick={
                  canVoteThisCard
                    ? () => onCardSelect(tc.card.id.toString())
                    : undefined
                }
                className={`
                  ${tc.isMine ? 'ring-2 ring-orange-500/70 shadow-[0_0_12px_rgba(249,115,22,0.25)]' : ''}
                  ${!isSelected && canVoteThisCard && 'group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]'}
                  ${isSelected ? 'shadow-2xl' : 'shadow-xl'}
                  ${!isMobile || tableMobileView === 'row' ? '!w-full !h-auto aspect-[2/3]' : ''}
                `}
              />
            </div>
          );
        })}
      </div>

      {/* Status indicator */}
      <div className="text-center w-full max-w-sm px-4 pt-4 shrink-0">
        <div
          className={`w-full py-3.5 px-6 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] text-sm md:text-base flex items-center justify-center gap-2 border shadow-xl ${theme.innerCardBg}`}
        >
          {hasVoted ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-400"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>{' '}
              <span className="text-white">VOTOU</span>
            </>
          ) : (
            <>
              <span
                className={`w-2 h-2 rounded-full animate-pulse bg-current ${theme.accentText}`}
              ></span>{' '}
              {t.game.playersVoting}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
