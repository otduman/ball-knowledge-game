import { buildGrid } from '../src/engine/grid';
import { poolFor } from '../src/engine/pools';
for (const n of [1,2,3,4,5]) {
  const g = buildGrid(n);
  console.log(`\n${g.label}`);
  console.log('              ' + g.cols.map(c=>c.label.padStart(11)).join(''));
  for (const r of g.rows) {
    console.log(r.label.padEnd(14) + g.cols.map(c=>String(poolFor(r,c).length).padStart(11)).join(''));
  }
  console.log('  hint(row1): ' + g.rows[0]!.hint.slice(0,90));
}
