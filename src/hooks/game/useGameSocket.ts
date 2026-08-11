import PartySocket from 'partysocket';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PARTYKIT_HOST } from '../../constants';
import { JoinRoomSchema } from '../../schemas/messages';
import { type GameState, ServerMessageType } from '../../types';

interface UseGameSocketProps {
  roomCode: string | null;
  playerName: string | null;
  savedPlayerId?: string;
  savedReconnectSecret?: string;
  onJoinSuccess: (playerId: string, reconnectSecret?: string) => void;
  onKicked: () => void;
}

export function useGameSocket({
  roomCode,
  playerName,
  savedPlayerId,
  savedReconnectSecret,
  onJoinSuccess,
  onKicked,
}: UseGameSocketProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(
    savedPlayerId || null,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomCloseTime, setRoomCloseTime] = useState<number | null>(null);

  const socketRef = useRef<PartySocket | null>(null);
  const hasJoinedRef = useRef(false);

  // Use refs to avoid stale closures inside event listeners
  // and to avoid triggering socket reconnections when these values change.
  const savedPlayerIdRef = useRef(savedPlayerId);
  const savedReconnectSecretRef = useRef(savedReconnectSecret);
  const playerIdRef = useRef(playerId);
  const onJoinSuccessRef = useRef(onJoinSuccess);
  const onKickedRef = useRef(onKicked);

  const gameStateRef = useRef<GameState | null>(null);

  useEffect(() => {
    savedPlayerIdRef.current = savedPlayerId;
  }, [savedPlayerId]);

  useEffect(() => {
    savedReconnectSecretRef.current = savedReconnectSecret;
  }, [savedReconnectSecret]);

  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    onJoinSuccessRef.current = onJoinSuccess;
  }, [onJoinSuccess]);

  useEffect(() => {
    onKickedRef.current = onKicked;
  }, [onKicked]);

  useEffect(() => {
    if (!roomCode || !playerName) return;

    let connectionTimeout: NodeJS.Timeout | null = setTimeout(() => {
      if (!hasJoinedRef.current || !gameStateRef.current) {
        console.warn(
          'Connection timeout: room is likely gone or server is down.',
        );
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
          reconnectSecret: savedReconnectSecretRef.current,
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
        const msg = JSON.parse(event.data) as {
          type: string;
          closeTime?: number;
          gameState?: GameState;
          yourPlayerId?: string;
          yourReconnectSecret?: string;
          message?: string;
          playerId?: string;
        };

        switch (msg.type) {
          case 'SERVER_CLOSING_WARNING':
            if (msg.closeTime !== undefined) {
              setRoomCloseTime(msg.closeTime);
            }
            break;

          case 'SERVER_CLOSING_CANCELLED':
            setRoomCloseTime(null);
            break;

          case 'SERVER_CLOSED':
            setError('A sala foi fechada por inatividade');
            setGameState(null);
            break;

          case ServerMessageType.SYNC_STATE:
            if (msg.gameState) {
              setGameState(msg.gameState);
            }
            if (msg.yourPlayerId) {
              setPlayerId(msg.yourPlayerId);
              onJoinSuccessRef.current(
                msg.yourPlayerId,
                msg.yourReconnectSecret,
              );

              if (connectionTimeout) {
                clearTimeout(connectionTimeout);
                connectionTimeout = null;
              }
            } else {
              // Se não recebemos seu ID de jogador confirmado do servidor, mas nós temos
              // um ID salvo (savedPlayerId) que não está na lista de jogadores conectados no gameState recebido,
              // forçamos o re-join para garantir que a conexão atual seja associada a este jogador.
              const mySavedId = savedPlayerIdRef.current;
              const isMySavedIdConnected =
                mySavedId &&
                msg.gameState?.players?.some(
                  (p) => p.id === mySavedId && p.isConnected,
                );

              if (mySavedId && !isMySavedIdConnected) {
                const result = JoinRoomSchema.safeParse({
                  type: 'JOIN_ROOM',
                  playerName,
                  reconnectId: mySavedId,
                  reconnectSecret: savedReconnectSecretRef.current,
                });
                if (result.success) {
                  socket.send(JSON.stringify(result.data));
                  hasJoinedRef.current = true;
                }
              }
            }
            break;

          case ServerMessageType.ERROR:
            if (msg.message) {
              setError(msg.message);
            }
            hasJoinedRef.current = false;
            break;

          case ServerMessageType.PLAYER_KICKED:
            if (
              msg.playerId === playerIdRef.current ||
              msg.playerId === savedPlayerIdRef.current
            ) {
              onKickedRef.current();
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
  }, [roomCode, playerName]); // Removed savedPlayerId, onJoinSuccess and onKicked to prevent reconnection loops

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
