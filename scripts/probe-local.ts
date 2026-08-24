/**
 * Investigation, part two: what is left in the data we already hold?
 *
 * Everything here needs no fetch, so anything that measures well is free. A row
 * has to field MIN_ROW_POOL in both columns to exist at all, and its tighter
 * column has to land inside one of the six windows to be usable at depth.
 */
import { ATHLETES } from '../src/data/rosters';
import type { Athlete } from '../src/data/types';
import { LEVELS } from '../src/engine/levels';
import { tokens } from '../src/util/text';

const FOOTBALL = ATHLETES.filter((a) => a.sport === 'football');
const NBA = ATHLETES.filter((a) => a.sport === 'nba');

const surname = (a: Athlete) => tokens(a.name)[tokens(a.name).length - 1] ?? '';
const given = (a: Athlete) => tokens(a.name)[0] ?? '';

interface C { family: string; label: string; matches: (a: Athlete) => boolean }
const rows: C[] = [];
const add = (family: string, label: string, matches: (a: Athlete) => boolean) =>
  rows.push({ family, label, matches });

// ---- name particles ------------------------------------------------------
// Van, De, Dos, Al: a cultural marker rather than a spelling one, and the kind
// of thing a player notices about a name without being able to alphabetise it.
const PARTICLES = ['van', 'von', 'de', 'del', 'della', 'di', 'da', 'dos', 'das', 'du',
  'la', 'le', 'al', 'el', 'bin', 'ibn', 'mac', 'mc', "o'", 'ter', 'ten', 'den'];
add('particle', 'Name has a particle', (a) => {
  const parts = tokens(a.name);
  return parts.slice(0, -1).some((p) => PARTICLES.includes(p)) ||
    parts.length > 2 && PARTICLES.includes(parts[1] ?? '');
});
add('particle', 'Surname starts Mac/Mc/O', (a) => /^(mac|mc|o)/.test(surname(a)));

// ---- shared given name ---------------------------------------------------
// Shared surname is already a row; the first name is a different question and
// a much commoner coincidence, so it should be broader.
const sharedGiven = (() => {
  const n = new Map<string, number>();
  for (const a of ATHLETES) n.set(given(a), (n.get(given(a)) ?? 0) + 1);
  return new Set([...n].filter(([, c]) => c > 1).map(([g]) => g));
})();
add('shared', 'Shared given name', (a) => sharedGiven.has(given(a)));

const sharedGiven3 = (() => {
  const n = new Map<string, number>();
  for (const a of ATHLETES) n.set(given(a), (n.get(given(a)) ?? 0) + 1);
  return new Set([...n].filter(([, c]) => c > 3).map(([g]) => g));
})();
add('shared', 'Common given name (4+)', (a) => sharedGiven3.has(given(a)));

// ---- citizenship depth ---------------------------------------------------
add('passport', 'Triple national', (a) => (a.citizenships ?? 0) > 2);
add('passport', 'Single passport', (a) => a.citizenships === 1);

// ---- name length ---------------------------------------------------------
add('length', 'Full name 20+ letters', (a) => tokens(a.name).join('').length >= 20);
add('length', 'Full name under 11', (a) => tokens(a.name).join('').length < 11);
add('length', 'Given name 3 letters', (a) => given(a).length <= 3 && tokens(a.name).length > 1);

// ---- year shapes ---------------------------------------------------------
add('year', 'Born in a year ending 0', (a) => a.birthYear !== undefined && a.birthYear % 10 === 0);
add('year', 'Born in a year ending 5', (a) => a.birthYear !== undefined && a.birthYear % 10 === 5);
add('year', 'Born in a leap year', (a) => {
  const y = a.birthYear;
  return y !== undefined && y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
});

// ---- second-wave blends --------------------------------------------------
// The pairings not tried in the first pass, now that blends exist as a family.
const REGIONS = [...new Set(ATHLETES.map((a) => a.region))];
const capital = (a: Athlete) => a.bornInCapital === true;
const global75 = (a: Athlete) => (a.wikipediaLanguages ?? 0) >= 75;
const deepcut = (a: Athlete) => a.wikipediaLanguages !== undefined && a.wikipediaLanguages < 15;
const sharedCity = (() => {
  const n = new Map<string, number>();
  for (const a of ATHLETES) if (a.birthCity) n.set(a.birthCity, (n.get(a.birthCity) ?? 0) + 1);
  return new Set([...n].filter(([, c]) => c > 1).map(([c]) => c));
})();

for (const r of REGIONS) {
  add('region x capital', `${r} + capital-born`, (a) => a.region === r && capital(a));
  add('region x global', `${r} + global name`, (a) => a.region === r && global75(a));
  add('region x deepcut', `${r} + deep cut`, (a) => a.region === r && deepcut(a));
  add('region x city', `${r} + shares a birth city`, (a) =>
    a.region === r && a.birthCity !== undefined && sharedCity.has(a.birthCity));
  add('region x short', `${r} + short surname`, (a) =>
    a.region === r && surname(a).length <= 4 && tokens(a.name).length > 1);
}

const ERAS: Array<[string, number, number]> = [
  ['pre-1980', 0, 1980], ['1980s', 1980, 1990], ['1990s', 1990, 2000], ['2000s', 2000, 9999],
];
for (const [lab, lo, hi] of ERAS) {
  const inEra = (a: Athlete) => a.birthYear !== undefined && a.birthYear >= lo && a.birthYear < hi;
  add('era x city', `${lab} + shares a birth city`, (a) =>
    inEra(a) && a.birthCity !== undefined && sharedCity.has(a.birthCity));
  add('era x short', `${lab} + short surname`, (a) =>
    inEra(a) && surname(a).length <= 4 && tokens(a.name).length > 1);
  add('era x global', `${lab} + global name`, (a) => inEra(a) && global75(a));
  add('era x deepcut', `${lab} + deep cut`, (a) => inEra(a) && deepcut(a));
  add('era x particle', `${lab} + name particle`, (a) => {
    const parts = tokens(a.name);
    return inEra(a) && parts.slice(0, -1).some((p) => PARTICLES.includes(p));
  });
}

// Dual national is the deepest biographical row we have; pair it more widely.
const dual = (a: Athlete) => (a.citizenships ?? 0) > 1;
add('dual x', 'Dual national + capital-born', (a) => dual(a) && capital(a));
add('dual x', 'Dual national + global name', (a) => dual(a) && global75(a));
add('dual x', 'Dual national + short surname', (a) =>
  dual(a) && surname(a).length <= 4 && tokens(a.name).length > 1);
add('dual x', 'Dual national + shares a city', (a) =>
  dual(a) && a.birthCity !== undefined && sharedCity.has(a.birthCity));

// ---- report --------------------------------------------------------------
const scored = rows.map((c) => {
  const f = FOOTBALL.filter(c.matches).length;
  const n = NBA.filter(c.matches).length;
  const windows = LEVELS.filter(
    (l) => f >= l.minPool && f <= l.maxPool && n >= l.minPool && n <= l.maxPool,
  ).map((l) => l.depth);
  return { ...c, f, n, floor: Math.min(f, n), windows };
});

const byFamily = new Map<string, typeof scored>();
for (const r of scored) byFamily.set(r.family, [...(byFamily.get(r.family) ?? []), r]);

console.log('family                  probed  viable  windowed');
for (const [family, list] of byFamily) {
  const v = list.filter((r) => r.floor >= 6);
  console.log(
    `  ${family.padEnd(21)} ${String(list.length).padStart(5)}  ${String(v.length).padStart(6)}  ${String(v.filter((r) => r.windows.length).length).padStart(8)}`,
  );
}

console.log('\n== viable rows ==');
for (const [family, list] of byFamily) {
  const v = list.filter((r) => r.floor >= 6).sort((a, b) => b.floor - a.floor);
  if (!v.length) continue;
  console.log(`\n-- ${family} --`);
  for (const r of v) {
    console.log(
      `   ${r.label.padEnd(34)} f ${String(r.f).padStart(3)}  n ${String(r.n).padStart(3)}   rows ${r.windows.join(',') || '-'}`,
    );
  }
}
