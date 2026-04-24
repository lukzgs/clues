# Ethereal Clues - Visão Geral do Projeto

## Descrição

**Ethereal Clues** é um jogo de cartas multiplayer inspirado em Dixit, construído com React e WebSockets via PartyKit. Os jogadores se revezam como narrador, dando dicas enigmáticas sobre a carta escolhida enquanto os outros tentam adivinhar qual carta pertence ao narrador.

## Status de Desenvolvimento Atual

| Funcionalidade | Status |
|----------------|--------|
| Salas multiplayer | ✅ Completo |
| Sincronização WebSocket em tempo real | ✅ Completo |
| Fases do jogo (6 estados) | ✅ Completo |
| Sistema de pontuação | ✅ Completo |
| Jogadores bot | ✅ Completo |
| Validação com Zod | ✅ Completo |
| Rate limiting | ✅ Completo |
| Internacionalização | 🚧 Parcial |
| Baralho de cartas estático (341 cartas) | ✅ Completo |
| Modo Espectador | ✅ Completo |
| Administração do Host (Expulsar) | ✅ Completo |
| Chat no jogo | ❌ Não iniciado |

## Estrutura do Projeto

```
clues/
├── src/                    # Frontend (React)
│   ├── App.tsx             # Componente principal
│   ├── components/
│   │   ├── game/           # Componentes do jogo (9)
│   │   └── screens/        # Telas do app (3)
│   ├── hooks/              # React hooks
│   │   └── useGameRoom.ts  # Conexão WebSocket
│   ├── types/              # Tipos TypeScript
│   └── schemas/            # Schemas de validação Zod
├── party/                  # Backend (PartyKit)
│   ├── server.ts           # Classe principal do servidor
│   └── bots/               # Lógica de IA dos bots
├── docs/                   # Documentação
│   ├── en/                 # Inglês
│   └── pt-br/              # Português
├── tests/                  # Suítes de testes
│   ├── schemas/            # Testes de validação Zod
│   ├── screens/            # Testes de componentes React
│   ├── server/             # Testes de lógica do jogo
│   └── helpers/            # Utilitários de teste
└── .agent/                 # Contexto para agentes de IA
```

## Fluxo do Jogo

1. **Lobby**: Jogadores entram na sala com um código
2. **Narrador Escolhendo**: Narrador atual seleciona uma carta e escreve uma dica
3. **Outros Escolhendo**: Outros jogadores selecionam cartas que combinam com a dica
4. **Votação**: Todos votam em qual carta é a do narrador
5. **Resultados**: Pontuações são calculadas e exibidas
6. **Repetir ou Fim**: Próxima rodada ou vencedor declarado

## Tecnologias Principais

- **React 19** - Framework de UI com hooks
- **TypeScript** - Tipagem estática
- **Vite** - Ferramenta de build e servidor dev
- **PartyKit** - Infraestrutura WebSocket serverless
- **Zod** - Validação de schemas em runtime
- **Vitest** - Framework rápido para testes unitários e de componentes

## Limites

- **Jogadores Ativos**: 6 (Baralho Original), 10 (Baralho Misto)
- **Total de Conexões**: 20 (Jogadores + Espectadores)

## Documentação Relacionada

- [Documentação do Servidor](./SERVER.md)
- [Documentação do Cliente](./CLIENT.md)
- [Tipos de Mensagens](./MESSAGES.md)
- [Máquina de Estados](./STATE_MACHINE.md)
- [Arquitetura](./ARCHITECTURE.md)
