import { athleteById } from '../data/rosters';
import type { Athlete } from '../data/types';
import type { Category } from '../engine/categories';
import { cellKey } from '../engine/dive';
import type { Board } from '../engine/grid';
import { MAX_DEPTH } from '../engine/levels';
import { poolFor } from '../engine/pools';
import { rarityScore } from '../engine/scoring';
import { clear, el } from './dom';

export interface BoardHandlers {
  onOpenCell(rowId: string, colId: string): void;
  onExplain(categoryId: string): void;
}

export interface BoardView {
  board: Board;
  solved: Record<string, string>;
  /** How many rows are open. Rows below this are not rendered at all. */
  openRows: number;
  /** The row that just opened, animated in. 0 for none. */
  openingRow: number;
  revealed: boolean;
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

function openCellNode(rowLabel: string, colLabel: string, onOpen: () => void): HTMLButtonElement {
  const button = el('button', {
    className: 'cell',
    attrs: {
      type: 'button',
      'aria-label': `Name an athlete from ${rowLabel} in ${colLabel}.`,
    },
  });
  button.append(el('span', { className: 'plus', text: '+', attrs: { 'aria-hidden': 'true' } }));
  button.addEventListener('click', onOpen);
  return button;
}

/**
 * The row's difficulty, as ticks filled to its depth. It belongs on the row and
 * not in the cells: both cells of a row share a window, and one mark reads at a
 * glance where two sets of dots did not.
 */
function tierNode(depth: number): HTMLElement {
  const bar = el('span', {
    className: 'tier',
    attrs: { 'aria-label': `Difficulty ${depth} of ${MAX_DEPTH}` },
  });
  for (let i = 1; i <= MAX_DEPTH; i++) bar.append(el('i', { className: i <= depth ? 'on' : '' }));
  return bar;
}

/**
 * Only ambiguous headings become buttons. "Spain" and "Surname F" say what they
 * mean, so decorating every heading with an affordance was noise that buried
 * the one case ("Southern Europe") where it mattered.
 */
function headingNode(
  category: Category,
  className: string,
  labelClass: string,
  handlers: BoardHandlers,
  depth?: number,
): HTMLElement {
  const label = el('span', { className: labelClass, text: category.label });

  if (!category.explain) {
    const plain = el('div', { className: `${className} plain` });
    plain.append(label);
    if (depth) plain.append(tierNode(depth));
    return plain;
  }

  const button = el('button', {
    className,
    attrs: { type: 'button', 'aria-label': `${category.label}. What counts: ${category.hint}` },
  });
  button.append(label);
  if (category.shortHint) button.append(el('span', { className: 'sub', text: category.shortHint }));
  if (depth) button.append(tierNode(depth));
  button.addEventListener('click', () => handlers.onExplain(category.id));
  return button;
}

export function renderBoard(container: HTMLElement, view: BoardView, handlers: BoardHandlers): void {
  const { board, solved, openRows, openingRow, revealed } = view;
  clear(container);
  container.style.gridTemplateColumns = `1.32fr repeat(${board.cols.length}, 1fr)`;

  const corner = el('div', { className: 'corner' });
  corner.append('Name one', el('br'), 'athlete per', el('br'), 'cell');
  container.append(corner);

  for (const col of board.cols) {
    container.append(headingNode(col, 'head', 'txt', handlers));
  }

  for (let depth = 1; depth <= openRows; depth++) {
    const row = board.rows[depth - 1];
    if (!row) continue;
    const opening = depth === openingRow ? ' opening' : '';

    const heading = headingNode(row, 'rowhead', 'lbl', handlers, depth);
    heading.className += opening;
    container.append(heading);

    for (const col of board.cols) {
      const solvedId = solved[cellKey(row.id, col.id)];
      const pool = poolFor(row, col);
      let node: HTMLElement | undefined;

      if (solvedId) {
        const athlete = athleteById(solvedId);
        if (athlete) node = solvedCellNode(athlete, row.label, col.label);
      }
      if (!node && revealed) {
        // Reveal from just inside the pool rather than the very top name.
        const example = pool[Math.min(Math.floor(pool.length / 3), Math.max(0, pool.length - 1))];
        node = deadCellNode(example, row.label, col.label);
      }
      if (!node) {
        node = openCellNode(row.label, col.label, () => handlers.onOpenCell(row.id, col.id));
      }

      node.className += opening;
      container.append(node);
    }
  }

  if (!revealed && openRows < MAX_DEPTH) {
    container.append(
      el('div', {
        className: 'locked',
        text: `${MAX_DEPTH - openRows} more ${MAX_DEPTH - openRows === 1 ? 'row' : 'rows'} below`,
      }),
    );
  }
}
