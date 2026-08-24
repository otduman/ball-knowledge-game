import type { Category } from '../engine/categories';
import { byId, trapFocus } from './dom';

const GROUP_LABEL: Record<Category['group'], string> = {
  region: 'Region — any of these countries counts',
  country: 'Country',
  sport: 'Sport',
  era: 'Year of birth',
  letter: 'Family name',
  reach: 'How widely they are known',
  origin: 'Where they come from',
  name: 'Their name',
  build: 'How tall they stand',
  blend: 'Two things at once — both must be true',
};

/**
 * Explains a heading. Regions are the reason this exists: "Southern Europe"
 * silently means Spain and Portugal too, and a player has no way to know that
 * before spending a guess on it.
 */
export class InfoSheet {
  private readonly scrim = byId<HTMLDivElement>('scrim');
  private readonly sheet = byId<HTMLDivElement>('info');
  private readonly title = byId<HTMLHeadingElement>('info-title');
  private readonly kind = byId<HTMLParagraphElement>('info-kind');
  private readonly body = byId<HTMLParagraphElement>('info-body');
  private readonly closeButton = byId<HTMLButtonElement>('info-close');

  private release: (() => void) | null = null;
  private returnFocusTo: HTMLElement | null = null;

  constructor() {
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

  open(category: Category): void {
    this.returnFocusTo = document.activeElement as HTMLElement | null;

    this.title.textContent = category.label;
    this.kind.textContent = GROUP_LABEL[category.group];
    this.body.textContent = category.hint;

    this.scrim.hidden = false;
    this.sheet.hidden = false;
    this.release = trapFocus(this.sheet);
    this.closeButton.focus();
  }

  close(): void {
    if (!this.isOpen) return;
    this.sheet.hidden = true;
    this.scrim.hidden = true;
    this.release?.();
    this.release = null;
    this.returnFocusTo?.focus?.();
    this.returnFocusTo = null;
  }
}
