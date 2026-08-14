import { describe, expect, it } from 'vitest';
import raw from '../src/data/enrichment.json';
import { ENRICHMENT_STATS } from '../src/data/enrichment';
import { ATHLETES } from '../src/data/rosters';
import type { Category } from '../src/engine/categories';
import {
  COL_CATEGORIES,
  COUNTRY_CATEGORIES,
  ERA_CATEGORIES,
  GEOGRAPHIC_GROUPS,
  LETTER_CATEGORIES,
  REACH_CATEGORIES,
  ROW_CATEGORIES,
} from '../src/engine/categories';
import { DEFAULT_CONSTRAINTS, buildGrid } from '../src/engine/grid';
import { poolFor } from '../src/engine/pools';

const entries = raw.entries as unknown as Record<string, unknown>;

describe('enrichment data', () => {
  it('stores every entry as a [height, year, gender, reach] tuple', () => {
    const malformed: string[] = [];
    for (const [id, value] of Object.entries(entries)) {
      if (!Array.isArray(value) || value.length !== 4) {
        malformed.push(`${id}: bad shape`);
        continue;
      }
      const [height, year, gender, reach] = value as unknown[];
      if (height !== null && typeof height !== 'number') malformed.push(`${id}: height`);
      if (year !== null && typeof year !== 'number') malformed.push(`${id}: year`);
      if (gender !== null && gender !== 'f' && gender !== 'm') malformed.push(`${id}: gender`);
      if (reach !== null && (typeof reach !== 'number' || reach < 1)) malformed.push(`${id}: reach`);
    }
    expect(malformed).toEqual([]);
  });

  it('only references athletes that exist in the roster', () => {
    const ids = new Set(ATHLETES.map((a) => a.id));
    expect(Object.keys(entries).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('keeps heights and birth years physically plausible', () => {
    const badHeight = ATHLETES.filter(
      (a) => a.heightCm !== undefined && (a.heightCm < 140 || a.heightCm > 240),
    );
    const badYear = ATHLETES.filter(
      (a) => a.birthYear !== undefined && (a.birthYear < 1900 || a.birthYear > 2012),
    );
    expect(badHeight.map((a) => `${a.name}=${a.heightCm}`)).toEqual([]);
    expect(badYear.map((a) => `${a.name}=${a.birthYear}`)).toEqual([]);
  });

  it('holds coverage high enough for attribute rows to work', () => {
    const withHeight = ATHLETES.filter((a) => a.heightCm !== undefined).length;
    const withYear = ATHLETES.filter((a) => a.birthYear !== undefined).length;
    const withGender = ATHLETES.filter((a) => a.gender !== undefined).length;
    expect(withHeight / ATHLETES.length).toBeGreaterThan(0.8);
    expect(withYear / ATHLETES.length).toBeGreaterThan(0.95);
    expect(withGender / ATHLETES.length).toBeGreaterThan(0.95);
    expect(ENRICHMENT_STATS.athletes).toBe(ATHLETES.length);
  });

  it('keeps gender values to the two recorded codes', () => {
    const bad = ATHLETES.filter((a) => a.gender !== undefined && a.gender !== 'f' && a.gender !== 'm');
    expect(bad.map((a) => a.name)).toEqual([]);
  });

  it('gets the extremes right, so a bad re-run cannot pass silently', () => {
    const height = (name: string) => ATHLETES.find((a) => a.name === name)?.heightCm;
    expect(height('Yao Ming')).toBeGreaterThan(220);
    expect(height('Manute Bol')).toBeGreaterThan(220);
    expect(height('Lionel Messi')).toBeLessThan(175);
    // Two Wikidata entities share this label; the basketballer must win.
    expect(height('Michael Jordan')).toBeGreaterThan(190);
    expect(ATHLETES.find((a) => a.name === 'Michael Jordan')?.birthYear).toBe(1963);
  });
});

describe('attribute categories', () => {
  it('places each athlete in at most one era band', () => {
    const multi = ATHLETES.filter(
      (a) => ERA_CATEGORIES.filter((c: Category) => c.matches(a)).length > 1,
    );
    expect(multi.map((a) => a.name)).toEqual([]);
  });

  it('puts every athlete with a known birth year into exactly one era band', () => {
    for (const athlete of ATHLETES) {
      const bands = ERA_CATEGORIES.filter((c: Category) => c.matches(athlete)).length;
      expect(bands).toBe(athlete.birthYear === undefined ? 0 : 1);
    }
  });

  it('never puts an athlete with no birth year into an era band', () => {
    const noData = ATHLETES.filter((a) => a.birthYear === undefined);
    for (const athlete of noData) {
      expect(ERA_CATEGORIES.some((c: Category) => c.matches(athlete))).toBe(false);
    }
  });

  it('assigns each athlete to at most one surname-letter row', () => {
    const multi = ATHLETES.filter(
      (a) => LETTER_CATEGORIES.filter((c: Category) => c.matches(a)).length > 1,
    );
    expect(multi.map((a) => a.name)).toEqual([]);
  });

  it('assigns each athlete to at most one country row', () => {
    const multi = ATHLETES.filter(
      (a) => COUNTRY_CATEGORIES.filter((c: Category) => c.matches(a)).length > 1,
    );
    expect(multi.map((a) => a.name)).toEqual([]);
  });

  it('leaves no dead row category that can never fill three columns', () => {
    const dead = ROW_CATEGORIES.filter((row) => {
      const usable = COL_CATEGORIES.filter(
        (col) => poolFor(row, col).length >= DEFAULT_CONSTRAINTS.minPool,
      ).length;
      return usable < 3;
    });
    expect(dead.map((c) => c.label)).toEqual([]);
  });
});

describe('Wikipedia reach', () => {
  it('covers nearly the whole roster', () => {
    const withReach = ATHLETES.filter((a) => a.wikipediaLanguages !== undefined).length;
    expect(withReach / ATHLETES.length).toBeGreaterThan(0.95);
  });

  it('ranks the household names at the top', () => {
    const top = [...ATHLETES]
      .sort((a, b) => (b.wikipediaLanguages ?? 0) - (a.wikipediaLanguages ?? 0))
      .slice(0, 12)
      .map((a) => a.name);
    // A fame proxy that does not surface these is not measuring fame.
    expect(top).toContain('Lionel Messi');
    expect(top).toContain('Cristiano Ronaldo');
    expect(top.some((n) => ['Roger Federer', 'Rafael Nadal', 'Novak Djokovic'].includes(n))).toBe(true);
  });

  it('keeps the two bands disjoint and never matches an athlete with no data', () => {
    const both = ATHLETES.filter((a) => REACH_CATEGORIES.every((c: Category) => c.matches(a)));
    expect(both.map((a) => a.name)).toEqual([]);

    const noData = ATHLETES.filter((a) => a.wikipediaLanguages === undefined);
    for (const athlete of noData) {
      expect(REACH_CATEGORIES.some((c: Category) => c.matches(athlete))).toBe(false);
    }
  });

  it('puts genuinely famous athletes in Global name and obscure ones in Deep cut', () => {
    const global = REACH_CATEGORIES.find((c) => c.label === 'Global name')!;
    const deep = REACH_CATEGORIES.find((c) => c.label === 'Deep cut')!;
    const byName = (n: string) => ATHLETES.find((a) => a.name === n)!;

    expect(global.matches(byName('Lionel Messi'))).toBe(true);
    expect(global.matches(byName('Michael Schumacher'))).toBe(true);
    expect(deep.matches(byName('Lionel Messi'))).toBe(false);
  });

  it('adds no near-free cells — both bands stay under the wide threshold', () => {
    for (const row of REACH_CATEGORIES) {
      for (const col of COL_CATEGORIES) {
        expect(poolFor(row, col).length).toBeLessThan(DEFAULT_CONSTRAINTS.widePool);
      }
    }
  });
});

describe('board variety', () => {
  it('gives every row group meaningful airtime, not airtime proportional to its size', () => {
    const slots = new Map<string, number>();
    const boards = 200;
    for (let n = 1; n <= boards; n++) {
      for (const row of buildGrid(n).rows) slots.set(row.group, (slots.get(row.group) ?? 0) + 1);
    }
    const total = boards * 3;
    // Reach has 2 rows against 20 letters. Under uniform sampling it landed on
    // 3% of slots; stratifying by board shape is what keeps it visible.
    for (const group of ['region', 'country', 'era', 'reach', 'letter']) {
      const share = (slots.get(group) ?? 0) / total;
      expect(share, `${group} share`).toBeGreaterThan(0.05);
    }
  });

  it('never puts two reach rows on one board', () => {
    for (let n = 1; n <= 300; n++) {
      const reach = buildGrid(n).rows.filter((r) => r.group === 'reach').length;
      expect(reach).toBeLessThanOrEqual(1);
    }
  });
});

describe('category hints', () => {
  it('gives every category a non-empty explanation', () => {
    const missing = [...ROW_CATEGORIES, ...COL_CATEGORIES].filter((c) => !c.hint.trim());
    expect(missing.map((c) => c.label)).toEqual([]);
  });

  it('names the member countries for every region, including the ambiguous ones', () => {
    const southern = ROW_CATEGORIES.find((c) => c.label === 'Southern Europe');
    expect(southern?.hint).toContain('Spain');
    expect(southern?.hint).toContain('Italy');
    expect(southern?.hint).toContain('Portugal');

    // The Pedri case: Spain must not read as Western Europe.
    const western = ROW_CATEGORIES.find((c) => c.label === 'Western Europe');
    expect(western?.hint).not.toContain('Spain');
    expect(western?.hint).toContain('France');
  });

  it('only lists countries that actually have athletes', () => {
    const southern = ROW_CATEGORIES.find((c) => c.label === 'Southern Europe');
    expect(southern?.hint).not.toContain('San Marino');
  });
});

describe('mixed-row grids', () => {
  it('keeps at least one geographic row on every board', () => {
    for (let n = 1; n <= 300; n++) {
      const grid = buildGrid(n);
      const geographic = grid.rows.filter((r) => GEOGRAPHIC_GROUPS.includes(r.group)).length;
      expect(geographic).toBeGreaterThanOrEqual(DEFAULT_CONSTRAINTS.minGeographicRows);
    }
  });

  it('honours the difficulty budget on every board', () => {
    for (let n = 1; n <= 300; n++) {
      const grid = buildGrid(n);
      const wide = grid.rows.flatMap((r) =>
        grid.cols.map((c) => poolFor(r, c).length),
      ).filter((size) => size >= DEFAULT_CONSTRAINTS.widePool).length;
      expect(wide).toBeLessThanOrEqual(DEFAULT_CONSTRAINTS.maxWideCells);
    }
  });

  it('never stacks three rows from the same group', () => {
    for (let n = 1; n <= 300; n++) {
      const grid = buildGrid(n);
      const counts = new Map<string, number>();
      for (const row of grid.rows) counts.set(row.group, (counts.get(row.group) ?? 0) + 1);
      for (const count of counts.values()) {
        expect(count).toBeLessThanOrEqual(DEFAULT_CONSTRAINTS.maxRowsPerGroup);
      }
    }
  });

  it('actually mixes attribute rows in, rather than defaulting to regions', () => {
    let withAttribute = 0;
    for (let n = 1; n <= 100; n++) {
      if (buildGrid(n).rows.some((r) => r.group !== 'region')) withAttribute++;
    }
    expect(withAttribute).toBeGreaterThan(20);
  });

  it('uses every sport across a run of daily grids', () => {
    const seen = new Set<string>();
    for (let n = 1; n <= 100; n++) for (const col of buildGrid(n).cols) seen.add(col.id);
    expect(seen.size).toBe(COL_CATEGORIES.length);
  });
});
