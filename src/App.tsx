import React, { useCallback, useEffect, useState } from 'react';
import { GamePhase } from './types';
import { useGameRoom } from './hooks';
import { JoinScreen, LobbyScreen, GameScreen } from './components/screens';
import { DesignSystemScreen } from './components/design-system/DesignSystemScreen';
import { useTranslation } from './i18n/index.tsx';
import { GameSessionProvider, useGameSession } from './providers/GameSessionProvider';
import { ThemeProvider, useTheme } from './providers/ThemeProvider';
import { ToastProvider, useToast } from './providers/ToastProvider';

// Gera código de sala aleatório (criptograficamente seguro)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

const GameRouter: React.FC = () => {
  const { session, setSession, clearSession, urlRoomCode, clearUrlRoomCode } = useGameSession();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { addToast } = useToast();

  // Verifica se o usuario acessou /design-system ou /sysd
  const [isDesignSystem, setIsDesignSystem] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    return path === '/design-system' || path === '/sysd';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      setIsDesignSystem(path === '/design-system' || path === '/sysd');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isDesignSystem) {
    return (
      <DesignSystemScreen
        onBackToApp={() => {
          window.history.pushState({}, '', '/');
          setIsDesignSystem(false);
        }}
      />
    );
  }

  const {
    gameState,
    playerId,
    isConnected,
    error,
    clearError,
    roomCloseTime,
    startGame,
    updateSettings,
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
  } = useGameRoom({ roomCode: session?.roomCode || null, playerName: session?.playerName || null });

  // Connection & Reconnection Toasts (apenas se houve queda prévia)
  const wasDisconnectedRef = React.useRef(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isConnected) {
      if (wasDisconnectedRef.current) {
        addToast('success', t.connecting.reconnected, 'Conexão', 3500);
        wasDisconnectedRef.current = false;
      }
    } else {
      timer = setTimeout(() => {
        wasDisconnectedRef.current = true;
        addToast('warning', t.connecting.lostConnection, 'Conexão', 0);
      }, 1200);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isConnected, addToast, t.connecting.lostConnection, t.connecting.reconnected]);

  // Toast for server errors
  useEffect(() => {
    if (error) {
      addToast('error', error, 'Erro do Servidor');
      clearError();
    }
  }, [error, addToast, clearError]);

  // Toast for room inactivity timeout
  useEffect(() => {
    if (roomCloseTime) {
      const remainingSeconds = Math.max(0, Math.floor((roomCloseTime - Date.now()) / 1000));
      if (remainingSeconds > 0) {
        const minutes = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        addToast('warning', `A sala fechará por inatividade em ${minutes}:${secs.toString().padStart(2, '0')}`, 'Inatividade da Sala', 8000);
      }
    }
  }, [roomCloseTime, addToast]);

  const handleCreateRoom = useCallback((playerName: string) => {
    const roomCode = generateRoomCode();
    setSession({ roomCode, playerName });
  }, [setSession]);

  const handleJoinRoom = useCallback((roomCode: string, playerName: string) => {
    setSession({ roomCode, playerName });
  }, [setSession]);

  const handleLeaveRoom = useCallback(() => {
    leaveRoom();
    clearSession();
  }, [leaveRoom, clearSession]);

  const handleCancelInvite = useCallback(() => {
    clearUrlRoomCode();
  }, [clearUrlRoomCode]);

  // Se nao tiver sessao ativa, exibe JoinScreen
  if (!session) {
    return (
      <JoinScreen
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        prefillRoomCode={urlRoomCode || undefined}
        onCancelInvite={urlRoomCode ? handleCancelInvite : undefined}
      />
    );
  }

  // Se tem sessao, mas ainda nao recebeu o estado do backend
  if (!gameState || !playerId) {
    return (
      <div
        style={{ backgroundColor: theme.bgCanvas }}
        className="relative min-h-screen flex items-center justify-center p-3 md:p-4 transition-colors duration-500 text-white font-sans"
      >
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a1a, transparent 70%)' }}
        />
        <div
          className={`fixed top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none z-0 transition-all duration-700 ${theme.ambientOrb}`}
        />

        <div className="w-full max-w-[420px] z-10">
          <div
            className={`backdrop-blur-2xl border ring-1 ring-white/10 shadow-2xl rounded-2xl md:rounded-[2rem] p-8 md:p-10 flex flex-col items-center transition-all duration-500 ${theme.cardBg} ${theme.accentBorder}`}
            style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' }}
          >
            <div className={`mb-5 md:mb-6 relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full border bg-black/50 ring-1 ring-white/10 ${theme.accentBgLight} ${theme.accentBorder} ${theme.glowShadow}`}>
              <div className={`absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin ${theme.accentText}`} />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`md:w-5 md:h-5 transition-colors duration-300 ${theme.accentText}`}>
                <path d="M2 4l3 11h14l3-11-5 4-5-5-5 5z" />
                <line x1="2" y1="19" x2="22" y2="19" />
              </svg>
            </div>

            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 font-sans font-medium">
              {t.connecting.label}
            </p>
            <div className={`rounded-xl px-4 md:px-5 py-2 md:py-2.5 inline-block border mb-2 transition-all duration-300 ${theme.accentBorder} ${theme.accentBgLight}`}>
              <span className={`text-lg md:text-xl font-cinzel font-bold tracking-wider ${theme.accentText}`}>
                {session.roomCode}
              </span>
            </div>
            <p className="text-white/15 text-[10px] font-sans tracking-wide">
              {t.connecting.joiningRoom}
            </p>

            <div className={`mt-5 md:mt-6 w-full text-center transition-all duration-300 ${error ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
              <button
                onClick={() => clearSession()}
                className="text-white/30 hover:text-white/60 text-[10px] uppercase tracking-widest font-sans font-bold transition-colors"
              >
                {t.connecting.back}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.phase === GamePhase.LOBBY) {
    return (
      <LobbyScreen
        gameState={gameState}
        currentPlayer={gameState.players.find(p => p.id === playerId)}
        onStartGame={startGame}
        onUpdateSettings={updateSettings}
        onLeaveRoom={handleLeaveRoom}
        onAddBot={addBot}
        onRemoveBot={removeBot}
        onKickPlayer={kickPlayer}
        onToggleSpectator={toggleSpectator}
        onRequestPlay={requestPlay}
      />
    );
  }

  return (
    <GameScreen
      gameState={gameState}
      playerId={playerId}
      roomCloseTime={roomCloseTime}
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

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <GameSessionProvider>
          <GameRouter />
        </GameSessionProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
