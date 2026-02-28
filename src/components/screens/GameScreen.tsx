import React, { useState } from 'react';
import { GameState, GamePhase, Card, TableCard } from '../../types';
import {
  GameCard,
  PlayerHand,
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
  const hasPlayed = gameState.tableCards.some(tc => tc.isMine);
  const hasVoted = gameState.votes[playerId] !== undefined;

  const phaseLabels: Record<GamePhase, string> = {
    [GamePhase.LOBBY]: 'LOBBY',
    [GamePhase.NARRATOR_CHOOSING]: 'NARRATOR CHOOSING',
    [GamePhase.OTHERS_CHOOSING]: 'CHOOSING CARDS',
    [GamePhase.VOTING]: 'VOTING PHASE',
    [GamePhase.RESULTS]: 'RESULTS',
    [GamePhase.GAME_OVER]: 'GAME OVER',
  };

  // Handler para seleção de carta da mão
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
    if (!tableCard.isMine) {
      onVote(tableCard.orderId);
    }
  };

  // Verificar status de voto/jogou para um jogador
  const getPlayerStatus = (player: typeof gameState.players[0]) => {
    if (player.id === narrator?.id) return 'narrator';
    if (gameState.phase === GamePhase.VOTING) {
      return gameState.votes[player.id] !== undefined ? 'voted' : 'waiting';
    }
    if (gameState.phase === GamePhase.OTHERS_CHOOSING) {
      return (gameState.playersWhoPlayed ?? []).includes(player.id) ? 'played' : 'waiting';
    }
    return 'waiting';
  };

  // Resultados e Game Over usam layout diferente
  if (gameState.phase === GamePhase.RESULTS) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 md:p-8">
        <ResultsView
          gameState={gameState}
          playerId={playerId}
          onNextRound={onNextRound}
        />
      </div>
    );
  }

  if (gameState.phase === GamePhase.GAME_OVER) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 md:p-8">
        <GameOverView
          gameState={gameState}
          playerId={playerId}
          onRestartGame={onRestartGame}
          onLeaveRoom={onLeaveRoom}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* ===== HEADER ===== */}
      <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        {/* Left: Phase & Timer */}
        <div className="flex items-center gap-4">
          <h1 className="text-white font-bold tracking-wide text-sm md:text-base">
            {phaseLabels[gameState.phase]}
          </h1>
          <div className="flex items-center gap-2 text-slate-400 text-sm">

            <span className="font-mono">00:45</span>
          </div>
        </div>

        {/* Right: Room Code & Settings */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs">

            <span className="font-mono">ROOM CODE: <span className="text-white">{gameState.roomCode}</span></span>
          </div>
          <button
            onClick={onLeaveRoom}
            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-1 overflow-hidden">

        {/* ===== SIDEBAR (Players) - Hidden on mobile ===== */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/50 bg-slate-900/30 p-4">
          <h2 className="text-slate-500 text-xs uppercase tracking-widest mb-4 font-medium">
            Players & Votes
          </h2>
          <div className="space-y-2">
            {gameState.players.map((player) => {
              const status = getPlayerStatus(player);
              const isMe = player.id === playerId;

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isMe ? 'bg-slate-800/60 border border-slate-700/50' : 'hover:bg-slate-800/30'
                    }`}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg"
                    style={{
                      backgroundColor: player.color,
                      border: player.id === narrator?.id ? '2px solid #f59e0b' : 'none'
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name & Score */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">
                      {player.name}
                      {isMe && <span className="text-slate-500 ml-1">(YOU)</span>}
                    </div>
                    <div className="text-slate-500 text-xs">
                      {player.score} Pts
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${status === 'voted' || status === 'played'
                      ? 'bg-green-500/20 text-green-400'
                      : status === 'narrator'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700 text-slate-500'
                    }`}>
                    {status === 'voted' || status === 'played' ? '✓' :
                      status === 'narrator' ? '★' : '?'}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ===== CENTER CONTENT ===== */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">

            {/* Fase: Narrador escolhendo */}
            {gameState.phase === GamePhase.NARRATOR_CHOOSING && (
              <div className="flex flex-col items-center gap-6 animate-fade-in">
                {isNarrator ? (
                  <>
                    {/* Announcement Card */}
                    <div className="bg-slate-800/50 border-2 border-amber-500/30 p-8 md:p-12 rounded-2xl text-center max-w-lg">
                      <h2 className="text-3xl md:text-4xl text-white font-display mb-3">
                        You are the Narrator
                      </h2>
                      <p className="text-slate-400 text-lg">
                        Choose a card and write a clue
                      </p>
                    </div>

                    {/* Input placeholder */}
                    <div className="w-full max-w-lg">
                      <input
                        type="text"
                        placeholder="Write a creative clue..."
                        className="w-full bg-slate-800/60 border border-slate-700 p-4 rounded-xl text-white text-center placeholder:text-slate-600 outline-none focus:border-slate-600 transition-colors"
                        disabled
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-2xl text-center max-w-lg">
                    <h2 className="text-2xl text-white mb-2">
                      Waiting...
                    </h2>
                    <p className="text-slate-500">
                      <span style={{ color: narrator?.color }} className="font-medium">{narrator?.name}</span> is choosing a card
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Fase: Outros escolhendo */}
            {gameState.phase === GamePhase.OTHERS_CHOOSING && (
              <div className="flex flex-col items-center gap-8 animate-fade-in">
                {/* Clue Card */}
                <div className="bg-gradient-to-b from-slate-100 to-slate-200 text-slate-900 px-12 py-8 rounded-2xl shadow-2xl text-center max-w-md border-4 border-white/50">
                  <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">The clue is</p>
                  <h2 className="text-3xl md:text-4xl font-display italic">
                    "{gameState.currentClue}"
                  </h2>
                </div>

                {/* Status message */}
                <div className="text-center">
                  {!isNarrator && !hasPlayed && (
                    <p className="text-slate-400">
                      Choose a card from your hand that matches the clue
                    </p>
                  )}
                  {!isNarrator && hasPlayed && (
                    <p className="text-green-400 flex items-center gap-2 justify-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Card sent! Waiting for others...
                    </p>
                  )}
                  {isNarrator && (
                    <p className="text-slate-500">
                      Waiting for players to choose their cards...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Fase: Votação */}
            {gameState.phase === GamePhase.VOTING && (
              <div className="flex flex-col items-center gap-8 animate-fade-in w-full max-w-5xl">
                {/* Clue Card */}
                <div className="bg-gradient-to-b from-slate-100 to-slate-200 text-slate-900 px-10 py-6 rounded-2xl shadow-2xl text-center max-w-md border-4 border-white/50">
                  <h2 className="text-2xl md:text-3xl font-display italic">
                    "{gameState.currentClue}"
                  </h2>
                </div>

                {/* Table Cards */}
                <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                  {gameState.tableCards.map((tableCard) => {
                    const isMine = tableCard.isMine === true;
                    const votesOnThis = Object.entries(gameState.votes)
                      .filter(([_, orderId]) => orderId === tableCard.orderId).length;

                    return (
                      <div key={tableCard.orderId} className="flex flex-col items-center gap-2">
                        <GameCard
                          card={tableCard.card}
                          size="md"
                          disabled={isNarrator || hasVoted || isMine}
                          onClick={() => !isMine && !hasVoted && !isNarrator && handleVote(tableCard)}
                          className={`${isMine ? 'opacity-50' : ''} ${!isMine && !hasVoted && !isNarrator ? 'ring-2 ring-transparent hover:ring-amber-400' : ''
                            }`}
                          isHighlighted={hasVoted && gameState.votes[playerId] === tableCard.orderId}
                          highlightColor="#f59e0b"
                        />
                        {/* Vote count */}
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${votesOnThis > 0
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-500'
                          }`}>
                          {votesOnThis} Vote{votesOnThis !== 1 ? 's' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Status */}
                <div className="text-center">
                  {isNarrator && (
                    <p className="text-slate-500">You are the narrator, waiting for votes...</p>
                  )}
                  {!isNarrator && hasVoted && (
                    <p className="text-green-400">✓ Vote registered! Waiting for others...</p>
                  )}
                  {!isNarrator && !hasVoted && (
                    <p className="text-slate-400">Click on the card you think belongs to the narrator</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ===== PLAYER HAND (Bottom) ===== */}
          {currentPlayer && (
            <div className="border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-sm">
              <div className="p-4">
                {/* Label for disabled hand */}
                {(gameState.phase === GamePhase.VOTING ||
                  (gameState.phase === GamePhase.OTHERS_CHOOSING && (isNarrator || hasPlayed))) && (
                    <div className="text-center mb-2">
                      <span className="text-slate-500 text-sm bg-slate-800/80 px-4 py-1 rounded-full">
                        Your hand is inactive during the {gameState.phase === GamePhase.VOTING ? 'voting' : 'waiting'} phase.
                      </span>
                    </div>
                  )}

                {/* Cards */}
                <div className={`flex justify-center gap-3 md:gap-4 flex-wrap ${gameState.phase === GamePhase.VOTING ||
                    (gameState.phase === GamePhase.OTHERS_CHOOSING && (isNarrator || hasPlayed)) ||
                    (gameState.phase === GamePhase.NARRATOR_CHOOSING && !isNarrator)
                    ? 'opacity-40 grayscale-[30%]'
                    : ''
                  }`}>
                  {currentPlayer.hand.map((card) => (
                    <GameCard
                      key={card.id}
                      card={card}
                      size="sm"
                      disabled={
                        (gameState.phase === GamePhase.NARRATOR_CHOOSING && !isNarrator) ||
                        (gameState.phase === GamePhase.OTHERS_CHOOSING && (isNarrator || hasPlayed)) ||
                        gameState.phase === GamePhase.VOTING
                      }
                      onClick={() => handleCardSelect(card)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

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
