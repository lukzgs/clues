import { useCallback } from 'react';
import PartySocket from 'partysocket';
import { 
  ClientMessageType, 
  VictoryCondition, 
  DeckOption, 
  PhaseTimeouts 
} from '../../types';
import { 
  StartGameSchema, 
  UpdateSettingsSchema, 
  SubmitClueSchema, 
  VoteSchema, 
  RemoveBotSchema 
} from '../../schemas/messages';

interface UseGameActionsProps {
  send: (message: object) => void;
  setError: (error: string) => void;
  socketRef: React.MutableRefObject<PartySocket | null>;
}

export function useGameActions({ send, setError, socketRef }: UseGameActionsProps) {
  
  const startGame = useCallback((victoryCondition: VictoryCondition, deckOption: DeckOption, phaseTimeouts: PhaseTimeouts) => {
    const result = StartGameSchema.safeParse({
      type: ClientMessageType.START_GAME,
      victoryCondition,
      deckOption,
      phaseTimeouts,
    });
    if (result.success) {
      send(result.data);
    } else {
      console.error('Validation failed for START_GAME:', result.error);
    }
  }, [send]);

  const updateSettings = useCallback((victoryCondition: VictoryCondition, deckOption: DeckOption, phaseTimeouts: PhaseTimeouts) => {
    const result = UpdateSettingsSchema.safeParse({
      type: ClientMessageType.UPDATE_SETTINGS,
      victoryCondition,
      deckOption,
      phaseTimeouts,
    });
    if (result.success) {
      send(result.data);
    } else {
      console.error('Validation failed for UPDATE_SETTINGS:', result.error);
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
  }, [send, setError]);

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
  }, [send, socketRef]);

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

  // [SPECTATOR] Ações de spectator/kick
  const kickPlayer = useCallback((targetId: string) => {
    send({ type: ClientMessageType.KICK_PLAYER, targetPlayerId: targetId });
  }, [send]);

  const toggleSpectator = useCallback((targetId: string) => {
    send({ type: ClientMessageType.TOGGLE_SPECTATOR, targetPlayerId: targetId });
  }, [send]);

  const requestPlay = useCallback(() => {
    send({ type: ClientMessageType.REQUEST_PLAY });
  }, [send]);

  return {
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
  };
}
