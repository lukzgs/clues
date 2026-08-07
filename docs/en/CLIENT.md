# Client Documentation

## Overview

The frontend is a React 19 application using TypeScript. It connects to the PartyKit server via WebSocket and manages the game UI. It includes a custom, lightweight Internationalization (i18n) system supporting English and Portuguese.

## Entry Point

### `src/App.tsx`

The application entry point. It wraps the app with `GameSessionProvider` and renders `GameRouter`, which orchestrates routing based on the session presence and game phase:
- Displays `JoinScreen` if no active session exists.
- Displays connection loader screen if connecting/syncing.
- Displays `LobbyScreen` or `GameScreen` depending on current game phase.

---

## Providers

### `GameSessionProvider` (`src/providers/GameSessionProvider.tsx`)

A React context provider that manages browser session storage and URL query params.

**Key Responsibilities:**
- Checks and parses the URL parameter `?room=CODE` on initial load.
- Retrieves, parses, and synchronizes the active game session (`story-weaver:active_session`) with `localStorage`.
- Automatically handles clearing stale sessions if joining a different room via invite link.

---

### `ThemeProvider` (`src/providers/ThemeProvider.tsx`)

A React context provider that manages the active visual theme preset across the application.

**Key Responsibilities:**
- Provides 7 distinct theme presets: **Mystic Gold**, **Transparent Crystal**, **Violet Eclipse**, **Deep Crimson**, **Ethereal Mist**, **Illusion Mirror**, and **Hidden Guardian**.
- Configures dynamic theme tokens including `bgCanvas`, `ambientOrb`, `cardBg` (`backdrop-blur-2xl`), `innerCardBg` (`backdrop-blur-xl`), `inputBg`, `secondaryBtnBg`, `primaryGradient`, `accentText`, `accentBorder`, and `glowShadow`.
- Uses clean, neutral glass borders (`border-white/10`) for structural card containers while directing vibrant theme accents to buttons, badges, inputs, and active highlights.
- Exposes `useTheme()` hook for dynamic color, glow, and border adaptations across UI components.
- Powers the fixed ambient lighting background (`w-[700px] h-[700px] top-[20%] z-0`) shining through frosted glass panels across all screens.

---

## UI Components System

### `Button` (`src/components/ui/Button.tsx`)

Single source of truth for all buttons in the application, directly mirroring the SysD variants.

**Variants:**
- `primary`: Amber/gold or theme primary gradient CTA button.
- `glass`: Translucent glassmorphism button (`bg-white/5 border-white/10 hover:bg-white/10`).
- `outline`: Bordered button with active theme accent text.
- `destructive`: Crimson red glass button for leave/kick/destructive actions.
- `ghost`: Transparent borderless button for secondary actions.

**Sizes:** `xs`, `sm`, `md`, `lg`. Supports `isLoading`, `icon`, `iconPosition`, and standard HTML button attributes.

---

## Design System & Showcase Page

### `DesignSystemScreen` (`src/components/design-system/DesignSystemScreen.tsx`)

Interactive Design System and Style Showcase accessible via `/design-system` or `/sysd`.

**Features:**
- **Live Theme Selector Bar**: Allows instant switching between all 7 themes with real-time adaptation of cards, buttons, inputs, and background ambient lighting.
- **Header Language Toggle**: Dynamically switches all text, theme names, and section titles between Portuguese (PT-BR) and English (EN-US).
- **7 Complete Sections**:
  1. *Colors & Surfaces*: Swatches with HEX, RGB, and Tailwind classes.
  2. *Typography*: Live interactive phrase tester. Standardized on Cinzel, Playfair Display, and Inter (`tabular-nums font-sans` for scores).
  3. *Button System*: Matrix and interactive playground using `<Button>`.
  4. *Form Controls*: Text inputs, password eye toggle, custom selects, textareas, checkboxes, radio buttons, and switches.
  5. *Data Cards & Metrics*: Statistical metric cards, real screen card previews, and interactive glass modal dialogs.
  6. *Notifications & Feedback*: Static inline alerts and dynamic floating toast triggers.
  7. *Real Layout Previews*: Interactive mockups for Join Screen, full Lobby Screen (with options cards, deck selector, and player list), and all 4 Dixit gameplay phases.

---

## Hooks

### `useGameRoom` (`src/hooks/useGameRoom.ts`)

Acts as a **Facade Pattern** wrapper. Under the hood, it delegates connection logic to `useGameSocket` and actions mapping to `useGameActions`, exposing a unified hook interface to client components to preserve backward compatibility.

**Parameters:**
```typescript
interface UseGameRoomOptions {
  roomCode: string | null;
  playerName: string | null;
}
```

### `useGameSocket` (`src/hooks/game/useGameSocket.ts`)

Encapsulates WebSocket connection lifecycle and message parsing.

**Key Responsibilities:**
- Instantiates `PartySocket`.
- Listens to raw events (`open`, `message`, `error`, `close`).
- Dispatches parsed server events (`SYNC_STATE`, `ERROR`, `PLAYER_KICKED`, etc.) to React states.
- Manages reconnection timeouts.

### `useGameActions` (`src/hooks/game/useGameActions.ts`)

Encapsulates all actions triggerable by the player, validating payloads using Zod schemas before emitting them over the socket.

**Key Functions:**
- `startGame`, `updateSettings`, `submitClue`, `playCard`, `vote`, `nextRound`, `restartGame`, `leaveRoom`, `addBot`, `removeBot`, `kickPlayer`, `toggleSpectator`, `requestPlay`.

---

## Internationalization (i18n)

The application features a custom lightweight i18n system located in `src/i18n/`.

- **Translations:** Stored in `src/i18n/translations.ts` containing `en` and `pt` dictionaries.
- **Provider:** `LanguageProvider` in `src/i18n/index.tsx` wraps the app. It auto-detects the browser language (`navigator.language`) and persists the user's preference in `localStorage` under `story-weaver:lang`. It accepts an optional `initialLang` prop to force a specific language (useful for testing).
- **Hook:** Components use the `useTranslation()` hook to access the current language (`lang`), a `setLang` function, and the translation dictionary (`t`).
### `DesignSystemScreen.tsx`
Single source of truth for the entire application style guide. Organized into 7 structured sections:
1. **Color Tokens & Theme Swatches** (Hex, RGB, and Tailwind tokens for all 5 themes).
2. **Typography & Fonts Hierarchy** (Cinzel, Playfair Display, Inter, font sizes, weights, and live sample testing).
3. **Atomic UI Component Matrix** (Button System: Primary, Secondary Glass, Outline Theme, Destructive, Ghost, with interactive Playground).
4. **Form Controls & Inputs** (TextInput with active borders, Password toggle, Textarea, Pill Option Switcher, Range Sliders, and Toggle Switches).
5. **Real Screen Cards Matrix** (GameOptions Card, PlayerCard, DixitHand Card, TableVoting Card, ScoreboardRow Card, and WinnerPodium Card for direct color composition inspection).
6. **Notification, Alerts & Toast System** (Static Toast Cards Matrix + floating interactive Toast triggers and confirmation modals).
7. **Real Integrated Screen Layout Previews** (Interactive Join, Lobby with RoomCodeDisplay, and Gameplay screen mockups).

Features a sticky header with a unified **Theme Selector Dock** and a custom glassmorphic scrollbar (`custom-scrollbar`).

Initial screen for creating or joining rooms. Recently updated to feature the new deep-black, glassmorphism-heavy "Story Weaver" Design System with "Mythic Buttons".

| Prop | Type | Description |
|------|------|-------------|
| `onCreateRoom` | `(playerName: string) => void` | Creates new room |
| `onJoinRoom` | `(roomCode: string, playerName: string) => void` | Joins existing room |
| `prefillRoomCode` | `string \| undefined` | Optional room code from URL params (`?room=ABC123`). When provided, the screen renders in "Invite Mode", hiding the create room options and automatically pre-filling the code. |
| `onCancelInvite` | `(() => void) \| undefined` | Optional callback to cancel invite mode and return to the normal Join/Create room view. |

### `LobbyScreen.tsx`
Game settings, player list, and deck selection. Optimized for mobile with a dedicated host settings modal, localized interface, and a scrollable player list to maintain layout consistency across devices. Featuring the standardized "Mythic" design system and a warning banner displayed when a large player count restricts lobby configurations.
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
Main game interface with phase-based rendering. Now features a floating sidebar scoreboard, a responsive linear hand layout with hover aura effects, and a remade header using a 3-column grid system. The table cards grid has been optimized to accommodate up to 5 cards per row on large screens to minimize scrolling. The header pill containing the room code is displayed next to the language toggle in desktop view for unified header heights, and on mobile remains centered. Mobile layout handles full viewport height correctly using dynamic viewport units (`100dvh`) to guarantee the player's hand remains visible at the bottom of the screen regardless of mobile browser toolbars. During the Voting Phase, card selection automatically triggers the ClueModal, and the voting indicator is styled to match the game's theme and typography (Cinzel).

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
| `AfkAlertBar.tsx` | A subtle visual progress bar showing the remaining time for the current phase. Disappears when the timeout runs out. |
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
