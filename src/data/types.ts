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
  /** Count of current citizenships; >1 powers the dual-nationality row. */
  citizenships?: number;
  /** Birth city label, used to pair athletes born in the same place. */
  birthCity?: string;
  /**
   * Derived country-first (`country wdt:P36 city`), never city-first via
   * P1376 "capital of" — that property counts historic and sub-national
   * capitals and would claim New York City is a capital of the United States.
   */
  bornInCapital?: boolean;
  /**
   * Playing positions from Wikidata P413, lowercased, filtered to a known
   * vocabulary. Stored raw rather than pre-bucketed so the cross-sport grouping
   * can be rethought without another fetch — and filtered because P413 happily
   * records Michael Jordan as an outfielder.
   */
  positions?: string[];
}
