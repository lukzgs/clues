import React from 'react';
import { GameState } from '../../types';

interface GameOverViewProps {
  gameState: GameState;
  playerId: string;
  onRestartGame: () => void;
  onLeaveRoom: () => void;
}

export const GameOverView: React.FC<GameOverViewProps> = ({
  gameState,
  playerId,
  onRestartGame,
  onLeaveRoom,
}) => {
  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;
  const winner = gameState.players.find(p => p.name === gameState.winner);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 py-8">
      {/* Título */}
      <div className="text-center">
        <h1 className="text-6xl text-amber-400 cinzel mb-4">
          Fim de Jogo!
        </h1>
        <p className="text-2xl text-white">
          <span style={{ color: winner?.color }} className="font-bold">
            {gameState.winner}
          </span>
          {' '}venceu!
        </p>
      </div>

      {/* Placar final */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-slate-400 text-sm mb-4 text-center uppercase tracking-widest">
          Placar Final
        </h3>
        <div className="space-y-3">
          {[...gameState.players]
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div 
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  index === 0 ? 'bg-amber-500/20 border border-amber-500/30' : ''
                }`}
              >
                <span className={`text-2xl ${
                  index === 0 ? 'text-amber-400' : 
                  index === 1 ? 'text-slate-400' : 
                  index === 2 ? 'text-orange-700' : 'text-slate-600'
                }`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <div 
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                <span className="flex-1 text-white font-medium">
                  {player.name}
                  {player.id === playerId && (
                    <span className="text-slate-500 text-xs ml-1">(você)</span>
                  )}
                </span>
                <span className="text-amber-400 font-bold font-mono text-xl">
                  {player.score}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-4">
        {isHost && (
          <button
            onClick={onRestartGame}
            className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-xl font-bold cinzel transition-colors"
          >
            Jogar Novamente
          </button>
        )}
        <button
          onClick={onLeaveRoom}
          className="bg-slate-800 hover:bg-slate-700 px-8 py-4 rounded-xl text-slate-300 hover:text-white transition-colors"
        >
          Sair
        </button>
      </div>

      {!isHost && (
        <p className="text-slate-500 text-sm">
          Aguardando host decidir...
        </p>
      )}
    </div>
  );
};
