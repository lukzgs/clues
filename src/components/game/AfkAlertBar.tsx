import React, { useEffect, useState } from 'react';
import { GameState, GamePhase } from '../../types';
import GAME_CONFIG from '../../../game.config.json';

interface AfkAlertBarProps {
  gameState: GameState;
  voteKickAfk: () => void;
  currentPlayerId: string;
}

export function AfkAlertBar({ gameState, voteKickAfk, currentPlayerId }: AfkAlertBarProps) {
  const [timeLeft, setTimeLeft] = useState<number>(GAME_CONFIG.PHASE_TIMEOUT_MS);
  
  // As fases LOBBY e GAME_OVER não tem timeout
  const isActivePhase = gameState.phase !== GamePhase.LOBBY && gameState.phase !== GamePhase.GAME_OVER;

  useEffect(() => {
    if (!isActivePhase || !gameState.phaseStartTime) return;

    // Fast interval for smooth progress bar
    const interval = setInterval(() => {
      const elapsed = Date.now() - gameState.phaseStartTime;
      const remaining = Math.max(0, GAME_CONFIG.PHASE_TIMEOUT_MS - elapsed);
      setTimeLeft(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.phaseStartTime, isActivePhase]);

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
          style={{ width: `${(timeLeft / GAME_CONFIG.PHASE_TIMEOUT_MS) * 100}%` }}
        />
      </div>
    );
  }

  // Timer expirou -> Mostra o modal superior
  return (
    <div className="fixed top-0 left-0 w-full z-[100] flex justify-center p-4 pointer-events-none animate-in slide-in-from-top-4">
      <div className="bg-red-950/90 backdrop-blur-md border border-red-500/50 rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row items-center gap-4 max-w-2xl w-full pointer-events-auto">
        <div className="flex items-center gap-3 text-red-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div className="flex flex-col">
            <span className="font-bold font-cinzel tracking-wider text-sm md:text-base">Tempo Esgotado</span>
            <span className="text-xs md:text-sm text-red-300/80 font-inter">
              Aguardando: {afkPlayers.map(p => p.name).join(', ')}
            </span>
          </div>
        </div>

        <div className="md:ml-auto flex items-center gap-3 w-full md:w-auto">
          {!isSpectator && !hasVoted && (
            <button
              onClick={voteKickAfk}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors font-inter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="23" y2="14"/><line x1="23" y1="8" x2="17" y2="14"/></svg>
              Expulsar AFKs
            </button>
          )}
          {(!isSpectator && hasVoted) && (
            <span className="text-red-300/70 text-sm italic whitespace-nowrap font-inter">
              Você votou
            </span>
          )}
          <div className="bg-black/40 px-3 py-1.5 rounded-lg text-sm font-medium text-red-200 whitespace-nowrap font-inter">
            Votos: {currentVotes} / {majority}
          </div>
        </div>
      </div>
    </div>
  );
}
