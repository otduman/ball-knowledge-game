import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONSTRAINTS,
  buildGrid,
  feasibleGrids,
  isFeasible,
} from '../src/engine/grid';
import { poolFor } from '../src/engine/pools';
import { EPOCH_UTC, puzzleNumberFor } from '../src/engine/rng';

describe('grid feasibility', () => {
  it('finds a healthy catalogue of valid grids', () => {
    expect(feasibleGrids(DEFAULT_CONSTRAINTS).length).toBeGreaterThan(10);
  });

  it('builds grids whose every cell is answerable', () => {
    for (let n = 1; n <= 200; n++) {
      const grid = buildGrid(n);
      expect(isFeasible(grid.rows, grid.cols, DEFAULT_CONSTRAINTS)).toBe(true);

      for (const row of grid.rows) {
        for (const col of grid.cols) {
          expect(poolFor(row, col).length).toBeGreaterThanOrEqual(DEFAULT_CONSTRAINTS.minPool);
        }
      }
    }
  });

  it('always produces three distinct rows and columns', () => {
    for (let n = 1; n <= 100; n++) {
      const grid = buildGrid(n);
      expect(new Set(grid.rows.map((r) => r.id)).size).toBe(3);
      expect(new Set(grid.cols.map((c) => c.id)).size).toBe(3);
    }
  });
});

describe('determinism', () => {
  it('returns an identical grid for the same puzzle number', () => {
    const a = buildGrid(42);
    const b = buildGrid(42);
    expect(a.rows.map((r) => r.id)).toEqual(b.rows.map((r) => r.id));
    expect(a.cols.map((c) => c.id)).toEqual(b.cols.map((c) => c.id));
  });

  it('varies the board across consecutive days', () => {
    const signatures = new Set<string>();
    for (let n = 1; n <= 30; n++) {
      const grid = buildGrid(n);
      signatures.add([...grid.rows, ...grid.cols].map((c) => c.id).sort().join('|'));
    }
    // Consecutive days should not collapse onto a handful of repeated boards.
    expect(signatures.size).toBeGreaterThan(20);
  });

  it('does not repeat a board until the catalogue is exhausted', () => {
    const catalogueSize = feasibleGrids(DEFAULT_CONSTRAINTS).length;
    const seen = new Set<string>();
    // Variants advance the ordinal by 1 each, so walk variants of one day.
    for (let v = 0; v < catalogueSize; v++) {
      const grid = buildGrid(1, v);
      seen.add([...grid.rows, ...grid.cols].map((c) => c.id).sort().join('|'));
    }
    expect(seen.size).toBe(catalogueSize);
  });
});

describe('puzzle numbering', () => {
  it('starts at 1 on the epoch date', () => {
    expect(puzzleNumberFor(new Date(EPOCH_UTC))).toBe(1);
  });

  it('advances by one per UTC day', () => {
    const day = 86400000;
    expect(puzzleNumberFor(new Date(EPOCH_UTC + day))).toBe(2);
    expect(puzzleNumberFor(new Date(EPOCH_UTC + 30 * day))).toBe(31);
  });

  it('ignores the time of day', () => {
    const morning = new Date(Date.UTC(2026, 5, 1, 0, 5));
    const night = new Date(Date.UTC(2026, 5, 1, 23, 55));
    expect(puzzleNumberFor(morning)).toBe(puzzleNumberFor(night));
  });
});
