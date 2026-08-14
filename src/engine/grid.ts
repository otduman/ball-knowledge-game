import type { Category, CategoryGroup } from './categories';
import { GEOGRAPHIC_GROUPS, colsForSports, rowsForSports } from './categories';
import type { GameMode, GridConstraints, ModeId } from './modes';
import { DEFAULT_MODE, MODES } from './modes';
import { poolFor } from './pools';
import { hashString, mulberry32, shuffle } from './rng';

export type { GridConstraints } from './modes';

export interface Grid {
  /** Puzzle number, 1-based from the epoch. Shown as "Grid No. 042". */
  number: number;
  /** 0 for the daily grid; 1+ for extra practice grids on the same day. */
  variant: number;
  mode: ModeId;
  label: string;
  rows: Category[];
  cols: Category[];
}

export const DEFAULT_CONSTRAINTS: GridConstraints = MODES.daily.constraints;

export function cellCount(grid: Grid): number {
  return grid.rows.length * grid.cols.length;
}

function combinations<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  const current: T[] = [];

  function walk(start: number): void {
    if (current.length === size) {
      out.push(current.slice());
      return;
    }
    for (let i = start; i < items.length; i++) {
      current.push(items[i] as T);
      walk(i + 1);
      current.pop();
    }
  }

  walk(0);
  return out;
}

export function isFeasible(
  rows: readonly Category[],
  cols: readonly Category[],
  constraints: GridConstraints,
): boolean {
  const geographic = rows.filter((r) => GEOGRAPHIC_GROUPS.includes(r.group)).length;
  if (geographic < constraints.minGeographicRows) return false;

  const perGroup = new Map<CategoryGroup, number>();
  for (const row of rows) {
    const next = (perGroup.get(row.group) ?? 0) + 1;
    const cap = constraints.maxRowsByGroup[row.group] ?? constraints.maxRowsPerGroup;
    if (next > cap) return false;
    perGroup.set(row.group, next);
  }

  let generous = 0;
  let wide = 0;
  for (const row of rows) {
    for (const col of cols) {
      const size = poolFor(row, col).length;
      if (size < constraints.minPool) return false;
      if (size >= constraints.generousPool) generous++;
      if (size >= constraints.widePool) {
        wide++;
        if (wide > constraints.maxWideCells) return false;
      }
    }
  }
  return generous >= constraints.minGenerousCells;
}

/** Every row/column combination that satisfies the constraints, in stable order. */
export function feasibleGrids(
  constraints: GridConstraints = DEFAULT_CONSTRAINTS,
  mode: GameMode = MODES[DEFAULT_MODE],
): Array<{ rows: Category[]; cols: Category[] }> {
  const rowSets = combinations(rowsForSports(mode.sportIds, mode.colCount), mode.rowCount);
  const colSets = combinations(colsForSports(mode.sportIds), mode.colCount);
  const out: Array<{ rows: Category[]; cols: Category[] }> = [];

  for (const rows of rowSets) {
    for (const cols of colSets) {
      if (isFeasible(rows, cols, constraints)) out.push({ rows, cols });
    }
  }
  return out;
}

type Catalog = Array<{ rows: Category[]; cols: Category[] }>;

function constraintKey(c: GridConstraints): string {
  return [
    c.minPool,
    c.minGenerousCells,
    c.generousPool,
    c.widePool,
    c.maxWideCells,
    c.minGeographicRows,
    c.maxRowsPerGroup,
    JSON.stringify(c.maxRowsByGroup),
  ].join(':');
}

const CATALOG_CACHE = new Map<string, Catalog>();

function catalog(mode: GameMode, constraints: GridConstraints): Catalog {
  const key = `${mode.id}#${constraintKey(constraints)}`;
  const cached = CATALOG_CACHE.get(key);
  if (cached) return cached;
  const built = feasibleGrids(constraints, mode);
  CATALOG_CACHE.set(key, built);
  return built;
}

/**
 * The multiset of row *kinds* on a board — "country+letter+region". Boards are
 * served round-robin across signatures rather than uniformly across the
 * catalogue, because uniform sampling makes a group's airtime proportional to
 * how many rows it happens to contain. With 20 letters against 2 reach bands,
 * that buried reach on 3% of row slots while letters took 40%. Stratifying by
 * signature gives each *kind of board* equal exposure, so adding two rows of a
 * new kind actually changes what players see.
 */
function signatureOf(entry: { rows: Category[] }): string {
  return entry.rows.map((r) => r.group).sort().join('+');
}

interface Partitions {
  withPrimary: Catalog;
  withoutPrimary: Catalog;
}

// Splitting a 60k-entry catalogue is O(n); doing it per call made building a
// board scale with the catalogue rather than being effectively free.
const PARTITION_CACHE = new Map<string, Partitions>();

function partitionsFor(pool: Catalog, primaryColumnId: string, key: string): Partitions {
  const cached = PARTITION_CACHE.get(key);
  if (cached) return cached;

  const withPrimary: Catalog = [];
  const withoutPrimary: Catalog = [];
  for (const entry of pool) {
    if (entry.cols.some((c) => c.id === primaryColumnId)) withPrimary.push(entry);
    else withoutPrimary.push(entry);
  }
  const partitions: Partitions = { withPrimary, withoutPrimary };
  PARTITION_CACHE.set(key, partitions);
  return partitions;
}

interface Strata {
  signatures: string[];
  bySignature: Map<string, Catalog>;
}

const STRATA_CACHE = new Map<string, Strata>();

/**
 * Strata thinner than this are pooled together rather than given a slot of
 * their own. Equal airtime across shapes is only free while every shape has
 * enough boards to sustain it: the duel catalogue has shapes holding two boards
 * against shapes holding six hundred, and handing the pair a full 1-in-20 slot
 * recycled it every 40 boards. Nothing in the daily catalogue is this thin — its
 * smallest stratum holds 76 — so this is inert there by construction.
 */
const MIN_STRATUM = 25;
const MISC_SIGNATURE = '*';

function strataFor(pool: Catalog, key: string): Strata {
  const cached = STRATA_CACHE.get(key);
  if (cached) return cached;

  const grouped = new Map<string, Catalog>();
  for (const entry of pool) {
    const sig = signatureOf(entry);
    const list = grouped.get(sig) ?? [];
    list.push(entry);
    grouped.set(sig, list);
  }

  const bySignature = new Map<string, Catalog>();
  const misc: Catalog = [];
  for (const sig of [...grouped.keys()].sort()) {
    const list = grouped.get(sig) as Catalog;
    if (list.length >= MIN_STRATUM) bySignature.set(sig, list);
    else misc.push(...list);
  }
  if (misc.length > 0) bySignature.set(MISC_SIGNATURE, misc);

  const strata: Strata = { signatures: [...bySignature.keys()].sort(), bySignature };
  STRATA_CACHE.set(key, strata);
  return strata;
}

// Shuffling the catalogue is O(n) and the catalogue is large, so the ordering
// for a cycle is computed once instead of on every buildGrid call.
const PERMUTATION_CACHE = new Map<string, Catalog>();

function permutationFor(pool: Catalog, cycle: number, key: string): Catalog {
  const cacheKey = `${key}#${cycle}`;
  const cached = PERMUTATION_CACHE.get(cacheKey);
  if (cached) return cached;
  const order = shuffle(pool, mulberry32(hashString(`cycle:${cycle}`)));
  PERMUTATION_CACHE.set(cacheKey, order);
  return order;
}

/**
 * Where a board sits in the walk. Daily boards take the front of the index
 * space, one per puzzle number, so the sequence a player actually sees walks
 * the catalogue densely; practice boards live past `DAILY_SPAN`.
 *
 * The obvious `(number - 1) * 8 + variant` is dense over all boards but makes
 * the *daily* track a stride-8 subsequence, and the round-robin over board
 * shapes reads `index % shapeCount`. Whenever that stride shared a factor with
 * the shape count the round-robin collapsed: the duel has 16 shapes and its
 * daily track visited two of them, repeating a board every 62 days.
 */
const DAILY_SPAN = 100_000;
const PRACTICE_PER_DAY = 7;

function ordinalFor(number: number, variant: number): number {
  const day = Math.max(0, number - 1);
  if (variant <= 0) return day;
  return DAILY_SPAN + day * PRACTICE_PER_DAY + (variant - 1);
}

/**
 * Builds the grid for a puzzle number. Deterministic: the same number and mode
 * always yield the same board.
 *
 * Selection walks a seeded permutation of the feasible catalogue rather than
 * picking at random, so every grid is used once before any repeats.
 */
export function buildGrid(number: number, variant = 0, modeId: ModeId = DEFAULT_MODE): Grid {
  const mode = MODES[modeId];

  let pool: Catalog = [];
  let usedConstraints = mode.constraints;
  for (const constraints of mode.relaxations) {
    pool = catalog(mode, constraints);
    usedConstraints = constraints;
    if (pool.length > 0) break;
  }
  if (pool.length === 0) {
    throw new Error(`No feasible ${mode.id} grid exists for the current roster.`);
  }

  const ordinal = ordinalFor(number, variant);
  const key = `${mode.id}#${constraintKey(usedConstraints)}`;

  // Split the catalogue by whether it features the primary sport, then walk
  // each side on its own permutation. Weighting this way keeps the "no repeat
  // until exhausted" guarantee inside each partition, which duplicating
  // entries in a single list would have broken.
  let partition = pool;
  let index = ordinal;
  let partitionKey = key;

  if (mode.primaryColumnId !== null) {
    const { withPrimary, withoutPrimary } = partitionsFor(pool, mode.primaryColumnId, key);
    const cycleLength = mode.primaryColumnCycle + 1;
    const wantsOther = ordinal % cycleLength === cycleLength - 1;
    const othersBefore = Math.floor(ordinal / cycleLength);

    partition = withPrimary;
    index = ordinal - othersBefore;
    partitionKey = `${key}#primary`;

    if ((wantsOther && withoutPrimary.length > 0) || withPrimary.length === 0) {
      partition = withoutPrimary;
      index = othersBefore;
      partitionKey = `${key}#other`;
    }
    if (partition.length === 0) partition = pool;
  }

  // Round-robin across board shapes, then walk each shape's own permutation.
  const { signatures, bySignature } = strataFor(partition, partitionKey);
  const signature = signatures[index % signatures.length] as string;
  const bucket = bySignature.get(signature) as Catalog;
  const withinIndex = Math.floor(index / signatures.length);

  const cycle = Math.floor(withinIndex / bucket.length);
  const order = permutationFor(bucket, cycle, `${partitionKey}#${signature}`);
  const picked = order[withinIndex % bucket.length] as { rows: Category[]; cols: Category[] };

  const layoutRng = mulberry32(hashString(`layout:${mode.id}:${number}:${variant}`));
  return {
    number,
    variant,
    mode: mode.id,
    label:
      variant === 0
        ? `${mode.boardName} No. ${String(number).padStart(3, '0')}`
        : `${mode.boardName} practice ${variant}`,
    rows: shuffle(picked.rows, layoutRng),
    cols: shuffle(picked.cols, layoutRng),
  };
}
