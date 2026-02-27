// ============================================
// CONFIGURAÇÕES DO JOGO
// Importado de game.config.json (compartilhado com servidor)
// ============================================

import gameConfig from '../game.config.json';

export const GAME_CONFIG = gameConfig as {
    readonly MIN_PLAYERS: number;
    readonly MAX_PLAYERS: number;
    readonly HAND_SIZE: number;
    readonly WINNING_SCORE: number;
    readonly DECK_SIZE: number;
    readonly DEFAULT_NARRATOR_ROUNDS: number;
};

// ============================================
// CORES DOS JOGADORES
// ============================================

export const PLAYER_COLORS = [
    '#ef4444', // red
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
] as const;
