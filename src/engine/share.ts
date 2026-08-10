import type { GameState } from './game';
import { solvedCount, totalScore } from './game';
import type { Grid } from './grid';
import { cellKey } from './pools';

const HIT = '\u{1F7E9}';
const MISS = '⬛';

/**
 * Result text for sharing. Deliberately shows the shape of the board but not
 * the names, so posting it cannot spoil the day's grid.
 */
export function buildShareText(grid: Grid, state: GameState): string {
  const solved = solvedCount(state);
  const score = totalScore(state);

  const lines = [`Ball Knowledge ${grid.label} — ${solved}/9 · ${score} pts`];
  for (const row of grid.rows) {
    lines.push(grid.cols.map((col) => (state.solved[cellKey(row.id, col.id)] ? HIT : MISS)).join(''));
  }

  if (solved > 0) {
    lines.push(`Avg rarity ${Math.round(score / solved)}/99`);
  }
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
