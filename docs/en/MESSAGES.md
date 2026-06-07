# Message Types

## Overview

All communication between client and server happens through typed WebSocket messages. Messages are validated using Zod schemas.

---

## Client → Server Messages

### `ClientMessageType` Enum

```typescript
enum ClientMessageType {
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  START_GAME = 'START_GAME',
  SUBMIT_CLUE = 'SUBMIT_CLUE',
  PLAY_CARD = 'PLAY_CARD',
  VOTE = 'VOTE',
  NEXT_ROUND = 'NEXT_ROUND',
  RESTART_GAME = 'RESTART_GAME',
  ADD_BOT = 'ADD_BOT',
  REMOVE_BOT = 'REMOVE_BOT',
  KICK_PLAYER = 'KICK_PLAYER',
  TOGGLE_SPECTATOR = 'TOGGLE_SPECTATOR',
  REQUEST_PLAY = 'REQUEST_PLAY',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
}
```

### Message Definitions

| Message | Payload | Valid Phase |
|---------|---------|-------------|
| `JOIN_ROOM` | `playerName: string` | Any |
| `LEAVE_ROOM` | (none) | Any |
| `START_GAME` | `victoryCondition: VictoryCondition, deckOption: DeckOption, phaseTimeouts: PhaseTimeouts` | LOBBY (host only) |
| `SUBMIT_CLUE` | `cardId: number, clue: string` | NARRATOR_CHOOSING (narrator only) |
| `PLAY_CARD` | `cardId: number` | OTHERS_CHOOSING (non-narrators) |
| `VOTE` | `orderId: number` | VOTING (non-narrators) |
| `NEXT_ROUND` | (none) | RESULTS |
| `RESTART_GAME` | (none) | GAME_OVER |
| `ADD_BOT` | (none) | LOBBY (host only) |
| `REMOVE_BOT` | `botId: string` | LOBBY (host only) |
| `KICK_PLAYER` | `playerId: string` | Any (host only) |
| `TOGGLE_SPECTATOR` | `playerId: string` | LOBBY (host only) |
| `REQUEST_PLAY` | (none) | LOBBY (spectators only) |
| `UPDATE_SETTINGS` | `victoryCondition: VictoryCondition, deckOption: DeckOption, phaseTimeouts: PhaseTimeouts` | LOBBY (host only) |

### Example Messages

```typescript
// Join a room
{ type: 'JOIN_ROOM', playerName: 'Alice' }

// Submit a clue as narrator
{ type: 'SUBMIT_CLUE', cardId: 42, clue: 'A dream within a dream' }

// Start game with victory conditions, deck option & phase timeouts
{ 
  type: 'START_GAME', 
  victoryCondition: { scoreEnabled: true, targetScore: 30, narratorRoundsEnabled: false, narratorRounds: 2 }, 
  deckOption: 'mixed',
  phaseTimeouts: { narrator: 60, othersChoosing: 45, voting: 30, results: 15 }
}

// Vote for a card
{ type: 'VOTE', orderId: 3 }
```

---

## Server → Client Messages

### `ServerMessageType` Enum

```typescript
enum ServerMessageType {
  SYNC_STATE = 'SYNC_STATE',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAYER_KICKED = 'PLAYER_KICKED',
  ERROR = 'ERROR',
}
```

### Message Definitions

| Message | Payload | Description |
|---------|---------|-------------|
| `SYNC_STATE` | `gameState: GameState, yourPlayerId: string` | Full state sync |
| `PLAYER_JOINED` | `player: Player` (without hand) | Player joined notification |
| `PLAYER_LEFT` | `playerId: string, playerName: string` | Player left notification |
| `PLAYER_KICKED` | `playerId: string` | Player kicked notification |
| `ERROR` | `message: string, code?: string` | Error notification |
| `SERVER_CLOSING_WARNING` | `closeTime: number` | Warning that room will close due to inactivity |
| `SERVER_CLOSING_CANCELLED` | (none) | Inactivity warning cancelled |
| `SERVER_CLOSED` | (none) | Room closed due to inactivity |

### Example Messages

```typescript
// State sync
{
  type: 'SYNC_STATE',
  gameState: { /* GameState object */ },
  yourPlayerId: 'abc123'
}

// Error
{
  type: 'ERROR',
  message: 'Only the host can start the game',
  code: 'NOT_HOST'
}
```

---

## Zod Schemas

Located in `src/schemas/messages.ts`:

```typescript
// Client message schemas
export const JoinRoomMessageSchema = z.object({
  type: z.literal(ClientMessageType.JOIN_ROOM),
  playerName: z.string().min(1).max(20),
});

export const SubmitClueMessageSchema = z.object({
  type: z.literal(ClientMessageType.SUBMIT_CLUE),
  cardId: z.number().int().positive(),
  clue: z.string().min(1).max(200),
});

export const VoteMessageSchema = z.object({
  type: z.literal(ClientMessageType.VOTE),
  orderId: z.number().int().nonnegative(),
});
```

---

## Validation Flow

```
Client                          Server
  │                               │
  │  1. Create message            │
  │  2. Validate with Zod         │
  │  3. Send if valid ──────────► │
  │                               │ 4. Validate with Zod
  │                               │ 5. Process if valid
  │ ◄────────────────────────────── 6. Send response
  │  7. Update UI                 │
```

---

## Related Documentation

- [Server Documentation](./SERVER.md)
- [Client Documentation](./CLIENT.md)
- [State Machine](./STATE_MACHINE.md)
