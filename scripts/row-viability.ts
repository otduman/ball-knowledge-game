import { ROW_CATEGORIES, COL_CATEGORIES } from '../src/engine/categories';
import { poolFor } from '../src/engine/pools';
const MIN = 6;
console.log('row'.padEnd(20), COL_CATEGORIES.map(c=>c.label.padStart(10)).join(''), '  usable-cols');
for (const r of ROW_CATEGORIES) {
  const sizes = COL_CATEGORIES.map(c => poolFor(r, c).length);
  const ok = sizes.filter(n => n >= MIN).length;
  console.log(r.label.padEnd(20), sizes.map(n=>String(n).padStart(10)).join(''), `  ${ok}/${COL_CATEGORIES.length}`);
}
