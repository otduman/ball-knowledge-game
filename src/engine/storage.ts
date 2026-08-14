import { athleteById } from '../data/rosters';
import type { GameState } from './game';
import { startingGuesses } from './game';
import type { Grid } from './grid';
import { cellCount } from './grid';
import type { ModeId } from './modes';
import { cellKey } from './pools';

// v2 keys the save on the mode as well. Under v1 a daily board and a duel with
// the same number would have shared a slot, and a v1 save carries no mode or
// cell count to validate against.
const VERSION = 2;
const PREFIX = `bk:v${VERSION}`;

function storageKey(mode: ModeId, gridNumber: number, variant: number): string {
  return `${PREFIX}:${mode}:${gridNumber}:${variant}`;
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
      storageKey(state.mode, state.gridNumber, state.variant),
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

  const raw = store.getItem(storageKey(grid.mode, grid.number, grid.variant));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { solved?: unknown; guessesLeft?: unknown };
    const solvedRaw = parsed.solved;
    const guessesLeft = parsed.guessesLeft;

    if (typeof guessesLeft !== 'number' || !Number.isInteger(guessesLeft)) return null;
    if (guessesLeft < 0 || guessesLeft > startingGuesses(grid)) return null;
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
    const totalCells = cellCount(grid);
    return {
      gridNumber: grid.number,
      variant: grid.variant,
      mode: grid.mode,
      totalCells,
      solved,
      guessesLeft,
      status: guessesLeft <= 0 || count >= totalCells ? 'finished' : 'playing',
    };
  } catch {
    return null;
  }
}

export function clearGame(mode: ModeId, gridNumber: number, variant: number): void {
  storage()?.removeItem(storageKey(mode, gridNumber, variant));
}
