import { ATHLETES } from '../data/rosters';
import type { Athlete } from '../data/types';
import { normalize, tokens } from '../util/text';

interface IndexEntry {
  athlete: Athlete;
  /** Normalised full name plus aliases, for substring matching. */
  haystacks: string[];
  /** Individual words across name and aliases, for prefix matching. */
  words: string[];
}

const INDEX: readonly IndexEntry[] = ATHLETES.map((athlete) => {
  const forms = [athlete.name, ...athlete.aliases];
  return {
    athlete,
    haystacks: forms.map(normalize),
    words: forms.flatMap(tokens),
  };
}).sort((a, b) => a.athlete.name.localeCompare(b.athlete.name));

/**
 * Four rather than two. At two characters the picker was answering the board
 * for you: "ha" listed Haaland, Halland and Harden, so a cell you could not
 * name was solvable by typing the first two letters of a guess and reading the
 * options. Four means you have to arrive with a name in mind, and the list
 * confirms the spelling rather than supplying the answer.
 */
export const MIN_QUERY_LENGTH = 4;

export interface SearchOptions {
  /** Athlete ids already placed on the board; they never appear again. */
  exclude?: ReadonlySet<string>;
  limit?: number;
}

/**
 * Ranks by how directly the query hit the name, then by fame. Matching a word
 * from the start ("hala" -> Haaland) beats a mid-word hit ("aala"), which keeps
 * the list useful after two or three keystrokes.
 */
function scoreMatch(entry: IndexEntry, query: string): number {
  let best = -1;

  for (const haystack of entry.haystacks) {
    if (haystack === query) best = Math.max(best, 100);
    else if (haystack.startsWith(query)) best = Math.max(best, 80);
    else if (haystack.includes(query)) best = Math.max(best, 40);
  }

  for (const word of entry.words) {
    if (word === query) best = Math.max(best, 90);
    else if (word.startsWith(query)) best = Math.max(best, 70);
  }

  return best;
}

export function searchAthletes(
  rawQuery: string,
  options: SearchOptions = {},
): Athlete[] {
  const query = normalize(rawQuery);
  if (query.length < MIN_QUERY_LENGTH) return [];

  const exclude = options.exclude ?? new Set<string>();
  const limit = options.limit ?? 8;

  const hits: Array<{ athlete: Athlete; rank: number }> = [];
  for (const entry of INDEX) {
    if (exclude.has(entry.athlete.id)) continue;
    const rank = scoreMatch(entry, query);
    if (rank > 0) hits.push({ athlete: entry.athlete, rank });
  }

  hits.sort(
    (a, b) =>
      b.rank - a.rank ||
      b.athlete.pop - a.athlete.pop ||
      a.athlete.name.localeCompare(b.athlete.name),
  );

  return hits.slice(0, limit).map((h) => h.athlete);
}
