import type { DiveState } from './dive';
import { diveCellKey, totalScore, totalSolved } from './dive';
import { buildBoard } from './grid';
import { LEVELS, MAX_DEPTH } from './levels';

const HIT = '\u{1F7E6}';
const MISS = '⬜';
const ICE = '\u{1F9CA}';

/**
 * Result text for sharing. Shows how deep the dive went and the shape of each
 * level, but never a name, so posting it cannot spoil the day's dive.
 */
export function buildShareText(state: DiveState): string {
  const solved = totalSolved(state);
  const score = totalScore(state);

  const lines = [
    `Ball Knowledge Dive No. ${String(state.day).padStart(3, '0')} — ${ICE} ${state.deepestCleared}/${MAX_DEPTH} levels · ${score} pts`,
  ];

  for (const level of LEVELS) {
    if (level.depth > state.depth) break;
    const board = buildBoard(state.day, level.depth, state.variant);
    const marks = board.rows
      .map((row) => board.cols.map((col) => (state.solved[diveCellKey(level.depth, row.id, col.id)] ? HIT : MISS)).join(''))
      .join(' ');
    lines.push(`${level.depth} ${marks}`);
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
