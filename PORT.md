# Ethereal Clues

> Multiplayer card game inspired by Dixit — real-time, browser-based.

## Link
https://clues.any-pages.workers.dev/

<!-- pt -->

## Título
Ethereal Clues

## Contexto
O objetivo principal foi criar uma versão digital imersiva e acessível do clássico jogo de tabuleiro Dixit para jogar com amigos à distância. O desafio técnico consistiu em garantir a sincronização perfeita de estado entre múltiplos clientes em tempo real, orquestrando fluxos complexos de jogo como informações ocultas, votações simultâneas e transições de fase instantâneas.

## Solução
Desenvolvimento de uma plataforma multiplayer robusta usando React 19 e PartyKit. Implementei uma máquina de estados centralizada no backend que controla rigorosamente as fases da rodada (escolha de dica, seleção de cartas, votação e resultados). A solução inclui validação rigorosa de dados com Zod, suporte a bots com IA (Google Gemini) e um design dark premium com foco em experiência do usuário.

## Tecnologias
React 19, TypeScript, Vite, TailwindCSS 4, PartyKit (WebSockets), Zod, Gemini AI

## Arquitetura
Arquitetura orientada a eventos (Event-Driven) cliente-servidor via WebSockets. O servidor PartyKit atua como a única fonte da verdade, mantendo o estado da sala em memória e transmitindo atualizações parciais para os clientes. O frontend é uma SPA (Single Page Application) reativa que mapeia o estado do servidor para componentes de UI dinâmicos.

<!-- en -->

## Title
Ethereal Clues

## Context
The primary goal was to create an immersive and accessible digital version of the classic board game Dixit for playing with friends remotely. The technical challenge consisted of ensuring perfect state synchronization across multiple clients in real-time, orchestrating complex game flows such as hidden information, simultaneous voting, and instantaneous phase transitions.

## Solution
Developed a robust multiplayer platform using React 19 and PartyKit. I implemented a centralized state machine on the backend that strictly controls the round phases (clue choosing, card selection, voting, and results). The solution includes rigorous data validation with Zod, AI bot support (Google Gemini), and a premium dark design focused on user experience.

## Stack
React 19, TypeScript, Vite, TailwindCSS 4, PartyKit (WebSockets), Zod, Gemini AI

## Architecture
Event-driven client-server architecture via WebSockets. The PartyKit server acts as the single source of truth, maintaining room state in-memory and broadcasting partial updates to clients. The frontend is a reactive SPA (Single Page Application) that maps server state to dynamic UI components.
