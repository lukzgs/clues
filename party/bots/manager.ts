/**
 * [BOT] Virtual bot manager for game server
 */

import { PLAYER_COLORS } from '../../src/config';
import {
  type Card,
  GamePhase,
  type Player,
  type TableCard,
} from '../../src/types';
import { generateClue, pickRandom } from './ai';

// Bot names pool
const BOT_NAMES = ['Luna', 'Orion', 'Nova', 'Atlas', 'Vega', 'Lyra', 'Draco'];

// Minimum internal server state interface required for bot decisions
interface ServerState {
  phase: GamePhase;
  players: Player[];
  narratorIndex: number;
  tableCards: TableCard[];
  votes: Record<string, number>;
  deck: Card[];
}

// Callbacks for executing bot game actions
interface BotCallbacks {
  submitClue: (botId: string, cardId: number, clue: string) => void;
  playCard: (botId: string, cardId: number) => void;
  vote: (botId: string, orderId: number) => void;
}

/**
 * Manages virtual bots in game rooms
 */
export class BotManager {
  private botCounter = 0;
  private activeTimeouts: ReturnType<typeof setTimeout>[] = [];

  /**
   * Checks if bot feature is available
   */
  static isAvailable(): boolean {
    return true;
  }

  /**
   * Cancels all scheduled bot timers when phase changes or game restarts
   */
  cancelAllTimeouts() {
    for (const timer of this.activeTimeouts) {
      clearTimeout(timer);
    }
    this.activeTimeouts = [];
  }

  private scheduleTimeout(fn: () => void, delayMs: number) {
    const timer = setTimeout(() => {
      this.activeTimeouts = this.activeTimeouts.filter((t) => t !== timer);
      fn();
    }, delayMs);
    this.activeTimeouts.push(timer);
  }

  /**
   * Adds a virtual bot to the room
   */
  addBot(players: Player[], usedColors: string[]): Player | null {
    // Find available color
    const availableColors = PLAYER_COLORS.filter(
      (c) => !usedColors.includes(c),
    );
    const color =
      availableColors[0] ||
      PLAYER_COLORS[players.length % PLAYER_COLORS.length];

    // Find available name
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
   * Removes a bot from the room
   */
  removeBot(players: Player[], botId: string): Player[] {
    return players.filter((p) => p.id !== botId);
  }

  /**
   * Executes bot decisions for the current game phase
   * Returns true if any bot action was scheduled
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

    // Pick random card from hand
    const card = pickRandom(narrator.hand);
    if (!card) return false;

    // Generate clue text
    const clue = generateClue();

    // Schedule action with natural delay
    this.scheduleTimeout(
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
      // Skip narrator
      if (bot.id === narrator?.id) continue;

      // Check if already played
      const alreadyPlayed = state.tableCards.some(
        (tc) => tc.playerId === bot.id,
      );
      if (alreadyPlayed) continue;

      // Pick random card
      const card = pickRandom(bot.hand);
      if (!card) continue;

      // Schedule action with staggered delay
      const delay = 800 + Math.random() * 1500;
      this.scheduleTimeout(() => {
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
      // Narrator cannot vote
      if (bot.id === narrator?.id) continue;

      // Check if already voted
      if (state.votes[bot.id] !== undefined) continue;

      // Valid cards to vote for (cannot vote for own card)
      const validCards = state.tableCards.filter(
        (tc) => tc.playerId !== bot.id,
      );
      if (validCards.length === 0) continue;

      // Pick random valid card
      const card = pickRandom(validCards);
      if (!card) continue;

      // Schedule action with staggered delay
      const delay = 600 + Math.random() * 1200;
      this.scheduleTimeout(() => {
        callbacks.vote(bot.id, card.orderId);
      }, delay);

      actionExecuted = true;
    }

    return actionExecuted;
  }
}
