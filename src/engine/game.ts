import { athleteById } from '../data/rosters';
import type { Athlete } from '../data/types';
import type { Grid } from './grid';
import { cellCount } from './grid';
import type { ModeId } from './modes';
import { cellKey, poolFor } from './pools';
import { rarityScore } from './scoring';

/**
 * One guess per cell, in every mode. The daily 3x3 gives nine and the duel
 * gives six, so neither offers slack: naming someone you are only half sure
 * about always costs you a square you could have filled.
 */
export function startingGuesses(grid: Grid): number {
  return cellCount(grid);
}

export type GameStatus = 'playing' | 'finished';

export interface GameState {
  gridNumber: number;
  variant: number;
  mode: ModeId;
  /** How many cells this board has, so a saved game knows when it is complete. */
  totalCells: number;
  /** cellKey -> athlete id. */
  solved: Record<string, string>;
  guessesLeft: number;
  status: GameStatus;
}

export type GuessOutcome =
  | { kind: 'hit'; athlete: Athlete; points: number; state: GameState }
  | { kind: 'miss'; athlete: Athlete; state: GameState }
  | { kind: 'rejected'; reason: RejectionReason; state: GameState };

export type RejectionReason =
  | 'game-over'
  | 'cell-solved'
  | 'already-used'
  | 'unknown-athlete';

export function createGame(grid: Grid): GameState {
  return {
    gridNumber: grid.number,
    variant: grid.variant,
    mode: grid.mode,
    totalCells: cellCount(grid),
    solved: {},
    guessesLeft: startingGuesses(grid),
    status: 'playing',
  };
}

export function solvedCount(state: GameState): number {
  return Object.keys(state.solved).length;
}

export function usedAthleteIds(state: GameState): Set<string> {
  return new Set(Object.values(state.solved));
}

export function totalScore(state: GameState): number {
  let score = 0;
  for (const id of Object.values(state.solved)) {
    const athlete = athleteById(id);
    if (athlete) score += rarityScore(athlete);
  }
  return score;
}

function settle(state: GameState): GameState {
  const done = state.guessesLeft <= 0 || solvedCount(state) >= state.totalCells;
  return done ? { ...state, status: 'finished' } : state;
}

/**
 * Applies a guess. A wrong name costs a guess just like a right one, which is
 * what makes naming a player you are only half sure about a real decision.
 */
export function applyGuess(
  grid: Grid,
  state: GameState,
  rowId: string,
  colId: string,
  athleteId: string,
): GuessOutcome {
  if (state.status === 'finished') {
    return { kind: 'rejected', reason: 'game-over', state };
  }

  const key = cellKey(rowId, colId);
  if (state.solved[key]) {
    return { kind: 'rejected', reason: 'cell-solved', state };
  }

  const athlete = athleteById(athleteId);
  if (!athlete) {
    return { kind: 'rejected', reason: 'unknown-athlete', state };
  }

  if (usedAthleteIds(state).has(athleteId)) {
    return { kind: 'rejected', reason: 'already-used', state };
  }

  const row = grid.rows.find((c) => c.id === rowId);
  const col = grid.cols.find((c) => c.id === colId);
  if (!row || !col) {
    return { kind: 'rejected', reason: 'unknown-athlete', state };
  }

  const correct = row.matches(athlete) && col.matches(athlete);
  const next: GameState = {
    ...state,
    guessesLeft: state.guessesLeft - 1,
    solved: correct ? { ...state.solved, [key]: athlete.id } : state.solved,
  };

  return correct
    ? { kind: 'hit', athlete, points: rarityScore(athlete), state: settle(next) }
    : { kind: 'miss', athlete, state: settle(next) };
}

export interface MissedCell {
  rowId: string;
  colId: string;
  rowLabel: string;
  colLabel: string;
  /** A few names that would have worked, skewed away from the most obvious. */
  suggestions: Athlete[];
}

export function missedCells(grid: Grid, state: GameState, perCell = 3): MissedCell[] {
  const out: MissedCell[] = [];
  for (const row of grid.rows) {
    for (const col of grid.cols) {
      const key = cellKey(row.id, col.id);
      if (state.solved[key]) continue;

      // Skip the very top of the pool so the reveal teaches something.
      const pool = poolFor(row, col);
      const offset = Math.min(Math.floor(pool.length / 4), Math.max(0, pool.length - perCell));
      out.push({
        rowId: row.id,
        colId: col.id,
        rowLabel: row.label,
        colLabel: col.label,
        suggestions: pool.slice(offset, offset + perCell),
      });
    }
  }
  return out;
}
