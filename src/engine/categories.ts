import { COUNTRY_REGION, REGIONS, regionById } from '../data/regions';
import { ATHLETES } from '../data/rosters';
import { SPORTS } from '../data/sports';
import type { Athlete, SportId } from '../data/types';
import { tokens } from '../util/text';

/** Which side of the board a category can appear on. */
export type AxisId = 'row' | 'col';

/**
 * Categories within a group are mutually exclusive by construction, so two of
 * them can share a board without overlapping or contradicting each other.
 */
export type CategoryGroup = 'region' | 'country' | 'sport' | 'era' | 'letter';

export interface Category {
  id: string;
  label: string;
  axis: AxisId;
  group: CategoryGroup;
  /**
   * Exactly what qualifies, in plain language. Surfaced in the UI because a
   * heading like "Southern Europe" is a guess about the mapmaker's intent
   * otherwise — a player who tries Pedri for Western Europe deserves to know
   * where Spain actually sits before spending a guess.
   */
  hint: string;
  matches(athlete: Athlete): boolean;
}

/** A row must clear this in at least `MIN_VIABLE_COLUMNS` sports to be usable. */
const MIN_POOL = 6;
const MIN_VIABLE_COLUMNS = 3;

function surnameInitial(name: string): string {
  const parts = tokens(name);
  return parts.length > 0 ? (parts[parts.length - 1] as string).charAt(0) : '';
}

/** Countries that actually have athletes, so hints never list empty entries. */
function rosterCountriesIn(regionId: string): string[] {
  const present = new Set(ATHLETES.filter((a) => a.region === regionId).map((a) => a.country));
  return [...COUNTRY_REGION.entries()]
    .filter(([country, region]) => region === regionId && present.has(country))
    .map(([country]) => country)
    .sort();
}

/**
 * Keeps a generated row out of the catalogue unless it can fill three columns.
 * Without this the board could offer a heading that no valid grid can ever use.
 */
function isViableRow(matches: (a: Athlete) => boolean): boolean {
  let viable = 0;
  for (const sport of SPORTS) {
    const count = ATHLETES.filter((a) => a.sport === sport.id && matches(a)).length;
    if (count >= MIN_POOL) viable++;
  }
  return viable >= MIN_VIABLE_COLUMNS;
}

// ---- regions -------------------------------------------------------------

export const REGION_CATEGORIES: readonly Category[] = REGIONS.map((region) => ({
  id: `region:${region.id}`,
  label: region.label,
  axis: 'row' as const,
  group: 'region' as const,
  hint: rosterCountriesIn(region.id).join(', '),
  matches: (athlete: Athlete) => athlete.region === region.id,
}));

// ---- countries -----------------------------------------------------------

/**
 * Generated rather than hand-listed so the set grows with the roster. A country
 * row is sharper than its region ("Spain × Formula 1" beats "Southern Europe ×
 * Formula 1"), and it sidesteps the region-boundary ambiguity entirely.
 */
export const COUNTRY_CATEGORIES: readonly Category[] = [...new Set(ATHLETES.map((a) => a.country))]
  .sort()
  .map((country) => ({
    id: `country:${country.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    label: country,
    axis: 'row' as const,
    group: 'country' as const,
    hint: `Represented ${country}`,
    matches: (athlete: Athlete) => athlete.country === country,
  }))
  .filter((category) => isViableRow(category.matches));

// ---- era -----------------------------------------------------------------

const ERA_BANDS: Array<{ id: string; label: string; min: number; max: number }> = [
  { id: 'pre1970', label: 'Born pre-1970', min: 0, max: 1970 },
  { id: '1970s', label: 'Born 1970s', min: 1970, max: 1980 },
  { id: '1980s', label: 'Born 1980s', min: 1980, max: 1990 },
  { id: '1990s', label: 'Born 1990s', min: 1990, max: 2000 },
  { id: '2000s', label: 'Born 2000s', min: 2000, max: Infinity },
];

export const ERA_CATEGORIES: readonly Category[] = ERA_BANDS.map((band) => ({
  id: `era:${band.id}`,
  label: band.label,
  axis: 'row' as const,
  group: 'era' as const,
  hint:
    band.max === Infinity
      ? `Born in ${band.min} or later`
      : band.min === 0
        ? `Born before ${band.max}`
        : `Born between ${band.min} and ${band.max - 1}`,
  matches: (athlete: Athlete) =>
    athlete.birthYear !== undefined && athlete.birthYear >= band.min && athlete.birthYear < band.max,
}));

// ---- surname initial -----------------------------------------------------

/**
 * Single letters rather than A-C style buckets. Buckets are three times wider
 * for no extra interest — "A-C x Football" offers 115 valid answers where "M x
 * Football" offers 56 — and single letters give 20 rows instead of 7.
 */
export const LETTER_CATEGORIES: readonly Category[] = [...'abcdefghijklmnopqrstuvwxyz']
  .map((letter) => ({
    id: `letter:${letter}`,
    label: `Surname ${letter.toUpperCase()}`,
    axis: 'row' as const,
    group: 'letter' as const,
    hint: `Family name starts with ${letter.toUpperCase()}`,
    matches: (athlete: Athlete) => surnameInitial(athlete.name) === letter,
  }))
  .filter((category) => isViableRow(category.matches));

// ---- sports (columns) ----------------------------------------------------

const SPORT_HINTS: Record<SportId, string> = {
  football: 'Played professional football (soccer)',
  nba: 'Played in the NBA',
  ufc: 'Fought in the UFC',
  f1: 'Started a Formula 1 Grand Prix',
  tennis: 'Played professional tennis',
};

export const SPORT_CATEGORIES: readonly Category[] = SPORTS.map((sport) => ({
  id: `sport:${sport.id}`,
  label: sport.label,
  axis: 'col' as const,
  group: 'sport' as const,
  hint: SPORT_HINTS[sport.id],
  matches: (athlete: Athlete) => athlete.sport === sport.id,
}));

// ---- assembled axes ------------------------------------------------------

/** Rows that count as geographic, for the "every board has a place" rule. */
export const GEOGRAPHIC_GROUPS: readonly CategoryGroup[] = ['region', 'country'];

export const ROW_CATEGORIES: readonly Category[] = [
  ...REGION_CATEGORIES,
  ...COUNTRY_CATEGORIES,
  ...ERA_CATEGORIES,
  ...LETTER_CATEGORIES,
];

export const COL_CATEGORIES: readonly Category[] = SPORT_CATEGORIES;

export const ALL_CATEGORIES: readonly Category[] = [...ROW_CATEGORIES, ...COL_CATEGORIES];

const BY_ID = new Map<string, Category>(ALL_CATEGORIES.map((c) => [c.id, c]));

export function categoryById(id: string): Category | undefined {
  return BY_ID.get(id);
}

export { regionById };
