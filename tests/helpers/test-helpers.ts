/**
 * Test helpers for GameServer integration tests.
 *
 * Provides mock implementations of PartyKit's Room and Connection
 * interfaces, plus factory functions for creating test scenarios.
 */

import type * as Party from 'partykit/server';
import { Player, VictoryCondition } from '../../src/types';

// ============================================
// MOCK CONNECTION
// ============================================

export interface MockConnection extends Party.Connection {
  /** All messages sent to this connection */
  sentMessages: string[];
  /** The connection state */
  readyState: number;
}

let connectionCounter = 0;

export function createMockConnection(id?: string): MockConnection {
  connectionCounter++;
  const connId = id || `conn-${connectionCounter}`;

  const sentMessages: string[] = [];
  let readyState = 1; // WebSocket.OPEN

  return {
    id: connId,
    uri: `ws://localhost:1999/${connId}`,
    get readyState() { return readyState; },
    sentMessages,
    send(message: string | ArrayBuffer | ArrayBufferView) {
      if (typeof message === 'string') {
        sentMessages.push(message);
      }
    },
    close(_code?: number, _reason?: string) {
      readyState = 3; // WebSocket.CLOSED
    },
    serializeAttachment(_attachment: unknown) {},
    deserializeAttachment(): unknown { return undefined; },
    setState<T>(_state: T) {},
    // Socket properties (stubs)
    socket: null as any,
    unstable_scheduleEviction: () => {},
  } as unknown as MockConnection;
}

// ============================================
// MOCK ROOM
// ============================================

export interface MockRoom extends Party.Room {
  /** All connections registered in this room */
  connections: Map<string, MockConnection>;
  /** All broadcast messages */
  broadcastMessages: string[];
}

export function createMockRoom(roomId: string = 'TEST01'): MockRoom {
  const connections = new Map<string, MockConnection>();
  const broadcastMessages: string[] = [];

  return {
    id: roomId,
    internalId: `internal-${roomId}`,
    env: {} as any,
    context: {
      parties: {} as any,
    } as any,
    connections,
    broadcastMessages,
    storage: {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue(new Map()),
      deleteAll: vi.fn().mockResolvedValue(undefined),
      deleteAlarm: vi.fn().mockResolvedValue(undefined),
      getAlarm: vi.fn().mockResolvedValue(null),
      setAlarm: vi.fn().mockResolvedValue(undefined),
      transaction: vi.fn(),
    } as any,
    getConnection(id: string) {
      return connections.get(id) || null;
    },
    getConnections(_tag?: string) {
      return connections.values();
    },
    broadcast(msg: string | ArrayBuffer | ArrayBufferView, _without?: string[]) {
      if (typeof msg === 'string') {
        broadcastMessages.push(msg);
      }
    },
    name: 'game',
    parties: {} as any,
  } as unknown as MockRoom;
}

// ============================================
// SERVER HELPERS
// ============================================

/**
 * Simulates a player connecting and joining a room.
 * Returns the mock connection used.
 */
export async function simulateJoinRoom(
  server: any,
  room: MockRoom,
  playerName: string,
  connId?: string,
  reconnectId?: string,
): Promise<MockConnection> {
  const conn = createMockConnection(connId);
  room.connections.set(conn.id, conn);

  // Trigger onConnect
  await server.onConnect(conn);

  // Send JOIN_ROOM message
  const joinMsg = JSON.stringify({
    type: 'JOIN_ROOM',
    playerName,
    ...(reconnectId ? { reconnectId } : {}),
  });
  await server.onMessage(joinMsg, conn);

  return conn;
}

/**
 * Parses the last SYNC_STATE message sent to a connection.
 */
export function getLastSyncState(conn: MockConnection) {
  for (let i = conn.sentMessages.length - 1; i >= 0; i--) {
    const msg = JSON.parse(conn.sentMessages[i]);
    if (msg.type === 'SYNC_STATE') {
      return msg;
    }
  }
  return null;
}

/**
 * Gets all parsed messages sent to a connection.
 */
export function getParsedMessages(conn: MockConnection) {
  return conn.sentMessages.map(m => JSON.parse(m));
}

/**
 * Default victory condition for tests.
 */
export const DEFAULT_VICTORY_CONDITION: VictoryCondition = {
  scoreEnabled: true,
  targetScore: 30,
  narratorRoundsEnabled: false,
  narratorRounds: 2,
};
