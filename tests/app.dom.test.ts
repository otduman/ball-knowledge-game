// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildBoard } from '../src/engine/grid';
import { MAX_DEPTH, guessesAt } from '../src/engine/levels';
import { poolFor } from '../src/engine/pools';
import { EPOCH_UTC } from '../src/engine/rng';
import { start } from '../src/ui/app';

// The real index.html is the fixture, so a markup change that breaks the app
// fails here instead of only in a browser.
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const BODY = /<body[^>]*>([\s\S]*?)<\/body>/.exec(html)?.[1] ?? '';

/** Day 1 of the game, so the DOM test drives the same dive every run. */
const DAY_ONE = new Date(EPOCH_UTC);
const surface = buildBoard(1, 1);

function mount(): void {
  document.body.innerHTML = BODY.replace(/<script[\s\S]*?<\/script>/g, '');
  document.body.dataset.depth = '1';
  window.localStorage.clear();
  // jsdom defines scrollTo but throws "Not implemented" from it.
  window.scrollTo = () => {};
}

function cells(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('#board .cell'));
}

function type(value: string): void {
  const input = document.getElementById('search') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function options(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('#sugg [role="option"]'));
}

/** Answers the cell at `index` of the current board with a name that fits it. */
function answerCell(board: ReturnType<typeof buildBoard>, index: number): void {
  const row = board.rows[Math.floor(index / board.cols.length)]!;
  const col = board.cols[index % board.cols.length]!;
  const used = new Set(
    Array.from(document.querySelectorAll('#board .cell.solved .nm')).map((n) => n.textContent ?? ''),
  );
  const answer = poolFor(row, col).find((a) => ![...used].some((u) => u.includes(a.name)))!;

  cells()[index]?.click();
  type(answer.name);
  options().find((o) => o.textContent?.includes(answer.name))?.click();
}

describe('the dive boots', () => {
  beforeEach(mount);

  it('opens at the surface with the day 1 board', () => {
    start(DAY_ONE);

    expect(cells()).toHaveLength(surface.rows.length * surface.cols.length);
    expect(document.getElementById('issue')?.textContent).toBe(surface.label);
    expect(document.getElementById('left')?.textContent).toBe(String(guessesAt(1)));
    expect(document.body.dataset.depth).toBe('1');

    const headings = Array.from(document.querySelectorAll('#board .head')).map((n) => n.textContent);
    expect(headings).toEqual(surface.cols.map((c) => c.label));
  });

  it('shows a depth gauge with one step per level, the first current', () => {
    start(DAY_ONE);
    const steps = Array.from(document.querySelectorAll('#gauge div'));

    expect(steps).toHaveLength(MAX_DEPTH);
    expect(steps[0]?.className).toContain('here');
    expect(steps.some((s) => s.className.includes('cleared'))).toBe(false);
  });

  it('opens the picker for a cell and lists matching athletes', () => {
    start(DAY_ONE);
    cells()[0]?.click();

    expect((document.getElementById('sheet') as HTMLElement).hidden).toBe(false);
    expect(document.getElementById('prompt')?.textContent).toContain(surface.rows[0]!.label);

    type('mess');
    expect(options().length).toBeGreaterThan(0);
  });

  it('scores a correct answer and stamps the cell', () => {
    start(DAY_ONE);
    answerCell(surface, 0);

    expect(document.querySelectorAll('#board .cell.solved')).toHaveLength(1);
    expect(document.getElementById('left')?.textContent).toBe(String(guessesAt(1) - 1));
    expect(Number(document.getElementById('score')?.textContent)).toBeGreaterThan(0);
  });
});

describe('breaking through', () => {
  beforeEach(() => {
    mount();
    vi.useFakeTimers();
  });

  it('cracks the ice and drops to level 2 once the board is full', () => {
    start(DAY_ONE);
    const total = surface.rows.length * surface.cols.length;
    for (let i = 0; i < total; i++) answerCell(surface, i);

    // The break plays before the descent, so the finished board stays visible.
    expect(document.getElementById('stage')?.className).toContain('breaking');
    expect(document.body.dataset.depth).toBe('1');

    vi.advanceTimersByTime(1000);

    expect(document.body.dataset.depth).toBe('2');
    expect(document.getElementById('left')?.textContent).toBe(String(guessesAt(2)));

    const steps = Array.from(document.querySelectorAll('#gauge div'));
    expect(steps[0]?.className).toContain('cleared');
    expect(steps[1]?.className).toContain('here');

    const level2 = buildBoard(1, 2);
    expect(cells()).toHaveLength(level2.rows.length * level2.cols.length);
    expect(document.querySelectorAll('#board .cell.solved')).toHaveLength(0);
  });

  it('resumes mid-dive after a reload', () => {
    start(DAY_ONE);
    const total = surface.rows.length * surface.cols.length;
    for (let i = 0; i < total; i++) answerCell(surface, i);
    vi.advanceTimersByTime(1000);

    const level2 = buildBoard(1, 2);
    answerCell(level2, 0);

    // Remount without clearing localStorage, the way a page reload would.
    document.body.innerHTML = BODY.replace(/<script[\s\S]*?<\/script>/g, '');
    start(DAY_ONE);

    expect(document.body.dataset.depth).toBe('2');
    expect(document.querySelectorAll('#board .cell.solved')).toHaveLength(1);
    expect(document.getElementById('left')?.textContent).toBe(String(guessesAt(2) - 1));
    expect(Array.from(document.querySelectorAll('#gauge div'))[0]?.className).toContain('cleared');
  });
});

describe('running out', () => {
  beforeEach(mount);

  it('ends the dive and reveals answers once the guesses are gone', () => {
    start(DAY_ONE);

    const row = surface.rows[0]!;
    const col = surface.cols[0]!;
    const wrong = poolFor(surface.rows[0]!, surface.cols[1]!).find(
      (a) => !(row.matches(a) && col.matches(a)),
    )!;

    for (let i = 0; i < guessesAt(1); i++) {
      cells()[0]?.click();
      type(wrong.name);
      options().find((o) => o.textContent?.includes(wrong.name))?.click();
    }

    expect(document.getElementById('left')?.textContent).toBe('0');
    expect(document.getElementById('result')?.className).toContain('on');
    expect(document.getElementById('verdict')?.textContent).toContain(`0/${MAX_DEPTH}`);
    expect(document.querySelectorAll('#board .cell.dead').length).toBeGreaterThan(0);
    expect(document.getElementById('share')?.textContent).toContain('Dive No.');
  });
});
