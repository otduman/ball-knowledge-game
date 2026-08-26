import { describe, expect, it } from 'vitest';
import { searchAthletes } from '../src/engine/search';
import { normalize, slugify } from '../src/util/text';

describe('text normalisation', () => {
  it('folds diacritics', () => {
    expect(normalize('Luka Modrić')).toBe('lukamodric');
    expect(normalize('Darwin Núñez')).toBe('darwinnunez');
    expect(normalize('Kylian Mbappé')).toBe('kylianmbappe');
  });

  it('produces hyphenated slugs', () => {
    expect(slugify("Samuel Eto'o")).toBe('samuel-eto-o');
    expect(slugify('Žydrūnas Ilgauskas')).toBe('zydrunas-ilgauskas');
  });
});

describe('searchAthletes', () => {
  it('stays silent until the query is long enough to be a real guess', () => {
    // The picker used to answer the board for you: "ha" listed Haaland and
    // Harden, so an unknown cell was solvable by reading the options.
    expect(searchAthletes('m')).toEqual([]);
    expect(searchAthletes('ha')).toEqual([]);
    expect(searchAthletes('mes')).toEqual([]);
    expect(searchAthletes('mess').map((a) => a.name)).toContain('Lionel Messi');
  });

  it('finds a player by surname prefix', () => {
    const names = searchAthletes('haal').map((a) => a.name);
    expect(names).toContain('Erling Haaland');
  });

  it('matches accented names typed without accents', () => {
    expect(searchAthletes('modric').map((a) => a.name)).toContain('Luka Modric');
    expect(searchAthletes('nunez').map((a) => a.name)).toContain('Darwin Nunez');
  });

  it('matches nicknames and alternate spellings', () => {
    expect(searchAthletes('chicharito').map((a) => a.name)).toContain('Javier Hernandez');
    expect(searchAthletes('greek freak').map((a) => a.name)).toContain('Giannis Antetokounmpo');
  });

  it('ranks the exact name above incidental substring matches', () => {
    const first = searchAthletes('messi')[0];
    expect(first?.name).toBe('Lionel Messi');
  });

  it('honours the exclude set so a used athlete cannot reappear', () => {
    const messi = searchAthletes('messi')[0]!;
    const again = searchAthletes('messi', { exclude: new Set([messi.id]) });
    expect(again.map((a) => a.id)).not.toContain(messi.id);
  });

  it('respects the result limit', () => {
    expect(searchAthletes('ande', { limit: 3 }).length).toBeLessThanOrEqual(3);
  });
});
