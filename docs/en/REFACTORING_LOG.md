# Story Weaver — Audit and Refactoring Session

**Date**: 2026-08-11  
**Scope**: Quality evaluation, issue mapping, and first round of improvements

---

## 1. Where It All Started — The Audit Report

The session began with a full project evaluation request. The goal was to check whether best practices were being applied, identify vulnerabilities, and map areas for improvement.

The analysis covered all relevant files:

- [`party/server.ts`](../../../party/server.ts) — main server (PartyKit)
- [`party/handlers/`](../../../party/handlers/) — domain handlers
- [`party/game-logic.ts`](../../../party/game-logic.ts) — pure game logic
- [`src/hooks/`](../../../src/hooks/) — React hooks (WebSocket, actions)
- [`src/schemas/messages.ts`](../../../src/schemas/messages.ts) — Zod validation
- [`src/providers/`](../../../src/providers/) — context providers
- `package.json`, `tsconfig.json`, `vite.config.ts`, `game.config.json`

Commands run during analysis:
- `npx tsc --noEmit` → zero errors
- `npx vitest run` → 1237/1238 tests passing (1 pre-existing CSS failure, unrelated to logic)

### What Was Already Good

The project showed a solid foundation:

- **TypeScript strict** enabled, zero `noEmit` errors
- **Zod validation** on 100% of client messages via `ClientMessageSchema` (discriminated union)
- **Server-side sanitization** of numeric inputs (`settings-sanitizer.ts`)
- **Rate limiting** per connection (15 messages / 5 seconds)
- **Per-player state filtering** in `getPublicState()` — players can't see each other's hands, votes hidden during VOTING
- **Room code generated with `crypto.getRandomValues()`** — cryptographically secure
- **Pure, testable logic** in `game-logic.ts` — stateless functions with no side effects
- **Domain-organized handlers** — `room`, `game`, `spectator`, `afk`, `bot`
- **Double validation** (client + server) before any game action
- **Persistent session** with reconnection support via localStorage
- **Decoupled telemetry** with pull model and ring-buffer event log

### What Was Found to Be Problematic

The report identified 3 vulnerabilities and several code quality issues:

#### Security
| Severity | Problem |
|---|---|
| 🔴 High | Metrics endpoint with hardcoded fallback token `"dev-secret-token"` |
| 🟡 Medium | Reconnection accepts any `reconnectId` without secret validation |
| 🟡 Medium | Dynamic `require()` with `@ts-ignore` for the bot system |
| 🟢 Low | `"Access-Control-Allow-Origin": "null"` on the metrics endpoint |

#### Architecture
| Problem | Location |
|---|---|
| **God Object** — 15 bridge methods + 4 utility bridges in `server.ts` | `party/server.ts` lines 404-502 |
| Duplicate import of `GAME_CONFIG` | `party/game-logic.ts` lines 17 and 190 |
| Inline state migration in `getPublicState()`, running on every call | `party/server.ts` |
| `setTimeout` in bots without cancellation on phase change | `party/bots/manager.ts` |

#### Code / DX
| Problem | Location |
|---|---|
| Unnecessary `(p: any)` cast | `src/App.tsx:205` |
| `const msg: any = rawMsg` without type validation | `src/hooks/game/useGameSocket.ts:107` |
| `globalRegistry` singleton instantiated with `as any` | `party/registry.ts:187` |
| Test failing due to CSS class coupling | `tests/screens/LobbyScreen.test.tsx:118` |
| No ESLint/Biome configured | — |
| No `.env.example` documenting required variables | — |

---

## 2. The Improvement Plan

Based on the report, a 4-phase plan was proposed, prioritized by severity and impact:

- **Phase 1 — Critical Security**: `reconnectSecret`, hardcoded token removal, CORS fix
- **Phase 2 — Code Quality**: typed bots with dynamic `import()`, `any` elimination, duplicate import
- **Phase 3 — Tests & DX**: ESLint/Biome, `.env.example`, failing test fix
- **Phase 4 — Architecture (Future)**: bot timer cancellation, state migration, comment language consistency

### Why Not Start with Security?

The decision to address the **God Object** before security fixes was deliberate:

> Phase 1 fixes (such as adding `reconnectSecret`) would **add more bridge methods** to `server.ts`, worsening the structural problem. It's better to clean the foundation before building on top of it — refactoring later means moving code that was just written.

---

## 3. The God Object Refactoring

### The Problem in Detail

[`server.ts`](../../../party/server.ts) had an unnecessary three-layer pattern for every incoming message:

```
onMessage → switch/case → this.handleXxx() [bridge] → importedHandler(this, ...)
```

The **bridge methods** were class methods on `GameServer` that did nothing but call the already-imported real function, passing `this` as an argument:

```typescript
// Example bridge — 100% boilerplate
public handleSubmitClue(playerId: string, cardId: number, clue: string) {
  return handleSubmitClue(this, playerId, cardId, clue);  // ← calls the imported function
}
```

There were **15 message bridges** + **4 utility bridges** (`calculateScores`, `checkPhaseProgression`, `triggerBotActions`, `getAfkPlayers`), totaling ~95 lines of code that did nothing but redirect calls.

### Cross-Handler Dependencies via Server

Beyond the message bridges, handlers were calling other handlers **through the server as an intermediary**, creating an unnecessary circular dependency graph:

| Handler | Called | Via |
|---|---|---|
| `bot.ts` | `handleSubmitClue`, `handlePlayCard`, `handleVote` | `server.handleXxx()` → bridge → real function |
| `spectator.ts` | `handleNextRound`, `checkPhaseProgression` | `server.handleXxx()` → bridge → real function |
| `game.ts` | `triggerBotActions`, `calculateScores` | `server.handleXxx()` → bridge → real function |
| `afk.ts` | `triggerBotActions`, `calculateScores` | `server.handleXxx()` → bridge → real function |

### Design Decision: Keep the switch/case

An alternative considered was replacing the `switch/case` with a **handler registry** (type → function map). This approach was **discarded** for the following reasons:

1. The `switch/case` with Zod discriminated union provides **automatic type narrowing** — inside each `case`, TypeScript knows exactly which fields exist on the message (`msg.cardId`, `msg.clue`, etc.)
2. A registry map would lose this narrowing, requiring manual casts or complex generic types
3. The real problem was not the switch/case — it was the **bridges** it called

The solution was surgical: **keep the switch/case, remove the bridges**.

### Analysis: Which Methods Were Legitimate

Before removing anything, a full analysis was done to distinguish bridges from methods with actual logic:

**Removed (pure bridges):**
`handleJoinRoom`, `handleLeaveRoom`, `handleUpdateSettings`, `handleStartGame`, `handleSubmitClue`, `handlePlayCard`, `handleVote`, `handleNextRound`, `handleRestartGame`, `handleKickPlayer`, `handleToggleSpectator`, `handleRequestPlay`, `handleAddBot`, `handleRemoveBot`, `handleVoteKickAfk`, `calculateScores` (bridge), `checkPhaseProgression` (bridge), `triggerBotActions` (bridge), `getAfkPlayers` (bridge)

**Kept (own logic):**

| Method | Reason |
|---|---|
| `changePhase()` | Mutates state + resets fields + notifies registry |
| `broadcastState()` | Iterates all connections and filters state per player |
| `broadcast()` | Serializes and sends to all connections |
| `sendToConnection()` | Sends to a specific connection |
| `sendError()` | Semantic error message wrapper |
| `getPublicState()` | State filtering + inline migration |
| `getMaxPlayersForDeck()` | Delegates to utility |
| `createInitialState()` | Initial state factory |
| `notifyRegistry()` | Communication with the global registry |
| `resetInactivityTimer()` | Manages the PartyKit inactivity alarm |

### What Changed in Each File

**[`party/handlers/afk.ts`](../../../party/handlers/afk.ts)**  
Now imports `calculateScores` from `./game` and `triggerBotActions` from `./bot` directly, instead of calling through `server`.

**[`party/handlers/game.ts`](../../../party/handlers/game.ts)**  
Now imports `triggerBotActions` from `./bot` directly. `calculateScores` was already defined in the same file, so `server.calculateScores()` became `calculateScores(server)`.

**[`party/handlers/bot.ts`](../../../party/handlers/bot.ts)**  
Callbacks passed to `BotManager` now call `handleSubmitClue`, `handlePlayCard` and `handleVote` from `./game` directly, eliminating 9 lines of nested arrow functions.

**[`party/handlers/spectator.ts`](../../../party/handlers/spectator.ts)**  
Now imports `handleNextRound` from `./game` and `checkPhaseProgression` from `./afk` directly.

**[`party/server.ts`](../../../party/server.ts)**  
- switch/case: `this.handleXxx(...)` → `handleXxx(this, ...)`
- "HANDLERS DELEGATION BRIDGES" block (19 methods, ~95 lines): removed
- `changePhase()` restored as a class method (it was mixed in with the bridges block)
- Imports cleaned: removed `calculateScores`, `checkPhaseProgression`, `triggerBotActions`, `getAfkPlayers`, `PhaseTimeouts`; `DeckOption` kept (used in `getMaxPlayersForDeck()`)

### Measurable Result

| Metric | Before | After |
|---|---|---|
| Lines in `server.ts` | 599 | 508 |
| Bridge methods | 19 | 0 |
| `server.handleXxx` calls in handlers | 8 | 0 |
| TypeScript errors | 0 | 0 |
| Tests passing | 1237/1238 | 1237/1238 |
| Files modified | — | 5 |

### Why Tests Didn't Break

Before executing, a `grep` confirmed that **no test calls bridge methods directly**. All server tests use `server.onMessage()` with JSON payloads, or test pure functions from `game-logic.ts`. The public server interface consumed by tests was not changed.

---

## 4. Next Steps

With the foundation clean, the following phases can proceed without introducing more boilerplate:

### Phase 1 — Security (completed)
- [x] **1.1** Add `reconnectSecret` to prevent session hijacking
- [x] **1.2** Remove `"dev-secret-token"` fallback from the metrics endpoint
- [x] **1.3** Fix CORS header on the metrics endpoint

### Phase 2 — Code Quality (completed)
- [x] **2.1** Replace `require()` with typed ES import for `BotManager`
- [x] **2.2** Remove duplicate `GAME_CONFIG` import in `game-logic.ts`
- [x] **2.3** Eliminate `any` in `App.tsx` and `useGameSocket.ts`
- [x] **2.4** Fix `globalRegistry` singleton typing

### Phase 3 — Tests & DX (in progress)
- [x] **3.1** Fix failing test caused by CSS class coupling
- [ ] **3.2** Configure ESLint/Biome
- [x] **3.3** Create `.env.example`

### Phase 4 — Architecture (Future)
- [ ] **4.1** Cancel bot timeouts on phase change
- [ ] **4.2** Move state migration out of `getPublicState()`
- [ ] **4.3** Standardize comment language across the codebase
