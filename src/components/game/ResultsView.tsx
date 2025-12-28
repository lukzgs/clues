import React from 'react';
import { GameState } from '../../types';
import { GameCard } from './GameCard';

interface ResultsViewProps {
  gameState: GameState;
  playerId: string;
  onNextRound: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  gameState,
  playerId,
  onNextRound,
}) => {
  const narrator = gameState.players[gameState.narratorIndex];
  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;

  // Encontra a carta do narrador
  const narratorCard = gameState.tableCards.find(tc => tc.playerId === narrator?.id);

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {/* Pista */}
      <div className="text-center">
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">
          A pista era
        </p>
        <h2 className="text-3xl font-bold italic text-amber-400">
          "{gameState.currentClue}"
        </h2>
      </div>

      {/* Cartas com resultados */}
      <div className="flex flex-wrap justify-center gap-6 max-w-5xl">
        {gameState.tableCards.map((tableCard) => {
          const owner = gameState.players.find(p => p.id === tableCard.playerId);
          const isNarratorCard = tableCard.playerId === narrator?.id;
          
          // Conta votos nesta carta
          const votesOnThis = Object.entries(gameState.votes)
            .filter(([_, oderId]) => oderId === tableCard.oderId)
            .map(([voterId]) => gameState.players.find(p => p.id === voterId));

          return (
            <div key={tableCard.oderId} className="flex flex-col items-center gap-3">
              <GameCard
                card={tableCard.card}
                size="md"
                isHighlighted={isNarratorCard}
                highlightColor="#f59e0b"
              />
              
              {/* Dono da carta */}
              <div 
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ 
                  backgroundColor: owner?.color,
                  color: 'white'
                }}
              >
                {owner?.name}
                {isNarratorCard && ' ★'}
              </div>

              {/* Votos recebidos */}
              <div className="flex gap-1 min-h-[24px]">
                {votesOnThis.map((voter) => voter && (
                  <div
                    key={voter.id}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: voter.color }}
                    title={`${voter.name} votou aqui`}
                  >
                    ✓
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Placar atualizado */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-slate-400 text-sm mb-4 text-center">Placar</h3>
        <div className="space-y-2">
          {[...gameState.players]
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div 
                key={player.id}
                className="flex items-center gap-3 p-2 rounded-lg"
                style={{ backgroundColor: index === 0 ? `${player.color}20` : 'transparent' }}
              >
                <span className="text-slate-600 w-4">{index + 1}.</span>
                <div 
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                <span className="flex-1 text-white">
                  {player.name}
                  {player.id === playerId && <span className="text-slate-500 text-xs ml-1">(você)</span>}
                </span>
                <span className="text-amber-400 font-bold font-mono">
                  {player.score}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Botão próxima rodada */}
      {isHost ? (
        <button
          onClick={onNextRound}
          className="bg-indigo-600 hover:bg-indigo-500 px-12 py-4 rounded-xl font-bold cinzel text-lg transition-colors"
        >
          Próxima Rodada
        </button>
      ) : (
        <p className="text-slate-500">Aguardando host iniciar próxima rodada...</p>
      )}
    </div>
  );
};
