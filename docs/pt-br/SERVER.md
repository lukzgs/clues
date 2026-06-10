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
| `onConnect(conn)` | Trata novas conexões WebSocket. Ao reconectar, envia uma mensagem individual `SYNC_STATE` de confirmação diretamente para a conexão para restaurar o estado local. |
| `onClose(conn)` | Trata desconexões. Preserva jogadores no lobby para reconexão (agenda migração de host de 10s), e transfere o host imediatamente se desconectar durante o jogo. |
| `onMessage(message, sender)` | Roteia mensagens para handlers |
| `onAlarm()` | Trata timeouts de inatividade (aviso de 9 min, fechamento aos 10 min) |

## Handlers de Mensagens

O tratamento de mensagens é delegado a módulos especializados no diretório `party/handlers/`. A classe `GameServer` atua como uma fachada, roteando as mensagens WebSocket recebidas para esses handlers.

### Fase de Lobby

| Handler | Gatilho | Descrição |
|---------|---------|-----------|
| `handleJoinRoom` | `JOIN_ROOM` | Adiciona jogador à sala, atribui cor. Gerencia reconexão via expurgo de conexões fantasmagóricas, preserva status de host na reconexão e validação de fase. |
| `handleLeaveRoom` | `LEAVE_ROOM` | Remove jogador da sala |
| `handleStartGame` | `START_GAME` | Valida e inicia jogo (apenas host) |
| `handleAddBot` | `ADD_BOT` | Adiciona jogador IA (apenas host) |
| `handleRemoveBot` | `REMOVE_BOT` | Remove jogador IA (apenas host) |
| `handleKickPlayer` | `KICK_PLAYER` | Remove jogador da sala e fecha conexão (apenas host) |
| `handleToggleSpectator` | `TOGGLE_SPECTATOR` | Alterna jogador entre papéis de ativo e espectador (host pode alternar qualquer um, jogadores podem alternar a si mesmos) |
| `handleRequestPlay` | `REQUEST_PLAY` | Espectador solicita tornar-se um jogador ativo |

### Fase de Jogo

| Handler | Gatilho | Descrição |
|---------|---------|-----------|
| `handleSubmitClue` | `SUBMIT_CLUE` | Narrador envia carta + dica |
| `handlePlayCard` | `PLAY_CARD` | Não-narrador joga carta |
| `handleVote` | `VOTE` | Jogador vota em uma carta |
| `handleNextRound` | `NEXT_ROUND` | Marca jogador como pronto; avança para próxima rodada quando todos os jogadores ativos estão prontos |
| `handleRestartGame` | `RESTART_GAME` | Reseta jogo para lobby |

## Funções Utilitárias

| Função | Descrição |
|--------|-----------|
| `createDeck(option)` | Gera baralho dinamicamente com base na opção escolhida (`ORIGINAL`, `NEW`, ou `MIXED`) a partir de assets locais |
| `shuffle(array)` | Embaralhamento Fisher-Yates |
| `generatePlayerId()` | Cria ID único de jogador |
| `createInitialState()` | Retorna estado inicial do jogo |
| `checkResponsiveness(conn)` | Envia ping para verificar se a conexão está ativa |
| `resetInactivityTimer()` | Reseta o alarme de inatividade de 9 minutos |
| `getPublicState(playerId)` | Filtra estado para jogador específico |
| `calculateScores()` | Calcula pontuações da rodada |
| `getMaxPlayersForDeck(deckOption, victoryCondition)` | Delega para `src/utils/gameMath.ts` para calcular dinamicamente o máximo de jogadores |

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
  deckOption: DeckOption; // Opção de baralho selecionada
  currentRound: number; // Contador de rodadas (base 0)
  playersWhoReadied: string[]; // IDs dos jogadores que clicaram em "Próxima Rodada"
  phaseTimeouts: PhaseTimeouts; // Configuração de timeout para cada fase
  timerEnabled: boolean; // Flag global para habilitar/desabilitar temporizadores
}
```

## Documentação Relacionada

- [Tipos de Mensagens](./MESSAGES.md)
- [Máquina de Estados](./STATE_MACHINE.md)
- [Documentação do Cliente](./CLIENT.md)
