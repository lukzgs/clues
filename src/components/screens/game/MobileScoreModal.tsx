import type React from 'react';
import { useTranslation } from '../../../i18n/index.tsx';
import { useTheme } from '../../../providers/ThemeProvider';
import { GamePhase, type GameState, type Player } from '../../../types';

interface MobileScoreModalProps {
  gameState: GameState;
  currentPlayer: Player | undefined;
  isMobileScoreOpen: boolean;
  setIsMobileScoreOpen: (open: boolean) => void;
  isHost: boolean;
  onKickPlayer?: (targetId: string) => void;
  hasChosenCard: (playerId: string) => boolean;
  hasVoted: (playerId: string) => boolean;
}

export const MobileScoreModal: React.FC<MobileScoreModalProps> = ({
  gameState,
  currentPlayer,
  isMobileScoreOpen,
  setIsMobileScoreOpen,
  isHost,
  onKickPlayer,
  hasChosenCard,
  hasVoted,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  if (!isMobileScoreOpen) return null;

  const activePlayers = gameState.players
    .filter((p) => !p.isSpectator)
    .sort((a, b) => b.score - a.score);
  const spectators = gameState.players.filter((p) => p.isSpectator);

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setIsMobileScoreOpen(false)}
      ></div>
      <div
        className={`backdrop-blur-2xl border ring-1 ring-white/10 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 transition-all ${theme.cardBg} ${theme.accentBorder}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <h2
            className={`font-cinzel font-bold text-lg tracking-widest uppercase flex items-center gap-2 ${theme.accentText}`}
          >
            <svg
              width="18"
              height="18"
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
            {t.lobby.players}
          </h2>
          <button
            onClick={() => setIsMobileScoreOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activePlayers.map((player) => {
            const isNarrator =
              player.id === gameState.players[gameState.narratorIndex]?.id;
            const isCurrent = player.id === currentPlayer?.id;
            const chosen = hasChosenCard(player.id);
            const voted = hasVoted(player.id);

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isCurrent
                    ? `${theme.innerCardBg} ${theme.accentBorder}`
                    : isNarrator
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : `${theme.innerCardBg} border-white/5`
                }`}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-cinzel font-bold text-xl shrink-0 shadow-lg border border-white/10"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-cinzel font-bold text-base truncate ${isCurrent ? theme.accentText : 'text-white'}`}
                    >
                      {player.name}
                    </span>
                    {isNarrator && (
                      <span className="bg-purple-500 text-white text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.4)] shrink-0">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        NARRADOR
                      </span>
                    )}
                    {player.isHost && !isNarrator && (
                      <span
                        className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold border shrink-0 ${theme.accentBgLight} ${theme.accentText} ${theme.accentBorder}`}
                      >
                        Host
                      </span>
                    )}
                    {!player.isConnected && !player.isBot && (
                      <span className="bg-red-500/20 text-red-400 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold border border-red-500/30 shrink-0">
                        Off
                      </span>
                    )}
                  </div>
                  <div className="text-white/50 text-xs font-sans tracking-wide mt-1 flex items-center gap-1.5">
                    <span
                      className={`tabular-nums font-sans font-medium text-sm ${theme.accentText}`}
                    >
                      {player.score}
                    </span>{' '}
                    {t.lobby.points}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <div className="flex flex-col items-end gap-1">
                    {gameState.phase === GamePhase.OTHERS_CHOOSING &&
                      !isNarrator && (
                        <div
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${chosen ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/30 border border-white/10'}`}
                        >
                          {chosen ? 'PRONTO' : 'ESCOLHENDO CARTA'}
                        </div>
                      )}
                    {gameState.phase === GamePhase.VOTING && !isNarrator && (
                      <div
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${voted ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-white/30 border border-white/10'}`}
                      >
                        {voted ? 'VOTOU' : 'VOTANDO'}
                      </div>
                    )}
                  </div>
                  {/* Host kick action */}
                  {isHost &&
                    player.id !== currentPlayer?.id &&
                    onKickPlayer && (
                      <button
                        onClick={() => onKickPlayer(player.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/20 hover:text-red-400 hover:bg-red-500/20 transition-colors ml-1"
                        title="Remove player"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    )}
                </div>
              </div>
            );
          })}

          {spectators.length > 0 && (
            <div className="pt-4 mt-4 border-t border-white/10">
              <h3 className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-sans font-bold mb-3 flex items-center gap-1.5 px-1">
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
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                {t.lobby.spectators}
              </h3>
              <div className="flex flex-wrap gap-2 px-1">
                {spectators.map((spec) => (
                  <div
                    key={spec.id}
                    className={`border rounded-lg px-2.5 py-1.5 flex items-center gap-2 ${theme.innerCardBg}`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: spec.color }}
                    />
                    <span className="text-white/60 text-[11px] font-sans truncate max-w-[100px]">
                      {spec.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
