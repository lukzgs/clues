
import { describe, it, expect, vi } from 'vitest';
import GameServer from '../../party/server';
import { ClientMessageType, GamePhase } from '../../src/types';

// Mocks para o PartyKit
const mockRoom = {
  id: 'test-room',
  broadcast: vi.fn(),
  getConnection: vi.fn(),
  getConnections: vi.fn().mockReturnValue([]),
  storage: {
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    setAlarm: vi.fn().mockResolvedValue(undefined),
    deleteAll: vi.fn().mockResolvedValue(undefined),
  },
};

describe('Scaling Test - 10 Players', () => {
  it('should allow starting a game with 10 players in mixed deck mode', async () => {
    const server = new GameServer(mockRoom as any);
    
    // Add 10 players
    for (let i = 0; i < 10; i++) {
      const conn = { id: `conn-${i}`, send: vi.fn() };
      await server.onMessage(JSON.stringify({
        type: ClientMessageType.JOIN_ROOM,
        playerName: `Player ${i}`,
      }), conn as any);
    }
    
    // Verify 10 players joined
    expect(server['state'].players.length).toBe(10);
    
    // Host (first player) tries to start game in mixed mode
    const hostConn = { id: 'conn-0', send: vi.fn() };
    await server.onMessage(JSON.stringify({
      type: ClientMessageType.START_GAME,
      victoryCondition: {
        scoreEnabled: true,
        targetScore: 30,
        narratorRoundsEnabled: false,
        narratorRounds: 2
      },
      deckOption: 'mixed',
      phaseTimeouts: {
        narrator: 60,
        othersChoosing: 45,
        voting: 30,
        results: 15
      }
    }), hostConn as any);
    
    // Check if phase changed
    expect(server['state'].phase).toBe(GamePhase.NARRATOR_CHOOSING);
    expect(server['state'].players[0].hand.length).toBe(6); // HAND_SIZE is 6
  });

  it('should NOT allow starting a game with 10 players in original deck mode', async () => {
    const server = new GameServer(mockRoom as any);
    
    // Add 10 players
    for (let i = 0; i < 10; i++) {
      const conn = { id: `conn-${i}`, send: vi.fn() };
      await server.onMessage(JSON.stringify({
        type: ClientMessageType.JOIN_ROOM,
        playerName: `Player ${i}`,
      }), conn as any);
    }
    
    // Host (first player) tries to start game in original mode (max 8)
    const hostConn = { id: 'conn-0', send: vi.fn() };
    await server.onMessage(JSON.stringify({
      type: ClientMessageType.START_GAME,
      victoryCondition: {
        scoreEnabled: true,
        targetScore: 30,
        narratorRoundsEnabled: false,
        narratorRounds: 2
      },
      deckOption: 'original',
      phaseTimeouts: {
        narrator: 60,
        othersChoosing: 45,
        voting: 30,
        results: 15
      }
    }), hostConn as any);
    
    // Should still be in LOBBY
    expect(server['state'].phase).toBe(GamePhase.LOBBY);
  });
});
