import { describe, expect, it } from 'vitest';
import raw from '../src/data/enrichment.json';
import { ENRICHMENT_STATS } from '../src/data/enrichment';
import { ATHLETES } from '../src/data/rosters';
import type { Category } from '../src/engine/categories';
import {
  COL_CATEGORIES,
  COUNTRY_CATEGORIES,
  ERA_CATEGORIES,
  LETTER_CATEGORIES,
  NAME_CATEGORIES,
  ORIGIN_CATEGORIES,
  REACH_CATEGORIES,
  ROW_CATEGORIES,
} from '../src/engine/categories';
import { MIN_ROW_POOL, categoryById } from '../src/engine/categories';
import { poolFor } from '../src/engine/pools';

const entries = raw.entries as unknown as Record<string, unknown>;

describe('enrichment data', () => {
  it('stores every entry as an 8-field tuple of the right types', () => {
    const malformed: string[] = [];
    for (const [id, value] of Object.entries(entries)) {
      if (!Array.isArray(value) || value.length !== 8) {
        malformed.push(`${id}: bad shape`);
        continue;
      }
      const [height, year, gender, reach, citizenships, city, capital, positions] =
        value as unknown[];
      if (height !== null && typeof height !== 'number') malformed.push(`${id}: height`);
      if (year !== null && typeof year !== 'number') malformed.push(`${id}: year`);
      if (gender !== null && gender !== 'f' && gender !== 'm') malformed.push(`${id}: gender`);
      if (reach !== null && (typeof reach !== 'number' || reach < 1)) malformed.push(`${id}: reach`);
      if (citizenships !== null && (typeof citizenships !== 'number' || citizenships < 1)) {
        malformed.push(`${id}: citizenships`);
      }
      if (city !== null && typeof city !== 'string') malformed.push(`${id}: city`);
      if (capital !== 0 && capital !== 1) malformed.push(`${id}: capital`);
      if (positions !== null && (typeof positions !== 'string' || positions.length === 0)) {
        malformed.push(`${id}: positions`);
      }
    }
    expect(malformed).toEqual([]);
  });

  it('never records a birth city as a bare Wikidata QID', () => {
    // Unlabelled items come back as "Q20518844"; keyed as a city they would
    // silently clump unrelated athletes into one fake shared-birthplace group.
    const bare = ATHLETES.filter((a) => a.birthCity !== undefined && /^Q\d+$/.test(a.birthCity));
    expect(bare.map((a) => `${a.name}=${a.birthCity}`)).toEqual([]);
  });

  it('restricts "born in a capital" to national capitals', () => {
    const capitalBorn = (name: string) => ATHLETES.find((a) => a.name === name)?.bornInCapital === true;
    expect(capitalBorn('Kylian Mbappe')).toBe(true);   // Paris
    expect(capitalBorn('Robert Lewandowski')).toBe(true); // Warsaw
    // Regional capitals must NOT count. Manchester is the capital of Greater
    // Manchester, which once made 68% of footballers read as capital-born.
    expect(capitalBorn('Marcus Rashford')).toBe(false); // Manchester
    expect(capitalBorn('Wayne Rooney')).toBe(false);    // Liverpool
    expect(capitalBorn('Erling Haaland')).toBe(false);  // Leeds

    const share = ATHLETES.filter((a) => a.bornInCapital).length / ATHLETES.length;
    expect(share).toBeGreaterThan(0.05);
    expect(share).toBeLessThan(0.35);
  });

  it('only references athletes that exist in the roster', () => {
    const ids = new Set(ATHLETES.map((a) => a.id));
    expect(Object.keys(entries).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('keeps positions inside their own sport', () => {
    // P413 is not confined to the sport an athlete is filed under: Michael
    // Jordan carries "outfielder" from his baseball detour. Anything outside
    // the fetch vocabulary is dropped, so no NBA player should read as a
    // goalkeeper and no footballer as a point guard.
    const BASKETBALL = new Set(['point guard', 'shooting guard', 'small forward',
      'power forward', 'center', 'guard', 'swingman', 'point forward']);
    // "Winger" is deliberately absent: basketball uses it for a wing player, so
    // it is genuinely shared rather than a football value leaking across.
    const FOOTBALL_ONLY = new Set(['goalkeeper', 'centre-back', 'full-back', 'defender',
      'midfielder', 'attacking midfielder', 'defensive midfielder', 'striker']);

    const strays: string[] = [];
    for (const a of ATHLETES) {
      for (const p of a.positions ?? []) {
        if (a.sport === 'nba' && FOOTBALL_ONLY.has(p)) strays.push(`${a.name}=${p}`);
        if (a.sport === 'football' && BASKETBALL.has(p)) strays.push(`${a.name}=${p}`);
      }
    }
    expect(strays).toEqual([]);
  });

  it('sorts the obvious players into the right role', () => {
    // The roles are what the board asks, so they are what gets asserted --
    // Wikidata calls van Dijk a "defender" some days and a "centre-back"
    // others, and the row does not care which.
    const roleOf = (id: string) => categoryById(`role:${id}`)!;
    const isRole = (name: string, id: string) => {
      const athlete = ATHLETES.find((a) => a.name === name);
      return athlete !== undefined && roleOf(id).matches(athlete);
    };
    expect(isRole('Gianluigi Buffon', 'back')).toBe(true);
    expect(isRole('Virgil van Dijk', 'back')).toBe(true);
    expect(isRole('Stephen Curry', 'playmake')).toBe(true);
    expect(isRole('Erling Haaland', 'attack')).toBe(true);
    // A keeper is not a forward, whatever else changes upstream.
    expect(isRole('Gianluigi Buffon', 'attack')).toBe(false);
  });

  it('covers enough of both columns for the role rows to hold up', () => {
    // Roles are the first row family built on a fetched field that is not
    // near-universal, so the floor is asserted rather than assumed.
    for (const sport of ['football', 'nba'] as const) {
      const pool = ATHLETES.filter((a) => a.sport === sport);
      const placed = pool.filter((a) => a.positions !== undefined).length;
      expect(placed / pool.length, sport).toBeGreaterThan(0.85);
    }
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

  it('leaves no dead row category that cannot fill both columns', () => {
    // Two columns now, not five: the board is Football x NBA and the other
    // three rosters are gone, so "viable" means viable in both.
    const dead = ROW_CATEGORIES.filter((row) => {
      const usable = COL_CATEGORIES.filter(
        (col) => poolFor(row, col).length >= MIN_ROW_POOL,
      ).length;
      return usable < 2;
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
    expect(top.some((n) => ['LeBron James', 'Michael Jordan', 'Kobe Bryant', 'Pele',
      'Diego Maradona', 'Zinedine Zidane'].includes(n))).toBe(true);
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
    expect(global.matches(byName('LeBron James'))).toBe(true);
    expect(deep.matches(byName('Lionel Messi'))).toBe(false);
  });

  it('adds no near-free cells — both bands stay under the wide threshold', () => {
    for (const row of REACH_CATEGORIES) {
      for (const col of COL_CATEGORIES) {
        expect(poolFor(row, col).length).toBeLessThan(260);
      }
    }
  });
});

describe('origin and name rows', () => {
  it('only keeps rows that can fill both columns', () => {
    for (const row of [...ORIGIN_CATEGORIES, ...NAME_CATEGORIES]) {
      const usable = COL_CATEGORIES.filter(
        (col) => poolFor(row, col).length >= MIN_ROW_POOL,
      ).length;
      expect(usable, `${row.label}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('derives shared surnames from the display name, not Wikidata P734', () => {
    const shared = NAME_CATEGORIES.find((c) => c.label === 'Shared surname');
    if (!shared) return;
    const byName = (n: string) => ATHLETES.find((a) => a.name === n)!;
    // P734 records the legal name — Ronaldo's is "Aveiro" — so it would never
    // link the names players actually type.
    expect(shared.matches(byName('Pau Gasol'))).toBe(true);
    expect(shared.matches(byName('Marc Gasol'))).toBe(true);
    expect(shared.matches(byName('Manute Bol'))).toBe(true);
  });

  it('matches mononyms only when the athlete really goes by one name', () => {
    const mononym = NAME_CATEGORIES.find((c) => c.label === 'Known by one name');
    if (!mononym) return;
    const byName = (n: string) => ATHLETES.find((a) => a.name === n)!;
    expect(mononym.matches(byName('Neymar'))).toBe(true);
    expect(mononym.matches(byName('Lionel Messi'))).toBe(false);
  });

  it('pairs athletes who really share a birth city', () => {
    const shared = ORIGIN_CATEGORIES.find((c) => c.label === 'Shares a birth city');
    if (!shared) return;
    const byName = (n: string) => ATHLETES.find((a) => a.name === n)!;
    // LeBron James and Stephen Curry were both born in Akron.
    expect(byName('LeBron James').birthCity).toBe(byName('Stephen Curry').birthCity);
    expect(shared.matches(byName('LeBron James'))).toBe(true);
  });

  it('never matches an athlete whose underlying fact is missing', () => {
    const dual = ORIGIN_CATEGORIES.find((c) => c.label === 'Dual national');
    const capital = ORIGIN_CATEGORIES.find((c) => c.label === 'Born in a capital');
    for (const athlete of ATHLETES.filter((a) => a.citizenships === undefined)) {
      expect(dual?.matches(athlete) ?? false).toBe(false);
    }
    for (const athlete of ATHLETES.filter((a) => a.bornInCapital === undefined)) {
      expect(capital?.matches(athlete) ?? false).toBe(false);
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

