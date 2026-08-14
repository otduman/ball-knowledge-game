import { athleteById } from '../data/rosters';
import type { DiveState } from './dive';
import { diveCellKey } from './dive';
import { buildBoard } from './grid';
import { MAX_DEPTH, guessesAt } from './levels';

// v3 stores a dive rather than a single board. Earlier saves describe a game
// that no longer exists, so the prefix change discards them.
const VERSION = 3;
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
        depth: state.depth,
        guessesLeft: state.guessesLeft,
        solved: state.solved,
        deepestCleared: state.deepestCleared,
        status: state.status,
      }),
    );
  } catch {
    // A full quota should never cost the player their in-memory dive.
  }
}

/**
 * Rehydrates a dive, discarding anything that no longer holds. Roster edits
 * between releases can invalidate a stored answer, and silently keeping a cell
 * the current data would reject makes the board lie about the score.
 */
export function loadDive(day: number, variant: number): DiveState | null {
  const store = storage();
  if (!store) return null;

  const raw = store.getItem(storageKey(day, variant));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const depth = parsed.depth;
    const guessesLeft = parsed.guessesLeft;
    const solvedRaw = parsed.solved;

    if (typeof depth !== 'number' || !Number.isInteger(depth) || depth < 1 || depth > MAX_DEPTH) {
      return null;
    }
    if (typeof guessesLeft !== 'number' || !Number.isInteger(guessesLeft)) return null;
    if (guessesLeft < 0 || guessesLeft > guessesAt(depth)) return null;
    if (typeof solvedRaw !== 'object' || solvedRaw === null) return null;

    // Re-derive every solved cell from the boards themselves, so a stored key
    // that no longer names a real cell simply vanishes.
    const solved: Record<string, string> = {};
    let deepestCleared = 0;

    for (let d = 1; d <= depth; d++) {
      const board = buildBoard(day, d, variant);
      const used = new Set<string>();
      let filled = 0;

      for (const row of board.rows) {
        for (const col of board.cols) {
          const key = diveCellKey(d, row.id, col.id);
          const id = (solvedRaw as Record<string, unknown>)[key];
          if (typeof id !== 'string') continue;

          const athlete = athleteById(id);
          if (!athlete) continue;
          if (used.has(id)) continue;
          if (!row.matches(athlete) || !col.matches(athlete)) continue;

          solved[key] = id;
          used.add(id);
          filled++;
        }
      }
      if (filled === board.rows.length * board.cols.length) deepestCleared = d;
    }

    const status = parsed.status === 'ended' ? 'ended' : 'diving';
    return { day, variant, depth, guessesLeft, solved, deepestCleared, status };
  } catch {
    return null;
  }
}

export function clearDive(day: number, variant: number): void {
  storage()?.removeItem(storageKey(day, variant));
}
