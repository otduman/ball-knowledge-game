/**
 * Feasibility probe for enriching the roster with physical/biographical data.
 *
 * Run: npx vite-node scripts/probe-wikidata.ts
 *
 * Answers one question: if we want axes like "over 2 metres" or "born in the
 * 1990s", can we source that data automatically instead of hand-typing it for
 * 1386 athletes? Reports match rate and field coverage against a real sample.
 */
import { ATHLETES } from '../src/data/rosters';
import type { Athlete } from '../src/data/types';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const UA = 'BallKnowledgeGame/0.1 (roster enrichment feasibility probe)';

function buildSample(): Athlete[] {
  const sample: Athlete[] = [];
  for (const sport of ['football', 'nba', 'ufc', 'f1'] as const) {
    const sorted = ATHLETES.filter((a) => a.sport === sport).sort((a, b) => b.pop - a.pop);
    const mid = Math.floor(sorted.length / 2);
    sample.push(...sorted.slice(0, 8));          // household names
    sample.push(...sorted.slice(mid, mid + 4));  // mid-tier
    sample.push(...sorted.slice(-4));            // deep cuts
  }
  return sample;
}

/**
 * Heights come back as bare numbers from `wdt:P2048`, so metres, centimetres
 * and inches are indistinguishable — Tacko Fall reads as "93". Going through
 * the statement node (`psv:`) returns the unit alongside the amount.
 */
function toCentimetres(amount: number, unit: string): number | undefined {
  const cm = unit === 'metre' ? amount * 100 : unit === 'inch' ? amount * 2.54 : amount;
  return cm > 120 && cm < 260 ? Math.round(cm) : undefined;
}

async function main(): Promise<void> {
  const sample = buildSample();

  // Query display names and aliases together: our roster ASCII-folds many names
  // ("Luka Modric") while Wikidata labels carry diacritics ("Luka Modrić").
  const labelToId = new Map<string, string>();
  for (const athlete of sample) {
    for (const form of [athlete.name, ...athlete.aliases]) labelToId.set(form, athlete.id);
  }

  const values = [...labelToId.keys()].map((n) => `${JSON.stringify(n)}@en`).join(' ');
  const query = `
SELECT ?label ?amount ?unitLabel ?dob WHERE {
  VALUES ?label { ${values} }
  ?item rdfs:label ?label .
  OPTIONAL { ?item p:P2048/psv:P2048 [ wikibase:quantityAmount ?amount ; wikibase:quantityUnit ?unit ] }
  OPTIONAL { ?item wdt:P569 ?dob }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;

  const res = await fetch(`${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`SPARQL ${res.status}`);

  const data = (await res.json()) as {
    results: { bindings: Array<Record<string, { value: string }>> };
  };

  const found = new Map<string, { cm?: number; dob?: string }>();
  for (const row of data.results.bindings) {
    const id = labelToId.get(row.label?.value ?? '');
    if (!id) continue;
    const entry = found.get(id) ?? {};
    if (row.amount) {
      const cm = toCentimetres(Number(row.amount.value), row.unitLabel?.value ?? '');
      if (cm) entry.cm = cm;
    }
    if (row.dob) entry.dob = row.dob.value.slice(0, 10);
    found.set(id, entry);
  }

  const total = new Set(sample.map((a) => a.id)).size;
  const heights = [...found.values()].filter((v) => v.cm).length;
  const births = [...found.values()].filter((v) => v.dob).length;
  const pct = (n: number) => `${Math.round((100 * n) / total)}%`;

  console.log(`sampled athletes    : ${total}`);
  console.log(`matched on Wikidata : ${found.size} (${pct(found.size)})`);
  console.log(`usable height       : ${heights} (${pct(heights)})`);
  console.log(`birth date          : ${births} (${pct(births)})`);

  const tacko = ATHLETES.find((a) => a.name === 'Tacko Fall');
  if (tacko) console.log(`Tacko Fall height   : ${found.get(tacko.id)?.cm ?? 'n/a'} cm (should be ~226)`);

  const unmatched = sample.filter((a) => !found.has(a.id));
  console.log(`unmatched (${unmatched.length}): ${unmatched.slice(0, 12).map((a) => a.name).join(', ') || 'none'}`);
}

main().catch((err) => {
  console.error('probe failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
