/**
 * Merges proposed roster batches into the roster files.
 *
 *   npx vite-node scripts/merge-roster.ts <batches.json> [--dry]
 *
 * The input is the JSON array produced by the roster expansion pass:
 *   [{ sport, slice, players: [{ name, country, pop, aliases }] }]
 *
 * Everything is checked before a single line is written, because a bad row
 * throws at module load and takes the whole game with it. Rejections are
 * reported rather than silently dropped: a name that collides with an existing
 * alias usually means the same player under a different spelling, and that is
 * worth seeing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { regionForCountry } from '../src/data/regions';
import { normalize, slugify } from '../src/util/text';

interface Proposed {
  name: string;
  country: string;
  pop: number;
  aliases?: string[];
}

interface Batch {
  sport: string;
  slice: string;
  players: Proposed[];
}

const ROSTER_PATH: Record<string, string> = {
  football: 'src/data/rosters/football.ts',
  nba: 'src/data/rosters/nba.ts',
  ufc: 'src/data/rosters/ufc.ts',
  f1: 'src/data/rosters/f1.ts',
  tennis: 'src/data/rosters/tennis.ts',
};

/** The roster table is the one template literal in the file. */
function tableBounds(source: string): { start: number; end: number } {
  const start = source.indexOf('`');
  const end = source.lastIndexOf('`');
  if (start < 0 || end <= start) throw new Error('no roster table found');
  return { start: start + 1, end };
}

interface Existing {
  /** slug -> display name, for duplicate detection. */
  bySlug: Map<string, string>;
  /** normalised name and every alias, so spelling variants collide too. */
  keys: Map<string, string>;
}

function readExisting(table: string): Existing {
  const bySlug = new Map<string, string>();
  const keys = new Map<string, string>();

  for (const raw of table.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('|').map((p) => p.trim());
    const name = parts[0] ?? '';
    if (!name) continue;

    bySlug.set(slugify(name), name);
    keys.set(normalize(name), name);
    for (const alias of (parts[3] ?? '').split(';').map((a) => a.trim()).filter(Boolean)) {
      keys.set(normalize(alias), name);
    }
  }
  return { bySlug, keys };
}

function toLine(player: Proposed): string {
  const aliases = (player.aliases ?? []).map((a) => a.trim()).filter(Boolean);
  const cells = [player.name.trim(), player.country.trim(), String(Math.round(player.pop))];
  if (aliases.length > 0) cells.push(aliases.join('; '));
  return cells.join('|');
}

function main(): void {
  const [inputArg, ...flags] = process.argv.slice(2);
  if (!inputArg) throw new Error('usage: merge-roster.ts <batches.json> [--dry]');
  const dry = flags.includes('--dry');

  const batches = JSON.parse(readFileSync(resolve(inputArg), 'utf8')) as Batch[];
  const bySport = new Map<string, Batch[]>();
  for (const batch of batches) {
    const list = bySport.get(batch.sport) ?? [];
    list.push(batch);
    bySport.set(batch.sport, list);
  }

  let added = 0;
  let rejected = 0;

  for (const [sport, sportBatches] of bySport) {
    const path = ROSTER_PATH[sport];
    if (!path) {
      console.log(`! unknown sport "${sport}", skipping`);
      continue;
    }

    const source = readFileSync(resolve(path), 'utf8');
    const { start, end } = tableBounds(source);
    const table = source.slice(start, end);
    const existing = readExisting(table);

    const accepted: Array<{ slice: string; line: string }> = [];

    for (const batch of sportBatches) {
      for (const player of batch.players ?? []) {
        const name = (player.name ?? '').trim();
        const label = `${sport}: ${name || '(unnamed)'}`;

        if (!name) {
          console.log(`  reject ${label} — missing name`);
          rejected++;
          continue;
        }
        if (name !== name.normalize('NFC')) {
          console.log(`  note   ${label} — normalising to NFC`);
        }

        const slug = slugify(name);
        const clash =
          existing.bySlug.get(slug) ??
          existing.keys.get(normalize(name)) ??
          (player.aliases ?? [])
            .map((a) => existing.keys.get(normalize(a)))
            .find((hit) => hit !== undefined);

        if (clash) {
          console.log(`  reject ${label} — already on the roster as "${clash}"`);
          rejected++;
          continue;
        }

        try {
          regionForCountry(player.country);
        } catch {
          console.log(`  reject ${label} — country "${player.country}" is not in the region table`);
          rejected++;
          continue;
        }

        const pop = Math.round(player.pop);
        if (!Number.isFinite(pop) || pop < 1 || pop > 99) {
          console.log(`  reject ${label} — pop ${player.pop} outside 1-99`);
          rejected++;
          continue;
        }

        // Claim the name now so two batches cannot both add the same player.
        existing.bySlug.set(slug, name);
        existing.keys.set(normalize(name), name);
        for (const alias of player.aliases ?? []) existing.keys.set(normalize(alias), name);

        accepted.push({ slice: batch.slice, line: toLine({ ...player, name: name.normalize('NFC'), pop }) });
        added++;
      }
    }

    if (accepted.length === 0) {
      console.log(`${sport}: nothing to add`);
      continue;
    }

    const bySlice = new Map<string, string[]>();
    for (const { slice, line } of accepted) {
      const list = bySlice.get(slice) ?? [];
      list.push(line);
      bySlice.set(slice, list);
    }

    const blocks: string[] = [];
    for (const [slice, lines] of bySlice) {
      blocks.push(`# ---- ${slice} ----`, ...lines.sort(), '');
    }

    const next = `${source.slice(0, end)}${blocks.join('\n')}\n${source.slice(end)}`;
    console.log(`${sport}: +${accepted.length} lines${dry ? ' (dry run, not written)' : ''}`);
    if (!dry) writeFileSync(resolve(path), next, 'utf8');
  }

  console.log(`\nadded ${added}, rejected ${rejected}`);
}

main();
