import { Card } from '../types';
import { GAME_CONFIG } from '../config';

// Re-export para manter compatibilidade
export { GAME_CONFIG };

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
