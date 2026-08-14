import type { Athlete } from '../data/types';
import { MAX_DEPTH } from './levels';

/**
 * Rarity score for naming an athlete: the share of players who would *not* have
 * said the same name. Obvious picks are worth little; deep cuts are worth most.
 */
export function rarityScore(athlete: Athlete): number {
  return Math.max(1, Math.min(99, 100 - athlete.pop));
}

export interface Verdict {
  title: string;
  blurb: string;
}

/**
 * The headline number is how far down the board opened. Rarity is the
 * tiebreaker between two players who got equally deep.
 */
export function verdictFor(rowsCleared: number, averageRarity: number): Verdict {
  if (rowsCleared >= MAX_DEPTH) {
    return {
      title: averageRarity >= 90 ? 'The whole board, on deep cuts' : 'The whole board',
      blurb:
        averageRarity >= 90
          ? 'Every row, and barely a household name among them. There is nothing left to teach you.'
          : 'Every row open and filled. Try again and see how obscure you can go.',
    };
  }
  if (rowsCleared === 0) {
    return {
      title: 'Stuck on the first row',
      blurb: 'The board never opened. The names below would have worked.',
    };
  }
  return {
    title: `${rowsCleared} of ${MAX_DEPTH} rows`,
    blurb: `Row ${rowsCleared + 1} is where it stopped. Each row down has fewer answers than the last.`,
  };
}
