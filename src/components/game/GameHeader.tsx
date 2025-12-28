import React from 'react';
import { GameState, GamePhase } from '../../types';

interface GameHeaderProps {
  gameState: GameState;
  currentPlayerId: string;
  onLeaveRoom: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameState,
  currentPlayerId,
  onLeaveRoom,
}) => {
  const narrator = gameState.players[gameState.narratorIndex];
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);

  const phaseLabels: Record<GamePhase, string> = {
    [GamePhase.LOBBY]: 'Lobby',
    [GamePhase.NARRATOR_CHOOSING]: 'Narrador Escolhendo',
    [GamePhase.OTHERS_CHOOSING]: 'Escolhendo Cartas',
    [GamePhase.VOTING]: 'Votação',
    [GamePhase.RESULTS]: 'Resultados',
    [GamePhase.GAME_OVER]: 'Fim de Jogo',
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Esquerda: Scores */}
        <div className="flex items-center gap-2">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className={`
                w-9 h-9 rounded-full flex items-center justify-center 
                text-xs font-bold text-white border-2 transition-all
                ${player.id === currentPlayerId ? 'border-white scale-110' : 'border-transparent opacity-60'}
                ${player.id === narrator?.id ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-900' : ''}
              `}
              style={{ backgroundColor: player.color }}
              title={`${player.name}: ${player.score} pts`}
            >
              {player.score}
            </div>
          ))}
        </div>

        {/* Centro: Fase */}
        <div className="text-center">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">
            {phaseLabels[gameState.phase]}
          </div>
          {gameState.currentClue && (
            <div className="text-amber-400 text-sm font-medium italic max-w-[150px] truncate">
              "{gameState.currentClue}"
            </div>
          )}
        </div>

        {/* Direita: Room code e sair */}
        <div className="flex items-center gap-3">
          <span className="text-slate-600 text-xs font-mono">
            {gameState.roomCode}
          </span>
          <button
            onClick={onLeaveRoom}
            className="text-slate-500 hover:text-red-400 text-xs transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};
