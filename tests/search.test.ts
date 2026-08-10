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
  it('ignores queries shorter than two characters', () => {
    expect(searchAthletes('m')).toEqual([]);
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
    expect(searchAthletes('checo').map((a) => a.name)).toContain('Sergio Perez');
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
    expect(searchAthletes('an', { limit: 5 }).length).toBeLessThanOrEqual(5);
  });
});
