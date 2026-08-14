/** Inventory, difficulty spread and reachability for the current category set. */
import {
  ROW_CATEGORIES, COL_CATEGORIES, REGION_CATEGORIES,
  COUNTRY_CATEGORIES, ERA_CATEGORIES, LETTER_CATEGORIES, REACH_CATEGORIES,
} from '../src/engine/categories';
import { poolFor } from '../src/engine/pools';
import { feasibleGrids, DEFAULT_CONSTRAINTS } from '../src/engine/grid';
import { ATHLETES } from '../src/data/rosters';

console.log('=== INVENTORY ===');
console.log(`rows: ${ROW_CATEGORIES.length} (region ${REGION_CATEGORIES.length}, country ${COUNTRY_CATEGORIES.length}, era ${ERA_CATEGORIES.length}, reach ${REACH_CATEGORIES.length}, letter ${LETTER_CATEGORIES.length})`);
console.log('  region :', REGION_CATEGORIES.map(c=>c.label).join(' | '));
console.log('  country:', COUNTRY_CATEGORIES.map(c=>c.label).join(' | '));
console.log('  era    :', ERA_CATEGORIES.map(c=>c.label).join(' | '));
console.log('  reach  :', REACH_CATEGORIES.map(c=>c.label).join(' | '));
console.log('  letter :', LETTER_CATEGORIES.map(c=>c.label.replace('Surname ','')).join(' '));
console.log(`cols: ${COL_CATEGORIES.length} -`, COL_CATEGORIES.map(c=>c.label).join(' | '));

const grids = feasibleGrids(DEFAULT_CONSTRAINTS);
const sizes: number[] = [];
const seen = new Set<string>();
for (const g of grids) for (const r of g.rows) for (const c of g.cols) {
  const k = r.id+'|'+c.id;
  if (!seen.has(k)) { seen.add(k); sizes.push(poolFor(r,c).length); }
}
sizes.sort((a,b)=>a-b);
const q=(p:number)=>sizes[Math.floor(sizes.length*p)];
console.log('\n=== DIFFICULTY ===');
console.log(`feasible grids: ${grids.length}`);
console.log(`distinct cells: ${sizes.length}  min ${sizes[0]}  p25 ${q(.25)}  median ${q(.5)}  p75 ${q(.75)}  max ${sizes[sizes.length-1]}`);
let withWide=0;
for (const g of grids) {
  const s = g.rows.flatMap(r=>g.cols.map(c=>poolFor(r,c).length));
  if (s.filter(n=>n>=DEFAULT_CONSTRAINTS.widePool).length > 0) withWide++;
}
console.log(`grids containing a wide (${DEFAULT_CONSTRAINTS.widePool}+) cell: ${withWide}/${grids.length} (${Math.round(100*withWide/grids.length)}%)`);

const reachable = new Set<string>();
for (const k of seen) {
  const [rid,cid] = k.split('|');
  const r = ROW_CATEGORIES.find(x=>x.id===rid)!, c = COL_CATEGORIES.find(x=>x.id===cid)!;
  for (const a of poolFor(r,c)) reachable.add(a.id);
}
console.log(`\nathletes usable as an answer: ${reachable.size}/${ATHLETES.length}`);
