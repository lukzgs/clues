/**
 * Pure game logic functions extracted from the GameServer class.
 *
 * These functions are stateless and side-effect-free, making them
 * easy to unit test without instantiating the full server.
 */

import {
  Card,
  Player,
  TableCard,
  GamePhase,
  GameState,
  ServerGameState,
  VictoryCondition,
  DeckOption,
} from '../src/types';

// ============================================
// DECK & UTILITY FUNCTIONS
// ============================================

/**
 * Creates a deck of cards with sequential IDs and image URLs.
 */
export function createDeck(deckOption: DeckOption, originalSize: number, newSize: number): Card[] {
  const cards: Card[] = [];
  let idCounter = 1;

  if (deckOption === 'original' || deckOption === 'mixed') {
    for (let i = 1; i <= originalSize; i++) {
      cards.push({ id: idCounter++, imageUrl: `/cards/original/${String(i).padStart(3, '0')}.avif` });
    }
  }

  if (deckOption === 'new' || deckOption === 'mixed') {
    for (let i = originalSize + 1; i <= originalSize + newSize; i++) {
      cards.push({ id: idCounter++, imageUrl: `/cards/new/${i}.avif` });
    }
  }

  return cards;
}

/**
 * Fisher-Yates shuffle — returns a new shuffled array without mutating the original.
 */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates a unique player ID with timestamp and random suffix.
 */
export function generatePlayerId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================
// SCORING
// ============================================

/**
 * Result of score calculation for a single round.
 */
export interface ScoreResult {
  /** Map of playerId -> points earned this round */
  pointsEarned: Record<string, number>;
  /** Whether the game ended after this round */
  gameOver: boolean;
  /** ID of the winner (if gameOver is true) */
  winnerId: string | null;
}

/**
 * Calculates scores for the current round based on votes.
 *
 * Scoring rules (Dixit-style):
 * - If ALL or NONE voted for the narrator's card: everyone except narrator gets 2 pts
 * - Otherwise: narrator gets 3 pts + voters who guessed correctly get 3 pts
 * - Bonus: +1 pt per vote received on non-narrator cards
 */
export function calculateScores(
  players: Player[],
  narratorIndex: number,
  tableCards: TableCard[],
  votes: Record<string, number>,
): Record<string, number> {
  const narrator = players[narratorIndex];
  const narratorCard = tableCards.find(tc => tc.playerId === narrator.id)!;
  const pointsEarned: Record<string, number> = {};

  // Initialize all players to 0
  for (const p of players) {
    pointsEarned[p.id] = 0;
  }

  // Filter out spectator votes (defensive — server should already block these)
  const activeVotes: Record<string, number> = {};
  for (const [voterId, orderId] of Object.entries(votes)) {
    const voter = players.find(p => p.id === voterId);
    if (voter && !voter.isSpectator) {
      activeVotes[voterId] = orderId;
    }
  }

  // Count votes for narrator's card
  const votesForNarrator = Object.values(activeVotes)
    .filter(orderId => orderId === narratorCard.orderId).length;

  const activePlayers = players.filter(p => !p.isSpectator);
  const totalVoters = activePlayers.length - 1;

  if (votesForNarrator === 0 || votesForNarrator === totalVoters) {
    // Narrator failed: everyone except narrator gets 2 points
    for (const p of activePlayers) {
      if (p.id !== narrator.id) {
        pointsEarned[p.id] += 2;
      }
    }
  } else {
    // Narrator succeeded: narrator gets 3 points
    pointsEarned[narrator.id] += 3;

    // Voters who guessed correctly get 3 points
    for (const [voterId, orderId] of Object.entries(activeVotes)) {
      if (orderId === narratorCard.orderId) {
        pointsEarned[voterId] += 3;
      }
    }
  }

  // Bonus: +1 point per vote received (non-narrator cards only)
  for (const tc of tableCards) {
    const cardOwner = players.find(p => p.id === tc.playerId);
    if (tc.playerId !== narrator.id && !cardOwner?.isSpectator) {
      const votesReceived = Object.values(activeVotes)
        .filter(orderId => orderId === tc.orderId).length;
      pointsEarned[tc.playerId] += votesReceived;
    }
  }

  return pointsEarned;
}

/**
 * Checks if any victory condition has been met.
 *
 * Returns the winner's ID if the game is over, or null if it continues.
 */
export function checkVictoryCondition(
  players: Player[],
  victoryCondition: VictoryCondition,
  currentRound: number,
): string | null {
  // Check score-based victory
  if (victoryCondition.scoreEnabled) {
    const winners = players.filter(p => !p.isSpectator && p.score >= victoryCondition.targetScore);
    if (winners.length > 0) {
      // If multiple players cross the target score in the same round, the one with highest score wins
      winners.sort((a, b) => b.score - a.score);
      return winners[0].id;
    }
  }

  // Check narrator-rounds-based victory
  if (victoryCondition.narratorRoundsEnabled) {
    const activePlayers = players.filter(p => !p.isSpectator);
    const totalRounds = activePlayers.length * victoryCondition.narratorRounds;
    const completedRounds = currentRound + 1;

    if (completedRounds >= totalRounds) {
      const sorted = [...activePlayers].sort((a, b) => b.score - a.score);
      return sorted[0].id;
    }
  }

  return null;
}

// ============================================
// PUBLIC STATE FILTERING
// ============================================

/**
 * Creates a filtered view of the game state for a specific player.
 *
 * Security guarantees:
 * - Players cannot see other players' hands
 * - Card ownership is hidden during OTHERS_CHOOSING and VOTING (except for narrator)
 * - Votes are hidden during VOTING (except the player's own vote)
 * - Everything is revealed during RESULTS and GAME_OVER
 */
export function getPublicState(
  state: ServerGameState,
  forPlayerId: string | null,
): GameState {
  const narrator = state.players[state.narratorIndex];
  const isNarrator = forPlayerId === narrator?.id;
  const isRevealed = state.phase === GamePhase.RESULTS || state.phase === GamePhase.GAME_OVER;

  // Filter tableCards: hide playerId unless narrator or in RESULTS/GAME_OVER
  const tableCards = state.tableCards.map(tc => ({
    ...tc,
    playerId: (isNarrator || isRevealed) ? tc.playerId : '',
    isMine: tc.playerId === forPlayerId,
  }));

  // Filter votes: hide until RESULTS/GAME_OVER; during VOTING show only own vote
  let votes: Record<string, number> = {};
  if (isRevealed) {
    votes = state.votes;
  } else if (forPlayerId && state.votes[forPlayerId] !== undefined) {
    votes = { [forPlayerId]: state.votes[forPlayerId] };
  }

  // playersWhoPlayed: safe list of IDs who already placed a card (no card association)
  const playersWhoPlayed = state.tableCards.map(tc => tc.playerId);
  
  // playersWhoVoted: safe list of IDs who already voted (no choice association)
  const playersWhoVoted = Object.keys(state.votes);

  return {
    roomCode: state.roomCode,
    phase: state.phase,
    players: state.players.map(p => ({
      ...p,
      // Hide other players' hands
      hand: p.id === forPlayerId ? p.hand : p.hand.map(() => ({ id: -1, imageUrl: '' })),
    })),
    narratorIndex: state.narratorIndex,
    currentClue: state.currentClue,
    tableCards,
    votes,
    winner: state.winner,
    deckCount: state.deck.length,
    playersWhoPlayed,
    playersWhoVoted,
    victoryCondition: state.victoryCondition,
    currentRound: state.currentRound,
    phaseStartTime: state.phaseStartTime,
    afkKickVotes: state.afkKickVotes,
    deckOption: state.deckOption,
    playersWhoReadied: state.playersWhoReadied,
    phaseTimeouts: state.phaseTimeouts,
  };
}
