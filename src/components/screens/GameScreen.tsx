import { useState, useEffect } from 'react';
import { GameState, GamePhase, Card, TableCard } from '../../types';
import {
  GameCard,
  ClueModal,
  ResultsView,
  GameOverView,
  AfkAlertBar,
  KickConfirmModal,
  LeaveConfirmModal
} from '../game';
import { useTranslation } from '../../i18n/index.tsx';
import { LanguageToggle } from '../ui/LanguageToggle';

interface GameScreenProps {
  gameState: GameState;
  playerId: string;
  roomCloseTime?: number | null;
  onSubmitClue: (cardId: number, clue: string) => void;
  onPlayCard: (cardId: number) => void;
  onVote: (orderId: number) => void;
  onNextRound: () => void;
  onRestartGame: () => void;
  onLeaveRoom: () => void;
  voteKickAfk: () => void;
  onKickPlayer?: (targetId: string) => void;
}

const RoomTimeoutBar: React.FC<{ closeTime: number }> = ({ closeTime }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((closeTime - Date.now()) / 1000)));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = Math.max(0, Math.floor((closeTime - Date.now()) / 1000));
      setTimeLeft(newTime);
      if (newTime === 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [closeTime]);

  if (timeLeft === 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-red-900/50 border-b border-red-500/30 text-red-200 text-center py-2.5 text-sm font-sans font-medium flex items-center justify-center gap-2 z-50">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      A sala fechará por inatividade em {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  playerId,
  roomCloseTime,
  onSubmitClue,
  onPlayCard,
  onVote,
  onNextRound,
  onRestartGame,
  onLeaveRoom,
  voteKickAfk,
  onKickPlayer,
}) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showClueModal, setShowClueModal] = useState(false);
  const [kickTarget, setKickTarget] = useState<{ id: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [mobileView, setMobileView] = useState<'row' | 'grid-1' | 'grid-2'>('row');
  const [tableMobileView, setTableMobileView] = useState<'row' | 'grid-1' | 'grid-2'>('grid-2');
  const { t } = useTranslation();

  const handleCopyLink = async () => {
    const url = `${window.location.origin}?room=${gameState.roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const narrator = gameState.players[gameState.narratorIndex];
  const isNarrator = narrator?.id === playerId;
  const hasPlayed = gameState.tableCards.some(tc => tc.isMine);
  const hasVoted = gameState.votes[playerId] !== undefined;

  const phaseLabels: Record<GamePhase, string> = {
    [GamePhase.LOBBY]: 'LOBBY',
    [GamePhase.NARRATOR_CHOOSING]: t.game.youAreNarrator,
    [GamePhase.OTHERS_CHOOSING]: t.game.theClueIs,
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
    if (currentPlayer?.isSpectator) return;
    if (!tableCard.isMine && !hasVoted && !isNarrator) {
      setSelectedCard(tableCard.card);
      setShowClueModal(true);
    }
  };

  // Verificar status de voto/jogou/pronto para um jogador
  const getPlayerStatus = (player: typeof gameState.players[0]) => {
    if (player.id === narrator?.id) return 'narrator';
    
    // Na fase de resultados, mostra quem já clicou em "Próxima Rodada"
    if (gameState.phase === GamePhase.RESULTS) {
      return (gameState.playersWhoReadied ?? []).includes(player.id) ? 'readied' : 'waiting';
    }

    if (gameState.phase === GamePhase.VOTING) {
      return (gameState.playersWhoVoted ?? []).includes(player.id) ? 'voted' : 'waiting';
    }
    if (gameState.phase === GamePhase.OTHERS_CHOOSING) {
      return (gameState.playersWhoPlayed ?? []).includes(player.id) ? 'played' : 'waiting';
    }
    return 'waiting';
  };

  // Resultados e Game Over usam layout diferente, porém com mesmo background base
  if (gameState.phase === GamePhase.RESULTS) {
    return (
      <div className="relative h-[100dvh] flex flex-col overflow-hidden z-0">
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
            onLeaveRoom={onLeaveRoom}
            onKickPlayer={onKickPlayer}
            isHost={currentPlayer?.isHost ?? false}
          />
        </div>
      </div>
    );
  }

  if (gameState.phase === GamePhase.GAME_OVER) {
    return (
      <div className="relative h-[100dvh] flex flex-col overflow-hidden z-0">
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
    <div className="relative h-[100dvh] flex flex-col overflow-hidden z-0">
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

      {roomCloseTime && (
        <RoomTimeoutBar closeTime={roomCloseTime} />
      )}

      {currentPlayer?.isSpectator && (
        <div className="bg-blue-900/30 border-b border-blue-500/20 text-blue-200 text-center py-2.5 text-sm font-sans font-medium flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          {t.game.spectatorMode}
        </div>
      )}

      {/* ===== HEADER ===== */}
      <header className="flex md:grid md:grid-cols-3 items-center justify-between px-4 md:px-8 py-3.5 md:py-5 border-b border-white/10 bg-black/40 backdrop-blur-2xl z-20">
        {/* Left: Phase Title (Desktop) + Score Button (Mobile) */}
        <div className="flex items-center gap-3">
          {/* Mobile: Score button */}
          <button
            onClick={() => setShowScoreModal(true)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all duration-300"
            title="Ver pontuação"
            aria-label="Ver pontuação"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
          </button>
          {/* Desktop: Phase label */}
          <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full border border-amber-500/30 bg-black/50 ring-1 ring-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-200">
              <path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z" />
              <line x1="2" y1="19" x2="22" y2="19" />
            </svg>
          </div>
          <h1 className="hidden md:block text-white font-cinzel font-bold tracking-[0.15em] text-lg uppercase truncate">
            {phaseLabels[gameState.phase]}
          </h1>
        </div>

        {/* Center: Room Code Pill (Mobile Only) */}
        <div className="justify-self-center">
          <div className="md:hidden flex items-center bg-[#1A1A1A]/60 rounded-xl pl-4 pr-1.5 h-10 border border-white/10 shadow-inner">
            <span className="text-sm font-cinzel font-bold text-amber-300 tracking-widest mr-3">
              {gameState.roomCode}
            </span>
            <button
              onClick={handleCopyLink}
              className={`p-1.5 rounded-lg transition-all duration-300 border ${
                copied
                  ? 'text-green-400 border-green-500/30 bg-green-500/10'
                  : 'text-white/40 border-white/10 bg-white/5 hover:text-amber-300'
              }`}
              title="Copiar link da sala"
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Right: Language Toggle, Room Code (Desktop) & Exit Icon */}
        <div className="justify-self-end flex items-center gap-3 md:gap-4">
          <LanguageToggle className="h-10 md:h-11" />
          
          <div className="hidden md:flex items-center bg-[#1A1A1A]/60 rounded-xl pl-4 pr-1.5 h-11 border border-white/10 shadow-inner">
            <span className="text-base font-cinzel font-bold text-amber-300 tracking-widest mr-3">
              {gameState.roomCode}
            </span>
            <button
              onClick={handleCopyLink}
              className={`p-2 rounded-lg transition-all duration-300 border ${
                copied
                  ? 'text-green-400 border-green-500/30 bg-green-500/10'
                  : 'text-white/40 border-white/10 bg-white/5 hover:text-amber-300'
              }`}
              title="Copiar link da sala"
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              )}
            </button>
          </div>

          <button
            onClick={() => setShowLeaveConfirm(true)}
            aria-label="Sair da sala"
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 group"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="md:w-[22px] md:h-[22px] transition-transform group-hover:-translate-x-0.5"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 5 12 10 7" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-1 overflow-hidden w-full relative">

        {/* ===== SIDEBAR (Players) - Hidden on mobile ===== */}
        <aside className="hidden lg:flex flex-col w-[300px] shrink-0 bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 shadow-[20px_0_40px_rgba(0,0,0,0.5)] self-start mt-8 my-8 ml-6">
          <h2 className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-6 font-sans font-bold text-center">
            {t.game.currentScore}
          </h2>
          <div className="space-y-3">
            {[...gameState.players]
              .filter(p => !p.isSpectator)
              .sort((a, b) => b.score - a.score)
              .map((player) => {
              const status = getPlayerStatus(player);
              const isMe = player.id === playerId;
              const isHost = currentPlayer?.isHost ?? false;

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-colors border shadow-lg ${isMe ? 'bg-[#1A1A1A]/60 border-amber-500/30' : 'bg-[#1A1A1A]/40 border-white/5 hover:bg-white/10'
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg border border-white/10 ${
                      isMe ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#1A1A1A]' : ''
                    }`}
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-white font-cinzel font-bold text-base truncate">
                      {player.name}
                    </div>
                    <div className="text-white/60 font-sans text-xs mt-0.5 flex items-baseline gap-1">
                      {player.score} <span className="text-[9px] uppercase tracking-widest text-white/30">Pts</span>
                    </div>
                  </div>

                  {/* Right Actions Area - Fixed width to prevent misalignment when kick button is missing */}
                  <div className="flex items-center gap-2 w-[64px] justify-end shrink-0">
                    {/* Status indicator */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-md border shrink-0 transition-all duration-300 ${
                      status === 'voted' || status === 'played'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : status === 'readied' || status === 'narrator'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.1)]'
                          : 'bg-black/40 text-white/30 border-white/5'
                      }`}>
                      {status === 'voted' || status === 'played' ? (
                        <span className="leading-none mt-[-2px]">✓</span>
                      ) : status === 'readied' ? (
                        <span className="leading-none mt-[-2px]">✓</span>
                      ) : status === 'narrator' ? (
                        <div className="flex items-center justify-center w-full h-full pb-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-300">
                            <path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z" />
                            <line x1="2" y1="19" x2="22" y2="19" />
                          </svg>
                        </div>
                      ) : (
                        <span className="leading-none opacity-40">?</span>
                      )}
                    </div>

                    {/* Kick button (host only, not self) */}
                    {isHost && onKickPlayer ? (
                      !isMe ? (
                        <button
                          onClick={() => setKickTarget({ id: player.id, name: player.name })}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                          title="Remove player"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      ) : (
                        <div className="w-7 h-7 shrink-0" /> // Placeholder to maintain alignment
                      )
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spectators section */}
          {gameState.players.filter(p => p.isSpectator).length > 0 && (
            <div className="mt-6 pt-5 border-t border-white/5">
              <h3 className="text-white/25 text-[10px] uppercase tracking-[0.2em] mb-3 font-sans font-bold text-center flex items-center justify-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Spectators ({gameState.players.filter(p => p.isSpectator).length})
              </h3>
              <div className="space-y-2">
                {gameState.players.filter(p => p.isSpectator).map(player => (
                  <div key={player.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 text-xs font-bold border border-white/10 grayscale-[50%]" style={{ backgroundColor: player.color }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </div>
                    <span className="text-white/30 font-cinzel font-bold text-sm truncate flex-1">{player.name}</span>
                    {(currentPlayer?.isHost ?? false) && onKickPlayer && player.id !== playerId && (
                      <button
                        onClick={() => setKickTarget({ id: player.id, name: player.name })}
                        className="w-6 h-6 flex items-center justify-center rounded text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ===== CENTER CONTENT ===== */}
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden pb-6">
          <div className={`shrink-0 md:flex-1 flex flex-col items-center p-4 md:p-8 ${gameState.phase === GamePhase.LOBBY ? 'justify-center' : 'justify-start pt-6 md:pt-10'}`}>

            {/* Fase: Narrador escolhendo */}
            {gameState.phase === GamePhase.NARRATOR_CHOOSING && (
              <div className="flex flex-col items-center gap-8 animate-fade-in w-full max-w-4xl lg:mb-auto lg:mt-8">
                {isNarrator ? (
                  <>
                    {/* Announcement Card */}
                    <div className="bg-black/40 backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 shadow-2xl p-10 md:p-14 rounded-3xl md:rounded-[2.5rem] text-center w-full max-w-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col items-center justify-center">
          <h2 className="text-4xl md:text-5xl text-amber-300 font-cinzel font-bold mb-4 tracking-[0.1em] leading-tight">
                        {t.game.youAreNarrator}
                      </h2>
                      <p className="text-white/60 font-sans text-sm md:text-base uppercase tracking-[0.25em] mt-5 font-medium">
                        {t.game.narratorSubtitle}
                      </p>
                    </div>

                    {/* Input placeholder */}
                    <div className="w-full max-w-2xl">
                      <input
                         type="text"
                         placeholder={t.game.cluePlaceholder}
                         className="w-full bg-[#1A1A1A]/50 border border-white/20 p-6 md:p-8 rounded-[2rem] text-white text-center placeholder:text-white/30 outline-none transition-colors font-cinzel italic text-xl md:text-2xl shadow-lg opacity-50"
                         disabled
                       />
                    </div>
                  </>
                ) : (
                  <div className="bg-black/40 backdrop-blur-2xl border border-white/10 ring-1 ring-white/5 p-10 md:p-14 rounded-3xl md:rounded-[2.5rem] text-center w-full max-w-2xl shadow-2xl">
                    <h2 className="text-2xl md:text-3xl text-white mb-4 font-cinzel font-bold tracking-[0.2em] uppercase text-amber-100/90">
                      {t.game.waitingNarrator}
                    </h2>
                    <p className="text-white/60 font-sans text-base md:text-lg tracking-wider mt-6">
                      <span style={{ color: narrator?.color }} className="font-cinzel font-bold uppercase tracking-wider text-lg md:text-xl bg-white/5 px-4 py-1.5 rounded-lg mx-1.5 shadow-inner">{narrator?.name}</span> <span className="uppercase tracking-[0.1em] font-sans text-xs md:text-sm font-medium ml-2">{t.game.narratorChoosingCard}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Fase: Outros escolhendo */}
            {gameState.phase === GamePhase.OTHERS_CHOOSING && (
              <div className="flex flex-col items-center gap-6 md:gap-8 animate-fade-in w-full max-w-7xl">
                {/* Clue Card */}
                <div className="bg-black/40 backdrop-blur-2xl border border-amber-500/30 ring-1 ring-amber-500/10 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-amber-300 px-8 py-5 md:py-7 rounded-2xl md:rounded-[2rem] text-center w-full max-w-lg flex flex-col items-center justify-center">
                  <p className="text-amber-200/50 text-[8px] md:text-[10px] uppercase tracking-[0.4em] mb-2 md:mb-3 font-sans font-bold opacity-60">{t.game.theClueIs}</p>
                  <h2 className="text-2xl md:text-4xl font-cinzel font-bold tracking-wider leading-tight">
                    "{gameState.currentClue}"
                  </h2>
                </div>

                {/* Cards on table (face down) — only played cards, growing from center */}
                {gameState.tableCards.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-2 max-w-7xl mx-auto">
                    {gameState.tableCards.map((tc, i) => (
                      <div 
                        key={tc.orderId} 
                        className="animate-zoom-in" 
                        style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'both' }}
                      >
                        <GameCard
                          card={{ id: -1, imageUrl: '/cards/new/back_001.avif' }}
                          size="table"
                          disabled
                          className="shadow-2xl brightness-90 contrast-125"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Status message (Simple, no pill) */}
                <div className="text-center pt-2">
                  {!isNarrator && hasPlayed && (
                    <p className="text-amber-400/80 font-sans text-xs md:text-sm flex items-center gap-3 justify-center tracking-[0.2em] uppercase font-bold">
                         <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.9)]"></span>
                         {t.game.cardSent}
                       </p>
                  )}
                  {isNarrator && (
                    <p className="text-white/40 font-sans text-xs md:text-sm tracking-[0.2em] uppercase font-medium">
                         {t.game.playersChoosing}
                       </p>
                  )}
                </div>
              </div>
            )}

            {/* Fase: Votação */}
            {gameState.phase === GamePhase.VOTING && (
              <div className="flex flex-col items-center gap-6 animate-fade-in w-full max-w-7xl">
                {/* Clue Card */}
                <div className="bg-black/40 backdrop-blur-2xl border border-amber-500/30 ring-1 ring-amber-500/10 shadow-[0_0_40px_rgba(245,158,11,0.15)] text-amber-300 px-10 py-5 rounded-3xl md:rounded-full text-center max-w-4xl mx-auto flex items-center justify-center">
                  <h2 className="text-2xl md:text-4xl font-cinzel font-bold tracking-wider px-6 leading-tight">
                    "{gameState.currentClue}"
                  </h2>
                </div>

                {/* Table Cards Header with View Toggles (Mobile Only) */}
                <div className="w-full md:hidden flex justify-between items-center px-4 mt-2 mb-[-1rem]">
                  <span className="text-white/50 text-[10px] uppercase font-sans font-bold tracking-[0.2em]">{t.game.tableCards}</span>
                  <div className="flex bg-black/40 rounded-xl border border-white/10 p-1 backdrop-blur-sm">
                    <button
                      onClick={() => setTableMobileView('row')}
                      className={`p-2 rounded-lg transition-all ${tableMobileView === 'row' ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-white/40 hover:text-white/80'}`}
                      aria-label="Ver em carrossel"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="18" rx="1" ry="1"/><rect x="18" y="5" width="3" height="14" rx="1" ry="1"/><rect x="3" y="5" width="3" height="14" rx="1" ry="1"/></svg>
                    </button>
                    <button
                      onClick={() => setTableMobileView('grid-2')}
                      className={`p-2 rounded-lg transition-all ${tableMobileView === 'grid-2' ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-white/40 hover:text-white/80'}`}
                      aria-label="Ver 2 por linha"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" ry="1"/><rect x="14" y="3" width="7" height="7" rx="1" ry="1"/><rect x="14" y="14" width="7" height="7" rx="1" ry="1"/><rect x="3" y="14" width="7" height="7" rx="1" ry="1"/></svg>
                    </button>
                    <button
                      onClick={() => setTableMobileView('grid-1')}
                      className={`p-2 rounded-lg transition-all ${tableMobileView === 'grid-1' ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-white/40 hover:text-white/80'}`}
                      aria-label="Ver 1 por linha"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="5" rx="1" ry="1"/><rect x="4" y="13" width="16" height="5" rx="1" ry="1"/></svg>
                    </button>
                  </div>
                </div>

                {/* Table Cards */}
                <div className={`
                  w-full px-4 md:px-0
                  ${tableMobileView === 'row' ? 'flex overflow-x-auto snap-x snap-mandatory pb-4 gap-4 hide-scrollbar -mx-4 px-4' : ''}
                  ${tableMobileView === 'grid-2' ? 'grid grid-cols-2 gap-3 pb-4' : ''}
                  ${tableMobileView === 'grid-1' ? 'flex flex-col gap-4 pb-4' : ''}
                  md:flex md:flex-wrap md:justify-center md:gap-6 md:max-w-7xl md:mx-auto md:overflow-visible
                `}>
                  {gameState.tableCards.map((tableCard) => {
                    const isMine = tableCard.isMine === true;

                    return (
                      <div 
                        key={tableCard.orderId} 
                        className={`
                          flex flex-col items-center shrink-0
                          ${tableMobileView === 'row' ? 'w-[60vw] max-w-[260px] snap-center snap-always' : ''}
                          ${tableMobileView === 'grid-2' ? 'w-full' : ''}
                          ${tableMobileView === 'grid-1' ? 'w-full max-w-[360px] mx-auto' : ''}
                          md:w-auto md:max-w-none
                        `}
                      >
                        <GameCard
                          card={tableCard.card}
                          size="full"
                          disabled={isNarrator || hasVoted || isMine || (currentPlayer?.isSpectator ?? false)}
                          dimWhenDisabled={false}
                          onClick={() => handleVoteSelect(tableCard)}
                          className={`
                            ${isMine ? 'opacity-50' : ''} 
                            ${!isMine && !hasVoted && !isNarrator && !currentPlayer?.isSpectator ? 'ring-2 ring-transparent hover:ring-amber-400' : ''}
                            md:!w-48 md:!h-72 lg:!w-56 lg:!h-84 md:!aspect-auto
                          `}
                          isHighlighted={hasVoted && gameState.votes[playerId] === tableCard.orderId}
                          highlightColor="#f59e0b"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ===== PLAYER HAND (Bottom) ===== */}
          {/* During OTHERS_CHOOSING (if already played/narrator) or VOTING (always): show status scoreboard */}
          {currentPlayer && !currentPlayer.isSpectator && (
            (gameState.phase === GamePhase.OTHERS_CHOOSING && (isNarrator || hasPlayed)) ||
            (gameState.phase === GamePhase.VOTING)
          ) && (
            <div className="pb-6 md:pb-10 pt-4 w-full bg-[#1A1A1A]/95 md:bg-[#1A1A1A]/60 backdrop-blur-md border-t border-white/10 relative z-10 px-4 md:px-8">
              <div className="max-w-screen-md w-full mx-auto">
                <p className="text-white/30 text-[10px] uppercase tracking-[0.25em] font-sans font-bold text-center mb-4">
                  {gameState.phase === GamePhase.VOTING ? t.game.playersVoting : t.game.playersChoosing}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {[...gameState.players]
                    .filter(p => !p.isSpectator)
                    .map(player => {
                      let done = false;
                      if (gameState.phase === GamePhase.VOTING) {
                        done = gameState.playersWhoVoted?.includes(player.id) || player.id === narrator?.id;
                      } else {
                        done = gameState.playersWhoPlayed?.includes(player.id) || player.id === narrator?.id;
                      }

                      const isMe = player.id === playerId;
                      return (
                        <div
                          key={player.id}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-300 ${
                            done
                              ? 'bg-green-500/10 border-green-500/20'
                              : 'bg-white/[0.03] border-white/5'
                          }`}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 border border-white/10"
                            style={{ backgroundColor: player.color }}
                          >
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <span className={`font-cinzel font-bold text-xs ${isMe ? 'text-amber-300' : 'text-white/70'}`}>
                            {player.name}{isMe && <span className="text-white/30 font-sans text-[9px] ml-1">({t.common.you})</span>}
                          </span>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                            done
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-black/40 text-white/20 border-white/5'
                          }`}>
                            {done ? (
                              <span className="text-[9px] font-bold leading-none">✓</span>
                            ) : (
                              <span className="text-[9px] opacity-40 leading-none">?</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
          )}

          {currentPlayer && !currentPlayer.isSpectator && !(
            (gameState.phase === GamePhase.OTHERS_CHOOSING && (isNarrator || hasPlayed)) ||
            (gameState.phase === GamePhase.VOTING)
          ) && (
            <div className="pb-6 md:pb-10 pt-4 w-full bg-[#1A1A1A]/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t border-white/10 md:border-none relative z-10 px-4 md:px-0">
              <div className="max-w-screen-2xl w-full mx-auto">
                <div className="md:hidden flex justify-between items-center mb-4 pt-2 px-2">
                  <span className="text-white/50 text-[10px] uppercase font-sans font-bold tracking-[0.2em]">{t.game.hand}</span>
                  <div className="flex bg-black/40 rounded-xl border border-white/10 p-1 backdrop-blur-sm">
                    <button
                      onClick={() => setMobileView('row')}
                      className={`p-2 rounded-lg transition-all ${mobileView === 'row' ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-white/40 hover:text-white/80'}`}
                      aria-label="Ver em carrossel"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="18" rx="1" ry="1"/><rect x="18" y="5" width="3" height="14" rx="1" ry="1"/><rect x="3" y="5" width="3" height="14" rx="1" ry="1"/></svg>
                    </button>
                    <button
                      onClick={() => setMobileView('grid-2')}
                      className={`p-2 rounded-lg transition-all ${mobileView === 'grid-2' ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-white/40 hover:text-white/80'}`}
                      aria-label="Ver 2 por linha"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" ry="1"/><rect x="14" y="3" width="7" height="7" rx="1" ry="1"/><rect x="14" y="14" width="7" height="7" rx="1" ry="1"/><rect x="3" y="14" width="7" height="7" rx="1" ry="1"/></svg>
                    </button>
                    <button
                      onClick={() => setMobileView('grid-1')}
                      className={`p-2 rounded-lg transition-all ${mobileView === 'grid-1' ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-white/40 hover:text-white/80'}`}
                      aria-label="Ver 1 por linha"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="5" rx="1" ry="1"/><rect x="4" y="13" width="16" height="5" rx="1" ry="1"/></svg>
                    </button>
                  </div>
                </div>

                {/* Cards */}
                <div className={`
                    ${mobileView === 'row' ? 'flex overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 gap-4 hide-scrollbar' : ''}
                    ${mobileView === 'grid-2' ? 'grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pb-4 hide-scrollbar' : ''}
                    ${mobileView === 'grid-1' ? 'flex flex-col gap-4 max-h-[50vh] overflow-y-auto pb-4 hide-scrollbar' : ''}
                    md:flex md:flex-row md:justify-center md:gap-6 md:flex-nowrap md:overflow-visible md:pb-6 md:pt-10 md:px-6
                  `}>
                  {currentPlayer.hand.map((card) => (
                    <div 
                      key={card.id} 
                      className={`
                        shrink-0
                        ${mobileView === 'row' ? 'w-[50vw] max-w-[220px] snap-center snap-always' : ''}
                        ${mobileView === 'grid-2' ? 'w-full' : ''}
                        ${mobileView === 'grid-1' ? 'w-full max-w-[320px] mx-auto' : ''}
                        md:w-auto md:max-w-none
                      `}
                    >
                      <GameCard
                        card={card}
                        size="full"
                        loading="eager"
                        disabled={
                          (gameState.phase === GamePhase.NARRATOR_CHOOSING && !isNarrator) ||
                          (gameState.phase === GamePhase.OTHERS_CHOOSING && (isNarrator || hasPlayed)) ||
                          gameState.phase === GamePhase.VOTING
                        }
                        onClick={() => handleCardSelect(card)}
                        className="md:!w-40 md:!h-56 lg:!w-44 lg:!h-64 md:!aspect-auto"
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

      {/* [SPECTATOR] Kick confirmation modal */}
      {kickTarget && onKickPlayer && (
        <KickConfirmModal
          playerName={kickTarget.name}
          onConfirm={() => {
            onKickPlayer(kickTarget.id);
            setKickTarget(null);
          }}
          onCancel={() => setKickTarget(null)}
        />
      )}
      {/* Leave confirmation modal */}
      {showLeaveConfirm && (
        <LeaveConfirmModal
          onConfirm={onLeaveRoom}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}

      {/* Mobile Score Modal */}
      {showScoreModal && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowScoreModal(false)} />
          <div className="relative bg-black/90 backdrop-blur-2xl border border-white/20 rounded-t-3xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-amber-300 font-cinzel font-bold text-base tracking-widest uppercase">{t.game.currentScore}</h3>
              <button
                onClick={() => setShowScoreModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="space-y-2">
              {[...gameState.players]
                .filter(p => !p.isSpectator)
                .sort((a, b) => b.score - a.score)
                .map((player, index) => {
                  const status = getPlayerStatus(player);
                  const isMe = player.id === playerId;
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border ${isMe ? 'bg-[#1A1A1A]/60 border-amber-500/30' : 'bg-[#1A1A1A]/40 border-white/5'}`}
                    >
                      <span className={`w-6 text-center font-cinzel font-bold text-sm shrink-0 ${index === 0 ? 'text-amber-400' : 'text-white/30'}`}>{index + 1}°</span>
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 border border-white/10 ${isMe ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-black' : ''}`}
                        style={{ backgroundColor: player.color }}
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-cinzel font-bold text-sm truncate">{player.name}{isMe && <span className="text-white/30 font-sans text-[10px] ml-1">({t.common.you})</span>}</div>
                      </div>
                      <div className={`font-sans font-black text-xl shrink-0 ${index === 0 ? 'text-amber-400' : 'text-white/80'}`}>{player.score}</div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border ${
                        status === 'voted' || status === 'played' || status === 'readied'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : status === 'narrator'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-black/40 text-white/30 border-white/5'
                      }`}>
                        {status === 'narrator' ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z"/><line x1="2" y1="19" x2="22" y2="19"/></svg>
                        ) : (status === 'voted' || status === 'played' || status === 'readied') ? (
                          <span className="text-[9px] font-bold">✓</span>
                        ) : (
                          <span className="opacity-30 text-[9px]">?</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            {gameState.players.some(p => p.isSpectator) && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-white/25 text-[10px] uppercase tracking-widest font-sans font-bold mb-2 flex items-center gap-2">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  {t.game.spectators}
                </p>
                <div className="space-y-1">
                  {gameState.players.filter(p => p.isSpectator).map(p => (
                    <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center border border-white/10 grayscale-[50%]" style={{ backgroundColor: p.color }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </div>
                      <span className="text-white/30 font-cinzel font-bold text-xs">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

  );
};
