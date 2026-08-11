/**
 * [BOT] Gerenciador de bots virtuais
 *
 * Para remover: rm -rf party/bots
 */

import { PLAYER_COLORS } from '../../src/config';
import {
  type Card,
  GamePhase,
  type Player,
  type TableCard,
} from '../../src/types';
import { generateClue, pickRandom, pickRandomIndex } from './ai';

// Nomes para bots
const BOT_NAMES = ['Luna', 'Orion', 'Nova', 'Atlas', 'Vega', 'Lyra', 'Draco'];

// Estado interno do servidor (interface mínima necessária)
interface ServerState {
  phase: GamePhase;
  players: Player[];
  narratorIndex: number;
  tableCards: TableCard[];
  votes: Record<string, number>;
  deck: Card[];
}

// Callbacks para ações do jogo
interface BotCallbacks {
  submitClue: (botId: string, cardId: number, clue: string) => void;
  playCard: (botId: string, cardId: number) => void;
  vote: (botId: string, orderId: number) => void;
}

/**
 * Gerencia bots virtuais no jogo
 */
export class BotManager {
  private botCounter = 0;

  /**
   * Verifica se funcionalidade de bots está disponível
   */
  static isAvailable(): boolean {
    return true;
  }

  /**
   * Adiciona um bot ao jogo
   */
  addBot(players: Player[], usedColors: string[]): Player | null {
    // Encontra cor disponível
    const availableColors = PLAYER_COLORS.filter(
      (c) => !usedColors.includes(c),
    );
    const color =
      availableColors[0] ||
      PLAYER_COLORS[players.length % PLAYER_COLORS.length];

    // Encontra nome disponível
    const usedNames = players.map((p) => p.name);
    let botName = BOT_NAMES.find((n) => !usedNames.includes(n));
    if (!botName) {
      this.botCounter++;
      botName = `Bot${this.botCounter}`;
    }

    const bot: Player = {
      id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: botName,
      score: 0,
      hand: [],
      color,
      isConnected: true,
      isHost: false,
      isBot: true,
    };

    return bot;
  }

  /**
   * Remove um bot do jogo
   */
  removeBot(players: Player[], botId: string): Player[] {
    return players.filter((p) => p.id !== botId);
  }

  /**
   * Executa ações dos bots baseado na fase atual
   * Retorna true se alguma ação foi executada
   */
  executeBotActions(state: ServerState, callbacks: BotCallbacks): boolean {
    const bots = state.players.filter((p) => p.isBot);
    if (bots.length === 0) return false;

    let actionExecuted = false;

    switch (state.phase) {
      case GamePhase.NARRATOR_CHOOSING:
        actionExecuted = this.handleNarratorPhase(state, bots, callbacks);
        break;

      case GamePhase.OTHERS_CHOOSING:
        actionExecuted = this.handleOthersChoosingPhase(state, bots, callbacks);
        break;

      case GamePhase.VOTING:
        actionExecuted = this.handleVotingPhase(state, bots, callbacks);
        break;
    }

    return actionExecuted;
  }

  private handleNarratorPhase(
    state: ServerState,
    bots: Player[],
    callbacks: BotCallbacks,
  ): boolean {
    const narrator = state.players[state.narratorIndex];
    if (!narrator?.isBot) return false;

    // Escolhe carta aleatória
    const card = pickRandom(narrator.hand);
    if (!card) return false;

    // Gera pista
    const clue = generateClue();

    // Executa após pequeno delay para parecer mais natural
    setTimeout(
      () => {
        callbacks.submitClue(narrator.id, card.id, clue);
      },
      500 + Math.random() * 1000,
    );

    return true;
  }

  private handleOthersChoosingPhase(
    state: ServerState,
    bots: Player[],
    callbacks: BotCallbacks,
  ): boolean {
    const narrator = state.players[state.narratorIndex];
    let actionExecuted = false;

    for (const bot of bots) {
      // Pula narrador
      if (bot.id === narrator?.id) continue;

      // Verifica se já jogou
      const alreadyPlayed = state.tableCards.some(
        (tc) => tc.playerId === bot.id,
      );
      if (alreadyPlayed) continue;

      // Escolhe carta aleatória
      const card = pickRandom(bot.hand);
      if (!card) continue;

      // Delay variado para cada bot
      const delay = 800 + Math.random() * 1500;
      setTimeout(() => {
        callbacks.playCard(bot.id, card.id);
      }, delay);

      actionExecuted = true;
    }

    return actionExecuted;
  }

  private handleVotingPhase(
    state: ServerState,
    bots: Player[],
    callbacks: BotCallbacks,
  ): boolean {
    const narrator = state.players[state.narratorIndex];
    let actionExecuted = false;

    for (const bot of bots) {
      // Narrador não vota
      if (bot.id === narrator?.id) continue;

      // Verifica se já votou
      if (state.votes[bot.id] !== undefined) continue;

      // Cartas válidas para votar (não a própria)
      const validCards = state.tableCards.filter(
        (tc) => tc.playerId !== bot.id,
      );
      if (validCards.length === 0) continue;

      // Escolhe carta aleatória
      const card = pickRandom(validCards);
      if (!card) continue;

      // Delay variado
      const delay = 600 + Math.random() * 1200;
      setTimeout(() => {
        callbacks.vote(bot.id, card.orderId);
      }, delay);

      actionExecuted = true;
    }

    return actionExecuted;
  }
}
