import { describe, it, expect, beforeEach } from 'vitest';
import GameServer from '../../party/server';
import { GamePhase, ClientMessageType } from '../../src/types';

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
