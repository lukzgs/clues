import type React from 'react';
import { useState } from 'react';
import { GAME_CONFIG } from '../../../constants';
import { useTranslation } from '../../../i18n/index.tsx';
import { useTheme } from '../../../providers/ThemeProvider';
import type { Player } from '../../../types';
import { Button } from '../../ui/Button';

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
  onAddBot?: () => void;
  canAddBot?: boolean;
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
  onAddBot,
  canAddBot,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
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

  const eyeIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  return (
    <div className="space-y-3">
      {isHost ? (
        <>
          <Button
            variant="primary"
            size="md"
            onClick={onStartGame}
            disabled={!canStart}
            className="w-full"
          >
            {activePlayersCount > maxPlayersForDeck
              ? t.lobby.lobbyFull
              : canStart
                ? t.lobby.startGame
                : t.lobby.minPlayers(GAME_CONFIG.MIN_PLAYERS)}
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setIsMobileOptionsOpen(true)}
            className="lg:hidden w-full"
          >
            {t.lobby.settings}
          </Button>

          {onToggleSpectator && currentPlayer && (
            <Button
              variant="glass"
              size="md"
              icon={eyeIcon}
              onClick={() => handleToggleSpectator(currentPlayer.id)}
              disabled={
                isToggling ||
                (currentPlayer.isSpectator &&
                  activePlayersCount >= maxPlayersForDeck)
              }
              className="w-full text-blue-300/80 hover:text-blue-300"
            >
              {currentPlayer.isSpectator
                ? activePlayersCount < maxPlayersForDeck
                  ? t.lobby.enterAsPlayer
                  : t.lobby.lobbyFull
                : t.lobby.becomeSpectator}
            </Button>
          )}

          {canAddBot && onAddBot && (
            <Button
              variant="glass"
              size="md"
              onClick={onAddBot}
              icon={
                <span className="text-lg leading-none font-sans font-light">
                  +
                </span>
              }
              className="w-full"
            >
              {t.lobby.addBot}
            </Button>
          )}
        </>
      ) : currentPlayer?.isSpectator ? (
        <div className="space-y-3">
          {onRequestPlay && (
            <Button
              variant="primary"
              size="md"
              onClick={handleRequestPlay}
              disabled={isToggling || activePlayersCount >= maxPlayersForDeck}
              className="w-full"
            >
              {activePlayersCount < maxPlayersForDeck
                ? t.lobby.enterAsPlayer
                : t.lobby.lobbyFull}
            </Button>
          )}
          <div className="w-full bg-white/5 border border-white/10 text-blue-300/80 py-3 rounded-xl font-cinzel font-bold uppercase tracking-[0.15em] text-xs md:text-sm flex items-center justify-center gap-2">
            {eyeIcon}
            {t.lobby.watchingAsSpectator}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={`text-center py-3 text-white/60 rounded-xl font-cinzel font-bold uppercase tracking-widest text-xs md:text-sm border ${theme.innerCardBg}`}
          >
            <span
              className={`w-2 h-2 rounded-full inline-block animate-pulse mr-3 ${theme.accentText} bg-current`}
            />
            {t.lobby.waitingHost}
          </div>
          {onToggleSpectator && currentPlayer && (
            <Button
              variant="glass"
              size="md"
              icon={eyeIcon}
              onClick={() => handleToggleSpectator(currentPlayer.id)}
              disabled={isToggling}
              className="w-full text-blue-300/80 hover:text-blue-300"
            >
              {t.lobby.becomeSpectator}
            </Button>
          )}
        </div>
      )}

      <Button
        variant="ghost"
        size="md"
        onClick={onLeaveRoom}
        className="w-full"
      >
        {t.lobby.leaveRoom}
      </Button>
    </div>
  );
};
