import type { Athlete } from '../data/types';
import { LEVELS, MAX_DEPTH, levelAt } from './levels';

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
 * The headline number is depth, not points. "How far down did you get" is the
 * question the game asks, and rarity is the tiebreaker between two players who
 * got equally deep.
 */
export function verdictFor(deepestCleared: number, averageRarity: number): Verdict {
  if (deepestCleared >= MAX_DEPTH) {
    return {
      title: averageRarity >= 90 ? 'Bedrock, on deep cuts' : 'You hit bedrock',
      blurb:
        averageRarity >= 90
          ? 'The whole dive, and barely a household name in it. There is nothing left to teach you.'
          : 'All the way down. Try it again and see how obscure you can go.',
    };
  }
  if (deepestCleared === 0) {
    return {
      title: 'The ice held',
      blurb: 'You never made it through the surface. The reveal below shows names that would have worked.',
    };
  }

  const level = levelAt(deepestCleared);
  const next = LEVELS[deepestCleared];
  return {
    title: `Stopped at ${level.name}`,
    blurb: next
      ? `Level ${deepestCleared} of ${MAX_DEPTH} cleared. ${next.name} was where it got you.`
      : `Level ${deepestCleared} of ${MAX_DEPTH} cleared.`,
  };
}
