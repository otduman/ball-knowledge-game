import { ATHLETES } from '../src/data/rosters';
import { SPORTS } from '../src/data/sports';

const SETS: Array<Array<[number,number]>> = [
  [[0,20],[20,60],[60,Infinity]],
  [[0,20],[20,70],[70,Infinity]],
  [[0,25],[25,75],[75,Infinity]],
  [[0,15],[15,50],[50,Infinity]],
];
for (const set of SETS) {
  console.log('\n=== bands ' + set.map(([lo,hi])=>hi===Infinity?`${lo}+`:`${lo}-${hi-1}`).join(' | ') + ' ===');
  console.log('band'.padEnd(10), SPORTS.map(s=>s.label.padStart(10)).join(''), '  usable  widest');
  let ok = true;
  for (const band of set) {
    const lo = band[0]!, hi = band[1]!;
    const sizes = SPORTS.map(s => ATHLETES.filter(a =>
      a.sport===s.id && a.wikipediaLanguages!==undefined && a.wikipediaLanguages>=lo && a.wikipediaLanguages<hi).length);
    const usable = sizes.filter(n=>n>=6).length;
    if (usable < 3) ok = false;
    const label = hi===Infinity?`${lo}+`:`${lo}-${hi-1}`;
    console.log(label.padEnd(10), sizes.map(n=>String(n).padStart(10)).join(''), `  ${usable}/5     ${Math.max(...sizes)}`);
  }
  console.log(ok ? '  -> all bands viable' : '  -> REJECT: a band cannot fill 3 columns');
}
