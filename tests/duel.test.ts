import { describe, expect, it } from 'vitest';
import { ROW_CATEGORIES, rowsForSports } from '../src/engine/categories';
import { applyGuess, createGame, startingGuesses } from '../src/engine/game';
import { buildGrid, cellCount, feasibleGrids, isFeasible } from '../src/engine/grid';
import { MODES } from '../src/engine/modes';
import { poolFor } from '../src/engine/pools';

const DUEL = MODES.duel;

function duelGrids(count: number) {
  return Array.from({ length: count }, (_, i) => buildGrid(i + 1, 0, 'duel'));
}

describe('duel shape', () => {
  it('is two sport columns by three rows', () => {
    for (const grid of duelGrids(120)) {
      expect(grid.cols.map((c) => c.id).sort()).toEqual(['sport:football', 'sport:nba']);
      expect(grid.rows).toHaveLength(3);
      expect(cellCount(grid)).toBe(6);
    }
  });

  it('gives one guess per cell, so six cells means six guesses', () => {
    const grid = buildGrid(1, 0, 'duel');
    expect(startingGuesses(grid)).toBe(6);
    expect(createGame(grid).guessesLeft).toBe(6);
  });

  it('finishes once all six cells are filled', () => {
    const grid = buildGrid(1, 0, 'duel');
    let state = createGame(grid);
    for (const row of grid.rows) {
      for (const col of grid.cols) {
        const used = new Set(Object.values(state.solved));
        const pick = poolFor(row, col).find((a) => !used.has(a.id));
        expect(pick, `${row.label} x ${col.label}`).toBeDefined();
        state = applyGuess(grid, state, row.id, col.id, pick!.id).state;
      }
    }
    expect(state.status).toBe('finished');
    expect(state.guessesLeft).toBe(0);
  });
});

describe('duel difficulty', () => {
  it('has no near-free square at all, unlike the daily board', () => {
    for (const grid of duelGrids(200)) {
      for (const row of grid.rows) {
        for (const col of grid.cols) {
          const size = poolFor(row, col).length;
          expect(size, `${row.label} x ${col.label}`).toBeGreaterThanOrEqual(DUEL.constraints.minPool);
          expect(size, `${row.label} x ${col.label}`).toBeLessThan(DUEL.constraints.widePool);
        }
      }
    }
  });

  it('offers a shallower median cell than the daily board', () => {
    const median = (grids: ReturnType<typeof duelGrids>) => {
      const sizes = grids
        .flatMap((g) => g.rows.flatMap((r) => g.cols.map((c) => poolFor(r, c).length)))
        .sort((a, b) => a - b);
      return sizes[Math.floor(sizes.length / 2)] as number;
    };
    const duel = median(duelGrids(200));
    const daily = median(Array.from({ length: 200 }, (_, i) => buildGrid(i + 1)));

    // Football and the NBA are the two deepest rosters in the game, so a duel
    // built on the daily settings would be the *easier* board. The tighter
    // constraints are what make the mode harder, not the column choice.
    expect(duel).toBeLessThan(daily);
  });

  it('never repeats a row group within a board', () => {
    for (const grid of duelGrids(200)) {
      const groups = grid.rows.map((r) => r.group);
      expect(new Set(groups).size, groups.join('+')).toBe(3);
    }
  });
});

describe('duel rows', () => {
  it('uses rows the three-column rule throws away', () => {
    const daily = new Set(ROW_CATEGORIES.map((r) => r.id));
    const extra = rowsForSports(DUEL.sportIds).filter((r) => !daily.has(r.id));

    // Greece fields six footballers and six NBA players and nothing else: a
    // dead row on a 3x3 and a good one here.
    expect(extra.map((r) => r.label)).toContain('Greece');
    expect(extra.length).toBeGreaterThan(0);
  });

  it('gives every surviving row group airtime', () => {
    const seen = new Set<string>();
    for (const grid of duelGrids(200)) for (const row of grid.rows) seen.add(row.group);
    // Era's big bands and every origin row are excluded by measurement, not by
    // accident: "Born 1990s" alone offers 245 footballers.
    expect([...seen].sort()).toEqual(['country', 'era', 'letter', 'name', 'reach', 'region']);
  });
});

describe('duel selection', () => {
  it('returns an identical board for the same number', () => {
    const a = buildGrid(42, 0, 'duel');
    const b = buildGrid(42, 0, 'duel');
    expect([...a.rows, ...a.cols].map((c) => c.id)).toEqual([...b.rows, ...b.cols].map((c) => c.id));
  });

  it('is a different board from the daily grid of the same number', () => {
    const duel = buildGrid(42, 0, 'duel');
    const daily = buildGrid(42, 0, 'daily');
    expect(duel.label).not.toBe(daily.label);
    expect(duel.cols.length).not.toBe(daily.cols.length);
  });

  it('does not repeat a board over a year of duels', () => {
    // The catalogue holds 2231 boards but selection round-robins across board
    // shapes, so the horizon is set by the thinnest shape rather than by the
    // catalogue. A year is the guarantee worth holding.
    const seen = new Set<string>();
    const days = 365;
    for (let n = 1; n <= days; n++) {
      const grid = buildGrid(n, 0, 'duel');
      seen.add([...grid.rows, ...grid.cols].map((c) => c.id).sort().join('|'));
    }
    expect(seen.size).toBe(days);
  });

  it('keeps every board feasible under its own constraints', () => {
    expect(feasibleGrids(DUEL.constraints, DUEL).length).toBeGreaterThan(1000);
    for (const grid of duelGrids(200)) {
      expect(isFeasible(grid.rows, grid.cols, DUEL.constraints)).toBe(true);
    }
  });
});
