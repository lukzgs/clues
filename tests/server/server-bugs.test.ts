/**
 * Bug tests for GameServer integration (server.ts).
 *
 * These tests require instantiating the full GameServer with mock
 * Room/Connection objects to reproduce bugs in stateful handler methods
 * that can't be tested through pure functions alone.
 *
 * Covers: handleKickPlayer (narrator index corruption), getAfkPlayers
 * (broken AFK detection during RESULTS phase).
 */

import GameServer from '../../party/server';
import {
  createMockRoom,
  createMockConnection,
  simulateJoinRoom,
  getLastSyncState,
} from '../helpers/test-helpers';

// ============================================
// HELPERS
// ============================================

/** Start a game with the given connections and return the last sync state */
async function startGame(server: any, hostConn: any) {
  await server.onMessage(JSON.stringify({
    type: 'START_GAME',
    victoryCondition: {
      scoreEnabled: true,
      targetScore: 30,
      narratorRoundsEnabled: false,
      narratorRounds: 2,
    },
    deckOption: 'mixed',
    phaseTimeouts: { narrator: 60, othersChoosing: 45, voting: 30, results: 15 },
    timerEnabled: true,
  }), hostConn);
}

/** Play a full round: narrator submits clue, others play cards, everyone votes, all ready up */
async function playFullRound(
  server: any,
  connections: any[],
  playerIds: string[],
  narratorIndex: number,
) {
  const narratorConn = connections[narratorIndex];
  const narratorId = playerIds[narratorIndex];

  // Narrator submits clue
  let state = getLastSyncState(narratorConn);
  const narratorHand = state.gameState.players.find((p: any) => p.id === narratorId)?.hand;
  await server.onMessage(JSON.stringify({
    type: 'SUBMIT_CLUE',
    cardId: narratorHand[0].id,
    clue: `Clue from round`,
  }), narratorConn);

  // Others play cards
  for (let i = 0; i < connections.length; i++) {
    if (i === narratorIndex) continue;
    state = getLastSyncState(connections[i]);
    const hand = state.gameState.players.find((p: any) => p.id === playerIds[i])?.hand;
    await server.onMessage(JSON.stringify({
      type: 'PLAY_CARD',
      cardId: hand[0].id,
    }), connections[i]);
  }

  // Everyone votes (non-narrator)
  for (let i = 0; i < connections.length; i++) {
    if (i === narratorIndex) continue;
    state = getLastSyncState(connections[i]);
    const votable = state.gameState.tableCards.find((tc: any) => !tc.isMine);
    await server.onMessage(JSON.stringify({
      type: 'VOTE',
      orderId: votable.orderId,
    }), connections[i]);
  }
}

/** All players ready up to advance to next round */
async function readyAll(server: any, connections: any[]) {
  for (const conn of connections) {
    await server.onMessage(JSON.stringify({ type: 'NEXT_ROUND' }), conn);
  }
}

// ============================================
// BUG #6 — handleKickPlayer corrupts narratorIndex
// when the kicked player is before the narrator.
//
// After .filter() removes a player, all subsequent array
// indices shift down by 1. The code only adjusts narratorIndex
// when it exceeds array bounds, not when it becomes stale
// due to a prior-index removal.
// ============================================

describe('BUG #6 — Kicking player before narrator corrupts narratorIndex', () => {
  it('narrator should remain the same player after kicking someone before them', async () => {
    const room = createMockRoom('KICK-TEST');
    const server = new GameServer(room as any);

    // Join 4 players
    const conn1 = await simulateJoinRoom(server, room, 'Host');
    const conn2 = await simulateJoinRoom(server, room, 'Player2');
    const conn3 = await simulateJoinRoom(server, room, 'Player3');
    const conn4 = await simulateJoinRoom(server, room, 'Player4');

    const connections = [conn1, conn2, conn3, conn4];
    const playerIds = connections.map(c => getLastSyncState(c).yourPlayerId);

    // Start game — narrator = index 0 (Host)
    await startGame(server, conn1);

    // Round 1: narrator = Host (idx 0) → advance to narrator = P2 (idx 1)
    await playFullRound(server, connections, playerIds, 0);
    await readyAll(server, connections);

    // Round 2: narrator = P2 (idx 1) → advance to narrator = P3 (idx 2)
    await playFullRound(server, connections, playerIds, 1);
    await readyAll(server, connections);

    // Now narrator = P3 (index 2)
    let state = getLastSyncState(conn1);
    expect(state.gameState.phase).toBe('NARRATOR_CHOOSING');
    const narratorBeforeKick = state.gameState.players[state.gameState.narratorIndex];
    expect(narratorBeforeKick.id).toBe(playerIds[2]); // P3 is narrator

    // Host kicks P2 (index 1) — BEFORE the narrator (index 2)
    // After removal: [Host(0), P3(1), P4(2)]
    // narratorIndex stays 2 → now points to P4, not P3!
    server.onMessage(JSON.stringify({
      type: 'KICK_PLAYER',
      targetPlayerId: playerIds[1],
    }), conn1);

    state = getLastSyncState(conn1);
    const narratorAfterKick = state.gameState.players[state.gameState.narratorIndex];

    // P3 should still be narrator — they did nothing wrong
    expect(narratorAfterKick.id).toBe(playerIds[2]);
  });
});

// ============================================
// BUG #7 — getAfkPlayers during RESULTS only
// returns the host as potentially AFK, but ALL
// active players must ready up. Non-host AFK
// players can never be vote-kicked.
// ============================================

describe('BUG #7 — Non-host AFK players unkickable during RESULTS (DISABLED)', () => {
  it('should NOT kick AFK player since AFK kicking system is disabled', async () => {
    const room = createMockRoom('AFK-TEST');
    const server = new GameServer(room as any);

    // Join 4 players
    const conn1 = await simulateJoinRoom(server, room, 'Host');
    const conn2 = await simulateJoinRoom(server, room, 'Player2');
    const conn3 = await simulateJoinRoom(server, room, 'Player3');
    const conn4 = await simulateJoinRoom(server, room, 'Player4');

    const connections = [conn1, conn2, conn3, conn4];
    const playerIds = connections.map(c => getLastSyncState(c).yourPlayerId);

    // Start game and play 1 full round
    await startGame(server, conn1);
    await playFullRound(server, connections, playerIds, 0);

    // Should be in RESULTS
    let state = getLastSyncState(conn1);
    expect(state.gameState.phase).toBe('RESULTS');

    // Host, P2, P3 ready up — P4 is AFK
    await server.onMessage(JSON.stringify({ type: 'NEXT_ROUND' }), conn1);
    await server.onMessage(JSON.stringify({ type: 'NEXT_ROUND' }), conn2);
    await server.onMessage(JSON.stringify({ type: 'NEXT_ROUND' }), conn3);

    // Still in RESULTS (waiting for P4)
    state = getLastSyncState(conn1);
    expect(state.gameState.phase).toBe('RESULTS');

    // Vote to kick AFK — majority = floor(4/2) + 1 = 3
    await server.onMessage(JSON.stringify({ type: 'VOTE_KICK_AFK' }), conn1);
    await server.onMessage(JSON.stringify({ type: 'VOTE_KICK_AFK' }), conn2);
    await server.onMessage(JSON.stringify({ type: 'VOTE_KICK_AFK' }), conn3);

    // P4 should NOT be made spectator because AFK kicking is disabled
    state = getLastSyncState(conn1);
    const p4State = state.gameState.players.find((p: any) => p.id === playerIds[3]);

    expect(p4State?.isSpectator).toBe(false);
  });
});

// ============================================
// BUG #9 — Kicking players mid-game to below
// MIN_PLAYERS should end the game gracefully
// instead of leaving it in a broken state.
// ============================================

describe('BUG #9 — Kicking players below MIN_PLAYERS ends the game', () => {
  it('game goes to GAME_OVER when active players drop below minimum', async () => {
    const room = createMockRoom('KICK-MIN');
    const server = new GameServer(room as any);

    const conn1 = await simulateJoinRoom(server, room, 'Host');
    const conn2 = await simulateJoinRoom(server, room, 'P2');
    const conn3 = await simulateJoinRoom(server, room, 'P3');

    const playerIds = [conn1, conn2, conn3].map(c => getLastSyncState(c).yourPlayerId);

    await startGame(server, conn1);

    // Host kicks P2
    await server.onMessage(JSON.stringify({ type: 'KICK_PLAYER', targetPlayerId: playerIds[1] }), conn1);

    // Host kicks P3 — only 1 active player remains
    await server.onMessage(JSON.stringify({ type: 'KICK_PLAYER', targetPlayerId: playerIds[2] }), conn1);

    const state = getLastSyncState(conn1);
    expect(state.gameState.phase).toBe('GAME_OVER');
  });
});

// ============================================
// BUG #10 — handleRestartGame resets state cleanly.
// playersWhoReadied and currentRound must be zeroed.
// ============================================

describe('BUG #10 — Restart game resets state properly', () => {
  it('playersWhoReadied and currentRound are reset after restart', async () => {
    const room = createMockRoom('RESTART');
    const server = new GameServer(room as any);

    const conn1 = await simulateJoinRoom(server, room, 'Host');
    const conn2 = await simulateJoinRoom(server, room, 'P2');
    const conn3 = await simulateJoinRoom(server, room, 'P3');

    const playerIds = [conn1, conn2, conn3].map(c => getLastSyncState(c).yourPlayerId);

    await startGame(server, conn1);
    await playFullRound(server, [conn1, conn2, conn3], playerIds, 0);
    await readyAll(server, [conn1, conn2, conn3]);

    // Force game over and restart
    (server as any).state.phase = 'GAME_OVER';
    (server as any).state.winner = playerIds[0];

    await server.onMessage(JSON.stringify({ type: 'RESTART_GAME' }), conn1);

    const state = getLastSyncState(conn1);
    expect(state.gameState.phase).toBe('LOBBY');
    expect(state.gameState.playersWhoReadied).toEqual([]);
    expect(state.gameState.currentRound).toBe(0);
  });
});

// ============================================
// Connectivity Fix — Lobby reconnection preserves
// player ID and host status instead of creating
// a new player.
// ============================================

describe('Connectivity — Lobby reconnection preserves session', () => {
  it('player reconnects in lobby and keeps their ID and host status', async () => {
    const room = createMockRoom('RECONN-1');
    const server = new GameServer(room as any);

    const conn1 = await simulateJoinRoom(server, room, 'Host');
    await simulateJoinRoom(server, room, 'Player2');

    const hostId = getLastSyncState(conn1).yourPlayerId;

    // Simulate host disconnect
    room.connections.delete(conn1.id);
    server.onClose(conn1);

    // Player should still be in state, just marked disconnected
    let state = getLastSyncState(conn1);
    // Verify via a second player's state
    const conn2Msgs = room.connections.values().next();

    // Reconnect with new connection but same reconnectId and valid secret
    const conn1b = await simulateJoinRoom(server, room, 'Host', undefined, hostId);
    state = getLastSyncState(conn1b);

    // Should have same player ID and still be host
    expect(state.yourPlayerId).toBe(hostId);
    const hostPlayer = state.gameState.players.find((p: any) => p.id === hostId);
    expect(hostPlayer).toBeDefined();
    expect(hostPlayer.isHost).toBe(true);
    expect(hostPlayer.isConnected).toBe(true);
  });

  it('rejects reconnection attempt if reconnectSecret does not match', async () => {
    const room = createMockRoom('RECONNECT-SEC');
    const server = new GameServer(room as any);

    const conn1 = await simulateJoinRoom(server, room, 'Alice');
    const sync1 = getLastSyncState(conn1);
    const aliceId = sync1.yourPlayerId;

    // Disconnect Alice
    room.connections.delete(conn1.id);
    server.onClose(conn1);

    // Attacker tries to reconnect with Alice's ID but wrong secret
    const attackerConn = createMockConnection();
    room.connections.set(attackerConn.id, attackerConn);
    await server.onConnect(attackerConn);

    await server.onMessage(JSON.stringify({
      type: 'JOIN_ROOM',
      playerName: 'Attacker',
      reconnectId: aliceId,
      reconnectSecret: 'wrong-secret-token',
    }), attackerConn);

    // Reconnect attempt should be rejected (recorded as failed reconnect in telemetry)
    const snapshot = server.telemetry.getSnapshot(room.id, {
      phase: server.state.phase,
      activeConnectionsCount: server.connections.size,
      totalPlayersCount: server.state.players.length,
      humanPlayersCount: 1,
      botPlayersCount: 0,
      spectatorsCount: 0,
    });

    expect(snapshot.counters.reconnectsFailedInvalidId).toBe(1);
  });
});

// ============================================
// Connectivity Fix — Host timeout migration in
// lobby after 10s. Uses fake timers.
// ============================================

describe('Connectivity — Host timeout migration in lobby', () => {
  it('host role transfers to another player after 10s disconnect', async () => {
    vi.useFakeTimers();

    const room = createMockRoom('TIMEOUT-1');
    const server = new GameServer(room as any);

    const conn1 = await simulateJoinRoom(server, room, 'Host');
    const conn2 = await simulateJoinRoom(server, room, 'Player2');

    const hostId = getLastSyncState(conn1).yourPlayerId;
    const p2Id = getLastSyncState(conn2).yourPlayerId;

    // Simulate host disconnect
    room.connections.delete(conn1.id);
    server.onClose(conn1);

    // Before timeout, host should still have isHost
    let state = getLastSyncState(conn2);
    let hostPlayer = state.gameState.players.find((p: any) => p.id === hostId);
    expect(hostPlayer.isHost).toBe(true);

    // Advance past timeout
    vi.advanceTimersByTime(11000);

    // Now P2 should be host
    state = getLastSyncState(conn2);
    hostPlayer = state.gameState.players.find((p: any) => p.id === hostId);
    const p2Player = state.gameState.players.find((p: any) => p.id === p2Id);
    expect(hostPlayer.isHost).toBe(false);
    expect(p2Player.isHost).toBe(true);

    vi.useRealTimers();
  });
});

// ============================================
// Connectivity Fix — Disconnected players are
// cleaned up when game starts.
// ============================================

describe('Connectivity — Disconnected players cleaned on game start', () => {
  it('removes offline players when host starts the game', async () => {
    const room = createMockRoom('CLEAN-1');
    const server = new GameServer(room as any);

    const conn1 = await simulateJoinRoom(server, room, 'Host');
    const conn2 = await simulateJoinRoom(server, room, 'Player2');
    const conn3 = await simulateJoinRoom(server, room, 'Player3');
    await simulateJoinRoom(server, room, 'Player4');

    // Disconnect Player4
    const conn4 = [...room.connections.values()].pop()!;
    const p4Id = getLastSyncState(conn4).yourPlayerId;
    room.connections.delete(conn4.id);
    server.onClose(conn4);

    // Start game
    await server.onMessage(JSON.stringify({
      type: 'START_GAME',
      victoryCondition: { scoreEnabled: true, targetScore: 30, narratorRoundsEnabled: false, narratorRounds: 2 },
      deckOption: 'mixed',
      phaseTimeouts: { narrator: 60, othersChoosing: 45, voting: 30, results: 15 },
      timerEnabled: true,
    }), conn1);

    const state = getLastSyncState(conn1);
    expect(state.gameState.phase).toBe('NARRATOR_CHOOSING');
    // Player4 should be removed
    const p4 = state.gameState.players.find((p: any) => p.id === p4Id);
    expect(p4).toBeUndefined();
    // 3 players remain
    expect(state.gameState.players.length).toBe(3);
  });
});

// ============================================
// Connectivity Fix — Host disconnecting mid-game
// transfers isHost to another active player.
// ============================================

describe('Connectivity — Mid-game host reassignment', () => {
  it('reassigns host when host disconnects during game', async () => {
    const room = createMockRoom('MIDHOST-1');
    const server = new GameServer(room as any);

    const conn1 = await simulateJoinRoom(server, room, 'Host');
    const conn2 = await simulateJoinRoom(server, room, 'Player2');
    const conn3 = await simulateJoinRoom(server, room, 'Player3');

    const hostId = getLastSyncState(conn1).yourPlayerId;
    const p2Id = getLastSyncState(conn2).yourPlayerId;

    // Start game
    await server.onMessage(JSON.stringify({
      type: 'START_GAME',
      victoryCondition: { scoreEnabled: true, targetScore: 30, narratorRoundsEnabled: false, narratorRounds: 2 },
      deckOption: 'mixed',
      phaseTimeouts: { narrator: 60, othersChoosing: 45, voting: 30, results: 15 },
      timerEnabled: true,
    }), conn1);

    // Disconnect host mid-game
    room.connections.delete(conn1.id);
    server.onClose(conn1);

    // P2 should now be host
    const state = getLastSyncState(conn2);
    const oldHost = state.gameState.players.find((p: any) => p.id === hostId);
    const newHost = state.gameState.players.find((p: any) => p.id === p2Id);
    expect(oldHost.isHost).toBe(false);
    expect(newHost.isHost).toBe(true);
  });
});
