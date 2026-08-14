import { describe, expect, it } from 'vitest';
import { ATHLETES } from '../src/data/rosters';
import {
  applyGuess,
  createGame,
  missedCells,
  solvedCount,
  startingGuesses,
  totalScore,
} from '../src/engine/game';
import { buildGrid, cellCount } from '../src/engine/grid';
import { poolFor } from '../src/engine/pools';
import { rarityScore } from '../src/engine/scoring';
import { buildShareText } from '../src/engine/share';

const grid = buildGrid(7);
const GUESSES = startingGuesses(grid);
const firstRow = grid.rows[0]!;
const firstCol = grid.cols[0]!;
const correctAthlete = poolFor(firstRow, firstCol)[0]!;

function wrongAthleteFor(rowId: string, colId: string) {
  const row = grid.rows.find((r) => r.id === rowId)!;
  const col = grid.cols.find((c) => c.id === colId)!;
  const wrong = ATHLETES.find((a) => !(row.matches(a) && col.matches(a)));
  if (!wrong) throw new Error('roster has no athlete outside this cell');
  return wrong;
}

describe('applyGuess', () => {
  it('fills the cell and awards rarity points on a hit', () => {
    const outcome = applyGuess(grid, createGame(grid), firstRow.id, firstCol.id, correctAthlete.id);
    expect(outcome.kind).toBe('hit');
    if (outcome.kind !== 'hit') return;

    expect(outcome.points).toBe(rarityScore(correctAthlete));
    expect(solvedCount(outcome.state)).toBe(1);
    expect(totalScore(outcome.state)).toBe(rarityScore(correctAthlete));
    expect(outcome.state.guessesLeft).toBe(GUESSES - 1);
  });

  it('costs a guess on a miss without filling the cell', () => {
    const wrong = wrongAthleteFor(firstRow.id, firstCol.id);
    const outcome = applyGuess(grid, createGame(grid), firstRow.id, firstCol.id, wrong.id);

    expect(outcome.kind).toBe('miss');
    expect(outcome.state.guessesLeft).toBe(GUESSES - 1);
    expect(solvedCount(outcome.state)).toBe(0);
  });

  it('refuses to reuse an athlete already on the board', () => {
    const first = applyGuess(grid, createGame(grid), firstRow.id, firstCol.id, correctAthlete.id);
    const secondCol = grid.cols[1]!;
    const again = applyGuess(grid, first.state, firstRow.id, secondCol.id, correctAthlete.id);

    expect(again.kind).toBe('rejected');
    if (again.kind === 'rejected') expect(again.reason).toBe('already-used');
    expect(again.state.guessesLeft).toBe(first.state.guessesLeft);
  });

  it('refuses a second answer for a solved cell', () => {
    const first = applyGuess(grid, createGame(grid), firstRow.id, firstCol.id, correctAthlete.id);
    const other = poolFor(firstRow, firstCol)[1]!;
    const again = applyGuess(grid, first.state, firstRow.id, firstCol.id, other.id);

    expect(again.kind).toBe('rejected');
    if (again.kind === 'rejected') expect(again.reason).toBe('cell-solved');
  });

  it('rejects unknown athlete ids without spending a guess', () => {
    const outcome = applyGuess(grid, createGame(grid), firstRow.id, firstCol.id, 'football:nobody');
    expect(outcome.kind).toBe('rejected');
    expect(outcome.state.guessesLeft).toBe(GUESSES);
  });
});

describe('finishing', () => {
  it('ends the game once guesses run out', () => {
    let state = createGame(grid);
    for (let i = 0; i < GUESSES; i++) {
      const wrong = wrongAthleteFor(firstRow.id, firstCol.id);
      // Each miss needs a distinct athlete only for hits, so reuse is fine here.
      state = applyGuess(grid, state, firstRow.id, firstCol.id, wrong.id).state;
    }
    expect(state.guessesLeft).toBe(0);
    expect(state.status).toBe('finished');

    const after = applyGuess(grid, state, firstRow.id, firstCol.id, correctAthlete.id);
    expect(after.kind).toBe('rejected');
  });

  it('ends the game when every cell is filled', () => {
    let state = createGame(grid);
    for (const row of grid.rows) {
      for (const col of grid.cols) {
        const used = new Set(Object.values(state.solved));
        const pick = poolFor(row, col).find((a) => !used.has(a.id))!;
        state = applyGuess(grid, state, row.id, col.id, pick.id).state;
      }
    }
    expect(solvedCount(state)).toBe(cellCount(grid));
    expect(state.status).toBe('finished');
    expect(state.guessesLeft).toBe(0);
  });
});

describe('reveal and share', () => {
  it('suggests only athletes that actually fit each missed cell', () => {
    const state = { ...createGame(grid), status: 'finished' as const, guessesLeft: 0 };
    for (const cell of missedCells(grid, state)) {
      const row = grid.rows.find((r) => r.id === cell.rowId)!;
      const col = grid.cols.find((c) => c.id === cell.colId)!;
      expect(cell.suggestions.length).toBeGreaterThan(0);
      for (const athlete of cell.suggestions) {
        expect(row.matches(athlete) && col.matches(athlete)).toBe(true);
      }
    }
  });

  it('renders a three-line emoji board without naming anyone', () => {
    const hit = applyGuess(grid, createGame(grid), firstRow.id, firstCol.id, correctAthlete.id);
    const text = buildShareText(grid, hit.state);
    const lines = text.split('\n');

    expect(lines[0]).toContain(grid.label);
    expect(lines.slice(1, 4).every((l) => [...l].length === 3)).toBe(true);
    expect(text).not.toContain(correctAthlete.name);
  });
});
