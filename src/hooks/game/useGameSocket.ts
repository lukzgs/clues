import { useState, useEffect, useRef, useCallback } from 'react';
import PartySocket from 'partysocket';
import { GameState, ServerMessageType } from '../../types';
import { JoinRoomSchema } from '../../schemas/messages';
import { PARTYKIT_HOST } from '../../constants';

interface UseGameSocketProps {
  roomCode: string | null;
  playerName: string | null;
  savedPlayerId?: string;
  onJoinSuccess: (playerId: string) => void;
  onKicked: () => void;
}

export function useGameSocket({
  roomCode,
  playerName,
  savedPlayerId,
  onJoinSuccess,
  onKicked,
}: UseGameSocketProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(savedPlayerId || null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomCloseTime, setRoomCloseTime] = useState<number | null>(null);

  const socketRef = useRef<PartySocket | null>(null);
  const hasJoinedRef = useRef(false);

  // Use refs to avoid stale closures inside event listeners
  // and to avoid triggering socket reconnections when these values change.
  const savedPlayerIdRef = useRef(savedPlayerId);
  const playerIdRef = useRef(playerId);

  useEffect(() => {
    savedPlayerIdRef.current = savedPlayerId;
  }, [savedPlayerId]);

  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  useEffect(() => {
    if (!roomCode || !playerName) return;

    let connectionTimeout: NodeJS.Timeout | null = setTimeout(() => {
      if (!hasJoinedRef.current || !gameState) {
        console.warn('Connection timeout: room is likely gone or server is down.');
        setError('Não foi possível conectar à sala (tempo limite esgotado)');
        setIsConnected(false);
        hasJoinedRef.current = false;
        if (socketRef.current) {
          socketRef.current.close();
        }
      }
    }, 3000);

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomCode,
    });

    socketRef.current = socket;

    socket.addEventListener('open', () => {
      if (socketRef.current !== socket) return;
      setIsConnected(true);
      setError(null);

      // Entra na sala (com validação)
      if (!hasJoinedRef.current) {
        const result = JoinRoomSchema.safeParse({
          type: 'JOIN_ROOM',
          playerName,
          reconnectId: savedPlayerIdRef.current,
        });
        
        if (result.success) {
          socket.send(JSON.stringify(result.data));
          hasJoinedRef.current = true;
        }
      }
    });

    socket.addEventListener('message', (event) => {
      if (socketRef.current !== socket) return;
      try {
        const rawMsg = JSON.parse(event.data);
        const msg: any = rawMsg;

        switch (msg.type) {
          case 'SERVER_CLOSING_WARNING':
            setRoomCloseTime((msg as any).closeTime);
            break;

          case 'SERVER_CLOSING_CANCELLED':
            setRoomCloseTime(null);
            break;

          case 'SERVER_CLOSED':
            setError('A sala foi fechada por inatividade');
            setGameState(null);
            break;

          case ServerMessageType.SYNC_STATE:
            console.log('[DEBUG-CLIENT] SYNC_STATE recebido:', {
              phase: msg.gameState?.phase,
              playersWhoVoted: msg.gameState?.playersWhoVoted
            });
            setGameState(msg.gameState);
            if (msg.yourPlayerId) {
              setPlayerId(msg.yourPlayerId);
              onJoinSuccess(msg.yourPlayerId);
              
              if (connectionTimeout) {
                clearTimeout(connectionTimeout);
                connectionTimeout = null;
              }
            }
            break;

          case ServerMessageType.ERROR:
            setError(msg.message);
            hasJoinedRef.current = false;
            break;

          case ServerMessageType.PLAYER_KICKED:
            if ((msg as any).playerId === playerIdRef.current || (msg as any).playerId === savedPlayerIdRef.current) {
              onKicked();
              setError('Você foi removido da sala');
              socket.close();
            }
            break;
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });

    socket.addEventListener('close', () => {
      if (socketRef.current === socket) {
        setIsConnected(false);
        hasJoinedRef.current = false;
      }
    });

    socket.addEventListener('error', () => {
      if (socketRef.current === socket) {
        setError('Erro de conexão');
        setIsConnected(false);
      }
    });

    return () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      socket.close();
      socketRef.current = null;
      hasJoinedRef.current = false;
    };
  }, [roomCode, playerName, onJoinSuccess, onKicked]); // Removed savedPlayerId to prevent reconnection loops

  const send = useCallback((message: object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    gameState,
    playerId,
    isConnected,
    error,
    roomCloseTime,
    setError,
    send,
    socketRef,
  };
}

