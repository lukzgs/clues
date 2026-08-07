export interface TelemetryEventLog {
  timestamp: string;
  type: 
    | 'RECONNECT_SUCCESS'
    | 'RECONNECT_FAILED'
    | 'GHOST_SOCKET_KICK'
    | 'RATE_LIMIT_EXCEEDED'
    | 'VALIDATION_ERROR'
    | 'UNCAUGHT_ERROR';
  message: string;
  details?: Record<string, unknown>;
}

export interface TelemetryCounters {
  reconnectsTotal: number;
  reconnectsSuccessful: number;
  reconnectsFailedInvalidId: number;
  ghostSocketKicks: number;
  rateLimitViolations: number;
  schemaValidationErrors: number;
  uncaughtErrors: number;
}

export interface TelemetrySnapshot {
  roomCode: string;
  uptimeSeconds: number;
  createdTimestamp: string;
  counters: TelemetryCounters;
  roomSummary: {
    phase: string;
    activeConnectionsCount: number;
    totalPlayersCount: number;
    humanPlayersCount: number;
    botPlayersCount: number;
    spectatorsCount: number;
  };
  recentLogs: TelemetryEventLog[];
}

const MAX_LOG_BUFFER_SIZE = 20;

export class ServerTelemetry {
  private startTime: number = Date.now();
  private createdIsoString: string = new Date().toISOString();

  private counters: TelemetryCounters = {
    reconnectsTotal: 0,
    reconnectsSuccessful: 0,
    reconnectsFailedInvalidId: 0,
    ghostSocketKicks: 0,
    rateLimitViolations: 0,
    schemaValidationErrors: 0,
    uncaughtErrors: 0,
  };

  private eventLogs: TelemetryEventLog[] = [];

  private addLog(
    type: TelemetryEventLog['type'],
    message: string,
    details?: Record<string, unknown>
  ) {
    const entry: TelemetryEventLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      details,
    };

    this.eventLogs.push(entry);
    if (this.eventLogs.length > MAX_LOG_BUFFER_SIZE) {
      this.eventLogs.shift(); // Maintains ring buffer limit
    }
  }

  public recordReconnectSuccess(playerName: string, reconnectId: string) {
    this.counters.reconnectsTotal++;
    this.counters.reconnectsSuccessful++;
    // Sanitize ID prefix/suffix for telemetry safety
    const safeId = reconnectId.length > 8 ? `${reconnectId.slice(0, 4)}...${reconnectId.slice(-4)}` : reconnectId;
    this.addLog('RECONNECT_SUCCESS', `Player "${playerName}" reconnected successfully`, { safeReconnectId: safeId });
  }

  public recordReconnectFailed(reconnectId: string, reason: string = 'Invalid or expired reconnectId') {
    this.counters.reconnectsTotal++;
    this.counters.reconnectsFailedInvalidId++;
    const safeId = reconnectId.length > 8 ? `${reconnectId.slice(0, 4)}...${reconnectId.slice(-4)}` : reconnectId;
    this.addLog('RECONNECT_FAILED', `Reconnect failed: ${reason}`, { safeReconnectId: safeId });
  }

  public recordGhostSocketKick(playerId: string, playerName?: string) {
    this.counters.ghostSocketKicks++;
    this.addLog(
      'GHOST_SOCKET_KICK',
      `Older connection dropped due to reconnection of player "${playerName || playerId}"`,
      { playerId }
    );
  }

  public recordRateLimitHit(connId: string) {
    this.counters.rateLimitViolations++;
    this.addLog('RATE_LIMIT_EXCEEDED', `Connection exceeded message rate limit`, { connId });
  }

  public recordValidationError(connId: string, errorSummary: string) {
    this.counters.schemaValidationErrors++;
    this.addLog('VALIDATION_ERROR', `Client message failed Zod schema validation`, { connId, errorSummary });
  }

  public recordUncaughtError(errorMsg: string) {
    this.counters.uncaughtErrors++;
    this.addLog('UNCAUGHT_ERROR', `Server caught unhandled error: ${errorMsg}`);
  }

  public getSnapshot(roomCode: string, roomSummary: TelemetrySnapshot['roomSummary']): TelemetrySnapshot {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      roomCode,
      uptimeSeconds,
      createdTimestamp: this.createdIsoString,
      counters: { ...this.counters },
      roomSummary,
      recentLogs: [...this.eventLogs],
    };
  }
}
