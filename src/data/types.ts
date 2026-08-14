export type SportId = 'football' | 'nba' | 'ufc' | 'f1' | 'tennis';

export type RegionId =
  | 'africa'
  | 'south-america'
  | 'north-america'
  | 'uk-ireland'
  | 'western-europe'
  | 'southern-europe'
  | 'eastern-europe'
  | 'nordic'
  | 'asia-oceania';

export interface Sport {
  id: SportId;
  /** Column heading on the board. */
  label: string;
  /** Longer form used in the picker prompt and reveal list. */
  longLabel: string;
}

export interface Region {
  id: RegionId;
  /** Row heading on the board. */
  label: string;
}

export interface Athlete {
  /** Stable slug, unique across the whole database: `${sport}:${nameSlug}`. */
  id: string;
  name: string;
  sport: SportId;
  /** Represented nationality (see docs/data-rules in README), not birthplace. */
  country: string;
  /** Derived from `country` via COUNTRY_REGION. */
  region: RegionId;
  /**
   * Expected share (roughly, percent) of players who would name this athlete
   * for their cell. Drives rarity scoring: score = 100 - pop.
   */
  pop: number;
  /** Alternate spellings and nicknames, matched by the search index. */
  aliases: string[];
  /**
   * Sourced from Wikidata by `scripts/enrich-roster.ts`, absent for roughly
   * 16% of the roster. Categories built on these fields only ever match
   * athletes where the value is known, so a gap costs pool depth, never
   * correctness.
   */
  heightCm?: number;
  birthYear?: number;
  /** Sourced from Wikidata P21; underpins a future women's row. */
  gender?: 'f' | 'm';
  /**
   * How many language Wikipedias carry an article about this athlete. A free,
   * stable proxy for global fame — the workable version of "how many followers
   * do they have", which Wikidata does not record and which changes daily.
   */
  wikipediaLanguages?: number;
}
