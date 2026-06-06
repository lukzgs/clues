# Documentação do Cliente

## Visão Geral

O frontend é uma aplicação React 19 usando TypeScript. Conecta-se ao servidor PartyKit via WebSocket e gerencia a UI do jogo. Inclui um sistema customizado e leve de Internacionalização (i18n) com suporte a Português e Inglês.

## Ponto de Entrada

### `src/App.tsx`

Componente principal da aplicação gerenciando estado do app:

```typescript
type AppState =
  | { screen: 'join' }
  | { screen: 'connecting'; roomCode: string; playerName: string }
  | { screen: 'game'; roomCode: string; playerName: string };
```

**Funções Principais:**
- `generateRoomCode()` - Cria códigos de sala de 5 caracteres criptograficamente seguros
- `handleCreateRoom()` - Cria nova sala e conecta
- `handleJoinRoom()` - Entra em sala existente
- `handleLeaveRoom()` - Desconecta e retorna para tela de entrada

---

## Hooks

### `useGameRoom` (`src/hooks/useGameRoom.ts`)

Hook principal para conexão WebSocket e ações do jogo.

**Parâmetros:**
```typescript
interface UseGameRoomOptions {
  roomCode: string;
  playerName: string;
}
```

**Retorna:**
```typescript
{
  gameState: GameState | null;
  playerId: string | null;
  isConnected: boolean;
  error: string | null;
  clearError: () => void;
  roomCloseTime: number | null;
  
  // Ações
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

## Internacionalização (i18n)

A aplicação possui um sistema de i18n customizado e leve, localizado em `src/i18n/`.

- **Traduções:** Armazenadas em `src/i18n/translations.ts`, contendo os dicionários `en` e `pt`.
- **Provider:** `LanguageProvider` em `src/i18n/index.tsx` envolve o app. Ele auto-detecta o idioma do navegador (`navigator.language`) e persiste a preferência do usuário no `localStorage` sob a chave `story-weaver:lang`. Ele aceita uma prop opcional `initialLang` para forçar um idioma específico (útil para testes).
- **Hook:** Os componentes utilizam o hook `useTranslation()` para acessar o idioma atual (`lang`), a função `setLang`, e o dicionário de tradução (`t`).
- **Toggle:** O componente `<LanguageToggle />` permite aos usuários alternar entre idiomas. Ele está integrado aos cabeçalhos (headers) ou cantos superiores de todas as telas principais.

---

## Telas

Localizadas em `src/components/screens/`:

### `JoinScreen.tsx`

Tela inicial para criar ou entrar em salas. Recentemente atualizada com o novo Design System "Story Weaver", que utiliza um visual "deep-black" com fortes elementos de "glassmorfismo", tons dourados e "Botões Míticos" com tipografia serifada.

| Prop | Tipo | Descrição |
|------|------|-----------|
| `onCreateRoom` | `(playerName: string) => void` | Cria nova sala |
| `onJoinRoom` | `(roomCode: string, playerName: string) => void` | Entra em sala existente |
| `prefillRoomCode` | `string \| undefined` | Código da sala opcional proveniente dos parâmetros da URL (`?room=ABC123`). Quando fornecido, a tela é renderizada no "Modo Convite" (Invite Mode), escondendo as opções de criação e pré-preenchendo automaticamente o código. |
| `onCancelInvite` | `(() => void) \| undefined` | Callback opcional para cancelar o modo de convite e retornar ao fluxo normal de Criação/Entrada de sala. |

### `LobbyScreen.tsx`
Configurações do jogo, lista de jogadores e seleção de baralho. Otimizada para mobile com um modal dedicado para configurações do host, interface localizada e lista de jogadores com rolagem interna para manter a consistência do layout em todos os dispositivos. Apresenta o sistema de design "Mythic" padronizado.

| Prop | Tipo | Descrição |
|------|------|-----------|
| `gameState` | `GameState` | Estado atual do jogo |
| `currentPlayer` | `Player \| undefined` | Dados do jogador atual |
| `onStartGame` | `(victoryCondition: VictoryCondition) => void` | Inicia o jogo com condição de vitória escolhida (host) |
| `onLeaveRoom` | `() => void` | Sai da sala |
| `onAddBot` | `() => void` | Adiciona jogador bot (host) |
| `onRemoveBot` | `(botId: string) => void` | Remove bot (host) |
| `onKickPlayer` | `(playerId: string) => void` | Expulsa jogador (host) |
| `onToggleSpectator` | `(playerId: string) => void` | Alterna status de espectador para si mesmo (qualquer jogador) ou outros (host) |
| `onRequestPlay` | `() => void` | Solicita entrar como jogador ativo estando no modo espectador |

**Seleção do Modo Espectador:**
Os jogadores podem alternar seu status de espectador no Lobby através de:
1. Um botão explícito **"TORNAR-SE ESPECTADOR"** no painel principal de ações.
2. Um ícone de olho em seu próprio card de jogador na lista.
3. Hosts também podem alternar o status de outros jogadores via o ícone de olho nos cards deles.

Espectadores podem voltar ao jogo usando o botão **"ENTRAR COMO JOGADOR"** no painel de ações (sujeito ao limite de jogadores).


### `GameScreen.tsx`
Interface principal do jogo com renderização baseada em fase. Apresenta um layout com placar flutuante lateral e disposição das cartas da mão em fileira única responsiva. Inclui um cabeçalho reformulado com grid de 3 colunas para centralização perfeita. O grid de cartas na mesa foi otimizado para acomodar até 5 cartas por linha em telas grandes, minimizando a necessidade de rolagem. A pílula de código da sala é posicionada ao lado do seletor de idioma no desktop para manter alturas alinhadas, e no mobile permanece centralizada. O layout para dispositivos móveis manipula a altura total da viewport corretamente usando unidades dinâmicas (`100dvh`), garantindo que a mão do jogador permaneça visível na parte inferior da tela, independentemente das barras de ferramentas do navegador móvel.

## Armazenamento Local e Reconexão
O frontend salva os dados essenciais providos pelo backend no `localStorage` (sob a chave `story-weaver:active_session`, guardando `roomCode`, `playerName` e o UUID persistente `playerId`). Isso garante que os dados da sessão sobrevivam não apenas a atualizações de página (F5), mas também ao fechamento da aba ou do navegador.
Em caso de recarregamento ou reabertura, se este dado for encontrado na inicialização via AppState, a tela de entrada é contornada e o usuário se reconecta imediatamente enviando este UUID ao invés de buscar por uma nova inscrição via "Nome".
Se um jogador acessar a página com o parâmetro de convite (`?room=XXXX`) diferente da sessão salva no `localStorage`, a sessão antiga é ignorada e limpa para evitar conflitos.

| Prop | Tipo | Descrição |
|------|------|-----------|
| `gameState` | `GameState` | Estado atual do jogo |
| `playerId` | `string` | ID do jogador atual |
| `roomCloseTime` | `number \| null` | Tempo para o fechamento da sala |
| `onSubmitClue` | `(cardId, clue) => void` | Enviar dica do narrador |
| `onPlayCard` | `(cardId) => void` | Jogar carta |
| `onVote` | `(orderId) => void` | Votar em carta |
| `onNextRound` | `() => void` | Avançar rodada |
| `onRestartGame` | `() => void` | Reiniciar jogo |
| `onLeaveRoom` | `() => void` | Sair da sala |
| `onKickPlayer` | `(playerId: string) => void` | Expulsa jogador (host) |

---

## Componentes do Jogo

Localizados em `src/components/game/`:

| Componente | Descrição |
|------------|-----------|
| `AfkAlertBar.tsx` | Barra de alerta flutuante mostrada quando o host ou jogadores estão AFK. Apresenta um design refinado com brilho de borda e glassmorfismo. |
| `RoomTimeoutBar` | Componente interno da GameScreen que mostra uma contagem regressiva quando a sala está prestes a fechar por inatividade. |
| `GameCard.tsx` | Exibição de carta individual com estado de seleção; usa `back_001.avif` para cartas ocultas/verso. Inclui a prop `dimWhenDisabled` (padrão true) que pode ser configurada como false para reter a visibilidade/opacidade total quando a carta está desabilitada. |
| `ClueModal.tsx` | Modal universal aprimorado com design de vidro profundo (glassmorphism), gradientes radiais e cartas em tamanho expandido para facilitar a visualização e interação. |
| `ResultsView.tsx` | Pontuações da rodada; exibe apenas os votos recebidos por cada carta; requer que todos os jogadores ativos cliquem em "Próxima Rodada" (que muda o texto para "Finalizar Jogo" na última rodada). O layout foi otimizado com botões de ação posicionados diretamente abaixo das cartas, seguidos pelo placar. |
| `KickConfirmModal.tsx` | Modal de confirmação para o host expulsar jogadores |
| `LeaveConfirmModal.tsx` | Modal de confirmação para que os jogadores saiam da sessão de jogo com segurança |
| `GameOverView.tsx` | Pontuações finais e vencedor |

---

## Configuração de Deploy

### Variáveis de Ambiente
O cliente utiliza `VITE_PARTYKIT_HOST` para determinar o endereço do servidor WebSocket.
- **Desenvolvimento**: O padrão é `localhost:1999`.
- **Produção**: Deve ser configurada na plataforma de deploy (ex: Cloudflare Pages).

### Configuração no Cloudflare Pages
O cliente utiliza `VITE_PARTYKIT_HOST` para determinar o endereço do servidor WebSocket.
- **Desenvolvimento**: O padrão é `localhost:1999`.
- **Produção**: O padrão é `story-weaver-party.lukzgs.partykit.dev` caso a variável de ambiente não seja configurada explicitamente.

### Tratamento de Erros
A aplicação possui uma interface de erro unificada para problemas de conexão e erros de validação.
- **Queda de Conexão**: Um banner de desconexão persistente sobrepõe as telas de jogo e lobby quando a conexão WebSocket cai, mostrando o estado "Tentando reconectar...".
- **Erros de Servidor**: Toasts de erro temporários aparecem para erros do servidor (ex: rate limit, ações inválidas) e desaparecem automaticamente após 5 segundos. A tela de erro de conexão no `App.tsx` foi polida para corresponder ao estilo sutil "flutuante" dos erros de validação da `JoinScreen`.

---

## Validação

### Schemas Zod (`src/schemas/messages.ts`)

Validação de mensagens do lado do cliente antes de enviar ao servidor:

```typescript
import { 
  JoinRoomMessageSchema,
  SubmitClueMessageSchema,
  PlayCardMessageSchema,
  VoteMessageSchema 
} from './schemas';
```

---

## Tipos

### `src/types/index.ts`

Definições de tipos compartilhados:

- `Card` - Carta com id e imageUrl
- `Player` - Dados do jogador incluindo mão
- `TableCard` - Carta jogada na mesa
- `GamePhase` - Enum das fases do jogo
- `GameState` - Estado público completo do jogo
- `ClientMessage` - União de tipos de mensagens do cliente
- `ServerMessage` - União de tipos de mensagens do servidor

---

## Documentação Relacionada

- [Documentação do Servidor](./SERVER.md)
- [Tipos de Mensagens](./MESSAGES.md)
- [Máquina de Estados](./STATE_MACHINE.md)
