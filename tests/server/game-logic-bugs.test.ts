/**
 * Bug tests for pure game-logic functions.
 *
 * Covers: calculateScores, checkVictoryCondition, getPublicState.
 * These are all stateless functions in party/game-logic.ts that can be tested
 * without instantiating the full GameServer.
 */

import {
  calculateScores,
  checkVictoryCondition,
  getPublicState,
} from '../../party/game-logic';
import { GamePhase, Player, TableCard, ServerGameState, VictoryCondition } from '../../src/types';

// ============================================
// HELPERS
// ============================================

function createPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: `p-${Math.random().toString(36).substring(2, 7)}`,
    name: 'Test Player',
    score: 0,
    hand: [
      { id: 1, imageUrl: '/cards/new/1.avif' },
      { id: 2, imageUrl: '/cards/new/2.avif' },
    ],
    color: '#ef4444',
    isConnected: true,
    isHost: false,
    ...overrides,
  };
}

function createTableCard(playerId: string, orderId: number, cardId: number): TableCard {
  return {
    orderId,
    playerId,
    card: { id: cardId, imageUrl: `/cards/new/card_${String(cardId).padStart(4, '0')}.avif` },
  };
}

function createServerState(overrides: Partial<ServerGameState> = {}): ServerGameState {
  return {
    roomCode: 'TEST01',
    phase: GamePhase.VOTING,
    players: [],
    narratorIndex: 0,
    currentClue: 'a test clue',
    tableCards: [],
    votes: {},
    winner: null,
    deck: [],
    victoryCondition: {
      scoreEnabled: true,
      targetScore: 30,
      narratorRoundsEnabled: false,
      narratorRounds: 3,
    },
    currentRound: 0,
    phaseStartTime: Date.now(),
    afkKickVotes: [],
    deckOption: 'mixed',
    playersWhoReadied: [],
    phaseTimeouts: { narrator: 60, othersChoosing: 45, voting: 30, results: 15 },
    ...overrides,
  };
}

// ============================================
// BUG #1 — checkVictoryCondition counts spectators
// in narrator rounds, inflating the round count.
// ============================================

describe('BUG #1 — checkVictoryCondition counts spectators in narrator rounds', () => {
  it('should end the game after active_players * narratorRounds, but spectators inflate the count', () => {
    const condition: VictoryCondition = {
      scoreEnabled: false,
      targetScore: 999,
      narratorRoundsEnabled: true,
      narratorRounds: 2,
    };

    // 3 active players + 2 spectators = 5 total
    const players = [
      createPlayer({ id: 'p1', score: 20 }),
      createPlayer({ id: 'p2', score: 15 }),
      createPlayer({ id: 'p3', score: 10 }),
      createPlayer({ id: 's1', score: 0, isSpectator: true }),
      createPlayer({ id: 's2', score: 0, isSpectator: true }),
    ];

    // 3 active × 2 narratorRounds = 6 total rounds needed.
    // At currentRound=5, completedRounds=6 → game should end.
    // BUG: uses players.length (5) × 2 = 10 → game doesn't end.
    const result = checkVictoryCondition(players, condition, 5);
    expect(result).toBe('p1');
  });

  it('requires spectators to narrate rounds they can never play', () => {
    const condition: VictoryCondition = {
      scoreEnabled: false,
      targetScore: 999,
      narratorRoundsEnabled: true,
      narratorRounds: 1,
    };

    // 2 active + 3 spectators
    const players = [
      createPlayer({ id: 'p1', score: 10 }),
      createPlayer({ id: 'p2', score: 5 }),
      createPlayer({ id: 's1', score: 0, isSpectator: true }),
      createPlayer({ id: 's2', score: 0, isSpectator: true }),
      createPlayer({ id: 's3', score: 0, isSpectator: true }),
    ];

    // 2 active × 1 = 2 rounds. currentRound=1 → completedRounds=2 → should end.
    // BUG: 5 × 1 = 5, so at round 1 it doesn't end.
    const result = checkVictoryCondition(players, condition, 1);
    expect(result).toBe('p1');
  });
});

// ============================================
// BUG #2 — calculateScores allows spectator votes
// to corrupt scoring thresholds and award bonus points.
// ============================================

describe('BUG #2 — Spectator votes corrupt scoring', () => {
  it('spectator votes count toward the narrator card voting threshold', () => {
    const players = [
      createPlayer({ id: 'narrator', score: 0 }),
      createPlayer({ id: 'p2', score: 0 }),
      createPlayer({ id: 'p3', score: 0 }),
      createPlayer({ id: 'spectator', score: 0, isSpectator: true }),
    ];

    const tableCards: TableCard[] = [
      createTableCard('narrator', 0, 101),
      createTableCard('p2', 1, 102),
      createTableCard('p3', 2, 103),
    ];

    // With spectator voting for narrator card: votesForNarrator = 2 (p2 + spectator)
    // totalVoters = 2 (active - narrator). 2 === 2 → narrator "fails".
    // Without spectator: votesForNarrator = 1, not 0 or 2 → narrator "succeeds".
    const votesWithSpectator = { p2: 0, p3: 1, spectator: 0 };
    const votesWithoutSpectator = { p2: 0, p3: 1 };

    const resultWith = calculateScores(players, 0, tableCards, votesWithSpectator);
    const resultWithout = calculateScores(players, 0, tableCards, votesWithoutSpectator);

    // Spectator vote should not change the outcome
    expect(resultWith['narrator']).toBe(resultWithout['narrator']);
  });

  it('spectators receive bonus points from votes on their ghost cards', () => {
    const players = [
      createPlayer({ id: 'narrator', score: 0 }),
      createPlayer({ id: 'p2', score: 0 }),
      createPlayer({ id: 'p3', score: 0 }),
      createPlayer({ id: 'ex-player', score: 0, isSpectator: true }),
    ];

    const tableCards: TableCard[] = [
      createTableCard('narrator', 0, 101),
      createTableCard('p2', 1, 102),
      createTableCard('p3', 2, 103),
      createTableCard('ex-player', 3, 104), // ghost card from kicked player
    ];

    // Nobody votes for narrator → narrator fails → everyone else gets 2 pts
    // Both votes go to ex-player's ghost card → +2 bonus for spectator
    const votes = { p2: 3, p3: 3 };
    const result = calculateScores(players, 0, tableCards, votes);

    // Spectator should NEVER receive points
    expect(result['ex-player']).toBe(0);
  });
});

// ============================================
// BUG #5 — getPublicState omits phaseTimeouts
// from the returned GameState (required field).
// Client receives undefined, causing TypeError crash.
// ============================================

describe('BUG #5 — getPublicState omits phaseTimeouts (client crash)', () => {
  it('should include phaseTimeouts in the returned GameState', () => {
    const state = createServerState({
      players: [
        createPlayer({ id: 'p1' }),
        createPlayer({ id: 'p2' }),
      ],
      phase: GamePhase.NARRATOR_CHOOSING,
      phaseTimeouts: { narrator: 90, othersChoosing: 60, voting: 45, results: 20 },
    });

    const publicState = getPublicState(state, 'p1');

    expect(publicState.phaseTimeouts).toBeDefined();
    expect(publicState.phaseTimeouts).toEqual({
      narrator: 90,
      othersChoosing: 60,
      voting: 45,
      results: 20,
    });
  });

  it('accessing phaseTimeouts.narrator crashes because it is undefined', () => {
    const state = createServerState({
      players: [createPlayer({ id: 'p1' })],
      phase: GamePhase.NARRATOR_CHOOSING,
    });

    const publicState = getPublicState(state, 'p1');

    expect(() => {
      const _timeout = publicState.phaseTimeouts.narrator;
    }).not.toThrow();
  });
});

// ============================================
// BUG #8 — checkVictoryCondition lets spectators win
// via score-based victory even though they are not playing.
// ============================================

describe('BUG #8 — Spectator with high score excluded from victory', () => {
  it('should not let a spectator win even if their score exceeds the target', () => {
    const condition: VictoryCondition = {
      scoreEnabled: true,
      targetScore: 30,
      narratorRoundsEnabled: false,
      narratorRounds: 2,
    };

    const players = [
      createPlayer({ id: 'p1', score: 25 }),
      createPlayer({ id: 'p2', score: 20 }),
      createPlayer({ id: 'ex', score: 35, isSpectator: true }),
    ];

    const result = checkVictoryCondition(players, condition, 5);
    expect(result).not.toBe('ex');
  });

  it('returns null when only spectators exceed the target score', () => {
    const condition: VictoryCondition = {
      scoreEnabled: true,
      targetScore: 30,
      narratorRoundsEnabled: false,
      narratorRounds: 2,
    };

    const players = [
      createPlayer({ id: 'p1', score: 10 }),
      createPlayer({ id: 'p2', score: 15 }),
      createPlayer({ id: 'ex', score: 50, isSpectator: true }),
    ];

    const result = checkVictoryCondition(players, condition, 5);
    expect(result).toBeNull();
  });
});
