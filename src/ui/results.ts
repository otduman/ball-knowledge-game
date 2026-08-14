import type { DiveState } from '../engine/dive';
import { missedCells, rowsCleared, totalScore, totalSolved } from '../engine/dive';
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
  const cleared = rowsCleared(state, board);
  const verdict = verdictFor(cleared, solved > 0 ? score / solved : 0);

  byId('verdict').textContent = `${verdict.title} — ${cleared}/${MAX_DEPTH} · ${score} pts`;
  byId('blurb').textContent = verdict.blurb;

  currentShareText = buildShareText(board, state);
  byId('share').textContent = currentShareText;

  const reveal = byId('reveal');
  clear(reveal);

  // How hard the cells actually were, in the only unit that means anything
  // here: how many names would have counted.
  const missed = missedCells(board, state);
  if (missed.length > 0) {
    reveal.append(el('h3', { text: 'What you left' }));
    for (const cell of missed) {
      const row = el('div');
      row.append(
        el('em', { text: `Row ${cell.depth} · ${cell.rowLabel} × ${cell.colLabel}` }),
        el('span', {
          className: 'count',
          text: `${cell.poolSize} would have counted`,
        }),
        cell.suggestions.map((a) => a.name).join(' · ') || 'No eligible athletes in the roster',
      );
      reveal.append(row);
    }
  }

  section.classList.add('on');
}
