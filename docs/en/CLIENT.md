# Client Documentation

## Overview

The frontend is a React 19 application using TypeScript. It connects to the PartyKit server via WebSocket and manages the game UI. It includes a custom, lightweight Internationalization (i18n) system supporting English and Portuguese.

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
  clearError: () => void;
  roomCloseTime: number | null;
  
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
  kickPlayer: (playerId: string) => void;
  toggleSpectator: (playerId: string) => void;
  requestPlay: () => void;
}
```

---

## Internationalization (i18n)

The application features a custom lightweight i18n system located in `src/i18n/`.

- **Translations:** Stored in `src/i18n/translations.ts` containing `en` and `pt` dictionaries.
- **Provider:** `LanguageProvider` in `src/i18n/index.tsx` wraps the app. It auto-detects the browser language (`navigator.language`) and persists the user's preference in `localStorage` under `story-weaver:lang`. It accepts an optional `initialLang` prop to force a specific language (useful for testing).
- **Hook:** Components use the `useTranslation()` hook to access the current language (`lang`), a `setLang` function, and the translation dictionary (`t`).
- **Toggle:** The `<LanguageToggle />` component allows users to switch between languages. It is integrated into the headers or top corners of all major screens.

---

## Screens

Located in `src/components/screens/`:

### `JoinScreen.tsx`

Initial screen for creating or joining rooms. Recently updated to feature the new deep-black, glassmorphism-heavy "Story Weaver" Design System with "Mythic Buttons".

| Prop | Type | Description |
|------|------|-------------|
| `onCreateRoom` | `(playerName: string) => void` | Creates new room |
| `onJoinRoom` | `(roomCode: string, playerName: string) => void` | Joins existing room |
| `prefillRoomCode` | `string \| undefined` | Optional room code from URL params (`?room=ABC123`). When provided, the screen renders in "Invite Mode", hiding the create room options and automatically pre-filling the code. |
| `onCancelInvite` | `(() => void) \| undefined` | Optional callback to cancel invite mode and return to the normal Join/Create room view. |

### `LobbyScreen.tsx`
Game settings, player list, and deck selection. Optimized for mobile with a dedicated host settings modal, localized interface, and a scrollable player list to maintain layout consistency across devices. Featuring the standardized "Mythic" design system.
| Prop | Type | Description |
|------|------|-------------|
| `gameState` | `GameState` | Current game state |
| `currentPlayer` | `Player \| undefined` | Current player data |
| `onStartGame` | `(victoryCondition: VictoryCondition) => void` | Starts the game with chosen victory condition (host) |
| `onLeaveRoom` | `() => void` | Leaves the room |
| `onRemoveBot` | `(botId: string) => void` | Removes bot (host) |
| `onKickPlayer` | `(playerId: string) => void` | Kicks player (host) |
| `onToggleSpectator` | `(playerId: string) => void` | Toggles spectator status for self (any player) or others (host) |
| `onRequestPlay` | `() => void` | Requests to join as an active player from spectator mode |

**Spectator Mode Selection:**
Players can toggle their spectator status in the Lobby via:
1. An explicit **"BECOME SPECTATOR"** button in the main actions panel.
2. An eye icon on their own player card in the list.
3. Hosts can also toggle other players' status via an eye icon on their cards.

Spectators can rejoin the game using the **"JOIN AS PLAYER"** button in the actions panel (subject to player limits).

### `GameScreen.tsx`
Main game interface with phase-based rendering. Now features a floating sidebar scoreboard, a responsive linear hand layout with hover aura effects, and a remade header using a 3-column grid system. The table cards grid has been optimized to accommodate up to 5 cards per row on large screens to minimize scrolling. The header pill containing the room code is displayed next to the language toggle in desktop view for unified header heights, and on mobile remains centered. Mobile layout handles full viewport height correctly using dynamic viewport units (`100dvh`) to guarantee the player's hand remains visible at the bottom of the screen regardless of mobile browser toolbars.

## Local Storage & Reconnection
The client stores connection state inside `localStorage` (key: `story-weaver:active_session` holding `roomCode`, `playerName` and the `playerId` UUID generated by the backend). This ensures that session data survives not only page refreshes but also closing the tab or browser.
When the app reloads, it automatically bypasses the `JoinScreen`, injects the `reconnectId`, and immediately resumes the player's active state.
If a user accesses the page with an invite query parameter (`?room=XXXX`) that differs from the stored session, the stored session is ignored and cleared to avoid conflicts.

| Prop | Type | Description |
|------|------|-------------|
| `gameState` | `GameState` | Current game state |
| `playerId` | `string` | Current player ID |
| `roomCloseTime` | `number \| null` | Time when room will close |
| `onSubmitClue` | `(cardId, clue) => void` | Submit narrator clue |
| `onPlayCard` | `(cardId) => void` | Play matching card |
| `onVote` | `(orderId) => void` | Vote for card |
| `onNextRound` | `() => void` | Advance round |
| `onRestartGame` | `() => void` | Restart game |
| `onLeaveRoom` | `() => void` | Leave room |
| `onKickPlayer` | `(playerId: string) => void` | Kicks player (host) |

---

## Game Components

Located in `src/components/game/`:

| Component | Description |
|-----------|-------------|
| `AfkAlertBar.tsx` | Sticky alert bar shown when host or players are AFK. Features a refined design with border-glow and glassmorphism effects. |
| `RoomTimeoutBar` | Component inside GameScreen that shows a countdown when the room is about to close due to inactivity. |
| `LobbyScreen.tsx` | Game settings, player list, and deck selection. Features a standardized "Mythic" design system with polished typography and full Portuguese localization for the interface. |
| `GameCard.tsx` | Individual card display with selection state; uses `back_001.avif` for hidden/back-face cards. Includes a `dimWhenDisabled` prop (defaults to true) which can be set to false to retain full card visibility/opacity when the card is in a disabled state. |
| `ClueModal.tsx` | Universal modal for narrator to enter clue, players to select cards, and voters to cast votes. Features an enhanced glassmorphism UI with radial depth and expanded card sizing. |
| `ResultsView.tsx` | Round results with scores; only displays received votes for each card; requires all active players to click "Next Round" (labeled "Finish Game" on the final round). The layout is optimized with action buttons placed directly below the cards, followed by the scoreboard. |
| `KickConfirmModal.tsx` | Confirmation modal for host to kick players |
| `LeaveConfirmModal.tsx` | Confirmation modal for players to safely leave the game session |
| `GameOverView.tsx` | Final scores and winner |

---

## Deployment Configuration

### Environment Variables
The client uses `VITE_PARTYKIT_HOST` to determine the WebSocket server address.
- **Development**: Defaults to `localhost:1999`.
- **Production**: Must be set in the deployment platform (e.g., Cloudflare Pages).

### Cloudflare Pages Configuration
The client uses `VITE_PARTYKIT_HOST` to determine the WebSocket server address.
- **Development**: Defaults to `localhost:1999`.
- **Production**: Defaults to `story-weaver-party.lukzgs.partykit.dev` if the environment variable is not explicitly set.

### Error Handling
The application features a unified error UI for connection issues and validation errors.
- **Connection Loss**: A persistent disconnect banner overlays the game and lobby screens when the WebSocket connection drops, showing a "Trying to reconnect..." state.
- **Server Errors**: Transient error toasts appear for server errors (e.g. rate limit, invalid actions) and auto-dismiss after 5 seconds. The connection error screen in `App.tsx` has been polished to match the subtle "floating" style of the `JoinScreen` validation errors.

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
