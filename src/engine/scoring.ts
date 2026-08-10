import type { Athlete } from '../data/types';

/**
 * Rarity score for naming an athlete: the share of players who would *not* have
 * said the same name. Obvious picks are worth little; deep cuts are worth most.
 */
export function rarityScore(athlete: Athlete): number {
  return Math.max(1, Math.min(99, 100 - athlete.pop));
}

export const MAX_SCORE = 9 * 99;

export interface Verdict {
  title: string;
  blurb: string;
}

/**
 * Verdict text keyed off both completion and rarity, so filling the board with
 * nine household names reads differently from six genuine deep cuts.
 */
export function verdictFor(solvedCount: number, score: number): Verdict {
  if (solvedCount === 0) {
    return {
      title: 'Blanked',
      blurb: 'Nine empty cells. The reveal below shows names that would have worked.',
    };
  }

  const averageRarity = score / solvedCount;

  if (solvedCount === 9 && averageRarity >= 90) {
    return {
      title: 'Ball knowledge, certified',
      blurb: 'A perfect board of deep cuts. There is nothing left to teach you.',
    };
  }
  if (solvedCount === 9) {
    return {
      title: 'Perfect board',
      blurb: 'Nine from nine. Try it again and see how obscure you can go.',
    };
  }
  if (averageRarity >= 90) {
    return {
      title: 'Deep cuts only',
      blurb: 'You left cells empty but nobody else is naming the players you named.',
    };
  }
  if (solvedCount >= 6) {
    return {
      title: 'Solid shift',
      blurb: 'A respectable board. The rarer the name, the higher the score.',
    };
  }
  return {
    title: 'Room to grow',
    blurb: 'Score is 100 minus the share of players expected to name the same athlete.',
  };
}
