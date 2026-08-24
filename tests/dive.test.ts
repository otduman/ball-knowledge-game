import { describe, expect, it } from 'vitest';
import { rowsForSports } from '../src/engine/categories';
import {
  applyGuess,
  boardFor,
  cellKey,
  createDive,
  isRowComplete,
  rowsCleared,
} from '../src/engine/dive';
import { buildBoard, rowFloor, rowsForLevel } from '../src/engine/grid';
import {
  COLUMN_SPORTS,
  LEVELS,
  MAX_DEPTH,
  MAX_ROWS_PER_GROUP,
  STARTING_GUESSES,
  TOTAL_CELLS,
} from '../src/engine/levels';
import { categoryPool, poolFor } from '../src/engine/pools';

const DAY = 7;


/** Fills the currently open row with the first unused legal answers. */
function fillOpenRow(state: ReturnType<typeof createDive>) {
  const board = boardFor(state);
  const row = board.rows[state.openRows - 1]!;
  let next = state;
  for (const col of board.cols) {
    if (next.solved[cellKey(row.id, col.id)]) continue;
    const used = new Set(Object.values(next.solved));
    const pick = poolFor(row, col).find((a) => !used.has(a.id));
    expect(pick, `${row.label} x ${col.label}`).toBeDefined();
    const outcome = applyGuess(board, next, row.id, col.id, pick!.id);
    expect(outcome.kind).toBe('hit');
    next = outcome.state;
  }
  return next;
}

describe('the board', () => {
  it('is two columns and one row per level', () => {
    for (let day = 1; day <= 40; day++) {
      const board = buildBoard(day);
      expect(board.cols.map((c) => c.id).sort()).toEqual(['sport:football', 'sport:nba']);
      expect(board.rows).toHaveLength(MAX_DEPTH);
      expect(new Set(board.rows.map((r) => r.id)).size).toBe(MAX_DEPTH);
    }
  });

  it('gets strictly harder every row down', () => {
    // The difficulty ticks on each row promise this, so it is enforced rather
    // than left to the windows, which overlap.
    for (let day = 1; day <= 120; day++) {
      const board = buildBoard(day);
      const floors = board.rows.map((row) => rowFloor(row, board.cols));
      for (let i = 1; i < floors.length; i++) {
        expect(floors[i], `day ${day} row ${i + 1} against row ${i}`).toBeLessThan(
          floors[i - 1] as number,
        );
      }
    }
  });

  it('keeps every cell answerable, and inside its row window', () => {
    for (let day = 1; day <= 120; day++) {
      const board = buildBoard(day);
      board.rows.forEach((row, i) => {
        const level = LEVELS[i]!;
        for (const col of board.cols) {
          const size = poolFor(row, col).length;
          expect(size, `${row.label} x ${col.label}`).toBeGreaterThanOrEqual(level.minPool);
          expect(size, `${row.label} x ${col.label}`).toBeLessThanOrEqual(level.maxPool);
        }
      });
    }
  });

  it('has enough candidates at every depth to stay fresh', () => {
    for (const level of LEVELS) {
      expect(rowsForLevel(level).length, `level ${level.depth}`).toBeGreaterThanOrEqual(10);
    }
  });

  it('does not fill a board with one kind of question', () => {
    for (let day = 1; day <= 200; day++) {
      const counts = new Map<string, number>();
      for (const row of buildBoard(day).rows) counts.set(row.group, (counts.get(row.group) ?? 0) + 1);
      for (const [group, n] of counts) {
        expect(n, `day ${day} ${group}`).toBeLessThanOrEqual(MAX_ROWS_PER_GROUP + 1);
      }
      expect(counts.size, `day ${day}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('varies row by row across consecutive days', () => {
    for (const level of LEVELS) {
      const seen = new Set<string>();
      for (let day = 1; day <= 60; day++) seen.add(buildBoard(day).rows[level.depth - 1]!.id);
      expect(seen.size, `level ${level.depth}`).toBeGreaterThan(5);
    }
  });

  it('does not repeat a board anywhere near itself', () => {
    // Rows are drawn independently per day rather than from an enumerated
    // catalogue, so two distant days can collide by chance. What matters is
    // that a player never meets the same board twice in a season: collisions
    // are rare over a year and absent within any month.
    const keys: string[] = [];
    for (let day = 1; day <= 365; day++) keys.push(buildBoard(day).rows.map((r) => r.id).join('|'));

    expect(new Set(keys).size).toBeGreaterThanOrEqual(360);
    for (let i = 0; i < keys.length; i++) {
      const window = keys.slice(i, i + 30);
      expect(new Set(window).size, `days ${i + 1}-${i + 30}`).toBe(window.length);
    }
  });

  it('only uses rows viable in both columns', () => {
    const viable = new Set(rowsForSports(COLUMN_SPORTS).map((r) => r.id));
    for (let day = 1; day <= 60; day++) {
      for (const row of buildBoard(day).rows) expect(viable.has(row.id)).toBe(true);
    }
  });

  it('is deterministic', () => {
    expect(buildBoard(42).rows.map((r) => r.id)).toEqual(buildBoard(42).rows.map((r) => r.id));
    expect(buildBoard(42, 1).rows.map((r) => r.id)).not.toEqual(buildBoard(42).rows.map((r) => r.id));
  });

  it('never asks one question twice', () => {
    // A blend is a strict subset of both its parents, so "Africa" sitting above
    // "Africa - 1990s" would hand the second answer over with the first. The
    // same trap exists between a year and the pair that contains it.
    for (let day = 1; day <= 200; day++) {
      const rows = buildBoard(day).rows;
      for (let i = 0; i < rows.length; i++) {
        for (let j = i + 1; j < rows.length; j++) {
          const a = categoryPool(rows[i]!).map((x) => x.id);
          const b = new Set(categoryPool(rows[j]!).map((x) => x.id));
          const [small, large] = a.length <= b.size ? [a, b] : [[...b], new Set(a)];
          const contained = small.every((id) => (large as Set<string>).has(id));
          expect(contained, `day ${day}: ${rows[i]!.label} vs ${rows[j]!.label}`).toBe(false);
        }
      }
    }
  });

  it('actually reaches for the newer row families', () => {
    // Blends and name shapes exist to break up a board that was two-thirds
    // dates and letters. A change that silently strands them should fail here.
    const groups = new Set<string>();
    for (let day = 1; day <= 200; day++) {
      for (const row of buildBoard(day).rows) groups.add(row.group);
    }
    expect(groups).toContain('blend');
    expect(groups).toContain('name');

    const slots = new Map<string, number>();
    let total = 0;
    for (let day = 1; day <= 200; day++) {
      for (const row of buildBoard(day).rows) {
        slots.set(row.group, (slots.get(row.group) ?? 0) + 1);
        total++;
      }
    }
    // Dates and letters together used to be 64% of every row slot.
    const dateAndLetter = (slots.get('era') ?? 0) + (slots.get('letter') ?? 0);
    expect(dateAndLetter / total).toBeLessThan(0.62);
  });
});

describe('opening rows', () => {
  it('starts with one row open and a budget for the whole board', () => {
    const state = createDive(DAY);
    expect(state.openRows).toBe(1);
    expect(state.guessesLeft).toBe(STARTING_GUESSES);
    expect(STARTING_GUESSES).toBeGreaterThan(TOTAL_CELLS);
  });

  it('opens the next row only when the current one is full', () => {
    const board = buildBoard(DAY);
    let state = createDive(DAY);
    const row = board.rows[0]!;

    const first = poolFor(row, board.cols[0]!)[0]!;
    state = applyGuess(board, state, row.id, board.cols[0]!.id, first.id).state;
    expect(state.openRows).toBe(1);

    state = fillOpenRow(state);
    expect(isRowComplete(state, board, 1)).toBe(true);
    expect(state.openRows).toBe(2);
  });

  it('refuses guesses on a row that has not opened yet', () => {
    const board = buildBoard(DAY);
    const state = createDive(DAY);
    const locked = board.rows[2]!;
    const answer = poolFor(locked, board.cols[0]!)[0]!;

    const outcome = applyGuess(board, state, locked.id, board.cols[0]!.id, answer.id);
    expect(outcome.kind).toBe('rejected');
    if (outcome.kind === 'rejected') expect(outcome.reason).toBe('locked');
    expect(outcome.state.guessesLeft).toBe(STARTING_GUESSES);
  });

  it('can be opened all the way down', () => {
    let state = createDive(DAY);
    const board = boardFor(state);
    for (let depth = 1; depth <= MAX_DEPTH; depth++) {
      expect(state.openRows).toBe(depth);
      state = fillOpenRow(state);
    }
    expect(rowsCleared(state, board)).toBe(MAX_DEPTH);
    expect(state.status).toBe('ended');
  });

  it('bars reusing a name anywhere on the board', () => {
    let state = createDive(DAY);
    const board = boardFor(state);
    state = fillOpenRow(state);

    const alreadyUsed = Object.values(state.solved)[0]!;
    const row = board.rows[1]!;
    const outcome = applyGuess(board, state, row.id, board.cols[0]!.id, alreadyUsed);
    expect(outcome.kind).toBe('rejected');
    if (outcome.kind === 'rejected') expect(outcome.reason).toBe('already-used');
  });

  it('ends the board when the shared budget runs out', () => {
    const board = buildBoard(DAY);
    let state = createDive(DAY);
    const row = board.rows[0]!;
    const col = board.cols[0]!;
    const wrong = poolFor(row, board.cols[1]!).find((a) => !(row.matches(a) && col.matches(a)))!;

    for (let i = 0; i < STARTING_GUESSES; i++) {
      state = applyGuess(board, state, row.id, col.id, wrong.id).state;
    }
    expect(state.guessesLeft).toBe(0);
    expect(state.status).toBe('ended');
    expect(rowsCleared(state, board)).toBe(0);
  });
});
