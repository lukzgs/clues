// ============================================
// TIPOS BASE
// ============================================

export interface Card {
  id: number;
  imageUrl: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  hand: Card[];
  color: string;
  isConnected: boolean;
  isHost: boolean;
  isBot?: boolean; // [BOT] Flag para identificar bots
}

export interface TableCard {
  orderId: number;  // Ordem para embaralhar na votação
  playerId: string;
  card: Card;
}

export enum GamePhase {
  LOBBY = 'LOBBY',
  NARRATOR_CHOOSING = 'NARRATOR_CHOOSING',
  OTHERS_CHOOSING = 'OTHERS_CHOOSING',
  VOTING = 'VOTING',
  RESULTS = 'RESULTS',
  GAME_OVER = 'GAME_OVER'
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  narratorIndex: number;
  currentClue: string;
  tableCards: TableCard[];
  votes: Record<string, number>; // orderId do cardId votado
  winner: string | null;
  deckCount: number; // Não enviamos o deck inteiro para o cliente
}

// Estado completo do servidor (não exposto ao cliente)
export interface ServerGameState extends Omit<GameState, 'deckCount'> {
  deck: Card[];
}

// ============================================
// CORES DOS JOGADORES
// ============================================

export const PLAYER_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
] as const;

// ============================================
// MENSAGENS CLIENTE -> SERVIDOR
// ============================================

export enum ClientMessageType {
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  START_GAME = 'START_GAME',
  SUBMIT_CLUE = 'SUBMIT_CLUE',
  PLAY_CARD = 'PLAY_CARD',
  VOTE = 'VOTE',
  NEXT_ROUND = 'NEXT_ROUND',
  RESTART_GAME = 'RESTART_GAME',
  // [BOT] Mensagens para controle de bots
  ADD_BOT = 'ADD_BOT',
  REMOVE_BOT = 'REMOVE_BOT',
}

export interface JoinRoomMessage {
  type: ClientMessageType.JOIN_ROOM;
  playerName: string;
}

export interface LeaveRoomMessage {
  type: ClientMessageType.LEAVE_ROOM;
}

export interface StartGameMessage {
  type: ClientMessageType.START_GAME;
}

export interface SubmitClueMessage {
  type: ClientMessageType.SUBMIT_CLUE;
  cardId: number;
  clue: string;
}

export interface PlayCardMessage {
  type: ClientMessageType.PLAY_CARD;
  cardId: number;
}

export interface VoteMessage {
  type: ClientMessageType.VOTE;
  orderId: number;
}

export interface NextRoundMessage {
  type: ClientMessageType.NEXT_ROUND;
}

export interface RestartGameMessage {
  type: ClientMessageType.RESTART_GAME;
}

// [BOT] Mensagens de bot
export interface AddBotMessage {
  type: ClientMessageType.ADD_BOT;
}

export interface RemoveBotMessage {
  type: ClientMessageType.REMOVE_BOT;
  botId: string;
}

export type ClientMessage =
  | JoinRoomMessage
  | LeaveRoomMessage
  | StartGameMessage
  | SubmitClueMessage
  | PlayCardMessage
  | VoteMessage
  | NextRoundMessage
  | RestartGameMessage
  | AddBotMessage
  | RemoveBotMessage;

// ============================================
// MENSAGENS SERVIDOR -> CLIENTE
// ============================================

export enum ServerMessageType {
  SYNC_STATE = 'SYNC_STATE',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  ERROR = 'ERROR',
}

export interface SyncStateMessage {
  type: ServerMessageType.SYNC_STATE;
  gameState: GameState;
  yourPlayerId: string;
}

export interface PlayerJoinedMessage {
  type: ServerMessageType.PLAYER_JOINED;
  player: Omit<Player, 'hand'>;
}

export interface PlayerLeftMessage {
  type: ServerMessageType.PLAYER_LEFT;
  playerId: string;
  playerName: string;
}

export interface ErrorMessage {
  type: ServerMessageType.ERROR;
  message: string;
  code?: string;
}

export type ServerMessage =
  | SyncStateMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | ErrorMessage;
