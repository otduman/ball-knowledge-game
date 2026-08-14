import type { DiveState } from './dive';
import { cellKey, rowsCleared, totalScore, totalSolved } from './dive';
import type { Board } from './grid';
import { MAX_DEPTH } from './levels';

const HIT = '\u{1F7E6}';
const MISS = '⬜';

/**
 * Result text for sharing. Shows how far down the board opened and which cells
 * fell, but never a name, so posting it cannot spoil the day.
 */
export function buildShareText(board: Board, state: DiveState): string {
  const solved = totalSolved(state);
  const score = totalScore(state);
  const cleared = rowsCleared(state, board);

  const lines = [`Ball Knowledge ${board.label} — ${cleared}/${MAX_DEPTH} rows · ${score} pts`];

  for (let depth = 1; depth <= state.openRows; depth++) {
    const row = board.rows[depth - 1];
    if (!row) continue;
    lines.push(board.cols.map((col) => (state.solved[cellKey(row.id, col.id)] ? HIT : MISS)).join(''));
  }

  if (solved > 0) lines.push(`Avg rarity ${Math.round(score / solved)}/99`);
  return lines.join('\n');
}

/** Copies text, falling back to a hidden textarea where the clipboard API is unavailable. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path below.
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
