import { describe, it, expect } from 'vitest';
import RegistryServer from '../../party/registry';

describe('RegistryServer', () => {
  it('should initialize empty snapshot', () => {
    const mockRoom = { id: 'global', env: {} } as any;
    const registry = new RegistryServer(mockRoom);
    const snapshot = registry.getGlobalSnapshot();

    expect(snapshot.activeRoomsCount).toBe(0);
    expect(snapshot.globalCCU).toBe(0);
    expect(snapshot.totalHumanPlayers).toBe(0);
    expect(snapshot.totalBotPlayers).toBe(0);
    expect(snapshot.rooms.length).toBe(0);
  });

  it('should register and update active rooms and calculate aggregate metrics', () => {
    const mockRoom = { id: 'global', env: {} } as any;
    const registry = new RegistryServer(mockRoom);

    registry.registerOrUpdateRoom({
      roomCode: 'room-alpha',
      phase: 'LOBBY',
      activeConnectionsCount: 4,
      totalPlayersCount: 4,
      humanPlayersCount: 3,
      botPlayersCount: 1,
      spectatorsCount: 0,
      uptimeSeconds: 120,
      counters: {
        reconnectsTotal: 2,
        reconnectsSuccessful: 2,
        reconnectsFailedInvalidId: 0,
        ghostSocketKicks: 1,
        rateLimitViolations: 0,
        schemaValidationErrors: 1,
        uncaughtErrors: 0,
      },
    });

    registry.registerOrUpdateRoom({
      roomCode: 'room-beta',
      phase: 'VOTING',
      activeConnectionsCount: 6,
      totalPlayersCount: 6,
      humanPlayersCount: 6,
      botPlayersCount: 0,
      spectatorsCount: 0,
      uptimeSeconds: 300,
      counters: {
        reconnectsTotal: 5,
        reconnectsSuccessful: 4,
        reconnectsFailedInvalidId: 1,
        ghostSocketKicks: 2,
        rateLimitViolations: 1,
        schemaValidationErrors: 0,
        uncaughtErrors: 0,
      },
    });

    const snapshot = registry.getGlobalSnapshot();

    expect(snapshot.activeRoomsCount).toBe(2);
    expect(snapshot.globalCCU).toBe(10);
    expect(snapshot.totalHumanPlayers).toBe(9);
    expect(snapshot.totalBotPlayers).toBe(1);

    expect(snapshot.phaseDistribution['LOBBY']).toBe(1);
    expect(snapshot.phaseDistribution['VOTING']).toBe(1);

    expect(snapshot.aggregatedCounters.reconnectsSuccessful).toBe(6);
    expect(snapshot.aggregatedCounters.reconnectsFailedInvalidId).toBe(1);
    expect(snapshot.aggregatedCounters.ghostSocketKicks).toBe(3);
    expect(snapshot.aggregatedCounters.rateLimitViolations).toBe(1);
  });

  it('should unregister room when requested', () => {
    const mockRoom = { id: 'global', env: {} } as any;
    const registry = new RegistryServer(mockRoom);

    registry.registerOrUpdateRoom({
      roomCode: 'room-temp',
      phase: 'LOBBY',
      activeConnectionsCount: 2,
      totalPlayersCount: 2,
      humanPlayersCount: 2,
      botPlayersCount: 0,
      spectatorsCount: 0,
      uptimeSeconds: 30,
      counters: {
        reconnectsTotal: 0,
        reconnectsSuccessful: 0,
        reconnectsFailedInvalidId: 0,
        ghostSocketKicks: 0,
        rateLimitViolations: 0,
        schemaValidationErrors: 0,
        uncaughtErrors: 0,
      },
    });

    expect(registry.getGlobalSnapshot().activeRoomsCount).toBe(1);

    registry.unregisterRoom('room-temp');

    expect(registry.getGlobalSnapshot().activeRoomsCount).toBe(0);
  });
});
