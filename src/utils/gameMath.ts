import { DeckOption, VictoryCondition } from '../types';
import { GAME_CONFIG } from '../config';

/**
 * Returns the exact total number of cards for the given deck option.
 */
export function getDeckSize(deckOption: DeckOption): number {
  switch (deckOption) {
    case 'original':
      return GAME_CONFIG.ORIGINAL_DECK_SIZE;
    case 'new':
      return GAME_CONFIG.NEW_DECK_SIZE;
    case 'mixed':
      return GAME_CONFIG.ORIGINAL_DECK_SIZE + GAME_CONFIG.NEW_DECK_SIZE;
    default:
      return GAME_CONFIG.ORIGINAL_DECK_SIZE;
  }
}

/**
 * Calculates the maximum number of players that can play without running out of cards.
 * 
 * Formula for cards consumed `C` given `P` players and `N` narrator rounds:
 * C = P * 6 + P * (P * N - 1) 
 * Simplificando: C = P * (5 + P * N)
 * 
 * Se for vitória por pontos apenas, assumimos N=3 como folga máxima de segurança.
 * 
 * @param deckOption O baralho escolhido.
 * @param vc A condição de vitória configurada.
 */
export function calculateMaxPlayers(deckOption: DeckOption, vc: VictoryCondition): number {
  const D = getDeckSize(deckOption);
  
  const N = vc.narratorRoundsEnabled ? Math.max(1, vc.narratorRounds) : 3;

  // Encontra P resolvendo: P^2 * N + 5*P - D <= 0
  // P = Math.floor((-5 + Math.sqrt(25 + 4 * N * D)) / (2 * N))
  const maxByCards = Math.floor((-5 + Math.sqrt(25 + 4 * N * D)) / (2 * N));

  // Retorna o menor entre a matemática e o limite absoluto físico
  return Math.min(maxByCards, GAME_CONFIG.MAX_PLAYERS_ABSOLUTE);
}

/**
 * Calculates the maximum allowed narrator rounds given the current active players count and deck size.
 * 
 * C = P * (5 + P * N) <= D
 * P * N <= (D / P) - 5
 * N <= ((D / P) - 5) / P
 */
export function calculateMaxNarratorRounds(deckOption: DeckOption, activePlayersCount: number): number {
  // Evitar divisões por zero ou jogadores < 3
  const P = Math.max(3, activePlayersCount);
  const D = getDeckSize(deckOption);

  const maxRounds = Math.floor(((D / P) - 5) / P);

  // Limite razoável de segurança na UI (até 5 rodadas)
  return Math.min(5, Math.max(1, maxRounds));
}
