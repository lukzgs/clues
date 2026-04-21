# Documentação do Servidor

## Visão Geral

O servidor do jogo é implementado como um servidor PartyKit em `party/server.ts`. Ele gerencia o estado do jogo, conexões de jogadores e lógica do jogo através de conexões WebSocket.

## Configurações

As configurações do servidor estão no arquivo `game.config.json` e são refletidas em `src/config.ts`.
Funcionalidades principais como os bots podem ser ativadas/desativadas através do atributo `ENABLE_BOTS` nesta configuração.

## Classe Principal: `GameServer`

```typescript
class GameServer implements Party.Server {
  private state: ServerGameState;
  private connections: Map<string, string>;  // connectionId -> playerId
  private botManager: any;
  private messageCount: Map<string, number>; // Rate limiting
  private rateLimitReset: number;
}
```

## Métodos de Ciclo de Vida

| Método | Descrição |
|--------|-----------|
| `constructor(room)` | Inicializa servidor com referência à sala |
| `onConnect(conn)` | Trata novas conexões WebSocket |
| `onClose(conn)` | Trata desconexões |
| `onMessage(message, sender)` | Roteia mensagens para handlers |

## Handlers de Mensagens

### Fase de Lobby

| Handler | Gatilho | Descrição |
|---------|---------|-----------|
| `handleJoinRoom` | `JOIN_ROOM` | Adiciona jogador à sala, atribui cor |
| `handleLeaveRoom` | `LEAVE_ROOM` | Remove jogador da sala |
| `handleStartGame` | `START_GAME` | Valida e inicia jogo (apenas host) |
| `handleAddBot` | `ADD_BOT` | Adiciona jogador IA (apenas host) |
| `handleRemoveBot` | `REMOVE_BOT` | Remove jogador IA (apenas host) |

### Fase de Jogo

| Handler | Gatilho | Descrição |
|---------|---------|-----------|
| `handleSubmitClue` | `SUBMIT_CLUE` | Narrador envia carta + dica |
| `handlePlayCard` | `PLAY_CARD` | Não-narrador joga carta |
| `handleVote` | `VOTE` | Jogador vota em uma carta |
| `handleNextRound` | `NEXT_ROUND` | Avança para próxima rodada |
| `handleRestartGame` | `RESTART_GAME` | Reseta jogo para lobby |

## Funções Utilitárias

| Função | Descrição |
|--------|-----------|
| `createDeck()` | Gera baralho de 713 cartas a partir de assets estáticos locais (`/cards/new/X.avif`) |
| `shuffle(array)` | Embaralhamento Fisher-Yates |
| `generatePlayerId()` | Cria ID único de jogador |
| `createInitialState()` | Retorna estado inicial do jogo |
| `getPublicState(playerId)` | Filtra estado para jogador específico |
| `calculateScores()` | Calcula pontuações da rodada |

## Broadcasting

| Método | Descrição |
|--------|-----------|
| `broadcastState()` | Envia estado personalizado para todos |
| `broadcast(message)` | Envia mesma mensagem para todos |
| `sendToConnection(conn, msg)` | Envia para conexão específica |
| `sendError(conn, message)` | Envia mensagem de erro |

## Recursos de Segurança

### Rate Limiting

```typescript
checkRateLimit(connId: string): boolean
```

- **Limite**: 20 mensagens por segundo por conexão
- **Janela**: Reseta a cada 1000ms
- **Ação**: Descarta silenciosamente mensagens em excesso

### Validação

- Todas as mensagens validadas com schemas Zod
- Mensagens inválidas são ignoradas silenciosamente
- Ações de jogadores validadas contra fase atual do jogo

## Sistema de Bots

O servidor integra com um gerenciador de bots em `party/bots/`:

```typescript
triggerBotActions(): void
```

Fornece callbacks para bots:
- `submitClue(botId, cardId, clue)`
- `playCard(botId, cardId)`
- `vote(botId, orderId)`

## Estrutura do Estado

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
  deck: Card[]; // Somente servidor, não enviado aos clientes
  victoryCondition: VictoryCondition; // Configurado pelo host ao iniciar
  currentRound: number; // Contador de rodadas (base 0)
}
```

## Documentação Relacionada

- [Tipos de Mensagens](./MESSAGES.md)
- [Máquina de Estados](./STATE_MACHINE.md)
- [Documentação do Cliente](./CLIENT.md)
