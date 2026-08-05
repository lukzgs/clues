# Documentação do Cliente

## Visão Geral

O frontend é uma aplicação React 19 usando TypeScript. Conecta-se ao servidor PartyKit via WebSocket e gerencia a UI do jogo. Inclui um sistema customizado e leve de Internacionalização (i18n) com suporte a Português e Inglês.

## Ponto de Entrada

### `src/App.tsx`

O ponto de entrada da aplicação. Ele envolve a aplicação com o `GameSessionProvider` e renderiza o `GameRouter`, que orquestra o roteamento com base na presença da sessão e fase do jogo:
- Exibe `JoinScreen` se nenhuma sessão ativa existir.
- Exibe tela de carregamento de conexão se estiver conectando/sincronizando.
- Exibe `LobbyScreen` ou `GameScreen` dependendo da fase de jogo atual.

---

## Provedores (Providers)

### `GameSessionProvider` (`src/providers/GameSessionProvider.tsx`)

Provedor de contexto React que gerencia o armazenamento de sessões no navegador e parâmetros de consulta de URL.

**Responsabilidades Principais:**
- Verifica e analisa o parâmetro de URL `?room=CODE` no carregamento inicial.
- Recupera, analisa e sincroniza a sessão de jogo ativa (`story-weaver:active_session`) com o `localStorage`.
- Lida automaticamente com a limpeza de sessões antigas se o usuário entrar em uma sala diferente por um link de convite.

---

### `ThemeProvider` (`src/providers/ThemeProvider.tsx`)

Provedor de contexto React que gerencia o tema visual ativo em toda a aplicação.

**Responsabilidades Principais:**
- Prove 5 predefinições de temas distintos: **Ouro Místico**, **Cristal Transparente**, **Eclipse Violeta**, **Carmim Profundo** e **Névoa Etérea**.
- Suporta nomes e descrições bilingues de temas (`pt` e `en`) sincronizados com o estado do `LanguageToggle`.
- Expõe o hook `useTheme()` para adaptação dinâmica de cores, brilhos e bordas nos componentes de UI.

---

## Design System & Showcase Page

### `DesignSystemScreen` (`src/components/design-system/DesignSystemScreen.tsx`)

Página interativa de documentação e showcase do Design System e Guia de Estilo, acessível via `/design-system` ou `/sysd`.

**Funcionalidades:**
- **Seletor de Temas ao Vivo**: Permite a troca instantânea entre os 5 temas com reatividade em tempo real de cards, botões, inputs e iluminação ambiente.
- **Alternador de Idioma no Cabeçalho**: Traduz dinamicamente todos os textos, nomes de temas e seções entre Português (PT-BR) e Inglês (EN-US).
- **7 Seções Completas**:
  1. *Cores & Superfícies*: Swatches com classes HEX, RGB e Tailwind.
  2. *Tipografia*: Testador interativo de frases em tempo real.
  3. *Sistema de Botões*: Matriz completa e playground interativo.
  4. *Controles de Formulário*: Entradas de texto, alternância de exibição de senha, selects customizados, textareas, checkboxes, radio buttons e switches.
  5. *Cards & Métricas*: Cards de estatísticas e modais de confirmação em vidro.
  6. *Notificações & Feedback*: Alertas estáticos e disparadores de toasts flutuantes.
  7. *Previews de Layout Real*: Previews das telas de Join, Lobby e as 4 fases do jogo Dixit.

---

## Hooks

### `useGameRoom` (`src/hooks/useGameRoom.ts`)

Atua como um wrapper sob o padrão **Facade**. Por baixo dos panos, ele delega a lógica de conexão para `useGameSocket` e o mapeamento de ações para `useGameActions`, expondo uma interface unificada para os componentes clientes a fim de preservar compatibilidade retroativa.

**Parâmetros:**
```typescript
interface UseGameRoomOptions {
  roomCode: string | null;
  playerName: string | null;
}
```

### `useGameSocket` (`src/hooks/game/useGameSocket.ts`)

Encapsula o ciclo de vida da conexão WebSocket e o parseamento de mensagens do servidor.

**Responsabilidades Principais:**
- Instancia o `PartySocket`.
- Ouve eventos brutos (`open`, `message`, `error`, `close`).
- Despacha eventos do servidor (`SYNC_STATE`, `ERROR`, `PLAYER_KICKED`, etc.) para estados React.
- Gerencia o tempo limite de reconexão.

### `useGameActions` (`src/hooks/game/useGameActions.ts`)

Encapsula todas as ações engatilhadas pelo jogador, validando payloads utilizando esquemas Zod antes de emitir as mensagens via socket.

**Funções Principais:**
- `startGame`, `updateSettings`, `submitClue`, `playCard`, `vote`, `nextRound`, `restartGame`, `leaveRoom`, `addBot`, `removeBot`, `kickPlayer`, `toggleSpectator`, `requestPlay`.

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
Configurações do jogo, lista de jogadores e seleção de baralho. Otimizada para mobile com um modal dedicado para configurações do host, interface localizada e lista de jogadores com rolagem interna para manter a consistência do layout em todos os dispositivos. Apresenta o sistema de design "Mythic" padronizado e um banner de aviso exibido quando um grande número de jogadores restringe as configurações do lobby.

| Prop | Tipo | Descrição |
|------|------|-----------|
| `gameState` | `GameState` | Estado atual do jogo |
| `currentPlayer` | `Player \| undefined` | Dados do jogador atual |
| `onStartGame` | `(victoryCondition: VictoryCondition) => void` | Inicia o jogo com condição de vitória escolhida (host) |
| `onLeaveRoom` | `() => void` | Sai da sala |
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
Interface principal do jogo com renderização baseada em fase. Apresenta um layout com placar flutuante lateral e disposição das cartas da mão em fileira única responsiva. Inclui um cabeçalho reformulado com grid de 3 colunas para centralização perfeita. O grid de cartas na mesa foi otimizado para acomodar até 5 cartas por linha em telas grandes, minimizando a necessidade de rolagem. A pílula de código da sala é posicionada ao lado do seletor de idioma no desktop para manter alturas alinhadas, e no mobile permanece centralizada. O layout para dispositivos móveis manipula a altura total da viewport corretamente usando unidades dinâmicas (`100dvh`), garantindo que a mão do jogador permaneça visível na parte inferior da tela, independentemente das barras de ferramentas do navegador móvel. Durante a Fase de Votação, a seleção de uma carta ativa automaticamente o ClueModal, e o indicador de votação foi estilizado para combinar com o tema e tipografia do jogo (Cinzel).

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
| `AfkAlertBar.tsx` | Uma barra sutil de progresso visual que mostra o tempo restante para a fase atual. Desaparece quando o temporizador expira. |
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
