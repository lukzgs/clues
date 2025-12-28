import { useCallback, useEffect, useRef, useState } from 'react';
import PartySocket from 'partysocket';
import { 
  GameState, 
  ClientMessageType, 
  ServerMessageType,
  ServerMessage,
} from '../types';
import { PARTYKIT_HOST } from '../constants';

// ============================================
// TIPOS DO HOOK
// ============================================

interface UseGameRoomOptions {
  roomCode: string;
  playerName: string;
}

interface UseGameRoomReturn {
  // Estado
  gameState: GameState | null;
  playerId: string | null;
  isConnected: boolean;
  error: string | null;
  
  // Ações
  startGame: () => void;
  submitClue: (cardId: number, clue: string) => void;
  playCard: (cardId: number) => void;
  vote: (oderId: number) => void;
  nextRound: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useGameRoom({ 
  roomCode, 
  playerName 
}: UseGameRoomOptions): UseGameRoomReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<PartySocket | null>(null);
  const hasJoinedRef = useRef(false);

  // Conecta ao servidor
  useEffect(() => {
    if (!roomCode || !playerName) return;

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomCode,
    });

    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setIsConnected(true);
      setError(null);
      
      // Entra na sala
      if (!hasJoinedRef.current) {
        socket.send(JSON.stringify({
          type: ClientMessageType.JOIN_ROOM,
          playerName,
        }));
        hasJoinedRef.current = true;
      }
    });

    socket.addEventListener('message', (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);

        switch (msg.type) {
          case ServerMessageType.SYNC_STATE:
            setGameState(msg.gameState);
            if (msg.yourPlayerId) {
              setPlayerId(msg.yourPlayerId);
            }
            break;

          case ServerMessageType.ERROR:
            setError(msg.message);
            break;

          case ServerMessageType.PLAYER_JOINED:
            // Poderia mostrar toast, mas o SYNC_STATE já atualiza
            break;

          case ServerMessageType.PLAYER_LEFT:
            // Poderia mostrar toast, mas o SYNC_STATE já atualiza
            break;
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });

    socket.addEventListener('close', () => {
      setIsConnected(false);
      hasJoinedRef.current = false;
    });

    socket.addEventListener('error', () => {
      setError('Erro de conexão');
      setIsConnected(false);
    });

    return () => {
      socket.close();
      socketRef.current = null;
      hasJoinedRef.current = false;
    };
  }, [roomCode, playerName]);

  // Helper para enviar mensagens
  const send = useCallback((message: object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  // ============================================
  // AÇÕES DO JOGO
  // ============================================

  const startGame = useCallback(() => {
    send({ type: ClientMessageType.START_GAME });
  }, [send]);

  const submitClue = useCallback((cardId: number, clue: string) => {
    send({ 
      type: ClientMessageType.SUBMIT_CLUE, 
      cardId, 
      clue 
    });
  }, [send]);

  const playCard = useCallback((cardId: number) => {
    send({ 
      type: ClientMessageType.PLAY_CARD, 
      cardId 
    });
  }, [send]);

  const vote = useCallback((oderId: number) => {
    send({ 
      type: ClientMessageType.VOTE, 
      oderId 
    });
  }, [send]);

  const nextRound = useCallback(() => {
    send({ type: ClientMessageType.NEXT_ROUND });
  }, [send]);

  const restartGame = useCallback(() => {
    send({ type: ClientMessageType.RESTART_GAME });
  }, [send]);

  const leaveRoom = useCallback(() => {
    send({ type: ClientMessageType.LEAVE_ROOM });
    socketRef.current?.close();
  }, [send]);

  return {
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
  };
}
