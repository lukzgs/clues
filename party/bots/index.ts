/**
 * [BOT] Módulo de bots para o servidor
 *
 * Para remover completamente os bots do projeto:
 * rm -rf party/bots
 *
 * O servidor continuará funcionando normalmente.
 */

export { generateClue, pickRandom, pickRandomIndex } from './ai';
export { BotManager } from './manager';
