import { useEffect, useState } from 'react';
import GAME_CONFIG from '../../../game.config.json';
import { useTranslation } from '../../i18n/index.tsx';
import { GamePhase, type GameState } from '../../types';

interface AfkAlertBarProps {
  gameState: GameState;
}

export function AfkAlertBar({ gameState }: AfkAlertBarProps) {
  const { t } = useTranslation();
  // As fases LOBBY e GAME_OVER não tem timeout
  const isActivePhase =
    gameState.phase !== GamePhase.LOBBY &&
    gameState.phase !== GamePhase.GAME_OVER;

  // Dynamically determine current phase timeout
  let currentPhaseTimeout = GAME_CONFIG.PHASE_TIMEOUT_MS;
  if (gameState.phaseTimeouts) {
    switch (gameState.phase) {
      case GamePhase.NARRATOR_CHOOSING:
        currentPhaseTimeout = gameState.phaseTimeouts.narrator * 1000;
        break;
      case GamePhase.OTHERS_CHOOSING:
        currentPhaseTimeout = gameState.phaseTimeouts.othersChoosing * 1000;
        break;
      case GamePhase.VOTING:
        currentPhaseTimeout = gameState.phaseTimeouts.voting * 1000;
        break;
      case GamePhase.RESULTS:
        currentPhaseTimeout = gameState.phaseTimeouts.results * 1000;
        break;
    }
  }

  const [timeLeft, setTimeLeft] = useState<number>(currentPhaseTimeout);

  useEffect(() => {
    if (!isActivePhase || !gameState.phaseStartTime) return;

    // Fast interval for smooth progress bar
    const interval = setInterval(() => {
      const elapsed = Date.now() - gameState.phaseStartTime;
      const remaining = Math.max(0, currentPhaseTimeout - elapsed);
      setTimeLeft(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.phaseStartTime, isActivePhase, currentPhaseTimeout]);

  if (!isActivePhase) return null;

  const isTimeoutReached = timeLeft === 0;

  if (isTimeoutReached) {
    return null;
  }

  // Apenas um indicador sutil visual de tempo
  return (
    <div
      role="progressbar"
      aria-label={t.game.phaseTimeRemaining}
      aria-valuemin={0}
      aria-valuemax={currentPhaseTimeout}
      aria-valuenow={timeLeft}
      className="fixed top-0 left-0 w-full h-1 bg-white/10 z-50"
    >
      <div
        className="h-full bg-white/50 transition-all duration-100 ease-linear"
        style={{ width: `${(timeLeft / currentPhaseTimeout) * 100}%` }}
      />
    </div>
  );
}
