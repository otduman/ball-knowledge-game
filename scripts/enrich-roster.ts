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

/** Extra facts fetched by QID once the right entity has been chosen. */
interface Extras {
  citizenships: number;
  birthCity?: string;
  bornInCapital: boolean;
  positions: Set<string>;
}

/**
 * P413 values kept, lowercased. A vocabulary rather than "whatever comes back"
 * because P413 is not confined to the sport an athlete is filed under: Michael
 * Jordan carries "outfielder" from his baseball detour, and taking it whole
 * would put him in a row about basketball positions under a baseball label.
 *
 * Stored raw rather than pre-bucketed into attacker/playmaker/anchor, so that
 * grouping can be rethought in the engine without paying for another fetch.
 */
const POSITION_VOCABULARY: ReadonlySet<string> = new Set([
  // association football
  'goalkeeper', 'defender', 'centre-back', 'center back', 'full-back', 'left-back',
  'right-back', 'sweeper', 'wing-back', 'midfielder', 'defensive midfielder',
  'central midfielder', 'attacking midfielder', 'winger', 'forward', 'centre-forward',
  'striker', 'second striker', 'inside forward', 'wide midfielder',
  // basketball
  'point guard', 'shooting guard', 'small forward', 'power forward', 'center',
  'guard', 'swingman', 'point forward', 'combo guard', 'stretch four',
]);

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
 * Pass 3: facts that only make sense once the right entity is known, fetched by
 * QID so there is no homonym risk left to handle.
 *
 * Two traps here, both found by measurement:
 *  - Capitals must be derived country-first (`?country wdt:P36 ?city`), never
 *    city-first via P1376 "capital of". P1376 counts historic and sub-national
 *    capitals, which inflates the hit rate from 10% to 65% and cheerfully
 *    asserts that New York City is a capital of the United States.
 *    Country-first is necessary but NOT sufficient: P36 also belongs to
 *    regions, provinces and counties, so `?capitalOf` must additionally be a
 *    sovereign state. Without that constraint 68% of footballers read as
 *    capital-born, because Manchester is the capital of Greater Manchester.
 *  - Defunct states inflate citizenship counts — Vlade Divac lists three
 *    flavours of Yugoslavia — so anything with a dissolution date is excluded.
 */
async function fetchExtras(qids: string[]): Promise<Map<string, Extras>> {
  const out = new Map<string, Extras>();

  for (let i = 0; i < qids.length; i += BATCH_SIZE) {
    const values = qids.slice(i, i + BATCH_SIZE).map((q) => `wd:${q}`).join(' ');
    try {
      const rows = await sparql(`
SELECT ?item ?cit ?cityLabel ?capitalOf ?posLabel WHERE {
  VALUES ?item { ${values} }
  OPTIONAL {
    ?item wdt:P27 ?cit .
    FILTER NOT EXISTS { ?cit wdt:P576 ?citDissolved }
  }
  OPTIONAL { ?item wdt:P19 ?city }
  OPTIONAL {
    ?item wdt:P19 ?bornCity .
    ?capitalOf wdt:P36 ?bornCity .
    ?capitalOf wdt:P31/wdt:P279* wd:Q3624078 .
    FILTER NOT EXISTS { ?capitalOf wdt:P576 ?dissolved }
  }
  OPTIONAL { ?item wdt:P413 ?pos }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`);

      const citizenships = new Map<string, Set<string>>();
      for (const row of rows) {
        const qid = row.item?.value.split('/').pop();
        if (!qid) continue;
        const entry = out.get(qid) ?? {
          citizenships: 0,
          bornInCapital: false,
          positions: new Set<string>(),
        };
        if (row.posLabel) {
          const pos = row.posLabel.value.toLowerCase().trim();
          if (POSITION_VOCABULARY.has(pos)) entry.positions.add(pos);
        }
        if (row.cit) {
          const set = citizenships.get(qid) ?? new Set<string>();
          set.add(row.cit.value);
          citizenships.set(qid, set);
          entry.citizenships = set.size;
        }
        if (row.cityLabel && !entry.birthCity) {
          const city = row.cityLabel.value;
          // Unlabelled items come back as bare QIDs; they are useless as a key.
          if (!/^Q\d+$/.test(city)) entry.birthCity = city;
        }
        if (row.capitalOf) entry.bornInCapital = true;
        out.set(qid, entry);
      }
    } catch (err) {
      console.error(`  !! extras batch failed: ${err instanceof Error ? err.message : err}`);
    }
    process.stdout.write(`  pass 3: ${Math.min(i + BATCH_SIZE, qids.length)}/${qids.length}\r`);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  console.log('');
  return out;
}

/**
 * Picks between entities sharing a name. A confirmed sport match always wins;
 * otherwise the better-known entity (more Wikipedia sitelinks) does. Without
 * the sport check, "Sun Yue" resolves to a female volleyball player.
 */
function choose(candidates: Candidate[], sport: SportId): Candidate | undefined {
  return candidates
    .map((c) => ({ c, match: sportMatches(c, sport) ? 1 : 0 }))
    .sort((a, b) => b.match - a.match || b.c.sitelinks - a.c.sitelinks)[0]?.c;
}

function sportMatches(candidate: Candidate, sport: SportId): boolean {
  const accepted = SPORT_QIDS[sport];
  return [...candidate.sports].some((s) => accepted.includes(s));
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

  // Resolve the winning entity for every athlete first, so pass 3 only fetches
  // facts for entities we have actually committed to.
  const chosen = new Map<string, Candidate>();
  const unmatched: string[] = [];
  const wrongSport: string[] = [];
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
    if (best) chosen.set(athlete.id, best);
    // A name that resolves to a real person playing a different sport is the
    // failure mode roster additions actually have: fabrications fail to resolve
    // at all, but a footballer filed under the NBA resolves perfectly and is
    // then wrong in every cell.
    //
    // ADVISORY, not a verdict. P641 is inconsistently populated — plenty of
    // obvious footballers (Sergio Ramos, Rafael Marquez) carry a value outside
    // SPORT_QIDS, and most F1 and UFC entries do too. Treat a name here as
    // worth checking by hand, not as proof. It earned its keep by surfacing
    // Satnam Singh, who was drafted but never played an NBA game.
    if (best && best.sports.size > 0 && !sportMatches(best, athlete.sport)) {
      wrongSport.push(`${athlete.name} (${athlete.sport})`);
    }
  }

  console.log(`pass 3: extra facts for ${chosen.size} resolved entities`);
  const extras = await fetchExtras([...new Set([...chosen.values()].map((c) => c.qid))]);

  /**
   * athleteId ->
   *   [heightCm, birthYear, gender, wikipediaLanguages, citizenships, birthCity, bornInCapital]
   */
  type Entry = [
    number | null,
    number | null,
    string | null,
    number | null,
    number | null,
    string | null,
    0 | 1,
    string | null,
  ];
  const entries: Record<string, Entry> = {};
  let heights = 0;
  let births = 0;
  let genders = 0;
  let reach = 0;
  let cities = 0;
  let duals = 0;
  let placed = 0;

  for (const athlete of ATHLETES) {
    const best = chosen.get(athlete.id);
    if (!best) continue;

    const extra = extras.get(best.qid);
    const height = medianHeight(best.heights);
    const birthYear = best.birthYear ?? null;
    const gender = best.gender ?? null;
    // Sitelinks = how many language Wikipedias carry an article. A free,
    // stable proxy for global fame, and already fetched for disambiguation.
    const sitelinks = best.sitelinks > 0 ? best.sitelinks : null;
    const citizenships = extra?.citizenships && extra.citizenships > 0 ? extra.citizenships : null;
    const birthCity = extra?.birthCity ?? null;
    const bornInCapital: 0 | 1 = extra?.bornInCapital ? 1 : 0;
    const positions = extra && extra.positions.size > 0 ? [...extra.positions].sort().join('/') : null;

    if (
      height === null && birthYear === null && gender === null &&
      sitelinks === null && citizenships === null && birthCity === null && positions === null
    ) continue;

    if (height !== null) heights++;
    if (birthYear !== null) births++;
    if (gender !== null) genders++;
    if (sitelinks !== null) reach++;
    if (birthCity !== null) cities++;
    if (citizenships !== null && citizenships > 1) duals++;
    if (positions !== null) placed++;

    entries[athlete.id] = [
      height, birthYear, gender, sitelinks, citizenships, birthCity, bornInCapital, positions,
    ];
  }

  const pct = (n: number) => `${Math.round((100 * n) / ATHLETES.length)}%`;
  const output = {
    $schema:
      'athleteId -> [heightCm, birthYear, gender "f"|"m", wikipediaLanguages, citizenships, birthCity, bornInCapital 0|1, positions "a/b"] — null where unknown',
    source:
      'Wikidata (P2048 height, P569 birth, P21 gender, sitelinks, P27 citizenship, P19 birthplace, P36 capital-of-country, P413 position)',
    athletes: ATHLETES.length,
    withHeight: heights,
    withBirthYear: births,
    withGender: genders,
    withReach: reach,
    withBirthCity: cities,
    withDualNationality: duals,
    withPosition: placed,
    entries,
  };

  const target = resolve(process.cwd(), 'src/data/enrichment.json');
  writeFileSync(target, `${JSON.stringify(output, null, 0)}\n`, 'utf8');

  console.log(`matched      : ${Object.keys(entries).length} (${pct(Object.keys(entries).length)})`);
  console.log(`with height  : ${heights} (${pct(heights)})`);
  console.log(`with birth yr: ${births} (${pct(births)})`);
  console.log(`with gender  : ${genders} (${pct(genders)})`);
  console.log(`with reach   : ${reach} (${pct(reach)})`);
  console.log(`with city    : ${cities} (${pct(cities)})`);
  console.log(`dual nationals: ${duals} (${pct(duals)})`);
  console.log(`with position: ${placed} (${pct(placed)})`);
  console.log(`unmatched    : ${unmatched.length}${unmatched.length ? ` — ${unmatched.slice(0, 10).join(', ')}` : ''}`);
  console.log(
    `wrong sport  : ${wrongSport.length}${wrongSport.length ? ` — ${wrongSport.slice(0, 20).join(', ')}` : ''}`,
  );
  console.log(`wrote ${target}`);
}

main().catch((err) => {
  console.error('enrichment failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
