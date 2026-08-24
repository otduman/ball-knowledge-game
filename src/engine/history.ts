import type { Board } from './grid';
import type { DiveState } from './dive';
import { rowsCleared, totalScore, totalSolved } from './dive';
import { PREFIX, storage } from './storage';

/** One finished daily board. Practice boards are not recorded. */
export interface HistoryEntry {
  day: number;
  /** Rows filled top to bottom before the guesses ran out. */
  cleared: number;
  score: number;
  solved: number;
}

export interface Streaks {
  /** Consecutive days up to today, or up to yesterday if today is unplayed. */
  current: number;
  best: number;
  played: number;
}

const KEY = `${PREFIX}:history`;

/** Roughly a year of boards. Old entries only matter to `best`, which is kept. */
const KEEP = 400;

function isEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.day === 'number' &&
    Number.isInteger(e.day) &&
    e.day > 0 &&
    typeof e.cleared === 'number' &&
    typeof e.score === 'number' &&
    typeof e.solved === 'number'
  );
}

export function loadHistory(): HistoryEntry[] {
  const store = storage();
  if (!store) return [];

  try {
    const parsed = JSON.parse(store.getItem(KEY) ?? '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).sort((a, b) => a.day - b.day);
  } catch {
    return [];
  }
}

function writeHistory(entries: HistoryEntry[]): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(KEY, JSON.stringify(entries.slice(-KEEP)));
  } catch {
    // A full quota should never cost the player their board.
  }
}

/**
 * Upserts a day's result. Idempotent by day, so a reload of an already finished
 * board rewrites the same entry rather than counting the day twice.
 */
export function recordDaily(entry: HistoryEntry): HistoryEntry[] {
  const entries = loadHistory().filter((e) => e.day !== entry.day);
  entries.push(entry);
  entries.sort((a, b) => a.day - b.day);
  writeHistory(entries);
  return entries;
}

/** Records the day's board if it is over and is the daily, not a practice run. */
export function recordIfFinished(board: Board, state: DiveState): HistoryEntry[] {
  if (state.variant !== 0 || state.status !== 'ended') return loadHistory();
  return recordDaily({
    day: state.day,
    cleared: rowsCleared(state, board),
    score: totalScore(state),
    solved: totalSolved(state),
  });
}

/**
 * A streak survives the day it has not been played yet — it only breaks once a
 * full day has gone by unplayed. Counting back from yesterday when today is
 * missing is what makes the number stable all morning instead of reading zero
 * until the player opens the board.
 */
export function streaksFor(entries: readonly HistoryEntry[], today: number): Streaks {
  const days = new Set(entries.map((e) => e.day));

  let current = 0;
  let cursor = days.has(today) ? today : today - 1;
  while (days.has(cursor)) {
    current++;
    cursor--;
  }

  let best = 0;
  let run = 0;
  let previous: number | null = null;
  for (const day of [...days].sort((a, b) => a - b)) {
    run = previous !== null && day === previous + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }

  return { current, best, played: days.size };
}

/**
 * The last `count` days ending at today, including days that were never played
 * so a gap reads as a gap rather than closing up.
 */
export function recentFor(
  entries: readonly HistoryEntry[],
  today: number,
  count: number,
): Array<{ day: number; entry: HistoryEntry | undefined }> {
  const byDay = new Map(entries.map((e) => [e.day, e]));
  const out: Array<{ day: number; entry: HistoryEntry | undefined }> = [];
  for (let day = today - count + 1; day <= today; day++) {
    if (day > 0) out.push({ day, entry: byDay.get(day) });
  }
  return out;
}

export function clearHistory(): void {
  storage()?.removeItem(KEY);
}
