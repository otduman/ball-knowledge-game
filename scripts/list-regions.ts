import { REGIONS, COUNTRY_REGION } from '../src/data/regions';
import { ATHLETES } from '../src/data/rosters';

for (const r of REGIONS) {
  const countries = [...COUNTRY_REGION.entries()].filter(([,v])=>v===r.id).map(([k])=>k).sort();
  const used = countries.filter(c => ATHLETES.some(a=>a.country===c));
  const n = ATHLETES.filter(a=>a.region===r.id).length;
  console.log(`\n${r.label.toUpperCase()}  — ${n} athletes, ${used.length} countries in roster (${countries.length} mapped)`);
  console.log('  in roster : ' + used.join(', '));
  const unused = countries.filter(c => !used.includes(c));
  if (unused.length) console.log('  mapped, no athletes yet: ' + unused.join(', '));
}
console.log(`\nTOTAL: ${REGIONS.length} regions, ${COUNTRY_REGION.size} countries mapped, ${new Set(ATHLETES.map(a=>a.country)).size} countries used`);
