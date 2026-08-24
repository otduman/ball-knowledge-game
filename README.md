# Ball Knowledge

A daily football and basketball board that opens one row at a time. Two columns,
six rows: name an athlete who fits both, fill the row, and the next one opens
beneath it — narrower than the one above.

```
              FOOTBALL   NBA
EASTERN EUROPE   +        +     ▚▚▚▚▚▚   87 / 75 answers
SHORT SURNAME    +        +     ▚▚▚▚▚·   79 / 31
AFRICA           +        +     ▚▚▚▚··   57 / 26
SURNAME H        +        +     ▚▚▚···   32 / 15
BORN IN 1993     +        +     ▚▚····   24 / 11
BORN IN 1979     +        +     ▚·····   11 / 8
```

Fifteen guesses for the whole board, right or wrong. How far down you get is the
score; rarity is the tiebreaker.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 89 tests
npm run build      # typecheck, then bundle to dist/
```

The build output is a static site with no backend — the whole game, database
included, is ~76 KB gzipped.

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
what makes a new axis a matter of adding categories. A whole row of the board is
a pool window plus a group cap: see [levels.ts](src/engine/levels.ts).

Rosters live in [src/data/rosters/](src/data/rosters/) as pipe-delimited text:

```
Name | Country | pop | alias; alias
Sadio Mane|Senegal|30|Sadio Mané
```

`pop` is the rough percentage of players expected to name that athlete for their
cell. Rarity score is `100 - pop`, so an obvious pick is worth ~45 and a deep cut
~97. A malformed row throws at module load rather than disappearing silently.

Current database: **1885 athletes** — 730 football, 384 NBA, 264 UFC, 199 F1,
300 tennis. Football and the NBA are the two columns; the other rosters are kept
because the row generators are sport-agnostic and cost nothing to leave in.

### Rows

| group | examples |
|---|---|
| **Blend — two conditions at once** | Eastern Europe · 1980s, Africa · Dual national, 1990s · Capital-born |
| Region | Africa, Eastern Europe, Asia & Oceania |
| Country | 22 of them: Latvia, Lithuania, Slovenia, Greece, Ukraine, China... |
| Born decade | Born pre-1970, Born 2000s |
| Born in an exact year / pair | Born in 1986, Born in 1982 or 1983 |
| **Born in a tournament year** | World Cup year, Olympic year |
| Surname / given-name initial | Surname E, Given name S |
| Surname ending letter | Surname ends C, Surname ends T |
| **Surname contains a letter** | Surname has Z, Surname has J, Surname has W |
| **Height** | 190-194cm, 193-195cm |
| Wikipedia reach | Global name, Deep cut |
| Origin | Dual national, Born in a capital, Shares a birth city |
| Name shape | Known by one name, Three-part name, Surname bookends |

`country -> region` resolves through one table in [regions.ts](src/data/regions.ts),
so classification is auditable in one place. Country, letter and year rows are
**generated, not hand-listed**: the set grows with the roster and can never
contain a heading no board can use.

**Two families carry the tight rows, and neither needed new data.** Exact birth
years and, alongside them, pairs of consecutive years — 35 of those field six a
side, landing in the 12-40 window rows 3 and 4 draw from. A pair strictly
contains its two singles, so the builder rejects any row whose answers nest
inside a row already on the board; without that check a board could ask "Born in
1990" and "Born in 1990 or 1991" in one breath. The third addition is the letter
a surname *ends* with: a different question from the letter it starts with, and
16 of the 26 are viable.

**Exact birth years are what made the deep end work.** Depth needs rows that are
narrow in *both* columns, and almost nothing is — regions, decades, origin
stories and name shapes are all broad in football, so below the ~30-answer line
the board collapsed onto surname letters and small countries, 84% of deep row
slots between them. An exact year is narrow by construction: 22 of them field
six or more in both sports and 21 of those sit entirely under 30 answers. It
needed no new data at all. Years share the `era` group with the decade bands so
that "Born 1980s" can never appear beside "Born in 1985".

**Blends are what stopped the board being a spelling test.** Dates and letters
were 64% of every row slot — the two least interesting things you can ask about
an athlete. A blend asks two conditions at once ("from Eastern Europe *and* born
in the eighties"), which is a different and harder act than either alone: 35 are
viable and 27 fit a window, spread across all six rows. Only pairings that read
as one question are generated — a region and an era is a person you can picture,
a surname letter and a citizenship count is two questions stapled together. A
blend is a strict subset of both its parents, so the same nesting check that
separates a year from its pair keeps "Africa" off a board showing "Africa ·
1990s". They carry their own group, so the per-group cap stops a board becoming
nothing but compounds. Dates and letters are now 57%.

Two smaller additions came out of the same measurement. **Tournament years** —
World Cups fall on years ≡ 2 mod 4 and summer Olympics on ≡ 0 mod 4, so the two
rows are disjoint by construction — are broad on both sides, which is what row
one wants and what almost nothing else offers: it went from 22 candidates to 33.
And the letter a surname *contains*, for the eight uncommon letters only; the
common ones are viable but useless, since "Surname has A" is 438 footballers.

Things measured and rejected: **birth cities as rows** (not one city has six
players in both football and the NBA), **surname length** (only one band is
narrow enough), **fame from the `pop` field** (unanswerable at the boundary —
a player cannot judge whether someone is famous *enough*), **cross-sport
clubs**, **jersey numbers**, **US college**, **handedness**. Height was
rejected once and revived: no *threshold* is playable, because "under 185cm" is
446 footballers and 8 NBA players and fits no window, but the narrow band where
the two distributions overlap works and gives two rows.

### Rows open one at a time

[levels.ts](src/engine/levels.ts) defines each row as a pool window. What makes
a row hard is the **ceiling** on how many answers a cell accepts, not the floor:

| row | window | candidates | tightest cell, median |
|---|---|---|---|
| 1 | 32-300 | 33 | 46 |
| 2 | 24-110 | 53 | 29 |
| 3 | 16-70 | 74 | 20 |
| 4 | 11-40 | 85 | 13 |
| 5 | 8-24 | 56 | 10 |
| 6 | 6-17 | 62 | 6 |

A ceiling rather than a floor because two columns of football and basketball —
the two deepest rosters in the game — are *easier* than a five-sport 3x3, not
harder. Fewer columns is fewer places to hide, not a harder question.

**The windows overlap on purpose.** Disjoint bands looked tidier but starved the
top three rows at ten candidates each, so the same headings came round every few
days. Overlapping them roughly doubles the candidates, and the board stays
honest because [grid.ts](src/engine/grid.ts) requires each row to be strictly
tighter than the row above rather than trusting the bands to arrange it. That is
the promise the difficulty ticks make, so it is a test rather than a convention.

Rows are drawn one per window from a seeded shuffle, not enumerated as whole
boards: the product of six windows is far too large to enumerate and there is
nothing to enumerate *for*, since the rows are chosen independently. The
consequence is that two distant days can collide by chance — the guarantee that
holds, and that the tests assert, is no repeat within any month and at least 360
distinct boards a year.

## Enrichment pipeline

```bash
npx vite-node scripts/enrich-roster.ts     # regenerate src/data/enrichment.json
npx vite-node scripts/check-enrichment.ts  # spot-check known values
npx vite-node scripts/row-viability.ts     # pool size for every row x column
npx vite-node scripts/probe-dive.ts        # windows, airtime, sample boards, repeat horizon
npx vite-node scripts/category-stats.ts    # what rows exist, per group, and how often they air
npx vite-node scripts/sample-boards.ts     # read a few boards the way a player meets them
npx vite-node scripts/merge-roster.ts <batches.json> [--dry]  # validated roster merge
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
gender, 99% with Wikipedia reach, 87% with height** — 20 athletes out of 1885
remain unresolved and simply carry no decade or reach band.

The run also reports a **sport mismatch** list: names whose Wikidata entity plays
a different sport from the roster file they sit in. This is the failure mode a
roster addition actually has — a fabricated name fails to resolve at all and
lands in `unmatched`, but a footballer filed under the NBA resolves perfectly and
is then wrong in every cell. Treat it as advisory: P641 is inconsistently
populated, so obvious footballers (Sergio Ramos, Rafael Marquez) and most F1 and
UFC entries appear there too. It earned its keep by surfacing Satnam Singh, who
was drafted but never played an NBA game and has been removed.

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
  engine/       rng, categories, modes, pools, grid, game, scoring, search, storage, share
  ui/           board, picker sheet, results, app wiring
scripts/        enrichment and data-analysis tools (not part of the build)
tests/          data integrity, enrichment, grid feasibility, duel mode, game rules, search, DOM
```

The engine has no DOM dependency and the UI holds no game rules.
`tests/app.dom.test.ts` mounts the real `index.html` under jsdom and plays a full
board through actual clicks, catching markup drift a typecheck cannot.

## Ideas not yet built

- **Unlockable difficulty layers.** A layer is an allowed set of category groups
  plus a `minPool` floor — both already fields on a mode, so the machinery
  exists. Early layers stay wide (regions and countries at 15+ answers a cell);
  later ones unlock the name-shape and origin rows and drop the floor to 4.
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

Rejected with reasons: **handedness** (21% coverage, and zero for UFC),
**height rows** (guessing, not knowing), and **cross-sport clubs** — the row that
originally motivated the duel. Real Madrid's football and basketball sections are
separate Wikidata items with no shared parent, and across a 240-athlete sample
exactly one club QID was naturally shared. Real Madrid works with hand-mapped
QIDs; Barcelona, Bayern, Beşiktaş, Fenerbahçe and Benfica all appear in both
sports and none reaches six on both sides. That is one row, not a family.
