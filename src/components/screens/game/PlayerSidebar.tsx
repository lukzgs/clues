import React from 'react';
import { GameState, Player, GamePhase } from '../../../types';
import { useTranslation } from '../../../i18n/index.tsx';

interface PlayerSidebarProps {
  gameState: GameState;
  currentPlayer: Player | undefined;
  isHost: boolean;
  canRevealResults: boolean;
  onRevealResults?: () => void;
  onKickPlayer?: (targetId: string) => void;
  hasChosenCard: (playerId: string) => boolean;
  hasVoted: (playerId: string) => boolean;
}

export const PlayerSidebar: React.FC<PlayerSidebarProps> = ({
  gameState,
  currentPlayer,
  isHost,
  canRevealResults,
  onRevealResults,
  onKickPlayer,
  hasChosenCard,
  hasVoted,
}) => {
  const { t } = useTranslation();
  const activePlayers = gameState.players.filter(p => !p.isSpectator).sort((a, b) => b.score - a.score);
  const spectators = gameState.players.filter(p => p.isSpectator);

  return (
    <div className="hidden md:flex w-72 bg-[#1A1A1A]/30 border border-white/10 rounded-2xl flex-col h-fit max-h-full shrink-0 overflow-hidden">
      <div className="p-6 pb-2 shrink-0">
        <h2 className="text-white/40 text-[11px] uppercase tracking-[0.25em] font-sans font-bold flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          {t.lobby.players}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
        {activePlayers.map((player) => {
          const isNarrator = player.id === gameState.players[gameState.narratorIndex]?.id;
          const isCurrent = player.id === currentPlayer?.id;
          const chosen = hasChosenCard(player.id);
          const voted = hasVoted(player.id);

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-3 md:px-4 rounded-2xl border w-full overflow-hidden transition-all duration-300 ${
                isCurrent 
                  ? 'bg-amber-500/10 border-amber-500/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]' 
                  : isNarrator
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-[#1A1A1A]/40 border-white/5 hover:bg-white/5'
              }`}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-cinzel font-bold text-lg shrink-0 shadow-lg border border-white/10"
                style={{ backgroundColor: player.color }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-cinzel font-bold text-sm tracking-wider truncate ${isCurrent ? 'text-amber-100' : 'text-white'}`}>
                    {player.name}
                  </span>
                  
                  {player.isHost && !isNarrator && (
                    <div
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-amber-400 shrink-0"
                      title="Host"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">
                        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
                      </svg>
                    </div>
                  )}
                  
                  {isNarrator && (
                    <div
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 shrink-0"
                      title="Narrador"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                    </div>
                  )}
                  
                  {!player.isConnected && !player.isBot && (
                    <span className="bg-red-500/20 text-red-400 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold border border-red-500/30 shrink-0">
                      Off
                    </span>
                  )}
                </div>
                
                <div className="text-white/50 text-[11px] font-sans tracking-wide mt-0.5 flex items-center gap-1.5">
                  <span className="font-mono text-amber-300 font-bold">{player.score}</span> {t.lobby.points}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {/* Host kick action */}
                {isHost && !isCurrent && onKickPlayer && (
                  <button
                    onClick={() => onKickPlayer(player.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    title="Remover jogador"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                )}


                {/* Status Indicator (Checkmark) */}
                {((gameState.phase === GamePhase.OTHERS_CHOOSING && !isNarrator) || 
                  (gameState.phase === GamePhase.VOTING && !isNarrator) || 
                  (gameState.phase === GamePhase.NARRATOR_CHOOSING && isNarrator)) && (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${
                    ((gameState.phase === GamePhase.OTHERS_CHOOSING || gameState.phase === GamePhase.NARRATOR_CHOOSING) && chosen)
                      ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.15)]'
                      : (gameState.phase === GamePhase.VOTING && voted)
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.15)]'
                        : 'bg-black/40 text-white/15 border-white/5'
                  }`}>
                    {(gameState.phase === GamePhase.OTHERS_CHOOSING && chosen) || 
                     (gameState.phase === GamePhase.VOTING && voted) || 
                     (gameState.phase === GamePhase.NARRATOR_CHOOSING && chosen) ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {spectators.length > 0 && (
          <div className="pt-4 mt-4 border-t border-white/10">
            <h3 className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-sans font-bold mb-3 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              {t.lobby.spectators}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {spectators.map(spec => (
                <div key={spec.id} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: spec.color }} />
                  <span className="text-white/60 text-[10px] font-sans truncate max-w-[80px]">{spec.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isHost && gameState.phase === GamePhase.RESULTS && canRevealResults && onRevealResults && (
        <div className="p-4 border-t border-white/10 bg-black/40 shrink-0">
          <button
            onClick={onRevealResults}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black py-3 rounded-xl font-cinzel font-bold uppercase tracking-widest text-sm transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:scale-[1.02]"
          >
            REVELAR RESULTADOS
          </button>
        </div>
      )}
    </div>
  );
};
