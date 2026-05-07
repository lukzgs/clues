import React, { useEffect, useState } from 'react';
import { GameState, GamePhase } from '../../types';
import GAME_CONFIG from '../../../game.config.json';
import { useTranslation } from '../../i18n/index.tsx';

interface AfkAlertBarProps {
  gameState: GameState;
  voteKickAfk: () => void;
  currentPlayerId: string;
}

export function AfkAlertBar({ gameState, voteKickAfk, currentPlayerId }: AfkAlertBarProps) {
  // As fases LOBBY e GAME_OVER não tem timeout
  const isActivePhase = gameState.phase !== GamePhase.LOBBY && gameState.phase !== GamePhase.GAME_OVER;

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

  // Descobre quem está AFK
  const activePlayers = gameState.players.filter(p => !p.isSpectator);
  let afkPlayers: typeof activePlayers = [];

  switch (gameState.phase) {
    case GamePhase.NARRATOR_CHOOSING:
      const narrator = gameState.players[gameState.narratorIndex];
      if (narrator && !narrator.isSpectator) afkPlayers = [narrator];
      break;
    case GamePhase.OTHERS_CHOOSING:
      const narratorId = gameState.players[gameState.narratorIndex]?.id;
      afkPlayers = activePlayers.filter(p => 
        p.id !== narratorId && 
        !gameState.playersWhoPlayed?.includes(p.id)
      );
      break;
    case GamePhase.VOTING:
      const narrId = gameState.players[gameState.narratorIndex]?.id;
      afkPlayers = activePlayers.filter(p => 
        p.id !== narrId && 
        gameState.votes && gameState.votes[p.id] === undefined
      );
      break;
    case GamePhase.RESULTS:
      const host = activePlayers.find(p => p.isHost);
      if (host) afkPlayers = [host];
      break;
  }

  // Se não tem ninguém AFK, não precisa mostrar
  if (afkPlayers.length === 0) return null;

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isSpectator = currentPlayer?.isSpectator || false;
  const { t } = useTranslation();
  
  const activeVoters = activePlayers.filter(p => !p.isBot);
  const majority = Math.floor(activeVoters.length / 2) + 1;
  const currentVotes = gameState.afkKickVotes?.length || 0;
  
  const hasVoted = gameState.afkKickVotes?.includes(currentPlayerId);

  const isTimeoutReached = timeLeft === 0;

  if (!isTimeoutReached) {
    // Apenas um indicador sutil visual de tempo
    return (
      <div className="fixed top-0 left-0 w-full h-1 bg-white/10 z-50">
        <div 
          className="h-full bg-white/50 transition-all duration-100 ease-linear"
          style={{ width: `${(timeLeft / currentPhaseTimeout) * 100}%` }}
        />
      </div>
    );
  }

  // Timer expirou -> Mostra o modal superior
  return (
    <div className="fixed bottom-0 md:top-0 md:bottom-auto left-0 w-full z-[100] flex justify-center p-3 md:p-4 pointer-events-none animate-in slide-in-from-bottom-4 md:slide-in-from-top-4">
      <div className="bg-red-950/90 backdrop-blur-md border border-red-500/50 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.2)] p-3 md:p-4 flex flex-col md:flex-row items-center gap-3 max-w-2xl w-full pointer-events-auto">
        <div className="flex items-center gap-3 text-red-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0 opacity-90"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div className="flex flex-col items-start text-left">
            <span className="font-bold font-cinzel tracking-[0.1em] uppercase text-[11px] md:text-sm text-red-100 leading-tight">{t.afk.timeExpired}</span>
            <span className="text-[9px] md:text-xs text-red-300/80 font-sans tracking-wide mt-0.5 leading-none">
              {t.afk.waitingFor} <span className="font-semibold text-red-200">{afkPlayers.map(p => p.name).join(', ')}</span>
            </span>
          </div>
        </div>

        <div className="md:ml-auto flex items-center justify-center gap-2 w-full md:w-auto mt-1.5 md:mt-0">
          {!isSpectator && !hasVoted && (
            <button
              onClick={voteKickAfk}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.1em] font-sans transition-colors shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="23" y2="14"/><line x1="23" y1="8" x2="17" y2="14"/></svg>
              {t.afk.kickAfk}
            </button>
          )}
          {(!isSpectator && hasVoted) && (
            <span className="flex-1 md:flex-none text-center bg-red-900/40 border border-red-500/20 px-4 py-2 rounded-xl text-red-300/80 text-[10px] md:text-xs italic uppercase tracking-[0.1em] whitespace-nowrap font-sans">
              {t.afk.youVoted}
            </span>
          )}
          <div className="bg-black/60 px-3 py-2 rounded-xl text-[10px] md:text-xs font-bold tracking-widest text-red-200 whitespace-nowrap font-sans border border-red-500/20 shadow-inner">
            {t.afk.votes} <span className="text-white ml-1">{currentVotes} / {majority}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
