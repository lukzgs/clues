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
} from "../src/types";
import { PLAYER_COLORS } from "../src/config";
import { ClientMessageSchema } from "../src/schemas";
import {
  createDeck,
  shuffle,
  generatePlayerId,
  calculateScores as calculateScoresPure,
  checkVictoryCondition,
  getPublicState,
} from "./game-logic";

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
// CONFIGURAÇÕES (importado de game.config.json)
// ============================================

import GAME_CONFIG from '../game.config.json';

// ============================================
// SERVIDOR DO JOGO
// ============================================

export default class GameServer implements Party.Server {
  // Estado interno completo
  private state: ServerGameState;

  // Mapeamento: connectionId -> playerId
  private connections: Map<string, string> = new Map();

  // [BOT] Gerenciador de bots (opcional)
  private botManager: any = null;

  // Rate limiting: connectionId -> { count, windowStart }
  private rateLimitData: Map<string, { count: number; windowStart: number }> = new Map();

  constructor(readonly room: Party.Room) {
    this.state = this.createInitialState();
    // [BOT] Inicializa gerenciador de bots se disponível
    if (BotManagerClass) {
      this.botManager = new BotManagerClass();
    }
  }

  private createInitialState(): ServerGameState {
    return {
      roomCode: this.room.id,
      phase: GamePhase.LOBBY,
      players: [],
      narratorIndex: 0,
      currentClue: '',
      tableCards: [],
      votes: {},
      winner: null,
      deck: shuffle(createDeck(GAME_CONFIG.DECK_SIZE)),
      victoryCondition: {
        scoreEnabled: true,
        targetScore: GAME_CONFIG.WINNING_SCORE,
        narratorRoundsEnabled: false,
        narratorRounds: GAME_CONFIG.DEFAULT_NARRATOR_ROUNDS,
      },
      currentRound: 0,
      phaseStartTime: Date.now(),
      afkKickVotes: [],
    };
  }

  // ============================================
  // EVENTOS DE CONEXÃO
  // ============================================

  onConnect(conn: Party.Connection) {
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

    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;

      // Se estava no lobby, remove o jogador
      if (this.state.phase === GamePhase.LOBBY) {
        this.state.players = this.state.players.filter(p => p.id !== playerId);

        // Reatribui host se necessário
        if (player.isHost && this.state.players.length > 0) {
          this.state.players[0].isHost = true;
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

    this.connections.delete(conn.id);
    this.rateLimitData.delete(conn.id);
  }  // ============================================
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

  onMessage(message: string, sender: Party.Connection) {
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

      switch (msg.type) {
        case 'JOIN_ROOM':
          this.handleJoinRoom(msg.playerName, sender, msg.reconnectId);
          break;

        case 'LEAVE_ROOM':
          if (playerId) this.handleLeaveRoom(playerId, sender);
          break;

        case 'START_GAME':
          if (playerId) this.handleStartGame(playerId, msg.victoryCondition);
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
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }

  // ============================================
  // HANDLERS DE AÇÕES
  // ============================================

  private handleJoinRoom(playerName: string, conn: Party.Connection, reconnectId?: string) {
    // Verifica se já está conectado
    if (this.connections.has(conn.id)) {
      this.sendError(conn, 'Você já está na sala');
      return;
    }

    // Reconnection: try to reclaim a disconnected player by ID
    if (reconnectId && this.state.phase !== GamePhase.LOBBY) {
      const player = this.state.players.find(p => p.id === reconnectId && !p.isConnected && !p.isBot);
      if (player) {
        // Reclaim: map new connection to existing player
        player.isConnected = true;
        this.connections.set(conn.id, player.id);

        this.broadcast({
          type: ServerMessageType.PLAYER_JOINED,
          player: { ...player, hand: [] },
        });

        this.broadcastState();
        return;
      }
      // reconnectId invalid or player already connected — fall through to normal join
    }

    // Verifica fase
    if (this.state.phase !== GamePhase.LOBBY) {
      this.sendError(conn, 'Jogo já em andamento');
      return;
    }

    // Verifica limite de jogadores
    if (this.state.players.length >= GAME_CONFIG.MAX_PLAYERS) {
      this.sendError(conn, 'Sala cheia');
      return;
    }

    // Cria jogador
    const playerId = generatePlayerId();
    const playerIndex = this.state.players.length;

    const newPlayer: Player = {
      id: playerId,
      name: playerName.trim() || `Jogador ${playerIndex + 1}`,
      score: 0,
      hand: [],
      color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
      isConnected: true,
      isHost: playerIndex === 0, // Primeiro jogador é host
    };

    this.state.players.push(newPlayer);
    this.connections.set(conn.id, playerId);

    // Notifica todos
    this.broadcast({
      type: ServerMessageType.PLAYER_JOINED,
      player: { ...newPlayer, hand: [] },
    });

    this.broadcastState();
  }

  private handleLeaveRoom(playerId: string, conn: Party.Connection) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    // Remove do jogo se no lobby
    if (this.state.phase === GamePhase.LOBBY) {
      this.state.players = this.state.players.filter(p => p.id !== playerId);

      if (player.isHost && this.state.players.length > 0) {
        this.state.players[0].isHost = true;
      }
    } else {
      player.isConnected = false;
    }

    this.connections.delete(conn.id);

    this.broadcast({
      type: ServerMessageType.PLAYER_LEFT,
      playerId: player.id,
      playerName: player.name,
    });

    this.broadcastState();
  }

  private handleStartGame(playerId: string, victoryCondition: { scoreEnabled: boolean; targetScore: number; narratorRoundsEnabled: boolean; narratorRounds: number }) {
    const player = this.state.players.find(p => p.id === playerId);

    // Apenas host pode iniciar
    if (!player?.isHost) {
      return;
    }

    // Verifica minimo de jogadores
    if (this.state.players.length < GAME_CONFIG.MIN_PLAYERS) {
      return;
    }

    // At least one condition must be enabled
    if (!victoryCondition.scoreEnabled && !victoryCondition.narratorRoundsEnabled) {
      return;
    }

    // Apply victory condition from host
    this.state.victoryCondition = {
      scoreEnabled: victoryCondition.scoreEnabled,
      targetScore: Math.max(10, Math.min(100, victoryCondition.targetScore)),
      narratorRoundsEnabled: victoryCondition.narratorRoundsEnabled,
      narratorRounds: Math.max(1, Math.min(5, victoryCondition.narratorRounds)),
    };

    // Embaralha deck e distribui cartas
    this.state.deck = shuffle(createDeck(GAME_CONFIG.DECK_SIZE));

    this.state.players.forEach(p => {
      p.hand = this.state.deck.splice(0, GAME_CONFIG.HAND_SIZE);
      p.score = 0;
    });

    // Inicia o jogo
    this.changePhase(GamePhase.NARRATOR_CHOOSING);
    this.state.narratorIndex = 0;
    this.state.currentClue = '';
    this.state.tableCards = [];
    this.state.votes = {};
    this.state.winner = null;
    this.state.currentRound = 0;

    this.broadcastState();

    // [BOT] Faz bots agirem se necessário
    this.triggerBotActions();
  }

  private handleSubmitClue(playerId: string, cardId: number, clue: string) {
    if (this.state.phase !== GamePhase.NARRATOR_CHOOSING) return;

    const narrator = this.state.players[this.state.narratorIndex];
    if (narrator.id !== playerId) return;

    const cardIndex = narrator.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    if (!clue.trim()) return;

    // Remove carta da mão e coloca na mesa
    const [card] = narrator.hand.splice(cardIndex, 1);

    this.state.tableCards = [{
      orderId: 0,
      playerId: narrator.id,
      card,
    }];

    this.state.currentClue = clue.trim();
    this.changePhase(GamePhase.OTHERS_CHOOSING);

    this.broadcastState();

    // [BOT] Faz bots jogarem cartas
    this.triggerBotActions();
  }

  private handlePlayCard(playerId: string, cardId: number) {
    if (this.state.phase !== GamePhase.OTHERS_CHOOSING) return;

    const narrator = this.state.players[this.state.narratorIndex];
    if (narrator.id === playerId) return; // Narrador não joga

    // Verifica se já jogou
    if (this.state.tableCards.some(tc => tc.playerId === playerId)) return;

    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    // Remove carta da mão e coloca na mesa
    const [card] = player.hand.splice(cardIndex, 1);

    this.state.tableCards.push({
      orderId: this.state.tableCards.length,
      playerId: player.id,
      card,
    });

    // Verifica se todos jogaram
    const activePlayers = this.state.players.filter(p => !p.isSpectator);
    if (this.state.tableCards.length >= activePlayers.length) {
      // Embaralha as cartas na mesa
      this.state.tableCards = shuffle(this.state.tableCards).map((tc, i) => ({
        ...tc,
        orderId: i,
      }));

      this.changePhase(GamePhase.VOTING);
      this.triggerBotActions();
    }

    this.broadcastState();
  }

  private handleVote(playerId: string, orderId: number) {
    if (this.state.phase !== GamePhase.VOTING) return;

    const narrator = this.state.players[this.state.narratorIndex];
    if (narrator.id === playerId) return; // Narrador não vota

    // Verifica se já votou
    if (this.state.votes[playerId] !== undefined) return;

    // Verifica se a carta existe
    const votedCard = this.state.tableCards.find(tc => tc.orderId === orderId);
    if (!votedCard) return;

    // Não pode votar na própria carta
    if (votedCard.playerId === playerId) return;

    this.state.votes[playerId] = orderId;

    // Verifica se todos votaram
    const activePlayers = this.state.players.filter(p => !p.isSpectator);
    const votersCount = activePlayers.length - 1; // -1 narrador
    
    // Contar apenas votos de jogadores ativos
    const activeVotes = Object.keys(this.state.votes).filter(vId => !this.state.players.find(p => p.id === vId)?.isSpectator);
    
    if (activeVotes.length >= votersCount) {
      this.calculateScores();
    }

    this.broadcastState();
  }

  private calculateScores() {
    // Delegate scoring to pure function
    const pointsEarned = calculateScoresPure(
      this.state.players,
      this.state.narratorIndex,
      this.state.tableCards,
      this.state.votes,
    );

    // Apply earned points to player scores
    for (const player of this.state.players) {
      player.score += pointsEarned[player.id] || 0;
    }

    // Check victory conditions
    const winnerId = checkVictoryCondition(
      this.state.players,
      this.state.victoryCondition,
      this.state.currentRound,
    );

    if (winnerId) {
      this.changePhase(GamePhase.GAME_OVER);
      this.state.winner = winnerId;
    } else {
      this.changePhase(GamePhase.RESULTS);
    }
  }

  private handleNextRound(playerId: string) {
    if (this.state.phase !== GamePhase.RESULTS) return;

    const player = this.state.players.find(p => p.id === playerId);
    if (!player?.isHost) return;

    // Increment round counter
    this.state.currentRound++;

    // Distribute a new card to each player
    this.state.players.forEach(p => {
      if (this.state.deck.length > 0) {
        p.hand.push(this.state.deck.shift()!);
      }
    });

    // Próximo narrador (pula desconectados)
    let nextIndex = (this.state.narratorIndex + 1) % this.state.players.length;
    let attempts = 0;
    while (!this.state.players[nextIndex].isConnected && attempts < this.state.players.length) {
      nextIndex = (nextIndex + 1) % this.state.players.length;
      attempts++;
    }

    this.state.narratorIndex = nextIndex;
    this.state.currentClue = '';
    this.state.tableCards = [];
    this.state.votes = {};
    this.changePhase(GamePhase.NARRATOR_CHOOSING);

    this.broadcastState();

    // [BOT] Faz bots agirem se próximo narrador for bot
    this.triggerBotActions();
  }

  private handleRestartGame(playerId: string) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player?.isHost) return;

    // Mantém jogadores, reseta o resto
    const players = this.state.players.map(p => ({
      ...p,
      score: 0,
      hand: [],
    }));

    this.state = {
      ...this.createInitialState(),
      players,
    };

    this.broadcastState();
  }

  // ============================================
  // AFK & TIMEOUT SYSTEM
  // ============================================

  private changePhase(newPhase: GamePhase) {
    this.state.phase = newPhase;
    this.state.phaseStartTime = Date.now();
    this.state.afkKickVotes = [];
  }

  private getAfkPlayers(): Player[] {
    const activePlayers = this.state.players.filter(p => !p.isSpectator);
    switch (this.state.phase) {
      case GamePhase.NARRATOR_CHOOSING:
        const narrator = this.state.players[this.state.narratorIndex];
        return narrator && !narrator.isSpectator ? [narrator] : [];
      case GamePhase.OTHERS_CHOOSING:
        return activePlayers.filter(p =>
          p.id !== this.state.players[this.state.narratorIndex]?.id &&
          !this.state.tableCards.some(tc => tc.playerId === p.id)
        );
      case GamePhase.VOTING:
        return activePlayers.filter(p =>
          p.id !== this.state.players[this.state.narratorIndex]?.id &&
          this.state.votes[p.id] === undefined
        );
      case GamePhase.RESULTS:
        const host = activePlayers.find(p => p.isHost);
        return host ? [host] : [];
      default:
        return [];
    }
  }

  private handleVoteKickAfk(playerId: string) {
    const voter = this.state.players.find(p => p.id === playerId && !p.isSpectator);
    if (!voter) return;

    if (!this.state.afkKickVotes.includes(playerId)) {
      this.state.afkKickVotes.push(playerId);
    }

    const activeVoters = this.state.players.filter(p => !p.isSpectator && !p.isBot);
    const majority = Math.floor(activeVoters.length / 2) + 1;

    if (this.state.afkKickVotes.length >= majority) {
      const afkPlayers = this.getAfkPlayers();
      if (afkPlayers.length === 0) return;

      afkPlayers.forEach(p => {
        p.isSpectator = true;
        
        // If Host is kicked, reassign host
        if (p.isHost) {
          p.isHost = false;
          const newHost = this.state.players.find(np => !np.isSpectator);
          if (newHost) newHost.isHost = true;
        }
      });

      this.state.afkKickVotes = [];

      // Anti-soft-lock: se o narrador for kickado na sua vez, pula a rodada
      if (this.state.phase === GamePhase.NARRATOR_CHOOSING && afkPlayers.some(p => p.id === this.state.players[this.state.narratorIndex]?.id)) {
        this.changePhase(GamePhase.RESULTS);
        const hostId = this.state.players.find(p => p.isHost)?.id;
        if (hostId) this.handleNextRound(hostId);
        return;
      }

      this.checkPhaseProgression();
      this.broadcastState();
    }
  }

  private checkPhaseProgression() {
    const activePlayers = this.state.players.filter(p => !p.isSpectator);
    
    if (this.state.phase === GamePhase.OTHERS_CHOOSING) {
      if (this.state.tableCards.length >= activePlayers.length) {
        this.state.tableCards = shuffle(this.state.tableCards).map((tc, i) => ({
          ...tc,
          orderId: i,
        }));
        this.changePhase(GamePhase.VOTING);
        this.triggerBotActions();
      }
    } else if (this.state.phase === GamePhase.VOTING) {
      const votersCount = activePlayers.length - 1; // -1 for narrator
      const activeVotes = Object.keys(this.state.votes).filter(vId => !this.state.players.find(p => p.id === vId)?.isSpectator);
      if (activeVotes.length >= votersCount) {
        this.calculateScores();
      }
    }
  }

  // ============================================
  // [BOT] HANDLERS DE BOTS - Removiveis
  // ============================================

  private handleAddBot(playerId: string) {
    if (!this.botManager) return;

    const player = this.state.players.find(p => p.id === playerId);
    if (!player?.isHost) return;
    if (this.state.phase !== GamePhase.LOBBY) return;

    const usedColors = this.state.players.map(p => p.color);
    const bot = this.botManager.addBot(this.state.players, usedColors);

    if (bot) {
      this.state.players.push(bot);
      this.broadcast({
        type: ServerMessageType.PLAYER_JOINED,
        player: { ...bot, hand: [] },
      });
      this.broadcastState();
    }
  }

  private handleRemoveBot(playerId: string, botId: string) {
    if (!this.botManager) return;

    const player = this.state.players.find(p => p.id === playerId);
    if (!player?.isHost) return;
    if (this.state.phase !== GamePhase.LOBBY) return;

    const bot = this.state.players.find(p => p.id === botId && p.isBot);
    if (!bot) return;

    this.state.players = this.botManager.removeBot(this.state.players, botId);

    this.broadcast({
      type: ServerMessageType.PLAYER_LEFT,
      playerId: bot.id,
      playerName: bot.name,
    });
    this.broadcastState();
  }

  private triggerBotActions() {
    if (!this.botManager) return;

    this.botManager.executeBotActions(this.state, {
      submitClue: (botId: string, cardId: number, clue: string) => {
        this.handleSubmitClue(botId, cardId, clue);
      },
      playCard: (botId: string, cardId: number) => {
        this.handlePlayCard(botId, cardId);
      },
      vote: (botId: string, orderId: number) => {
        this.handleVote(botId, orderId);
      },
    });
  }

  // ============================================
  // UTILITÁRIOS DE COMUNICAÇÃO
  // ============================================

  private getPublicState(forPlayerId: string | null): GameState {
    return getPublicState(this.state, forPlayerId);
  }

  private broadcastState() {
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

  private broadcast(message: object) {
    const json = JSON.stringify(message);
    this.room.broadcast(json);
  }

  private sendToConnection(conn: Party.Connection, message: object) {
    conn.send(JSON.stringify(message));
  }

  private sendError(conn: Party.Connection, message: string) {
    this.sendToConnection(conn, {
      type: ServerMessageType.ERROR,
      message,
    });
  }
}
