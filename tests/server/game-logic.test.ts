/**
 * Unit tests for pure game logic functions.
 *
 * Tests cover: deck creation, shuffle, player ID generation,
 * scoring rules, victory conditions, and public state filtering.
 */

import {
  createDeck,
  shuffle,
  generatePlayerId,
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
      { id: 1, imageUrl: '/cards/new/card_0001.avif' },
      { id: 2, imageUrl: '/cards/new/card_0002.avif' },
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
    ...overrides,
  };
}

// ============================================
// createDeck
// ============================================

describe('createDeck', () => {
  it('creates the correct number of cards', () => {
    const deck = createDeck(341);
    expect(deck).toHaveLength(341);
  });

  it('creates cards with sequential IDs from 1 to deckSize', () => {
    const deck = createDeck(10);
    const ids = deck.map(c => c.id);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('generates correct image URLs with zero-padded IDs', () => {
    const deck = createDeck(5);
    expect(deck[0].imageUrl).toBe('/cards/new/card_0001.avif');
    expect(deck[4].imageUrl).toBe('/cards/new/card_0005.avif');
  });

  it('handles single card deck', () => {
    const deck = createDeck(1);
    expect(deck).toHaveLength(1);
    expect(deck[0]).toEqual({ id: 1, imageUrl: '/cards/new/card_0001.avif' });
  });

  it('handles empty deck', () => {
    const deck = createDeck(0);
    expect(deck).toHaveLength(0);
  });
});

// ============================================
// shuffle
// ============================================

describe('shuffle', () => {
  it('returns an array of the same length', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toHaveLength(arr.length);
  });

  it('contains all the same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result.sort()).toEqual(arr.sort());
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });

  it('handles empty array', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('handles single element array', () => {
    expect(shuffle([42])).toEqual([42]);
  });
});

// ============================================
// generatePlayerId
// ============================================

describe('generatePlayerId', () => {
  it('starts with "p-" prefix', () => {
    const id = generatePlayerId();
    expect(id).toMatch(/^p-/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generatePlayerId()));
    expect(ids.size).toBe(100);
  });
});

// ============================================
// calculateScores
// ============================================

describe('calculateScores', () => {
  // Setup: 3 players, narrator = p1, p2 and p3 are voters
  const p1 = createPlayer({ id: 'p1', name: 'Narrator' });
  const p2 = createPlayer({ id: 'p2', name: 'Player 2' });
  const p3 = createPlayer({ id: 'p3', name: 'Player 3' });
  const players = [p1, p2, p3];

  const tableCards: TableCard[] = [
    createTableCard('p1', 0, 101), // narrator's card
    createTableCard('p2', 1, 102),
    createTableCard('p3', 2, 103),
  ];

  describe('when nobody votes for narrator card', () => {
    it('gives 2 points to every non-narrator player', () => {
      const votes = { p2: 1, p3: 2 }; // both vote for non-narrator cards
      // But wait — p2 votes orderId=1 (p2's own card) and p3 votes orderId=2 (p3's own card)
      // Actually in a real game you can't vote for your own card, but calculateScores doesn't enforce that
      // Let's use valid votes: p2 votes for p3's card, p3 votes for p2's card
      const validVotes = { p2: 2, p3: 1 };
      const result = calculateScores(players, 0, tableCards, validVotes);

      expect(result['p1']).toBe(0); // narrator gets nothing
      expect(result['p2']).toBe(2 + 1); // 2 base + 1 bonus (p3 voted for p2's card)
      expect(result['p3']).toBe(2 + 1); // 2 base + 1 bonus (p2 voted for p3's card)
    });
  });

  describe('when everyone votes for narrator card', () => {
    it('gives 2 points to every non-narrator player', () => {
      const votes = { p2: 0, p3: 0 }; // both vote for narrator's card (orderId=0)
      const result = calculateScores(players, 0, tableCards, votes);

      expect(result['p1']).toBe(0); // narrator gets nothing
      expect(result['p2']).toBe(2); // 2 base, no bonus
      expect(result['p3']).toBe(2); // 2 base, no bonus
    });
  });

  describe('when some vote for narrator card (narrator succeeds)', () => {
    it('gives 3 pts to narrator + 3 pts to correct voters + bonus', () => {
      const votes = { p2: 0, p3: 2 }; // p2 votes narrator (orderId=0), p3 votes own card
      // p2 voted correctly → p2 gets 3pts
      // p3 voted for orderId=2 (p3's card) — but in real game this would be blocked
      // For scoring test: p3's vote goes to p3's card (orderId=2)
      const result = calculateScores(players, 0, tableCards, votes);

      expect(result['p1']).toBe(3); // narrator succeeds
      expect(result['p2']).toBe(3); // guessed correctly
      expect(result['p3']).toBe(1); // 0 base + 1 bonus (p3 voted for orderId=2, which is p3's card, giving p3 +1)
    });
  });

  describe('bonus points for votes received', () => {
    it('awards +1 per vote received on non-narrator cards', () => {
      // 4 players scenario
      const p4 = createPlayer({ id: 'p4', name: 'Player 4' });
      const fourPlayers = [p1, p2, p3, p4];
      const fourCards: TableCard[] = [
        createTableCard('p1', 0, 101),
        createTableCard('p2', 1, 102),
        createTableCard('p3', 2, 103),
        createTableCard('p4', 3, 104),
      ];

      // Nobody votes for narrator, p2/p3/p4 all vote for p2's card
      const votes = { p2: 2, p3: 1, p4: 1 };
      const result = calculateScores(fourPlayers, 0, fourCards, votes);

      // All non-narrators get 2 base (narrator failed)
      expect(result['p1']).toBe(0);
      expect(result['p2']).toBe(2 + 2); // 2 base + 2 bonus (p3 and p4 voted for p2's card)
      expect(result['p3']).toBe(2 + 1); // 2 base + 1 bonus (p2 voted for p3's card)
      expect(result['p4']).toBe(2 + 0); // 2 base + 0 bonus
    });
  });

  describe('with minimum players (3)', () => {
    it('calculates scores correctly', () => {
      const votes = { p2: 0, p3: 1 }; // p2 correct, p3 wrong
      const result = calculateScores(players, 0, tableCards, votes);

      expect(result['p1']).toBe(3); // narrator succeeds (1 of 2 voted correctly)
      expect(result['p2']).toBe(4); // 3 voted correctly + 1 bonus (p3 voted for p2's card orderId=1)
      expect(result['p3']).toBe(0); // voted wrong, no bonus received
    });
  });
});

// ============================================
// checkVictoryCondition
// ============================================

describe('checkVictoryCondition', () => {
  const baseCondition: VictoryCondition = {
    scoreEnabled: true,
    targetScore: 30,
    narratorRoundsEnabled: false,
    narratorRounds: 2,
  };

  it('returns winner ID when score target is reached', () => {
    const players = [
      createPlayer({ id: 'p1', score: 30 }),
      createPlayer({ id: 'p2', score: 10 }),
    ];

    const result = checkVictoryCondition(players, baseCondition, 5);
    expect(result).toBe('p1');
  });

  it('returns null when no one reached score target', () => {
    const players = [
      createPlayer({ id: 'p1', score: 29 }),
      createPlayer({ id: 'p2', score: 10 }),
    ];

    const result = checkVictoryCondition(players, baseCondition, 5);
    expect(result).toBeNull();
  });

  it('returns winner when narrator rounds are completed', () => {
    const condition: VictoryCondition = {
      scoreEnabled: false,
      targetScore: 30,
      narratorRoundsEnabled: true,
      narratorRounds: 2,
    };

    const players = [
      createPlayer({ id: 'p1', score: 15 }),
      createPlayer({ id: 'p2', score: 20 }),
      createPlayer({ id: 'p3', score: 10 }),
    ];

    // 3 players * 2 rounds = 6 total rounds, currentRound = 5 (0-based, so 6th round)
    const result = checkVictoryCondition(players, condition, 5);
    expect(result).toBe('p2'); // highest score wins
  });

  it('returns null when narrator rounds not yet completed', () => {
    const condition: VictoryCondition = {
      scoreEnabled: false,
      targetScore: 30,
      narratorRoundsEnabled: true,
      narratorRounds: 2,
    };

    const players = [
      createPlayer({ id: 'p1', score: 15 }),
      createPlayer({ id: 'p2', score: 20 }),
      createPlayer({ id: 'p3', score: 10 }),
    ];

    // 3 players * 2 rounds = 6, currentRound = 4 (5th round, not done yet)
    const result = checkVictoryCondition(players, condition, 4);
    expect(result).toBeNull();
  });

  it('checks score condition first when both are enabled', () => {
    const condition: VictoryCondition = {
      scoreEnabled: true,
      targetScore: 30,
      narratorRoundsEnabled: true,
      narratorRounds: 2,
    };

    const players = [
      createPlayer({ id: 'p1', score: 30 }),
      createPlayer({ id: 'p2', score: 25 }),
    ];

    // Even if rounds aren't done, score victory triggers
    const result = checkVictoryCondition(players, condition, 0);
    expect(result).toBe('p1');
  });

  it('returns null when both conditions disabled', () => {
    const condition: VictoryCondition = {
      scoreEnabled: false,
      targetScore: 30,
      narratorRoundsEnabled: false,
      narratorRounds: 2,
    };

    const players = [
      createPlayer({ id: 'p1', score: 100 }),
    ];

    const result = checkVictoryCondition(players, condition, 100);
    expect(result).toBeNull();
  });

  it('returns winner who exceeds target score', () => {
    const players = [
      createPlayer({ id: 'p1', score: 35 }),
      createPlayer({ id: 'p2', score: 10 }),
    ];

    const result = checkVictoryCondition(players, baseCondition, 5);
    expect(result).toBe('p1');
  });
});

// ============================================
// getPublicState — security tests
// ============================================

describe('getPublicState', () => {
  const p1 = createPlayer({
    id: 'p1',
    name: 'Narrator',
    hand: [
      { id: 10, imageUrl: '/cards/new/card_0010.avif' },
      { id: 11, imageUrl: '/cards/new/card_0011.avif' },
    ],
  });
  const p2 = createPlayer({
    id: 'p2',
    name: 'Player 2',
    hand: [
      { id: 20, imageUrl: '/cards/new/card_0020.avif' },
      { id: 21, imageUrl: '/cards/new/card_0021.avif' },
    ],
  });
  const p3 = createPlayer({
    id: 'p3',
    name: 'Player 3',
    hand: [
      { id: 30, imageUrl: '/cards/new/card_0030.avif' },
    ],
  });

  const tableCards: TableCard[] = [
    createTableCard('p1', 0, 101),
    createTableCard('p2', 1, 102),
    createTableCard('p3', 2, 103),
  ];

  describe('hand visibility', () => {
    it('shows own hand to the requesting player', () => {
      const state = createServerState({
        players: [p1, p2, p3],
        phase: GamePhase.VOTING,
      });

      const publicState = getPublicState(state, 'p2');
      const myPlayer = publicState.players.find(p => p.id === 'p2')!;
      expect(myPlayer.hand).toEqual(p2.hand);
    });

    it('hides other players hands (masked cards)', () => {
      const state = createServerState({
        players: [p1, p2, p3],
        phase: GamePhase.VOTING,
      });

      const publicState = getPublicState(state, 'p2');
      const otherPlayer = publicState.players.find(p => p.id === 'p1')!;

      // Each card should be masked
      for (const card of otherPlayer.hand) {
        expect(card.id).toBe(-1);
        expect(card.imageUrl).toBe('');
      }
    });

    it('preserves hand length for hidden hands (no information leak)', () => {
      const state = createServerState({
        players: [p1, p2, p3],
        phase: GamePhase.VOTING,
      });

      const publicState = getPublicState(state, 'p2');
      const p1Public = publicState.players.find(p => p.id === 'p1')!;
      const p3Public = publicState.players.find(p => p.id === 'p3')!;

      expect(p1Public.hand).toHaveLength(p1.hand.length);
      expect(p3Public.hand).toHaveLength(p3.hand.length);
    });
  });

  describe('table card ownership', () => {
    it('hides card ownership during VOTING for non-narrator', () => {
      const state = createServerState({
        players: [p1, p2, p3],
        tableCards,
        phase: GamePhase.VOTING,
        narratorIndex: 0,
      });

      const publicState = getPublicState(state, 'p2');

      for (const tc of publicState.tableCards) {
        if (!tc.isMine) {
          expect(tc.playerId).toBe('');
        }
      }
    });

    it('narrator can see card ownership during VOTING', () => {
      const state = createServerState({
        players: [p1, p2, p3],
        tableCards,
        phase: GamePhase.VOTING,
        narratorIndex: 0,
      });

      const publicState = getPublicState(state, 'p1'); // narrator

      for (const tc of publicState.tableCards) {
        expect(tc.playerId).not.toBe('');
      }
    });

    it('reveals card ownership during RESULTS', () => {
      const state = createServerState({
        players: [p1, p2, p3],
        tableCards,
        phase: GamePhase.RESULTS,
        narratorIndex: 0,
      });

      const publicState = getPublicState(state, 'p2');

      for (const tc of publicState.tableCards) {
        expect(tc.playerId).not.toBe('');
      }
    });

    it('reveals card ownership during GAME_OVER', () => {
      const state = createServerState({
        players: [p1, p2, p3],
        tableCards,
        phase: GamePhase.GAME_OVER,
        narratorIndex: 0,
      });

      const publicState = getPublicState(state, 'p2');

      for (const tc of publicState.tableCards) {
        expect(tc.playerId).not.toBe('');
      }
    });

    it('marks isMine correctly for the requesting player', () => {
      const state = createServerState({
        players: [p1, p2, p3],
        tableCards,
        phase: GamePhase.VOTING,
        narratorIndex: 0,
      });

      const publicState = getPublicState(state, 'p2');

      const myCard = publicState.tableCards.find(tc => tc.card.id === 102);
      const otherCard = publicState.tableCards.find(tc => tc.card.id === 101);

      expect(myCard?.isMine).toBe(true);
      expect(otherCard?.isMine).toBe(false);
    });
  });

  describe('vote visibility', () => {
    it('hides all votes during VOTING except own', () => {
      const state = createServerState({
        players: [p1, p2, p3],
        tableCards,
        votes: { p2: 0, p3: 1 },
        phase: GamePhase.VOTING,
        narratorIndex: 0,
      });

      const publicState = getPublicState(state, 'p2');

      expect(publicState.votes).toEqual({ p2: 0 }); // only own vote visible
    });

    it('shows no votes if player has not voted yet', () => {
      const state = createServerState({
        players: [p1, p2, p3],
        tableCards,
        votes: { p3: 1 },
        phase: GamePhase.VOTING,
        narratorIndex: 0,
      });

      const publicState = getPublicState(state, 'p2');

      expect(publicState.votes).toEqual({});
    });

    it('shows all votes during RESULTS', () => {
      const state = createServerState({
        players: [p1, p2, p3],
        tableCards,
        votes: { p2: 0, p3: 1 },
        phase: GamePhase.RESULTS,
        narratorIndex: 0,
      });

      const publicState = getPublicState(state, 'p2');

      expect(publicState.votes).toEqual({ p2: 0, p3: 1 });
    });
  });

  describe('playersWhoPlayed', () => {
    it('lists player IDs who placed cards', () => {
      const state = createServerState({
        players: [p1, p2, p3],
        tableCards,
        phase: GamePhase.VOTING,
      });

      const publicState = getPublicState(state, 'p2');

      expect(publicState.playersWhoPlayed).toEqual(['p1', 'p2', 'p3']);
    });
  });

  describe('deckCount', () => {
    it('exposes deck size instead of full deck', () => {
      const deck = [
        { id: 50, imageUrl: '/cards/new/card_0050.avif' },
        { id: 51, imageUrl: '/cards/new/card_0051.avif' },
      ];

      const state = createServerState({
        players: [p1, p2],
        deck,
        phase: GamePhase.VOTING,
      });

      const publicState = getPublicState(state, 'p2');

      expect(publicState.deckCount).toBe(2);
      expect((publicState as any).deck).toBeUndefined();
    });
  });

  describe('null player', () => {
    it('works with null forPlayerId (spectator view)', () => {
      const state = createServerState({
        players: [p1, p2],
        tableCards: [createTableCard('p1', 0, 101), createTableCard('p2', 1, 102)],
        phase: GamePhase.VOTING,
        narratorIndex: 0,
      });

      const publicState = getPublicState(state, null);

      // All hands should be hidden
      for (const player of publicState.players) {
        for (const card of player.hand) {
          expect(card.id).toBe(-1);
        }
      }

      // No votes visible
      expect(publicState.votes).toEqual({});

      // No isMine flags
      for (const tc of publicState.tableCards) {
        expect(tc.isMine).toBe(false);
      }
    });
  });
});
