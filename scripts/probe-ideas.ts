/** Coverage probe for the category ideas, before committing to any of them. */
import { ATHLETES } from '../src/data/rosters';
import { SPORTS } from '../src/data/sports';

const sample = SPORTS.flatMap(s =>
  ATHLETES.filter(a=>a.sport===s.id).sort((a,b)=>b.pop-a.pop).slice(0,24));
const labels = new Map<string,string>();
for (const a of sample) for (const f of [a.name,...a.aliases]) labels.set(f.normalize('NFC'), a.id);

const q = `
SELECT ?label ?spouse ?insta ?award ?participant ?nickname WHERE {
  VALUES ?label { ${[...labels.keys()].map(l=>JSON.stringify(l)+'@en').join(' ')} }
  ?item rdfs:label ?label . ?item wdt:P31 wd:Q5 .
  OPTIONAL { ?item wdt:P26   ?spouse }       # spouse
  OPTIONAL { ?item wdt:P2003 ?insta }        # Instagram username
  OPTIONAL { ?item wdt:P166  ?award }        # award received
  OPTIONAL { ?item wdt:P1344 ?participant }  # participant in
  OPTIONAL { ?item wdt:P1449 ?nickname }     # nickname
}`;
const res = await fetch('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(q),
  { headers:{Accept:'application/sparql-results+json','User-Agent':'BallKnowledgeGame/0.1 (idea probe)'}});
console.log('HTTP', res.status);
const d: any = await res.json();

const hit: Record<string,Set<string>> = { spouse:new Set(), insta:new Set(), award:new Set(), participant:new Set(), nickname:new Set() };
for (const b of d.results.bindings) {
  const id = labels.get(b.label.value); if (!id) continue;
  for (const k of Object.keys(hit)) if (b[k]) hit[k]!.add(id);
}
const n = new Set(sample.map(a=>a.id)).size;
console.log(`sample: ${n} athletes (top ${24} per sport)\n`);
const bySport = (s:Set<string>) => SPORTS.map(sp=>{
  const ids = new Set(ATHLETES.filter(a=>a.sport===sp.id).map(a=>a.id));
  return `${sp.label.slice(0,4)}=${[...s].filter(i=>ids.has(i)).length}`;
}).join(' ');
for (const [k,v] of Object.entries(hit))
  console.log(`${k.padEnd(12)} ${String(v.size).padStart(3)}/${n} (${String(Math.round(100*v.size/n)).padStart(3)}%)   ${bySport(v)}`);
