// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildGrid } from '../src/engine/grid';
import { poolFor } from '../src/engine/pools';
import { EPOCH_UTC } from '../src/engine/rng';
import { start } from '../src/ui/app';

// The real index.html is the fixture, so a markup change that breaks the app
// fails here instead of only in a browser.
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const BODY = /<body>([\s\S]*?)<\/body>/.exec(html)?.[1] ?? '';

/** Day 1 of the game, so the DOM test drives the same board every run. */
const DAY_ONE = new Date(EPOCH_UTC);
const grid = buildGrid(1);
const duel = buildGrid(1, 0, 'duel');

function mount(): void {
  document.body.innerHTML = BODY.replace(/<script[\s\S]*?<\/script>/g, '');
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

describe('app boot', () => {
  beforeEach(mount);

  it('renders the board with nine playable cells and the day 1 headings', () => {
    start(DAY_ONE);

    expect(cells()).toHaveLength(9);
    expect(document.getElementById('issue')?.textContent).toBe(grid.label);
    expect(document.getElementById('left')?.textContent).toBe('9');
    expect(document.getElementById('score')?.textContent).toBe('0');

    const headings = Array.from(document.querySelectorAll('#board .head')).map((n) => n.textContent);
    expect(headings).toEqual(grid.cols.map((c) => c.label));
  });

  it('opens the picker for a cell and lists matching athletes', () => {
    start(DAY_ONE);
    cells()[0]?.click();

    expect((document.getElementById('sheet') as HTMLElement).hidden).toBe(false);
    expect(document.getElementById('prompt')?.textContent).toContain(grid.rows[0]!.label);

    type('mess');
    expect(options().length).toBeGreaterThan(0);
    expect(options()[0]?.textContent).toContain('Messi');
  });

  it('scores a correct answer and stamps the cell', () => {
    start(DAY_ONE);

    const row = grid.rows[0]!;
    const col = grid.cols[0]!;
    const answer = poolFor(row, col)[0]!;

    cells()[0]?.click();
    type(answer.name);

    const match = options().find((o) => o.textContent?.includes(answer.name));
    expect(match, `expected ${answer.name} in suggestions`).toBeDefined();
    match?.click();

    expect((document.getElementById('sheet') as HTMLElement).hidden).toBe(true);
    expect(document.getElementById('left')?.textContent).toBe('8');
    expect(Number(document.getElementById('score')?.textContent)).toBe(100 - answer.pop);

    const solved = document.querySelector('#board .cell.solved');
    expect(solved?.textContent).toContain(answer.name.split(' ').pop() as string);
  });

  it('spends a guess without filling the cell on a wrong answer', () => {
    start(DAY_ONE);

    const row = grid.rows[0]!;
    const col = grid.cols[0]!;
    const wrong = poolFor(grid.rows[1]!, col).find((a) => !row.matches(a))!;

    cells()[0]?.click();
    type(wrong.name);
    options().find((o) => o.textContent?.includes(wrong.name))?.click();

    expect(document.getElementById('left')?.textContent).toBe('8');
    expect(document.getElementById('score')?.textContent).toBe('0');
    expect(document.querySelectorAll('#board .cell.solved')).toHaveLength(0);
  });

  it('keeps a used athlete out of later suggestions', () => {
    start(DAY_ONE);

    const answer = poolFor(grid.rows[0]!, grid.cols[0]!)[0]!;
    cells()[0]?.click();
    type(answer.name);
    options().find((o) => o.textContent?.includes(answer.name))?.click();

    // Open a different cell and search for the same player.
    cells().find((c) => !c.disabled)?.click();
    type(answer.name);
    expect(options().some((o) => o.textContent?.includes(answer.name))).toBe(false);
  });

  it('explains an ambiguous row heading when it is tapped', () => {
    start(DAY_ONE);

    const index = grid.rows.findIndex((r) => r.explain);
    if (index === -1) return; // this board has no ambiguous row; nothing to assert

    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button.rowhead'));
    const target = buttons.find((b) => b.textContent?.startsWith(grid.rows[index]!.label));
    expect(target, 'expected a tappable heading for the region row').toBeDefined();
    target?.click();

    const info = document.getElementById('info') as HTMLElement;
    expect(info.hidden).toBe(false);
    expect(document.getElementById('info-title')?.textContent).toBe(grid.rows[index]!.label);
    expect(document.getElementById('info-body')?.textContent).toBe(grid.rows[index]!.hint);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(info.hidden).toBe(true);
    expect(document.getElementById('left')?.textContent).toBe('9');
  });

  it('leaves self-evident headings as plain text, not buttons', () => {
    start(DAY_ONE);

    for (const row of grid.rows.filter((r) => !r.explain)) {
      const asButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button.rowhead')).find(
        (b) => b.textContent?.startsWith(row.label),
      );
      expect(asButton, `${row.label} should not be tappable`).toBeUndefined();
    }
  });

  it('prints the member countries under an ambiguous heading', () => {
    start(DAY_ONE);

    const region = grid.rows.find((r) => r.explain && r.shortHint);
    if (!region) return;

    const sub = Array.from(document.querySelectorAll('#board .rowhead .sub')).map((n) => n.textContent);
    expect(sub).toContain(region.shortHint);
  });

  it('explains a column heading too', () => {
    start(DAY_ONE);
    document.querySelector<HTMLButtonElement>('#board .head')?.click();

    expect((document.getElementById('info') as HTMLElement).hidden).toBe(false);
    expect(document.getElementById('info-title')?.textContent).toBe(grid.cols[0]!.label);
  });

  it('shows what each heading accepts inside the picker', () => {
    start(DAY_ONE);
    cells()[0]?.click();

    const qualify = document.querySelector('.qualify');
    expect(qualify).not.toBeNull();
    expect(qualify?.textContent).toContain(grid.rows[0]!.hint);
    expect(qualify?.textContent).toContain(grid.cols[0]!.hint);
  });

  it('closes the picker on Escape without spending a guess', () => {
    start(DAY_ONE);
    cells()[0]?.click();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect((document.getElementById('sheet') as HTMLElement).hidden).toBe(true);
    expect(document.getElementById('left')?.textContent).toBe('9');
  });

  it('shows the result panel and reveal once the board is finished', () => {
    start(DAY_ONE);

    // Fill all nine cells with the top eligible answer for each.
    const used = new Set<string>();
    for (let i = 0; i < 9; i++) {
      const playable = cells().filter((c) => !c.disabled);
      if (playable.length === 0) break;
      playable[0]?.click();

      const label = document.getElementById('prompt')?.textContent ?? '';
      const row = grid.rows.find((r) => label.includes(r.label))!;
      const col = grid.cols.find((c) => label.includes(c.label))!;
      const answer = poolFor(row, col).find((a) => !used.has(a.id))!;
      used.add(answer.id);

      type(answer.name);
      options().find((o) => o.textContent?.includes(answer.name))?.click();
    }

    expect(document.querySelectorAll('#board .cell.solved')).toHaveLength(9);
    expect(document.getElementById('result')?.classList.contains('on')).toBe(true);
    expect(document.getElementById('verdict')?.textContent).toContain('9/9');
    expect(document.getElementById('share')?.textContent).toContain('\u{1F7E9}');
  });

  it('restores saved progress when the app is remounted', () => {
    start(DAY_ONE);

    const answer = poolFor(grid.rows[0]!, grid.cols[0]!)[0]!;
    cells()[0]?.click();
    type(answer.name);
    options().find((o) => o.textContent?.includes(answer.name))?.click();

    // Remount without clearing localStorage, the way a page reload would.
    document.body.innerHTML = BODY.replace(/<script[\s\S]*?<\/script>/g, '');
    start(DAY_ONE);

    expect(document.getElementById('left')?.textContent).toBe('8');
    expect(document.querySelectorAll('#board .cell.solved')).toHaveLength(1);
  });

  it('serves a different board when a practice grid is requested', () => {
    start(DAY_ONE);
    const before = Array.from(document.querySelectorAll('#board .head')).map((n) => n.textContent);

    (document.getElementById('next') as HTMLButtonElement).click();

    expect(document.getElementById('issue')?.textContent).toBe('Grid practice 1');
    expect(document.getElementById('left')?.textContent).toBe('9');
    const after = Array.from(document.querySelectorAll('#board .head')).map((n) => n.textContent);
    expect(after).not.toEqual(before);
  });
});

describe('mode switch', () => {
  beforeEach(mount);

  function modeButton(id: string): HTMLButtonElement {
    return document.getElementById(`mode-${id}`) as HTMLButtonElement;
  }

  it('swaps the 3x3 for a six-cell Football x NBA board', () => {
    start(DAY_ONE);
    expect(cells()).toHaveLength(9);

    modeButton('duel').click();

    expect(cells()).toHaveLength(6);
    expect(document.getElementById('left')?.textContent).toBe('6');
    expect(document.getElementById('issue')?.textContent).toBe(duel.label);

    const headings = Array.from(document.querySelectorAll('#board .head')).map((n) => n.textContent);
    expect(headings.sort()).toEqual(['Football', 'NBA']);
    expect(modeButton('duel').getAttribute('aria-pressed')).toBe('true');
    expect(modeButton('daily').getAttribute('aria-pressed')).toBe('false');
  });

  it('narrows the board to two columns rather than leaving a gap', () => {
    start(DAY_ONE);
    modeButton('duel').click();
    const board = document.getElementById('board') as HTMLElement;
    expect(board.style.gridTemplateColumns).toBe('1.32fr repeat(2, 1fr)');
  });

  it('keeps each mode progress separate and remembers the last one played', () => {
    start(DAY_ONE);
    modeButton('duel').click();

    const answer = poolFor(duel.rows[0]!, duel.cols[0]!)[0]!;
    cells()[0]?.click();
    type(answer.name);
    options().find((o) => o.textContent?.includes(answer.name))?.click();
    expect(document.getElementById('left')?.textContent).toBe('5');

    // A reload lands back in the duel with its own save, not the daily board's.
    document.body.innerHTML = BODY.replace(/<script[\s\S]*?<\/script>/g, '');
    start(DAY_ONE);

    expect(cells()).toHaveLength(6);
    expect(document.getElementById('left')?.textContent).toBe('5');

    modeButton('daily').click();
    expect(document.getElementById('left')?.textContent).toBe('9');
    expect(document.querySelectorAll('#board .cell.solved')).toHaveLength(0);
  });
});
