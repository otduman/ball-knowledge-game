/**
 * Candidate row families that need no new data fetch. A family is worth the
 * code only if it yields several rows viable in BOTH columns, and it is worth
 * the most if those rows are tight enough for rows 4-6 of the board.
 */
import { ATHLETES } from '../src/data/rosters';
import type { Athlete } from '../src/data/types';
import { tokens } from '../src/util/text';

const F = ATHLETES.filter((a) => a.sport === 'football');
const N = ATHLETES.filter((a) => a.sport === 'nba');
const MIN = 6;

function count(pred: (a: Athlete) => boolean) {
  return { f: F.filter(pred).length, n: N.filter(pred).length };
}

function report(title: string, rows: Array<{ label: string; f: number; n: number }>, show = 10) {
  const viable = rows.filter((r) => r.f >= MIN && r.n >= MIN);
  const tight = viable.filter((r) => r.f <= 34 && r.n <= 34);
  const verdict = viable.length >= 5 ? '' : '   (too few to be worth the code)';
  console.log(`\n== ${title} ==`);
  console.log(`   ${viable.length} viable, ${tight.length} tight enough for rows 4-6${verdict}`);
  for (const r of viable.slice(0, show)) {
    console.log(`     ${r.label.padEnd(30)} f ${String(r.f).padStart(3)}  n ${String(r.n).padStart(3)}${r.f <= 34 && r.n <= 34 ? '  <- tight' : ''}`);
  }
}

const surname = (a: Athlete) => tokens(a.name)[tokens(a.name).length - 1] ?? '';
const given = (a: Athlete) => tokens(a.name)[0] ?? '';

// 1. Names of three or more words
report('three or more words in the name', [
  { label: 'Three-part name', ...count((a) => tokens(a.name).length >= 3) },
]);

// 2. Surname bookends
const letters = [...'abcdefghijklmnopqrstuvwxyz'];
report(
  'surname starts and ends with the same letter',
  [{ label: 'Surname bookends', ...count((a) => { const s = surname(a); return s.length > 1 && s[0] === s[s.length - 1]; }) }],
);

// 3. Surname ending letter — a whole family, unlike the single bookend row
report('surname ends with a given letter', letters.map((l) => ({
  label: `Surname ends ${l.toUpperCase()}`,
  ...count((a) => surname(a).endsWith(l)),
})), 14);

// 4. Given name ends with a letter
report('given name ends with a given letter', letters.map((l) => ({
  label: `Given name ends ${l.toUpperCase()}`,
  ...count((a) => given(a).endsWith(l)),
})), 10);

// 5. Equal-length first and last name
report('first and last name the same length', [
  { label: 'Balanced name', ...count((a) => { const t = tokens(a.name); return t.length > 1 && (t[0] ?? '').length === (t[t.length - 1] ?? '').length; }) },
]);

// 6. Hyphen or apostrophe
report('punctuation in the name', [
  { label: 'Hyphenated name', ...count((a) => a.name.includes('-')) },
  { label: 'Apostrophe in the name', ...count((a) => /['\u2019]/.test(a.name)) },
]);

// 7. Surname length exact
report('surname of an exact length', [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
  label: `Surname of ${n} letters`,
  ...count((a) => surname(a).length === n),
})));

// 8. Initials pair — the full family, not just the alliterative row
const pairs: Array<{ label: string; f: number; n: number }> = [];
for (const a of letters) for (const b of letters) {
  const c = count((x) => { const t = tokens(x.name); return t.length > 1 && (t[0] ?? '').startsWith(a) && (t[t.length - 1] ?? '').startsWith(b); });
  if (c.f >= MIN && c.n >= MIN) pairs.push({ label: `Initials ${a.toUpperCase()}.${b.toUpperCase()}.`, ...c });
}
report('exact pair of initials', pairs, 14);

// 9. Vowel and consonant shapes
report('name shape', [
  { label: 'Surname starts with a vowel', ...count((a) => 'aeiou'.includes(surname(a)[0] ?? '')) },
  { label: 'Given name starts with a vowel', ...count((a) => 'aeiou'.includes(given(a)[0] ?? '')) },
  { label: 'Surname ends in a vowel', ...count((a) => 'aeiou'.includes(surname(a).slice(-1))) },
  { label: 'Doubled vowel in the surname', ...count((a) => /(a{2}|e{2}|i{2}|o{2}|u{2})/.test(surname(a))) },
]);

// 10. Birth-year pairs, extending the family that already works
const years = [...new Set(ATHLETES.map((a) => a.birthYear).filter((y): y is number => !!y))].sort();
report('born in one of two consecutive years', years.map((y) => ({
  label: `Born in ${y} or ${y + 1}`,
  ...count((a) => a.birthYear === y || a.birthYear === y + 1),
})), 8);
