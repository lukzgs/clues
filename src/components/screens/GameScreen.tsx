import { useState, useEffect } from 'react';
import { GameState, GamePhase, Card, TableCard } from '../../types';
import { useTranslation } from '../../i18n';
import {
  ClueModal,
  ResultsView,
  GameOverView,
  AfkAlertBar,
  KickConfirmModal,
  LeaveConfirmModal
} from '../game';

import {
  GameHeader,
  PlayerSidebar,
  PlayerHand,
  MobileScoreModal,
  NarratorChoosingView,
  OthersChoosingView,
  VotingView
} from './game';

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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [hideHand, setHideHand] = useState(false);
  const [layout, setLayout] = useState<'row' | 'grid-1' | 'grid-2'>('row');
  const [tableMobileView, setTableMobileView] = useState<'row' | 'grid-1' | 'grid-2'>('grid-2');
  const { t } = useTranslation();

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const narrator = gameState.players[gameState.narratorIndex];
  const isNarrator = narrator?.id === playerId;
  const isHost = currentPlayer?.isHost ?? false;

  const hasPlayed = gameState.tableCards.some(tc => tc.isMine);
  const hasVoted = gameState.votes[playerId] !== undefined;

  const hasChosenCardFn = (id: string) => gameState.playersWhoPlayed.includes(id);
  const hasVotedFn = (id: string) => gameState.playersWhoVoted.includes(id);

  const shouldShowHand = !currentPlayer?.isSpectator && 
    ((gameState.phase === GamePhase.NARRATOR_CHOOSING && isNarrator && !hasChosenCardFn(playerId)) ||
    (gameState.phase === GamePhase.OTHERS_CHOOSING && !isNarrator && !hasChosenCardFn(playerId)));

  const handleCardSelect = (cardId: string) => {
    const numericCardId = Number(cardId);
    let card: Card | undefined;
    
    if (gameState.phase === GamePhase.VOTING) {
      const tc = gameState.tableCards.find(t => t.card.id === numericCardId);
      card = tc?.card;
    } else {
      card = currentPlayer?.hand.find(c => c.id === numericCardId);
    }
    
    if (!card) return;

    if (gameState.phase === GamePhase.NARRATOR_CHOOSING && isNarrator) {
      setSelectedCard(card);
      setShowClueModal(true);
    } else if (gameState.phase === GamePhase.OTHERS_CHOOSING && !isNarrator && !hasPlayed) {
      setSelectedCard(card);
      setShowClueModal(true);
    } else if (gameState.phase === GamePhase.VOTING && !isNarrator && !hasVoted) {
      const tc = gameState.tableCards.find(t => t.card.id === card?.id);
      if (tc && !tc.isMine) {
        setSelectedCard(card);
        setShowClueModal(true);
      }
    }
  };

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

  const handleKickConfirm = () => {
    if (kickTarget && onKickPlayer) {
      onKickPlayer(kickTarget.id);
      setKickTarget(null);
    }
  };

  const handleLeaveConfirm = () => {
    setShowLeaveConfirm(false);
    onLeaveRoom();
  };

  if (gameState.phase === GamePhase.RESULTS) {
    return (
      <div className="relative h-[100dvh] flex flex-col overflow-hidden z-0">
        <div className="fixed inset-0 pointer-events-none z-[-1]" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a1a, transparent 70%)' }} />
        <div className="fixed top-[30%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none z-[-1]" />
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <ResultsView
            gameState={gameState}
            playerId={playerId}
            onNextRound={onNextRound}
            onLeaveRoom={() => setShowLeaveConfirm(true)}
            onKickPlayer={onKickPlayer}
            isHost={currentPlayer?.isHost ?? false}
          />
        </div>
        {showLeaveConfirm && <LeaveConfirmModal onConfirm={handleLeaveConfirm} onCancel={() => setShowLeaveConfirm(false)} />}
      </div>
    );
  }

  if (gameState.phase === GamePhase.GAME_OVER) {
    return (
      <div className="relative h-[100dvh] flex flex-col overflow-hidden z-0">
        <div className="fixed inset-0 pointer-events-none z-[-1]" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a1a, transparent 70%)' }} />
        <div className="fixed top-[30%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none z-[-1]" />
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <GameOverView
            gameState={gameState}
            playerId={playerId}
            onRestartGame={onRestartGame}
            onLeaveRoom={() => setShowLeaveConfirm(true)}
          />
        </div>
        {showLeaveConfirm && <LeaveConfirmModal onConfirm={handleLeaveConfirm} onCancel={() => setShowLeaveConfirm(false)} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden relative text-white z-0">
      <div className="fixed inset-0 pointer-events-none z-[-1]" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a1a, transparent 70%)' }} />
      <div className="fixed top-[30%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none z-[-1]" />
      
      <GameHeader 
        roomCode={gameState.roomCode} 
        onLeaveRoom={() => setShowLeaveConfirm(true)} 
        phaseLabel={
          gameState.phase === GamePhase.LOBBY ? t.game.phaseLabelLobby :
          gameState.phase === GamePhase.NARRATOR_CHOOSING ? (isNarrator ? t.game.youAreNarrator : t.game.waitingForNarrator) :
          gameState.phase === GamePhase.OTHERS_CHOOSING ? t.game.phaseLabelOthersChoosing :
          gameState.phase === GamePhase.VOTING ? t.game.votingPhase :
          gameState.phase === GamePhase.RESULTS ? t.game.phaseLabelResults : t.game.phaseLabelGameOver
        } 
      />

      <div className="flex-1 flex flex-col min-h-0 w-full p-3 md:p-4 gap-3 md:gap-4 overflow-hidden">
        {gameState.timerEnabled && (
          <AfkAlertBar 
            gameState={gameState} 
          />
        )}

        {roomCloseTime && (
          <RoomTimeoutBar closeTime={roomCloseTime} />
        )}

        {currentPlayer?.isSpectator && (
          <div className="bg-blue-900/30 border border-blue-500/20 text-blue-200 text-center py-2 rounded-xl text-xs font-sans font-medium flex items-center justify-center gap-2 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            MODO ESPECTADOR
          </div>
        )}

        <div className="flex flex-1 min-h-0 w-full gap-3 md:gap-4 relative">
          <PlayerSidebar 
            gameState={gameState} 
            currentPlayer={currentPlayer} 
            isHost={isHost} 
            canRevealResults={false} 
            onKickPlayer={isHost ? (id) => setKickTarget({ id, name: gameState.players.find(p => p.id === id)?.name || 'Player' }) : undefined}
            hasChosenCard={hasChosenCardFn}
            hasVoted={hasVotedFn}
          />

          <div className="flex-1 flex flex-col min-h-0 relative overflow-visible">
            <main className="flex-1 flex flex-col min-h-0 overflow-y-auto relative z-10">
              <div className="flex flex-col items-center justify-start pt-0 pb-8 w-full min-h-full">
                {gameState.phase === GamePhase.NARRATOR_CHOOSING && (
                  <NarratorChoosingView 
                    isNarrator={isNarrator} 
                    narrator={narrator} 
                  />
                )}
                
                {gameState.phase === GamePhase.OTHERS_CHOOSING && (
                  <OthersChoosingView 
                    gameState={gameState} 
                    isNarrator={isNarrator} 
                    hasPlayed={hasPlayed} 
                  />
                )}

                {gameState.phase === GamePhase.VOTING && (
                  <VotingView 
                    gameState={gameState} 
                    isNarrator={isNarrator} 
                    hasVoted={hasVoted} 
                    selectedCard={selectedCard ? selectedCard.id.toString() : null}
                    onCardSelect={handleCardSelect}
                    onVote={() => setShowClueModal(true)}
                    tableMobileView={tableMobileView}
                    setTableMobileView={setTableMobileView}
                    isHost={isHost}
                  />
                )}
              </div>
            </main>

            <PlayerHand 
              gameState={gameState}
              currentPlayer={currentPlayer}
              selectedCard={selectedCard ? selectedCard.id.toString() : null}
              onCardSelect={handleCardSelect}
              onConfirmCard={() => setShowClueModal(true)}
              layout={layout}
              setLayout={setLayout}
              isMobileScoreOpen={showScoreModal}
              setIsMobileScoreOpen={setShowScoreModal}
              hideHand={hideHand}
              setHideHand={setHideHand}
              shouldShowHand={shouldShowHand}
              isNarrator={isNarrator}
              hasChosenCard={hasChosenCardFn(playerId)}
            />
          </div>
        </div>
      </div>

      <MobileScoreModal 
        gameState={gameState}
        currentPlayer={currentPlayer}
        isMobileScoreOpen={showScoreModal}
        setIsMobileScoreOpen={setShowScoreModal}
        isHost={isHost}
        onKickPlayer={isHost ? (id) => setKickTarget({ id, name: gameState.players.find(p => p.id === id)?.name || 'Player' }) : undefined}
        hasChosenCard={hasChosenCardFn}
        hasVoted={hasVotedFn}
      />

      {/* Modals Globais */}
      {showClueModal && selectedCard && (
        <ClueModal
          card={selectedCard}
          mode={
            gameState.phase === GamePhase.NARRATOR_CHOOSING ? 'narrator' :
            gameState.phase === GamePhase.VOTING ? 'voter' : 'player'
          }
          clueText={gameState.currentClue}
          onSubmit={handleSubmitModal}
          onClose={() => {
            setShowClueModal(false);
            setSelectedCard(null);
          }}
          onNextCard={handleNextCard}
          onPrevCard={handlePrevCard}
          isMine={
            gameState.phase === GamePhase.VOTING
              ? gameState.tableCards.find(tc => tc.card.id === selectedCard.id)?.isMine
              : false
          }
        />
      )}

      {kickTarget && (
        <KickConfirmModal
          playerName={kickTarget.name}
          onConfirm={handleKickConfirm}
          onCancel={() => setKickTarget(null)}
        />
      )}

      {showLeaveConfirm && (
        <LeaveConfirmModal
          onConfirm={handleLeaveConfirm}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}
    </div>
  );
};
