import type { DiveState } from '../engine/dive';
import { missedCells, reachedName, totalScore, totalSolved } from '../engine/dive';
import type { Board } from '../engine/grid';
import { MAX_DEPTH } from '../engine/levels';
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

export function renderResult(board: Board, state: DiveState): void {
  const section = byId<HTMLElement>('result');

  if (state.status !== 'ended') {
    section.classList.remove('on');
    return;
  }

  bindCopy();

  const solved = totalSolved(state);
  const score = totalScore(state);
  const average = solved > 0 ? score / solved : 0;
  const verdict = verdictFor(state.deepestCleared, average);

  byId('verdict').textContent =
    `${verdict.title} — ${state.deepestCleared}/${MAX_DEPTH} levels · ${score} pts`;
  byId('blurb').textContent = `${verdict.blurb} Deepest ice broken: ${reachedName(state)}.`;

  currentShareText = buildShareText(state);
  byId('share').textContent = currentShareText;

  const reveal = byId('reveal');
  clear(reveal);

  const missed = missedCells(board, state);
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
