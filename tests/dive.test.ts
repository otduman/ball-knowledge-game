import { describe, expect, it } from 'vitest';
import { rowsForSports } from '../src/engine/categories';
import {
  applyGuess,
  boardFor,
  createDive,
  descend,
  diveCellKey,
  isLevelComplete,
} from '../src/engine/dive';
import { buildBoard, cellCount, feasibleBoards, isFeasible } from '../src/engine/grid';
import { COLUMN_SPORTS, LEVELS, MAX_DEPTH, guessesAt, levelAt } from '../src/engine/levels';
import { poolFor } from '../src/engine/pools';

const DAY = 7;

// Enumerating a depth is the expensive part and several tests want the same
// catalogue, so it is computed once per depth for the whole file.
const CATALOGUES = new Map<number, ReturnType<typeof feasibleBoards>>();
function catalogue(level: (typeof LEVELS)[number]) {
  const cached = CATALOGUES.get(level.depth);
  if (cached) return cached;
  const built = feasibleBoards(level);
  CATALOGUES.set(level.depth, built);
  return built;
}

/** Fills a board by taking the first unused legal answer in every cell. */
function clearBoard(state: ReturnType<typeof createDive>) {
  const board = boardFor(state);
  let next = state;
  for (const row of board.rows) {
    for (const col of board.cols) {
      const used = new Set(Object.values(next.solved));
      const pick = poolFor(row, col).find((a) => !used.has(a.id));
      expect(pick, `${row.label} x ${col.label} at depth ${board.depth}`).toBeDefined();
      const outcome = applyGuess(board, next, row.id, col.id, pick!.id);
      expect(outcome.kind).toBe('hit');
      next = outcome.state;
    }
  }
  return { state: next, board };
}

describe('the dive', () => {
  it('is always two columns, football and basketball', () => {
    for (let depth = 1; depth <= MAX_DEPTH; depth++) {
      for (let day = 1; day <= 30; day++) {
        const board = buildBoard(day, depth);
        expect(board.cols.map((c) => c.id).sort()).toEqual(['sport:football', 'sport:nba']);
      }
    }
  });

  it('gets harder every level, measured by the deepest cell it allows', () => {
    const worst = LEVELS.map((level) => {
      let max = 0;
      for (let day = 1; day <= 60; day++) {
        const board = buildBoard(day, level.depth);
        for (const row of board.rows) {
          for (const col of board.cols) max = Math.max(max, poolFor(row, col).length);
        }
      }
      return max;
    });

    for (let i = 1; i < worst.length; i++) {
      expect(worst[i], `level ${i + 1} against level ${i}`).toBeLessThan(worst[i - 1] as number);
    }
  });

  it('keeps every cell answerable at every depth', () => {
    for (const level of LEVELS) {
      for (let day = 1; day <= 60; day++) {
        const board = buildBoard(day, level.depth);
        expect(isFeasible(board.rows, board.cols, level)).toBe(true);
        for (const row of board.rows) {
          for (const col of board.cols) {
            const size = poolFor(row, col).length;
            expect(size, `${row.label} x ${col.label}`).toBeGreaterThanOrEqual(level.minPool);
            expect(size, `${row.label} x ${col.label}`).toBeLessThanOrEqual(level.maxPool);
          }
        }
      }
    }
  });

  it('has a catalogue deep enough to survive repeat play at every level', () => {
    for (const level of LEVELS) {
      expect(catalogue(level).length, `level ${level.depth}`).toBeGreaterThan(150);
    }
  });

  it('never pins one row to every board at a depth', () => {
    // A row on every board means the window has only one survivor in some
    // group. It reads as a bug to the player long before it reads as difficulty.
    for (const level of LEVELS) {
      const cat = catalogue(level);
      const counts = new Map<string, number>();
      for (const entry of cat) for (const row of entry.rows) counts.set(row.label, (counts.get(row.label) ?? 0) + 1);
      const forced = [...counts.entries()].filter(([, n]) => n === cat.length).map(([label]) => label);
      expect(forced, `level ${level.depth}`).toEqual([]);
    }
  });

  it('does not repeat a board within a year at any depth', () => {
    for (const level of LEVELS) {
      const seen = new Set<string>();
      for (let day = 1; day <= 365; day++) {
        seen.add(buildBoard(day, level.depth).rows.map((r) => r.id).sort().join('|'));
      }
      expect(seen.size, `level ${level.depth}`).toBe(365);
    }
  });

  it('draws rows from more than two kinds of question at every depth', () => {
    // The failure this guards against is the bottom of the dive collapsing onto
    // surname letters and small countries, which is exactly what it did before
    // exact birth years were added as rows.
    for (const level of LEVELS) {
      const groups = new Set<string>();
      for (let day = 1; day <= 100; day++) {
        for (const row of buildBoard(day, level.depth).rows) groups.add(row.group);
      }
      expect(groups.size, `level ${level.depth}`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('descending', () => {
  it('starts at the surface with one guess per cell plus a spare', () => {
    const state = createDive(DAY);
    expect(state.depth).toBe(1);
    expect(state.deepestCleared).toBe(0);
    expect(state.guessesLeft).toBe(guessesAt(1));
    expect(state.guessesLeft).toBe(cellCount(boardFor(state)) + 1);
  });

  it('breaks through to the next level once the board is full', () => {
    const { state, board } = clearBoard(createDive(DAY));
    expect(isLevelComplete(state, board)).toBe(true);
    expect(state.deepestCleared).toBe(1);

    const deeper = descend(state);
    expect(deeper.depth).toBe(2);
    expect(deeper.guessesLeft).toBe(guessesAt(2));
    expect(boardFor(deeper).depth).toBe(2);
  });

  it('can be played all the way to bedrock', () => {
    let state = createDive(DAY);
    for (let depth = 1; depth <= MAX_DEPTH; depth++) {
      const result = clearBoard(state);
      state = result.state;
      expect(state.deepestCleared).toBe(depth);
      if (depth < MAX_DEPTH) state = descend(state);
    }
    expect(state.status).toBe('ended');
    expect(state.deepestCleared).toBe(MAX_DEPTH);
  });

  it('ends the dive when the guesses run out', () => {
    let state = createDive(DAY);
    const board = boardFor(state);
    const row = board.rows[0]!;
    const col = board.cols[0]!;
    // Someone who fits no cell on this board.
    const wrong = poolFor(board.rows[0]!, board.cols[1]!).find(
      (a) => !(row.matches(a) && col.matches(a)),
    )!;

    for (let i = 0; i < guessesAt(1); i++) {
      state = applyGuess(board, state, row.id, col.id, wrong.id).state;
    }
    expect(state.guessesLeft).toBe(0);
    expect(state.status).toBe('ended');
    expect(applyGuess(board, state, row.id, col.id, wrong.id).kind).toBe('rejected');
  });

  it('keeps each level answers separate, so a name can be reused deeper down', () => {
    const { state } = clearBoard(createDive(DAY));
    const deeper = descend(state);
    const board = boardFor(deeper);

    // Reuse is barred within a level, not across the dive: a deep cell can have
    // so few answers that banning a surface pick would make it unsolvable.
    const usedAtSurface = Object.entries(state.solved)
      .filter(([key]) => key.startsWith('1|'))
      .map(([, id]) => id);
    expect(usedAtSurface.length).toBeGreaterThan(0);

    for (const row of board.rows) {
      for (const col of board.cols) {
        const key = diveCellKey(board.depth, row.id, col.id);
        expect(deeper.solved[key]).toBeUndefined();
      }
    }
  });
});

describe('level definitions', () => {
  it('tightens the pool window monotonically', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      const prev = LEVELS[i - 1]!;
      const here = LEVELS[i]!;
      expect(here.maxPool, `level ${here.depth} ceiling`).toBeLessThan(prev.maxPool);
      expect(here.minPool, `level ${here.depth} floor`).toBeLessThanOrEqual(prev.minPool);
    }
  });

  it('only uses rows viable in both columns', () => {
    const viable = new Set(rowsForSports(COLUMN_SPORTS).map((r) => r.id));
    for (const level of LEVELS) {
      for (const entry of catalogue(level).slice(0, 200)) {
        for (const row of entry.rows) expect(viable.has(row.id)).toBe(true);
      }
    }
  });

  it('names every level and clamps depth to the range that exists', () => {
    expect(levelAt(0).depth).toBe(1);
    expect(levelAt(99).depth).toBe(MAX_DEPTH);
    for (const level of LEVELS) expect(level.name.trim().length).toBeGreaterThan(0);
  });
});
