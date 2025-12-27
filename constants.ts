
import { Card } from './types';

// Generating a pseudo-random library of surreal-ish images
export const INITIAL_DECK: Card[] = Array.from({ length: 50 }).map((_, i) => ({
  id: i,
  imageUrl: `https://picsum.photos/seed/dixit-${i + 100}/400/600`,
  alt: `Surreal Image #${i}`
}));

export const MAX_HAND_SIZE = 6;
export const WINNING_SCORE = 30;
