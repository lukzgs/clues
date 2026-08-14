import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GameServer from '../../party/server';
import { GamePhase } from '../../src/types';
import {
  createMockConnection,
  createMockRoom,
  getLastSyncState,
  simulateJoinRoom,
} from '../helpers/test-helpers';

describe('Server-Side Phase Timeout Auto-Advancement', () => {
  let server: GameServer;
  let mockRoom: ReturnType<typeof createMockRoom>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockRoom = createMockRoom();
    server = new GameServer(mockRoom as any);
  });

  afterEach(() => {
    server.cancelPhaseTimer();
    vi.useRealTimers();
  });

  async function setup3PlayerGame(timerEnabled = true) {
    const conn1 = await simulateJoinRoom(server, mockRoom, 'Alice', 'conn-1');
    const conn2 = await simulateJoinRoom(server, mockRoom, 'Bob', 'conn-2');
    const conn3 = await simulateJoinRoom(server, mockRoom, 'Charlie', 'conn-3');

    const state1 = getLastSyncState(conn1);
    const state2 = getLastSyncState(conn2);
    const state3 = getLastSyncState(conn3);

    await server.onMessage(
      JSON.stringify({
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
        timerEnabled,
      }),
      conn1,
    );

    return {
      connections: [conn1, conn2, conn3],
      playerIds: [
        state1.yourPlayerId,
        state2.yourPlayerId,
        state3.yourPlayerId,
      ],
    };
  }

  it('automatically submits a clue and card when narrator times out in NARRATOR_CHOOSING', async () => {
    await setup3PlayerGame(true);

    expect(server.state.phase).toBe(GamePhase.NARRATOR_CHOOSING);
    expect(server.state.tableCards.length).toBe(0);

    // Fast-forward time by 60 seconds
    vi.advanceTimersByTime(60000);

    // Server should have automatically chosen a card and clue for narrator
    expect(server.state.phase).toBe(GamePhase.OTHERS_CHOOSING);
    expect(server.state.tableCards.length).toBe(1);
    expect(server.state.currentClue.length).toBeGreaterThan(0);
  });

  it('automatically plays random cards for AFK players when OTHERS_CHOOSING times out', async () => {
    const { connections, playerIds } = await setup3PlayerGame(true);

    // Narrator submits manually
    const narratorConn = connections[0];
    const state = getLastSyncState(narratorConn);
    const narratorHand = state.gameState.players.find(
      (p: any) => p.id === playerIds[0],
    )!.hand;

    await server.onMessage(
      JSON.stringify({
        type: 'SUBMIT_CLUE',
        cardId: narratorHand[0].id,
        clue: 'Manual Clue',
      }),
      narratorConn,
    );

    expect(server.state.phase).toBe(GamePhase.OTHERS_CHOOSING);
    expect(server.state.tableCards.length).toBe(1);

    // Only player 2 plays a card manually
    const p2Conn = connections[1];
    const p2State = getLastSyncState(p2Conn);
    const p2Hand = p2State.gameState.players.find(
      (p: any) => p.id === playerIds[1],
    )!.hand;

    await server.onMessage(
      JSON.stringify({
        type: 'PLAY_CARD',
        cardId: p2Hand[0].id,
      }),
      p2Conn,
    );

    expect(server.state.tableCards.length).toBe(2);
    expect(server.state.phase).toBe(GamePhase.OTHERS_CHOOSING);

    // Player 3 is AFK. Fast-forward by 45 seconds
    vi.advanceTimersByTime(45000);

    // Server should have played for player 3 and advanced to VOTING
    expect(server.state.tableCards.length).toBe(3);
    expect(server.state.phase).toBe(GamePhase.VOTING);
  });

  it('automatically casts votes for AFK voters when VOTING times out', async () => {
    const { connections, playerIds } = await setup3PlayerGame(true);

    // Auto-advance narrator phase
    vi.advanceTimersByTime(60000);
    expect(server.state.phase).toBe(GamePhase.OTHERS_CHOOSING);

    // Auto-advance others choosing phase
    vi.advanceTimersByTime(45000);
    expect(server.state.phase).toBe(GamePhase.VOTING);

    // In voting phase: only player 2 votes manually
    const p2Conn = connections[1];
    const validTableCardForP2 = server.state.tableCards.find(
      (tc) => tc.playerId !== playerIds[1],
    )!;

    await server.onMessage(
      JSON.stringify({
        type: 'VOTE',
        orderId: validTableCardForP2.orderId,
      }),
      p2Conn,
    );

    expect(Object.keys(server.state.votes).length).toBe(1);
    expect(server.state.phase).toBe(GamePhase.VOTING);

    // Player 3 is AFK. Fast-forward by 30 seconds
    vi.advanceTimersByTime(30000);

    // All active non-narrator voters should have voted and phase should be RESULTS
    expect(Object.keys(server.state.votes).length).toBe(2);
    expect(server.state.phase).toBe(GamePhase.RESULTS);
  });

  it('automatically advances round when RESULTS phase times out', async () => {
    await setup3PlayerGame(true);

    // Fast-forward through all phases:
    vi.advanceTimersByTime(60000); // NARRATOR_CHOOSING -> OTHERS_CHOOSING
    vi.advanceTimersByTime(45000); // OTHERS_CHOOSING -> VOTING
    vi.advanceTimersByTime(30000); // VOTING -> RESULTS

    expect(server.state.phase).toBe(GamePhase.RESULTS);
    expect(server.state.currentRound).toBe(0);

    // Fast-forward 15s in RESULTS
    vi.advanceTimersByTime(15000);

    // Round should have advanced to round 1 and next narrator
    expect(server.state.phase).toBe(GamePhase.NARRATOR_CHOOSING);
    expect(server.state.currentRound).toBe(1);
  });

  it('does NOT auto-advance when timerEnabled is false', async () => {
    await setup3PlayerGame(false);

    expect(server.state.phase).toBe(GamePhase.NARRATOR_CHOOSING);

    // Fast-forward by 120 seconds
    vi.advanceTimersByTime(120000);

    // Still in NARRATOR_CHOOSING because timer is disabled
    expect(server.state.phase).toBe(GamePhase.NARRATOR_CHOOSING);
    expect(server.state.tableCards.length).toBe(0);
  });
});
