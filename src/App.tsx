import React, { useCallback, useEffect, useState } from 'react';
import { GamePhase } from './types';
import { useGameRoom } from './hooks';
import { JoinScreen, LobbyScreen, GameScreen } from './components/screens';
import { DesignSystemScreen } from './components/design-system/DesignSystemScreen';
import { useTranslation } from './i18n/index.tsx';
import { GameSessionProvider, useGameSession } from './providers/GameSessionProvider';
import { ThemeProvider, useTheme } from './providers/ThemeProvider';
import { LanguageToggle } from './components/ui/LanguageToggle';
import { ThemeToggle } from './components/ui/ThemeToggle';

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

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnected'>('connected');

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isConnected) {
      setConnectionStatus(prev => {
        if (prev === 'disconnected') {
          timer = setTimeout(() => {
            setConnectionStatus('connected');
          }, 2500);
          return 'reconnected';
        }
        return 'connected';
      });
    } else {
      timer = setTimeout(() => {
        setConnectionStatus('disconnected');
      }, 1200);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isConnected]);

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

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error && gameState) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, gameState, clearError]);

  // Tela de join
  if (!session) {
    return (
      <JoinScreen
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        prefillRoomCode={urlRoomCode || undefined}
        onCancelInvite={handleCancelInvite}
      />
    );
  }

  // Tela de conexão
  if (!gameState || !playerId) {
    return (
      <div
        style={{ backgroundColor: theme.bgCanvas }}
        className="relative min-h-screen flex items-center justify-center p-3 md:p-4 transition-colors duration-500 text-white font-sans"
      >
        <div className="fixed top-4 right-4 z-[300] flex items-center gap-2">
          <ThemeToggle className="relative! top-auto! right-auto! z-auto!" />
          <LanguageToggle className="relative! top-auto! right-auto! z-auto!" />
        </div>

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
              <div className="flex items-center justify-center gap-1.5 text-red-500/90 text-[10px] uppercase tracking-[0.15em] font-sans font-medium mb-4">
                <span>{error}</span>
              </div>
              <button
                onClick={() => clearSession()}
                className="text-white/30 hover:text-white/60 text-[10px] uppercase tracking-widest font-sans font-bold transition-colors"
              >
                {t.connecting.back}
              </button>
            </div>
          </div>
        </div>

        <div className="fixed bottom-4 md:bottom-6 w-full text-center z-0 pointer-events-none">
          <p className="text-white/20 text-[10px] font-sans tracking-wide">
            {t.common.copyright}
          </p>
        </div>
      </div>
    );
  }

  const showBanner = connectionStatus !== 'connected';
  const isReconnecting = connectionStatus === 'disconnected';

  const connectionOverlay = (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          showBanner ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className={`backdrop-blur-md border-b px-4 py-2.5 flex items-center justify-center gap-3 transition-colors duration-300 ${
          isReconnecting 
            ? 'bg-amber-950/90 border-amber-500/30 text-amber-200' 
            : 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
        }`}>
          {isReconnecting ? (
            <div className="w-4 h-4 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-300 animate-spin" />
            </div>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300 shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )}
          <span className="text-xs font-sans font-medium tracking-wide">
            {isReconnecting ? t.connecting.lostConnection : t.connecting.reconnected}
          </span>
        </div>
      </div>

      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-400 ${
          error && isConnected ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-red-900/80 backdrop-blur-md border border-red-500/30 rounded-xl px-5 py-3 flex items-center gap-3 shadow-lg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-300 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span className="text-red-200 text-xs font-sans font-medium">{error}</span>
          <button onClick={clearError} className="text-red-300/60 hover:text-red-200 transition-colors ml-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  if (gameState.phase === GamePhase.LOBBY) {
    return (
      <>
        {connectionOverlay}
        <LobbyScreen
          gameState={gameState}
          currentPlayer={gameState.players.find((p: any) => p.id === playerId)}
          onStartGame={startGame}
          onUpdateSettings={updateSettings}
          onLeaveRoom={handleLeaveRoom}
          onAddBot={addBot}
          onRemoveBot={removeBot}
          onKickPlayer={kickPlayer}
          onToggleSpectator={toggleSpectator}
          onRequestPlay={requestPlay}
        />
      </>
    );
  }

  return (
    <>
      {connectionOverlay}
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
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <GameSessionProvider>
        <GameRouter />
      </GameSessionProvider>
    </ThemeProvider>
  );
};

export default App;
