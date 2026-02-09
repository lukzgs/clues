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
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="flex items-center justify-between px-3 md:px-6 py-3">

        {/* Esquerda: Scores dos jogadores */}
        <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className={`
                w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center 
                text-xs md:text-sm font-bold text-white transition-all duration-200 shrink-0
                ${player.id === currentPlayerId
                  ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110'
                  : 'opacity-70 hover:opacity-100'
                }
                ${player.id === narrator?.id
                  ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-900'
                  : ''
                }
              `}
              style={{ backgroundColor: player.color }}
              title={`${player.name}: ${player.score} pts${player.id === narrator?.id ? ' (Narrador)' : ''}`}
            >
              {player.score}
            </div>
          ))}
        </div>

        {/* Centro: Fase e pista */}
        <div className="text-center flex-1 mx-4">
          <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wider font-medium">
            {phaseLabels[gameState.phase]}
          </div>
          {gameState.currentClue && (
            <div className="text-amber-400 text-sm md:text-base font-medium italic max-w-[120px] md:max-w-[200px] truncate mx-auto">
              "{gameState.currentClue}"
            </div>
          )}
        </div>

        {/* Direita: Room code e sair */}
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-slate-600 text-xs font-mono hidden sm:block">
            {gameState.roomCode}
          </span>
          <button
            onClick={onLeaveRoom}
            className="text-slate-500 hover:text-red-400 text-xs md:text-sm px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all duration-200"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};
