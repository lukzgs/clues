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
  simulateJoinRoom,
  getLastSyncState,
} from '../helpers/test-helpers';

// ============================================
// HELPERS
// ============================================

/** Start a game with the given connections and return the last sync state */
function startGame(server: any, hostConn: any) {
  server.onMessage(JSON.stringify({
    type: 'START_GAME',
    victoryCondition: {
      scoreEnabled: true,
      targetScore: 30,
      narratorRoundsEnabled: false,
      narratorRounds: 2,
    },
    deckOption: 'mixed',
    phaseTimeouts: { narrator: 60, othersChoosing: 45, voting: 30, results: 15 },
  }), hostConn);
}

/** Play a full round: narrator submits clue, others play cards, everyone votes, all ready up */
function playFullRound(
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
  server.onMessage(JSON.stringify({
    type: 'SUBMIT_CLUE',
    cardId: narratorHand[0].id,
    clue: `Clue from round`,
  }), narratorConn);

  // Others play cards
  for (let i = 0; i < connections.length; i++) {
    if (i === narratorIndex) continue;
    state = getLastSyncState(connections[i]);
    const hand = state.gameState.players.find((p: any) => p.id === playerIds[i])?.hand;
    server.onMessage(JSON.stringify({
      type: 'PLAY_CARD',
      cardId: hand[0].id,
    }), connections[i]);
  }

  // Everyone votes (non-narrator)
  for (let i = 0; i < connections.length; i++) {
    if (i === narratorIndex) continue;
    state = getLastSyncState(connections[i]);
    const votable = state.gameState.tableCards.find((tc: any) => !tc.isMine);
    server.onMessage(JSON.stringify({
      type: 'VOTE',
      orderId: votable.orderId,
    }), connections[i]);
  }
}

/** All players ready up to advance to next round */
function readyAll(server: any, connections: any[]) {
  for (const conn of connections) {
    server.onMessage(JSON.stringify({ type: 'NEXT_ROUND' }), conn);
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
  it('narrator should remain the same player after kicking someone before them', () => {
    const room = createMockRoom('KICK-TEST');
    const server = new GameServer(room as any);

    // Join 4 players
    const conn1 = simulateJoinRoom(server, room, 'Host');
    const conn2 = simulateJoinRoom(server, room, 'Player2');
    const conn3 = simulateJoinRoom(server, room, 'Player3');
    const conn4 = simulateJoinRoom(server, room, 'Player4');

    const connections = [conn1, conn2, conn3, conn4];
    const playerIds = connections.map(c => getLastSyncState(c).yourPlayerId);

    // Start game — narrator = index 0 (Host)
    startGame(server, conn1);

    // Round 1: narrator = Host (idx 0) → advance to narrator = P2 (idx 1)
    playFullRound(server, connections, playerIds, 0);
    readyAll(server, connections);

    // Round 2: narrator = P2 (idx 1) → advance to narrator = P3 (idx 2)
    playFullRound(server, connections, playerIds, 1);
    readyAll(server, connections);

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

describe('BUG #7 — Non-host AFK players unkickable during RESULTS', () => {
  it('should identify non-host AFK player and kick them via vote', () => {
    const room = createMockRoom('AFK-TEST');
    const server = new GameServer(room as any);

    // Join 4 players
    const conn1 = simulateJoinRoom(server, room, 'Host');
    const conn2 = simulateJoinRoom(server, room, 'Player2');
    const conn3 = simulateJoinRoom(server, room, 'Player3');
    const conn4 = simulateJoinRoom(server, room, 'Player4');

    const connections = [conn1, conn2, conn3, conn4];
    const playerIds = connections.map(c => getLastSyncState(c).yourPlayerId);

    // Start game and play 1 full round
    startGame(server, conn1);
    playFullRound(server, connections, playerIds, 0);

    // Should be in RESULTS
    let state = getLastSyncState(conn1);
    expect(state.gameState.phase).toBe('RESULTS');

    // Host, P2, P3 ready up — P4 is AFK
    server.onMessage(JSON.stringify({ type: 'NEXT_ROUND' }), conn1);
    server.onMessage(JSON.stringify({ type: 'NEXT_ROUND' }), conn2);
    server.onMessage(JSON.stringify({ type: 'NEXT_ROUND' }), conn3);

    // Still in RESULTS (waiting for P4)
    state = getLastSyncState(conn1);
    expect(state.gameState.phase).toBe('RESULTS');

    // Vote to kick AFK — majority = floor(4/2) + 1 = 3
    server.onMessage(JSON.stringify({ type: 'VOTE_KICK_AFK' }), conn1);
    server.onMessage(JSON.stringify({ type: 'VOTE_KICK_AFK' }), conn2);
    server.onMessage(JSON.stringify({ type: 'VOTE_KICK_AFK' }), conn3);

    // P4 should be identified as AFK and made spectator
    state = getLastSyncState(conn1);
    const p4State = state.gameState.players.find((p: any) => p.id === playerIds[3]);

    expect(p4State?.isSpectator).toBe(true);
  });
});
