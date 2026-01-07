import React, { useState } from 'react';
import { GameState, GamePhase, Card, TableCard } from '../../types';
import { 
  GameCard, 
  PlayerHand, 
  GameHeader, 
  ClueModal, 
  VoteModal, 
  ResultsView, 
  GameOverView 
} from '../game';

interface GameScreenProps {
  gameState: GameState;
  playerId: string;
  onSubmitClue: (cardId: number, clue: string) => void;
  onPlayCard: (cardId: number) => void;
  onVote: (orderId: number) => void;
  onNextRound: () => void;
  onRestartGame: () => void;
  onLeaveRoom: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  playerId,
  onSubmitClue,
  onPlayCard,
  onVote,
  onNextRound,
  onRestartGame,
  onLeaveRoom,
}) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showClueModal, setShowClueModal] = useState(false);

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const narrator = gameState.players[gameState.narratorIndex];
  const isNarrator = narrator?.id === playerId;
  const hasPlayed = gameState.tableCards.some(tc => tc.playerId === playerId);
  const hasVoted = gameState.votes[playerId] !== undefined;

  // Handler para seleção de carta da mão (chamado após preview)
  const handleCardSelect = (card: Card) => {
    if (gameState.phase === GamePhase.NARRATOR_CHOOSING && isNarrator) {
      setSelectedCard(card);
      setShowClueModal(true);
    } else if (gameState.phase === GamePhase.OTHERS_CHOOSING && !isNarrator && !hasPlayed) {
      onPlayCard(card.id);
    }
  };

  // Handler para enviar pista
  const handleSubmitClue = (clue: string) => {
    if (selectedCard) {
      onSubmitClue(selectedCard.id, clue);
      setShowClueModal(false);
      setSelectedCard(null);
    }
  };

  // Handler para votar
  const handleVote = (tableCard: TableCard) => {
    if (tableCard.playerId !== playerId) {
      onVote(tableCard.orderId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-48">
      {/* Header */}
      <GameHeader 
        gameState={gameState} 
        currentPlayerId={playerId}
        onLeaveRoom={onLeaveRoom}
      />

      {/* Conteúdo principal */}
      <main className="pt-24 px-4">
        {/* Fase: Narrador escolhendo */}
        {gameState.phase === GamePhase.NARRATOR_CHOOSING && (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            {isNarrator ? (
              <div className="bg-amber-900/20 border border-amber-500/30 p-8 rounded-3xl text-center max-w-md">
                <h2 className="text-2xl text-amber-400 cinzel mb-2">
                  Você é o Narrador
                </h2>
                <p className="text-amber-200/60 text-sm">
                  Escolha uma carta da sua mão e crie uma pista
                </p>
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl text-center max-w-md">
                <h2 className="text-xl text-slate-300 mb-2">
                  Aguardando...
                </h2>
                <p className="text-slate-500 text-sm">
                  <span style={{ color: narrator?.color }}>{narrator?.name}</span> está escolhendo uma carta
                </p>
              </div>
            )}
          </div>
        )}

        {/* Fase: Outros escolhendo */}
        {gameState.phase === GamePhase.OTHERS_CHOOSING && (
          <div className="flex flex-col items-center gap-8">
            {/* Pista atual */}
            <div className="bg-indigo-950/30 border border-indigo-500/30 p-8 rounded-3xl text-center max-w-xl">
              <p className="text-indigo-400 text-xs uppercase tracking-widest mb-2">
                A pista é
              </p>
              <h2 className="text-4xl font-bold italic text-white">
                "{gameState.currentClue}"
              </h2>
            </div>

            {/* Status */}
            <div className="flex flex-wrap justify-center gap-4">
              {gameState.players.map(player => {
                if (player.id === narrator?.id) return null;
                const played = gameState.tableCards.some(tc => tc.playerId === player.id);
                return (
                  <div 
                    key={player.id}
                    className={`px-4 py-2 rounded-full text-sm ${
                      played 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {player.name}: {played ? '✓' : 'Escolhendo...'}
                  </div>
                );
              })}
            </div>

            {/* Instrução para o jogador */}
            {!isNarrator && !hasPlayed && (
              <p className="text-slate-400 text-center">
                Escolha uma carta da sua mão que combine com a pista
              </p>
            )}
            {!isNarrator && hasPlayed && (
              <p className="text-green-400 text-center">
                ✓ Carta enviada! Aguardando outros jogadores...
              </p>
            )}
            {isNarrator && (
              <p className="text-slate-500 text-center">
                Aguardando jogadores escolherem suas cartas...
              </p>
            )}
          </div>
        )}

        {/* Fase: Votação */}
        {gameState.phase === GamePhase.VOTING && (
          <VoteModal
            gameState={gameState}
            playerId={playerId}
            hasVoted={hasVoted}
            onVote={handleVote}
          />
        )}

        {/* Fase: Resultados */}
        {gameState.phase === GamePhase.RESULTS && (
          <ResultsView
            gameState={gameState}
            playerId={playerId}
            onNextRound={onNextRound}
          />
        )}

        {/* Fase: Fim de jogo */}
        {gameState.phase === GamePhase.GAME_OVER && (
          <GameOverView
            gameState={gameState}
            playerId={playerId}
            onRestartGame={onRestartGame}
            onLeaveRoom={onLeaveRoom}
          />
        )}
      </main>

      {/* Mão do jogador */}
      {currentPlayer && gameState.phase !== GamePhase.GAME_OVER && (
        <PlayerHand
          player={currentPlayer}
          deckCount={gameState.deckCount}
          onCardSelect={handleCardSelect}
          isNarrator={isNarrator}
          disabled={
            (gameState.phase === GamePhase.NARRATOR_CHOOSING && !isNarrator) ||
            (gameState.phase === GamePhase.OTHERS_CHOOSING && (isNarrator || hasPlayed)) ||
            gameState.phase === GamePhase.VOTING ||
            gameState.phase === GamePhase.RESULTS
          }
        />
      )}

      {/* Modal de pista */}
      {showClueModal && selectedCard && (
        <ClueModal
          card={selectedCard}
          onSubmit={handleSubmitClue}
          onClose={() => { setShowClueModal(false); setSelectedCard(null); }}
        />
      )}
    </div>
  );
};
