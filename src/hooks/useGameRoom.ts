import { useCallback } from 'react';
import { useGameSession } from '../providers/GameSessionProvider';
import { useGameActions } from './game/useGameActions';
import { useGameSocket } from './game/useGameSocket';

interface UseGameRoomOptions {
  roomCode: string | null;
  playerName: string | null;
}

export function useGameRoom({ roomCode, playerName }: UseGameRoomOptions) {
  const { session, clearSession, setSession } = useGameSession();

  const handleJoinSuccess = useCallback(
    (playerId: string, reconnectSecret?: string) => {
      if (roomCode && playerName) {
        setSession({ roomCode, playerName, playerId, reconnectSecret });
      }
    },
    [roomCode, playerName, setSession],
  );

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
    savedReconnectSecret: session?.reconnectSecret,
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
