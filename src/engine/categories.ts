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
export type CategoryGroup =
  | 'region'
  | 'country'
  | 'sport'
  | 'era'
  | 'letter'
  | 'reach'
  | 'origin'
  | 'name'
  | 'build'
  | 'blend';

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
  /**
   * Whether the label needs explaining at all. "Spain" and "Surname F" say
   * exactly what they mean; "Southern Europe" does not. Only ambiguous
   * headings get a subtitle and a tappable panel — putting one on every
   * heading was noise that buried the case that actually mattered.
   */
  explain: boolean;
  /** Compact form of `hint`, rendered under the heading when `explain`. */
  shortHint?: string;
  matches(athlete: Athlete): boolean;
}

/** "Spain, Italy, Portugal +2" — the gutter cannot hold 22 country names. */
function condense(items: string[], keep: number): string {
  if (items.length <= keep) return items.join(', ');
  return `${items.slice(0, keep).join(', ')} +${items.length - keep}`;
}

/** A row must clear this in at least `MIN_VIABLE_COLUMNS` sports to be usable. */
export const MIN_ROW_POOL = 6;
const MIN_POOL = MIN_ROW_POOL;
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
 * Which sports a row can actually field a cell in. This is the fact every mode
 * filter is built on: the daily board needs three, the Football x NBA duel needs
 * exactly those two — and a row that fields six footballers and six NBA players
 * but nothing else is useless to the first and perfect for the second.
 */
function viableSportsFor(matches: (a: Athlete) => boolean): ReadonlySet<SportId> {
  // One pass rather than one per sport. With the compound rows the catalogue is
  // large enough that five full scans per candidate is the slowest thing that
  // happens at module load.
  const counts = new Map<SportId, number>();
  for (const athlete of ATHLETES) {
    if (matches(athlete)) counts.set(athlete.sport, (counts.get(athlete.sport) ?? 0) + 1);
  }
  const out = new Set<SportId>();
  for (const sport of SPORTS) {
    if ((counts.get(sport.id) ?? 0) >= MIN_POOL) out.add(sport.id);
  }
  return out;
}

/**
 * Keeps a generated row out of the daily catalogue unless it can fill three
 * columns. Without this the board could offer a heading that no valid grid can
 * ever use.
 */
function isViableRow(matches: (a: Athlete) => boolean): boolean {
  return viableSportsFor(matches).size >= MIN_VIABLE_COLUMNS;
}

// ---- regions -------------------------------------------------------------

export const REGION_CATEGORIES: readonly Category[] = REGIONS.map((region) => ({
  id: `region:${region.id}`,
  label: region.label,
  axis: 'row' as const,
  group: 'region' as const,
  hint: rosterCountriesIn(region.id).join(', '),
  explain: true,
  shortHint: condense(rosterCountriesIn(region.id), 3),
  matches: (athlete: Athlete) => athlete.region === region.id,
}));

// ---- countries -----------------------------------------------------------

/**
 * Generated rather than hand-listed so the set grows with the roster. A country
 * row is sharper than its region ("Spain × Formula 1" beats "Southern Europe ×
 * Formula 1"), and it sidesteps the region-boundary ambiguity entirely.
 */
const COUNTRY_CANDIDATES: readonly Category[] = [...new Set(ATHLETES.map((a) => a.country))]
  .sort()
  .map((country) => ({
    id: `country:${country.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    label: country,
    axis: 'row' as const,
    group: 'country' as const,
    hint: `Represented ${country}`,
    explain: false,
    matches: (athlete: Athlete) => athlete.country === country,
  }));

export const COUNTRY_CATEGORIES: readonly Category[] = COUNTRY_CANDIDATES.filter((c) =>
  isViableRow(c.matches),
);

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
  explain: false,
  matches: (athlete: Athlete) =>
    athlete.birthYear !== undefined && athlete.birthYear >= band.min && athlete.birthYear < band.max,
}));

// ---- exact birth year ----------------------------------------------------

/**
 * The single most valuable row family for the deep end of the dive, and it
 * needed no new data at all.
 *
 * Depth needs rows that are narrow in *both* columns, and almost nothing is:
 * regions, decades, origin stories and name shapes are all broad in football,
 * so below the ~30-answer line the board collapsed onto surname letters and
 * small countries — 84% of deep row slots between them. An exact year is narrow
 * by construction: 22 of them field six or more in both sports and 21 of those
 * sit entirely under 30 answers.
 *
 * They share the `era` group with the decade bands deliberately. A board
 * showing "Born 1980s" beside "Born in 1985" would be asking one question
 * twice, and the group cap is what stops it.
 */
const BIRTH_YEAR_CANDIDATES: readonly Category[] = [
  ...new Set(ATHLETES.map((a) => a.birthYear).filter((y): y is number => y !== undefined)),
]
  .sort((a, b) => a - b)
  .map((year) => ({
    id: `era:year-${year}`,
    label: `Born in ${year}`,
    axis: 'row' as const,
    group: 'era' as const,
    hint: `Born during the calendar year ${year}`,
    explain: false,
    matches: (athlete: Athlete) => athlete.birthYear === year,
  }));

/**
 * Pairs of consecutive years, alongside the exact years. Singles are narrow
 * enough for the last two rows but too narrow for the middle of the board;
 * pairs land squarely in the 12-40 window that rows 3 and 4 draw from. 35 of
 * them field six a side.
 *
 * A pair strictly contains its two singles, so `buildBoard` rejects any row
 * whose answers nest inside a row already on the board. Without that check a
 * board could ask "Born in 1990" and "Born in 1990 or 1991" in the same breath.
 */
const BIRTH_YEAR_PAIR_CANDIDATES: readonly Category[] = [
  ...new Set(ATHLETES.map((a) => a.birthYear).filter((y): y is number => y !== undefined)),
]
  .sort((a, b) => a - b)
  .map((year) => ({
    id: `era:years-${year}-${year + 1}`,
    label: `Born in ${year} or ${year + 1}`,
    axis: 'row' as const,
    group: 'era' as const,
    hint: `Born during ${year} or ${year + 1}`,
    explain: false,
    matches: (athlete: Athlete) => athlete.birthYear === year || athlete.birthYear === year + 1,
  }));

// ---- tournament years ----------------------------------------------------

/**
 * Row one was the thinnest window on the board — 22 candidates against 50 for
 * row six — because it wants rows that are broad in both columns, and almost
 * everything broad in football is thin in the NBA. A quarter of the roster was
 * born in a World Cup year, which is broad on both sides and, unlike "Born
 * 1990s", carries some flavour.
 *
 * World Cups fall on years congruent to 2 mod 4 and summer Olympics on 0 mod 4,
 * so the two rows are disjoint by construction and never give each other away.
 */
const WORLD_CUP_YEARS: ReadonlySet<number> = new Set([
  1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994,
  1998, 2002, 2006, 2010, 2014, 2018, 2022,
]);

const OLYMPIC_YEARS: ReadonlySet<number> = new Set([
  1936, 1948, 1952, 1956, 1960, 1964, 1968, 1972, 1976, 1980, 1984, 1988, 1992, 1996, 2000,
  2004, 2008, 2012, 2016, 2021,
]);

const TOURNAMENT_CANDIDATES: readonly Category[] = [
  {
    id: 'era:world-cup-year',
    label: 'World Cup year',
    hint: 'Born in a year the football World Cup was played',
    years: WORLD_CUP_YEARS,
  },
  {
    id: 'era:olympic-year',
    label: 'Olympic year',
    hint: 'Born in a year the summer Olympics were held',
    years: OLYMPIC_YEARS,
  },
].map((row) => ({
  id: row.id,
  label: row.label,
  axis: 'row' as const,
  group: 'era' as const,
  hint: row.hint,
  explain: true,
  shortHint: row.hint,
  matches: (athlete: Athlete) =>
    athlete.birthYear !== undefined && row.years.has(athlete.birthYear),
}));

// ---- build ---------------------------------------------------------------

/**
 * The one physical attribute where the two columns disagree violently, which is
 * what makes it worth asking. It also means almost no threshold is playable:
 * "under 185cm" is 446 footballers and 8 NBA players, and a row that lopsided
 * fits no window. Only the narrow band where the two distributions overlap
 * works, which is why there are two of these rather than a ladder.
 */
const HEIGHT_BANDS: Array<{ id: string; label: string; min: number; max: number }> = [
  { id: '190-194', label: '190-194cm', min: 190, max: 195 },
  { id: '193-195', label: '193-195cm', min: 193, max: 196 },
];

const BUILD_CANDIDATES: readonly Category[] = HEIGHT_BANDS.map((band) => ({
  id: `build:${band.id}`,
  label: band.label,
  axis: 'row' as const,
  group: 'build' as const,
  hint: `Stands between ${band.min}cm and ${band.max - 1}cm tall`,
  explain: true,
  shortHint: `${band.min}-${band.max - 1}cm tall`,
  matches: (athlete: Athlete) =>
    athlete.heightCm !== undefined && athlete.heightCm >= band.min && athlete.heightCm < band.max,
}));

// ---- surname initial -----------------------------------------------------

/**
 * Single letters rather than A-C style buckets. Buckets are three times wider
 * for no extra interest — "A-C x Football" offers 115 valid answers where "M x
 * Football" offers 56 — and single letters give 20 rows instead of 7.
 */
const LETTER_CANDIDATES: readonly Category[] = [...'abcdefghijklmnopqrstuvwxyz']
  .map((letter) => ({
    id: `letter:${letter}`,
    label: `Surname ${letter.toUpperCase()}`,
    axis: 'row' as const,
    group: 'letter' as const,
    hint: `Family name starts with ${letter.toUpperCase()}`,
    explain: false,
    matches: (athlete: Athlete) => surnameInitial(athlete.name) === letter,
  }));

export const LETTER_CATEGORIES: readonly Category[] = LETTER_CANDIDATES.filter((c) =>
  isViableRow(c.matches),
);

/**
 * Given names, in the same group as surnames rather than a group of their own.
 * They add rows a two-column board badly needs — eight of them are narrow
 * enough for the deep levels — but "Surname T" and "Given name V" on one board
 * is the same question twice, and sharing a group is what prevents it.
 */
const GIVEN_NAME_CANDIDATES: readonly Category[] = [...'abcdefghijklmnopqrstuvwxyz'].map(
  (letter) => ({
    id: `letter:given-${letter}`,
    label: `Given name ${letter.toUpperCase()}`,
    axis: 'row' as const,
    group: 'letter' as const,
    hint: `First name starts with ${letter.toUpperCase()}`,
    explain: false,
    matches: (athlete: Athlete) => (tokens(athlete.name)[0] ?? '').charAt(0) === letter,
  }),
);

/**
 * The letter a surname ENDS with. A different question from the letter it
 * starts with — you have to picture the whole name rather than scan an
 * alphabetical list — and unusually well suited to a two-sport board: 16 of the
 * 26 field six a side and 9 are tight enough for the bottom rows.
 */
const SURNAME_END_CANDIDATES: readonly Category[] = [...'abcdefghijklmnopqrstuvwxyz'].map(
  (letter) => ({
    id: `letter:ends-${letter}`,
    label: `Surname ends ${letter.toUpperCase()}`,
    axis: 'row' as const,
    group: 'letter' as const,
    hint: `Family name ends with ${letter.toUpperCase()}`,
    explain: false,
    matches: (athlete: Athlete) => {
      const parts = tokens(athlete.name);
      return (parts[parts.length - 1] ?? '').endsWith(letter);
    },
  }),
);

/**
 * The letter a surname CONTAINS, anywhere. A different act from the initial:
 * you cannot scan an alphabetical list, you have to spell the name out.
 *
 * Only the uncommon letters are here. The common ones are viable but useless —
 * "Surname has A" is 438 footballers, broad enough for row one and nothing
 * else — whereas J, W, Z and F are narrow enough to carry the middle of the
 * board and are the letters a player actually has to hunt for.
 */
const CONTAINS_LETTERS = 'bfjpvwyz';

const SURNAME_CONTAINS_CANDIDATES: readonly Category[] = [...CONTAINS_LETTERS].map((letter) => ({
  id: `letter:has-${letter}`,
  label: `Surname has ${letter.toUpperCase()}`,
  axis: 'row' as const,
  group: 'letter' as const,
  hint: `Family name contains the letter ${letter.toUpperCase()} anywhere`,
  explain: false,
  matches: (athlete: Athlete) => {
    const parts = tokens(athlete.name);
    return (parts[parts.length - 1] ?? '').includes(letter);
  },
}));

// ---- Wikipedia reach -----------------------------------------------------

/**
 * How many language Wikipedias carry an article about an athlete: a free,
 * stable proxy for global fame. This is the workable form of "1M+ Instagram
 * followers" — Wikidata records no follower counts, and a follower threshold
 * would rot as the number moved, making yesterday's correct answer wrong.
 *
 * Only the two extremes are rows. The middle of the distribution is both huge
 * (a 342-answer cell) and unguessable — nobody can tell 30 languages from 50 —
 * whereas "globally famous" and "obscure" are judgements a fan can actually
 * make. Athletes in the gap match neither row, exactly as an athlete with no
 * birth year matches no decade.
 */
const REACH_BANDS: Array<{ id: string; label: string; min: number; max: number; blurb: string }> = [
  {
    id: 'global',
    label: 'Global name',
    min: 75,
    max: Infinity,
    blurb: 'Has a Wikipedia article in 75 or more languages',
  },
  {
    id: 'deepcut',
    label: 'Deep cut',
    min: 0,
    max: 15,
    blurb: 'Has a Wikipedia article in fewer than 15 languages',
  },
];

export const REACH_CATEGORIES: readonly Category[] = REACH_BANDS.map((band) => ({
  id: `reach:${band.id}`,
  label: band.label,
  axis: 'row' as const,
  group: 'reach' as const,
  hint: band.blurb,
  explain: true,
  shortHint: band.max === Infinity ? `Wikipedia in ${band.min}+ languages` : `Wikipedia in <${band.max} languages`,
  matches: (athlete: Athlete) =>
    athlete.wikipediaLanguages !== undefined &&
    athlete.wikipediaLanguages >= band.min &&
    athlete.wikipediaLanguages < band.max,
}));

// ---- origin story --------------------------------------------------------

/**
 * Biographical rows measured as viable across football and the NBA. Each one
 * survived a coverage probe; the ones that did not are recorded in the README
 * so nobody re-proposes them.
 */
const ORIGIN_ROWS: Array<{ id: string; label: string; hint: string; matches: (a: Athlete) => boolean }> = [
  {
    id: 'dual',
    label: 'Dual national',
    hint: 'Holds citizenship of more than one country',
    matches: (a) => a.citizenships !== undefined && a.citizenships > 1,
  },
  {
    id: 'capital',
    label: 'Born in a capital',
    hint: 'Born in the capital city of a country',
    matches: (a) => a.bornInCapital === true,
  },
  {
    id: 'shared-city',
    label: 'Shares a birth city',
    hint: 'Born in the same city as another athlete in this game',
    matches: (a) => a.birthCity !== undefined && SHARED_BIRTH_CITIES.has(a.birthCity),
  },
];

/**
 * Cities that produced more than one athlete in the roster. The pairings are
 * the appeal: Lagos gives Osimhen alongside Olajuwon, Akron gives LeBron and
 * Curry, Rosario gives Messi and Icardi.
 */
const SHARED_BIRTH_CITIES: ReadonlySet<string> = (() => {
  const counts = new Map<string, number>();
  for (const athlete of ATHLETES) {
    if (athlete.birthCity) counts.set(athlete.birthCity, (counts.get(athlete.birthCity) ?? 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([city]) => city));
})();

const ORIGIN_CANDIDATES: readonly Category[] = ORIGIN_ROWS.map((row) => ({
  id: `origin:${row.id}`,
  label: row.label,
  axis: 'row' as const,
  group: 'origin' as const,
  hint: row.hint,
  explain: true,
  shortHint: row.hint,
  matches: row.matches,
}));

export const ORIGIN_CATEGORIES: readonly Category[] = ORIGIN_CANDIDATES.filter((c) =>
  isViableRow(c.matches),
);

// ---- name shapes ---------------------------------------------------------

/**
 * Pure wordplay over the display name. No data fetch, 100% coverage, and the
 * only row family that can never rot — which makes it the cheapest way to put
 * a genuinely odd question on the board.
 */
const NAME_ROWS: Array<{ id: string; label: string; hint: string; matches: (a: Athlete) => boolean }> = [
  {
    id: 'mononym',
    label: 'Known by one name',
    hint: 'Goes by a single name — Pele, Neymar, Marta',
    matches: (a) => tokens(a.name).length === 1,
  },
  {
    id: 'alliterative',
    label: 'Same initials',
    hint: 'First name and family name start with the same letter',
    matches: (a) => {
      const parts = tokens(a.name);
      const first = parts[0]?.charAt(0);
      const last = parts[parts.length - 1]?.charAt(0);
      return parts.length > 1 && first !== undefined && first === last;
    },
  },
  {
    id: 'short-surname',
    label: 'Short surname',
    hint: 'Family name is four letters or fewer',
    matches: (a) => {
      const parts = tokens(a.name);
      const last = parts[parts.length - 1];
      return parts.length > 1 && last !== undefined && last.length <= 4;
    },
  },
  {
    id: 'shared-surname',
    label: 'Shared surname',
    hint: 'Another athlete in this game has the same family name',
    matches: (a) => {
      const parts = tokens(a.name);
      const last = parts[parts.length - 1];
      return last !== undefined && SHARED_SURNAMES.has(last);
    },
  },
  {
    id: 'double-letter',
    label: 'Double letter',
    hint: 'Family name contains the same letter twice in a row',
    matches: (a) => {
      const parts = tokens(a.name);
      const last = parts[parts.length - 1] ?? '';
      return /(.)\1/.test(last);
    },
  },
  {
    id: 'long-surname',
    label: 'Long surname',
    hint: 'Family name is ten letters or more',
    matches: (a) => {
      const parts = tokens(a.name);
      return parts.length > 1 && (parts[parts.length - 1] ?? '').length >= 10;
    },
  },
  {
    id: 'three-part',
    label: 'Three-part name',
    hint: 'Goes by three or more names',
    matches: (a) => tokens(a.name).length >= 3,
  },
  {
    id: 'hyphenated',
    label: 'Hyphenated name',
    hint: 'Name contains a hyphen',
    matches: (a) => a.name.includes('-'),
  },
  {
    id: 'bookends',
    label: 'Surname bookends',
    hint: 'Family name starts and ends with the same letter',
    matches: (a) => {
      const parts = tokens(a.name);
      const last = parts[parts.length - 1] ?? '';
      return last.length > 2 && last.charAt(0) === last.charAt(last.length - 1);
    },
  },
  {
    id: 'even-names',
    label: 'Names same length',
    hint: 'First name and family name have the same number of letters',
    matches: (a) => {
      const parts = tokens(a.name);
      return parts.length > 1 && (parts[0] ?? '').length === (parts[parts.length - 1] ?? '').length;
    },
  },
  {
    id: 'vowel-surname',
    label: 'Surname starts on a vowel',
    hint: 'Family name begins with A, E, I, O or U',
    matches: (a) => {
      const parts = tokens(a.name);
      return /^[aeiou]/.test(parts[parts.length - 1] ?? '');
    },
  },
];

/**
 * Derived from the display name rather than Wikidata's P734 "family name".
 * P734 records the legal name — Cristiano Ronaldo's is "Aveiro" and Salah's is
 * "Ghaly" — so it would never link the names players actually use, and it
 * returns unlabelled QIDs that a label-keyed index would merge into one bogus
 * surname group.
 */
const SHARED_SURNAMES: ReadonlySet<string> = (() => {
  const counts = new Map<string, number>();
  for (const athlete of ATHLETES) {
    const parts = tokens(athlete.name);
    if (parts.length < 2) continue;
    const last = parts[parts.length - 1] as string;
    counts.set(last, (counts.get(last) ?? 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([name]) => name));
})();

const NAME_CANDIDATES: readonly Category[] = NAME_ROWS.map((row) => ({
  id: `name:${row.id}`,
  label: row.label,
  axis: 'row' as const,
  group: 'name' as const,
  hint: row.hint,
  explain: true,
  shortHint: row.hint,
  matches: row.matches,
}));

export const NAME_CATEGORIES: readonly Category[] = NAME_CANDIDATES.filter((c) =>
  isViableRow(c.matches),
);

// ---- blends --------------------------------------------------------------

/**
 * Two conditions at once. Every other row family asks one thing; these ask a
 * player to hold a place and a period together, which is a different and
 * harder act than either alone.
 *
 * They are deliberately narrow in their pairings. A region and an era read as
 * one question — "an Eastern European born in the eighties" is a person you can
 * picture. A surname letter and a citizenship count read as two questions
 * stapled together, so those combinations are not generated.
 *
 * Nesting does the safety work: a blend is a strict subset of both its parents,
 * so `buildBoard` will never put "Africa" or "Born 1990s" on the same board as
 * "Africa - 1990s". The blends have their own group so the per-group cap keeps
 * a board from becoming nothing but compounds.
 */
const BLEND_ERAS: Array<{ id: string; label: string; min: number; max: number }> = [
  { id: 'pre80', label: 'Pre-1980', min: 0, max: 1980 },
  { id: '80s', label: '1980s', min: 1980, max: 1990 },
  { id: '90s', label: '1990s', min: 1990, max: 2000 },
  { id: '00s', label: '2000s', min: 2000, max: Infinity },
];

const bornIn = (era: (typeof BLEND_ERAS)[number]) => (a: Athlete) =>
  a.birthYear !== undefined && a.birthYear >= era.min && a.birthYear < era.max;

const eraPhrase = (era: (typeof BLEND_ERAS)[number]) =>
  era.max === Infinity
    ? `born in ${era.min} or later`
    : era.min === 0
      ? `born before ${era.max}`
      : `born between ${era.min} and ${era.max - 1}`;

const blend = (
  id: string,
  label: string,
  hint: string,
  matches: (a: Athlete) => boolean,
): Category => ({
  id: `blend:${id}`,
  label,
  axis: 'row',
  group: 'blend',
  hint,
  explain: true,
  shortHint: hint,
  matches,
});

const BLEND_CANDIDATES: readonly Category[] = [
  // Place and period. The richest pairing: 22 of these field six a side.
  ...REGIONS.flatMap((region) =>
    BLEND_ERAS.map((era) =>
      blend(
        `${region.id}-${era.id}`,
        `${region.label} · ${era.label}`,
        `From ${region.label}, ${eraPhrase(era)}`,
        (a) => a.region === region.id && bornIn(era)(a),
      ),
    ),
  ),
  // Place and passport.
  ...REGIONS.map((region) =>
    blend(
      `${region.id}-dual`,
      `${region.label} · Dual national`,
      `From ${region.label}, and holds more than one citizenship`,
      (a) => a.region === region.id && a.citizenships !== undefined && a.citizenships > 1,
    ),
  ),
  // Period and passport.
  ...BLEND_ERAS.map((era) =>
    blend(
      `${era.id}-dual`,
      `${era.label} · Dual national`,
      `Holds more than one citizenship, ${eraPhrase(era)}`,
      (a) => bornIn(era)(a) && a.citizenships !== undefined && a.citizenships > 1,
    ),
  ),
  // Period and birthplace.
  ...BLEND_ERAS.map((era) =>
    blend(
      `${era.id}-capital`,
      `${era.label} · Capital-born`,
      `Born in a country's capital city, ${eraPhrase(era)}`,
      (a) => bornIn(era)(a) && a.bornInCapital === true,
    ),
  ),
];

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
  explain: true,
  matches: (athlete: Athlete) => athlete.sport === sport.id,
}));

// ---- assembled axes ------------------------------------------------------

/** Rows that count as geographic, for the "every board has a place" rule. */
export const GEOGRAPHIC_GROUPS: readonly CategoryGroup[] = ['region', 'country'];

/**
 * Every row the generators produced, before any mode narrows them down. The
 * three-column rule that shapes the daily board would throw away exactly the
 * rows a two-column mode wants — Serbia fields six footballers and plenty of
 * NBA players and nothing else, which is a dead row on a 3x3 and a good one on
 * a Football x NBA duel.
 */
const ROW_CANDIDATES: readonly Category[] = [
  ...REGION_CATEGORIES,
  ...COUNTRY_CANDIDATES,
  ...ERA_CATEGORIES,
  ...BIRTH_YEAR_CANDIDATES,
  ...BIRTH_YEAR_PAIR_CANDIDATES,
  ...TOURNAMENT_CANDIDATES,
  ...REACH_CATEGORIES,
  ...ORIGIN_CANDIDATES,
  ...NAME_CANDIDATES,
  ...BUILD_CANDIDATES,
  ...LETTER_CANDIDATES,
  ...GIVEN_NAME_CANDIDATES,
  ...SURNAME_END_CANDIDATES,
  ...SURNAME_CONTAINS_CANDIDATES,
  ...BLEND_CANDIDATES,
];

const VIABLE_SPORTS: ReadonlyMap<string, ReadonlySet<SportId>> = new Map(
  ROW_CANDIDATES.map((row) => [row.id, viableSportsFor(row.matches)] as const),
);

/**
 * Rows a mode can use: ones that can fill a cell in every sport it shows.
 *
 * A mode with fixed columns names them, and gets the rows viable in exactly
 * those two. A mode whose columns vary cannot name them, so it asks instead for
 * rows viable in at least as many sports as it has columns — anything narrower
 * would be a heading some boards could not fill.
 */
export function rowsForSports(
  sportIds: readonly SportId[],
  minViableSports = MIN_VIABLE_COLUMNS,
): readonly Category[] {
  return ROW_CANDIDATES.filter((row) => {
    const viable = VIABLE_SPORTS.get(row.id);
    if (viable === undefined) return false;
    return sportIds.length > 0
      ? sportIds.every((id) => viable.has(id))
      : viable.size >= minViableSports;
  });
}

/** Sport columns a mode may use; an empty list means every sport. */
export function colsForSports(sportIds: readonly SportId[]): readonly Category[] {
  if (sportIds.length === 0) return SPORT_CATEGORIES;
  return SPORT_CATEGORIES.filter((col) => sportIds.some((id) => col.id === `sport:${id}`));
}

/** The daily board's row set: anything that can fill three of the five columns. */
export const ROW_CATEGORIES: readonly Category[] = ROW_CANDIDATES.filter(
  (row) => (VIABLE_SPORTS.get(row.id)?.size ?? 0) >= MIN_VIABLE_COLUMNS,
);

export const COL_CATEGORIES: readonly Category[] = SPORT_CATEGORIES;

// Every candidate, not just the daily set — the pool index is keyed off this,
// and a duel-only row with no pool entry would silently read as empty.
export const ALL_CATEGORIES: readonly Category[] = [...ROW_CANDIDATES, ...SPORT_CATEGORIES];

const BY_ID = new Map<string, Category>(ALL_CATEGORIES.map((c) => [c.id, c]));

export function categoryById(id: string): Category | undefined {
  return BY_ID.get(id);
}

export { regionById };
