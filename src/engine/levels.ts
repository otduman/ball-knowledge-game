import type { SportId } from '../data/types';
import type { CategoryGroup } from './categories';

/**
 * Two columns, on every board, at every depth. The game used to offer a 3x3
 * across five sports; it is now a single dive through football and basketball,
 * because a 3x3 sports grid is a crowded market and depth is the thing nobody
 * else is doing.
 */
export const COLUMN_SPORTS: readonly SportId[] = ['football', 'nba'];

export interface Level {
  /** 1-based. Level 1 is the surface. */
  depth: number;
  /** Ice-themed, shown on the depth gauge. */
  name: string;
  /** One line telling the player what changed down here. */
  blurb: string;
  rowCount: number;
  /** Every cell must offer at least this many valid answers. */
  minPool: number;
  /**
   * No cell may offer more than this. This is the knob that makes a dive get
   * harder: at the surface almost any well-known name works, and by the bottom
   * every cell is a short list.
   */
  maxPool: number;
  /** Rows from one group beyond this are rejected. */
  maxRowsPerGroup: number;
  /**
   * How many *kinds* of row a board must mix. Deep levels have to relax this:
   * below about 12 answers a cell only three groups still have rows at all, so
   * demanding four distinct kinds forces the sole survivor of a thin group onto
   * every single board. Measured directly — at depth 4 it put "Same initials"
   * on 100% of boards.
   */
  minDistinctGroups: number;
}

/**
 * The dive. Every number here is measured by `scripts/probe-dive.ts`, which
 * reports board count, median cell and forced rows per depth. A level that
 * cannot field a few hundred boards, or that pins one row to every board, is a
 * bug rather than a difficulty setting.
 */
export const LEVELS: readonly Level[] = [
  {
    depth: 1,
    name: 'Surface',
    blurb: 'Household names. Almost anyone you can think of works.',
    rowCount: 3,
    minPool: 18,
    maxPool: 300,
    maxRowsPerGroup: 1,
    minDistinctGroups: 3,
  },
  {
    depth: 2,
    name: 'First crack',
    blurb: 'Three rows, and the obvious answers start running out.',
    rowCount: 3,
    minPool: 14,
    maxPool: 95,
    maxRowsPerGroup: 1,
    minDistinctGroups: 3,
  },
  {
    depth: 3,
    name: 'Cold water',
    blurb: 'Nothing on this board has more than a few dozen answers.',
    rowCount: 3,
    minPool: 11,
    maxPool: 48,
    maxRowsPerGroup: 2,
    minDistinctGroups: 2,
  },
  {
    depth: 4,
    name: 'The trench',
    blurb: 'Squad players and one-cap wonders.',
    rowCount: 4,
    minPool: 8,
    maxPool: 30,
    maxRowsPerGroup: 2,
    minDistinctGroups: 2,
  },
  {
    depth: 5,
    name: 'Bedrock',
    blurb: 'Every cell is a short list. Name one and you have earned it.',
    rowCount: 4,
    minPool: 6,
    maxPool: 20,
    maxRowsPerGroup: 2,
    minDistinctGroups: 2,
  },
];

export const MAX_DEPTH = LEVELS.length;

export function levelAt(depth: number): Level {
  const clamped = Math.min(Math.max(1, Math.round(depth)), MAX_DEPTH);
  return LEVELS[clamped - 1] as Level;
}

export function cellsAt(depth: number): number {
  return levelAt(depth).rowCount * COLUMN_SPORTS.length;
}

/**
 * One spare guess per level. Zero slack made a single misremembered name end
 * the run outright, which punishes the exact instinct the game wants to reward:
 * reaching for a name you are not quite sure about.
 */
export const SPARE_GUESSES = 1;

export function guessesAt(depth: number): number {
  return cellsAt(depth) + SPARE_GUESSES;
}

/** Total cells in a complete dive, for the share text and the results panel. */
export const TOTAL_DIVE_CELLS = LEVELS.reduce((sum, l) => sum + l.rowCount * COLUMN_SPORTS.length, 0);

export type { CategoryGroup };
