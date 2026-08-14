import { athleteById } from '../data/rosters';
import type { Athlete } from '../data/types';
import type { Board } from './grid';
import { buildBoard, cellCount } from './grid';
import { MAX_DEPTH, guessesAt, levelAt } from './levels';
import { poolFor } from './pools';
import { rarityScore } from './scoring';

export type DiveStatus = 'diving' | 'ended';

export interface DiveState {
  /** Puzzle number: which day's dive. */
  day: number;
  variant: number;
  /** The level currently being played, 1-based. */
  depth: number;
  /** Guesses remaining at this level. They reset on every descent. */
  guessesLeft: number;
  /** `depth|rowId|colId` -> athlete id, kept for the whole dive. */
  solved: Record<string, string>;
  /** Deepest level completely filled. 0 before the first one falls. */
  deepestCleared: number;
  status: DiveStatus;
}

export type GuessOutcome =
  | { kind: 'hit'; athlete: Athlete; points: number; cleared: boolean; state: DiveState }
  | { kind: 'miss'; athlete: Athlete; state: DiveState }
  | { kind: 'rejected'; reason: RejectionReason; state: DiveState };

export type RejectionReason = 'dive-over' | 'cell-solved' | 'already-used' | 'unknown-athlete';

export function diveCellKey(depth: number, rowId: string, colId: string): string {
  return `${depth}|${rowId}|${colId}`;
}

export function createDive(day: number, variant = 0): DiveState {
  return {
    day,
    variant,
    depth: 1,
    guessesLeft: guessesAt(1),
    solved: {},
    deepestCleared: 0,
    status: 'diving',
  };
}

export function boardFor(state: DiveState): Board {
  return buildBoard(state.day, state.depth, state.variant);
}

/** Athletes already used at this level. Reuse is barred per board, not per dive. */
export function usedAthleteIds(state: DiveState, depth = state.depth): Set<string> {
  const prefix = `${depth}|`;
  const used = new Set<string>();
  for (const [key, id] of Object.entries(state.solved)) {
    if (key.startsWith(prefix)) used.add(id);
  }
  return used;
}

export function solvedOn(state: DiveState, board: Board): number {
  let count = 0;
  for (const row of board.rows) {
    for (const col of board.cols) {
      if (state.solved[diveCellKey(board.depth, row.id, col.id)]) count++;
    }
  }
  return count;
}

export function isLevelComplete(state: DiveState, board: Board): boolean {
  return solvedOn(state, board) >= cellCount(board);
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
 * Applies a guess to the level currently being played. A wrong name costs a
 * guess just like a right one, which is what makes naming a player you are only
 * half sure about a real decision.
 */
export function applyGuess(
  board: Board,
  state: DiveState,
  rowId: string,
  colId: string,
  athleteId: string,
): GuessOutcome {
  if (state.status === 'ended') {
    return { kind: 'rejected', reason: 'dive-over', state };
  }

  const key = diveCellKey(board.depth, rowId, colId);
  if (state.solved[key]) {
    return { kind: 'rejected', reason: 'cell-solved', state };
  }

  const athlete = athleteById(athleteId);
  if (!athlete) {
    return { kind: 'rejected', reason: 'unknown-athlete', state };
  }
  if (usedAthleteIds(state, board.depth).has(athleteId)) {
    return { kind: 'rejected', reason: 'already-used', state };
  }

  const row = board.rows.find((c) => c.id === rowId);
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
    // Running out of guesses ends the dive where it stands. There is no partial
    // credit for a level: the ice either takes your weight or it does not.
    const settled: DiveState = next.guessesLeft <= 0 ? { ...next, status: 'ended' } : next;
    return { kind: 'miss', athlete, state: settled };
  }

  const cleared = isLevelComplete(next, board);
  let settled = next;
  if (cleared) {
    settled = { ...next, deepestCleared: Math.max(next.deepestCleared, board.depth) };
    // Clearing the deepest level is the win condition, not a failure to descend.
    if (board.depth >= MAX_DEPTH) settled = { ...settled, status: 'ended' };
  } else if (next.guessesLeft <= 0) {
    settled = { ...next, status: 'ended' };
  }

  return { kind: 'hit', athlete, points: rarityScore(athlete), cleared, state: settled };
}

/** Breaks through to the next level. Only valid once the current one is full. */
export function descend(state: DiveState): DiveState {
  if (state.status === 'ended' || state.depth >= MAX_DEPTH) return state;
  const next = state.depth + 1;
  return { ...state, depth: next, guessesLeft: guessesAt(next) };
}

export interface MissedCell {
  rowId: string;
  colId: string;
  rowLabel: string;
  colLabel: string;
  /** A few names that would have worked, skewed away from the most obvious. */
  suggestions: Athlete[];
}

export function missedCells(board: Board, state: DiveState, perCell = 3): MissedCell[] {
  const out: MissedCell[] = [];
  for (const row of board.rows) {
    for (const col of board.cols) {
      if (state.solved[diveCellKey(board.depth, row.id, col.id)]) continue;

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

/** "Bedrock" or "Cold water" — how the run is described once it is over. */
export function reachedName(state: DiveState): string {
  return levelAt(Math.max(1, state.deepestCleared || state.depth)).name;
}
