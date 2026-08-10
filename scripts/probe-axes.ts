/** Coverage probe for candidate NEW axes, before committing to building them. */
import { ATHLETES } from '../src/data/rosters';

const sample = ['tennis','ufc','football','nba','f1'].flatMap(s =>
  ATHLETES.filter(a=>a.sport===s).sort((a,b)=>b.pop-a.pop).slice(0,26));
const labels = new Map<string,string>();
for (const a of sample) for (const f of [a.name,...a.aliases]) labels.set(f.normalize('NFC'), a.id);

const q = `
SELECT ?label ?hand ?playHand ?award ?olympics WHERE {
  VALUES ?label { ${[...labels.keys()].map(l=>JSON.stringify(l)+'@en').join(' ')} }
  ?item rdfs:label ?label . ?item wdt:P31 wd:Q5 .
  OPTIONAL { ?item wdt:P552 ?hand }       # handedness
  OPTIONAL { ?item wdt:P741 ?playHand }   # playing hand
  OPTIONAL { ?item wdt:P166 ?award }      # award received
  OPTIONAL { ?item wdt:P1344 ?olympics }  # participant in
}`;
const res = await fetch('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(q),
  { headers:{Accept:'application/sparql-results+json','User-Agent':'BallKnowledgeGame/0.1 (axis probe)'}});
const d: any = await res.json();

const hit = { hand:new Set<string>(), play:new Set<string>(), award:new Set<string>(), oly:new Set<string>() };
for (const b of d.results.bindings) {
  const id = labels.get(b.label.value); if (!id) continue;
  if (b.hand) hit.hand.add(id);
  if (b.playHand) hit.play.add(id);
  if (b.award) hit.award.add(id);
  if (b.olympics) hit.oly.add(id);
}
const n = new Set(sample.map(a=>a.id)).size;
const pct = (s:Set<string>)=>`${s.size}/${n} (${Math.round(100*s.size/n)}%)`;
console.log('sample size          :', n);
console.log('handedness (P552)    :', pct(hit.hand));
console.log('playing hand (P741)  :', pct(hit.play));
console.log('any award (P166)     :', pct(hit.award));
console.log('participant in(P1344):', pct(hit.oly));
const handBySport = ['tennis','ufc'].map(s=>{
  const ids = new Set(ATHLETES.filter(a=>a.sport===s).map(a=>a.id));
  const c = [...hit.play,...hit.hand].filter(i=>ids.has(i)).length;
  return `${s}=${c}`;
});
console.log('hand data by sport   :', handBySport.join(' '));
