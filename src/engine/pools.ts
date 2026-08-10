import { ATHLETES } from '../data/rosters';
import type { Athlete } from '../data/types';
import type { Category } from './categories';
import { ALL_CATEGORIES } from './categories';

export function cellKey(rowId: string, colId: string): string {
  return `${rowId}|${colId}`;
}

/**
 * Athletes matching a single category, most-guessable first. Computed once for
 * every category, then intersected on demand — with two axes of 9 and 4 that is
 * cheaper and far less code than materialising all 36 cell pools eagerly.
 */
const BY_CATEGORY: ReadonlyMap<string, readonly Athlete[]> = (() => {
  const map = new Map<string, Athlete[]>();
  for (const category of ALL_CATEGORIES) map.set(category.id, []);
  for (const athlete of ATHLETES) {
    for (const category of ALL_CATEGORIES) {
      if (category.matches(athlete)) map.get(category.id)?.push(athlete);
    }
  }
  for (const list of map.values()) list.sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name));
  return map;
})();

export function categoryPool(category: Category): readonly Athlete[] {
  return BY_CATEGORY.get(category.id) ?? [];
}

const INTERSECTION_CACHE = new Map<string, readonly Athlete[]>();

/** Athletes satisfying both categories, most-guessable first. */
export function poolFor(row: Category, col: Category): readonly Athlete[] {
  const key = cellKey(row.id, col.id);
  const cached = INTERSECTION_CACHE.get(key);
  if (cached) return cached;

  // Iterate the smaller side so the filter does the least work.
  const rowPool = categoryPool(row);
  const colPool = categoryPool(col);
  const [smaller, other] =
    rowPool.length <= colPool.length ? [rowPool, col] : [colPool, row];

  const pool = smaller.filter((athlete) => other.matches(athlete));
  INTERSECTION_CACHE.set(key, pool);
  return pool;
}

/** Rough "how many names could you reach for" signal, rendered as 1-3 dots. */
export function poolDepth(size: number): 1 | 2 | 3 {
  if (size >= 15) return 3;
  if (size >= 8) return 2;
  return 1;
}
