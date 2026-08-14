# Ball Knowledge

A daily sports trivia grid. Nine cells, nine guesses: name an athlete who fits
both the row and the column. Rarer names score more, so filling the board is
only half the game.

```
                 FOOTBALL    TENNIS   FORMULA 1
NORTH AMERICA       +           +          +
SPAIN               +           +          +
SURNAME F           +           +          +
```

Rows mix regions, countries, birth decades, Wikipedia reach, origin stories
(dual nationals, capital-born, shared birth cities), name shapes and surname
initials; columns are sports, and which three appear changes day to day.

**Ambiguous headings explain themselves.** "Southern Europe" quietly includes
Spain and Portugal, and a player has no way to know that before spending a
guess — so those headings carry their member countries inline under the label,
open a panel when tapped, and restate the rule in the picker at the moment of
guessing. Self-evident headings ("Spain", "Surname F") get none of that.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 87 tests
npm run build      # typecheck, then bundle to dist/
```

The build output is a static site with no backend — the whole game, database
included, is ~65 KB gzipped.

### Why Vite 6 and not 8

**Do not upgrade Vite past 6.x without upgrading Node first.** Vite 7 and 8
require Node `^20.19.0 || >=22.12.0`; this machine runs 20.12.2. Vite 8 also
pulls in rolldown, whose native binding declares the same floor — and npm
*silently skips* optional dependencies whose engines do not match, so the binding
never installs and Vitest dies with a misleading "npm has a bug related to
optional dependencies" message. It is not an npm bug; it is the Node version.

Vite 6.4.3 ships the patched `esbuild ^0.25.0`, clears the advisory
(GHSA-67mh-4wv8-2f99) and runs on Node 20.12. `npm audit` reports zero
vulnerabilities on this pairing. Once Node is on 20.19+/22.12+, Vite 8 and
Vitest 4 become available.

## How it works

### Athletes are records, not per-cell lists

The original prototype hand-wrote a list of names for each region × sport cell.
That does not scale: adding a region means writing a new list per sport, and the
same player can drift between classifications.

Here each athlete is a record, and categories are predicates over those records.
A cell's pool is the intersection of two of them. This is what made tennis cheap
to add — one roster file plus one line in `sports.ts`, no engine changes — and
what makes a new axis a matter of adding categories.

Rosters live in [src/data/rosters/](src/data/rosters/) as pipe-delimited text:

```
Name | Country | pop | alias; alias
Sadio Mane|Senegal|30|Sadio Mané
```

`pop` is the rough percentage of players expected to name that athlete for their
cell. Rarity score is `100 - pop`, so an obvious pick is worth ~45 and a deep cut
~97. A malformed row throws at module load rather than disappearing silently.

Current database: **1686 athletes** — 611 football, 312 NBA, 264 UFC, 199 F1,
300 tennis, across 98 countries.

### Rows: 57 of them, in seven groups

| group | count | examples |
|---|---|---|
| Region | 9 | Africa, Nordic, Asia & Oceania |
| Country | 14 | Spain, Brazil, Serbia, Australia |
| Born decade | 5 | Born 1980s, Born 2000s |
| Surname initial | 20 | Surname K, Surname M, Surname S |
| Wikipedia reach | 2 | Global name, Deep cut |
| Origin | 3 | Dual national, Born in a capital, Shares a birth city |
| Name shape | 4 | Known by one name, Shared surname, Double letter |

`country → region` resolves through one table in [regions.ts](src/data/regions.ts),
so classification is auditable in one place. Country and letter rows are
**generated, not hand-listed**: a row only exists if it can field six answers in
at least three sports, so the set grows with the roster and can never contain a
heading no grid can use.

Three rules keep rows honest:

- Bands are **mutually exclusive**, so two can share a board without overlapping.
- An athlete with no birth year matches **no** decade row. Missing data costs
  pool depth; it never puts someone in the wrong row.
- Every board keeps at least one geographic row (region or country), because a
  grid of only letters and decades loses the hook the game is built on.

**Height rows were removed.** They asked players to guess something they don't
know, and they produced the two worst free squares on the board (409 and 276
valid answers). Height is still collected — it is simply not a row.

Single letters rather than A–C buckets: buckets are three times wider for no
extra interest ("A–C × Football" offered 115 answers, "M × Football" offers 56)
and single letters give 20 rows instead of 7.

**Wikipedia reach** counts how many language Wikipedias carry an article about
an athlete — a free, stable proxy for global fame, and the workable form of
"1M+ Instagram followers" (Wikidata records no follower counts, and a follower
threshold would rot as the number moved). It ranks exactly as a fame measure
should: Messi 223, Ronaldo 211, Pelé 181, Schumacher 171, Federer 159.

Only the two extremes are rows. The middle of the distribution is both enormous
(a 342-answer cell) and unguessable — nobody can tell 30 languages from 50 —
whereas "globally famous" and "obscure" are judgements a fan can actually make.
Athletes in the gap match neither row, exactly as an athlete with no birth year
matches no decade. Both bands stay under the wide-cell threshold, so reach adds
no free squares at all.

### Grids are chosen, not sampled

[grid.ts](src/engine/grid.ts) enumerates all 3×3 combinations, keeps the ones
where every intersection has at least 6 answers and at least 3 cells are
comfortable, then walks that catalogue in a seeded permutation:

- Every board is solvable. There is no "UK & Ireland × NBA" cell, because the
  roster has only four such players and the feasibility check rejects it.
- **60,173** boards are feasible, and none repeats over any realistic run.

There is also a **difficulty budget**. A cell offering 150+ valid answers is
near-free — almost any well-known name in that sport works — so at most one is
allowed per board. It is a budget rather than a ban because the friendlier rows
(a common surname letter, a big country) are legitimately broad. The median cell
went from 41 valid answers to 16.

Two things shape *which* board you get, and both exist because uniform sampling
produced boards that felt alike:

- **Stratified by shape.** Boards are served round-robin across the multiset of
  row kinds they use ("country+letter+region"), not uniformly across the
  catalogue. Uniform sampling makes a group's airtime proportional to how many
  rows it contains, so 20 letters took 40% of row slots while 2 reach bands took
  3%. Stratifying gives each *kind* of board equal exposure — across seven groups
  the spread is now regions 24%, countries 24%, decades 12%, name shapes 12%,
  origin 11%, letters 9%, reach 8%, and boards carrying a letter row fell from
  85% to 27%.
- **Football is weighted.** It is the sport most players know and has the
  deepest roster, so the catalogue is split on whether a board features it and
  each side walks its own permutation. Football headlines 86% of boards rather
  than its uniform 60%, while one board in seven still omits it.

Puzzle numbers count UTC days from `EPOCH_UTC`, so everyone gets the same board
on the same day, and progress survives a reload via `localStorage`.

## Enrichment pipeline

```bash
npx vite-node scripts/enrich-roster.ts     # regenerate src/data/enrichment.json
npx vite-node scripts/check-enrichment.ts  # spot-check known values
npx vite-node scripts/row-viability.ts     # pool size for every row x column
npx vite-node scripts/audit-categories.ts  # inventory, difficulty spread, reachability
npx vite-node scripts/sample-boards.ts     # what the next few daily boards look like
npx vite-node scripts/list-regions.ts      # every region and its member countries
npx vite-node scripts/list-unmatched.ts    # athletes with no enrichment data
npx vite-node scripts/analyze-axes.ts      # country vs region row depth
npx vite-node scripts/letters-and-balance.ts  # letter viability and sport balance
npx vite-node scripts/probe-axes.ts        # data coverage for candidate new axes
npx vite-node scripts/probe-gender.ts      # women per sport (see its caveat)
```

`enrichment.json` is **generated — do not hand-edit it**. It is committed so
builds stay offline and reproducible, and only needs regenerating when the
roster grows. Current coverage: **99% matched, 99% with a birth year, 99% with
gender, 99% with Wikipedia reach, 86% with height** — 14 athletes out of 1686
remain unresolved and simply carry no decade or reach band.

It runs in two passes. Pass 1 bulk-matches exact labels over SPARQL, which is
fast and resolves most of the roster. Pass 2 sends the stragglers through the
`wbsearchentities` API, which matches aliases and tolerates spelling drift —
"Sam Stosur" is an alias of "Samantha Stosur", and Wikidata's label for Arda
Güler begins with a Greek capital alpha, so exact matching can never hit it.
Pass 2 alone took unmatched from 63 to 13.

Four problems the script has to solve, each of which silently corrupts or loses
data if skipped:

1. **Units.** `wdt:P2048` returns a bare number, so metres, centimetres and
   inches are indistinguishable — Tacko Fall arrives as "93". Querying through
   the statement node returns the unit, and a sanity gate drops anything outside
   120–260 cm.
2. **Ambiguity.** Labels are not unique: "Michael Jordan" matches the
   basketballer *and* an English footballer. Candidates are scored on whether
   their Wikidata sport matches ours, then on Wikipedia sitelink count. A test
   asserts Jordan resolves to the 198 cm one.
3. **Unicode.** Our roster stores "Luka Modric" ASCII-folded while Wikidata has
   "Luka Modrić", and matching fails even on accented forms if one side is NFD
   and the other NFC. Every label is normalised to NFC before querying.
4. **Silent failure.** Network calls now throw and are retried instead of
   returning empty. An earlier version swallowed errors, so one 502 dropped a
   whole batch of 80 athletes and they resurfaced as "unmatched" — which looked
   like a name problem and was not. Missing retries on the search API were also
   why the unmatched count wobbled between runs.

## Data judgement calls

Athletes are placed by the nationality they are publicly identified with, not
birthplace: Embiid and Olajuwon in Africa, Adesanya under Nigeria, Chimaev under
Sweden, Nico Rosberg in Western Europe on his German licence. Navratilova and
Seles sit in North America, having won most of their majors as Americans, while
Lendl stays with Czechoslovakia. Türkiye and the South Caucasus group with
Eastern Europe, matching UEFA. All of it lives in one table.

## Layout

```
src/
  data/         rosters, regions, sports, parser, generated enrichment
  engine/       rng, categories, pools, grid, game, scoring, search, storage, share
  ui/           board, picker sheet, results, app wiring
scripts/        enrichment and data-analysis tools (not part of the build)
tests/          data integrity, enrichment, grid feasibility, game rules, search, DOM
```

The engine has no DOM dependency and the UI holds no game rules.
`tests/app.dom.test.ts` mounts the real `index.html` under jsdom and plays a full
board through actual clicks, catching markup drift a typecheck cannot.

## Ideas not yet built

- **Champion row.** "Won the sport's top prize", resolving per column — World
  Cup for football, a Grand Slam for tennis, the drivers' title for F1. The row
  label must resolve to the concrete trophy in the picker, or players will type
  Cristiano Ronaldo (never a World Cup winner) and feel cheated.
- **More sports.** The strongest remaining variety lever: going from 5 to 7
  columns takes column combinations from 10 to 35 and deepens every row at once.
- **Women's row.** Gender is already collected (99%). Blocked on the NBA column
  being structurally men-only: renaming it "Basketball" and adding ~25 WNBA
  players takes the row from 3 viable columns to 4. F1 will never qualify —
  five women have ever started a Grand Prix.
- **Sporting families.** Schumacher, Gasol, Williams, the Diaz brothers. Works
  in all five sports and rewards real fandom; needs hand-curated tags.
- **Visual headings.** Flags work for the 14 country rows, but regions, decades
  and letters need icons or typography instead — and league logos are
  trademarks, so custom pictograms are the safer route.
- **Measured rarity.** Replace hand-tuned `pop` with what players actually guess.

Rejected with reasons: **handedness** (21% coverage, and zero for UFC) and
**height rows** (guessing, not knowing).
