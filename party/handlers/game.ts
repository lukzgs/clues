import GAME_CONFIG from '../../game.config.json';
import {
  type DeckOption,
  GamePhase,
  type PhaseTimeouts,
} from '../../src/types';
import {
  calculateScores as calculateScoresPure,
  checkVictoryCondition,
  createDeck,
  shuffle,
} from '../game-logic';
import type GameServer from '../server';
import { sanitizeSettings } from '../settings-sanitizer';
import { triggerBotActions } from './bot';

export function handleStartGame(
  server: GameServer,
  playerId: string,
  victoryCondition: {
    scoreEnabled: boolean;
    targetScore: number;
    narratorRoundsEnabled: boolean;
    narratorRounds: number;
  },
  deckOption: DeckOption,
  phaseTimeouts: PhaseTimeouts,
  timerEnabled: boolean,
) {
  const player = server.state.players.find((p) => p.id === playerId);

  server.state.timerEnabled = timerEnabled;

  // Apenas host pode iniciar
  if (!player?.isHost) {
    return;
  }

  // Remove disconnected players before starting (lobby cleanup)
  server.state.players = server.state.players.filter(
    (p) => p.isConnected || p.isBot,
  );

  // [SPECTATOR] Verifica minimo de jogadores ATIVOS (não spectators)
  const activePlayers = server.state.players.filter((p) => !p.isSpectator);
  if (activePlayers.length < GAME_CONFIG.MIN_PLAYERS) {
    return;
  }

  // [SPECTATOR] Verifica maximo de jogadores ativos para o deck selecionado e condição de vitória
  const maxPlayers = server.getMaxPlayersForDeck(deckOption, victoryCondition);
  if (activePlayers.length > maxPlayers) {
    return;
  }

  // At least one condition must be enabled
  if (
    !victoryCondition.scoreEnabled &&
    !victoryCondition.narratorRoundsEnabled
  ) {
    return;
  }

  // Apply sanitized settings from host
  const sanitized = sanitizeSettings(victoryCondition, phaseTimeouts);
  server.state.victoryCondition = sanitized.victoryCondition;
  server.state.phaseTimeouts = sanitized.phaseTimeouts;

  // Create and shuffle deck based on option
  server.state.deckOption = deckOption;
  server.state.deck = shuffle(
    createDeck(
      deckOption,
      GAME_CONFIG.ORIGINAL_DECK_SIZE,
      GAME_CONFIG.NEW_DECK_SIZE,
    ),
  );

  // [SPECTATOR] Distribui cartas apenas para jogadores ativos
  server.state.players.forEach((p) => {
    if (!p.isSpectator) {
      p.hand = server.state.deck.splice(0, GAME_CONFIG.HAND_SIZE);
      p.score = 0;
    } else {
      p.hand = [];
      p.score = 0;
    }
  });

  // Inicia o jogo — primeiro narrador deve ser ativo
  server.changePhase(GamePhase.NARRATOR_CHOOSING);
  // Find first active player as narrator
  let narratorIdx = 0;
  while (
    narratorIdx < server.state.players.length &&
    server.state.players[narratorIdx].isSpectator
  ) {
    narratorIdx++;
  }
  server.state.narratorIndex = narratorIdx;
  server.state.currentClue = '';
  server.state.tableCards = [];
  server.state.votes = {};
  server.state.winner = null;
  server.state.currentRound = 0;

  server.broadcastState();

  // [BOT] Faz bots agirem se necessário
  triggerBotActions(server);
}

export function handleSubmitClue(
  server: GameServer,
  playerId: string,
  cardId: number,
  clue: string,
) {
  if (server.state.phase !== GamePhase.NARRATOR_CHOOSING) return;

  const narrator = server.state.players[server.state.narratorIndex];
  if (narrator.id !== playerId) return;

  const cardIndex = narrator.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return;

  if (!clue.trim()) return;

  // Remove carta da mão e coloca na mesa
  const [card] = narrator.hand.splice(cardIndex, 1);

  server.state.tableCards = [
    {
      orderId: 0,
      playerId: narrator.id,
      card,
    },
  ];

  server.state.currentClue = clue.trim();
  server.changePhase(GamePhase.OTHERS_CHOOSING);

  server.broadcastState();

  // [BOT] Faz bots jogarem cartas
  triggerBotActions(server);
}

export function handlePlayCard(
  server: GameServer,
  playerId: string,
  cardId: number,
) {
  if (server.state.phase !== GamePhase.OTHERS_CHOOSING) return;

  const narrator = server.state.players[server.state.narratorIndex];
  if (narrator.id === playerId) return; // Narrador não joga

  // Verifica se já jogou
  if (server.state.tableCards.some((tc) => tc.playerId === playerId)) return;

  const player = server.state.players.find((p) => p.id === playerId);
  if (!player) return;

  // Spectators cannot play cards
  if (player.isSpectator) return;

  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return;

  // Remove carta da mão e coloca na mesa
  const [card] = player.hand.splice(cardIndex, 1);

  server.state.tableCards.push({
    orderId: server.state.tableCards.length,
    playerId: player.id,
    card,
  });

  // Verifica se todos jogaram
  const activePlayers = server.state.players.filter((p) => !p.isSpectator);
  if (server.state.tableCards.length >= activePlayers.length) {
    // Embaralha as cartas na mesa
    server.state.tableCards = shuffle(server.state.tableCards).map((tc, i) => ({
      ...tc,
      orderId: i,
    }));

    server.changePhase(GamePhase.VOTING);
    triggerBotActions(server);
  }

  server.broadcastState();
}

export function handleVote(
  server: GameServer,
  playerId: string,
  orderId: number,
) {
  if (server.state.phase !== GamePhase.VOTING) return;

  const narrator = server.state.players[server.state.narratorIndex];
  if (narrator.id === playerId) return; // Narrador não vota

  // Spectators cannot vote
  const voter = server.state.players.find((p) => p.id === playerId);
  if (voter?.isSpectator) return;

  // Verifica se já votou
  if (server.state.votes[playerId] !== undefined) return;

  // Verifica se a carta existe
  const votedCard = server.state.tableCards.find(
    (tc) => tc.orderId === orderId,
  );
  if (!votedCard) return;

  // Não pode votar na própria carta
  if (votedCard.playerId === playerId) return;

  server.state.votes[playerId] = orderId;

  // Verifica se todos votaram
  const activePlayers = server.state.players.filter((p) => !p.isSpectator);
  const votersCount = activePlayers.length - 1; // -1 narrador

  // Contar apenas votos de jogadores ativos
  const activeVotes = Object.keys(server.state.votes).filter(
    (vId) => !server.state.players.find((p) => p.id === vId)?.isSpectator,
  );

  if (activeVotes.length >= votersCount) {
    calculateScores(server);
  }

  server.broadcastState();
}

export function calculateScores(server: GameServer) {
  // Delegate scoring to pure function
  const pointsEarned = calculateScoresPure(
    server.state.players,
    server.state.narratorIndex,
    server.state.tableCards,
    server.state.votes,
  );

  // Apply earned points to player scores
  for (const player of server.state.players) {
    player.score += pointsEarned[player.id] || 0;
  }

  // Check victory conditions
  const winnerId = checkVictoryCondition(
    server.state.players,
    server.state.victoryCondition,
    server.state.currentRound,
  );

  if (winnerId) {
    server.state.winner = winnerId;
  }

  server.changePhase(GamePhase.RESULTS);
  // [BOT] Auto-ready bots so they don't block round advancement
  server.state.players.forEach((p) => {
    if (p.isBot && !p.isSpectator) {
      server.state.playersWhoReadied.push(p.id);
    }
  });
}

export function handleNextRound(server: GameServer, playerId: string) {
  if (server.state.phase !== GamePhase.RESULTS) return;

  const player = server.state.players.find((p) => p.id === playerId);
  if (!player) return;

  // Spectators cannot ready up
  if (player.isSpectator) return;

  // Mark player as ready
  if (!server.state.playersWhoReadied.includes(playerId)) {
    server.state.playersWhoReadied.push(playerId);
  }

  // Check if all active (non-spectator) players are ready
  const activePlayers = server.state.players.filter((p) => !p.isSpectator);
  const allReady = activePlayers.every((p) =>
    server.state.playersWhoReadied.includes(p.id),
  );

  if (!allReady) {
    server.broadcastState();
    return;
  }

  // All players are ready — advance to next round

  // Check if game is already won from previous round
  if (server.state.winner) {
    server.changePhase(GamePhase.GAME_OVER);
    server.broadcastState();
    return;
  }

  // Check if deck has enough cards for the next round
  if (server.state.deck.length < activePlayers.length) {
    server.changePhase(GamePhase.GAME_OVER);
    const winner = activePlayers.reduce((prev, current) =>
      prev.score > current.score ? prev : current,
    );
    server.state.winner = winner.id;
    server.broadcastState();
    return;
  }

  // Increment round counter
  server.state.currentRound++;

  // [SPECTATOR] Distribute a new card only to active players
  server.state.players.forEach((p) => {
    if (!p.isSpectator && server.state.deck.length > 0) {
      p.hand.push(server.state.deck.shift()!);
    }
  });

  // Próximo narrador (pula desconectados e spectators)
  let nextIndex =
    (server.state.narratorIndex + 1) % server.state.players.length;
  let attempts = 0;
  while (
    (!server.state.players[nextIndex].isConnected ||
      server.state.players[nextIndex].isSpectator) &&
    attempts < server.state.players.length
  ) {
    nextIndex = (nextIndex + 1) % server.state.players.length;
    attempts++;
  }

  server.state.narratorIndex = nextIndex;
  server.state.currentClue = '';
  server.state.tableCards = [];
  server.state.votes = {};
  server.changePhase(GamePhase.NARRATOR_CHOOSING);

  server.broadcastState();

  // [BOT] Faz bots agirem se próximo narrador for bot
  triggerBotActions(server);
}

export function handleRestartGame(server: GameServer, playerId: string) {
  const player = server.state.players.find((p) => p.id === playerId);
  if (!player?.isHost) return;

  // [SPECTATOR] Mantém jogadores e preserva status de spectator
  const players = server.state.players.map((p) => ({
    ...p,
    score: 0,
    hand: [],
    // isSpectator is preserved — spectators can request to play in lobby
  }));

  server.state = {
    ...server.createInitialState(),
    players,
  };

  server.broadcastState();
}
