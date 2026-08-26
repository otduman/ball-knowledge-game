import type { Sport, SportId } from './types';

export const SPORTS: readonly Sport[] = [
  { id: 'football', label: 'Football', longLabel: 'Football (soccer)' },
  { id: 'nba', label: 'NBA', longLabel: 'NBA basketball' },
] as const;

const BY_ID = new Map<SportId, Sport>(SPORTS.map((s) => [s.id, s]));

export function sportById(id: SportId): Sport {
  const sport = BY_ID.get(id);
  if (!sport) throw new Error(`Unknown sport: ${id}`);
  return sport;
}
