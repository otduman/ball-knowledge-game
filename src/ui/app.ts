import type { Grid } from '../engine/grid';
import { buildGrid } from '../engine/grid';
import type { GameState } from '../engine/game';
import {
  applyGuess,
  createGame,
  solvedCount,
  totalScore,
  usedAthleteIds,
} from '../engine/game';
import { puzzleNumberFor } from '../engine/rng';
import { loadGame, saveGame } from '../engine/storage';
import { categoryById } from '../engine/categories';
import { renderBoard } from './board';
import { byId, toast } from './dom';
import { InfoSheet } from './info';
import { Picker } from './picker';
import { renderResult } from './results';

export class App {
  private readonly boardEl = byId<HTMLDivElement>('board');
  private readonly picker = new Picker();
  private readonly info = new InfoSheet();
  private grid: Grid;
  private state: GameState;

  constructor(private readonly puzzleNumber: number) {
    this.grid = buildGrid(puzzleNumber, 0);
    this.state = loadGame(this.grid) ?? createGame(this.grid);

    byId<HTMLButtonElement>('next').addEventListener('click', () => this.nextGrid());
    this.render();
  }

  private render(): void {
    byId('issue').textContent = this.grid.label;
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
    this.grid = buildGrid(this.puzzleNumber, nextVariant);
    this.state = loadGame(this.grid) ?? createGame(this.grid);
    this.render();
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
    toast(`${this.grid.label} — ${solvedCount(this.state)}/9 solved`);
  }
}

export function start(now: Date = new Date()): App {
  return new App(puzzleNumberFor(now));
}
