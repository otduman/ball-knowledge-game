/**
 * Fetches birth year, height and gender for every athlete from Wikidata and
 * writes src/data/enrichment.json.
 *
 * Run: npx vite-node scripts/enrich-roster.ts
 *
 * The output is committed so builds stay offline and reproducible; this script
 * only needs re-running when the roster grows. Four problems it has to solve:
 *
 *  1. Units. `wdt:P2048` returns a bare number, so metres, centimetres and
 *     inches are indistinguishable — Tacko Fall comes back as "93". Going
 *     through the statement node (`psv:`) returns the unit alongside the value.
 *  2. Ambiguity. Labels are not unique: "Michael Jordan" matches the
 *     basketballer and an English footballer; "Sun Yue" matches a volleyball
 *     player, a curler and a poet. Candidates are scored on whether their P641
 *     (sport) matches ours, then on sitelink count.
 *  3. Unicode. Our roster stores "Luka Modric" ASCII-folded while Wikidata has
 *     "Luka Modrić", and matching fails even between two accented spellings if
 *     one side is NFD and the other NFC. Labels are normalised to NFC.
 *  4. Label drift. Wikidata's English label is often not the common name —
 *     "Dani Alves" is "Daniel Alves", "Gio Reyna" is "Giovanni Reyna". Exact
 *     matching misses these, so a second pass runs them through the fuzzy
 *     search API. This is deliberately not a hand-maintained override table:
 *     the roster keeps growing and the list would rot.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ATHLETES } from '../src/data/rosters';
import type { Athlete, SportId } from '../src/data/types';

const SPARQL = 'https://query.wikidata.org/sparql';
const API = 'https://www.wikidata.org/w/api.php';
const UA = 'BallKnowledgeGame/0.1 (roster enrichment)';
const BATCH_SIZE = 80;
const DELAY_MS = 900;

/** Wikidata P641 "sport" values accepted as confirmation for each column. */
const SPORT_QIDS: Record<SportId, string[]> = {
  football: ['Q2736'],
  nba: ['Q5372'],
  ufc: ['Q114466', 'Q11417'],
  f1: ['Q1968', 'Q5386'],
  tennis: ['Q847'],
};

const HEIGHT_MIN_CM = 120;
const HEIGHT_MAX_CM = 260;
const BIRTH_MIN_YEAR = 1900;
const BIRTH_MAX_YEAR = 2012;

interface Candidate {
  qid: string;
  heights: number[];
  birthYear?: number;
  gender?: 'f' | 'm';
  sports: Set<string>;
  sitelinks: number;
}

const nfc = (value: string): string => value.normalize('NFC');

function toCentimetres(amount: number, unit: string): number | undefined {
  const cm =
    unit === 'metre' ? amount * 100 :
    unit === 'inch' ? amount * 2.54 :
    unit === 'foot' ? amount * 30.48 :
    amount;
  return cm >= HEIGHT_MIN_CM && cm <= HEIGHT_MAX_CM ? Math.round(cm) : undefined;
}

/**
 * Throws rather than returning [] on failure. An earlier version swallowed
 * errors, so a single 502 silently dropped a whole batch of 80 athletes and
 * they surfaced later as "unmatched" — which looked like a name problem and
 * was not. Callers retry; anything still failing is reported loudly.
 */
async function sparql(query: string): Promise<Array<Record<string, { value: string }>>> {
  const url = `${SPARQL}?format=json&query=${encodeURIComponent(query)}`;
  let lastError = 'unknown';

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          results: { bindings: Array<Record<string, { value: string }>> };
        };
        return data.results.bindings;
      }
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await new Promise((r) => setTimeout(r, DELAY_MS * attempt * 2));
  }
  throw new Error(`SPARQL failed after 5 attempts: ${lastError}`);
}

const CLAIMS = `
  OPTIONAL { ?item p:P2048/psv:P2048 [ wikibase:quantityAmount ?amount ; wikibase:quantityUnit ?unit ] }
  OPTIONAL { ?item wdt:P569 ?dob }
  OPTIONAL { ?item wdt:P21 ?gender }
  OPTIONAL { ?item wdt:P641 ?sport }
  OPTIONAL { ?item wikibase:sitelinks ?sitelinks }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }`;

function absorb(into: Map<string, Candidate>, row: Record<string, { value: string }>, qid: string): void {
  const candidate: Candidate = into.get(qid) ?? {
    qid,
    heights: [],
    sports: new Set<string>(),
    sitelinks: 0,
  };

  if (row.amount) {
    const cm = toCentimetres(Number(row.amount.value), row.unitLabel?.value ?? '');
    if (cm && !candidate.heights.includes(cm)) candidate.heights.push(cm);
  }
  if (row.dob) {
    const year = Number(row.dob.value.slice(0, 4));
    if (year >= BIRTH_MIN_YEAR && year <= BIRTH_MAX_YEAR) candidate.birthYear = year;
  }
  if (row.genderLabel) {
    const g = row.genderLabel.value;
    if (g === 'female') candidate.gender = 'f';
    else if (g === 'male') candidate.gender = 'm';
  }
  if (row.sport) candidate.sports.add(row.sport.value.split('/').pop() ?? '');
  if (row.sitelinks) candidate.sitelinks = Math.max(candidate.sitelinks, Number(row.sitelinks.value));

  into.set(qid, candidate);
}

/** Pass 1: bulk exact-label lookup. Cheap and resolves the large majority. */
async function fetchByLabels(labels: string[]): Promise<Map<string, Map<string, Candidate>>> {
  const byLabel = new Map<string, Map<string, Candidate>>();

  async function runBatch(batch: string[]): Promise<void> {
    const values = batch.map((l) => `${JSON.stringify(l)}@en`).join(' ');
    const rows = await sparql(`
SELECT ?label ?item ?amount ?unitLabel ?dob ?genderLabel ?sport ?sitelinks WHERE {
  VALUES ?label { ${values} }
  ?item rdfs:label ?label .
  ?item wdt:P31 wd:Q5 .${CLAIMS}
}`);

    for (const row of rows) {
      const label = row.label?.value;
      const qid = row.item?.value.split('/').pop();
      if (!label || !qid) continue;
      const perLabel = byLabel.get(label) ?? new Map<string, Candidate>();
      absorb(perLabel, row, qid);
      byLabel.set(label, perLabel);
    }
  }

  const failed: string[][] = [];
  for (let i = 0; i < labels.length; i += BATCH_SIZE) {
    const batch = labels.slice(i, i + BATCH_SIZE);
    try {
      await runBatch(batch);
    } catch {
      failed.push(batch);
    }
    process.stdout.write(`  pass 1: ${Math.min(i + BATCH_SIZE, labels.length)}/${labels.length}\r`);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  console.log('');

  // Retry failures in smaller slices — a batch usually fails on size or a
  // transient 502, and both clear up when it is split.
  if (failed.length > 0) {
    const retry = failed.flat();
    console.log(`  pass 1: retrying ${retry.length} labels from ${failed.length} failed batch(es)`);
    for (let i = 0; i < retry.length; i += 20) {
      try {
        await runBatch(retry.slice(i, i + 20));
      } catch (err) {
        console.error(`  !! permanently failed: ${err instanceof Error ? err.message : err}`);
      }
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  return byLabel;
}

/** Pass 2: fuzzy search for the stragglers whose Wikidata label differs. */
/**
 * The search API is the reliable resolver: it matches labels *and* aliases
 * ("Sam Stosur" is an alias of "Samantha Stosur") and tolerates spelling drift.
 * Exact `rdfs:label` matching in pass 1 misses these — it even misses
 * "Wilt Chamberlain", whose label is exactly that.
 *
 * Retries matter here. Without them a transient failure silently drops the
 * athlete, which showed up as the unmatched count wobbling between runs.
 */
async function searchQids(name: string): Promise<string[]> {
  const url = `${API}?action=wbsearchentities&format=json&type=item&language=en&limit=8&search=${encodeURIComponent(name)}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.ok) {
        const data = (await res.json()) as { search?: Array<{ id: string }> };
        return (data.search ?? []).map((s) => s.id);
      }
    } catch {
      // fall through to the backoff below
    }
    await new Promise((r) => setTimeout(r, 500 * attempt * attempt));
  }
  console.error(`  !! search failed for ${name}`);
  return [];
}

async function fetchByQids(qids: string[]): Promise<Map<string, Candidate>> {
  const out = new Map<string, Candidate>();
  for (let i = 0; i < qids.length; i += BATCH_SIZE) {
    const values = qids.slice(i, i + BATCH_SIZE).map((q) => `wd:${q}`).join(' ');
    try {
      const rows = await sparql(`
SELECT ?item ?amount ?unitLabel ?dob ?genderLabel ?sport ?sitelinks WHERE {
  VALUES ?item { ${values} }
  ?item wdt:P31 wd:Q5 .${CLAIMS}
}`);
      for (const row of rows) {
        const qid = row.item?.value.split('/').pop();
        if (qid) absorb(out, row, qid);
      }
    } catch (err) {
      console.error(`  !! qid batch failed: ${err instanceof Error ? err.message : err}`);
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  return out;
}

/**
 * Picks between entities sharing a name. A confirmed sport match always wins;
 * otherwise the better-known entity (more Wikipedia sitelinks) does. Without
 * the sport check, "Sun Yue" resolves to a female volleyball player.
 */
function choose(candidates: Candidate[], sport: SportId): Candidate | undefined {
  const accepted = SPORT_QIDS[sport];
  return candidates
    .map((c) => ({ c, match: [...c.sports].some((s) => accepted.includes(s)) ? 1 : 0 }))
    .sort((a, b) => b.match - a.match || b.c.sitelinks - a.c.sitelinks)[0]?.c;
}

/** Conflicting height statements: take the median rather than whichever arrived first. */
function medianHeight(heights: number[]): number | null {
  if (heights.length === 0) return null;
  const sorted = [...heights].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)] as number;
}

async function main(): Promise<void> {
  const labelToAthletes = new Map<string, Athlete[]>();
  for (const athlete of ATHLETES) {
    for (const form of [athlete.name, ...athlete.aliases]) {
      const key = nfc(form);
      labelToAthletes.set(key, [...(labelToAthletes.get(key) ?? []), athlete]);
    }
  }

  const labels = [...labelToAthletes.keys()];
  console.log(`pass 1: exact labels — ${labels.length} labels for ${ATHLETES.length} athletes`);
  const byLabel = await fetchByLabels(labels);

  const candidatesFor = (athlete: Athlete): Candidate[] => {
    const found: Candidate[] = [];
    for (const form of [athlete.name, ...athlete.aliases]) {
      const perLabel = byLabel.get(nfc(form));
      if (perLabel) found.push(...perLabel.values());
    }
    return found;
  };

  const stragglers = ATHLETES.filter((a) => candidatesFor(a).length === 0);
  console.log(`pass 2: fuzzy search — ${stragglers.length} unmatched`);

  const searchHits = new Map<string, string[]>();
  const allQids = new Set<string>();
  for (const [index, athlete] of stragglers.entries()) {
    const qids = await searchQids(athlete.name);
    searchHits.set(athlete.id, qids);
    for (const q of qids) allQids.add(q);
    process.stdout.write(`  pass 2: ${index + 1}/${stragglers.length}\r`);
    await new Promise((r) => setTimeout(r, 350));
  }
  console.log('');

  const byQid = await fetchByQids([...allQids]);

  /** athleteId -> [heightCm | null, birthYear | null, "f" | "m" | null] */
  const entries: Record<string, [number | null, number | null, string | null]> = {};
  let heights = 0;
  let births = 0;
  let genders = 0;
  const unmatched: string[] = [];

  for (const athlete of ATHLETES) {
    let pool = candidatesFor(athlete);
    if (pool.length === 0) {
      pool = (searchHits.get(athlete.id) ?? [])
        .map((q) => byQid.get(q))
        .filter((c): c is Candidate => c !== undefined);
    }
    if (pool.length === 0) {
      unmatched.push(`${athlete.name} (${athlete.sport})`);
      continue;
    }

    const best = choose(pool, athlete.sport);
    if (!best) continue;

    const height = medianHeight(best.heights);
    const birthYear = best.birthYear ?? null;
    const gender = best.gender ?? null;
    if (height === null && birthYear === null && gender === null) continue;

    if (height !== null) heights++;
    if (birthYear !== null) births++;
    if (gender !== null) genders++;
    entries[athlete.id] = [height, birthYear, gender];
  }

  const pct = (n: number) => `${Math.round((100 * n) / ATHLETES.length)}%`;
  const output = {
    $schema: 'athleteId -> [heightCm | null, birthYear | null, gender "f" | "m" | null]',
    source: 'Wikidata (P2048 height, P569 birth date, P21 gender)',
    athletes: ATHLETES.length,
    withHeight: heights,
    withBirthYear: births,
    withGender: genders,
    entries,
  };

  const target = resolve(process.cwd(), 'src/data/enrichment.json');
  writeFileSync(target, `${JSON.stringify(output, null, 0)}\n`, 'utf8');

  console.log(`matched      : ${Object.keys(entries).length} (${pct(Object.keys(entries).length)})`);
  console.log(`with height  : ${heights} (${pct(heights)})`);
  console.log(`with birth yr: ${births} (${pct(births)})`);
  console.log(`with gender  : ${genders} (${pct(genders)})`);
  console.log(`unmatched    : ${unmatched.length}${unmatched.length ? ` — ${unmatched.slice(0, 10).join(', ')}` : ''}`);
  console.log(`wrote ${target}`);
}

main().catch((err) => {
  console.error('enrichment failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
