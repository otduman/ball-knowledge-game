import { athleteById } from '../data/rosters';
import type { DiveState } from './dive';
import { cellKey, isRowComplete } from './dive';
import { buildBoard } from './grid';
import { MAX_DEPTH, STARTING_GUESSES } from './levels';

// v4 stores a board that grows row by row. Earlier saves describe games that no
// longer exist, so the prefix change discards them.
const VERSION = 4;
const PREFIX = `bk:v${VERSION}`;

function storageKey(day: number, variant: number): string {
  return `${PREFIX}:${day}:${variant}`;
}

function storage(): Storage | null {
  try {
    // Private-mode Safari and locked-down embeddings throw on access.
    const probe = '__bk_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveDive(state: DiveState): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(
      storageKey(state.day, state.variant),
      JSON.stringify({
        openRows: state.openRows,
        guessesLeft: state.guessesLeft,
        solved: state.solved,
        status: state.status,
      }),
    );
  } catch {
    // A full quota should never cost the player their in-memory board.
  }
}

/**
 * Rehydrates a board, discarding anything that no longer holds. Roster edits
 * between releases can invalidate a stored answer, and silently keeping a cell
 * the current data would reject makes the board lie about the score.
 *
 * `openRows` is re-derived rather than trusted: it is a function of which rows
 * are actually full, so a save that claims row 5 while row 2 has a hole in it
 * corrects itself instead of handing out free depth.
 */
export function loadDive(day: number, variant: number): DiveState | null {
  const store = storage();
  if (!store) return null;

  const raw = store.getItem(storageKey(day, variant));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const guessesLeft = parsed.guessesLeft;
    const solvedRaw = parsed.solved;

    if (typeof guessesLeft !== 'number' || !Number.isInteger(guessesLeft)) return null;
    if (guessesLeft < 0 || guessesLeft > STARTING_GUESSES) return null;
    if (typeof solvedRaw !== 'object' || solvedRaw === null) return null;

    const board = buildBoard(day, variant);
    const solved: Record<string, string> = {};
    const used = new Set<string>();

    for (const row of board.rows) {
      for (const col of board.cols) {
        const key = cellKey(row.id, col.id);
        const id = (solvedRaw as Record<string, unknown>)[key];
        if (typeof id !== 'string') continue;

        const athlete = athleteById(id);
        if (!athlete) continue;
        if (used.has(id)) continue;
        if (!row.matches(athlete) || !col.matches(athlete)) continue;

        solved[key] = id;
        used.add(id);
      }
    }

    const probe: DiveState = { day, variant, openRows: MAX_DEPTH, guessesLeft, solved, status: 'diving' };
    let openRows = 1;
    for (let depth = 1; depth <= MAX_DEPTH; depth++) {
      if (!isRowComplete(probe, board, depth)) break;
      openRows = Math.min(depth + 1, MAX_DEPTH);
    }

    const finished = guessesLeft <= 0 || isRowComplete(probe, board, MAX_DEPTH);
    return { day, variant, openRows, guessesLeft, solved, status: finished ? 'ended' : 'diving' };
  } catch {
    return null;
  }
}

export function clearDive(day: number, variant: number): void {
  storage()?.removeItem(storageKey(day, variant));
}
