import { GAME_CONFIG } from '../config';

// Re-export para manter compatibilidade
export { GAME_CONFIG };

// ============================================
// PARTYKIT
// ============================================

export const PARTYKIT_HOST =
  import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999';
