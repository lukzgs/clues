import { describe, it, expect, beforeEach } from 'vitest';
import GameServer from '../../party/server';
import { GamePhase, ClientMessageType } from '../../src/types';
import {
  createMockRoom,
  simulateJoinRoom,
  getLastSyncState,
} from '../helpers/test-helpers';

describe('Spectator logic', () => {
  let server: any;
  let mockRoom: any;
  let broadcastMock: any;

  beforeEach(() => {
    broadcastMock = vi.fn();
    mockRoom = {
      id: 'ROOM12',
      broadcast: broadcastMock,
      getConnections: () => [],
      getConnection: () => null,
    };
    server = new GameServer(mockRoom);
  });

  it('allows a non-host player to toggle their own spectator status', () => {
    // Join Host
    server.onMessage(JSON.stringify({ type: 'JOIN_ROOM', playerName: 'Host' }), { id: 'conn1' });
    
    // Join Player 2
    server.onMessage(JSON.stringify({ type: 'JOIN_ROOM', playerName: 'P2' }), { id: 'conn2' });
    
    const p2Id = server.connections.get('conn2');
    const p2 = server.state.players.find((p: any) => p.id === p2Id);
    
    expect(p2.isHost).toBe(false);
    expect(p2.isSpectator).toBeFalsy(); // undefined or false

    // Player 2 toggles themselves
    server.onMessage(JSON.stringify({ type: 'TOGGLE_SPECTATOR', targetPlayerId: p2Id }), { id: 'conn2' });
    
    expect(p2.isSpectator).toBe(true);

    // Player 2 toggles back
    server.onMessage(JSON.stringify({ type: 'TOGGLE_SPECTATOR', targetPlayerId: p2Id }), { id: 'conn2' });
    
    expect(p2.isSpectator).toBe(false);
  });
});

// ============================================
// Spectator cannot play cards mid-round
// ============================================

describe('Spectator cannot play cards', () => {
  it('blocks spectator from placing a card during OTHERS_CHOOSING', () => {
    const room = createMockRoom('SPEC-PLAY');
    const server = new GameServer(room as any);

    const conn1 = simulateJoinRoom(server, room, 'Host');
    const conn2 = simulateJoinRoom(server, room, 'P2');
    const conn3 = simulateJoinRoom(server, room, 'P3');

    const p1Id = getLastSyncState(conn1).yourPlayerId;
    const p2Id = getLastSyncState(conn2).yourPlayerId;

    // Start game
    server.onMessage(JSON.stringify({
      type: 'START_GAME',
      victoryCondition: { scoreEnabled: true, targetScore: 30, narratorRoundsEnabled: false, narratorRounds: 2 },
      deckOption: 'mixed',
      phaseTimeouts: { narrator: 60, othersChoosing: 45, voting: 30, results: 15 },
    }), conn1);

    // Narrator submits clue
    let state = getLastSyncState(conn1);
    const narratorHand = state.gameState.players.find((p: any) => p.id === p1Id)?.hand;
    server.onMessage(JSON.stringify({ type: 'SUBMIT_CLUE', cardId: narratorHand[0].id, clue: 'test' }), conn1);

    // Mark P2 as spectator mid-round (simulating AFK kick)
    const p2Internal = (server as any).state.players.find((p: any) => p.id === p2Id);
    p2Internal.isSpectator = true;

    // P2 (now spectator) tries to play a card
    state = getLastSyncState(conn2);
    const p2Hand = state.gameState.players.find((p: any) => p.id === p2Id)?.hand;
    const tableCardsBefore = (server as any).state.tableCards.length;

    server.onMessage(JSON.stringify({ type: 'PLAY_CARD', cardId: p2Hand[0].id }), conn2);

    const tableCardsAfter = (server as any).state.tableCards.length;
    expect(tableCardsAfter).toBe(tableCardsBefore);
  });
});

// ============================================
// Host self-toggle to spectator
// ============================================

describe('Host spectator self-toggle', () => {
  it('host can toggle themselves to spectator while retaining host status', () => {
    const room = createMockRoom('TOGGLE-SELF');
    const server = new GameServer(room as any);

    const conn1 = simulateJoinRoom(server, room, 'Host');
    simulateJoinRoom(server, room, 'P2');
    simulateJoinRoom(server, room, 'P3');

    const p1Id = getLastSyncState(conn1).yourPlayerId;

    // Host toggles themselves to spectator
    server.onMessage(JSON.stringify({ type: 'TOGGLE_SPECTATOR', targetPlayerId: p1Id }), conn1);

    const state = getLastSyncState(conn1);
    const host = state.gameState.players.find((p: any) => p.id === p1Id);

    expect(host.isSpectator).toBe(true);
    expect(host.isHost).toBe(true);
  });
});
