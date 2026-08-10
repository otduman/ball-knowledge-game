import type { Sport, SportId } from './types';

export const SPORTS: readonly Sport[] = [
  { id: 'football', label: 'Football', longLabel: 'Football (soccer)' },
  { id: 'nba', label: 'NBA', longLabel: 'NBA basketball' },
  { id: 'ufc', label: 'UFC', longLabel: 'UFC / MMA' },
  { id: 'f1', label: 'Formula 1', longLabel: 'Formula 1' },
  { id: 'tennis', label: 'Tennis', longLabel: 'Tennis' },
] as const;

const BY_ID = new Map<SportId, Sport>(SPORTS.map((s) => [s.id, s]));

export function sportById(id: SportId): Sport {
  const sport = BY_ID.get(id);
  if (!sport) throw new Error(`Unknown sport: ${id}`);
  return sport;
}
