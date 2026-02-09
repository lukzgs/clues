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
    <div className="flex flex-col items-center gap-6 md:gap-8 py-6 md:py-8 animate-fade-in">
      {/* Pista */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 px-6 md:px-8 py-5 md:py-6 rounded-2xl text-center max-w-xl backdrop-blur-sm">
        <p className="text-indigo-400 text-xs uppercase tracking-widest mb-2 font-medium">
          Qual carta combina com a pista?
        </p>
        <h2 className="text-2xl md:text-3xl font-bold italic text-white font-display">
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
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${voted
                  ? 'bg-green-900/40 text-green-400 border border-green-500/30'
                  : 'bg-slate-800/80 text-slate-500 border border-slate-700/50'
                }`}
            >
              {player.name}: {voted ? '✓' : '...'}
            </div>
          );
        })}
      </div>

      {/* Cartas na mesa - Grid responsivo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap justify-center gap-4 md:gap-6 max-w-5xl px-4">
        {gameState.tableCards.map((tableCard) => {
          const isMine = tableCard.playerId === playerId;

          return (
            <div key={tableCard.orderId} className="flex flex-col items-center gap-2">
              <GameCard
                card={tableCard.card}
                size="md"
                disabled={isNarrator || hasVoted || isMine}
                onClick={() => !isMine && !hasVoted && !isNarrator && onVote(tableCard)}
                className={isMine ? 'opacity-50 grayscale-[20%]' : ''}
              />
              {isMine && (
                <span className="text-slate-600 text-xs bg-slate-800/50 px-2 py-0.5 rounded-full">
                  Sua carta
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Instrução */}
      <div className="text-center">
        {isNarrator && (
          <p className="text-slate-500">
            Você é o narrador, aguarde os votos...
          </p>
        )}
        {!isNarrator && hasVoted && (
          <p className="text-green-400 flex items-center gap-2 justify-center">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Voto registrado! Aguardando outros...
          </p>
        )}
        {!isNarrator && !hasVoted && (
          <p className="text-slate-400">
            Toque na carta que você acha que é do narrador
          </p>
        )}
      </div>
    </div>
  );
};
