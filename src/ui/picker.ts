import { sportById } from '../data/sports';
import type { Athlete } from '../data/types';
import { MIN_QUERY_LENGTH, searchAthletes } from '../engine/search';
import { byId, clear, el, trapFocus } from './dom';

export interface PickerRequest {
  rowLabel: string;
  colLabel: string;
  /** What each heading accepts, shown inline so a guess is never a gamble on wording. */
  rowHint: string;
  colHint: string;
  exclude: ReadonlySet<string>;
  onPick(athlete: Athlete): void;
}

const RESULT_LIMIT = 8;

export class Picker {
  private readonly scrim = byId<HTMLDivElement>('scrim');
  private readonly sheet = byId<HTMLDivElement>('sheet');
  private readonly prompt = byId<HTMLDivElement>('prompt');
  private readonly input = byId<HTMLInputElement>('search');
  private readonly list = byId<HTMLUListElement>('sugg');
  private readonly closeButton = byId<HTMLButtonElement>('sheet-close');
  private readonly qualify = el('p', { className: 'qualify' });

  private request: PickerRequest | null = null;
  private results: Athlete[] = [];
  private activeIndex = -1;
  private releaseFocusTrap: (() => void) | null = null;
  private returnFocusTo: HTMLElement | null = null;

  constructor() {
    this.input.addEventListener('input', () => this.refresh());
    this.input.addEventListener('keydown', (event) => this.onInputKeydown(event));
    this.scrim.addEventListener('click', () => this.close());
    this.closeButton.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) {
        event.preventDefault();
        this.close();
      }
    });
  }

  get isOpen(): boolean {
    return !this.sheet.hidden;
  }

  open(request: PickerRequest): void {
    this.request = request;
    this.returnFocusTo = document.activeElement as HTMLElement | null;

    clear(this.prompt);
    this.prompt.append(
      el('b', { text: request.rowLabel }),
      ' × ',
      el('b', { text: request.colLabel }),
    );

    clear(this.qualify);
    this.qualify.append(
      el('b', { text: `${request.rowLabel}: ` }),
      request.rowHint,
      el('br'),
      el('b', { text: `${request.colLabel}: ` }),
      request.colHint,
    );
    this.prompt.insertAdjacentElement('afterend', this.qualify);

    this.input.value = '';
    this.setResults([]);

    this.scrim.hidden = false;
    this.sheet.hidden = false;
    this.releaseFocusTrap = trapFocus(this.sheet);

    // iOS needs the focus call after the sheet is laid out or the keyboard
    // opens over a stale position.
    window.setTimeout(() => this.input.focus(), 40);
  }

  close(): void {
    if (!this.isOpen) return;
    this.request = null;
    this.sheet.hidden = true;
    this.scrim.hidden = true;
    this.setResults([]);
    this.releaseFocusTrap?.();
    this.releaseFocusTrap = null;
    this.returnFocusTo?.focus?.();
    this.returnFocusTo = null;
  }

  private refresh(): void {
    if (!this.request) return;
    this.setResults(
      searchAthletes(this.input.value, {
        exclude: this.request.exclude,
        limit: RESULT_LIMIT,
      }),
    );
  }

  private setResults(results: Athlete[]): void {
    this.results = results;
    this.activeIndex = results.length > 0 ? 0 : -1;
    this.input.setAttribute('aria-expanded', results.length > 0 ? 'true' : 'false');

    clear(this.list);
    results.forEach((athlete, index) => {
      const option = el('button', {
        attrs: {
          type: 'button',
          role: 'option',
          id: `sugg-opt-${index}`,
          'aria-selected': index === this.activeIndex ? 'true' : 'false',
        },
      });
      option.append(
        el('span', { text: athlete.name }),
        el('span', { className: 'tag', text: sportById(athlete.sport).label }),
      );
      option.addEventListener('click', () => this.pick(index));

      const item = el('li');
      item.append(option);
      this.list.append(item);
    });

    this.syncActiveDescendant();
  }

  private syncActiveDescendant(): void {
    const options = Array.from(this.list.querySelectorAll<HTMLButtonElement>('[role="option"]'));
    options.forEach((option, index) => {
      option.setAttribute('aria-selected', index === this.activeIndex ? 'true' : 'false');
    });

    if (this.activeIndex >= 0) {
      this.input.setAttribute('aria-activedescendant', `sugg-opt-${this.activeIndex}`);
      options[this.activeIndex]?.scrollIntoView?.({ block: 'nearest' });
    } else {
      this.input.removeAttribute('aria-activedescendant');
    }
  }

  private move(delta: number): void {
    if (this.results.length === 0) return;
    const count = this.results.length;
    this.activeIndex = (this.activeIndex + delta + count) % count;
    this.syncActiveDescendant();
  }

  private onInputKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activeIndex >= 0) this.pick(this.activeIndex);
        break;
      default:
        break;
    }
  }

  private pick(index: number): void {
    const athlete = this.results[index];
    const request = this.request;
    if (!athlete || !request) return;
    // Close first so the board re-render lands on a settled DOM.
    this.close();
    request.onPick(athlete);
  }
}

export { MIN_QUERY_LENGTH };
