import { Card } from '../types';

// ============================================
// CONFIGURAÇÕES DO JOGO
// ============================================

export const GAME_CONFIG = {
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 8,
  HAND_SIZE: 6,
  WINNING_SCORE: 30,
  DECK_SIZE: 84,
} as const;

// ============================================
// DECK DE CARTAS
// ============================================

// Usando picsum.photos com seeds para imagens consistentes
export const INITIAL_DECK: Card[] = Array.from(
  { length: GAME_CONFIG.DECK_SIZE }, 
  (_, i) => ({
    id: i + 1,
    imageUrl: `https://picsum.photos/seed/clues-${i + 1}/400/600`,
  })
);

// ============================================
// PARTYKIT
// ============================================

export const PARTYKIT_HOST = 
  import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999';
