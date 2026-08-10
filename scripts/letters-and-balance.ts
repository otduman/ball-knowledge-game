import { ATHLETES } from '../src/data/rosters';
import { COL_CATEGORIES, REGION_CATEGORIES } from '../src/engine/categories';
import { poolFor } from '../src/engine/pools';

const surname = (n:string)=>n.trim().split(' ').pop()!.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
const firstname = (n:string)=>n.trim().split(' ')[0]!.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');

console.log('=== SINGLE LETTER viability (surname), athletes per sport ===');
console.log('ltr ', COL_CATEGORIES.map(c=>c.label.padStart(9)).join(''), ' usable(>=6)');
const usableLetters: string[] = [];
for (const L of 'abcdefghijklmnopqrstuvwxyz') {
  const sizes = COL_CATEGORIES.map(c => ATHLETES.filter(a=>c.matches(a) && surname(a.name).startsWith(L)).length);
  const ok = sizes.filter(n=>n>=6).length;
  if (ok >= 3) usableLetters.push(L.toUpperCase());
  if (ok >= 1) console.log(' '+L.toUpperCase()+'  ', sizes.map(n=>String(n).padStart(9)).join(''), ` ${ok}/5`);
}
console.log('letters usable as a row (>=3 sports):', usableLetters.join(' '), `= ${usableLetters.length}`);

console.log('\n=== first-name letters usable ===');
const usableFirst = [...'abcdefghijklmnopqrstuvwxyz'].filter(L =>
  COL_CATEGORIES.filter(c => ATHLETES.filter(a=>c.matches(a)&&firstname(a.name).startsWith(L)).length>=6).length>=3);
console.log(usableFirst.map(l=>l.toUpperCase()).join(' '), `= ${usableFirst.length}`);

console.log('\n=== SPORT BALANCE ===');
for (const c of COL_CATEGORIES) {
  const n = ATHLETES.filter(a=>c.matches(a)).length;
  const cells = REGION_CATEGORIES.map(r=>poolFor(r,c).length).sort((a,b)=>a-b);
  const med = cells[Math.floor(cells.length/2)];
  console.log(`${c.label.padEnd(10)} roster ${String(n).padStart(4)} (${String(Math.round(100*n/ATHLETES.length)).padStart(2)}%)  region-cell median ${String(med).padStart(3)}  max ${cells[cells.length-1]}`);
}
