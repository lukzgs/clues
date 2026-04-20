import { useState } from 'react';
import { GameState, GamePhase, Card, TableCard } from '../../types';
import {
  GameCard,
  ClueModal,
  ResultsView,
  GameOverView,
  AfkAlertBar
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
  voteKickAfk: () => void;
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
  voteKickAfk,
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
    <div className="relative min-h-screen flex flex-col overflow-hidden z-0">
      {/* Ambient Lighting */}
      <div
        className="fixed inset-0 pointer-events-none z-[-1]"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a1a, transparent 70%)' }}
      />
      <div
        className="fixed top-[30%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none z-[-1]"
      />
      <AfkAlertBar 
        gameState={gameState} 
        voteKickAfk={voteKickAfk} 
        currentPlayerId={playerId} 
      />

      {currentPlayer?.isSpectator && (
        <div className="bg-red-900/40 border-b border-red-500/30 text-red-200 text-center py-2 text-sm font-medium">
          Você está no Modo Espectador (Inativo por tempo excedido).
        </div>
      )}

      {/* ===== HEADER ===== */}
      <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/10 bg-[#1A1A1A]/40 backdrop-blur-md">
        {/* Left: Phase & Timer */}
        <div className="flex items-center gap-4">
          <h1 className="text-white font-bold tracking-wide text-sm md:text-base">
            {phaseLabels[gameState.phase]}
          </h1>
        </div>

        {/* Right: Room Code & Settings */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <span className="font-mono">ROOM CODE: <span className="text-white">{gameState.roomCode}</span></span>
          </div>
          <button
            onClick={onLeaveRoom}
            aria-label="Sair da sala"
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-1 overflow-hidden">

        {/* ===== SIDEBAR (Players) - Hidden on mobile ===== */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 bg-[#1A1A1A]/30 p-4">
          <h2 className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-4 font-sans font-medium">
            Players & Votes
          </h2>
          <div className="space-y-2">
            {gameState.players.map((player) => {
              const status = getPlayerStatus(player);
              const isMe = player.id === playerId;

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors border ${isMe ? 'bg-[#1A1A1A]/60 border-amber-500/20' : 'hover:bg-white/5 border-transparent'
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
                    <div className="text-white font-cinzel font-medium text-sm truncate flex items-center gap-2">
                      {player.name}
                      {isMe && <span className="text-white/30 font-sans text-[10px] uppercase tracking-wider">(YOU)</span>}
                      {player.isSpectator && <span className="text-red-400 text-[10px] bg-red-950/50 px-2 py-0.5 rounded-full border border-red-500/30">SPECTATOR</span>}
                    </div>
                    <div className="text-white/40 font-sans text-xs mt-0.5">
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
                    <div className="bg-[#1A1A1A]/50 border-2 border-amber-500/30 p-8 md:p-12 rounded-2xl text-center max-w-lg shadow-xl shadow-amber-500/5">
                      <h2 className="text-3xl md:text-4xl text-amber-300 font-cinzel font-bold mb-3 tracking-wider">
                        You are the Narrator
                      </h2>
                      <p className="text-white/60 font-sans text-sm md:text-base">
                        Choose a card and write a clue
                      </p>
                    </div>

                    {/* Input placeholder */}
                    <div className="w-full max-w-lg">
                      <input
                        type="text"
                        placeholder="Write a creative clue..."
                        className="w-full bg-[#1A1A1A]/80 border border-white/10 p-4 rounded-xl text-white text-center placeholder:text-white/30 outline-none focus:border-amber-500/50 transition-colors font-sans"
                        disabled
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-[#1A1A1A]/30 border border-white/10 p-8 rounded-2xl text-center max-w-lg">
                    <h2 className="text-xl text-white mb-2 font-cinzel font-bold tracking-widest uppercase">
                      Waiting...
                    </h2>
                    <p className="text-white/60 font-sans text-sm">
                      <span style={{ color: narrator?.color }} className="font-bold">{narrator?.name}</span> is choosing a card
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Fase: Outros escolhendo */}
            {gameState.phase === GamePhase.OTHERS_CHOOSING && (
              <div className="flex flex-col items-center gap-8 animate-fade-in">
                {/* Clue Card */}
                <div className="bg-[#1A1A1A]/80 text-amber-300 px-12 py-8 rounded-2xl shadow-xl shadow-amber-500/5 text-center max-w-md border border-amber-500/20">
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 font-sans font-medium">The clue is</p>
                  <h2 className="text-3xl md:text-4xl font-cinzel font-bold tracking-wider">
                    "{gameState.currentClue}"
                  </h2>
                </div>

                {/* Status message */}
                <div className="text-center">
                  {!isNarrator && !hasPlayed && (
                    <p className="text-white/60 font-sans text-sm">
                      Choose a card from your hand that matches the clue
                    </p>
                  )}
                  {!isNarrator && hasPlayed && (
                    <p className="text-green-400 font-sans text-sm flex items-center gap-2 justify-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                      Card sent! Waiting for others...
                    </p>
                  )}
                  {isNarrator && (
                    <p className="text-white/40 font-sans text-sm">
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
                <div className="bg-[#1A1A1A]/80 text-amber-300 px-10 py-6 rounded-2xl shadow-xl shadow-amber-500/5 text-center max-w-md border border-amber-500/20">
                  <h2 className="text-2xl md:text-3xl font-cinzel font-bold tracking-wider">
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
                        <div className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold font-sans ${votesOnThis > 0
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-[#1A1A1A]/50 text-white/30 border border-white/10'
                          }`}>
                          {votesOnThis} Vote{votesOnThis !== 1 ? 's' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Status */}
                <div className="text-center font-sans text-sm">
                  {isNarrator && (
                    <p className="text-white/40">You are the narrator, waiting for votes...</p>
                  )}
                  {!isNarrator && hasVoted && (
                    <p className="text-green-400">✓ Vote registered! Waiting for others...</p>
                  )}
                  {!isNarrator && !hasVoted && (
                    <p className="text-white/60">Click on the card you think belongs to the narrator</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ===== PLAYER HAND (Bottom) ===== */}
          {currentPlayer && !currentPlayer.isSpectator && (
            <div className="border-t border-white/10 bg-[#1A1A1A]/60 backdrop-blur-md">
              <div className="p-4 md:p-6">
                {/* Label for disabled hand */}
                {(gameState.phase === GamePhase.VOTING ||
                  (gameState.phase === GamePhase.OTHERS_CHOOSING && (isNarrator || hasPlayed))) && (
                    <div className="text-center mb-4">
                      <span className="text-white/40 text-[10px] uppercase tracking-widest font-sans font-medium bg-[#1A1A1A]/80 px-4 py-2 rounded-full border border-white/10 shadow-sm shadow-black/50">
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
                      size="md"
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
