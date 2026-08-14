import type { Grid } from '../engine/grid';
import { buildGrid, cellCount } from '../engine/grid';
import type { GameState } from '../engine/game';
import {
  applyGuess,
  createGame,
  solvedCount,
  totalScore,
  usedAthleteIds,
} from '../engine/game';
import type { ModeId } from '../engine/modes';
import { DEFAULT_MODE, MODES, MODE_IDS, modeById } from '../engine/modes';
import { puzzleNumberFor } from '../engine/rng';
import { loadGame, saveGame } from '../engine/storage';
import { categoryById } from '../engine/categories';
import { renderBoard } from './board';
import { byId, clear, el, toast } from './dom';
import { InfoSheet } from './info';
import { Picker } from './picker';
import { renderResult } from './results';

const MODE_KEY = 'bk:mode';

const COUNT_WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

function sentenceCount(n: number): string {
  return COUNT_WORD[n] ?? String(n);
}

export class App {
  private readonly boardEl = byId<HTMLDivElement>('board');
  private readonly picker = new Picker();
  private readonly info = new InfoSheet();
  private modeId: ModeId;
  private grid: Grid;
  private state: GameState;

  constructor(private readonly puzzleNumber: number) {
    this.modeId = App.rememberedMode();
    this.grid = buildGrid(puzzleNumber, 0, this.modeId);
    this.state = loadGame(this.grid) ?? createGame(this.grid);

    byId<HTMLButtonElement>('next').addEventListener('click', () => this.nextGrid());
    this.renderModes();
    this.render();
  }

  /** The last mode played, so a reload lands where the player left off. */
  private static rememberedMode(): ModeId {
    try {
      const stored = window.localStorage.getItem(MODE_KEY);
      if (stored && modeById(stored)) return stored as ModeId;
    } catch {
      // Private-mode storage throws; the default mode is a fine answer.
    }
    return DEFAULT_MODE;
  }

  private renderModes(): void {
    const host = byId<HTMLDivElement>('modes');
    clear(host);

    for (const id of MODE_IDS) {
      const mode = MODES[id];
      const active = id === this.modeId;
      const button = el('button', {
        className: 'mode',
        text: mode.label,
        attrs: {
          type: 'button',
          id: `mode-${id}`,
          'aria-pressed': String(active),
          'aria-label': `${mode.label}: ${mode.blurb}`,
        },
      });
      button.addEventListener('click', () => this.switchMode(id));
      host.append(button);
    }
  }

  private render(): void {
    const mode = MODES[this.modeId];
    const cells = cellCount(this.grid);

    byId('issue').textContent = this.grid.label;
    byId('dek-mode').textContent = mode.blurb;
    byId('strap-rules').textContent =
      `${sentenceCount(cells)} cells. ${sentenceCount(cells)} guesses.`.replace(/^./, (c) =>
        c.toUpperCase(),
      );
    byId('left').textContent = String(this.state.guessesLeft);
    byId('score').textContent = String(totalScore(this.state));

    renderBoard(this.boardEl, this.grid, this.state, {
      onOpenCell: (rowId, colId) => this.openCell(rowId, colId),
      onExplain: (categoryId) => {
        const category = categoryById(categoryId);
        if (category) this.info.open(category);
      },
    });
    renderResult(this.grid, this.state);
  }

  private switchMode(id: ModeId): void {
    if (id === this.modeId) return;
    this.modeId = id;
    try {
      window.localStorage.setItem(MODE_KEY, id);
    } catch {
      // Losing the preference is not worth failing the switch over.
    }

    // Back to variant 0: the day's board for this mode, resumed if it was
    // already in progress, rather than a fresh practice round.
    this.grid = buildGrid(this.puzzleNumber, 0, id);
    this.state = loadGame(this.grid) ?? createGame(this.grid);
    this.renderModes();
    this.render();
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  private openCell(rowId: string, colId: string): void {
    const row = this.grid.rows.find((c) => c.id === rowId);
    const col = this.grid.cols.find((c) => c.id === colId);
    if (!row || !col) return;

    this.picker.open({
      rowLabel: row.label,
      colLabel: col.label,
      rowHint: row.hint,
      colHint: col.hint,
      exclude: usedAthleteIds(this.state),
      onPick: (athlete) => this.submit(rowId, colId, athlete.id),
    });
  }

  private submit(rowId: string, colId: string, athleteId: string): void {
    const before = this.state;
    const outcome = applyGuess(this.grid, before, rowId, colId, athleteId);

    if (outcome.kind === 'rejected') {
      toast(
        outcome.reason === 'already-used'
          ? 'That athlete is already on the board'
          : 'That guess could not be played',
      );
      return;
    }

    this.state = outcome.state;
    saveGame(this.state);

    if (outcome.kind === 'hit') {
      toast(`${outcome.athlete.name} — +${outcome.points}`);
    } else {
      this.flashMiss();
      toast(`${outcome.athlete.name} does not fit that cell`);
    }

    this.render();

    if (this.state.status === 'finished' && before.status !== 'finished') {
      byId('result').scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  }

  private flashMiss(): void {
    const bar = document.querySelector<HTMLElement>('.bar');
    if (!bar) return;
    bar.classList.add('flash-miss');
    window.setTimeout(() => bar.classList.remove('flash-miss'), 320);
  }

  /**
   * Practice grids for the same day. The daily board stays at variant 0 so
   * coming back later resumes it rather than a practice round.
   */
  private nextGrid(): void {
    const nextVariant = this.grid.variant + 1;
    this.grid = buildGrid(this.puzzleNumber, nextVariant, this.modeId);
    this.state = loadGame(this.grid) ?? createGame(this.grid);
    this.render();
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
    toast(`${this.grid.label} — ${solvedCount(this.state)}/${cellCount(this.grid)} solved`);
  }
}

export function start(now: Date = new Date()): App {
  return new App(puzzleNumberFor(now));
}
