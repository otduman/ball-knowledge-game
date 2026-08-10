import { buildGrid } from '../src/engine/grid';
import { ROW_CATEGORIES, COL_CATEGORIES } from '../src/engine/categories';

const N = 200; // a season's worth of daily boards
const groupCount = new Map<string, number>();
const rowCount = new Map<string, number>();
const colCount = new Map<string, number>();
let boardsWithLetter = 0, boardsWith2Letters = 0, boardsWithFootball = 0, boardsWithRegion = 0;

for (let n = 1; n <= N; n++) {
  const g = buildGrid(n);
  const groups = g.rows.map(r => r.group);
  for (const r of g.rows) {
    rowCount.set(r.label, (rowCount.get(r.label) ?? 0) + 1);
    groupCount.set(r.group, (groupCount.get(r.group) ?? 0) + 1);
  }
  for (const c of g.cols) colCount.set(c.label, (colCount.get(c.label) ?? 0) + 1);
  const letters = groups.filter(x => x === 'letter').length;
  if (letters >= 1) boardsWithLetter++;
  if (letters >= 2) boardsWith2Letters++;
  if (groups.some(x => x === 'region')) boardsWithRegion++;
  if (g.cols.some(c => c.label === 'Football')) boardsWithFootball++;
}

console.log(`=== ROW GROUP MIX over ${N} daily boards (${N*3} row slots) ===`);
console.log('pool composition:', ROW_CATEGORIES.length, 'rows =',
  ['region','country','era','letter'].map(g=>`${g} ${ROW_CATEGORIES.filter(r=>r.group===g).length}`).join(', '));
for (const [g,c] of [...groupCount].sort((a,b)=>b[1]-a[1]))
  console.log(`  ${g.padEnd(8)} ${String(c).padStart(4)} slots (${Math.round(100*c/(N*3))}%)`);

console.log(`\nboards with >=1 letter row : ${boardsWithLetter}/${N} (${Math.round(100*boardsWithLetter/N)}%)`);
console.log(`boards with  2 letter rows : ${boardsWith2Letters}/${N} (${Math.round(100*boardsWith2Letters/N)}%)`);
console.log(`boards with a region row   : ${boardsWithRegion}/${N} (${Math.round(100*boardsWithRegion/N)}%)`);

console.log(`\n=== COLUMN MIX ===`);
for (const c of COL_CATEGORIES)
  console.log(`  ${c.label.padEnd(11)} ${String(colCount.get(c.label) ?? 0).padStart(4)}/${N} boards (${Math.round(100*(colCount.get(c.label)??0)/N)}%)`);

console.log(`\n=== most repeated rows ===`);
for (const [l,c] of [...rowCount].sort((a,b)=>b[1]-a[1]).slice(0,8)) console.log(`  ${l.padEnd(16)} ${c}x`);
console.log(`distinct rows seen: ${rowCount.size}/${ROW_CATEGORIES.length}`);
