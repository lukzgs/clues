# Server Documentation

## Overview

The game server is implemented as a PartyKit server in `party/server.ts`. It manages game state, player connections, and game logic through WebSocket connections.

## Configuration

Server configurations are placed in `game.config.json` and mirrored to `src/config.ts`.
Key features like bots can be enabled/disabled using `ENABLE_BOTS` configuration flag.

## Main Class: `GameServer`

```typescript
class GameServer implements Party.Server {
  private state: ServerGameState;
  private connections: Map<string, string>;  // connectionId -> playerId
  private botManager: any;
  private messageCount: Map<string, number>; // Rate limiting
  private rateLimitReset: number;
}
```

## Lifecycle Methods

| Method | Description |
|--------|-------------|
| `constructor(room)` | Initializes server with room reference |
| `onConnect(conn)` | Handles new WebSocket connections. On reconnecting, sends an individual `SYNC_STATE` confirmation message directly to the connection to restore local state. |
| `onClose(conn)` | Handles disconnections. Preserves players in lobby for reconnection (schedules 10s host migration), and immediately transfers host role if host disconnects mid-game. |
| `onMessage(message, sender)` | Routes incoming messages to handlers |
| `onAlarm()` | Handles inactivity timeouts (9m warning, 10m close) |

## Message Handlers

Message handling is delegated to specialized modules in the `party/handlers/` directory. The `GameServer` class acts as a facade, proxying incoming WebSocket messages to these handlers.

### Lobby Phase

| Handler | Trigger | Description |
|---------|---------|-------------|
| `handleJoinRoom` | `JOIN_ROOM` | Adds player to room, assigns color. Handles session reclamation with ghost socket eviction, preserves host status on reconnect, and phase validation. |
| `handleLeaveRoom` | `LEAVE_ROOM` | Removes player from room |
| `handleStartGame` | `START_GAME` | Validates and starts game (host only) |
| `handleAddBot` | `ADD_BOT` | Adds AI player (host only) |
| `handleRemoveBot` | `REMOVE_BOT` | Removes AI player (host only) |
| `handleKickPlayer` | `KICK_PLAYER` | Removes player from room and closes connection (host only) |
| `handleToggleSpectator` | `TOGGLE_SPECTATOR` | Toggles player between active and spectator roles (host can toggle anyone, players can toggle themselves) |
| `handleRequestPlay` | `REQUEST_PLAY` | Spectator requests to become an active player |

### Game Phase

| Handler | Trigger | Description |
|---------|---------|-------------|
| `handleSubmitClue` | `SUBMIT_CLUE` | Narrator submits card + clue |
| `handlePlayCard` | `PLAY_CARD` | Non-narrator plays matching card |
| `handleVote` | `VOTE` | Player votes for a card |
| `handleNextRound` | `NEXT_ROUND` | Marks player as ready; advances to next round when all active players are ready |
| `handleRestartGame` | `RESTART_GAME` | Resets game to lobby |

## Utility Functions

| Function | Description |
|----------|-------------|
| `sanitizeSettings(victoryCondition, phaseTimeouts)` | Sanitizes and clamps game settings and phase timeouts to valid ranges (DRY) |
| `createDeck(option)` | Generates dynamic deck based on selected option (`ORIGINAL`, `NEW`, or `MIXED`) from local assets |
| `shuffle(array)` | Fisher-Yates shuffle |
| `generatePlayerId()` | Creates unique player ID |
| `createInitialState()` | Returns fresh game state |
| `checkResponsiveness(conn)` | Pings connection to verify if active |
| `resetInactivityTimer()` | Resets the 9-minute inactivity alarm |
| `getPublicState(playerId)` | Filters state for specific player |
| `calculateScores()` | Computes round scores |
| `getMaxPlayersForDeck(deckOption, victoryCondition)` | Delegates to `src/utils/gameMath.ts` to compute max players dynamically |

## Broadcasting

| Method | Description |
|--------|-------------|
| `broadcastState()` | Sends personalized state to all players |
| `broadcast(message)` | Sends same message to all connections |
| `sendToConnection(conn, msg)` | Sends to specific connection |
| `sendError(conn, message)` | Sends error message |

## Security Features

### Rate Limiting

```typescript
checkRateLimit(connId: string): boolean
```

- **Limit**: 20 messages per second per connection
- **Window**: Resets every 1000ms
- **Action**: Silently drops excess messages

### Validation

- All incoming messages validated with Zod schemas
- Invalid messages are silently ignored
- Player actions validated against current game phase

## Bot System

The server integrates with a bot manager located in `party/bots/`:

```typescript
triggerBotActions(): void
```

Provides callbacks for bots to:
- `submitClue(botId, cardId, clue)`
- `playCard(botId, cardId)`
- `vote(botId, orderId)`

## State Structure

```typescript
interface ServerGameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  narratorIndex: number;
  currentClue: string;
  tableCards: TableCard[];
  votes: Record<string, number>;
  winner: string | null;
  deck: Card[];  // Server-only, not sent to clients
  victoryCondition: VictoryCondition; // Configured by host at game start
  deckOption: DeckOption; // Selected deck option
  currentRound: number; // 0-based round counter
  playersWhoReadied: string[]; // IDs of players who clicked "Next Round"
  phaseTimeouts: PhaseTimeouts; // Timeout configuration for each phase
  timerEnabled: boolean; // Global toggle to enable/disable phase timers
}
```

## Telemetry & Metrics System

The server incorporates an in-memory telemetry and global registry system to track server-wide and room-specific technical metrics, error rates, and reconnection lifecycle events.

### Architecture

1. **Room Telemetry (`party/telemetry.ts`)**: Each `GameServer` instance maintains counters and a 20-entry ring buffer of recent events (`RECONNECT_SUCCESS`, `RECONNECT_FAILED`, `GHOST_SOCKET_KICK`, `RATE_LIMIT_EXCEEDED`, `VALIDATION_ERROR`, `UNCAUGHT_ERROR`).
2. **Global Registry (`party/registry.ts`)**: A single-instance PartyKit Durable Object server (`RegistryServer`) that indexes all active rooms, aggregates global CCU (Concurrent Connected Users), human/bot/spectator totals, and server-wide telemetry counters.
3. **HTTP PULL Endpoints**: Protected HTTP GET endpoints for metric scraping.

### Security Guards

- **Authentication Guard**: All metric endpoints require `Authorization: Bearer <METRICS_SECRET_TOKEN>`. Returns `401 Unauthorized` if missing or invalid.
- **HTTP Method Guard**: Strict `GET` method enforcement. Returns `405 Method Not Allowed` for other methods.
- **CORS Guard**: Set to `Access-Control-Allow-Origin: null` to prevent unauthorized cross-origin browser reads.
- **Data Sanitization**: Sensitive values (reconnect tokens, user IP addresses) are sanitized or excluded.

---

### HTTP API & JSON Payloads

#### 1. Global Metrics Endpoint (`GET /parties/registry/global/metrics`)

Returns aggregated metrics across all active game instances.

##### JSON Response Specification:

```json
{
  "timestamp": "2026-08-07T13:40:00.000Z",
  "uptimeSeconds": 1420,
  "activeRoomsCount": 2,
  "globalCCU": 8,
  "totalHumanPlayers": 6,
  "totalBotPlayers": 2,
  "totalSpectators": 0,
  "phaseDistribution": {
    "LOBBY": 1,
    "VOTING": 1
  },
  "aggregatedCounters": {
    "reconnectsTotal": 5,
    "reconnectsSuccessful": 4,
    "reconnectsFailedInvalidId": 1,
    "ghostSocketKicks": 2,
    "rateLimitViolations": 0,
    "schemaValidationErrors": 1,
    "uncaughtErrors": 0
  },
  "rooms": [
    {
      "roomCode": "HVQZQA",
      "phase": "LOBBY",
      "activeConnectionsCount": 3,
      "totalPlayersCount": 3,
      "humanPlayersCount": 2,
      "botPlayersCount": 1,
      "spectatorsCount": 0,
      "uptimeSeconds": 120,
      "counters": {
        "reconnectsTotal": 1,
        "reconnectsSuccessful": 1,
        "reconnectsFailedInvalidId": 0,
        "ghostSocketKicks": 0,
        "rateLimitViolations": 0,
        "schemaValidationErrors": 0,
        "uncaughtErrors": 0
      },
      "lastSeenTimestamp": 1786110000000
    }
  ]
}
```

#### 2. Room Specific Endpoint (`GET /parties/main/:roomCode/metrics`)

Returns detailed technical metrics and recent event logs for a single room.

##### JSON Response Specification:

```json
{
  "roomCode": "HVQZQA",
  "uptimeSeconds": 120,
  "createdTimestamp": "2026-08-07T13:38:00.000Z",
  "counters": {
    "reconnectsTotal": 1,
    "reconnectsSuccessful": 0,
    "reconnectsFailedInvalidId": 1,
    "ghostSocketKicks": 0,
    "rateLimitViolations": 0,
    "schemaValidationErrors": 0,
    "uncaughtErrors": 0
  },
  "roomSummary": {
    "phase": "LOBBY",
    "activeConnectionsCount": 1,
    "totalPlayersCount": 1,
    "humanPlayersCount": 1,
    "botPlayersCount": 0,
    "spectatorsCount": 0
  },
  "recentLogs": [
    {
      "timestamp": "2026-08-07T13:38:05.000Z",
      "type": "RECONNECT_FAILED",
      "message": "Reconnect failed: Invalid or expired reconnectId",
      "details": {
        "safeReconnectId": "abc1...xyz2"
      }
    }
  ]
}
```

---

### Terminal CLI Usage

Terminal metric scraping helper via `scripts/fetch-metrics.ts`:

```bash
# Global local server dashboard
npm run metrics:local

# Global deployed cloud dashboard
npm run metrics:prod

# Single room inspection (Local)
npm run metrics:local -- --room HVQZQA

# Single room inspection (Deployed Cloud)
npm run metrics:prod -- --room HVQZQA

# Raw JSON output
npm run metrics:local -- --raw
```

---

## Related Documentation

- [Message Types](./MESSAGES.md)
- [State Machine](./STATE_MACHINE.md)
- [Client Documentation](./CLIENT.md)
- [Architecture Overview](./ARCHITECTURE.md)
