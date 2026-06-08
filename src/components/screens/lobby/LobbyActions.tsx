import React, { useState } from 'react';
import { Player } from '../../../types';
import { GAME_CONFIG } from '../../../constants';
import { useTranslation } from '../../../i18n/index.tsx';

interface LobbyActionsProps {
  isHost: boolean;
  canStart: boolean;
  activePlayersCount: number;
  maxPlayersForDeck: number;
  currentPlayer: Player | undefined;
  onStartGame: () => void;
  setIsMobileOptionsOpen: (isOpen: boolean) => void;
  onToggleSpectator?: (targetId: string) => void;
  onRequestPlay?: () => void;
  onLeaveRoom: () => void;
}

export const LobbyActions: React.FC<LobbyActionsProps> = ({
  isHost,
  canStart,
  activePlayersCount,
  maxPlayersForDeck,
  currentPlayer,
  onStartGame,
  setIsMobileOptionsOpen,
  onToggleSpectator,
  onRequestPlay,
  onLeaveRoom,
}) => {
  const { t } = useTranslation();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleSpectator = (targetId: string) => {
    if (isToggling || !onToggleSpectator) return;
    setIsToggling(true);
    onToggleSpectator(targetId);
    setTimeout(() => {
      setIsToggling(false);
    }, 800);
  };

  const handleRequestPlay = () => {
    if (isToggling || !onRequestPlay) return;
    setIsToggling(true);
    onRequestPlay();
    setTimeout(() => {
      setIsToggling(false);
    }, 800);
  };

  return (
    <>
      <div className="space-y-3.5">
        {isHost ? (
          <>
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`w-full py-2 md:py-2.5 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] text-xs md:text-sm transition-all duration-300 ${
                canStart
                  ? 'bg-gradient-to-r from-amber-200 to-amber-400 text-black hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(251,191,36,0.35)]'
                  : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
              }`}
            >
              {activePlayersCount > maxPlayersForDeck 
                ? t.lobby.lobbyFull 
                : canStart ? t.lobby.startGame : t.lobby.minPlayers(GAME_CONFIG.MIN_PLAYERS)}
            </button>

            <button
              onClick={() => setIsMobileOptionsOpen(true)}
              className="lg:hidden w-full bg-[#1A1A1A]/80 border border-amber-500/30 text-amber-300 py-2 md:py-2.5 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] text-xs md:text-sm transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:bg-amber-500/10 hover:border-amber-400"
            >
              {t.lobby.settings}
            </button>

            {onToggleSpectator && currentPlayer && (
              <button
                onClick={() => handleToggleSpectator(currentPlayer.id)}
                disabled={isToggling || (currentPlayer.isSpectator && activePlayersCount >= maxPlayersForDeck)}
                className={`w-full bg-white/5 border border-white/10 text-blue-300/80 hover:text-blue-300 py-2 md:py-2.5 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] text-xs md:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  isToggling || (currentPlayer.isSpectator && activePlayersCount >= maxPlayersForDeck)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-500/10 hover:scale-[1.01]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                {currentPlayer.isSpectator ? (activePlayersCount < maxPlayersForDeck ? t.lobby.enterAsPlayer : t.lobby.lobbyFull) : t.lobby.becomeSpectator}
              </button>
            )}
          </>
        ) : currentPlayer?.isSpectator ? (
          <div className="space-y-3">
            {onRequestPlay && (
              <button
                onClick={handleRequestPlay}
                disabled={isToggling || activePlayersCount >= maxPlayersForDeck}
                className={`w-full py-2 md:py-2.5 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] text-xs md:text-sm transition-all duration-300 ${
                  !isToggling && activePlayersCount < maxPlayersForDeck
                    ? 'bg-gradient-to-r from-amber-200 to-amber-400 text-black hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(251,191,36,0.35)]'
                    : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                }`}
              >
                {activePlayersCount < maxPlayersForDeck ? t.lobby.enterAsPlayer : t.lobby.lobbyFull}
              </button>
            )}
            <div className="w-full bg-white/5 border border-white/10 text-blue-300/80 py-2 md:py-2.5 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] text-xs md:text-sm flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {t.lobby.watchingAsSpectator}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center py-2 md:py-2.5 text-white/40 bg-[#1A1A1A]/40 rounded-xl border border-white/10 font-cinzel font-bold uppercase tracking-widest text-xs md:text-sm">
              <span className="w-2 h-2 bg-amber-400/80 rounded-full inline-block animate-pulse mr-3 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              {t.lobby.waitingHost}
            </div>
            {onToggleSpectator && currentPlayer && (
              <button
                onClick={() => handleToggleSpectator(currentPlayer.id)}
                disabled={isToggling}
                className={`w-full bg-white/5 border border-white/10 text-blue-300/80 hover:text-blue-300 py-2 md:py-2.5 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] text-xs md:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  isToggling
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-500/10 hover:scale-[1.01]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                {t.lobby.becomeSpectator}
              </button>
            )}
          </div>
        )}
        <button
          onClick={onLeaveRoom}
          className="w-full bg-transparent border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/5 hover:border-white/20 py-2 md:py-2.5 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] text-xs md:text-sm transition-all duration-200"
        >
          {t.lobby.leaveRoom}
        </button>
      </div>
    </>
  );
};
