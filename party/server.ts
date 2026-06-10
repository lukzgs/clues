import type * as Party from "partykit/server";
import {
  GamePhase,
  Player,
  Card,
  TableCard,
  ServerGameState,
  GameState,
  ClientMessageType,
  ServerMessageType,
  DeckOption,
  PhaseTimeouts,
} from "../src/types";
import { ClientMessageSchema } from "../src/schemas";
import { getPublicState } from "./game-logic";
import { calculateMaxPlayers } from "../src/utils/gameMath";
import GAME_CONFIG from '../game.config.json';

// Import local handlers
import { handleJoinRoom, handleLeaveRoom, handleUpdateSettings } from "./handlers/room";
import {
  handleStartGame,
  handleSubmitClue,
  handlePlayCard,
  handleVote,
  calculateScores,
  handleNextRound,
  handleRestartGame,
} from "./handlers/game";
import { handleKickPlayer, handleToggleSpectator, handleRequestPlay } from "./handlers/spectator";
import { getAfkPlayers, handleVoteKickAfk, checkPhaseProgression } from "./handlers/afk";
import { handleAddBot, handleRemoveBot, triggerBotActions } from "./handlers/bot";

// [BOT] Import dinâmico - não falha se bots não existir
let BotManagerClass: any = null;
try {
  // @ts-ignore - import dinâmico
  const bots = require('./bots');
  BotManagerClass = bots.BotManager;
} catch {
  // Bots não disponíveis - continua normalmente
}

// ============================================
// SERVIDOR DO JOGO
// ============================================

export default class GameServer implements Party.Server {
  // Estado interno completo
  public state: ServerGameState;

  // Mapeamento: connectionId -> playerId
  public connections: Map<string, string> = new Map();

  // [BOT] Gerenciador de bots (opcional)
  public botManager: any = null;

  // Rate limiting: connectionId -> { count, windowStart }
  private rateLimitData: Map<string, { count: number; windowStart: number }> = new Map();

  constructor(readonly room: Party.Room) {
    this.state = this.createInitialState();
    // [BOT] Inicializa gerenciador de bots se disponível
    if (BotManagerClass) {
      this.botManager = new BotManagerClass();
    }
  }

  public createInitialState(): ServerGameState {
    return {
      roomCode: this.room.id,
      phase: GamePhase.LOBBY,
      players: [],
      narratorIndex: 0,
      currentClue: '',
      tableCards: [],
      votes: {},
      winner: null,
      deck: [], // Deck is created when game starts
      deckOption: 'mixed',
      victoryCondition: {
        scoreEnabled: true,
        targetScore: GAME_CONFIG.WINNING_SCORE,
        narratorRoundsEnabled: false,
        narratorRounds: GAME_CONFIG.DEFAULT_NARRATOR_ROUNDS,
      },
      currentRound: 0,
      phaseStartTime: Date.now(),
      afkKickVotes: [],
      playersWhoReadied: [],
      phaseTimeouts: { narrator: 60, othersChoosing: 45, voting: 30, results: 15 },
      timerEnabled: true,
    };
  }

  // [SPECTATOR] Returns max active players based on deck option and victory condition
  public getMaxPlayersForDeck(deckOption: DeckOption, vc: ServerGameState['victoryCondition']): number {
    return calculateMaxPlayers(deckOption, vc);
  }

  // ============================================
  // EVENTOS DE CONEXÃO
  // ============================================

  async onConnect(conn: Party.Connection) {
    await this.resetInactivityTimer();

    // Apenas envia estado atual - jogador precisa enviar JOIN_ROOM
    this.sendToConnection(conn, {
      type: ServerMessageType.SYNC_STATE,
      gameState: this.getPublicState(null),
      yourPlayerId: '',
    });
  }

  onClose(conn: Party.Connection) {
    const playerId = this.connections.get(conn.id);
    if (!playerId) return;

    // Check if the player already reconnected via a different connection (ghost socket guard)
    let hasOtherConnection = false;
    for (const [existingConnId, existingPlayerId] of this.connections.entries()) {
      if (existingPlayerId === playerId && existingConnId !== conn.id) {
        hasOtherConnection = true;
        break;
      }
    }

    // Always clean up THIS connection's mapping
    this.connections.delete(conn.id);
    this.rateLimitData.delete(conn.id);

    // If player has another active connection, don't mark as disconnected
    if (hasOtherConnection) return;

    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;

      if (this.state.phase === GamePhase.LOBBY) {
        // Lobby: keep player in state for reconnection, but schedule host migration
        if (player.isHost) {
          setTimeout(() => {
            if (this.state.phase === GamePhase.LOBBY && player.isHost && !player.isConnected) {
              const nextHost = this.state.players.find(p => p.isConnected && !p.isSpectator && !p.isBot);
              if (nextHost) {
                player.isHost = false;
                nextHost.isHost = true;
                this.broadcastState();
              }
            }
          }, 10000);
        }
      } else {
        // Mid-game: reassign host immediately if disconnected host
        if (player.isHost) {
          const nextHost = this.state.players.find(p => p.isConnected && !p.isSpectator && p.id !== playerId);
          if (nextHost) {
            player.isHost = false;
            nextHost.isHost = true;
          }
        }
      }

      // Notifica outros jogadores
      this.broadcast({
        type: ServerMessageType.PLAYER_LEFT,
        playerId: player.id,
        playerName: player.name,
      });

      this.broadcastState();
    }
  }

  // ============================================
  // RATE LIMITING
  // ============================================

  private checkRateLimit(connId: string): boolean {
    const now = Date.now();
    const WINDOW_MS = 5000; // 5 seconds
    const MAX_MESSAGES = 15; // max per window per connection

    let data = this.rateLimitData.get(connId);

    if (!data || now - data.windowStart > WINDOW_MS) {
      // New window for this connection
      data = { count: 1, windowStart: now };
      this.rateLimitData.set(connId, data);
      return true;
    }

    if (data.count >= MAX_MESSAGES) {
      return false;
    }

    data.count++;
    return true;
  }

  // ============================================
  // PROCESSAMENTO DE MENSAGENS
  // ============================================

  async onMessage(message: string, sender: Party.Connection) {
    // Rate limiting
    if (!this.checkRateLimit(sender.id)) {
      console.warn('Rate limit excedido:', sender.id);
      return;
    }

    try {
      // Validação com Zod
      const parsed = ClientMessageSchema.safeParse(JSON.parse(message));
      if (!parsed.success) {
        console.warn('Mensagem inválida:', parsed.error.issues);
        return; // Ignora silenciosamente
      }
      const msg = parsed.data;
      const playerId = this.connections.get(sender.id);

      await this.resetInactivityTimer();

      switch (msg.type) {
        case 'JOIN_ROOM':
          await this.handleJoinRoom(msg.playerName, sender, msg.reconnectId);
          break;

        case 'LEAVE_ROOM':
          if (playerId) this.handleLeaveRoom(playerId, sender);
          break;

        case 'START_GAME':
          if (playerId) this.handleStartGame(playerId, msg.victoryCondition, msg.deckOption, msg.phaseTimeouts, msg.timerEnabled);
          break;

        case 'UPDATE_SETTINGS':
          if (playerId) this.handleUpdateSettings(playerId, msg.victoryCondition, msg.deckOption, msg.phaseTimeouts, msg.timerEnabled);
          break;

        case 'SUBMIT_CLUE':
          if (playerId) this.handleSubmitClue(playerId, msg.cardId, msg.clue);
          break;

        case 'PLAY_CARD':
          if (playerId) this.handlePlayCard(playerId, msg.cardId);
          break;

        case 'VOTE':
          if (playerId) this.handleVote(playerId, msg.orderId);
          break;

        case 'NEXT_ROUND':
          if (playerId) this.handleNextRound(playerId);
          break;

        case 'RESTART_GAME':
          if (playerId) this.handleRestartGame(playerId);
          break;

        // [BOT] Handlers de bot
        case 'ADD_BOT':
          if (playerId && this.botManager) this.handleAddBot(playerId);
          break;

        case 'REMOVE_BOT':
          if (playerId && this.botManager) this.handleRemoveBot(playerId, msg.botId);
          break;

        case 'VOTE_KICK_AFK':
          if (playerId) this.handleVoteKickAfk(playerId);
          break;

        // [SPECTATOR] Handlers de spectator/kick
        case 'KICK_PLAYER':
          if (playerId) this.handleKickPlayer(playerId, msg.targetPlayerId);
          break;

        case 'TOGGLE_SPECTATOR':
          if (playerId) this.handleToggleSpectator(playerId, msg.targetPlayerId);
          break;

        case 'REQUEST_PLAY':
          if (playerId) this.handleRequestPlay(playerId);
          break;
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }

  public async resetInactivityTimer() {
    const isClosing = await this.room.storage.get<boolean>('isClosing');
    if (isClosing) {
      await this.room.storage.delete('isClosing');
      this.room.broadcast(JSON.stringify({ type: 'SERVER_CLOSING_CANCELLED' }));
    }
    await this.room.storage.setAlarm(Date.now() + 9 * 60 * 1000);
  }

  async onAlarm() {
    const isClosing = await this.room.storage.get<boolean>('isClosing');
    
    if (!isClosing) {
      // Alarme de 9 minutos!
      await this.room.storage.put('isClosing', true);
      this.room.broadcast(JSON.stringify({ 
        type: 'SERVER_CLOSING_WARNING', 
        closeTime: Date.now() + 60 * 1000 
      }));
      await this.room.storage.setAlarm(Date.now() + 60 * 1000);
    } else {
      // Alarme de 10 minutos!
      this.room.broadcast(JSON.stringify({ type: 'SERVER_CLOSED' }));
      
      // Desconecta todos
      for (const conn of this.room.getConnections()) {
        conn.close(1000, "Room closed due to inactivity");
      }
      
      // Limpa storage
      await this.room.storage.deleteAll();
    }
  }

  // ============================================
  // HANDLERS DELEGATION BRIDGES
  // ============================================

  public async handleJoinRoom(playerName: string, conn: Party.Connection, reconnectId?: string) {
    return handleJoinRoom(this, playerName, conn, reconnectId);
  }

  public handleLeaveRoom(playerId: string, conn: Party.Connection) {
    return handleLeaveRoom(this, playerId, conn);
  }

  public handleUpdateSettings(
    playerId: string,
    victoryCondition: { scoreEnabled: boolean; targetScore: number; narratorRoundsEnabled: boolean; narratorRounds: number },
    deckOption: DeckOption,
    phaseTimeouts: PhaseTimeouts,
    timerEnabled: boolean
  ) {
    return handleUpdateSettings(this, playerId, victoryCondition, deckOption, phaseTimeouts, timerEnabled);
  }

  public handleStartGame(
    playerId: string,
    victoryCondition: { scoreEnabled: boolean; targetScore: number; narratorRoundsEnabled: boolean; narratorRounds: number },
    deckOption: DeckOption,
    phaseTimeouts: PhaseTimeouts,
    timerEnabled: boolean
  ) {
    return handleStartGame(this, playerId, victoryCondition, deckOption, phaseTimeouts, timerEnabled);
  }

  public handleSubmitClue(playerId: string, cardId: number, clue: string) {
    return handleSubmitClue(this, playerId, cardId, clue);
  }

  public handlePlayCard(playerId: string, cardId: number) {
    return handlePlayCard(this, playerId, cardId);
  }

  public handleVote(playerId: string, orderId: number) {
    return handleVote(this, playerId, orderId);
  }

  public calculateScores() {
    return calculateScores(this);
  }

  public handleNextRound(playerId: string) {
    return handleNextRound(this, playerId);
  }

  public handleRestartGame(playerId: string) {
    return handleRestartGame(this, playerId);
  }

  public handleKickPlayer(hostId: string, targetId: string) {
    return handleKickPlayer(this, hostId, targetId);
  }

  public handleToggleSpectator(requesterId: string, targetId: string) {
    return handleToggleSpectator(this, requesterId, targetId);
  }

  public handleRequestPlay(playerId: string) {
    return handleRequestPlay(this, playerId);
  }

  public changePhase(newPhase: GamePhase) {
    this.state.phase = newPhase;
    this.state.phaseStartTime = Date.now();
    this.state.afkKickVotes = [];
    this.state.playersWhoReadied = [];
  }

  public getAfkPlayers(): Player[] {
    return getAfkPlayers(this);
  }

  public handleVoteKickAfk(playerId: string) {
    return handleVoteKickAfk(this, playerId);
  }

  public checkPhaseProgression() {
    return checkPhaseProgression(this);
  }

  public handleAddBot(playerId: string) {
    return handleAddBot(this, playerId);
  }

  public handleRemoveBot(playerId: string, botId: string) {
    return handleRemoveBot(this, playerId, botId);
  }

  public triggerBotActions() {
    return triggerBotActions(this);
  }

  // ============================================
  // UTILITÁRIOS DE COMUNICAÇÃO
  // ============================================

  public getPublicState(forPlayerId: string | null): GameState {
    // Migração de estado interno ativa
    if (!this.state.phaseTimeouts) {
      this.state.phaseTimeouts = { narrator: 60, othersChoosing: 45, voting: 30, results: 15 };
    }
    if (!this.state.victoryCondition) {
      this.state.victoryCondition = {
        scoreEnabled: true,
        targetScore: GAME_CONFIG.WINNING_SCORE,
        narratorRoundsEnabled: false,
        narratorRounds: GAME_CONFIG.DEFAULT_NARRATOR_ROUNDS,
      };
    }
    if (!this.state.deckOption) {
      this.state.deckOption = 'mixed';
    }
    if (this.state.timerEnabled === undefined) {
      this.state.timerEnabled = true;
    }
    return getPublicState(this.state, forPlayerId);
  }

  public broadcastState() {
    for (const [connId, playerId] of this.connections) {
      const conn = this.room.getConnection(connId);
      if (conn) {
        this.sendToConnection(conn, {
          type: ServerMessageType.SYNC_STATE,
          gameState: this.getPublicState(playerId),
          yourPlayerId: playerId,
        });
      }
    }
  }

  public broadcast(message: object) {
    try {
      const json = JSON.stringify(message);
      this.room.broadcast(json);
    } catch (error) {
      console.error("[ERROR-SERVER] Erro ao transmitir mensagem (broadcast):", error);
    }
  }

  public sendToConnection(conn: Party.Connection, message: object) {
    try {
      conn.send(JSON.stringify(message));
    } catch (error) {
      console.error(`[ERROR-SERVER] Erro ao enviar mensagem para conexão ${conn.id}:`, error);
    }
  }

  public sendError(conn: Party.Connection, message: string) {
    this.sendToConnection(conn, {
      type: ServerMessageType.ERROR,
      message,
    });
  }
}
