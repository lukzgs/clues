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
| `onConnect(conn)` | Handles new WebSocket connections |
| `onClose(conn)` | Handles disconnections. Preserves players in lobby for reconnection (schedules 10s host migration), and immediately transfers host role if host disconnects mid-game. |
| `onMessage(message, sender)` | Routes incoming messages to handlers |
| `onAlarm()` | Handles inactivity timeouts (9m warning, 10m close) |

## Message Handlers

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
| `createDeck(option)` | Generates dynamic deck based on selected option (`ORIGINAL`, `NEW`, or `MIXED`) from local assets |
| `shuffle(array)` | Fisher-Yates shuffle |
| `generatePlayerId()` | Creates unique player ID |
| `createInitialState()` | Returns fresh game state |
| `checkResponsiveness(conn)` | Pings connection to verify if active |
| `resetInactivityTimer()` | Resets the 9-minute inactivity alarm |
| `getPublicState(playerId)` | Filters state for specific player |
| `calculateScores()` | Computes round scores |

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
}
```

## Related Documentation

- [Message Types](./MESSAGES.md)
- [State Machine](./STATE_MACHINE.md)
- [Client Documentation](./CLIENT.md)
