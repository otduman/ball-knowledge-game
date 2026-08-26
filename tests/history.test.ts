// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import type { HistoryEntry } from '../src/engine/history';
import {
  clearHistory,
  loadHistory,
  recentFor,
  recordDaily,
  recordIfFinished,
  streaksFor,
} from '../src/engine/history';
import { buildBoard } from '../src/engine/grid';
import { createDive } from '../src/engine/dive';

function entry(day: number, cleared = 3): HistoryEntry {
  return { day, cleared, score: cleared * 40, solved: cleared * 2 };
}

function historyOf(...days: number[]): HistoryEntry[] {
  return days.map((d) => entry(d));
}

describe('streaks', () => {
  it('counts consecutive days up to today', () => {
    expect(streaksFor(historyOf(8, 9, 10), 10).current).toBe(3);
  });

  it('survives a day that has not been played yet', () => {
    // Opening the board at 8am should not read zero just because today's
    // board is unfinished. The streak breaks on a missed day, not a pending one.
    expect(streaksFor(historyOf(8, 9, 10), 11).current).toBe(3);
  });

  it('breaks once a full day has gone by unplayed', () => {
    expect(streaksFor(historyOf(8, 9, 10), 12).current).toBe(0);
  });

  it('counts only the run ending now, not the longest one', () => {
    const { current, best } = streaksFor(historyOf(1, 2, 3, 4, 5, 9, 10), 10);
    expect(current).toBe(2);
    expect(best).toBe(5);
  });

  it('reports the best run and the total played', () => {
    const { best, played } = streaksFor(historyOf(1, 2, 4, 5, 6, 20), 20);
    expect(best).toBe(3);
    expect(played).toBe(6);
  });

  it('handles an empty history', () => {
    expect(streaksFor([], 10)).toEqual({ current: 0, best: 0, played: 0 });
  });
});

describe('the recent strip', () => {
  it('keeps unplayed days as gaps rather than closing up', () => {
    const days = recentFor(historyOf(8, 10), 10, 4);
    expect(days.map((d) => d.day)).toEqual([7, 8, 9, 10]);
    expect(days.map((d) => Boolean(d.entry))).toEqual([false, true, false, true]);
  });

  it('never runs off the front of the calendar', () => {
    expect(recentFor(historyOf(1, 2), 2, 10).map((d) => d.day)).toEqual([1, 2]);
  });
});

describe('recording', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearHistory();
  });

  it('upserts by day so a reload does not double-count', () => {
    recordDaily(entry(5, 2));
    recordDaily(entry(5, 4));

    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.cleared).toBe(4);
  });

  it('keeps entries in day order', () => {
    recordDaily(entry(9));
    recordDaily(entry(3));
    recordDaily(entry(6));
    expect(loadHistory().map((e) => e.day)).toEqual([3, 6, 9]);
  });

  it('ignores an unfinished board', () => {
    const board = buildBoard(1);
    recordIfFinished(board, createDive(1, 0));
    expect(loadHistory()).toHaveLength(0);
  });

  it('ignores practice boards, which are unlimited', () => {
    const board = buildBoard(1, 2);
    const practice = { ...createDive(1, 2), status: 'ended' as const };
    recordIfFinished(board, practice);
    expect(loadHistory()).toHaveLength(0);
  });

  it('records a finished daily board', () => {
    const board = buildBoard(1);
    recordIfFinished(board, { ...createDive(1, 0), status: 'ended' });
    expect(loadHistory().map((e) => e.day)).toEqual([1]);
  });

  it('discards corrupt entries instead of throwing', () => {
    window.localStorage.setItem('bk:v5:history', '[{"day":"x"},{"day":4,"cleared":1,"score":9,"solved":2}]');
    expect(loadHistory().map((e) => e.day)).toEqual([4]);
  });

  it('survives malformed json', () => {
    window.localStorage.setItem('bk:v5:history', '{not json');
    expect(loadHistory()).toEqual([]);
  });
});
