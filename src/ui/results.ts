import type { GameState } from '../engine/game';
import { missedCells, solvedCount, totalScore } from '../engine/game';
import type { Grid } from '../engine/grid';
import { buildShareText, copyText } from '../engine/share';
import { verdictFor } from '../engine/scoring';
import { byId, clear, el, toast } from './dom';

let copyHandlerBound = false;
let currentShareText = '';

function bindCopy(): void {
  if (copyHandlerBound) return;
  copyHandlerBound = true;

  const button = byId<HTMLButtonElement>('copy');
  button.addEventListener('click', async () => {
    const ok = await copyText(currentShareText);
    toast(ok ? 'Result copied' : 'Copy failed — select the text instead');
  });
}

export function renderResult(grid: Grid, state: GameState): void {
  const section = byId<HTMLElement>('result');

  if (state.status !== 'finished') {
    section.classList.remove('on');
    return;
  }

  bindCopy();

  const solved = solvedCount(state);
  const score = totalScore(state);
  const verdict = verdictFor(solved, score);

  byId('verdict').textContent = `${verdict.title} — ${solved}/9 · ${score} pts`;
  byId('blurb').textContent = verdict.blurb;

  currentShareText = buildShareText(grid, state);
  byId('share').textContent = currentShareText;

  const reveal = byId('reveal');
  clear(reveal);

  const missed = missedCells(grid, state);
  if (missed.length > 0) {
    reveal.append(el('h3', { text: 'Names you could have used' }));
    for (const cell of missed) {
      const row = el('div');
      row.append(
        el('em', { text: `${cell.rowLabel} × ${cell.colLabel}` }),
        cell.suggestions.map((a) => a.name).join(' · ') || 'No eligible athletes in the roster',
      );
      reveal.append(row);
    }
  }

  section.classList.add('on');
}
