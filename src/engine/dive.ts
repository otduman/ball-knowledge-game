import { athleteById } from '../data/rosters';
import type { Athlete } from '../data/types';
import type { Board } from './grid';
import { buildBoard } from './grid';
import { MAX_DEPTH, STARTING_GUESSES } from './levels';
import { poolFor } from './pools';
import { rarityScore } from './scoring';

export type DiveStatus = 'diving' | 'ended';

export interface DiveState {
  day: number;
  variant: number;
  /** How many rows are open. Starts at 1; the board grows downward. */
  openRows: number;
  guessesLeft: number;
  /** `rowId|colId` -> athlete id. */
  solved: Record<string, string>;
  status: DiveStatus;
}

export type GuessOutcome =
  | { kind: 'hit'; athlete: Athlete; points: number; opened: boolean; state: DiveState }
  | { kind: 'miss'; athlete: Athlete; state: DiveState }
  | { kind: 'rejected'; reason: RejectionReason; state: DiveState };

export type RejectionReason = 'over' | 'cell-solved' | 'already-used' | 'unknown-athlete' | 'locked';

export function cellKey(rowId: string, colId: string): string {
  return `${rowId}|${colId}`;
}

export function createDive(day: number, variant = 0): DiveState {
  return {
    day,
    variant,
    openRows: 1,
    guessesLeft: STARTING_GUESSES,
    solved: {},
    status: 'diving',
  };
}

export function boardFor(state: DiveState): Board {
  return buildBoard(state.day, state.variant);
}

/** Every athlete already on the board. One name, one cell, for the whole run. */
export function usedAthleteIds(state: DiveState): Set<string> {
  return new Set(Object.values(state.solved));
}

export function isRowComplete(state: DiveState, board: Board, depth: number): boolean {
  const row = board.rows[depth - 1];
  if (!row) return false;
  return board.cols.every((col) => Boolean(state.solved[cellKey(row.id, col.id)]));
}

/** The deepest row fully filled, which is what the run is scored on. */
export function rowsCleared(state: DiveState, board: Board): number {
  let cleared = 0;
  for (let depth = 1; depth <= MAX_DEPTH; depth++) {
    if (!isRowComplete(state, board, depth)) break;
    cleared = depth;
  }
  return cleared;
}

export function totalSolved(state: DiveState): number {
  return Object.keys(state.solved).length;
}

export function totalScore(state: DiveState): number {
  let score = 0;
  for (const id of Object.values(state.solved)) {
    const athlete = athleteById(id);
    if (athlete) score += rarityScore(athlete);
  }
  return score;
}

/**
 * Applies a guess. A wrong name costs a guess just like a right one, and the
 * budget covers the whole board, so a loose guess on the top row is paid for at
 * the bottom.
 */
export function applyGuess(
  board: Board,
  state: DiveState,
  rowId: string,
  colId: string,
  athleteId: string,
): GuessOutcome {
  if (state.status === 'ended') {
    return { kind: 'rejected', reason: 'over', state };
  }

  const depth = board.rows.findIndex((r) => r.id === rowId) + 1;
  if (depth === 0) return { kind: 'rejected', reason: 'unknown-athlete', state };
  if (depth > state.openRows) return { kind: 'rejected', reason: 'locked', state };

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

  const row = board.rows[depth - 1];
  const col = board.cols.find((c) => c.id === colId);
  if (!row || !col) {
    return { kind: 'rejected', reason: 'unknown-athlete', state };
  }

  const correct = row.matches(athlete) && col.matches(athlete);
  const next: DiveState = {
    ...state,
    guessesLeft: state.guessesLeft - 1,
    solved: correct ? { ...state.solved, [key]: athlete.id } : state.solved,
  };

  if (!correct) {
    return {
      kind: 'miss',
      athlete,
      state: next.guessesLeft <= 0 ? { ...next, status: 'ended' } : next,
    };
  }

  // Filling the deepest open row opens the next one, and filling the last row
  // finishes the board.
  const opened = isRowComplete(next, board, state.openRows) && state.openRows < MAX_DEPTH;
  let settled = next;
  if (opened) {
    settled = { ...next, openRows: state.openRows + 1 };
  } else if (isRowComplete(next, board, MAX_DEPTH) && state.openRows === MAX_DEPTH) {
    settled = { ...next, status: 'ended' };
  }
  if (settled.guessesLeft <= 0) settled = { ...settled, status: 'ended' };

  return { kind: 'hit', athlete, points: rarityScore(athlete), opened, state: settled };
}

export interface MissedCell {
  rowLabel: string;
  colLabel: string;
  depth: number;
  /** How many names would have worked — the row's difficulty, made concrete. */
  poolSize: number;
  suggestions: Athlete[];
}

/** Unsolved cells of every row the player actually reached. */
export function missedCells(board: Board, state: DiveState, perCell = 3): MissedCell[] {
  const out: MissedCell[] = [];
  for (let depth = 1; depth <= state.openRows; depth++) {
    const row = board.rows[depth - 1];
    if (!row) continue;
    for (const col of board.cols) {
      if (state.solved[cellKey(row.id, col.id)]) continue;

      // Skip the very top of the pool so the reveal teaches something.
      const pool = poolFor(row, col);
      const offset = Math.min(Math.floor(pool.length / 4), Math.max(0, pool.length - perCell));
      out.push({
        rowLabel: row.label,
        colLabel: col.label,
        depth,
        poolSize: pool.length,
        suggestions: pool.slice(offset, offset + perCell),
      });
    }
  }
  return out;
}
