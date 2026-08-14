/**
 * The dive, measured. Reports per depth: how many boards exist, how deep the
 * cells are, which row groups get airtime, and — the failure this exists to
 * catch — whether any single row is pinned to every board because its group is
 * the only one left with a survivor in that pool window.
 */
import { rowsForSports } from '../src/engine/categories';
import { buildBoard, catalogSizes, feasibleBoards } from '../src/engine/grid';
import { COLUMN_SPORTS, LEVELS, cellsAt, guessesAt } from '../src/engine/levels';
import { poolFor } from '../src/engine/pools';

const SAMPLE = 200;

console.log('== the dive ==');
const sizes = catalogSizes();
for (const level of LEVELS) {
  const boards = sizes.find((s) => s.depth === level.depth)?.boards ?? 0;
  const cat = feasibleBoards(level);

  const sizesAt: number[] = [];
  for (const e of cat) for (const r of e.rows) for (const c of e.cols) sizesAt.push(poolFor(r, c).length);
  sizesAt.sort((a, b) => a - b);
  const median = sizesAt[Math.floor(sizesAt.length / 2)] ?? 0;

  // A row on every board is a thin catalogue wearing a costume.
  const rowCounts = new Map<string, number>();
  for (const e of cat) for (const r of e.rows) rowCounts.set(r.label, (rowCounts.get(r.label) ?? 0) + 1);
  const forced = [...rowCounts.entries()].filter(([, n]) => n === cat.length).map(([l]) => l);

  const usable = rowsForSports(COLUMN_SPORTS).filter((r) =>
    [...colsOf()].every((c) => {
      const n = poolFor(r, c).length;
      return n >= level.minPool && n <= level.maxPool;
    }),
  );
  const groups = new Map<string, number>();
  for (const r of usable) groups.set(r.group, (groups.get(r.group) ?? 0) + 1);

  console.log(
    `\nL${level.depth} ${level.name.padEnd(12)} ${level.rowCount} rows / ${cellsAt(level.depth)} cells / ${guessesAt(level.depth)} guesses`,
  );
  console.log(`   window ${level.minPool}-${level.maxPool}   boards ${boards}   median cell ${median}`);
  console.log(`   rows in window: ${usable.length} across ${groups.size} groups — ${[...groups.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ${n}`).join(' · ')}`);
  if (forced.length > 0) console.log(`   !! ON EVERY BOARD: ${forced.join(', ')}`);
  if (boards < 150) console.log('   !! too thin to survive repeat play');

  const slots = new Map<string, number>();
  let n = 0;
  for (let i = 1; i <= SAMPLE; i++) {
    for (const r of buildBoard(i, level.depth).rows) {
      slots.set(r.group, (slots.get(r.group) ?? 0) + 1);
      n++;
    }
  }
  console.log(`   airtime: ${[...slots.entries()].sort((a, b) => b[1] - a[1]).map(([g, c]) => `${g} ${Math.round((c / n) * 100)}%`).join(' · ')}`);
}

function colsOf() {
  return buildBoard(1, 1).cols;
}

console.log('\n== a full dive on day 1 ==');
for (const level of LEVELS) {
  const b = buildBoard(1, level.depth);
  const cells = b.rows.flatMap((r) => b.cols.map((c) => poolFor(r, c).length));
  console.log(`  L${b.depth} ${level.name.padEnd(12)} ${b.rows.map((r) => r.label).join(' / ')}  — cells ${cells.join(',')}`);
}

console.log('\n== repeat horizon per depth ==');
for (const level of LEVELS) {
  const seen = new Set<string>();
  let first = -1;
  for (let i = 1; i <= 1500; i++) {
    const key = buildBoard(i, level.depth).rows.map((r) => r.id).sort().join('|');
    if (seen.has(key) && first < 0) first = i;
    seen.add(key);
  }
  console.log(`  L${level.depth} ${level.name.padEnd(12)} first repeat at ${first < 0 ? '>1500' : first} days`);
}
