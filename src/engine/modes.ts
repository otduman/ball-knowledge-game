import type { SportId } from '../data/types';
import type { CategoryGroup } from './categories';

export type ModeId = 'daily' | 'duel';

export interface GridConstraints {
  /** Every intersection must offer at least this many valid answers. */
  minPool: number;
  /** At least this many cells should be comfortable, so a grid is never all deep cuts. */
  minGenerousCells: number;
  /** Pool size at which a cell counts as "generous". */
  generousPool: number;
  /**
   * Cells at or above this many answers are near-free: almost any well-known
   * name in that sport works. They are not banned outright on the daily board,
   * because the friendlier rows (a common surname letter, a big country) are
   * legitimately broad — they are budgeted instead.
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
  /**
   * Per-group overrides. Letters are capped at one because there are 20 of them
   * against 9 regions and 5 decades, so uniform sampling floods the board:
   * before this cap they filled 40% of row slots and 34% of boards had two.
   */
  maxRowsByGroup: Partial<Record<CategoryGroup, number>>;
}

export interface GameMode {
  id: ModeId;
  /** Shown on the mode switch. */
  label: string;
  /** Shown under the masthead, and as the board's own subtitle. */
  blurb: string;
  /** "Grid No. 042" / "Duel No. 042". */
  boardName: string;
  rowCount: number;
  colCount: number;
  /** Sports this mode may use as columns. Empty means every sport. */
  sportIds: readonly SportId[];
  /**
   * A column that should headline most boards, and how often. Null where the
   * columns are fixed and there is nothing to weight.
   */
  primaryColumnId: string | null;
  primaryColumnCycle: number;
  constraints: GridConstraints;
  /** Progressively looser fallbacks, used only if the strict pass finds nothing. */
  relaxations: readonly GridConstraints[];
}

const DAILY_CONSTRAINTS: GridConstraints = {
  minPool: 6,
  minGenerousCells: 3,
  generousPool: 15,
  widePool: 150,
  maxWideCells: 1,
  minGeographicRows: 1,
  maxRowsPerGroup: 2,
  // Reach is capped like letters: two fame rows on one board would make it a
  // quiz about Wikipedia rather than about sport.
  maxRowsByGroup: { letter: 1, reach: 1 },
};

/**
 * The duel is deliberately meaner. Football and the NBA are the two deepest
 * rosters in the game, so a two-column board built on the daily settings is
 * *easier* than the daily board, not harder — the median cell measured 25 valid
 * answers against the daily 16. Difficulty here comes from banning the near-free
 * cell outright and from demanding three different kinds of row, so a board can
 * never be three variations on "where are they from".
 */
const DUEL_CONSTRAINTS: GridConstraints = {
  minPool: 6,
  minGenerousCells: 0,
  generousPool: 15,
  widePool: 70,
  maxWideCells: 0,
  minGeographicRows: 0,
  maxRowsPerGroup: 1,
  maxRowsByGroup: {},
};

function loosen(base: GridConstraints): readonly GridConstraints[] {
  return [
    base,
    { ...base, minPool: 5, minGenerousCells: Math.max(0, base.minGenerousCells - 1), maxWideCells: base.maxWideCells + 1 },
    { ...base, minPool: 4, minGenerousCells: 0, maxWideCells: base.maxWideCells + 2, maxRowsPerGroup: base.maxRowsPerGroup + 1 },
    {
      minPool: 3,
      minGenerousCells: 0,
      generousPool: 1,
      widePool: Infinity,
      maxWideCells: 9,
      minGeographicRows: 0,
      maxRowsPerGroup: 3,
      maxRowsByGroup: {},
    },
  ];
}

export const MODES: Readonly<Record<ModeId, GameMode>> = {
  daily: {
    id: 'daily',
    label: 'Daily 3×3',
    blurb: 'Football · NBA · UFC · F1 · Tennis',
    boardName: 'Grid',
    rowCount: 3,
    colCount: 3,
    sportIds: [],
    /**
     * Football is the sport most players know best and has by far the deepest
     * roster, so it headlines most boards instead of taking its uniform 60%
     * share. One board in `primaryColumnCycle` omits it, to keep the other four
     * sports from becoming garnish.
     */
    primaryColumnId: 'sport:football',
    primaryColumnCycle: 6,
    constraints: DAILY_CONSTRAINTS,
    relaxations: loosen(DAILY_CONSTRAINTS),
  },
  duel: {
    id: 'duel',
    label: 'Duel 2×3',
    blurb: 'Football × NBA — six cells, no easy squares',
    boardName: 'Duel',
    rowCount: 3,
    colCount: 2,
    sportIds: ['football', 'nba'],
    primaryColumnId: null,
    primaryColumnCycle: 0,
    constraints: DUEL_CONSTRAINTS,
    relaxations: loosen(DUEL_CONSTRAINTS),
  },
};

export const MODE_IDS: readonly ModeId[] = ['daily', 'duel'];

export const DEFAULT_MODE: ModeId = 'daily';

export function modeById(id: string): GameMode | undefined {
  return (MODES as Record<string, GameMode>)[id];
}
