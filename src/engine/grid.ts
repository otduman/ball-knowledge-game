import type { Category } from './categories';
import { COL_CATEGORIES, GEOGRAPHIC_GROUPS, ROW_CATEGORIES } from './categories';
import { poolFor } from './pools';
import { hashString, mulberry32, shuffle } from './rng';

export interface Grid {
  /** Puzzle number, 1-based from the epoch. Shown as "Grid No. 042". */
  number: number;
  /** 0 for the daily grid; 1+ for extra practice grids on the same day. */
  variant: number;
  label: string;
  rows: Category[];
  cols: Category[];
}

export interface GridConstraints {
  /** Every intersection must offer at least this many valid answers. */
  minPool: number;
  /** At least this many cells should be comfortable, so a grid is never all deep cuts. */
  minGenerousCells: number;
  /** Pool size at which a cell counts as "generous". */
  generousPool: number;
  /**
   * Cells at or above this many answers are near-free: almost any well-known
   * name in that sport works. They are not banned outright, because the
   * friendlier rows (a common surname letter, a big country) are legitimately
   * broad — they are budgeted instead.
   */
  widePool: number;
  maxWideCells: number;
  /**
   * Every board keeps at least this many geographic rows (region or country).
   * A grid built only from letters and decades loses the "where are they from"
   * hook the game is built around.
   */
  minGeographicRows: number;
  /** Rows from the same group (two decades, say) beyond this are rejected. */
  maxRowsPerGroup: number;
}

export const DEFAULT_CONSTRAINTS: GridConstraints = {
  minPool: 6,
  minGenerousCells: 3,
  generousPool: 15,
  widePool: 150,
  maxWideCells: 1,
  minGeographicRows: 1,
  maxRowsPerGroup: 2,
};

/** Progressively looser fallbacks, used only if the strict pass finds nothing. */
const RELAXATIONS: GridConstraints[] = [
  DEFAULT_CONSTRAINTS,
  { ...DEFAULT_CONSTRAINTS, minPool: 5, minGenerousCells: 2, generousPool: 12, maxWideCells: 2 },
  { ...DEFAULT_CONSTRAINTS, minPool: 4, minGenerousCells: 1, generousPool: 10, maxWideCells: 3, maxRowsPerGroup: 3 },
  {
    minPool: 3,
    minGenerousCells: 0,
    generousPool: 1,
    widePool: Infinity,
    maxWideCells: 9,
    minGeographicRows: 0,
    maxRowsPerGroup: 3,
  },
];

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

  const perGroup = new Map<string, number>();
  for (const row of rows) {
    const next = (perGroup.get(row.group) ?? 0) + 1;
    if (next > constraints.maxRowsPerGroup) return false;
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
): Array<{ rows: Category[]; cols: Category[] }> {
  const rowSets = combinations(ROW_CATEGORIES, 3);
  const colSets = combinations(COL_CATEGORIES, 3);
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
  ].join(':');
}

const CATALOG_CACHE = new Map<string, Catalog>();

function catalog(constraints: GridConstraints): Catalog {
  const key = constraintKey(constraints);
  const cached = CATALOG_CACHE.get(key);
  if (cached) return cached;
  const built = feasibleGrids(constraints);
  CATALOG_CACHE.set(key, built);
  return built;
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
 * Builds the grid for a puzzle number. Deterministic: the same number always
 * yields the same board.
 *
 * Selection walks a seeded permutation of the feasible catalogue rather than
 * picking at random, so every grid is used once before any repeats.
 */
export function buildGrid(number: number, variant = 0): Grid {
  let pool: Catalog = [];
  let usedConstraints = DEFAULT_CONSTRAINTS;
  for (const constraints of RELAXATIONS) {
    pool = catalog(constraints);
    usedConstraints = constraints;
    if (pool.length > 0) break;
  }
  if (pool.length === 0) {
    throw new Error('No feasible grid exists for the current roster.');
  }

  const ordinal = Math.max(0, (number - 1) * 8 + variant);
  const cycle = Math.floor(ordinal / pool.length);
  const indexInCycle = ordinal % pool.length;
  const order = permutationFor(pool, cycle, constraintKey(usedConstraints));
  const picked = order[indexInCycle] as { rows: Category[]; cols: Category[] };

  const layoutRng = mulberry32(hashString(`layout:${number}:${variant}`));
  return {
    number,
    variant,
    label: variant === 0 ? `Grid No. ${String(number).padStart(3, '0')}` : `Practice ${variant}`,
    rows: shuffle(picked.rows, layoutRng),
    cols: shuffle(picked.cols, layoutRng),
  };
}
