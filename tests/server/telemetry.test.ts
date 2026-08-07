import { describe, it, expect } from 'vitest';
import { ServerTelemetry } from '../../party/telemetry';

describe('ServerTelemetry', () => {
  it('should initialize with zeroed counters and empty log buffer', () => {
    const telemetry = new ServerTelemetry();
    const snapshot = telemetry.getSnapshot('room-123', {
      phase: 'LOBBY',
      activeConnectionsCount: 0,
      totalPlayersCount: 0,
      humanPlayersCount: 0,
      botPlayersCount: 0,
      spectatorsCount: 0,
    });

    expect(snapshot.roomCode).toBe('room-123');
    expect(snapshot.counters.reconnectsTotal).toBe(0);
    expect(snapshot.counters.reconnectsSuccessful).toBe(0);
    expect(snapshot.recentLogs.length).toBe(0);
  });

  it('should record successful reconnects correctly', () => {
    const telemetry = new ServerTelemetry();
    telemetry.recordReconnectSuccess('Alice', 'player-uuid-12345');

    const snapshot = telemetry.getSnapshot('room-123', {
      phase: 'LOBBY',
      activeConnectionsCount: 1,
      totalPlayersCount: 1,
      humanPlayersCount: 1,
      botPlayersCount: 0,
      spectatorsCount: 0,
    });

    expect(snapshot.counters.reconnectsTotal).toBe(1);
    expect(snapshot.counters.reconnectsSuccessful).toBe(1);
    expect(snapshot.recentLogs.length).toBe(1);
    expect(snapshot.recentLogs[0].type).toBe('RECONNECT_SUCCESS');
  });

  it('should record failed reconnects and ghost socket kicks', () => {
    const telemetry = new ServerTelemetry();
    telemetry.recordReconnectFailed('invalid-token');
    telemetry.recordGhostSocketKick('player-1', 'Bob');

    const snapshot = telemetry.getSnapshot('room-123', {
      phase: 'LOBBY',
      activeConnectionsCount: 1,
      totalPlayersCount: 1,
      humanPlayersCount: 1,
      botPlayersCount: 0,
      spectatorsCount: 0,
    });

    expect(snapshot.counters.reconnectsTotal).toBe(1);
    expect(snapshot.counters.reconnectsFailedInvalidId).toBe(1);
    expect(snapshot.counters.ghostSocketKicks).toBe(1);
    expect(snapshot.recentLogs.length).toBe(2);
  });

  it('should record rate limits and validation errors', () => {
    const telemetry = new ServerTelemetry();
    telemetry.recordRateLimitHit('conn-123');
    telemetry.recordValidationError('conn-123', 'Invalid payload');

    const snapshot = telemetry.getSnapshot('room-123', {
      phase: 'LOBBY',
      activeConnectionsCount: 1,
      totalPlayersCount: 1,
      humanPlayersCount: 1,
      botPlayersCount: 0,
      spectatorsCount: 0,
    });

    expect(snapshot.counters.rateLimitViolations).toBe(1);
    expect(snapshot.counters.schemaValidationErrors).toBe(1);
  });

  it('should maintain max buffer size of 20 logs', () => {
    const telemetry = new ServerTelemetry();
    for (let i = 0; i < 25; i++) {
      telemetry.recordUncaughtError(`Error ${i}`);
    }

    const snapshot = telemetry.getSnapshot('room-123', {
      phase: 'LOBBY',
      activeConnectionsCount: 0,
      totalPlayersCount: 0,
      humanPlayersCount: 0,
      botPlayersCount: 0,
      spectatorsCount: 0,
    });

    expect(snapshot.counters.uncaughtErrors).toBe(25);
    expect(snapshot.recentLogs.length).toBe(20);
    expect(snapshot.recentLogs[0].message).toBe('Server caught unhandled error: Error 5');
  });
});
