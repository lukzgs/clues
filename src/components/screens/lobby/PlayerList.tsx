import React from 'react';
import { GameState, Player } from '../../../types';
import { GAME_CONFIG } from '../../../constants';
import { useTranslation } from '../../../i18n/index.tsx';

interface PlayerListProps {
  gameState: GameState;
  currentPlayer: Player | undefined;
  maxPlayersForDeck: number;
  onToggleSpectator?: (targetId: string) => void;
  onKickPlayer?: (targetId: string) => void;
  onRemoveBot?: (botId: string) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  gameState,
  currentPlayer,
  maxPlayersForDeck,
  onToggleSpectator,
  onKickPlayer,
  onRemoveBot,
}) => {
  const { t } = useTranslation();
  
  const activePlayers = gameState.players.filter(p => !p.isSpectator);
  const spectators = gameState.players.filter(p => p.isSpectator);
  const isHost = currentPlayer?.isHost ?? false;

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col">
      <p className="text-white/40 text-[11px] md:text-xs uppercase tracking-[0.25em] mb-4 pl-2 font-sans font-semibold shrink-0">
        {t.lobby.players} ({activePlayers.length}/{maxPlayersForDeck}){spectators.length > 0 && <span className="text-white/25"> · {spectators.length} {spectators.length !== 1 ? t.lobby.spectators : t.lobby.spectator_one}</span>}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
        {gameState.players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 h-[72px] md:h-[76px] shadow-sm ${
              player.id === currentPlayer?.id
                ? 'bg-amber-500/10 border-amber-500/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]'
                : player.isSpectator
                ? 'bg-[#1A1A1A]/60 border-white/5 opacity-60'
                : 'bg-[#1A1A1A]/60 border-white/10 hover:border-white/30 hover:bg-[#1A1A1A]/80'
            }`}
          >
            <div
              className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-white font-cinzel font-bold text-lg md:text-xl shrink-0 shadow-lg border border-white/10 ${player.isSpectator ? 'grayscale-[50%]' : ''}`}
              style={{ backgroundColor: player.color }}
            >
              {player.isSpectator ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              ) : player.isBot ? 'B' : player.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-white font-cinzel font-bold text-sm md:text-base block truncate tracking-wide">
                {player.name}
              </span>
              <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
                {player.isHost && (
                  <span className="text-amber-400 text-[10px] font-cinzel font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(251,191,36,0.5)] shrink-0">
                    {t.lobby.host}
                  </span>
                )}
                {player.isSpectator && (
                  <span className="text-blue-400/70 text-[10px] font-sans font-bold uppercase tracking-widest shrink-0">
                    {t.common.spectator}
                  </span>
                )}
                {!player.isConnected && !player.isBot && (
                  <span className="text-red-400 text-[10px] font-sans uppercase tracking-widest shrink-0">
                    {t.common.disconnected}
                  </span>
                )}
              </div>
            </div>

            {/* Host actions: toggle spectator + kick (not on self) */}
            {isHost && player.id !== currentPlayer?.id && (
              <div className="flex items-center gap-1 shrink-0">
                {/* Toggle spectator */}
                {onToggleSpectator && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSpectator(player.id); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-300 ${
                      player.isSpectator
                        ? 'text-blue-400 bg-blue-500/20 hover:text-blue-300 hover:bg-blue-500/30'
                        : 'text-white/50 bg-white/5 hover:text-blue-400 hover:bg-blue-500/20'
                    }`}
                    title={player.isSpectator ? 'Make player' : 'Make spectator'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                )}
                {/* Kick */}
                {onKickPlayer && (
                  <button
                    onClick={() => onKickPlayer(player.id)}
                    className="text-white/20 hover:text-red-400 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-500/10 transition-all duration-300"
                    title="Remove player"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Self-toggle spectator for players on their own card */}
            {player.id === currentPlayer?.id && !player.isBot && onToggleSpectator && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSpectator(player.id); }}
                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-300 shrink-0 ${
                  player.isSpectator
                    ? 'text-blue-400 bg-blue-500/20 hover:text-blue-300 hover:bg-blue-500/30'
                    : 'text-white/50 bg-white/5 hover:text-blue-400 hover:bg-blue-500/20'
                }`}
                title={player.isSpectator ? t.lobby.enterAsPlayer : t.lobby.becomeSpectator}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            )}

            {/* Bot remove (legacy) */}
            {GAME_CONFIG.ENABLE_BOTS && player.isBot && isHost && onRemoveBot && !onKickPlayer && (
              <button
                onClick={() => onRemoveBot(player.id)}
                className="text-white/20 hover:text-red-400 text-lg w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-500/10 transition-all duration-300 mr-1"
                title="Remove bot"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

        ))}
      </div>
    </div>
  );
};
