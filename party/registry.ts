import type * as Party from "partykit/server";

export interface ActiveRoomEntry {
  roomCode: string;
  phase: string;
  activeConnectionsCount: number;
  totalPlayersCount: number;
  humanPlayersCount: number;
  botPlayersCount: number;
  spectatorsCount: number;
  uptimeSeconds: number;
  counters: {
    reconnectsTotal: number;
    reconnectsSuccessful: number;
    reconnectsFailedInvalidId: number;
    ghostSocketKicks: number;
    rateLimitViolations: number;
    schemaValidationErrors: number;
    uncaughtErrors: number;
  };
  lastSeenTimestamp: number;
}

export interface GlobalTelemetrySnapshot {
  timestamp: string;
  uptimeSeconds: number;
  activeRoomsCount: number;
  globalCCU: number;
  totalHumanPlayers: number;
  totalBotPlayers: number;
  totalSpectators: number;
  phaseDistribution: Record<string, number>;
  aggregatedCounters: {
    reconnectsTotal: number;
    reconnectsSuccessful: number;
    reconnectsFailedInvalidId: number;
    ghostSocketKicks: number;
    rateLimitViolations: number;
    schemaValidationErrors: number;
    uncaughtErrors: number;
  };
  rooms: ActiveRoomEntry[];
}

export default class RegistryServer implements Party.Server {
  private startTime: number = Date.now();
  private rooms: Map<string, ActiveRoomEntry> = new Map();

  constructor(readonly room: Party.Room) {}

  public registerOrUpdateRoom(entry: Omit<ActiveRoomEntry, "lastSeenTimestamp">) {
    this.rooms.set(entry.roomCode, {
      ...entry,
      lastSeenTimestamp: Date.now(),
    });
  }

  public unregisterRoom(roomCode: string) {
    this.rooms.delete(roomCode);
  }

  private sweepStaleRooms() {
    const STALE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();
    for (const [roomCode, entry] of this.rooms.entries()) {
      if (now - entry.lastSeenTimestamp > STALE_TIMEOUT_MS) {
        this.rooms.delete(roomCode);
      }
    }
  }

  public getGlobalSnapshot(): GlobalTelemetrySnapshot {
    this.sweepStaleRooms();

    const roomsList = Array.from(this.rooms.values());
    const phaseDistribution: Record<string, number> = {};

    let globalCCU = 0;
    let totalHumanPlayers = 0;
    let totalBotPlayers = 0;
    let totalSpectators = 0;

    const aggregatedCounters = {
      reconnectsTotal: 0,
      reconnectsSuccessful: 0,
      reconnectsFailedInvalidId: 0,
      ghostSocketKicks: 0,
      rateLimitViolations: 0,
      schemaValidationErrors: 0,
      uncaughtErrors: 0,
    };

    for (const r of roomsList) {
      globalCCU += r.activeConnectionsCount;
      totalHumanPlayers += r.humanPlayersCount;
      totalBotPlayers += r.botPlayersCount;
      totalSpectators += r.spectatorsCount;

      phaseDistribution[r.phase] = (phaseDistribution[r.phase] || 0) + 1;

      aggregatedCounters.reconnectsTotal += r.counters.reconnectsTotal || 0;
      aggregatedCounters.reconnectsSuccessful += r.counters.reconnectsSuccessful || 0;
      aggregatedCounters.reconnectsFailedInvalidId += r.counters.reconnectsFailedInvalidId || 0;
      aggregatedCounters.ghostSocketKicks += r.counters.ghostSocketKicks || 0;
      aggregatedCounters.rateLimitViolations += r.counters.rateLimitViolations || 0;
      aggregatedCounters.schemaValidationErrors += r.counters.schemaValidationErrors || 0;
      aggregatedCounters.uncaughtErrors += r.counters.uncaughtErrors || 0;
    }

    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      activeRoomsCount: roomsList.length,
      globalCCU,
      totalHumanPlayers,
      totalBotPlayers,
      totalSpectators,
      phaseDistribution,
      aggregatedCounters,
      rooms: roomsList,
    };
  }

  async onRequest(req: Party.Request): Promise<Response> {
    const url = new URL(req.url);

    // Internal endpoint for rooms to update status
    if (req.method === "POST" && (url.pathname === "/update" || url.pathname.endsWith("/update"))) {
      try {
        const body = (await req.json()) as Omit<ActiveRoomEntry, "lastSeenTimestamp">;
        if (body && body.roomCode) {
          this.registerOrUpdateRoom(body);
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
      }
    }

    // Internal endpoint for rooms to unregister when closed
    if (req.method === "POST" && (url.pathname === "/unregister" || url.pathname.endsWith("/unregister"))) {
      try {
        const body = (await req.json()) as { roomCode: string };
        if (body && body.roomCode) {
          this.unregisterRoom(body.roomCode);
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
      }
    }

    // Public metrics GET endpoint protected by Bearer token
    if (url.pathname === "/metrics" || url.pathname.endsWith("/metrics")) {
      if (req.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      const authHeader = req.headers.get("Authorization");
      const expectedToken =
        (this.room.env as Record<string, string> | undefined)?.METRICS_SECRET_TOKEN ||
        process.env.METRICS_SECRET_TOKEN ||
        "dev-secret-token";

      if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const snapshot = this.getGlobalSnapshot();

      return new Response(JSON.stringify(snapshot, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "null",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  }
}

export const globalRegistry = new RegistryServer({ id: "global", env: {} } as any);
