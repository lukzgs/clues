import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type GameSession = {
  roomCode: string;
  playerName: string;
  playerId?: string;
};

interface GameSessionContextType {
  session: GameSession | null;
  setSession: (session: GameSession | null) => void;
  clearSession: () => void;
  urlRoomCode: string | null;
  clearUrlRoomCode: () => void;
}

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);

export const SESSION_STORAGE_KEY = 'story-weaver:active_session';

export const GameSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSessionState] = useState<GameSession | null>(null);
  const [urlRoomCode, setUrlRoomCode] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setUrlRoomCode(roomFromUrl);
    }

    // 2. Check LocalStorage for active session
    try {
      const sessionStr = localStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionStr) {
        const parsedSession = JSON.parse(sessionStr);
        if (parsedSession.roomCode && parsedSession.playerName) {
          // If joining via link to a different room, ignore the old session
          if (!roomFromUrl || roomFromUrl === parsedSession.roomCode) {
            setSessionState({
              roomCode: parsedSession.roomCode,
              playerName: parsedSession.playerName,
              playerId: parsedSession.playerId,
            });
          } else {
            // Clear old session so it doesn't conflict later
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse session storage');
    }
    
    setIsLoaded(true);
  }, []);

  const setSession = useCallback((newSession: GameSession | null) => {
    console.log('[DEBUG GameSessionProvider] setSession called with:', newSession);
    setSessionState(prev => {
      if (prev === null && newSession === null) {
        console.log('[DEBUG GameSessionProvider] Both prev and newSession are null.');
        return prev;
      }
      if (prev && newSession) {
        const roomCodeEqual = prev.roomCode === newSession.roomCode;
        const playerNameEqual = prev.playerName === newSession.playerName;
        const playerIdEqual = prev.playerId === newSession.playerId;
        console.log('[DEBUG GameSessionProvider] comparing:', {
          prev,
          newSession,
          roomCodeEqual,
          playerNameEqual,
          playerIdEqual
        });
        if (roomCodeEqual && playerNameEqual && playerIdEqual) {
          console.log('[DEBUG GameSessionProvider] Objects match. Returning prev reference to bail out.');
          return prev;
        }
      }
      console.log('[DEBUG GameSessionProvider] Returning new session object.');
      return newSession;
    });
    
    if (newSession) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const clearUrlRoomCode = useCallback(() => {
    setUrlRoomCode(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, document.title, url.toString());
  }, []);

  const contextValue = React.useMemo(() => ({
    session,
    setSession,
    clearSession,
    urlRoomCode,
    clearUrlRoomCode
  }), [session, setSession, clearSession, urlRoomCode, clearUrlRoomCode]);

  if (!isLoaded) return null; // Or a loading spinner

  return (
    <GameSessionContext.Provider value={contextValue}>
      {children}
    </GameSessionContext.Provider>
  );
};

export const useGameSession = () => {
  const context = useContext(GameSessionContext);
  if (context === undefined) {
    throw new Error('useGameSession must be used within a GameSessionProvider');
  }
  return context;
};
