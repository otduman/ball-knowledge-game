/**
 * The board, measured. One row per level, each window tighter than the last:
 * how many rows each window can field, how deep their cells are, which kinds of
 * question survive at each depth, and how long the daily sequence runs before a
 * row recurs in the same slot.
 */
import { buildBoard, rowFloor, rowsForLevel } from '../src/engine/grid';
import { COLUMN_SPORTS, LEVELS, MAX_DEPTH, STARTING_GUESSES, TOTAL_CELLS } from '../src/engine/levels';
import { colsForSports } from '../src/engine/categories';
import { poolFor } from '../src/engine/pools';

const cols = colsForSports(COLUMN_SPORTS);
console.log(`${MAX_DEPTH} rows, ${TOTAL_CELLS} cells, ${STARTING_GUESSES} guesses\n`);

console.log('== the windows ==');
for (const level of LEVELS) {
  const rows = rowsForLevel(level);
  const groups = new Map<string, number>();
  for (const r of rows) groups.set(r.group, (groups.get(r.group) ?? 0) + 1);

  const floors = rows.map((r) => rowFloor(r, cols)).sort((a, b) => a - b);
  const median = floors[Math.floor(floors.length / 2)] ?? 0;

  console.log(
    `  row ${level.depth}  window ${String(level.minPool).padStart(3)}-${String(level.maxPool).padEnd(3)}  ` +
      `${String(rows.length).padStart(3)} rows  tightest cell median ${median}  ` +
      `${[...groups.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ${n}`).join(' · ')}`,
  );
  if (rows.length < 8) console.log('     !! too few rows to stay fresh');
}

console.log('\n== airtime over 200 boards, per row slot ==');
for (const level of LEVELS) {
  const seen = new Map<string, number>();
  const groups = new Map<string, number>();
  for (let day = 1; day <= 200; day++) {
    const row = buildBoard(day).rows[level.depth - 1]!;
    seen.set(row.label, (seen.get(row.label) ?? 0) + 1);
    groups.set(row.group, (groups.get(row.group) ?? 0) + 1);
  }
  const top = [...seen.entries()].sort((a, b) => b[1] - a[1])[0]!;
  console.log(
    `  row ${level.depth}  ${seen.size} distinct rows  most frequent "${top[0]}" ${Math.round((top[1] / 200) * 100)}%  ` +
      `groups: ${[...groups.entries()].sort((a, b) => b[1] - a[1]).map(([g, c]) => `${g} ${Math.round((c / 200) * 100)}%`).join(' · ')}`,
  );
}

console.log('\n== the next three boards ==');
for (let day = 1; day <= 3; day++) {
  const board = buildBoard(day);
  console.log(`  ${board.label}`);
  for (let d = 1; d <= MAX_DEPTH; d++) {
    const row = board.rows[d - 1]!;
    const sizes = board.cols.map((c) => poolFor(row, c).length);
    console.log(`    ${d}  ${row.label.padEnd(24)} ${sizes.join(' / ')}`);
  }
}

console.log('\n== whole-board repeat horizon ==');
const seen = new Set<string>();
let first = -1;
for (let day = 1; day <= 2000; day++) {
  const key = buildBoard(day).rows.map((r) => r.id).join('|');
  if (seen.has(key) && first < 0) first = day;
  seen.add(key);
}
console.log(`  ${seen.size} distinct boards in 2000 days, first repeat at ${first < 0 ? '>2000' : first}`);
