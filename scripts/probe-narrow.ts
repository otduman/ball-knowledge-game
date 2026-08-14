/**
 * Deep levels need rows that are narrow in BOTH football and the NBA. Regions,
 * eras and origin rows are all broad in football, so they vanish below the
 * ~30-answer line and the bottom of the dive collapses onto surname letters and
 * small countries. This asks which *new* row families are naturally narrow.
 */
import { ATHLETES } from '../src/data/rosters';
import type { Athlete } from '../src/data/types';

const F = ATHLETES.filter((a) => a.sport === 'football');
const N = ATHLETES.filter((a) => a.sport === 'nba');
const MIN = 6;

function count(pred: (a: Athlete) => boolean) {
  return { f: F.filter(pred).length, n: N.filter(pred).length };
}

function report(title: string, rows: Array<{ label: string; f: number; n: number }>) {
  const viable = rows.filter((r) => r.f >= MIN && r.n >= MIN);
  const deep = viable.filter((r) => r.f <= 30 && r.n <= 30);
  console.log(`\n== ${title} ==`);
  console.log(`   ${viable.length} viable (6+ in both), ${deep.length} of them deep (both <= 30)`);
  for (const r of viable.slice(0, 28)) console.log(`     ${r.label.padEnd(26)} f ${String(r.f).padStart(3)}  n ${String(r.n).padStart(3)}${r.f <= 30 && r.n <= 30 ? '   <- deep' : ''}`);
}

// 1. Exact birth year
const years = [...new Set(ATHLETES.map((a) => a.birthYear).filter((y): y is number => y !== undefined))].sort();
report('born in an exact year', years.map((y) => ({ label: `Born in ${y}`, ...count((a) => a.birthYear === y) })));

// 2. Birth city
const cities = [...new Set(ATHLETES.map((a) => a.birthCity).filter((c): c is string => !!c))];
report('born in a specific city', cities.map((c) => ({ label: `Born in ${c}`, ...count((a) => a.birthCity === c) })));

// 3. First-name initial
const letters = [...'abcdefghijklmnopqrstuvwxyz'];
report('given-name initial', letters.map((l) => ({ label: `Given name ${l.toUpperCase()}`, ...count((a) => a.name.toLowerCase().startsWith(l)) })));

// 4. Name length in characters
const lens = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
report('surname length', lens.map((n) => ({ label: `Surname of ${n}`, ...count((a) => { const p = a.name.split(' '); return (p[p.length - 1] ?? '').length === n; }) })));

// 5. Countries that would become viable with a bigger roster
const countries = [...new Set(ATHLETES.map((a) => a.country))];
const near = countries.map((c) => ({ label: c, ...count((a) => a.country === c) })).filter((r) => (r.f >= 3 || r.n >= 3) && (r.f < MIN || r.n < MIN)).sort((a, b) => b.f + b.n - a.f - a.n);
console.log(`\n== countries one or two players short of a row ==`);
for (const r of near.slice(0, 20)) console.log(`     ${r.label.padEnd(26)} f ${String(r.f).padStart(3)}  n ${String(r.n).padStart(3)}`);
