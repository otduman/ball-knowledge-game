import data from '../src/data/enrichment.json';
import { ATHLETES } from '../src/data/rosters';

const e = data.entries as unknown as Record<string,[number|null,number|null,string|null]>;
const probe = ['Tacko Fall','Manute Bol','Lionel Messi','Nikola Jokic','Victor Wembanyama',
  'Conor McGregor','Lewis Hamilton','Rafael Nadal','Naomi Osaka','Erling Haaland','Michael Jordan','Yao Ming'];
for (const name of probe) {
  const a = ATHLETES.find(x => x.name === name);
  if (!a) { console.log(name.padEnd(20), 'NOT IN ROSTER'); continue; }
  const v = e[a.id];
  console.log(`${name.padEnd(20)} ${a.sport.padEnd(8)} height=${v?.[0] ?? '-'}cm  born=${v?.[1] ?? '-'}`);
}
const heights = Object.values(e).map(v=>v[0]).filter((n): n is number => n!=null);
heights.sort((a,b)=>a-b);
console.log('\nheight range:', heights[0], '-', heights[heights.length-1], 'cm; median', heights[Math.floor(heights.length/2)]);
const years = Object.values(e).map(v=>v[1]).filter((n): n is number => n!=null).sort((a,b)=>a-b);
console.log('birth years:', years[0], '-', years[years.length-1]);
