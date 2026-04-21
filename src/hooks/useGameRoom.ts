import { useCallback, useEffect, useRef, useState } from 'react';
import PartySocket from 'partysocket';
import {
  GameState,
  ClientMessageType,
  ServerMessageType,
  ServerMessage,
  VictoryCondition,
  DeckOption,
} from '../types';
import { PARTYKIT_HOST } from '../constants';
import {
  JoinRoomSchema,
  SubmitClueSchema,
  PlayCardSchema,
  VoteSchema,
  RemoveBotSchema,
  StartGameSchema,
} from '../schemas';

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

  // Acoes
  startGame: (victoryCondition: VictoryCondition, deckOption: DeckOption) => void;
  submitClue: (cardId: number, clue: string) => void;
  playCard: (cardId: number) => void;
  vote: (orderId: number) => void;
  nextRound: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
  // [BOT] Ações de bots
  addBot: () => void;
  removeBot: (botId: string) => void;

  // AFK
  voteKickAfk: () => void;
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

  // sessionStorage key for reconnection
  const storageKey = `clues:playerId:${roomCode}`;

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

      // Entra na sala (com validação)
      if (!hasJoinedRef.current) {
        const savedPlayerId = sessionStorage.getItem(storageKey) || undefined;
        const result = JoinRoomSchema.safeParse({
          type: 'JOIN_ROOM',
          playerName,
          reconnectId: savedPlayerId,
        });
        if (result.success) {
          socket.send(JSON.stringify(result.data));
          hasJoinedRef.current = true;
        }
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
              // Persist playerId for reconnection
              sessionStorage.setItem(storageKey, msg.yourPlayerId);
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

  const startGame = useCallback((victoryCondition: VictoryCondition, deckOption: DeckOption) => {
    const result = StartGameSchema.safeParse({
      type: ClientMessageType.START_GAME,
      victoryCondition,
      deckOption,
    });
    if (result.success) {
      send(result.data);
    }
  }, [send]);

  const submitClue = useCallback((cardId: number, clue: string) => {
    const result = SubmitClueSchema.safeParse({
      type: 'SUBMIT_CLUE',
      cardId,
      clue
    });
    if (result.success) {
      send(result.data);
    } else {
      setError(result.error.issues[0]?.message || 'Dados inválidos');
    }
  }, [send]);

  const playCard = useCallback((cardId: number) => {
    send({
      type: ClientMessageType.PLAY_CARD,
      cardId
    });
  }, [send]);

  const vote = useCallback((orderId: number) => {
    const result = VoteSchema.safeParse({
      type: 'VOTE',
      orderId
    });
    if (result.success) {
      send(result.data);
    }
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

  // [BOT] Ações de bots
  const addBot = useCallback(() => {
    send({ type: ClientMessageType.ADD_BOT });
  }, [send]);

  const removeBot = useCallback((botId: string) => {
    const result = RemoveBotSchema.safeParse({
      type: 'REMOVE_BOT',
      botId
    });
    if (result.success) {
      send(result.data);
    }
  }, [send]);

  const voteKickAfk = useCallback(() => {
    send({ type: ClientMessageType.VOTE_KICK_AFK });
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
    addBot,
    removeBot,
    voteKickAfk,
  };
}
