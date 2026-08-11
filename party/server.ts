import type * as Party from 'partykit/server';
import GAME_CONFIG from '../game.config.json';
import { ClientMessageSchema } from '../src/schemas';
import {
  Card,
  ClientMessageType,
  type DeckOption,
  GamePhase,
  type GameState,
  Player,
  type ServerGameState,
  ServerMessageType,
  TableCard,
} from '../src/types';
import { calculateMaxPlayers } from '../src/utils/gameMath';
import { BotManager } from './bots';
import { getPublicState } from './game-logic';
import { handleVoteKickAfk } from './handlers/afk';
import { handleAddBot, handleRemoveBot } from './handlers/bot';
import {
  handleNextRound,
  handlePlayCard,
  handleRestartGame,
  handleStartGame,
  handleSubmitClue,
  handleVote,
} from './handlers/game';
// Import local handlers
import {
  handleJoinRoom,
  handleLeaveRoom,
  handleUpdateSettings,
} from './handlers/room';
import {
  handleKickPlayer,
  handleRequestPlay,
  handleToggleSpectator,
} from './handlers/spectator';
import RegistryServer, { globalRegistry } from './registry';
import { ServerTelemetry } from './telemetry';

export { RegistryServer as registry };

// ============================================
// SERVIDOR DO JOGO
// ============================================

export default class GameServer implements Party.Server {
  // Estado interno completo
  public state: ServerGameState;

  // Mapeamento: connectionId -> playerId
  public connections: Map<string, string> = new Map();

  // Mapeamento: playerId -> reconnectSecret
  public playerSecrets: Map<string, string> = new Map();

  // [BOT] Gerenciador de bots
  public botManager: BotManager | null = null;

  // [TELEMETRY] Coletor de telemetria e logs da sala
  public telemetry: ServerTelemetry;

  // Rate limiting: connectionId -> { count, windowStart }
  private rateLimitData: Map<string, { count: number; windowStart: number }> =
    new Map();

  constructor(readonly room: Party.Room) {
    this.state = this.createInitialState();
    this.telemetry = new ServerTelemetry();
    this.botManager = new BotManager();
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
      phaseTimeouts: {
        narrator: 60,
        othersChoosing: 45,
        voting: 30,
        results: 15,
      },
      timerEnabled: true,
    };
  }

  // [SPECTATOR] Returns max active players based on deck option and victory condition
  public getMaxPlayersForDeck(
    deckOption: DeckOption,
    vc: ServerGameState['victoryCondition'],
  ): number {
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
    this.notifyRegistry();
  }

  onClose(conn: Party.Connection) {
    const playerId = this.connections.get(conn.id);
    if (!playerId) return;

    // Check if the player already reconnected via a different connection (ghost socket guard)
    let hasOtherConnection = false;
    for (const [
      existingConnId,
      existingPlayerId,
    ] of this.connections.entries()) {
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

    const player = this.state.players.find((p) => p.id === playerId);
    if (player) {
      player.isConnected = false;

      if (this.state.phase === GamePhase.LOBBY) {
        // Lobby: keep player in state for reconnection, but schedule host migration
        if (player.isHost) {
          setTimeout(() => {
            if (
              this.state.phase === GamePhase.LOBBY &&
              player.isHost &&
              !player.isConnected
            ) {
              const nextHost = this.state.players.find(
                (p) => p.isConnected && !p.isSpectator && !p.isBot,
              );
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
          const nextHost = this.state.players.find(
            (p) => p.isConnected && !p.isSpectator && p.id !== playerId,
          );
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
    } else {
      this.notifyRegistry();
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
      this.telemetry.recordRateLimitHit(connId);
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
        this.telemetry.recordValidationError(
          sender.id,
          JSON.stringify(parsed.error.issues),
        );
        return; // Ignora silenciosamente
      }
      const msg = parsed.data;
      const playerId = this.connections.get(sender.id);

      await this.resetInactivityTimer();

      switch (msg.type) {
        case 'JOIN_ROOM':
          await handleJoinRoom(
            this,
            msg.playerName,
            sender,
            msg.reconnectId,
            msg.reconnectSecret,
          );
          break;

        case 'LEAVE_ROOM':
          if (playerId) handleLeaveRoom(this, playerId, sender);
          break;

        case 'START_GAME':
          if (playerId)
            handleStartGame(
              this,
              playerId,
              msg.victoryCondition,
              msg.deckOption,
              msg.phaseTimeouts,
              msg.timerEnabled,
            );
          break;

        case 'UPDATE_SETTINGS':
          if (playerId)
            handleUpdateSettings(
              this,
              playerId,
              msg.victoryCondition,
              msg.deckOption,
              msg.phaseTimeouts,
              msg.timerEnabled,
            );
          break;

        case 'SUBMIT_CLUE':
          if (playerId) handleSubmitClue(this, playerId, msg.cardId, msg.clue);
          break;

        case 'PLAY_CARD':
          if (playerId) handlePlayCard(this, playerId, msg.cardId);
          break;

        case 'VOTE':
          if (playerId) handleVote(this, playerId, msg.orderId);
          break;

        case 'NEXT_ROUND':
          if (playerId) handleNextRound(this, playerId);
          break;

        case 'RESTART_GAME':
          if (playerId) handleRestartGame(this, playerId);
          break;

        // [BOT] Handlers de bot
        case 'ADD_BOT':
          if (playerId && this.botManager) handleAddBot(this, playerId);
          break;

        case 'REMOVE_BOT':
          if (playerId && this.botManager)
            handleRemoveBot(this, playerId, msg.botId);
          break;

        case 'VOTE_KICK_AFK':
          if (playerId) handleVoteKickAfk(this, playerId);
          break;

        // [SPECTATOR] Handlers de spectator/kick
        case 'KICK_PLAYER':
          if (playerId) handleKickPlayer(this, playerId, msg.targetPlayerId);
          break;

        case 'TOGGLE_SPECTATOR':
          if (playerId)
            handleToggleSpectator(this, playerId, msg.targetPlayerId);
          break;

        case 'REQUEST_PLAY':
          if (playerId) handleRequestPlay(this, playerId);
          break;
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      this.telemetry.recordUncaughtError(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // ============================================
  // ENDPOINT HTTP DE TELEMETRIA (PULL MODEL)
  // ============================================

  async onRequest(req: Party.Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/metrics' || url.pathname.endsWith('/metrics')) {
      if (req.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
      }

      // Guard de Autenticação (Bearer Token)
      const authHeader = req.headers.get('Authorization');
      const expectedToken =
        (this.room.env as Record<string, string> | undefined)
          ?.METRICS_SECRET_TOKEN || process.env.METRICS_SECRET_TOKEN;

      if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Return global server snapshot if room ID is 'global' or URL targets registry/global
      const cleanPath = url.pathname.toLowerCase();
      if (
        this.room.id.toLowerCase() === 'global' ||
        cleanPath.includes('/global/') ||
        cleanPath.includes('registry')
      ) {
        const snapshot = globalRegistry.getGlobalSnapshot();
        return new Response(JSON.stringify(snapshot, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const roomSummary = {
        phase: this.state.phase,
        activeConnectionsCount: this.connections.size,
        totalPlayersCount: this.state.players.length,
        humanPlayersCount: this.state.players.filter((p) => !p.isBot).length,
        botPlayersCount: this.state.players.filter((p) => p.isBot).length,
        spectatorsCount: this.state.players.filter((p) => p.isSpectator).length,
      };

      const metricsSnapshot = this.telemetry.getSnapshot(
        this.room.id,
        roomSummary,
      );

      return new Response(JSON.stringify(metricsSnapshot, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'null',
        },
      });
    }

    return new Response('Not Found', { status: 404 });
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
      this.room.broadcast(
        JSON.stringify({
          type: 'SERVER_CLOSING_WARNING',
          closeTime: Date.now() + 60 * 1000,
        }),
      );
      await this.room.storage.setAlarm(Date.now() + 60 * 1000);
    } else {
      // Alarme de 10 minutos!
      this.room.broadcast(JSON.stringify({ type: 'SERVER_CLOSED' }));

      // Desconecta todos
      for (const conn of this.room.getConnections()) {
        conn.close(1000, 'Room closed due to inactivity');
      }

      // Limpa storage
      await this.room.storage.deleteAll();
      await this.notifyRegistry(true);
    }
  }

  // ============================================
  // MÉTODOS DE ESTADO
  // ============================================

  public changePhase(newPhase: GamePhase) {
    this.state.phase = newPhase;
    this.state.phaseStartTime = Date.now();
    this.state.afkKickVotes = [];
    this.state.playersWhoReadied = [];
    this.notifyRegistry();
  }

  // ============================================
  // UTILITÁRIOS DE COMUNICAÇÃO
  // ============================================

  public getPublicState(forPlayerId: string | null): GameState {
    // Migração de estado interno ativa
    if (!this.state.phaseTimeouts) {
      this.state.phaseTimeouts = {
        narrator: 60,
        othersChoosing: 45,
        voting: 30,
        results: 15,
      };
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
        const secret = this.playerSecrets.get(playerId);
        this.sendToConnection(conn, {
          type: ServerMessageType.SYNC_STATE,
          gameState: this.getPublicState(playerId),
          yourPlayerId: playerId,
          ...(secret ? { yourReconnectSecret: secret } : {}),
        });
      }
    }
    this.notifyRegistry();
  }

  public notifyRegistry(isUnregister: boolean = false) {
    try {
      if (isUnregister) {
        globalRegistry.unregisterRoom(this.room.id);
      } else {
        const roomSummary = {
          phase: this.state.phase,
          activeConnectionsCount: this.room.getConnections
            ? Array.from(this.room.getConnections()).length
            : this.connections.size,
          totalPlayersCount: this.state.players.length,
          humanPlayersCount: this.state.players.filter((p) => !p.isBot).length,
          botPlayersCount: this.state.players.filter((p) => p.isBot).length,
          spectatorsCount: this.state.players.filter((p) => p.isSpectator)
            .length,
        };
        const snapshot = this.telemetry.getSnapshot(this.room.id, roomSummary);
        globalRegistry.registerOrUpdateRoom({
          roomCode: this.room.id,
          phase: snapshot.roomSummary.phase,
          activeConnectionsCount: snapshot.roomSummary.activeConnectionsCount,
          totalPlayersCount: snapshot.roomSummary.totalPlayersCount,
          humanPlayersCount: snapshot.roomSummary.humanPlayersCount,
          botPlayersCount: snapshot.roomSummary.botPlayersCount,
          spectatorsCount: snapshot.roomSummary.spectatorsCount,
          uptimeSeconds: snapshot.uptimeSeconds,
          counters: snapshot.counters,
        });
      }
    } catch {
      // Fail-safe: telemetry communication should never throw or disrupt game logic
    }
  }

  public broadcast(message: object) {
    try {
      const json = JSON.stringify(message);
      this.room.broadcast(json);
    } catch (error) {
      console.error(
        '[ERROR-SERVER] Erro ao transmitir mensagem (broadcast):',
        error,
      );
    }
  }

  public sendToConnection(conn: Party.Connection, message: object) {
    try {
      conn.send(JSON.stringify(message));
    } catch (error) {
      console.error(
        `[ERROR-SERVER] Erro ao enviar mensagem para conexão ${conn.id}:`,
        error,
      );
    }
  }

  public sendError(conn: Party.Connection, message: string) {
    this.sendToConnection(conn, {
      type: ServerMessageType.ERROR,
      message,
    });
  }
}
