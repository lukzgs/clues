# Known Issues — Project Audit

> Cross-referencing best practices with the current state of the **Clues** project.

---

## What the Project ALREADY Does Well

| Practice | Where |
|----------|-------|
| **Schema Validation (Zod)** | All client messages are validated with Zod schemas in [src/schemas/messages.ts](src/schemas/messages.ts) and on the server |
| **TypeScript strict mode** | `tsconfig.json` has `"strict": true` |
| **Separation of Concerns** | Clear separation: `party/` (server), `src/components/` (UI), `src/hooks/` (logic), `src/types/` (contracts), `src/schemas/` (validation) |
| **Shared types between client/server** | Both import from `src/types/index.ts` — single source of truth |
| **Shared config** | `game.config.json` is shared between server and client |
| **Input Validation at Boundaries** | Server validates every message with `ClientMessageSchema.safeParse()` before processing |
| **Rate Limiting** | Server implements per-connection rate limiting (15 msg / 5s window) |
| **Fail Fast** | `src/index.tsx` throws if `#root` element is missing |
| **Reconnection support** | `useGameRoom` persists `playerId` in `sessionStorage` for reconnection |
| **XSS prevention** | `SafeString` regex in Zod blocks `<>` characters |
| **Enum-based State Machine** | `GamePhase` enum defines clear phases: LOBBY → NARRATOR_CHOOSING → OTHERS_CHOOSING → VOTING → RESULTS → GAME_OVER |
| **Comprehensive Documentation** | `docs/en/` and `docs/pt-br/` with architecture, messages, state machine, client, server, and overview docs |
| **Agent Context File** | `.agent/CONTEXT.md` for AI-assisted development |
| **Environment Example** | `.env.example` exists with documented variables |
| **Discriminated Unions** | `z.discriminatedUnion('type', [...])` for message parsing — type-safe and performant |
| **Component Composition** | Clean component hierarchy: screens → game components |

---

## What's MISSING or Could Be Improved

### 1. No Tests Whatsoever

**Severity: CRITICAL**

There are **zero test files** in the project — no `.test.ts`, no `.spec.ts`, no test runner configured. This is the single biggest gap:

- No unit tests for game logic (`calculateScores`, `shuffle`, `createDeck`)
- No integration tests for WebSocket message flows
- No component tests for React components
- No test runner (`vitest`, `jest`) in `package.json`

**What to do**:
- Add `vitest` (natural fit with Vite)
- Extract pure game logic from `server.ts` into testable functions
- Test scoring rules, victory conditions, state transitions
- Test Zod schemas with edge cases
- Test React components with `@testing-library/react`

### 2. No Linter or Formatter Configured

**Severity: HIGH**

No `.eslintrc`, `.prettierrc`, `biome.json`, or any code quality tool. This means:
- No consistent code style enforcement
- No automatic detection of common bugs
- Every developer uses their own formatting preferences
- No automated import ordering

**What to do**:
- Add ESLint with `@typescript-eslint` or Biome (faster, modern)
- Add Prettier (or Biome's formatter)
- Add `lint` and `format` scripts to `package.json`
- Consider `lint-staged` + `husky` for pre-commit hooks

### 3. No CI/CD Pipeline

**Severity: HIGH**

No `.github/workflows/`, no CI configuration of any kind. Code can be pushed in any state without automated checks.

**What to do**:
- Add GitHub Actions workflow with: type-check, lint, test, build
- Add deployment workflow for PartyKit (`partykit deploy`)
- Enforce CI checks on pull requests

### 4. No Error Boundaries in React

**Severity: MEDIUM**

The React app has no error boundaries. A runtime error in any component will crash the entire app, showing a white screen.

**What to do**:
- Add a top-level `ErrorBoundary` component wrapping `<App />`
- Add per-screen error boundaries (especially around `GameScreen`)
- Show a fallback UI with "something went wrong" and a retry button

### 5. No Accessibility (a11y) Practices

**Severity: MEDIUM-HIGH**

- Interactive SVGs without ARIA labels
- No keyboard navigation considerations visible
- No `aria-*` attributes on interactive elements
- `<div onClick>` patterns without keyboard equivalents (not visible, but likely in GameCard)
- No focus management between game phases
- No `alt` text on card images (cards use background images via CSS)

**What to do**:
- Add ARIA labels to all interactive elements
- Ensure all clickable elements are keyboard-accessible (`<button>`, `tabIndex`, `onKeyDown`)
- Add `alt` text to card images
- Test with screen readers
- Add `prefers-reduced-motion` support for animations

### 6. Server is a God Class

**Severity: MEDIUM**

`party/server.ts` is a **744-line monolithic class** that handles:
- Connection management
- Rate limiting
- Message validation and routing
- Game state management
- Score calculation
- Bot management
- State serialization (public view)
- Broadcasting

This violates SRP — there are many reasons for this class to change.

**What to do**:
- Extract `GameEngine` (pure game logic: state transitions, score calculation, victory checks)
- Extract `ConnectionManager` (connection tracking, rate limiting)
- Extract `StateSerializer` (public state view generation)
- Keep `GameServer` as a thin orchestrator (Hexagonal Architecture)
- The extracted `GameEngine` becomes trivially testable (functional core, imperative shell)

### 7. No Structured Logging

**Severity: MEDIUM**

The server uses `console.warn` and `console.error` for logging — unstructured, no levels, no correlation IDs, no context:

```typescript
console.warn('Rate limit excedido:', sender.id);
console.warn('Mensagem inválida:', parsed.error.issues);
console.error('Erro ao processar mensagem:', error);
```

**What to do**:
- Use a structured logger (even a simple one) with JSON output
- Include `roomCode`, `playerId`, `messageType` in each log entry
- Add log levels (DEBUG, INFO, WARN, ERROR)
- Add request correlation IDs for tracing message flows

### 8. No Client-Side Error Handling Strategy

**Severity: MEDIUM**

- `useGameRoom` sets error state but components don't consistently display or recover from errors
- WebSocket disconnection has no retry strategy beyond PartySocket's defaults
- No user-facing error messages for network failures during gameplay
- `console.error('Error parsing message:', e)` is silently swallowed

**What to do**:
- Add toast/notification system for transient errors
- Show persistent error states for disconnections
- Add explicit reconnection UI ("Connection lost, reconnecting...")
- Define error categories (network, validation, game logic)

### 9. Inconsistent Client-Side Validation

**Severity: LOW-MEDIUM**

Some actions validate with Zod before sending, others don't:

```typescript
// ✅ Validated
const submitClue = useCallback((cardId, clue) => {
  const result = SubmitClueSchema.safeParse({ ... });
  if (result.success) send(result.data);
});

// ❌ NOT validated
const playCard = useCallback((cardId) => {
  send({ type: ClientMessageType.PLAY_CARD, cardId }); // raw send
});

// ❌ NOT validated
const nextRound = useCallback(() => {
  send({ type: ClientMessageType.NEXT_ROUND }); // raw send
});
```

Server-side validation catches these, but the inconsistency is a code smell.

**What to do**:
- Validate ALL outgoing messages with Zod on the client
- Or explicitly decide that simple messages (no user input) don't need client validation and document this decision

### 10. No Loading/Empty States

**Severity: LOW-MEDIUM**

Components assume data is always present. No explicit handling for:
- Loading state while connecting
- Empty hand (deck exhausted)
- No players in the room
- Stale data during reconnection

**What to do**:
- Add loading skeletons/spinners
- Handle empty states with helpful UI
- Show stale data indicators during reconnection

### 11. No Internationalization (i18n)

**Severity: LOW**

Strings are hardcoded in components in a mix of English and Portuguese:

```typescript
// English in JoinScreen
setError('Choose your name first');
setError('Room code must be 6 characters');

// Portuguese in server
this.sendError(conn, 'Você já está na sala');
this.sendError(conn, 'Jogo já em andamento');
```

**What to do**:
- Choose a single primary language for user-facing strings
- Extract all strings into a translation file
- Use a lightweight i18n library (or simple key-value map for now)

### 12. No Performance Budgets

**Severity: LOW**

No bundle size limits, no build analysis, no performance monitoring. With 341 card images (`.avif`), asset loading could be a bottleneck.

**What to do**:
- Add `vite-plugin-bundle-analyzer` or similar
- Set bundle size budget in CI
- Add lazy loading for card images not in the current hand/table
- Consider preloading only visible cards

### 13. No Security Headers or CSP

**Severity: LOW**

No Content Security Policy, no security headers configured. `index.html` loads external fonts from Google without integrity checks.

**What to do**:
- Add CSP meta tag or headers
- Add `integrity` attributes to external resources
- Configure security headers (X-Frame-Options, X-Content-Type-Options)

### 14. Missing `noUncheckedIndexedAccess` in tsconfig

**Severity: LOW**

The `tsconfig.json` has `strict: true` but doesn't enable `noUncheckedIndexedAccess`. Array access like `this.state.players[this.state.narratorIndex]` could silently be `undefined` without TypeScript catching it.

**What to do**:
- Add `"noUncheckedIndexedAccess": true` to `tsconfig.json`
- Fix resulting type errors (add null checks or assertions where safe)

### 15. No ADRs (Architecture Decision Records)

**Severity: LOW**

The project has good documentation, but no ADRs explaining *why* decisions were made:
- Why PartyKit instead of Socket.io or raw WebSockets?
- Why Zod over io-ts or Yup?
- Why `.avif` for card images?
- Why in-memory state instead of durable storage?

**What to do**:
- Create `docs/adr/` directory
- Document key architectural decisions with context, decision, and consequences

---

## Summary: Priority Roadmap

| Priority | Action | Impact |
|----------|--------|--------|
| 🔴 P0 | Add test framework + game logic tests | Enables safe refactoring and feature development |
| 🔴 P0 | Add linter/formatter | Prevents bugs, enforces consistency |
| 🟡 P1 | Add CI pipeline | Catches regressions automatically |
| 🟡 P1 | Add React error boundaries | Prevents white screens in production |
| 🟡 P1 | Extract game logic from server.ts | Enables testability, reduces complexity |
| 🟡 P1 | Fix accessibility gaps | Legal compliance, usability |
| 🟢 P2 | Structured logging | Debuggability in production |
| 🟢 P2 | Consistent client validation | Code hygiene |
| 🟢 P2 | i18n setup | Scalability |
| ⚪ P3 | ADRs, performance budgets, CSP | Long-term maintainability |
