/**
 * Feasibility probe for a "Women" row: how many female athletes does each sport
 * column actually have? A row needs >= 6 in at least three columns to be usable.
 *
 * Measurement only — this does not write enrichment.json.
 *
 * CAVEAT: this probe takes any Wikidata entity sharing a label, without the
 * candidate scoring `enrich-roster.ts` uses. Homonyms inflate the counts —
 * it reported 8 NBA women, all false (a DJ named Yuki Kawamura, a politician
 * named Zhou Qi, a volleyball player named Sun Yue). Treat thin numbers as
 * noise, and hand-curate gender rather than importing these results.
 */
import { ATHLETES } from '../src/data/rosters';
import { SPORTS } from '../src/data/sports';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const UA = 'BallKnowledgeGame/0.1 (gender coverage probe)';
const BATCH = 80;

const labelToIds = new Map<string, string[]>();
for (const athlete of ATHLETES) {
  for (const form of [athlete.name, ...athlete.aliases]) {
    const key = form.normalize('NFC');
    labelToIds.set(key, [...(labelToIds.get(key) ?? []), athlete.id]);
  }
}

const female = new Set<string>();
const known = new Set<string>();
const labels = [...labelToIds.keys()];

for (let i = 0; i < labels.length; i += BATCH) {
  const values = labels.slice(i, i + BATCH).map((l) => `${JSON.stringify(l)}@en`).join(' ');
  const query = `
SELECT ?label ?genderLabel ?sitelinks WHERE {
  VALUES ?label { ${values} }
  ?item rdfs:label ?label . ?item wdt:P31 wd:Q5 .
  OPTIONAL { ?item wdt:P21 ?gender }
  OPTIONAL { ?item wikibase:sitelinks ?sitelinks }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
  const res = await fetch(`${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
  });
  if (!res.ok) {
    console.error('query failed', res.status);
    continue;
  }
  const data = (await res.json()) as {
    results: { bindings: Array<Record<string, { value: string }>> };
  };
  for (const row of data.results.bindings) {
    const ids = labelToIds.get(row.label?.value ?? '') ?? [];
    const gender = row.genderLabel?.value ?? '';
    for (const id of ids) {
      known.add(id);
      if (gender === 'female') female.add(id);
    }
  }
  process.stdout.write(`  ${Math.min(i + BATCH, labels.length)}/${labels.length}\r`);
  await new Promise((r) => setTimeout(r, 900));
}
console.log('');

console.log(`gender resolved for ${known.size}/${ATHLETES.length} athletes`);
console.log(`\nwomen per sport (need >= 6 for a column to be usable):`);
let usable = 0;
for (const sport of SPORTS) {
  const n = ATHLETES.filter((a) => a.sport === sport.id && female.has(a.id)).length;
  const total = ATHLETES.filter((a) => a.sport === sport.id).length;
  if (n >= 6) usable++;
  console.log(`  ${sport.label.padEnd(11)} ${String(n).padStart(3)} of ${String(total).padStart(4)}  ${n >= 6 ? 'usable' : 'TOO THIN'}`);
}
console.log(`\ncolumns a "Women" row could use: ${usable}/${SPORTS.length}`);
console.log(`total women in roster: ${female.size} (${Math.round((100 * female.size) / ATHLETES.length)}%)`);
