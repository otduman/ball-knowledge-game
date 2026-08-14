import type { Category, CategoryGroup } from './categories';
import { colsForSports, rowsForSports } from './categories';
import type { Level } from './levels';
import { COLUMN_SPORTS, MAX_DEPTH, levelAt } from './levels';
import { poolFor } from './pools';
import { hashString, mulberry32, shuffle } from './rng';

export interface Board {
  /** Puzzle number, 1-based from the epoch: which day's dive this is. */
  number: number;
  /** 1-based depth within that dive. */
  depth: number;
  /** 0 for the day's dive; 1+ for extra practice runs. */
  variant: number;
  label: string;
  rows: Category[];
  cols: Category[];
}

export function cellCount(board: Board): number {
  return board.rows.length * board.cols.length;
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
  level: Level,
): boolean {
  const perGroup = new Map<CategoryGroup, number>();
  for (const row of rows) {
    const next = (perGroup.get(row.group) ?? 0) + 1;
    if (next > level.maxRowsPerGroup) return false;
    perGroup.set(row.group, next);
  }
  if (perGroup.size < level.minDistinctGroups) return false;

  for (const row of rows) {
    for (const col of cols) {
      const size = poolFor(row, col).length;
      if (size < level.minPool) return false;
      if (size > level.maxPool) return false;
    }
  }
  return true;
}

/**
 * Rows whose own cells fall inside a level's window. Filtering here rather than
 * inside the combination walk is the difference between enumerating C(148, 4)
 * — nearly 20 million sets, almost all rejected on their first cell — and
 * C(39, 4). Every rejected row would have been rejected in every set containing
 * it, so this changes only the cost.
 */
function rowsInWindow(level: Level, cols: readonly Category[]): Category[] {
  return rowsForSports(COLUMN_SPORTS).filter((row) =>
    cols.every((col) => {
      const size = poolFor(row, col).length;
      return size >= level.minPool && size <= level.maxPool;
    }),
  );
}

/** Every row combination playable at a depth, in stable order. */
export function feasibleBoards(level: Level): Array<{ rows: Category[]; cols: Category[] }> {
  const cols = [...colsForSports(COLUMN_SPORTS)];
  const out: Array<{ rows: Category[]; cols: Category[] }> = [];

  for (const rows of combinations(rowsInWindow(level, cols), level.rowCount)) {
    if (isFeasible(rows, cols, level)) out.push({ rows, cols });
  }
  return out;
}

type Catalog = Array<{ rows: Category[]; cols: Category[] }>;

const CATALOG_CACHE = new Map<number, Catalog>();

function catalog(level: Level): Catalog {
  const cached = CATALOG_CACHE.get(level.depth);
  if (cached) return cached;
  const built = feasibleBoards(level);
  CATALOG_CACHE.set(level.depth, built);
  return built;
}

/**
 * The multiset of row *kinds* on a board — "country+letter". Boards are served
 * round-robin across signatures rather than uniformly across the catalogue,
 * because uniform sampling makes a group's airtime proportional to how many
 * rows it happens to contain. With 21 surname letters against 2 reach bands,
 * that buried reach on 3% of row slots while letters took 40%.
 */
function signatureOf(entry: { rows: Category[] }): string {
  return entry.rows.map((r) => r.group).sort().join('+');
}

interface Strata {
  signatures: string[];
  bySignature: Map<string, Catalog>;
}

const STRATA_CACHE = new Map<number, Strata>();

/**
 * Strata thinner than this are pooled rather than given a slot of their own.
 * Equal airtime per shape is only free while every shape has enough boards to
 * sustain it: a shape is served once every `signatures.length` boards, so one
 * holding two boards recycles almost immediately. The floor scales with the
 * catalogue because a fixed number is meaningless across depths whose
 * catalogues differ by an order of magnitude.
 */
function minStratum(poolSize: number): number {
  return Math.max(25, Math.floor(poolSize / 3));
}

const MISC_SIGNATURE = '*';

function strataFor(pool: Catalog, depth: number): Strata {
  const cached = STRATA_CACHE.get(depth);
  if (cached) return cached;

  const grouped = new Map<string, Catalog>();
  for (const entry of pool) {
    const sig = signatureOf(entry);
    const list = grouped.get(sig) ?? [];
    list.push(entry);
    grouped.set(sig, list);
  }

  const floor = minStratum(pool.length);
  const bySignature = new Map<string, Catalog>();
  const misc: Catalog = [];
  for (const sig of [...grouped.keys()].sort()) {
    const list = grouped.get(sig) as Catalog;
    if (list.length >= floor) bySignature.set(sig, list);
    else misc.push(...list);
  }
  if (misc.length > 0) bySignature.set(MISC_SIGNATURE, misc);

  const strata: Strata = { signatures: [...bySignature.keys()].sort(), bySignature };
  STRATA_CACHE.set(depth, strata);
  return strata;
}

// Shuffling a catalogue is O(n), so the ordering for a cycle is computed once
// instead of on every board build.
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
 * Where a board sits in the walk. Daily dives take the front of the index
 * space, one per puzzle number, so the sequence a player actually sees walks
 * the catalogue densely; practice runs live past `DAILY_SPAN`.
 *
 * The obvious `(number - 1) * 8 + variant` is dense over all boards but makes
 * the daily track a stride-8 subsequence, and the round-robin over board shapes
 * reads `index % shapeCount`. Whenever that stride shares a factor with the
 * shape count the round-robin collapses onto a handful of shapes.
 */
const DAILY_SPAN = 100_000;
const PRACTICE_PER_DAY = 7;

function ordinalFor(number: number, variant: number): number {
  const day = Math.max(0, number - 1);
  if (variant <= 0) return day;
  return DAILY_SPAN + day * PRACTICE_PER_DAY + (variant - 1);
}

/**
 * Builds one board of a dive. Deterministic: the same day and depth always
 * yield the same board.
 *
 * Selection walks a seeded permutation of the feasible catalogue rather than
 * picking at random, so every board is used once before any repeats.
 */
export function buildBoard(number: number, depth: number, variant = 0): Board {
  const level = levelAt(depth);
  const pool = catalog(level);
  if (pool.length === 0) {
    throw new Error(`No feasible board at depth ${level.depth} for the current roster.`);
  }

  // Offset each depth into its own stretch of the walk, so the levels of one
  // dive are not all drawn from the same position in their catalogues.
  const index = ordinalFor(number, variant) + level.depth * 977;

  const { signatures, bySignature } = strataFor(pool, level.depth);
  const signature = signatures[index % signatures.length] as string;
  const bucket = bySignature.get(signature) as Catalog;
  const withinIndex = Math.floor(index / signatures.length);

  const cycle = Math.floor(withinIndex / bucket.length);
  const order = permutationFor(bucket, cycle, `${level.depth}#${signature}`);
  const picked = order[withinIndex % bucket.length] as { rows: Category[]; cols: Category[] };

  const layoutRng = mulberry32(hashString(`layout:${number}:${depth}:${variant}`));
  return {
    number,
    depth: level.depth,
    variant,
    label: variant === 0 ? `Dive No. ${String(number).padStart(3, '0')}` : `Practice dive ${variant}`,
    rows: shuffle(picked.rows, layoutRng),
    cols: shuffle(picked.cols, layoutRng),
  };
}

/** Board counts per depth, for the dive probe and the feasibility tests. */
export function catalogSizes(): Array<{ depth: number; boards: number }> {
  return Array.from({ length: MAX_DEPTH }, (_, i) => ({
    depth: i + 1,
    boards: catalog(levelAt(i + 1)).length,
  }));
}
