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
    };
  }

  // [SPECTATOR] Returns max active players based on deck option
  private getMaxPlayersForDeck(deckOption: DeckOption): number {
    return deckOption === 'mixed' ? GAME_CONFIG.MAX_PLAYERS_MIXED : GAME_CONFIG.MAX_PLAYERS;
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
          if (playerId) this.handleStartGame(playerId, msg.victoryCondition, msg.deckOption, msg.phaseTimeouts);
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

  private async resetInactivityTimer() {
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
  // HANDLERS DE AÇÕES
  // ============================================

  private async handleJoinRoom(playerName: string, conn: Party.Connection, reconnectId?: string) {
    // Verifica se já está conectado
    if (this.connections.has(conn.id)) {
      this.sendError(conn, 'Você já está na sala');
      return;
    }

    // Reconnection: try to reclaim a player by ID (even if they still appear connected due to ghost socket)
    if (reconnectId) {
      const player = this.state.players.find(p => p.id === reconnectId && !p.isBot);
      if (player) {
        // Verifica se já existe uma conexão ativa para este jogador
        let existingConn: Party.Connection | undefined;
        let existingConnIdSaved: string | undefined;
        for (const [existingConnId, existingPlayerId] of this.connections.entries()) {
          if (existingPlayerId === player.id) {
            existingConn = this.room.getConnection(existingConnId);
            existingConnIdSaved = existingConnId;
            break;
          }
        }

        if (existingConn) {
          // Assume que a nova conexão (mesmo jogador) é a correta e derruba a antiga imediatamente.
          if (existingConnIdSaved) this.connections.delete(existingConnIdSaved);
          existingConn.close(1000, "Reconnected elsewhere");
        }

        // Reclaim: map new connection to existing player
        player.isConnected = true;
        
        this.connections.set(conn.id, player.id);

        // Remove from readied list so they can re-confirm if disconnected during RESULTS
        this.state.playersWhoReadied = this.state.playersWhoReadied.filter(id => id !== player.id);

        this.broadcast({
          type: ServerMessageType.PLAYER_JOINED,
          player: { ...player, hand: [] },
        });

        this.broadcastState();
        return;
      }
      // reconnectId invalid — fall through to normal join
    }

    // Verifica fase — allow mid-game join as spectator
    if (this.state.phase !== GamePhase.LOBBY) {
      // Mid-game: check total connections limit
      if (this.state.players.length >= GAME_CONFIG.MAX_CONNECTIONS) {
        this.sendError(conn, 'Sala cheia');
        return;
      }

      // Create spectator player
      const playerId = generatePlayerId();
      const playerIndex = this.state.players.length;

      const newPlayer: Player = {
        id: playerId,
        name: playerName.trim() || `Jogador ${playerIndex + 1}`,
        score: 0,
        hand: [],
        color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
        isConnected: true,
        isHost: false,
        isSpectator: true, // Mid-game joins are always spectators
      };

      this.state.players.push(newPlayer);
      this.connections.set(conn.id, playerId);

      this.broadcast({
        type: ServerMessageType.PLAYER_JOINED,
        player: { ...newPlayer, hand: [] },
      });

      this.broadcastState();
      return;
    }

    // Verifica limite total de conexões
    if (this.state.players.length >= GAME_CONFIG.MAX_CONNECTIONS) {
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

  private handleStartGame(playerId: string, victoryCondition: { scoreEnabled: boolean; targetScore: number; narratorRoundsEnabled: boolean; narratorRounds: number }, deckOption: DeckOption, phaseTimeouts: PhaseTimeouts) {
    const player = this.state.players.find(p => p.id === playerId);

    // Apenas host pode iniciar
    if (!player?.isHost) {
      return;
    }

    // [SPECTATOR] Verifica minimo de jogadores ATIVOS (não spectators)
    const activePlayers = this.state.players.filter(p => !p.isSpectator);
    if (activePlayers.length < GAME_CONFIG.MIN_PLAYERS) {
      return;
    }

    // [SPECTATOR] Verifica maximo de jogadores ativos para o deck selecionado
    const maxPlayers = this.getMaxPlayersForDeck(deckOption);
    if (activePlayers.length > maxPlayers) {
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

    // Apply phase timeouts from host
    this.state.phaseTimeouts = {
      narrator: Math.max(0, Math.min(120, phaseTimeouts.narrator)),
      othersChoosing: Math.max(0, Math.min(120, phaseTimeouts.othersChoosing)),
      voting: Math.max(0, Math.min(120, phaseTimeouts.voting)),
      results: Math.max(0, Math.min(120, phaseTimeouts.results)),
    };

    // Create and shuffle deck based on option
    this.state.deckOption = deckOption;
    this.state.deck = shuffle(createDeck(deckOption, GAME_CONFIG.ORIGINAL_DECK_SIZE, GAME_CONFIG.NEW_DECK_SIZE));

    // [SPECTATOR] Distribui cartas apenas para jogadores ativos
    this.state.players.forEach(p => {
      if (!p.isSpectator) {
        p.hand = this.state.deck.splice(0, GAME_CONFIG.HAND_SIZE);
        p.score = 0;
      } else {
        p.hand = [];
        p.score = 0;
      }
    });

    // Inicia o jogo — primeiro narrador deve ser ativo
    this.changePhase(GamePhase.NARRATOR_CHOOSING);
    // Find first active player as narrator
    let narratorIdx = 0;
    while (narratorIdx < this.state.players.length && this.state.players[narratorIdx].isSpectator) {
      narratorIdx++;
    }
    this.state.narratorIndex = narratorIdx;
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

    // Spectators cannot play cards
    if (player.isSpectator) return;

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

    // Spectators cannot vote
    const voter = this.state.players.find(p => p.id === playerId);
    if (voter?.isSpectator) return;

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
      // [BOT] Auto-ready bots so they don't block round advancement
      this.state.players.forEach(p => {
        if (p.isBot && !p.isSpectator) {
          this.state.playersWhoReadied.push(p.id);
        }
      });
    }
  }

  private handleNextRound(playerId: string) {
    if (this.state.phase !== GamePhase.RESULTS) return;

    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    // Spectators cannot ready up
    if (player.isSpectator) return;

    // Mark player as ready
    if (!this.state.playersWhoReadied.includes(playerId)) {
      this.state.playersWhoReadied.push(playerId);
    }

    // Check if all active (non-spectator) players are ready
    const activePlayers = this.state.players.filter(p => !p.isSpectator);
    const allReady = activePlayers.every(p => this.state.playersWhoReadied.includes(p.id));

    if (!allReady) {
      this.broadcastState();
      return;
    }

    // All players are ready — advance to next round
    
    // Check if deck has enough cards for the next round
    if (this.state.deck.length < activePlayers.length) {
      this.changePhase(GamePhase.GAME_OVER);
      const winner = activePlayers.reduce((prev, current) => (prev.score > current.score) ? prev : current);
      this.state.winner = winner.id;
      this.broadcastState();
      return;
    }

    // Increment round counter
    this.state.currentRound++;

    // [SPECTATOR] Distribute a new card only to active players
    this.state.players.forEach(p => {
      if (!p.isSpectator && this.state.deck.length > 0) {
        p.hand.push(this.state.deck.shift()!);
      }
    });

    // Próximo narrador (pula desconectados e spectators)
    let nextIndex = (this.state.narratorIndex + 1) % this.state.players.length;
    let attempts = 0;
    while ((!this.state.players[nextIndex].isConnected || this.state.players[nextIndex].isSpectator) && attempts < this.state.players.length) {
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

    // [SPECTATOR] Mantém jogadores e preserva status de spectator
    const players = this.state.players.map(p => ({
      ...p,
      score: 0,
      hand: [],
      // isSpectator is preserved — spectators can request to play in lobby
    }));

    this.state = {
      ...this.createInitialState(),
      players,
    };

    this.broadcastState();
  }

  // ============================================
  // [SPECTATOR] KICK & SPECTATOR HANDLERS
  // ============================================

  private handleKickPlayer(hostId: string, targetId: string) {
    const host = this.state.players.find(p => p.id === hostId);
    if (!host?.isHost) return;

    const target = this.state.players.find(p => p.id === targetId);
    if (!target) return;

    // Cannot kick yourself
    if (hostId === targetId) return;

    // Save narrator ID before removal for re-location after array shift
    const currentNarratorId = this.state.players[this.state.narratorIndex]?.id;

    // Remove player from state
    this.state.players = this.state.players.filter(p => p.id !== targetId);

    // Clean up their votes and table cards
    delete this.state.votes[targetId];
    this.state.tableCards = this.state.tableCards.filter(tc => tc.playerId !== targetId);
    this.state.playersWhoReadied = this.state.playersWhoReadied.filter(id => id !== targetId);
    this.state.afkKickVotes = this.state.afkKickVotes.filter(id => id !== targetId);

    // If kicked player was host (shouldn't happen but safety), reassign
    if (target.isHost && this.state.players.length > 0) {
      const newHost = this.state.players.find(p => !p.isSpectator) || this.state.players[0];
      newHost.isHost = true;
    }

    // Close the kicked player's connection
    for (const [connId, pId] of this.connections) {
      if (pId === targetId) {
        const conn = this.room.getConnection(connId);
        if (conn) {
          this.sendToConnection(conn, {
            type: ServerMessageType.PLAYER_KICKED,
            playerId: targetId,
            playerName: target.name,
          });
        }
        this.connections.delete(connId);
        break;
      }
    }

    // Broadcast to remaining players
    this.broadcast({
      type: ServerMessageType.PLAYER_KICKED,
      playerId: target.id,
      playerName: target.name,
    });

    // If during game, check if narrator was kicked or phase needs progression
    if (this.state.phase !== GamePhase.LOBBY) {
      // If active players dropped below minimum, end the game
      const remainingActive = this.state.players.filter(p => !p.isSpectator);
      if (remainingActive.length < GAME_CONFIG.MIN_PLAYERS) {
        this.changePhase(GamePhase.GAME_OVER);
        const winner = remainingActive.reduce((prev, curr) => prev.score > curr.score ? prev : curr, remainingActive[0]);
        this.state.winner = winner?.id ?? null;
        this.broadcastState();
        return;
      }

      // Re-locate narrator by ID after array shift
      const newNarratorIdx = this.state.players.findIndex(p => p.id === currentNarratorId);
      this.state.narratorIndex = newNarratorIdx >= 0
        ? newNarratorIdx
        : Math.min(this.state.narratorIndex, Math.max(0, this.state.players.length - 1));

      const narrator = this.state.players[this.state.narratorIndex];
      if (!narrator || narrator.isSpectator) {
        // Skip to results and advance
        if (this.state.phase === GamePhase.NARRATOR_CHOOSING) {
          this.changePhase(GamePhase.RESULTS);
          const hostPlayer = this.state.players.find(p => p.isHost);
          if (hostPlayer) this.handleNextRound(hostPlayer.id);
          return;
        }
      }

      // Check if phase can now progress (fewer players needed)
      this.checkPhaseProgression();
    }

    this.broadcastState();
  }

  private handleToggleSpectator(requesterId: string, targetId: string) {
    // Only in lobby
    if (this.state.phase !== GamePhase.LOBBY) return;

    const requester = this.state.players.find(p => p.id === requesterId);
    if (!requester) return;

    const target = this.state.players.find(p => p.id === targetId);
    if (!target) return;

    // Permission check:
    // - Host can toggle anyone except themselves
    // - Any player can toggle themselves
    const isSelf = requesterId === targetId;
    const isHost = requester.isHost;

    if (!isSelf && !isHost) return; // Not allowed

    if (target.isSpectator) {
      // Spectator → Player: check max active players
      const activePlayers = this.state.players.filter(p => !p.isSpectator);
      const maxPlayers = this.getMaxPlayersForDeck(this.state.deckOption);
      if (activePlayers.length >= maxPlayers) return;
      target.isSpectator = false;
    } else {
      // Player → Spectator
      target.isSpectator = true;
    }

    this.broadcastState();
  }


  private handleRequestPlay(playerId: string) {
    // Only in lobby
    if (this.state.phase !== GamePhase.LOBBY) return;

    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;
    if (!player.isSpectator) return; // Already a player

    // Check max active players
    const activePlayers = this.state.players.filter(p => !p.isSpectator);
    const maxPlayers = this.getMaxPlayersForDeck(this.state.deckOption);
    if (activePlayers.length >= maxPlayers) return;

    player.isSpectator = false;
    this.broadcastState();
  }

  // ============================================
  // AFK & TIMEOUT SYSTEM
  // ============================================

  private changePhase(newPhase: GamePhase) {
    this.state.phase = newPhase;
    this.state.phaseStartTime = Date.now();
    this.state.afkKickVotes = [];
    this.state.playersWhoReadied = [];
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
        return activePlayers.filter(p => !this.state.playersWhoReadied.includes(p.id));
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
    if (!GAME_CONFIG.ENABLE_BOTS || !this.botManager) return;

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
    if (!GAME_CONFIG.ENABLE_BOTS || !this.botManager) return;

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
    if (!GAME_CONFIG.ENABLE_BOTS || !this.botManager) return;

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
