/**
 * [BOT] Lógica de decisão dos bots
 *
 * Para remover: rm -rf party/bots
 */

// Pistas predefinidas para os bots
const BOT_CLUES = [
  'Mistério',
  'Sonho',
  'Viagem',
  'Memória',
  'Esperança',
  'Reflexo',
  'Silêncio',
  'Aventura',
  'Magia',
  'Destino',
  'Aurora',
  'Sombra',
  'Liberdade',
  'Infinito',
  'Segredo',
  'Nostalgia',
  'Horizonte',
  'Enigma',
  'Fantasia',
  'Caminho',
];

/**
 * Escolhe um item aleatório de um array
 */
export function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Gera uma pista aleatória
 */
export function generateClue(): string {
  return pickRandom(BOT_CLUES) || 'Mistério';
}

/**
 * Escolhe um índice aleatório de um array
 */
export function pickRandomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}
