// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildBoard } from '../src/engine/grid';
import { MAX_DEPTH, STARTING_GUESSES } from '../src/engine/levels';
import { poolFor } from '../src/engine/pools';
import { EPOCH_UTC } from '../src/engine/rng';
import { start } from '../src/ui/app';

// The real index.html is the fixture, so a markup change that breaks the app
// fails here instead of only in a browser.
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const BODY = /<body[^>]*>([\s\S]*?)<\/body>/.exec(html)?.[1] ?? '';

/** Day 1, so the DOM test drives the same board every run. */
const DAY_ONE = new Date(EPOCH_UTC);
const board = buildBoard(1);

function mount(): void {
  document.body.innerHTML = BODY.replace(/<script[\s\S]*?<\/script>/g, '');
  window.localStorage.clear();
  // jsdom defines scrollTo but throws "Not implemented" from it.
  window.scrollTo = () => {};
}

function cells(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('#board .cell'));
}

function rowHeadings(): string[] {
  return Array.from(document.querySelectorAll('#board .rowhead .lbl')).map((n) => n.textContent ?? '');
}

function type(value: string): void {
  const input = document.getElementById('search') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function options(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('#sugg [role="option"]'));
}

function solvedNames(): string[] {
  return Array.from(document.querySelectorAll('#board .cell.solved')).map(
    (n) => n.getAttribute('aria-label') ?? '',
  );
}

/** Fills open row `depth`, cell by cell, through the real UI. */
function fillRow(depth: number): void {
  const row = board.rows[depth - 1]!;
  for (let i = 0; i < board.cols.length; i++) {
    const col = board.cols[i]!;
    const used = solvedNames();
    const answer = poolFor(row, col).find((a) => !used.some((label) => label.includes(a.name)))!;
    const index = (depth - 1) * board.cols.length + i;

    cells()[index]?.click();
    type(answer.name);
    options().find((o) => o.textContent?.includes(answer.name))?.click();
  }
}

describe('the board boots', () => {
  beforeEach(mount);

  it('shows only the first row', () => {
    start(DAY_ONE);

    expect(cells()).toHaveLength(board.cols.length);
    expect(rowHeadings()).toEqual([board.rows[0]!.label]);
    expect(document.getElementById('left')?.textContent).toBe(String(STARTING_GUESSES));
    expect(document.getElementById('issue')?.textContent).toBe(board.label);
  });

  it('says how many rows are still below', () => {
    start(DAY_ONE);
    expect(document.querySelector('#board .locked')?.textContent).toContain(
      `${MAX_DEPTH - 1} more rows`,
    );
  });

  it('marks the row with its difficulty', () => {
    start(DAY_ONE);
    const ticks = document.querySelectorAll('#board .rowhead .tier i');
    expect(ticks).toHaveLength(MAX_DEPTH);
    // Row one, so one tick lit.
    expect(Array.from(ticks).filter((t) => t.className === 'on')).toHaveLength(1);
  });

  it('opens the picker and scores a correct answer', () => {
    start(DAY_ONE);
    cells()[0]?.click();
    expect((document.getElementById('sheet') as HTMLElement).hidden).toBe(false);
    expect(document.getElementById('prompt')?.textContent).toContain(board.rows[0]!.label);

    const answer = poolFor(board.rows[0]!, board.cols[0]!)[0]!;
    type(answer.name);
    options().find((o) => o.textContent?.includes(answer.name))?.click();

    expect(document.querySelectorAll('#board .cell.solved')).toHaveLength(1);
    expect(document.getElementById('left')?.textContent).toBe(String(STARTING_GUESSES - 1));
  });
});

describe('rows opening', () => {
  beforeEach(mount);

  it('adds the next row once the first is full, and animates only that row', () => {
    start(DAY_ONE);
    fillRow(1);

    expect(rowHeadings()).toEqual([board.rows[0]!.label, board.rows[1]!.label]);
    expect(cells()).toHaveLength(board.cols.length * 2);

    // Only the new row carries the opening animation. The row above holds
    // answers the player is still reading and must not move again.
    const opening = Array.from(document.querySelectorAll('#board .opening'));
    expect(opening).toHaveLength(1 + board.cols.length);
    expect(opening[0]?.textContent).toContain(board.rows[1]!.label);
  });

  it('lights one more difficulty tick on each row down', () => {
    start(DAY_ONE);
    fillRow(1);

    const bars = Array.from(document.querySelectorAll('#board .rowhead .tier'));
    expect(bars).toHaveLength(2);
    expect(bars[0]?.querySelectorAll('i.on')).toHaveLength(1);
    expect(bars[1]?.querySelectorAll('i.on')).toHaveLength(2);
  });

  it('keeps the animation to the one render that opened the row', () => {
    start(DAY_ONE);
    fillRow(1);
    expect(document.querySelectorAll('#board .opening').length).toBeGreaterThan(0);

    // Any later guess re-renders; nothing should still be animating.
    const row2 = board.rows[1]!;
    const used = solvedNames();
    const answer = poolFor(row2, board.cols[0]!).find(
      (a) => !used.some((label) => label.includes(a.name)),
    )!;
    cells()[board.cols.length]?.click();
    type(answer.name);
    options().find((o) => o.textContent?.includes(answer.name))?.click();

    expect(document.querySelectorAll('#board .opening')).toHaveLength(0);
  });

  it('resumes at the right row after a reload', () => {
    start(DAY_ONE);
    fillRow(1);
    fillRow(2);

    document.body.innerHTML = BODY.replace(/<script[\s\S]*?<\/script>/g, '');
    start(DAY_ONE);

    expect(rowHeadings()).toHaveLength(3);
    expect(document.querySelectorAll('#board .cell.solved')).toHaveLength(4);
    expect(document.querySelectorAll('#board .opening')).toHaveLength(0);
  });
});

describe('running out', () => {
  beforeEach(mount);

  it('ends the board and shows how many names would have counted', () => {
    start(DAY_ONE);

    const row = board.rows[0]!;
    const col = board.cols[0]!;
    const wrong = poolFor(row, board.cols[1]!).find((a) => !(row.matches(a) && col.matches(a)))!;

    for (let i = 0; i < STARTING_GUESSES; i++) {
      cells()[0]?.click();
      type(wrong.name);
      options().find((o) => o.textContent?.includes(wrong.name))?.click();
    }

    expect(document.getElementById('left')?.textContent).toBe('0');
    expect(document.getElementById('result')?.className).toContain('on');
    expect(document.getElementById('verdict')?.textContent).toContain(`0/${MAX_DEPTH}`);
    expect(document.querySelector('#reveal .count')?.textContent).toContain('would have counted');
  });
});
