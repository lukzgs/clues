import React from 'react';
import { GameState, TableCard } from '../../types';
import { GameCard } from './GameCard';

interface VoteModalProps {
  gameState: GameState;
  playerId: string;
  hasVoted: boolean;
  onVote: (tableCard: TableCard) => void;
}

export const VoteModal: React.FC<VoteModalProps> = ({
  gameState,
  playerId,
  hasVoted,
  onVote,
}) => {
  const narrator = gameState.players[gameState.narratorIndex];
  const isNarrator = narrator?.id === playerId;

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {/* Pista */}
      <div className="bg-indigo-950/30 border border-indigo-500/30 p-6 rounded-3xl text-center max-w-xl">
        <p className="text-indigo-400 text-xs uppercase tracking-widest mb-2">
          Qual carta combina com a pista?
        </p>
        <h2 className="text-3xl font-bold italic text-white">
          "{gameState.currentClue}"
        </h2>
      </div>

      {/* Status de votação */}
      <div className="flex flex-wrap justify-center gap-2">
        {gameState.players.map(player => {
          if (player.id === narrator?.id) return null;
          const voted = gameState.votes[player.id] !== undefined;
          return (
            <div 
              key={player.id}
              className={`px-3 py-1 rounded-full text-xs ${
                voted 
                  ? 'bg-green-900/30 text-green-400' 
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {player.name}: {voted ? '✓' : '...'}
            </div>
          );
        })}
      </div>

      {/* Cartas na mesa */}
      <div className="flex flex-wrap justify-center gap-4 max-w-4xl">
        {gameState.tableCards.map((tableCard) => {
          const isMine = tableCard.playerId === playerId;
          
          return (
            <div key={tableCard.oderId} className="flex flex-col items-center gap-2">
              <GameCard
                card={tableCard.card}
                size="md"
                disabled={isNarrator || hasVoted || isMine}
                onClick={() => !isMine && !hasVoted && !isNarrator && onVote(tableCard)}
                className={isMine ? 'opacity-50' : ''}
              />
              {isMine && (
                <span className="text-slate-600 text-xs">Sua carta</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Instrução */}
      {isNarrator && (
        <p className="text-slate-500 text-center">
          Você é o narrador, aguarde os votos...
        </p>
      )}
      {!isNarrator && hasVoted && (
        <p className="text-green-400 text-center">
          ✓ Voto registrado! Aguardando outros...
        </p>
      )}
      {!isNarrator && !hasVoted && (
        <p className="text-slate-400 text-center">
          Clique na carta que você acha que é do narrador
        </p>
      )}
    </div>
  );
};
