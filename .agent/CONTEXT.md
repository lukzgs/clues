# Project Context for AI Agents

> **Read this file first** when starting work on this project.

## Quick Reference

| Need | Documentation |
|------|---------------|
| Quick project overview | [docs/en/OVERVIEW.md](file:///home/lukzgs/projects/clues/docs/en/OVERVIEW.md) |
| Server/backend changes | [docs/en/SERVER.md](file:///home/lukzgs/projects/clues/docs/en/SERVER.md) |
| Frontend/UI changes | [docs/en/CLIENT.md](file:///home/lukzgs/projects/clues/docs/en/CLIENT.md) |
| WebSocket messages | [docs/en/MESSAGES.md](file:///home/lukzgs/projects/clues/docs/en/MESSAGES.md) |
| Game state/flow changes | [docs/en/STATE_MACHINE.md](file:///home/lukzgs/projects/clues/docs/en/STATE_MACHINE.md) |
| Architecture decisions | [docs/en/ARCHITECTURE.md](file:///home/lukzgs/projects/clues/docs/en/ARCHITECTURE.md) |

## Key Files

| Purpose | Path |
|---------|------|
| Entry point (client) | `src/App.tsx` |
| Main server class | `party/server.ts` |
| Shared types | `src/types/index.ts` |
| WebSocket hook | `src/hooks/useGameRoom.ts` |
| Zod schemas | `src/schemas/messages.ts` |
| Game screens | `src/components/screens/` |
| Game components | `src/components/game/` |

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: PartyKit (serverless WebSocket)
- **Validation**: Zod
- **Deploy**: PartyKit Cloud

## Game Domain

- **Game Type**: Dixit-inspired multiplayer card game
- **Objective**: Guess the narrator's card based on a cryptic clue
- **Players**: 3-8 per game
- **Phases**: LOBBY → NARRATOR_CHOOSING → OTHERS_CHOOSING → VOTING → RESULTS → (repeat or GAME_OVER)

---

## ⚠️ MANDATORY: Documentation Update Policy

> [!CAUTION]
> **When modifying code, you MUST update the corresponding documentation.**

### What to Update

| Change Type | Update Required |
|-------------|-----------------|
| New message type | `MESSAGES.md` |
| New game phase | `STATE_MACHINE.md` |
| New handler | `SERVER.md` |
| New component/view | `CLIENT.md` |
| New hook | `CLIENT.md` |
| Architecture change | `ARCHITECTURE.md` |
| Any significant change | `OVERVIEW.md` (if affects summary) |

### How to Update

1. **Identify affected docs** based on the table above
2. **Update English version** in `docs/en/`
3. **Update Portuguese version** in `docs/pt-br/`
4. **Update diagrams** if flow changed (Mermaid in STATE_MACHINE.md)

> [!IMPORTANT]
> **Timing**: Documentation updates MUST be done **ONLY WHEN the user requests commits**.
> When the user asks to commit, update the documentation FIRST, then proceed with the commits.
> This ensures that only approved changes are documented.

### Checklist Template

When completing a feature, verify:

```markdown
- [ ] Code changes complete
- [ ] MESSAGES.md updated (if new messages)
- [ ] STATE_MACHINE.md updated (if state changes)
- [ ] SERVER.md updated (if backend changes)
- [ ] CLIENT.md updated (if frontend changes)
- [ ] OVERVIEW.md updated (if significant feature)
- [ ] Both EN and PT-BR versions synced
```

---

## Portuguese Documentation

Para documentação em português, consulte `docs/pt-br/`.
