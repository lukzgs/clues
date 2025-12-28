import type * as Party from "partykit/server";
import { 
  GamePhase, 
  Player, 
  Card,
  TableCard,
  ServerGameState,
  GameState,
  ClientMessage,
  ClientMessageType,
  ServerMessageType,
  PLAYER_COLORS,
} from "../types";

// ============================================
// CONFIGURAÇÕES (duplicadas aqui pois server não usa vite)
// ============================================

const GAME_CONFIG = {
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 8,
  HAND_SIZE: 6,
  WINNING_SCORE: 30,
  DECK_SIZE: 84,
};

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function createDeck(): Card[] {
  return Array.from({ length: GAME_CONFIG.DECK_SIZE }, (_, i) => ({
    id: i + 1,
    imageUrl: `https://picsum.photos/seed/clues-${i + 1}/400/600`,
  }));
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generatePlayerId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================
// SERVIDOR DO JOGO
// ============================================

export default class GameServer implements Party.Server {
  // Estado interno completo
  private state: ServerGameState;
  
  // Mapeamento: connectionId -> playerId
  private connections: Map<string, string> = new Map();

  constructor(readonly room: Party.Room) {
    this.state = this.createInitialState();
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
      deck: shuffle(createDeck()),
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
  }

  // ============================================
  // PROCESSAMENTO DE MENSAGENS
  // ============================================

  onMessage(message: string, sender: Party.Connection) {
    try {
      const msg: ClientMessage = JSON.parse(message);
      const playerId = this.connections.get(sender.id);

      switch (msg.type) {
        case ClientMessageType.JOIN_ROOM:
          this.handleJoinRoom(msg.playerName, sender);
          break;

        case ClientMessageType.LEAVE_ROOM:
          if (playerId) this.handleLeaveRoom(playerId, sender);
          break;

        case ClientMessageType.START_GAME:
          if (playerId) this.handleStartGame(playerId);
          break;

        case ClientMessageType.SUBMIT_CLUE:
          if (playerId) this.handleSubmitClue(playerId, msg.cardId, msg.clue);
          break;

        case ClientMessageType.PLAY_CARD:
          if (playerId) this.handlePlayCard(playerId, msg.cardId);
          break;

        case ClientMessageType.VOTE:
          if (playerId) this.handleVote(playerId, msg.oderId);
          break;

        case ClientMessageType.NEXT_ROUND:
          if (playerId) this.handleNextRound(playerId);
          break;

        case ClientMessageType.RESTART_GAME:
          if (playerId) this.handleRestartGame(playerId);
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
      this.sendError(sender, 'Mensagem inválida');
    }
  }

  // ============================================
  // HANDLERS DE AÇÕES
  // ============================================

  private handleJoinRoom(playerName: string, conn: Party.Connection) {
    // Verifica se já está conectado
    if (this.connections.has(conn.id)) {
      this.sendError(conn, 'Você já está na sala');
      return;
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

  private handleStartGame(playerId: string) {
    const player = this.state.players.find(p => p.id === playerId);
    
    // Apenas host pode iniciar
    if (!player?.isHost) {
      return;
    }

    // Verifica mínimo de jogadores
    if (this.state.players.length < GAME_CONFIG.MIN_PLAYERS) {
      return;
    }

    // Embaralha deck e distribui cartas
    this.state.deck = shuffle(createDeck());
    
    this.state.players.forEach(p => {
      p.hand = this.state.deck.splice(0, GAME_CONFIG.HAND_SIZE);
      p.score = 0;
    });

    // Inicia o jogo
    this.state.phase = GamePhase.NARRATOR_CHOOSING;
    this.state.narratorIndex = 0;
    this.state.currentClue = '';
    this.state.tableCards = [];
    this.state.votes = {};
    this.state.winner = null;

    this.broadcastState();
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
      oderId: 0,
      playerId: narrator.id,
      card,
    }];
    
    this.state.currentClue = clue.trim();
    this.state.phase = GamePhase.OTHERS_CHOOSING;

    this.broadcastState();
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
      oderId: this.state.tableCards.length,
      playerId: player.id,
      card,
    });

    // Verifica se todos jogaram
    const playersWhoShouldPlay = this.state.players.length - 1; // -1 narrador
    if (this.state.tableCards.length === this.state.players.length) {
      // Embaralha as cartas na mesa
      this.state.tableCards = shuffle(this.state.tableCards).map((tc, i) => ({
        ...tc,
        oderId: i,
      }));
      
      this.state.phase = GamePhase.VOTING;
    }

    this.broadcastState();
  }

  private handleVote(playerId: string, oderId: number) {
    if (this.state.phase !== GamePhase.VOTING) return;
    
    const narrator = this.state.players[this.state.narratorIndex];
    if (narrator.id === playerId) return; // Narrador não vota
    
    // Verifica se já votou
    if (this.state.votes[playerId] !== undefined) return;

    // Verifica se a carta existe
    const votedCard = this.state.tableCards.find(tc => tc.oderId === oderId);
    if (!votedCard) return;

    // Não pode votar na própria carta
    if (votedCard.playerId === playerId) return;

    this.state.votes[playerId] = oderId;

    // Verifica se todos votaram
    const votersCount = this.state.players.length - 1; // -1 narrador
    if (Object.keys(this.state.votes).length === votersCount) {
      this.calculateScores();
    }

    this.broadcastState();
  }

  private calculateScores() {
    const narrator = this.state.players[this.state.narratorIndex];
    const narratorCard = this.state.tableCards.find(tc => tc.playerId === narrator.id)!;
    
    // Conta votos na carta do narrador
    const votesForNarrator = Object.values(this.state.votes)
      .filter(oderId => oderId === narratorCard.oderId).length;
    
    const totalVoters = this.state.players.length - 1;

    if (votesForNarrator === 0 || votesForNarrator === totalVoters) {
      // Narrador errou: todos (exceto narrador) ganham 2 pontos
      this.state.players.forEach(p => {
        if (p.id !== narrator.id) {
          p.score += 2;
        }
      });
    } else {
      // Narrador acertou: narrador ganha 3 pontos
      narrator.score += 3;
      
      // Quem votou na carta do narrador ganha 3 pontos
      Object.entries(this.state.votes).forEach(([voterId, oderId]) => {
        if (oderId === narratorCard.oderId) {
          const voter = this.state.players.find(p => p.id === voterId);
          if (voter) voter.score += 3;
        }
      });
    }

    // Bônus: +1 ponto por voto recebido (exceto narrador)
    this.state.tableCards.forEach(tc => {
      if (tc.playerId !== narrator.id) {
        const votesReceived = Object.values(this.state.votes)
          .filter(oderId => oderId === tc.oderId).length;
        
        const player = this.state.players.find(p => p.id === tc.playerId);
        if (player) player.score += votesReceived;
      }
    });

    // Verifica vencedor
    const winner = this.state.players.find(p => p.score >= GAME_CONFIG.WINNING_SCORE);
    if (winner) {
      this.state.phase = GamePhase.GAME_OVER;
      this.state.winner = winner.name;
    } else {
      this.state.phase = GamePhase.RESULTS;
    }
  }

  private handleNextRound(playerId: string) {
    if (this.state.phase !== GamePhase.RESULTS) return;
    
    const player = this.state.players.find(p => p.id === playerId);
    if (!player?.isHost) return;

    // Distribui uma nova carta para cada jogador
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
    this.state.phase = GamePhase.NARRATOR_CHOOSING;

    this.broadcastState();
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
  // UTILITÁRIOS DE COMUNICAÇÃO
  // ============================================

  private getPublicState(forPlayerId: string | null): GameState {
    return {
      roomCode: this.state.roomCode,
      phase: this.state.phase,
      players: this.state.players.map(p => ({
        ...p,
        // Esconde mãos dos outros jogadores
        hand: p.id === forPlayerId ? p.hand : p.hand.map(() => ({ id: -1, imageUrl: '' })),
      })),
      narratorIndex: this.state.narratorIndex,
      currentClue: this.state.currentClue,
      tableCards: this.state.tableCards,
      votes: this.state.votes,
      winner: this.state.winner,
      deckCount: this.state.deck.length,
    };
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
