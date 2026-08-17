import type { Category, CategoryGroup } from './categories';
import { colsForSports, rowsForSports } from './categories';
import type { Level } from './levels';
import { COLUMN_SPORTS, LEVELS, MAX_ROWS_PER_GROUP, levelAt } from './levels';
import { categoryPool, poolFor } from './pools';
import { hashString, mulberry32, shuffle } from './rng';

export interface Board {
  /** Puzzle number, 1-based from the epoch. */
  number: number;
  /** 0 for the day's board; 1+ for extra practice boards. */
  variant: number;
  label: string;
  /** One row per level, easiest first. */
  rows: Category[];
  cols: Category[];
}

/** How many valid answers the tightest cell of a row offers. */
export function rowFloor(row: Category, cols: readonly Category[]): number {
  return Math.min(...cols.map((col) => poolFor(row, col).length));
}

/**
 * Rows whose cells all sit inside a level's window. Computed once per level:
 * the windows never change at runtime, and this is the whole of the difficulty
 * model.
 */
const WINDOW_CACHE = new Map<number, Category[]>();

export function rowsForLevel(level: Level): Category[] {
  const cached = WINDOW_CACHE.get(level.depth);
  if (cached) return cached;

  const cols = colsForSports(COLUMN_SPORTS);
  const rows = rowsForSports(COLUMN_SPORTS).filter((row) =>
    cols.every((col) => {
      const size = poolFor(row, col).length;
      return size >= level.minPool && size <= level.maxPool;
    }),
  );
  WINDOW_CACHE.set(level.depth, rows);
  return rows;
}

/**
 * Whether one row's answers sit entirely inside another's. "Born in 1990" and
 * "Born in 1990 or 1991" are two headings asking one question, and a board
 * showing both is giving the second answer away with the first.
 */
function nested(a: Category, b: Category): boolean {
  const left = categoryPool(a);
  const right = categoryPool(b);
  const [small, large] = left.length <= right.length ? [left, right] : [right, left];
  const ids = new Set(large.map((athlete) => athlete.id));
  return small.every((athlete) => ids.has(athlete.id));
}

/**
 * Builds the day's board. Deterministic: the same number always yields the same
 * rows in the same order.
 *
 * Each row is drawn from its own level's window, walking a seeded shuffle of the
 * candidates and taking the first that has not been used and does not break the
 * per-group cap. Picking row by row rather than enumerating whole boards is what
 * keeps this cheap — the product of six windows is far too large to enumerate,
 * and there is nothing to enumerate *for*, since the rows are independent.
 */
export function buildBoard(number: number, variant = 0): Board {
  const cols = [...colsForSports(COLUMN_SPORTS)];
  const rng = mulberry32(hashString(`board:${number}:${variant}`));

  const rows: Category[] = [];
  const usedIds = new Set<string>();
  const perGroup = new Map<CategoryGroup, number>();
  let ceiling = Infinity;

  for (const level of LEVELS) {
    const candidates = shuffle(rowsForLevel(level), rng);

    // Strictly tighter than the row above. This is the promise the difficulty
    // ticks make, and enforcing it here rather than through disjoint windows is
    // what lets the windows overlap and stay well stocked.
    const harder = (row: Category) => rowFloor(row, cols) < ceiling;
    const fresh = (row: Category) => !usedIds.has(row.id);
    const spare = (row: Category) => (perGroup.get(row.group) ?? 0) < MAX_ROWS_PER_GROUP;
    const distinct = (row: Category) => rows.every((chosen) => !nested(row, chosen));

    const pick =
      candidates.find((row) => fresh(row) && distinct(row) && spare(row) && harder(row)) ??
      // The group cap is a preference, not a rule: a board that is short a row
      // is worse than one with a third surname letter. Nesting is not a
      // preference — two rows where one contains the other are one question.
      candidates.find((row) => fresh(row) && distinct(row) && harder(row)) ??
      candidates.find((row) => fresh(row) && distinct(row) && spare(row)) ??
      candidates.find((row) => fresh(row) && distinct(row));

    if (!pick) {
      throw new Error(`No row available for level ${level.depth} with the current roster.`);
    }
    rows.push(pick);
    usedIds.add(pick.id);
    perGroup.set(pick.group, (perGroup.get(pick.group) ?? 0) + 1);
    ceiling = Math.min(ceiling, rowFloor(pick, cols));
  }

  return {
    number,
    variant,
    label:
      variant === 0 ? `No. ${String(number).padStart(3, '0')}` : `Practice ${variant}`,
    rows,
    cols,
  };
}

/** Candidate counts per level, for the probe and the feasibility tests. */
export function windowSizes(): Array<{ depth: number; rows: number }> {
  return LEVELS.map((level) => ({ depth: level.depth, rows: rowsForLevel(level).length }));
}

export { levelAt };
