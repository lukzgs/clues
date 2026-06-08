/**
 * Unit tests for Zod message validation schemas.
 *
 * Tests cover input validation, XSS prevention, boundary values,
 * and discriminated union routing.
 */

import {
  JoinRoomSchema,
  LeaveRoomSchema,
  StartGameSchema,
  SubmitClueSchema,
  PlayCardSchema,
  VoteSchema,
  NextRoundSchema,
  RestartGameSchema,
  AddBotSchema,
  RemoveBotSchema,
  ClientMessageSchema,
  VictoryConditionSchema,
} from '../../src/schemas/messages';

// ============================================
// JoinRoomSchema
// ============================================

describe('JoinRoomSchema', () => {
  it('accepts a valid join message', () => {
    const result = JoinRoomSchema.safeParse({
      type: 'JOIN_ROOM',
      playerName: 'Alice',
    });
    expect(result.success).toBe(true);
  });

  it('accepts join with reconnectId', () => {
    const result = JoinRoomSchema.safeParse({
      type: 'JOIN_ROOM',
      playerName: 'Alice',
      reconnectId: 'p-123456-abc',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty player name', () => {
    const result = JoinRoomSchema.safeParse({
      type: 'JOIN_ROOM',
      playerName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects player name longer than 20 characters', () => {
    const result = JoinRoomSchema.safeParse({
      type: 'JOIN_ROOM',
      playerName: 'A'.repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it('accepts player name at exactly 20 characters', () => {
    const result = JoinRoomSchema.safeParse({
      type: 'JOIN_ROOM',
      playerName: 'A'.repeat(20),
    });
    expect(result.success).toBe(true);
  });

  it('rejects HTML characters in player name (XSS prevention)', () => {
    const malicious = ['<script>alert(1)</script>', '<img src=x>', 'Alice<>Bob'];
    for (const name of malicious) {
      const result = JoinRoomSchema.safeParse({
        type: 'JOIN_ROOM',
        playerName: name,
      });
      expect(result.success).toBe(false);
    }
  });

  it('trims whitespace from player name', () => {
    const result = JoinRoomSchema.safeParse({
      type: 'JOIN_ROOM',
      playerName: '  Alice  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.playerName).toBe('Alice');
    }
  });
});

// ============================================
// SubmitClueSchema
// ============================================

describe('SubmitClueSchema', () => {
  it('accepts a valid clue', () => {
    const result = SubmitClueSchema.safeParse({
      type: 'SUBMIT_CLUE',
      cardId: 42,
      clue: 'Mysterious journey',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty clue', () => {
    const result = SubmitClueSchema.safeParse({
      type: 'SUBMIT_CLUE',
      cardId: 1,
      clue: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects clue longer than 100 characters', () => {
    const result = SubmitClueSchema.safeParse({
      type: 'SUBMIT_CLUE',
      cardId: 1,
      clue: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('accepts clue at exactly 100 characters', () => {
    const result = SubmitClueSchema.safeParse({
      type: 'SUBMIT_CLUE',
      cardId: 1,
      clue: 'A'.repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it('rejects HTML in clue (XSS prevention)', () => {
    const result = SubmitClueSchema.safeParse({
      type: 'SUBMIT_CLUE',
      cardId: 1,
      clue: '<script>alert("xss")</script>',
    });
    expect(result.success).toBe(false);
  });

  it('rejects cardId <= 0', () => {
    const result = SubmitClueSchema.safeParse({
      type: 'SUBMIT_CLUE',
      cardId: 0,
      clue: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative cardId', () => {
    const result = SubmitClueSchema.safeParse({
      type: 'SUBMIT_CLUE',
      cardId: -5,
      clue: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer cardId', () => {
    const result = SubmitClueSchema.safeParse({
      type: 'SUBMIT_CLUE',
      cardId: 1.5,
      clue: 'test',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// PlayCardSchema
// ============================================

describe('PlayCardSchema', () => {
  it('accepts a valid card play', () => {
    const result = PlayCardSchema.safeParse({
      type: 'PLAY_CARD',
      cardId: 10,
    });
    expect(result.success).toBe(true);
  });

  it('rejects cardId <= 0', () => {
    const result = PlayCardSchema.safeParse({
      type: 'PLAY_CARD',
      cardId: 0,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// VoteSchema
// ============================================

describe('VoteSchema', () => {
  it('accepts orderId >= 0', () => {
    const result = VoteSchema.safeParse({
      type: 'VOTE',
      orderId: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts positive orderId', () => {
    const result = VoteSchema.safeParse({
      type: 'VOTE',
      orderId: 5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative orderId', () => {
    const result = VoteSchema.safeParse({
      type: 'VOTE',
      orderId: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer orderId', () => {
    const result = VoteSchema.safeParse({
      type: 'VOTE',
      orderId: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// VictoryConditionSchema
// ============================================

describe('VictoryConditionSchema', () => {
  it('accepts valid victory conditions', () => {
    const result = VictoryConditionSchema.safeParse({
      scoreEnabled: true,
      targetScore: 30,
      narratorRoundsEnabled: false,
      narratorRounds: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects targetScore below 10', () => {
    const result = VictoryConditionSchema.safeParse({
      scoreEnabled: true,
      targetScore: 9,
      narratorRoundsEnabled: false,
      narratorRounds: 2,
    });
    expect(result.success).toBe(false);
  });

  it('rejects targetScore above 100', () => {
    const result = VictoryConditionSchema.safeParse({
      scoreEnabled: true,
      targetScore: 101,
      narratorRoundsEnabled: false,
      narratorRounds: 2,
    });
    expect(result.success).toBe(false);
  });

  it('accepts targetScore at boundary values (10 and 100)', () => {
    expect(VictoryConditionSchema.safeParse({
      scoreEnabled: true,
      targetScore: 10,
      narratorRoundsEnabled: false,
      narratorRounds: 1,
    }).success).toBe(true);

    expect(VictoryConditionSchema.safeParse({
      scoreEnabled: true,
      targetScore: 100,
      narratorRoundsEnabled: false,
      narratorRounds: 1,
    }).success).toBe(true);
  });

  it('rejects narratorRounds below 1', () => {
    const result = VictoryConditionSchema.safeParse({
      scoreEnabled: false,
      targetScore: 30,
      narratorRoundsEnabled: true,
      narratorRounds: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects narratorRounds above 5', () => {
    const result = VictoryConditionSchema.safeParse({
      scoreEnabled: false,
      targetScore: 30,
      narratorRoundsEnabled: true,
      narratorRounds: 6,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// RemoveBotSchema
// ============================================

describe('RemoveBotSchema', () => {
  it('accepts valid bot ID with bot- prefix', () => {
    const result = RemoveBotSchema.safeParse({
      type: 'REMOVE_BOT',
      botId: 'bot-123456-abc',
    });
    expect(result.success).toBe(true);
  });

  it('rejects bot ID without bot- prefix', () => {
    const result = RemoveBotSchema.safeParse({
      type: 'REMOVE_BOT',
      botId: 'p-123456-abc',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty bot ID', () => {
    const result = RemoveBotSchema.safeParse({
      type: 'REMOVE_BOT',
      botId: '',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// Simple message schemas (no fields beyond type)
// ============================================

describe('Simple message schemas', () => {
  it('LeaveRoomSchema accepts valid message', () => {
    expect(LeaveRoomSchema.safeParse({ type: 'LEAVE_ROOM' }).success).toBe(true);
  });

  it('NextRoundSchema accepts valid message', () => {
    expect(NextRoundSchema.safeParse({ type: 'NEXT_ROUND' }).success).toBe(true);
  });

  it('RestartGameSchema accepts valid message', () => {
    expect(RestartGameSchema.safeParse({ type: 'RESTART_GAME' }).success).toBe(true);
  });

  it('AddBotSchema accepts valid message', () => {
    expect(AddBotSchema.safeParse({ type: 'ADD_BOT' }).success).toBe(true);
  });
});

// ============================================
// StartGameSchema
// ============================================

describe('StartGameSchema', () => {
  it('accepts valid start game message', () => {
    const result = StartGameSchema.safeParse({
      type: 'START_GAME',
      victoryCondition: {
        scoreEnabled: true,
        targetScore: 30,
        narratorRoundsEnabled: false,
        narratorRounds: 2,
      },
      deckOption: 'mixed',
      phaseTimeouts: {
        narrator: 60,
        othersChoosing: 45,
        voting: 30,
        results: 15,
      },
      timerEnabled: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects start game without victory condition', () => {
    const result = StartGameSchema.safeParse({
      type: 'START_GAME',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// ClientMessageSchema (discriminated union)
// ============================================

describe('ClientMessageSchema', () => {
  it('routes JOIN_ROOM correctly', () => {
    const result = ClientMessageSchema.safeParse({
      type: 'JOIN_ROOM',
      playerName: 'Alice',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('JOIN_ROOM');
    }
  });

  it('routes VOTE correctly', () => {
    const result = ClientMessageSchema.safeParse({
      type: 'VOTE',
      orderId: 3,
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown message type', () => {
    const result = ClientMessageSchema.safeParse({
      type: 'UNKNOWN_ACTION',
    });
    expect(result.success).toBe(false);
  });

  it('rejects message with missing required fields', () => {
    const result = ClientMessageSchema.safeParse({
      type: 'SUBMIT_CLUE',
      // missing cardId and clue
    });
    expect(result.success).toBe(false);
  });

  it('rejects completely invalid input', () => {
    expect(ClientMessageSchema.safeParse(null).success).toBe(false);
    expect(ClientMessageSchema.safeParse(undefined).success).toBe(false);
    expect(ClientMessageSchema.safeParse('string').success).toBe(false);
    expect(ClientMessageSchema.safeParse(42).success).toBe(false);
  });
});
