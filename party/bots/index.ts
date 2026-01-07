/**
 * [BOT] Módulo de bots para o servidor
 * 
 * Para remover completamente os bots do projeto:
 * rm -rf party/bots
 * 
 * O servidor continuará funcionando normalmente.
 */

export { BotManager } from './manager';
export { pickRandom, generateClue, pickRandomIndex } from './ai';
