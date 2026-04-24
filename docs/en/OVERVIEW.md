# Story Weaver - Project Overview

## Description

**Story Weaver** is a multiplayer card game inspired by Dixit, built with React and PartyKit WebSockets. Players take turns as the narrator, giving cryptic clues about their chosen card while others try to guess which card belongs to the narrator.

## Current Development Status

| Feature | Status |
|---------|--------|
| Multiplayer rooms | ✅ Complete |
| Real-time WebSocket sync | ✅ Complete |
| Game phases (6 states) | ✅ Complete |
| Scoring system | ✅ Complete |
| Bot players | ✅ Complete |
| Zod validation | ✅ Complete |
| Rate limiting | ✅ Complete |
| Internationalization | 🚧 Partial |
| Static card deck (341 cards) | ✅ Complete |
| Spectator Mode | ✅ Complete |
| Host Administration (Kick) | ✅ Complete |
| In-game chat | ❌ Not started |

## Project Structure

```
clues/
├── src/                    # Frontend (React)
│   ├── App.tsx             # Main app component
│   ├── components/
│   │   ├── game/           # Game UI components (9)
│   │   └── screens/        # App screens (3)
│   ├── hooks/              # React hooks
│   │   └── useGameRoom.ts  # WebSocket connection
│   ├── types/              # TypeScript types
│   └── schemas/            # Zod validation schemas
├── party/                  # Backend (PartyKit)
│   ├── server.ts           # Main server class
│   └── bots/               # Bot AI logic
├── docs/                   # Documentation
│   ├── en/                 # English
│   └── pt-br/              # Portuguese
├── tests/                  # Test suites
│   ├── schemas/            # Zod schema tests
│   ├── screens/            # React component tests
│   ├── server/             # Game logic tests
│   └── helpers/            # Test utilities
└── .agent/                 # AI agent context
```

## Game Flow

1. **Lobby**: Players join a room with a code
2. **Narrator Choosing**: Current narrator picks a card and writes a clue
3. **Others Choosing**: Other players pick cards matching the clue
4. **Voting**: Everyone votes on which card is the narrator's
5. **Results**: Scores are calculated and displayed
6. **Repeat or Game Over**: Next round or winner declared

## Key Technologies

- **React 19** - UI framework with hooks
- **TypeScript** - Static typing
- **Vite** - Build tool and dev server
- **PartyKit** - Serverless WebSocket infrastructure
- **Zod** - Runtime schema validation
- **Vitest** - Fast unit and component testing framework

## Limits

- **Active Players**: 6 (Original deck), 10 (Mixed deck)
- **Total Connections**: 20 (Players + Spectators)

## Related Documentation

- [Server Documentation](./SERVER.md)
- [Client Documentation](./CLIENT.md)
- [Message Types](./MESSAGES.md)
- [State Machine](./STATE_MACHINE.md)
- [Architecture](./ARCHITECTURE.md)
