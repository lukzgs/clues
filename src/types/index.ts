// ============================================
// TIPOS BASE
// ============================================

export type DeckOption = 'original' | 'new' | 'mixed';

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
  isSpectator?: boolean; // Jogador que foi kikado por AFK
}

export interface TableCard {
  orderId: number; // Ordem para embaralhar na votação
  playerId: string;
  card: Card;
  isMine?: boolean; // Set by server in getPublicState — true only for the player's own card
}

export enum GamePhase {
  LOBBY = 'LOBBY',
  NARRATOR_CHOOSING = 'NARRATOR_CHOOSING',
  OTHERS_CHOOSING = 'OTHERS_CHOOSING',
  VOTING = 'VOTING',
  RESULTS = 'RESULTS',
  GAME_OVER = 'GAME_OVER',
}

// ============================================
// CONDIÇÕES DE VITÓRIA
// ============================================

export interface VictoryCondition {
  scoreEnabled: boolean; // Enable score-based victory
  targetScore: number; // First to reach X points wins
  narratorRoundsEnabled: boolean; // Enable narrator-rounds-based victory
  narratorRounds: number; // Each player narrates X times
}

export interface PhaseTimeouts {
  narrator: number; // in seconds
  othersChoosing: number; // in seconds
  voting: number; // in seconds
  results: number; // in seconds
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
  playersWhoPlayed: string[]; // IDs of players who already placed a card on the table
  playersWhoVoted: string[]; // IDs of players who already voted
  victoryCondition: VictoryCondition;
  currentRound: number; // Current round number (0-based)
  phaseStartTime: number; // Timestamp de quando a fase atual começou
  afkKickVotes: string[]; // Array de playerIds que votaram para expulsar o jogador AFK
  deckOption: DeckOption;
  playersWhoReadied: string[]; // IDs of players who already clicked "Next Round"
  phaseTimeouts: PhaseTimeouts;
  timerEnabled: boolean;
}

// Estado completo do servidor (não exposto ao cliente)
export interface ServerGameState
  extends Omit<
    GameState,
    'deckCount' | 'playersWhoPlayed' | 'playersWhoVoted'
  > {
  deck: Card[];
}

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
  VOTE_KICK_AFK = 'VOTE_KICK_AFK',
  // [SPECTATOR] Mensagens para controle de spectators/kick
  KICK_PLAYER = 'KICK_PLAYER',
  TOGGLE_SPECTATOR = 'TOGGLE_SPECTATOR',
  REQUEST_PLAY = 'REQUEST_PLAY',
  // [BOT] Mensagens para controle de bots
  ADD_BOT = 'ADD_BOT',
  REMOVE_BOT = 'REMOVE_BOT',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
}

export interface JoinRoomMessage {
  type: ClientMessageType.JOIN_ROOM;
  playerName: string;
  reconnectId?: string; // playerId from previous session for reconnection
  reconnectSecret?: string; // secret token verifying ownership for reconnection
}

export interface LeaveRoomMessage {
  type: ClientMessageType.LEAVE_ROOM;
}

export interface StartGameMessage {
  type: ClientMessageType.START_GAME;
  victoryCondition: VictoryCondition;
  deckOption: DeckOption;
  phaseTimeouts: PhaseTimeouts;
  timerEnabled: boolean;
}

export interface UpdateSettingsMessage {
  type: ClientMessageType.UPDATE_SETTINGS;
  victoryCondition: VictoryCondition;
  deckOption: DeckOption;
  phaseTimeouts: PhaseTimeouts;
  timerEnabled: boolean;
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

export interface VoteKickAfkMessage {
  type: ClientMessageType.VOTE_KICK_AFK;
}

// [SPECTATOR] Mensagens de spectator/kick
export interface KickPlayerMessage {
  type: ClientMessageType.KICK_PLAYER;
  targetPlayerId: string;
}

export interface ToggleSpectatorMessage {
  type: ClientMessageType.TOGGLE_SPECTATOR;
  targetPlayerId: string;
}

export interface RequestPlayMessage {
  type: ClientMessageType.REQUEST_PLAY;
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
  | RemoveBotMessage
  | VoteKickAfkMessage
  | KickPlayerMessage
  | ToggleSpectatorMessage
  | RequestPlayMessage
  | UpdateSettingsMessage;

// ============================================
// MENSAGENS SERVIDOR -> CLIENTE
// ============================================

export enum ServerMessageType {
  SYNC_STATE = 'SYNC_STATE',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAYER_KICKED = 'PLAYER_KICKED',
  ERROR = 'ERROR',
}

export interface SyncStateMessage {
  type: ServerMessageType.SYNC_STATE;
  gameState: GameState;
  yourPlayerId: string;
  yourReconnectSecret?: string;
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

export interface PlayerKickedMessage {
  type: ServerMessageType.PLAYER_KICKED;
  playerId: string;
  playerName: string;
}

export type ServerMessage =
  | SyncStateMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerKickedMessage
  | ErrorMessage;
