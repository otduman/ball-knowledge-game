import { categoryById } from '../engine/categories';
import type { DiveState } from '../engine/dive';
import {
  applyGuess,
  boardFor,
  createDive,
  descend,
  totalScore,
  usedAthleteIds,
} from '../engine/dive';
import type { Board } from '../engine/grid';
import { LEVELS, MAX_DEPTH, levelAt } from '../engine/levels';
import { puzzleNumberFor } from '../engine/rng';
import { loadDive, saveDive } from '../engine/storage';
import { renderBoard } from './board';
import { byId, clear, el, toast } from './dom';
import { InfoSheet } from './info';
import { Picker } from './picker';
import { renderResult } from './results';

/** Crack, shudder, plunge, then the next level rises. Matches the CSS timings. */
const BREAK_MS = 900;

export class App {
  private readonly stageEl = byId<HTMLDivElement>('stage');
  private readonly boardEl = byId<HTMLDivElement>('board');
  private readonly picker = new Picker();
  private readonly info = new InfoSheet();
  private state: DiveState;
  private board: Board;
  private breaking = false;

  constructor(private readonly day: number) {
    this.state = loadDive(day, 0) ?? createDive(day, 0);
    this.board = boardFor(this.state);

    byId<HTMLButtonElement>('next').addEventListener('click', () => this.newDive());
    this.render();
  }

  private render(): void {
    const level = levelAt(this.state.depth);
    const ended = this.state.status === 'ended';

    document.body.dataset.depth = String(this.state.depth);
    byId('issue').textContent = this.board.label;
    byId('left').textContent = String(this.state.guessesLeft);
    byId('score').textContent = String(totalScore(this.state));
    byId('level-note').textContent = level.blurb;
    byId('strap-rules').textContent = ended
      ? 'Dive over.'
      : `Fill the board to break through. Level ${level.depth} of ${MAX_DEPTH}.`;

    this.renderGauge();
    renderBoard(this.boardEl, this.board, this.state.solved, ended, {
      onOpenCell: (rowId, colId) => this.openCell(rowId, colId),
      onExplain: (categoryId) => {
        const category = categoryById(categoryId);
        if (category) this.info.open(category);
      },
    });
    renderResult(this.board, this.state);
  }

  private renderGauge(): void {
    const host = byId<HTMLDivElement>('gauge');
    clear(host);

    for (const level of LEVELS) {
      const cleared = this.state.deepestCleared >= level.depth;
      const here = this.state.depth === level.depth && this.state.status === 'diving';
      const node = el('div', {
        className: [cleared ? 'cleared' : '', here ? 'here' : ''].filter(Boolean).join(' '),
        attrs: {
          'aria-current': here ? 'step' : 'false',
          'aria-label': `Level ${level.depth}, ${level.name}${cleared ? ', cleared' : here ? ', current' : ''}`,
        },
      });
      node.append(el('b', { text: String(level.depth) }), level.name);
      host.append(node);
    }
  }

  private openCell(rowId: string, colId: string): void {
    if (this.breaking || this.state.status === 'ended') return;

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
          ? 'That athlete is already on this level'
          : 'That guess could not be played',
      );
      return;
    }

    this.state = outcome.state;
    saveDive(this.state);

    if (outcome.kind === 'hit') {
      toast(`${outcome.athlete.name} — +${outcome.points}`);
    } else {
      this.flashMiss();
      toast(`${outcome.athlete.name} does not fit that cell`);
    }

    this.render();

    if (outcome.kind === 'hit' && outcome.cleared && this.state.status === 'diving') {
      this.breakThrough();
      return;
    }
    if (this.state.status === 'ended' && before.status !== 'ended') {
      byId('result').scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * The ice gives way. The board is rendered as cleared for the whole animation
   * so the player sees the level they just finished, and input is locked until
   * the next one has risen.
   */
  private breakThrough(): void {
    this.breaking = true;
    this.stageEl.classList.add('breaking');
    toast(`Level ${this.state.depth} cleared — the ice gives way`);

    window.setTimeout(() => {
      this.state = descend(this.state);
      this.board = boardFor(this.state);
      saveDive(this.state);

      this.stageEl.classList.remove('breaking');
      this.stageEl.classList.add('rising');
      this.breaking = false;
      this.render();

      window.setTimeout(() => this.stageEl.classList.remove('rising'), 500);
    }, BREAK_MS);
  }

  private flashMiss(): void {
    const bar = document.querySelector<HTMLElement>('.bar');
    if (!bar) return;
    bar.classList.add('flash-miss');
    window.setTimeout(() => bar.classList.remove('flash-miss'), 320);
  }

  /** A fresh practice dive on the same day. The daily dive stays at variant 0. */
  private newDive(): void {
    const variant = this.state.variant + 1;
    this.state = loadDive(this.day, variant) ?? createDive(this.day, variant);
    this.board = boardFor(this.state);
    this.render();
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
    toast(`${this.board.label} — back to the surface`);
  }
}

export function start(now: Date = new Date()): App {
  return new App(puzzleNumberFor(now));
}
