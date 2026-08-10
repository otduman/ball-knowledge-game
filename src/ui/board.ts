import { athleteById } from '../data/rosters';
import type { Athlete } from '../data/types';
import type { GameState } from '../engine/game';
import type { Grid } from '../engine/grid';
import { cellKey, poolDepth, poolFor } from '../engine/pools';
import { rarityScore } from '../engine/scoring';
import { clear, el } from './dom';

export interface BoardHandlers {
  onOpenCell(rowId: string, colId: string): void;
  onExplain(categoryId: string): void;
}

/** Renders the surname on its own, larger line, the way the prototype did. */
function nameNode(athlete: Athlete): HTMLElement {
  const node = el('span', { className: 'nm' });
  const parts = athlete.name.split(' ');
  if (parts.length > 1) {
    node.append(
      `${parts.slice(0, -1).join(' ')} `,
      el('span', { className: 'surname', text: parts[parts.length - 1] as string }),
    );
  } else {
    node.textContent = athlete.name;
  }
  return node;
}

function solvedCellNode(athlete: Athlete, rowLabel: string, colLabel: string): HTMLButtonElement {
  const points = rarityScore(athlete);
  const button = el('button', {
    className: 'cell solved',
    attrs: {
      type: 'button',
      disabled: '',
      'aria-label': `${rowLabel}, ${colLabel}: ${athlete.name}, ${points} points`,
    },
  });
  button.append(nameNode(athlete), el('span', { className: 'stamp', text: `+${points}` }));
  return button;
}

function deadCellNode(example: Athlete | undefined, rowLabel: string, colLabel: string): HTMLButtonElement {
  const button = el('button', {
    className: 'cell dead',
    attrs: {
      type: 'button',
      disabled: '',
      'aria-label': example
        ? `${rowLabel}, ${colLabel}: unsolved. Example answer: ${example.name}`
        : `${rowLabel}, ${colLabel}: unsolved`,
    },
  });
  button.append(
    el('span', { className: 'cap', text: 'e.g.' }),
    el('span', { className: 'miss-nm', text: example?.name ?? '—' }),
  );
  return button;
}

function openCellNode(
  rowLabel: string,
  colLabel: string,
  depth: 1 | 2 | 3,
  onOpen: () => void,
): HTMLButtonElement {
  const button = el('button', {
    className: 'cell',
    attrs: {
      type: 'button',
      'aria-label': `Name an athlete from ${rowLabel} in ${colLabel}. Pool depth ${depth} of 3.`,
    },
  });

  const dots = el('span', { className: 'depth', attrs: { 'aria-hidden': 'true' } });
  for (let i = 0; i < 3; i++) {
    dots.append(el('i', { className: i < depth ? 'on' : '' }));
  }

  button.append(dots, el('span', { className: 'plus', text: '+', attrs: { 'aria-hidden': 'true' } }));
  button.addEventListener('click', onOpen);
  return button;
}

export function renderBoard(
  container: HTMLElement,
  grid: Grid,
  state: GameState,
  handlers: BoardHandlers,
): void {
  clear(container);

  const corner = el('div', { className: 'corner' });
  corner.append('Name one', el('br'), 'athlete per', el('br'), 'cell');
  container.append(corner);

  for (const col of grid.cols) {
    const head = el('button', {
      className: 'head',
      attrs: { type: 'button', 'aria-label': `${col.label}. What counts: ${col.hint}` },
    });
    head.append(el('span', { className: 'txt', text: col.label }));
    head.addEventListener('click', () => handlers.onExplain(col.id));
    container.append(head);
  }

  for (const row of grid.rows) {
    const rowHead = el('button', {
      className: 'rowhead',
      attrs: { type: 'button', 'aria-label': `${row.label}. What counts: ${row.hint}` },
    });
    rowHead.append(el('span', { className: 'lbl', text: row.label }));
    rowHead.addEventListener('click', () => handlers.onExplain(row.id));
    container.append(rowHead);

    for (const col of grid.cols) {
      const key = cellKey(row.id, col.id);
      const solvedId = state.solved[key];
      const pool = poolFor(row, col);

      if (solvedId) {
        const athlete = athleteById(solvedId);
        if (athlete) {
          container.append(solvedCellNode(athlete, row.label, col.label));
          continue;
        }
      }

      if (state.status === 'finished') {
        // Reveal from just inside the pool rather than the very top name.
        const example = pool[Math.min(Math.floor(pool.length / 3), Math.max(0, pool.length - 1))];
        container.append(deadCellNode(example, row.label, col.label));
        continue;
      }

      container.append(
        openCellNode(row.label, col.label, poolDepth(pool.length), () =>
          handlers.onOpenCell(row.id, col.id),
        ),
      );
    }
  }
}
