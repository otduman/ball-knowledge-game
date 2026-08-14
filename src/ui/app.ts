import { categoryById } from '../engine/categories';
import type { DiveState } from '../engine/dive';
import { applyGuess, boardFor, createDive, totalScore, usedAthleteIds } from '../engine/dive';
import type { Board } from '../engine/grid';
import { MAX_DEPTH } from '../engine/levels';
import { puzzleNumberFor } from '../engine/rng';
import { loadDive, saveDive } from '../engine/storage';
import { renderBoard } from './board';
import { byId, toast } from './dom';
import { InfoSheet } from './info';
import { Picker } from './picker';
import { renderResult } from './results';

export class App {
  private readonly boardEl = byId<HTMLDivElement>('board');
  private readonly picker = new Picker();
  private readonly info = new InfoSheet();
  private state: DiveState;
  private board: Board;
  /** Set for one render only, so the newly opened row animates and nothing else does. */
  private openingRow = 0;

  constructor(private readonly day: number) {
    this.state = loadDive(day, 0) ?? createDive(day, 0);
    this.board = boardFor(this.state);

    byId<HTMLButtonElement>('next').addEventListener('click', () => this.newBoard());
    this.render();
  }

  private render(): void {
    const ended = this.state.status === 'ended';

    byId('issue').textContent = this.board.label;
    byId('left').textContent = String(this.state.guessesLeft);
    byId('score').textContent = String(totalScore(this.state));
    byId('strap-rules').textContent = ended
      ? 'Board over.'
      : `Row ${this.state.openRows} of ${MAX_DEPTH}. Fill it to open the next.`;

    renderBoard(
      this.boardEl,
      {
        board: this.board,
        solved: this.state.solved,
        openRows: this.state.openRows,
        openingRow: this.openingRow,
        revealed: ended,
      },
      {
        onOpenCell: (rowId, colId) => this.openCell(rowId, colId),
        onExplain: (categoryId) => {
          const category = categoryById(categoryId);
          if (category) this.info.open(category);
        },
      },
    );
    this.openingRow = 0;

    renderResult(this.board, this.state);
  }

  private openCell(rowId: string, colId: string): void {
    if (this.state.status === 'ended') return;

    const row = this.board.rows.find((c) => c.id === rowId);
    const col = this.board.cols.find((c) => c.id === colId);
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
    const outcome = applyGuess(this.board, before, rowId, colId, athleteId);

    if (outcome.kind === 'rejected') {
      toast(
        outcome.reason === 'already-used'
          ? 'That athlete is already on the board'
          : 'That guess could not be played',
      );
      return;
    }

    this.state = outcome.state;
    saveDive(this.state);

    if (outcome.kind === 'hit') {
      toast(`${outcome.athlete.name} — +${outcome.points}`);
      if (outcome.opened) this.openingRow = this.state.openRows;
    } else {
      this.flashMiss();
      toast(`${outcome.athlete.name} does not fit that cell`);
    }

    this.render();

    if (this.state.status === 'ended' && before.status !== 'ended') {
      byId('result').scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  }

  private flashMiss(): void {
    const bar = document.querySelector<HTMLElement>('.bar');
    if (!bar) return;
    bar.classList.add('flash-miss');
    window.setTimeout(() => bar.classList.remove('flash-miss'), 320);
  }

  /** A fresh practice board for the same day. The daily board stays at variant 0. */
  private newBoard(): void {
    const variant = this.state.variant + 1;
    this.state = loadDive(this.day, variant) ?? createDive(this.day, variant);
    this.board = boardFor(this.state);
    this.render();
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
    toast(`${this.board.label} — back to the top row`);
  }
}

export function start(now: Date = new Date()): App {
  return new App(puzzleNumberFor(now));
}
