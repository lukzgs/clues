# Ethereal Clues

> Multiplayer card game inspired by Dixit — real-time, browser-based.

## Link
https://clues.any-pages.workers.dev/

<!-- pt -->

## Título
Ethereal Clues

## Contexto
Criação de uma versão digital imersiva do clássico jogo de tabuleiro Dixit. O foco técnico foi a implementação de sincronização de estado de alta fidelidade em tempo real, gerenciando fluxos complexos como informações ocultas, votações simultâneas e transições de fase assíncronas.

## Solução
Plataforma multiplayer desenvolvida com React 19 e PartyKit. Utiliza uma máquina de estados centralizada no servidor para controle rigoroso das rodadas, validação de dados com Zod e suporte a oponentes de IA (Gemini), tudo sob uma interface dark com estética premium.

## Tecnologias
React 19, TypeScript, Vite, TailwindCSS 4, PartyKit (WebSockets), Zod, Gemini AI

## Arquitetura
Arquitetura orientada a eventos via WebSockets (PartyKit), onde o servidor mantém a verdade única do estado em memória. O frontend SPA reage instantaneamente às transmissões de estado, garantindo uma experiência fluida e sincronizada entre todos os clientes.

<!-- en -->

## Title
Ethereal Clues

## Context
Digital recreation of the board game Dixit. The technical focus was implementing high-fidelity real-time state synchronization, managing complex flows such as hidden information, simultaneous voting, and asynchronous phase transitions.

## Solution
Multiplayer platform built with React 19 and PartyKit. It features a centralized server-side state machine for round control, Zod data validation, and AI bot support (Gemini), delivered through a premium dark-themed interface.

## Stack
React 19, TypeScript, Vite, TailwindCSS 4, PartyKit (WebSockets), Zod, Gemini AI

## Architecture
Event-driven architecture via WebSockets (PartyKit) with the server acting as the single source of truth. The SPA frontend reacts instantly to state broadcasts, ensuring a fluid and synchronized experience across all clients.
