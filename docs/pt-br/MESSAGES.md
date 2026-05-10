# Tipos de Mensagens

## Visão Geral

Toda comunicação entre cliente e servidor acontece através de mensagens WebSocket tipadas. As mensagens são validadas usando schemas Zod.

---

## Mensagens Cliente → Servidor

### Enum `ClientMessageType`

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
}
```

### Definições de Mensagens

| Mensagem | Payload | Fase Válida |
|----------|---------|-------------|
| `JOIN_ROOM` | `playerName: string` | Qualquer |
| `LEAVE_ROOM` | (nenhum) | Qualquer |
| `START_GAME` | `victoryCondition: VictoryCondition, deckOption: DeckOption, phaseTimeouts: PhaseTimeouts` | LOBBY (apenas host) |
| `SUBMIT_CLUE` | `cardId: number, clue: string` | NARRATOR_CHOOSING (apenas narrador) |
| `PLAY_CARD` | `cardId: number` | OTHERS_CHOOSING (não-narradores) |
| `VOTE` | `orderId: number` | VOTING (não-narradores) |
| `NEXT_ROUND` | (nenhum) | RESULTS |
| `RESTART_GAME` | (nenhum) | GAME_OVER |
| `ADD_BOT` | (nenhum) | LOBBY (apenas host) |
| `REMOVE_BOT` | `botId: string` | LOBBY (apenas host) |
| `KICK_PLAYER` | `playerId: string` | Qualquer (apenas host) |
| `TOGGLE_SPECTATOR` | `playerId: string` | LOBBY (apenas host) |
| `REQUEST_PLAY` | (nenhum) | LOBBY (apenas espectadores) |
| `PONG_CHECK` | (nenhum) | Qualquer |

### Exemplos de Mensagens

```typescript
// Entrar em uma sala
{ type: 'JOIN_ROOM', playerName: 'Alice' }

// Enviar uma dica como narrador
{ type: 'SUBMIT_CLUE', cardId: 42, clue: 'Um sonho dentro de um sonho' }

// Iniciar jogo com condições de vitória, opção de baralho e tempos de fase
{ 
  type: 'START_GAME', 
  victoryCondition: { scoreEnabled: true, targetScore: 30, narratorRoundsEnabled: false, narratorRounds: 2 }, 
  deckOption: 'mixed',
  phaseTimeouts: { narrator: 60, othersChoosing: 45, voting: 30, results: 15 }
}

// Votar em uma carta
{ type: 'VOTE', orderId: 3 }
```

---

## Mensagens Servidor → Cliente

### Enum `ServerMessageType`

```typescript
enum ServerMessageType {
  SYNC_STATE = 'SYNC_STATE',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAYER_KICKED = 'PLAYER_KICKED',
  ERROR = 'ERROR',
}
```

### Definições de Mensagens

| Mensagem | Payload | Descrição |
|----------|---------|-----------|
| `SYNC_STATE` | `gameState: GameState, yourPlayerId: string` | Sincronização completa de estado |
| `PLAYER_JOINED` | `player: Player` (sem mão) | Notificação de jogador entrou |
| `PLAYER_LEFT` | `playerId: string, playerName: string` | Notificação de jogador saiu |
| `PLAYER_KICKED` | `playerId: string` | Notificação de jogador expulso |
| `ERROR` | `message: string, code?: string` | Notificação de erro |
| `PING_CHECK` | (nenhum) | Servidor verifica se o cliente está responsivo |
| `SERVER_CLOSING_WARNING` | `closeTime: number` | Aviso de que a sala fechará por inatividade |
| `SERVER_CLOSING_CANCELLED` | (nenhum) | Aviso de fechamento cancelado |
| `SERVER_CLOSED` | (nenhum) | Sala fechada por inatividade |

### Exemplos de Mensagens

```typescript
// Sincronização de estado
{
  type: 'SYNC_STATE',
  gameState: { /* objeto GameState */ },
  yourPlayerId: 'abc123'
}

// Erro
{
  type: 'ERROR',
  message: 'Apenas o host pode iniciar o jogo',
  code: 'NOT_HOST'
}
```

---

## Schemas Zod

Localizados em `src/schemas/messages.ts`:

```typescript
// Schemas de mensagens do cliente
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

## Fluxo de Validação

```
Cliente                         Servidor
  │                               │
  │  1. Criar mensagem            │
  │  2. Validar com Zod           │
  │  3. Enviar se válido ───────► │
  │                               │ 4. Validar com Zod
  │                               │ 5. Processar se válido
  │ ◄─────────────────────────────  6. Enviar resposta
  │  7. Atualizar UI              │
```

---

## Documentação Relacionada

- [Documentação do Servidor](./SERVER.md)
- [Documentação do Cliente](./CLIENT.md)
- [Máquina de Estados](./STATE_MACHINE.md)
