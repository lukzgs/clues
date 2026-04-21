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
      setSelectedCard(card);
      setShowClueModal(true);
    }
  };

  // Handler para enviar pista ou confirmar carta/voto
  const handleSubmitModal = (clue?: string) => {
    if (selectedCard) {
      if (gameState.phase === GamePhase.NARRATOR_CHOOSING && isNarrator && clue) {
        onSubmitClue(selectedCard.id, clue);
      } else if (gameState.phase === GamePhase.OTHERS_CHOOSING && !isNarrator) {
        onPlayCard(selectedCard.id);
      } else if (gameState.phase === GamePhase.VOTING && !isNarrator) {
        const tc = gameState.tableCards.find(t => t.card.id === selectedCard.id);
        if (tc) onVote(tc.orderId);
      }
      setShowClueModal(false);
      setSelectedCard(null);
    }
  };

  const handleNextCard = () => {
    if (!selectedCard) return;
    
    if (gameState.phase === GamePhase.VOTING) {
      const currentIndex = gameState.tableCards.findIndex(tc => tc.card.id === selectedCard.id);
      if (currentIndex === -1) return;
      const nextIndex = (currentIndex + 1) % gameState.tableCards.length;
      setSelectedCard(gameState.tableCards[nextIndex].card);
    } else {
      if (!currentPlayer) return;
      const currentIndex = currentPlayer.hand.findIndex(c => c.id === selectedCard.id);
      if (currentIndex === -1) return;
      const nextIndex = (currentIndex + 1) % currentPlayer.hand.length;
      setSelectedCard(currentPlayer.hand[nextIndex]);
    }
  };

  const handlePrevCard = () => {
    if (!selectedCard) return;

    if (gameState.phase === GamePhase.VOTING) {
      const currentIndex = gameState.tableCards.findIndex(tc => tc.card.id === selectedCard.id);
      if (currentIndex === -1) return;
      const prevIndex = (currentIndex - 1 + gameState.tableCards.length) % gameState.tableCards.length;
      setSelectedCard(gameState.tableCards[prevIndex].card);
    } else {
      if (!currentPlayer) return;
      const currentIndex = currentPlayer.hand.findIndex(c => c.id === selectedCard.id);
      if (currentIndex === -1) return;
      const prevIndex = (currentIndex - 1 + currentPlayer.hand.length) % currentPlayer.hand.length;
      setSelectedCard(currentPlayer.hand[prevIndex]);
    }
  };

  // Handler para iniciar o fluxo de votar
  const handleVoteSelect = (tableCard: TableCard) => {
    if (!tableCard.isMine && !hasVoted && !isNarrator) {
      setSelectedCard(tableCard.card);
      setShowClueModal(true);
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

  // Resultados e Game Over usam layout diferente, porém com mesmo background base
  if (gameState.phase === GamePhase.RESULTS) {
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
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <ResultsView
            gameState={gameState}
            playerId={playerId}
            onNextRound={onNextRound}
          />
        </div>
      </div>
    );
  }

  if (gameState.phase === GamePhase.GAME_OVER) {
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
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <GameOverView
            gameState={gameState}
            playerId={playerId}
            onRestartGame={onRestartGame}
            onLeaveRoom={onLeaveRoom}
          />
        </div>
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
      <div className="flex flex-1 overflow-hidden w-full relative">

        {/* ===== SIDEBAR (Players) - Hidden on mobile ===== */}
        <aside className="hidden lg:flex flex-col w-[320px] shrink-0 bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-[20px_0_40px_rgba(0,0,0,0.5)] self-start mt-8 my-8 ml-8">
          <h2 className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-6 font-sans font-bold text-center">
            Pontuação Atual
          </h2>
          <div className="space-y-3">
            {[...gameState.players]
              .sort((a, b) => b.score - a.score)
              .map((player) => {
              const status = getPlayerStatus(player);
              const isMe = player.id === playerId;

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-4 rounded-3xl transition-colors border shadow-lg ${isMe ? 'bg-[#1A1A1A]/60 border-amber-500/30' : 'bg-[#1A1A1A]/40 border-white/5 hover:bg-white/10'
                    }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-lg border border-white/10 ${
                      status === 'narrator' ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#1A1A1A]' : ''
                    }`}
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name & Score */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="text-white font-cinzel font-bold text-lg md:text-xl truncate flex items-center gap-2">
                      {player.name}
                      {player.isSpectator && <span className="text-red-400 text-[10px] bg-red-950/50 px-2 py-0.5 rounded-full border border-red-500/30">SPECTATOR</span>}
                    </div>
                    <div className="text-white/60 font-sans text-sm mt-0.5 flex items-baseline gap-1">
                      {player.score} <span className="text-[10px] uppercase tracking-widest text-white/30">Pts</span>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md border shrink-0 ${status === 'voted' || status === 'played'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : status === 'narrator'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-black/40 text-white/30 border-white/5'
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
        <main className="flex-1 flex flex-col overflow-y-auto pb-6">
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">

            {/* Fase: Narrador escolhendo */}
            {gameState.phase === GamePhase.NARRATOR_CHOOSING && (
              <div className="flex flex-col items-center gap-8 animate-fade-in w-full max-w-4xl">
                {isNarrator ? (
                  <>
                    {/* Announcement Card */}
                    <div className="bg-black/40 backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 shadow-2xl p-10 md:p-14 rounded-3xl md:rounded-[2.5rem] text-center w-full max-w-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col items-center justify-center">
                      <h2 className="text-4xl md:text-5xl text-amber-300 font-cinzel font-bold mb-4 tracking-[0.1em] leading-tight">
                        You are the Narrator
                      </h2>
                      <p className="text-white/60 font-sans text-sm md:text-base uppercase tracking-[0.25em] mt-5 font-medium">
                        Choose a card and write a clue
                      </p>
                    </div>

                    {/* Input placeholder */}
                    <div className="w-full max-w-2xl">
                      <input
                        type="text"
                        placeholder="Write a creative clue..."
                        className="w-full bg-[#1A1A1A]/50 border border-white/20 p-6 md:p-8 rounded-[2rem] text-white text-center placeholder:text-white/30 outline-none transition-colors font-cinzel italic text-xl md:text-2xl shadow-lg opacity-50"
                        disabled
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-black/40 backdrop-blur-2xl border border-white/10 ring-1 ring-white/5 p-10 md:p-14 rounded-3xl md:rounded-[2.5rem] text-center w-full max-w-2xl shadow-2xl">
                    <h2 className="text-2xl md:text-3xl text-white mb-4 font-cinzel font-bold tracking-[0.2em] uppercase text-amber-100/90">
                      Waiting...
                    </h2>
                    <p className="text-white/60 font-sans text-base md:text-lg tracking-wider mt-6">
                      <span style={{ color: narrator?.color }} className="font-bold text-lg md:text-xl bg-white/5 px-4 py-1.5 rounded-lg mx-1.5">{narrator?.name}</span> is choosing a card
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Fase: Outros escolhendo */}
            {gameState.phase === GamePhase.OTHERS_CHOOSING && (
              <div className="flex flex-col items-center gap-10 animate-fade-in w-full max-w-4xl">
                {/* Clue Card */}
                <div className="bg-black/40 backdrop-blur-2xl border border-amber-500/30 ring-1 ring-amber-500/10 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-amber-300 px-12 py-14 md:py-16 rounded-3xl md:rounded-[3rem] text-center w-full max-w-3xl flex flex-col items-center justify-center">
                  <p className="text-amber-200/50 text-[11px] md:text-sm uppercase tracking-[0.3em] mb-6 md:mb-8 font-sans font-bold">The clue is</p>
                  <h2 className="text-4xl md:text-6xl font-cinzel font-bold tracking-wider leading-tight">
                    "{gameState.currentClue}"
                  </h2>
                </div>

                {/* Status message */}
                <div className="text-center bg-[#1A1A1A]/40 px-10 py-5 rounded-full border border-white/5 backdrop-blur-sm">
                  {!isNarrator && !hasPlayed && (
                    <p className="text-white/70 font-sans text-sm md:text-base tracking-widest uppercase font-medium">
                      Choose a card from your hand that matches the clue
                    </p>
                  )}
                  {!isNarrator && hasPlayed && (
                    <p className="text-amber-400 font-sans text-sm md:text-base flex items-center gap-3 justify-center tracking-widest uppercase font-bold">
                      <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.9)]"></span>
                      Card sent! Waiting for others...
                    </p>
                  )}
                  {isNarrator && (
                    <p className="text-white/50 font-sans text-sm md:text-base tracking-widest uppercase font-medium">
                      Waiting for players to choose their cards...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Fase: Votação */}
            {gameState.phase === GamePhase.VOTING && (
              <div className="flex flex-col items-center gap-12 animate-fade-in w-full max-w-7xl">
                {/* Clue Card */}
                <div className="bg-black/40 backdrop-blur-2xl border border-amber-500/30 ring-1 ring-amber-500/10 shadow-[0_0_40px_rgba(245,158,11,0.15)] text-amber-300 px-12 py-8 rounded-3xl md:rounded-full text-center max-w-4xl mx-auto flex items-center justify-center">
                  <h2 className="text-3xl md:text-5xl font-cinzel font-bold tracking-wider px-8 leading-tight">
                    "{gameState.currentClue}"
                  </h2>
                </div>

                {/* Table Cards */}
                <div className="flex flex-wrap justify-center gap-8 md:gap-10">
                  {gameState.tableCards.map((tableCard) => {
                    const isMine = tableCard.isMine === true;
                    const votesOnThis = Object.entries(gameState.votes)
                      .filter(([_, orderId]) => orderId === tableCard.orderId).length;

                    return (
                      <div key={tableCard.orderId} className="flex flex-col items-center gap-4">
                        <GameCard
                          card={tableCard.card}
                          size="xl"
                          disabled={isNarrator || hasVoted || isMine}
                          onClick={() => handleVoteSelect(tableCard)}
                          className={`${isMine ? 'opacity-50' : ''} ${!isMine && !hasVoted && !isNarrator ? 'ring-2 ring-transparent hover:ring-amber-400' : ''
                            }`}
                          isHighlighted={hasVoted && gameState.votes[playerId] === tableCard.orderId}
                          highlightColor="#f59e0b"
                        />
                        {/* Vote count */}
                        <div className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] font-bold font-sans shadow-lg ${votesOnThis > 0
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
                <div className="text-center font-sans text-sm md:text-base tracking-[0.25em] uppercase bg-[#1A1A1A]/40 px-10 py-4 rounded-full border border-white/5 backdrop-blur-sm mt-6 font-medium">
                  {isNarrator && (
                    <p className="text-white/50">You are the narrator, waiting for votes...</p>
                  )}
                  {!isNarrator && hasVoted && (
                    <p className="text-amber-400 font-bold flex items-center justify-center gap-3">
                      <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.9)]"></span>
                      Vote registered! Waiting...
                    </p>
                  )}
                  {!isNarrator && !hasVoted && (
                    <p className="text-white/80">Click on the card you think belongs to the narrator</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ===== PLAYER HAND (Bottom) ===== */}
          {currentPlayer && !currentPlayer.isSpectator && (
            <div className="pb-6 md:pb-10 pt-4 px-4">
              <div className="max-w-6xl mx-auto">
                {/* Label for disabled hand */}
                {(gameState.phase === GamePhase.VOTING ||
                  (gameState.phase === GamePhase.OTHERS_CHOOSING && (isNarrator || hasPlayed))) && (
                    <div className="text-center mb-6">
                      <span className="text-white/40 text-[10px] uppercase tracking-widest font-sans font-medium bg-black/50 px-6 py-2.5 rounded-full border border-white/10 shadow-lg backdrop-blur-md">
                        Your hand is inactive during the {gameState.phase === GamePhase.VOTING ? 'voting' : 'waiting'} phase
                      </span>
                    </div>
                  )}

                {/* Cards */}
                <div className={`flex justify-center gap-4 md:gap-4 flex-nowrap overflow-x-auto pb-4 px-4 custom-scrollbar ${gameState.phase === GamePhase.VOTING ||
                    (gameState.phase === GamePhase.OTHERS_CHOOSING && (isNarrator || hasPlayed)) ||
                    (gameState.phase === GamePhase.NARRATOR_CHOOSING && !isNarrator)
                    ? 'opacity-40 grayscale-[30%] scale-[0.98]'
                    : ''
                  }`}>
                  {currentPlayer.hand.map((card) => (
                    <div key={card.id} className="shrink-0">
                      <GameCard
                        card={card}
                        size="md"
                        disabled={
                          (gameState.phase === GamePhase.NARRATOR_CHOOSING && !isNarrator) ||
                          (gameState.phase === GamePhase.OTHERS_CHOOSING && (isNarrator || hasPlayed)) ||
                          gameState.phase === GamePhase.VOTING
                        }
                        onClick={() => handleCardSelect(card)}
                      />
                    </div>
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
          mode={
            gameState.phase === GamePhase.NARRATOR_CHOOSING ? 'narrator' :
            gameState.phase === GamePhase.VOTING ? 'voter' : 'player'
          }
          clueText={gameState.currentClue}
          onSubmit={handleSubmitModal}
          onClose={() => { setShowClueModal(false); setSelectedCard(null); }}
          onNextCard={handleNextCard}
          onPrevCard={handlePrevCard}
        />
      )}
    </div>
  );
};
