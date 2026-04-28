# Story Weaver - Dixit Multiplayer

Um jogo multiplayer inspirado em Dixit, com IA integrada via Gemini.

## Estrutura do Projeto

```
src/
├── components/        # Componentes React
│   ├── ui/           # Componentes de UI reutilizáveis (Button, Input, etc)
│   ├── game/         # Componentes específicos do jogo (GameCard, PlayerHand, etc)
│   └── lobby/        # Componentes do lobby e sala de espera
├── hooks/            # Custom hooks
│   ├── useLocalGame.ts    # Lógica do jogo local (hot-seat)
│   └── useMultiplayer.ts  # Lógica multiplayer via PartyKit
├── services/         # Serviços externos
│   └── gemini.ts     # Integração com Gemini AI
├── types/            # TypeScript types e interfaces
├── constants/        # Constantes do jogo
├── party/            # Código do servidor PartyKit
│   └── server.ts     # Servidor de websocket para multiplayer
├── App.tsx           # Componente principal
└── index.tsx         # Entry point
```

## Instalação

```bash
npm install
```

## Desenvolvimento

### Jogo Local (sem multiplayer)

```bash
npm run dev
```

### Com Servidor Multiplayer

Em um terminal, inicie o servidor PartyKit:

```bash
npm run party:dev
```

Em outro terminal, inicie o cliente:

```bash
npm run dev
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
GEMINI_API_KEY=sua_chave_api_gemini
PARTYKIT_HOST=localhost:1999
```

## Deploy

### Frontend (Vite)

```bash
npm run build
```

### Servidor PartyKit

```bash
npm run party:deploy
```

## Como Jogar

1. **Lobby**: Escolha entre jogo local ou online
2. **Narrador**: O jogador da vez escolhe uma carta e cria uma dica
3. **Outros Jogadores**: Escolhem cartas que combinem com a dica
4. **Votação**: Todos tentam identificar a carta original do narrador
5. **Pontuação**: 
   - Se todos ou ninguém acertar: todos ganham 2 pontos (exceto narrador)
   - Se alguns acertarem: narrador e quem acertou ganham 3 pontos
   - Cada voto recebido = +1 ponto

## Tecnologias

- **React 19** - UI Framework
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **PartyKit** - WebSocket multiplayer em tempo real
- **Google Gemini** - IA para jogadores bots

## Roadmap

- [x] Jogo local (hot-seat)
- [x] IA com Gemini
- [x] Estrutura para multiplayer
- [ ] Multiplayer online funcional
- [ ] Salas privadas com código
- [ ] Chat durante o jogo
- [ ] Cartas personalizadas
