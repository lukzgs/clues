# Client Documentation

## Overview

The frontend is a React 19 application using TypeScript. It connects to the PartyKit server via WebSocket and manages the game UI.

## Entry Point

### `src/App.tsx`

Main application component managing app-level state:

```typescript
type AppState =
  | { screen: 'join' }
  | { screen: 'connecting'; roomCode: string; playerName: string }
  | { screen: 'game'; roomCode: string; playerName: string };
```

**Key Functions:**
- `generateRoomCode()` - Creates cryptographically secure 5-char room codes
- `handleCreateRoom()` - Creates new room and connects
- `handleJoinRoom()` - Joins existing room
- `handleLeaveRoom()` - Disconnects and returns to join screen

---

## Hooks

### `useGameRoom` (`src/hooks/useGameRoom.ts`)

Primary hook for WebSocket connection and game actions.

**Parameters:**
```typescript
interface UseGameRoomOptions {
  roomCode: string;
  playerName: string;
}
```

**Returns:**
```typescript
{
  gameState: GameState | null;
  playerId: string | null;
  isConnected: boolean;
  error: string | null;
  
  // Actions
  startGame: (victoryCondition: VictoryCondition, deckOption: DeckOption) => void;
  submitClue: (cardId: number, clue: string) => void;
  playCard: (cardId: number) => void;
  vote: (orderId: number) => void;
  nextRound: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
  addBot: () => void;
  removeBot: (botId: string) => void;
}
```

---

## Screens

Located in `src/components/screens/`:

### `JoinScreen.tsx`

Initial screen for creating or joining rooms. Recently updated to feature the new deep-black, glassmorphism-heavy "Clues" Design System with "Mythic Buttons".

| Prop | Type | Description |
|------|------|-------------|
| `onCreateRoom` | `(playerName: string) => void` | Creates new room |
| `onJoinRoom` | `(roomCode: string, playerName: string) => void` | Joins existing room |
| `prefillRoomCode` | `string \| undefined` | Optional room code from URL params (`?room=ABC123`). When provided, the screen renders in "Invite Mode", hiding the create room options and automatically pre-filling the code. |

### `LobbyScreen.tsx`

Waiting room before game starts.

| Prop | Type | Description |
|------|------|-------------|
| `gameState` | `GameState` | Current game state |
| `currentPlayer` | `Player \| undefined` | Current player data |
| `onStartGame` | `(victoryCondition: VictoryCondition) => void` | Starts the game with chosen victory condition (host) |
| `onLeaveRoom` | `() => void` | Leaves the room |
| `onAddBot` | `() => void` | Adds bot player (host) |
| `onRemoveBot` | `(botId: string) => void` | Removes bot (host) |

### `GameScreen.tsx`

Main game interface with phase-based rendering.

| Prop | Type | Description |
|------|------|-------------|
| `gameState` | `GameState` | Current game state |
| `playerId` | `string` | Current player ID |
| `onSubmitClue` | `(cardId, clue) => void` | Submit narrator clue |
| `onPlayCard` | `(cardId) => void` | Play matching card |
| `onVote` | `(orderId) => void` | Vote for card |
| `onNextRound` | `() => void` | Advance round |
| `onRestartGame` | `() => void` | Restart game |
| `onLeaveRoom` | `() => void` | Leave room |

---

## Game Components

Located in `src/components/game/`:

| Component | Description |
|-----------|-------------|
| `AfkAlertBar.tsx` | Sticky alert bar shown when host or players are AFK |
| `GameCard.tsx` | Individual card display with selection state; uses `back_001.avif` for hidden/back-face cards |
| `ClueModal.tsx` | Universal modal for narrator to enter clue, players to select cards, and voters to cast votes |
| `ResultsView.tsx` | Round results with scores, updated to match the game's aesthetic |
| `GameOverView.tsx` | Final scores and winner |

---

## Validation

### Zod Schemas (`src/schemas/messages.ts`)

Client-side message validation before sending to server:

```typescript
import { 
  JoinRoomMessageSchema,
  SubmitClueMessageSchema,
  PlayCardMessageSchema,
  VoteMessageSchema 
} from './schemas';
```

---

## Types

### `src/types/index.ts`

Shared type definitions:

- `Card` - Card with id and imageUrl
- `Player` - Player data including hand
- `TableCard` - Card played to table
- `GamePhase` - Enum of game phases
- `GameState` - Full public game state
- `ClientMessage` - Union of client message types
- `ServerMessage` - Union of server message types

---

## Related Documentation

- [Server Documentation](./SERVER.md)
- [Message Types](./MESSAGES.md)
- [State Machine](./STATE_MACHINE.md)
