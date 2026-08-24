/**
 * Inventory of every row the board can use, by group: how many exist, how deep
 * they are in each column, which of the six row windows they qualify for, and
 * how much airtime each group actually gets.
 */
import { colsForSports, rowsForSports } from '../src/engine/categories';
import { buildBoard, rowFloor, rowsForLevel } from '../src/engine/grid';
import { COLUMN_SPORTS, LEVELS, MAX_DEPTH } from '../src/engine/levels';
import { poolFor } from '../src/engine/pools';

const cols = colsForSports(COLUMN_SPORTS);
const football = cols.find((c) => c.id === 'sport:football')!;
const nba = cols.find((c) => c.id === 'sport:nba')!;
const rows = rowsForSports(COLUMN_SPORTS);

/** Which of the six row windows a row is eligible for. */
function windowsFor(row: (typeof rows)[number]): number[] {
  return LEVELS.filter((level) => rowsForLevel(level).some((r) => r.id === row.id)).map(
    (l) => l.depth,
  );
}

const GROUP_LABEL: Record<string, string> = {
  region: 'Region',
  country: 'Country',
  era: 'Born (decade / year / pair / tournament)',
  letter: 'Letters (starts, given, ends, contains)',
  reach: 'Wikipedia reach',
  origin: 'Origin story',
  name: 'Name shape',
  build: 'Height',
  blend: 'Blend (two conditions at once)',
};

const byGroup = new Map<string, typeof rows>();
for (const row of rows) {
  byGroup.set(row.group, [...(byGroup.get(row.group) ?? []), row]);
}

console.log(`${rows.length} usable rows across ${byGroup.size} groups`);
console.log('(usable = at least 6 answers in BOTH football and the NBA)\n');

// Airtime, so "how many exist" can be read next to "how often you see one".
const slots = new Map<string, number>();
let total = 0;
for (let day = 1; day <= 500; day++) {
  for (const row of buildBoard(day).rows) {
    slots.set(row.group, (slots.get(row.group) ?? 0) + 1);
    total++;
  }
}

console.log('group                                          rows   share of slots');
for (const [group, list] of [...byGroup.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const share = Math.round(((slots.get(group) ?? 0) / total) * 100);
  console.log(
    `  ${(GROUP_LABEL[group] ?? group).padEnd(44)} ${String(list.length).padStart(3)}   ${String(share).padStart(3)}%`,
  );
}

console.log('\n\n== every row, by group ==');
for (const [group, list] of [...byGroup.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n-- ${GROUP_LABEL[group] ?? group} (${list.length}) --`);
  const scored = list
    .map((row) => ({
      label: row.label,
      f: poolFor(row, football).length,
      n: poolFor(row, nba).length,
      floor: rowFloor(row, cols),
      windows: windowsFor(row),
    }))
    .sort((a, b) => b.floor - a.floor);

  for (const r of scored) {
    const w = r.windows.length ? r.windows.join(',') : '-';
    console.log(
      `   ${r.label.padEnd(26)} football ${String(r.f).padStart(3)}  nba ${String(r.n).padStart(3)}   rows ${w}`,
    );
  }
}

console.log('\n\n== how many rows each window can draw from ==');
for (const level of LEVELS) {
  const list = rowsForLevel(level);
  const groups = new Map<string, number>();
  for (const r of list) groups.set(r.group, (groups.get(r.group) ?? 0) + 1);
  console.log(
    `  row ${level.depth}  window ${String(level.minPool).padStart(3)}-${String(level.maxPool).padEnd(3)}  ${String(list.length).padStart(3)} rows   ` +
      [...groups.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ${n}`).join(' · '),
  );
}

console.log('\n\n== rows never used, and rows leaned on ==');
const used = new Map<string, number>();
for (let day = 1; day <= 500; day++) {
  for (const row of buildBoard(day).rows) used.set(row.label, (used.get(row.label) ?? 0) + 1);
}
const never = rows.filter((r) => !used.has(r.label));
console.log(`  never appear in 500 days: ${never.length}${never.length ? ` — ${never.map((r) => r.label).join(', ')}` : ''}`);
const top = [...used.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
console.log(`  most frequent: ${top.map(([l, n]) => `${l} ${Math.round((n / 500) * 100)}%`).join(' · ')}`);
console.log(`  distinct rows used across ${MAX_DEPTH * 500} slots: ${used.size} of ${rows.length}`);
