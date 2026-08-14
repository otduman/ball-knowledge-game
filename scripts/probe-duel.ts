/**
 * Everything worth knowing about the Football x NBA duel: which rows survive
 * its difficulty budget, how deep its cells are against the daily board, how
 * evenly the row groups get airtime, and how long the sequence runs before a
 * board recurs.
 */
import { ROW_CATEGORIES, colsForSports, rowsForSports } from '../src/engine/categories';
import { buildGrid, feasibleGrids } from '../src/engine/grid';
import { MODES } from '../src/engine/modes';
import { poolFor } from '../src/engine/pools';

const DUEL = MODES.duel;
const cols = colsForSports(DUEL.sportIds);
const football = cols.find((c) => c.id === 'sport:football')!;
const nba = cols.find((c) => c.id === 'sport:nba')!;

console.log('== rows, by how free their easiest column is ==');
const rows = rowsForSports(DUEL.sportIds)
  .map((r) => ({ label: r.label, group: r.group, f: poolFor(r, football).length, n: poolFor(r, nba).length }))
  .map((r) => ({ ...r, worst: Math.max(r.f, r.n) }))
  .sort((a, b) => b.worst - a.worst);

for (const r of rows) {
  const verdict = r.worst >= DUEL.constraints.widePool ? 'excluded — too free' : '';
  console.log(`  ${r.label.padEnd(22)} ${r.group.padEnd(8)} football ${String(r.f).padStart(3)}  nba ${String(r.n).padStart(3)}  ${verdict}`);
}

const daily = new Set(ROW_CATEGORIES.map((r) => r.id));
const extra = rowsForSports(DUEL.sportIds).filter((r) => !daily.has(r.id));
console.log(`\nrows the daily three-column rule discards: ${extra.map((r) => r.label).join(', ')}`);

console.log('\n== catalogue ==');
for (const mode of [MODES.daily, DUEL]) {
  const cat = feasibleGrids(mode.constraints, mode);
  const sizes = cat.flatMap((e) => e.rows.flatMap((r) => e.cols.map((c) => poolFor(r, c).length))).sort((a, b) => a - b);
  const q = (p: number) => sizes[Math.floor(sizes.length * p)];
  console.log(`  ${mode.id.padEnd(6)} ${String(cat.length).padStart(6)} boards — cell answers p25 ${q(0.25)} median ${q(0.5)} p75 ${q(0.75)} max ${sizes[sizes.length - 1]}`);
}

console.log('\n== airtime over 200 boards ==');
for (const mode of [MODES.daily, DUEL]) {
  const slots = new Map<string, number>();
  let total = 0;
  for (let i = 1; i <= 200; i++) {
    for (const r of buildGrid(i, 0, mode.id).rows) {
      slots.set(r.group, (slots.get(r.group) ?? 0) + 1);
      total++;
    }
  }
  console.log(`  ${mode.id.padEnd(6)}`, [...slots.entries()].sort((a, b) => b[1] - a[1])
    .map(([g, c]) => `${g} ${Math.round((c / total) * 100)}%`).join(' · '));
}

console.log('\n== boards before a repeat ==');
for (const mode of [MODES.daily, DUEL]) {
  for (const [label, gen] of [
    ['daily track', (i: number) => buildGrid(i, 0, mode.id)],
    ['practice   ', (i: number) => buildGrid(1, i, mode.id)],
  ] as const) {
    const seen = new Set<string>();
    let first = -1;
    for (let i = 1; i <= 3000; i++) {
      const key = [...gen(i).rows, ...gen(i).cols].map((c) => c.id).sort().join('|');
      if (seen.has(key) && first < 0) first = i;
      seen.add(key);
    }
    console.log(`  ${mode.id.padEnd(6)} ${label}: first repeat at ${first < 0 ? '>3000' : first}`);
  }
}

console.log('\n== the next five duels ==');
for (let i = 1; i <= 5; i++) {
  const g = buildGrid(i, 0, 'duel');
  const cells = g.rows.flatMap((r) => g.cols.map((c) => poolFor(r, c).length));
  console.log(`  ${g.label}  [${g.cols.map((c) => c.label).join(' | ')}]  ${g.rows.map((r) => r.label).join(' / ')}  — cells ${cells.join(',')}`);
}
