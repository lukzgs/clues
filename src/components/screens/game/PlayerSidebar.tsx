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
    <div className="hidden lg:flex w-80 bg-[#1A1A1A]/95 border-r border-white/10 flex-col h-full z-40 relative shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
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
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                isCurrent 
                  ? 'bg-amber-500/10 border-amber-500/30' 
                  : isNarrator
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-white/5 border-white/5'
              }`}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-cinzel font-bold text-lg shrink-0 shadow-lg border border-white/10"
                style={{ backgroundColor: player.color }}
              >
                {player.isBot ? 'B' : player.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-cinzel font-bold text-sm truncate ${isCurrent ? 'text-amber-300' : 'text-white'}`}>
                    {player.name}
                  </span>
                  {isNarrator && (
                    <span className="bg-purple-500 text-white text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      NARRADOR
                    </span>
                  )}
                  {player.isHost && !isNarrator && (
                    <span className="bg-amber-500 text-black text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                      Host
                    </span>
                  )}
                  {!player.isConnected && !player.isBot && (
                    <span className="bg-red-500/20 text-red-400 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold border border-red-500/30">
                      Off
                    </span>
                  )}
                </div>
                <div className="text-white/50 text-[11px] font-sans tracking-wide mt-0.5 flex items-center gap-1.5">
                  <span className="font-mono text-amber-300 font-medium">{player.score}</span> {t.lobby.points}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <div className="flex flex-col items-end gap-1">
                  {gameState.phase === GamePhase.OTHERS_CHOOSING && !isNarrator && (
                    <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${chosen ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/30 border border-white/10'}`}>
                      {chosen ? 'PRONTO' : 'ESCOLHENDO CARTA'}
                    </div>
                  )}
                  {gameState.phase === GamePhase.VOTING && !isNarrator && (
                    <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${voted ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-white/30 border border-white/10'}`}>
                      {voted ? 'VOTOU' : 'VOTANDO'}
                    </div>
                  )}
                </div>
                {/* Host kick action */}
                {isHost && player.id !== currentPlayer?.id && onKickPlayer && (
                  <button
                    onClick={() => onKickPlayer(player.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-md bg-white/5 text-white/20 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Remove player"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
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
