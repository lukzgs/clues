import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GamePhase } from './types';
import { useGameRoom } from './hooks';
import { JoinScreen, LobbyScreen, GameScreen } from './components/screens';

// Gera código de sala aleatório (criptograficamente seguro)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

type AppState =
  | { screen: 'join' }
  | { screen: 'connecting'; roomCode: string; playerName: string }
  | { screen: 'game'; roomCode: string; playerName: string };

const getInitialState = (): AppState => {
  try {
    const sessionStr = sessionStorage.getItem('story-weaver:active_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session.roomCode && session.playerName) {
        return { screen: 'connecting', roomCode: session.roomCode, playerName: session.playerName };
      }
    }
  } catch (e) {
    console.warn('Failed to parse session storage');
  }
  return { screen: 'join' };
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(getInitialState());

  // Hook do jogo - só conecta quando temos roomCode e playerName
  const {
    gameState,
    playerId,
    isConnected,
    error,
    startGame,
    submitClue,
    playCard,
    vote,
    nextRound,
    restartGame,
    leaveRoom,
    addBot,
    removeBot,
    voteKickAfk,
    kickPlayer,
    toggleSpectator,
    requestPlay,
  } = useGameRoom({
    roomCode: appState.screen !== 'join' ? appState.roomCode : '',
    playerName: appState.screen !== 'join' ? appState.playerName : '',
  });

  // Handlers
  const handleCreateRoom = useCallback((playerName: string) => {
    const roomCode = generateRoomCode();
    setAppState({ screen: 'connecting', roomCode, playerName });
  }, []);

  const handleJoinRoom = useCallback((roomCode: string, playerName: string) => {
    setAppState({ screen: 'connecting', roomCode, playerName });
  }, []);

  const handleLeaveRoom = useCallback(() => {
    leaveRoom();
    sessionStorage.removeItem('story-weaver:active_session');
    setAppState({ screen: 'join' });
  }, [leaveRoom]);

  // Transição de connecting para game quando conectado
  useEffect(() => {
    if (appState.screen === 'connecting' && isConnected && gameState) {
      setAppState(prev =>
        prev.screen === 'connecting'
          ? { screen: 'game', roomCode: prev.roomCode, playerName: prev.playerName }
          : prev
      );
    }
  }, [appState.screen, isConnected, gameState]);

  // Extract ?room= from URL (invite link)
  const prefillRoomCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room')?.toUpperCase();
    if (room && room.length === 6) {
      // Clean up URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
      return room;
    }
    return undefined;
  }, []);

  // Tela de join
  if (appState.screen === 'join') {
    return (
      <JoinScreen
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        prefillRoomCode={prefillRoomCode}
      />
    );
  }

  // Tela de conexão
  if (appState.screen === 'connecting' || !gameState || !playerId) {
    const roomCode = appState.screen === 'connecting' ? appState.roomCode :
      appState.screen === 'game' ? appState.roomCode : '';
    return (
      <div className="relative min-h-screen flex items-center justify-center p-3 md:p-4">
        {/* Ambient Lighting — same as JoinScreen */}
        <div
          className="fixed inset-0 pointer-events-none z-[-1]"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a1a, transparent 70%)' }}
        />
        <div
          className="fixed top-[30%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none z-[-1]"
        />

        <div className="w-full max-w-[420px] z-10">
          <div
            className="bg-black/40 backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-[2rem] p-8 md:p-10 flex flex-col items-center"
            style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' }}
          >
            {/* Spinner */}
            <div className="mb-5 md:mb-6 relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 animate-spin" />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-200/60 md:w-5 md:h-5">
                <path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z" />
                <line x1="2" y1="19" x2="22" y2="19" />
              </svg>
            </div>

            {/* Text */}
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 font-sans font-medium">
              Connecting
            </p>
            <div className="bg-[#1A1A1A]/50 rounded-xl px-4 md:px-5 py-2 md:py-2.5 inline-block border border-white/10 mb-2">
              <span className="text-lg md:text-xl font-cinzel font-bold text-amber-300 tracking-wider">
                {roomCode}
              </span>
            </div>
            <p className="text-white/15 text-[10px] font-sans tracking-wide">
              Joining room...
            </p>

            {/* Error Display */}
            <div className={`mt-5 md:mt-6 w-full text-center transition-all duration-300 ${error ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
              <div className="flex items-center justify-center gap-1.5 text-red-500/90 text-[10px] uppercase tracking-[0.15em] font-sans font-medium mb-4">
                <span>{error}</span>
              </div>
              <button
                onClick={() => setAppState({ screen: 'join' })}
                className="text-white/30 hover:text-white/60 text-[10px] uppercase tracking-widest font-sans font-bold transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-4 md:bottom-6 w-full text-center z-0 pointer-events-none">
          <p className="text-white/20 text-[10px] font-sans tracking-wide">
            &copy; 2026 Story Weaver. Crafted for imagination.
          </p>
        </div>
      </div>
    );
  }

  // Tela de lobby
  if (gameState.phase === GamePhase.LOBBY) {
    return (
      <LobbyScreen
        gameState={gameState}
        currentPlayer={gameState.players.find(p => p.id === playerId)}
        onStartGame={startGame}
        onLeaveRoom={handleLeaveRoom}
        onAddBot={addBot}
        onRemoveBot={removeBot}
        onKickPlayer={kickPlayer}
        onToggleSpectator={toggleSpectator}
        onRequestPlay={requestPlay}
      />
    );
  }

  // Tela de jogo
  return (
    <GameScreen
      gameState={gameState}
      playerId={playerId}
      onSubmitClue={submitClue}
      onPlayCard={playCard}
      onVote={vote}
      onNextRound={nextRound}
      onRestartGame={restartGame}
      onLeaveRoom={handleLeaveRoom}
      voteKickAfk={voteKickAfk}
      onKickPlayer={kickPlayer}
    />
  );
};

export default App;
