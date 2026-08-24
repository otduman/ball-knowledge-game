import type { DiveState } from '../engine/dive';
import { missedCells, rowsCleared, totalScore, totalSolved } from '../engine/dive';
import type { Board } from '../engine/grid';
import type { HistoryEntry } from '../engine/history';
import { recentFor, recordIfFinished, streaksFor } from '../engine/history';
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

const HISTORY_DAYS = 10;

/**
 * The streak, and the last ten boards as a bar each. Only the daily counts:
 * practice boards are unlimited, so letting them build a streak would make the
 * number mean nothing.
 */
function renderRecord(state: DiveState, history: readonly HistoryEntry[]): void {
  const record = byId<HTMLElement>('record');
  clear(record);

  if (state.variant !== 0) return;

  const { current, best, played } = streaksFor(history, state.day);

  const tally = el('div', { className: 'tally' });
  for (const [label, value] of [
    ['Streak', current],
    ['Best', best],
    ['Played', played],
  ] as const) {
    const stat = el('span');
    stat.append(label, el('b', { text: String(value) }));
    tally.append(stat);
  }
  record.append(tally);

  const days = recentFor(history, state.day, HISTORY_DAYS);
  if (days.length > 1) {
    const strip = el('div', {
      className: 'past',
      attrs: { 'aria-label': `Rows cleared on the last ${days.length} boards` },
    });
    for (const { day, entry } of days) {
      const cleared = entry?.cleared ?? 0;
      const column = el('div', { className: day === state.day ? 'day today' : 'day' });
      const fill = el('u', { attrs: { title: `No. ${day}: ${cleared} of ${MAX_DEPTH} rows` } });
      // A played-but-scoreless day still needs to look different from a miss.
      fill.style.height = entry ? `${Math.max(8, (cleared / MAX_DEPTH) * 100)}%` : '2px';
      column.append(fill, el('i', { text: String(cleared || (entry ? 0 : '·')) }));
      strip.append(column);
    }
    record.append(strip);
  }
}

export function renderResult(board: Board, state: DiveState): void {
  const section = byId<HTMLElement>('result');

  if (state.status !== 'ended') {
    section.classList.remove('on');
    return;
  }

  bindCopy();
  // Recording here rather than on the winning guess keeps it idempotent: a
  // reload of a finished board rewrites the same entry instead of being missed.
  renderRecord(state, recordIfFinished(board, state));

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
