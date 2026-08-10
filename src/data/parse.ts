import { slugify } from '../util/text';
import { regionForCountry } from './regions';
import type { Athlete, SportId } from './types';

/** `Name | Country | pop | alias; alias` — the alias column is optional. */
const MIN_COLUMNS = 3;

/**
 * Parses a pipe-delimited roster table into `Athlete` records. Rosters are
 * written as text rather than object literals so several hundred rows stay
 * reviewable, and so a malformed row throws at module load instead of silently
 * vanishing from the pool.
 */
export function parseRoster(sport: SportId, table: string): Athlete[] {
  const athletes: Athlete[] = [];
  const seen = new Set<string>();

  const lines = table.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? '').trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < MIN_COLUMNS) {
      throw new Error(
        `${sport} roster line ${i + 1}: expected at least ${MIN_COLUMNS} columns, got "${line}"`,
      );
    }

    const name = parts[0] ?? '';
    const country = parts[1] ?? '';
    const popRaw = parts[2] ?? '';
    const aliasRaw = parts[3] ?? '';

    if (!name) throw new Error(`${sport} roster line ${i + 1}: missing name`);

    const pop = Number(popRaw);
    if (!Number.isFinite(pop) || pop < 1 || pop > 99) {
      throw new Error(
        `${sport} roster line ${i + 1}: pop must be 1-99, got "${popRaw}" for ${name}`,
      );
    }

    const id = `${sport}:${slugify(name)}`;
    if (seen.has(id)) throw new Error(`${sport} roster: duplicate entry for ${name}`);
    seen.add(id);

    athletes.push({
      id,
      name,
      sport,
      country,
      region: regionForCountry(country),
      pop,
      aliases: aliasRaw
        .split(';')
        .map((a) => a.trim())
        .filter(Boolean),
    });
  }

  return athletes;
}
