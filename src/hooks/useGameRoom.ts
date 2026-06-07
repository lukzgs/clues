import { useCallback } from 'react';
import { useGameSocket } from './game/useGameSocket';
import { useGameActions } from './game/useGameActions';
import { useGameSession } from '../providers/GameSessionProvider';

interface UseGameRoomOptions {
  roomCode: string | null;
  playerName: string | null;
}

export function useGameRoom({ roomCode, playerName }: UseGameRoomOptions) {
  const { session, clearSession, setSession } = useGameSession();

  const handleJoinSuccess = useCallback((playerId: string) => {
    if (roomCode && playerName) {
      setSession({ roomCode, playerName, playerId });
    }
  }, [roomCode, playerName, setSession]);

  const handleKicked = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const {
    gameState,
    playerId,
    isConnected,
    error,
    roomCloseTime,
    setError,
    send,
    socketRef,
  } = useGameSocket({
    roomCode,
    playerName,
    savedPlayerId: session?.playerId,
    onJoinSuccess: handleJoinSuccess,
    onKicked: handleKicked,
  });

  const actions = useGameActions({ send, setError, socketRef });

  return {
    gameState,
    playerId,
    isConnected,
    error,
    clearError: useCallback(() => setError(null), [setError]),
    roomCloseTime,
    ...actions,
  };
}
