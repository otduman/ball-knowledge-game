/**
 * What would finer-grained rows cost us? Compares region rows (today) against
 * country rows (needed if headings become flags) using the live roster.
 */
import { ATHLETES } from '../src/data/rosters';
import { SPORTS } from '../src/data/sports';
import { REGIONS } from '../src/data/regions';

const MIN = 6; // generator's minimum answers per cell

const countries = [...new Set(ATHLETES.map(a => a.country))];
let countryCells = 0, countryViable = 0;
const viableCountries = new Set<string>();
for (const c of countries) {
  for (const s of SPORTS) {
    const n = ATHLETES.filter(a => a.country === c && a.sport === s.id).length;
    if (n > 0) countryCells++;
    if (n >= MIN) { countryViable++; viableCountries.add(c); }
  }
}

let regionCells = 0, regionViable = 0;
for (const r of REGIONS) for (const s of SPORTS) {
  const n = ATHLETES.filter(a => a.region === r.id && a.sport === s.id).length;
  if (n > 0) regionCells++;
  if (n >= MIN) regionViable++;
}

console.log(`countries in roster            : ${countries.length}`);
console.log(`country x sport cells >= ${MIN}    : ${countryViable} of ${countryCells} non-empty`);
console.log(`countries usable as a row      : ${viableCountries.size}`);
console.log(`region  x sport cells >= ${MIN}    : ${regionViable} of ${regionCells} non-empty`);

// Which countries are deep enough to headline a row?
const ranked = [...viableCountries].map(c => ({
  c, n: ATHLETES.filter(a => a.country === c).length,
  sports: SPORTS.filter(s => ATHLETES.filter(a=>a.country===c&&a.sport===s.id).length >= MIN).length,
})).sort((a,b)=>b.sports-a.sports || b.n-a.n);
console.log('\ncountries viable in 3+ sports (needed for a 3-col grid):');
for (const r of ranked.filter(r=>r.sports>=3)) console.log(`  ${r.c.padEnd(22)} ${r.sports} sports, ${r.n} athletes`);
console.log(`\ncountries viable in only 1-2 sports: ${ranked.filter(r=>r.sports<3).length}`);
