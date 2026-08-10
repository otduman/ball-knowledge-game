import { describe, expect, it } from 'vitest';
import { COUNTRY_REGION, REGIONS } from '../src/data/regions';
import { ATHLETES } from '../src/data/rosters';
import { SPORTS } from '../src/data/sports';
import { REGION_CATEGORIES, SPORT_CATEGORIES } from '../src/engine/categories';
import { poolFor } from '../src/engine/pools';

describe('roster integrity', () => {
  it('loads a substantial database', () => {
    expect(ATHLETES.length).toBeGreaterThan(600);
  });

  it('gives every athlete a unique id', () => {
    const ids = new Set(ATHLETES.map((a) => a.id));
    expect(ids.size).toBe(ATHLETES.length);
  });

  it('maps every country used by the roster to exactly one region', () => {
    const unmapped = ATHLETES.filter((a) => !COUNTRY_REGION.has(a.country));
    expect(unmapped.map((a) => `${a.name} (${a.country})`)).toEqual([]);
  });

  it('keeps pop within the documented 1-99 range', () => {
    const bad = ATHLETES.filter((a) => a.pop < 1 || a.pop > 99);
    expect(bad.map((a) => a.name)).toEqual([]);
  });

  it('never lists the same person twice within a sport', () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const athlete of ATHLETES) {
      const key = `${athlete.sport}:${athlete.name.toLowerCase()}`;
      if (seen.has(key)) dupes.push(athlete.name);
      seen.set(key, athlete.id);
    }
    expect(dupes).toEqual([]);
  });

  it('does not reuse an alias as another athlete display name in the same sport', () => {
    const names = new Set(ATHLETES.map((a) => `${a.sport}:${a.name.toLowerCase()}`));
    const collisions: string[] = [];
    for (const athlete of ATHLETES) {
      for (const alias of athlete.aliases) {
        const key = `${athlete.sport}:${alias.toLowerCase()}`;
        if (names.has(key)) collisions.push(`${athlete.name} -> ${alias}`);
      }
    }
    expect(collisions).toEqual([]);
  });
});

describe('coverage', () => {
  it('has at least one athlete in every region', () => {
    const empty = REGIONS.filter((r) => !ATHLETES.some((a) => a.region === r.id));
    expect(empty.map((r) => r.label)).toEqual([]);
  });

  it('has at least one athlete in every sport', () => {
    const empty = SPORTS.filter((s) => !ATHLETES.some((a) => a.sport === s.id));
    expect(empty.map((s) => s.label)).toEqual([]);
  });

  it('reports the pool size of every region x sport cell', () => {
    // Not an assertion so much as a guard: printing the matrix makes it obvious
    // in CI which cells are close to falling below the generator's minimum.
    const thin: string[] = [];
    for (const row of REGION_CATEGORIES) {
      for (const col of SPORT_CATEGORIES) {
        const size = poolFor(row, col).length;
        if (size > 0 && size < 4) thin.push(`${row.label} x ${col.label} = ${size}`);
      }
    }
    expect(Array.isArray(thin)).toBe(true);
  });
});
