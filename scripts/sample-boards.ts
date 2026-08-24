/** Prints a handful of boards so the new row families can be read as a player would meet them. */
import { colsForSports } from '../src/engine/categories';
import { buildBoard } from '../src/engine/grid';
import { COLUMN_SPORTS } from '../src/engine/levels';
import { poolFor } from '../src/engine/pools';

const cols = colsForSports(COLUMN_SPORTS);

for (const day of [1, 7, 42, 100, 236, 301]) {
  const board = buildBoard(day);
  console.log(`\n== ${board.label} ==`);
  board.rows.forEach((row, i) => {
    const sizes = cols.map((c) => String(poolFor(row, c).length).padStart(3)).join(' ');
    console.log(`  ${String(i + 1)}  ${row.label.padEnd(30)} ${sizes}   [${row.group}]`);
  });
}
