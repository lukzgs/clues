import { useState } from 'react';
import { useTranslation } from '../../i18n/index.tsx';
import { useTheme } from '../../providers/ThemeProvider';
import type { GameState } from '../../types';
import { Button } from '../ui/Button';
import { GameCard } from './GameCard';

interface ResultsViewProps {
  gameState: GameState;
  playerId: string;
  onNextRound: () => void;
  onLeaveRoom: () => void;
  onKickPlayer?: (targetId: string) => void;
  isHost?: boolean;
  setIsMobileScoreOpen?: (open: boolean) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  gameState,
  playerId,
  onNextRound,
  onLeaveRoom,
  setIsMobileScoreOpen,
}) => {
  const [mobileView, setMobileView] = useState<'row' | 'grid-1' | 'grid-2'>(
    'grid-2',
  );
  const { t } = useTranslation();
  const { theme } = useTheme();

  const narrator = gameState.players[gameState.narratorIndex];
  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const isReady = (gameState.playersWhoReadied ?? []).includes(playerId);
  const readyCount = (gameState.playersWhoReadied ?? []).length;
  const activePlayersCount = gameState.players.filter(
    (p) => !p.isSpectator,
  ).length;

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 py-4 md:py-6 animate-fade-in w-full max-w-5xl mx-auto">
      {/* Mobile Scores Trigger */}
      {setIsMobileScoreOpen && (
        <div className="w-full flex justify-end px-4 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileScoreOpen(true)}
            className={`px-3 py-1.5 rounded-xl border border-white/10 text-xs font-cinzel font-bold flex items-center gap-2 ${theme.innerCardBg} ${theme.accentText} focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            {t.results.currentScore}
          </button>
        </div>
      )}

      {/* Clue Header */}
      <div
        className={`text-center backdrop-blur-2xl border px-8 md:px-12 py-5 rounded-2xl md:rounded-3xl inline-flex flex-col items-center justify-center w-auto min-w-[280px] max-w-[90vw] transition-all duration-300 shadow-2xl ${theme.cardBg} ${theme.accentBorder}`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] font-sans font-bold">
            {t.results.theClueWas}
          </p>
          {narrator && (
            <span
              className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border ${theme.accentBgLight} ${theme.accentText} ${theme.accentBorder}`}
            >
              {narrator.name}
            </span>
          )}
        </div>
        <h2
          className={`text-2xl md:text-3xl font-cinzel font-bold tracking-wider ${theme.accentText}`}
        >
          "{gameState.currentClue}"
        </h2>
      </div>

      {/* Table Cards Section */}
      <div className="w-full flex flex-col items-center gap-6">
        {/* Table Cards Header with Mobile View Toggles */}
        <div className="w-full flex justify-between items-center px-4">
          <span className="text-white/50 text-[10px] uppercase font-sans font-bold tracking-[0.2em]">
            {t.results.tableResults}
          </span>
          <div
            className={`md:hidden flex rounded-xl border border-white/10 p-1 backdrop-blur-sm ${theme.innerCardBg}`}
          >
            <button
              type="button"
              onClick={() => setMobileView('row')}
              className={`p-2 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${mobileView === 'row' ? theme.accentText : 'text-white/40 hover:text-white/80'}`}
              aria-label={t.game.viewCarousel}
            >
              <svg
                width="16"
                height="16"
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
              onClick={() => setMobileView('grid-2')}
              className={`p-2 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${mobileView === 'grid-2' ? theme.accentText : 'text-white/40 hover:text-white/80'}`}
              aria-label={t.game.viewGrid2}
            >
              <svg
                width="16"
                height="16"
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
              onClick={() => setMobileView('grid-1')}
              className={`p-2 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${mobileView === 'grid-1' ? theme.accentText : 'text-white/40 hover:text-white/80'}`}
              aria-label={t.game.viewGrid1}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="4" width="16" height="5" rx="1" ry="1" />
                <rect x="4" y="13" width="16" height="5" rx="1" ry="1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cards Display Grid / Flex */}
        <div
          className={`
            w-full px-4 md:px-0
            ${mobileView === 'row' ? 'flex overflow-x-auto snap-x snap-mandatory pb-6 gap-5 hide-scrollbar -mx-4 px-6' : ''}
            ${mobileView === 'grid-2' ? 'grid grid-cols-2 gap-4 pb-4' : ''}
            ${mobileView === 'grid-1' ? 'flex flex-col gap-6 pb-4' : ''}
            md:flex md:flex-wrap md:justify-center md:gap-6 md:w-full md:overflow-visible md:px-4
          `}
        >
          {gameState.tableCards.map((tableCard) => {
            const owner = gameState.players.find(
              (p) => p.id === tableCard.playerId,
            );
            const isNarratorCard = tableCard.playerId === narrator?.id;
            const votesOnThis = Object.entries(gameState.votes)
              .filter(([_, orderId]) => orderId === tableCard.orderId)
              .map(([voterId]) =>
                gameState.players.find((p) => p.id === voterId),
              )
              .filter(Boolean);

            return (
              <div
                key={tableCard.orderId}
                className={`
                  flex flex-col items-center gap-3 shrink-0
                  ${mobileView === 'row' ? 'w-[75vw] max-w-[260px] snap-center snap-always' : ''}
                  ${mobileView === 'grid-2' ? 'w-full' : ''}
                  ${mobileView === 'grid-1' ? 'w-full max-w-[340px] mx-auto' : ''}
                  md:w-[200px] lg:w-[220px]
                `}
              >
                {/* Card Owner Pill */}
                <div
                  className={`px-3 py-1.5 z-10 w-full text-center truncate rounded-full text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 shadow-lg border transition-all ${
                    isNarratorCard
                      ? `${theme.accentBgLight} ${theme.accentText} ${theme.accentBorder} ring-1 ring-current/20`
                      : `${theme.innerCardBg} text-white/75 border-white/10`
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-inner shrink-0"
                    style={{ backgroundColor: owner?.color }}
                  />
                  <span className="truncate">{owner?.name}</span>
                  {isNarratorCard && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className={`${theme.accentText} animate-pulse ml-0.5 shrink-0`}
                    >
                      <path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z" />
                      <line x1="2" y1="19" x2="22" y2="19" />
                    </svg>
                  )}
                </div>

                {/* Card View */}
                <div className="relative w-full flex justify-center">
                  <GameCard
                    card={tableCard.card}
                    size="full"
                    className={`
                      ${isNarratorCard ? `ring-2 ${theme.accentBorder} shadow-2xl` : 'opacity-90'}
                      !w-full !h-auto aspect-[2/3]
                    `}
                  />
                </div>

                {/* Received Votes Chips */}
                <div className="flex flex-wrap justify-center items-center gap-1.5 min-h-[32px] w-full px-1">
                  {votesOnThis.length > 0 ? (
                    votesOnThis.map(
                      (voter) =>
                        voter && (
                          <div
                            key={voter.id}
                            className="px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-bold text-white shadow-md border border-white/20 transition-transform hover:scale-105"
                            style={{ backgroundColor: voter.color }}
                            title={`${voter.name} votou nesta carta`}
                          >
                            <span>{voter.name}</span>
                          </div>
                        ),
                    )
                  ) : (
                    <span className="text-[10px] text-white/20 uppercase tracking-widest font-sans font-medium">
                      0 votos
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button Bar */}
        <div className="w-full max-w-md space-y-3 pt-2">
          {!isReady && !currentPlayer?.isSpectator ? (
            <Button
              variant="primary"
              size="lg"
              onClick={onNextRound}
              className="w-full"
            >
              {gameState.winner ? t.results.finishGame : t.results.nextRound}
            </Button>
          ) : currentPlayer?.isSpectator ? (
            <div
              className={`text-center py-3.5 text-white/50 rounded-xl border border-white/10 font-sans text-sm tracking-wide flex items-center justify-center gap-2 ${theme.innerCardBg}`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-400/60"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {t.results.watchingSpectator}
            </div>
          ) : (
            <div
              className={`flex items-center justify-center py-3.5 px-6 text-white/70 rounded-xl border border-white/10 shadow-inner ${theme.innerCardBg}`}
            >
              <span
                className={`w-2 h-2 rounded-full inline-block animate-pulse mr-3 shrink-0 ${theme.accentText} bg-current`}
              />
              <span className="font-cinzel text-xs md:text-sm uppercase tracking-[0.1em] font-bold mt-0.5 truncate">
                {t.results.waitingPlayers}
              </span>
              <span
                className={`text-[10px] md:text-xs uppercase tracking-widest ml-3 font-black shrink-0 border border-white/10 px-2 py-0.5 rounded-full ${theme.accentText}`}
              >
                {readyCount}/{activePlayersCount}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="md"
            onClick={onLeaveRoom}
            className="w-full"
          >
            {t.results.leaveRoom}
          </Button>
        </div>
      </div>
    </div>
  );
};
