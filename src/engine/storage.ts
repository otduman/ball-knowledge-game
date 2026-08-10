import { athleteById } from '../data/rosters';
import type { GameState } from './game';
import { STARTING_GUESSES, TOTAL_CELLS } from './game';
import type { Grid } from './grid';
import { cellKey } from './pools';

const VERSION = 1;
const PREFIX = `bk:v${VERSION}`;

function storageKey(gridNumber: number, variant: number): string {
  return `${PREFIX}:${gridNumber}:${variant}`;
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

export function saveGame(state: GameState): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(
      storageKey(state.gridNumber, state.variant),
      JSON.stringify({ solved: state.solved, guessesLeft: state.guessesLeft }),
    );
  } catch {
    // A full quota should never cost the player their in-memory game.
  }
}

/**
 * Rehydrates saved progress, discarding anything that no longer holds. Roster
 * edits between releases can invalidate a stored answer, and silently keeping a
 * cell that the current data would reject makes the board lie about the score.
 */
export function loadGame(grid: Grid): GameState | null {
  const store = storage();
  if (!store) return null;

  const raw = store.getItem(storageKey(grid.number, grid.variant));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { solved?: unknown; guessesLeft?: unknown };
    const solvedRaw = parsed.solved;
    const guessesLeft = parsed.guessesLeft;

    if (typeof guessesLeft !== 'number' || !Number.isInteger(guessesLeft)) return null;
    if (guessesLeft < 0 || guessesLeft > STARTING_GUESSES) return null;
    if (typeof solvedRaw !== 'object' || solvedRaw === null) return null;

    const solved: Record<string, string> = {};
    const used = new Set<string>();

    for (const row of grid.rows) {
      for (const col of grid.cols) {
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

    const count = Object.keys(solved).length;
    return {
      gridNumber: grid.number,
      variant: grid.variant,
      solved,
      guessesLeft,
      status: guessesLeft <= 0 || count === TOTAL_CELLS ? 'finished' : 'playing',
    };
  } catch {
    return null;
  }
}

export function clearGame(gridNumber: number, variant: number): void {
  storage()?.removeItem(storageKey(gridNumber, variant));
}
