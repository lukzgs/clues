
export interface Card {
  id: number;
  imageUrl: string;
  alt: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  hand: Card[];
  isAI: boolean;
  color: string;
}

export enum GamePhase {
  LOBBY = 'LOBBY',
  NARRATOR_CHOOSING = 'NARRATOR_CHOOSING', // Narrator picks card and gives clue
  OTHERS_CHOOSING = 'OTHERS_CHOOSING',     // Others pick card matching clue
  VOTING = 'VOTING',                      // Reveal and vote
  RESULTS = 'RESULTS',                    // Show score updates
  GAME_OVER = 'GAME_OVER'
}

export interface GameState {
  players: Player[];
  narratorIndex: number;
  currentClue: string;
  phase: GamePhase;
  deck: Card[];
  tableCards: { playerId: string; card: Card }[]; // All cards played this round
  votes: Record<string, string>; // VoterId -> TargetPlayerId (the one they think is narrator)
  winner: string | null;
}

export const COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899'  // pink
];
