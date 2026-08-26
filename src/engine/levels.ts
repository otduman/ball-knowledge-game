import type { SportId } from '../data/types';

/** Two columns, always. Football and basketball, nothing else. */
export const COLUMN_SPORTS: readonly SportId[] = ['football', 'nba'];

/**
 * A level is a *row* of the board, not a board of its own. The board starts as
 * a single row and grows downward: fill a row and the next one opens under it,
 * each narrower than the last.
 */
export interface Level {
  /** 1-based. Level 1 is the top row and the easiest. */
  depth: number;
  /** Every cell in this row must offer at least this many valid answers. */
  minPool: number;
  /**
   * And no more than this. The ceiling is what makes a row hard: at the top
   * almost any well-known name works, and by the last row every cell is a short
   * list.
   */
  maxPool: number;
}

/**
 * Five rows, not six. The sixth was the row the data could not feed: its 6-17
 * band held 54 candidates against 81 in the middle of the board, and adding
 * players made it *worse* rather than better, because a bigger roster pushes
 * rows up out of a tight band from below. A board whose last row repeats every
 * eighth day is worse than a board with one fewer row.
 *
 * The same difficulty arc now runs in five steps rather than six, so every
 * window widened a little to cover the gap. The bottom row went from 54
 * candidates to 78.
 *
 * The windows overlap deliberately. Disjoint bands looked tidier but starved
 * the top rows — ten candidates each, so the same headings came round every few
 * days. Overlapping them triples the candidates, and the board stays honest
 * because `buildBoard` requires each row to be strictly tighter than the one
 * above it rather than trusting the bands to do it.
 */
export const LEVELS: readonly Level[] = [
  { depth: 1, minPool: 32, maxPool: 300 },
  { depth: 2, minPool: 22, maxPool: 110 },
  { depth: 3, minPool: 14, maxPool: 65 },
  { depth: 4, minPool: 9, maxPool: 32 },
  { depth: 5, minPool: 6, maxPool: 22 },
];

export const MAX_DEPTH = LEVELS.length;

export function levelAt(depth: number): Level {
  const clamped = Math.min(Math.max(1, Math.round(depth)), MAX_DEPTH);
  return LEVELS[clamped - 1] as Level;
}

export const TOTAL_CELLS = MAX_DEPTH * COLUMN_SPORTS.length;

/**
 * One pool of guesses for the whole board, not one per row. Two cells a row
 * makes a per-row budget almost meaningless, and a single pool is what makes a
 * wild guess at the top cost something at the bottom — the only reason to think
 * twice while the answers are still easy.
 *
 * Two spare rather than three. Fifteen guesses for twelve cells left room to
 * flail; twelve for ten means a wrong answer is felt. The board is shorter now,
 * so the budget should not be proportionally more generous than it was.
 */
export const STARTING_GUESSES = TOTAL_CELLS + 2;

/** Rows from one group beyond this are rejected, so a board is not all letters. */
export const MAX_ROWS_PER_GROUP = 2;
