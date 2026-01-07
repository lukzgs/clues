// ============================================
// CONFIGURAÇÕES DO JOGO
// Arquivo compartilhado entre cliente e servidor
// ============================================

export const GAME_CONFIG = {
    MIN_PLAYERS: 3,
    MAX_PLAYERS: 8,
    HAND_SIZE: 6,
    WINNING_SCORE: 30,
    DECK_SIZE: 84,
} as const;

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
