import { applyEnrichment } from '../enrichment';
import type { Athlete } from '../types';
import { F1 } from './f1';
import { FOOTBALL } from './football';
import { NBA } from './nba';
import { TENNIS } from './tennis';
import { UFC } from './ufc';

/**
 * The roster as the game sees it: hand-authored rows merged with the generated
 * height/birth-year data so consumers never have to remember to join the two.
 */
export const ATHLETES: readonly Athlete[] = [
  ...FOOTBALL,
  ...NBA,
  ...UFC,
  ...F1,
  ...TENNIS,
].map(applyEnrichment);

const BY_ID = new Map<string, Athlete>(ATHLETES.map((a) => [a.id, a]));

export function athleteById(id: string): Athlete | undefined {
  return BY_ID.get(id);
}

export { F1, FOOTBALL, NBA, TENNIS, UFC };
