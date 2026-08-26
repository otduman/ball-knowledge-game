# Ball Knowledge

A daily football and basketball board that opens one row at a time. Two columns,
six rows: name an athlete who fits both, fill the row, and the next one opens
beneath it — narrower than the one above.

```
                     FOOTBALL   NBA
PLAYS UP FRONT          +        +    1/6   279 / 166 answers
WESTERN EUROPE          +        +    2/6    99 / 41
FORMER YUGOSLAVIA       +        +    3/6    33 / 44
RUNS THE PLAY · AFRICA  +        +    4/6    23 / 15
SERBIA                  +        +    5/6     9 / 17
LONG FULL NAME          +        +    6/6    12 / 7
```

Fifteen guesses for the whole board, right or wrong. How far down you get is the
score; rarity is the tiebreaker.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 92 tests
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
A cell's pool is the intersection of two of them. This is what made adding a
whole sport cheap — one roster file plus one line in `sports.ts`, no engine
changes — and, when three of them were cut again, what made removing one cheap
too. It is also what makes a new axis a matter of adding categories. A whole row of the board is
a pool window plus a group cap: see [levels.ts](src/engine/levels.ts).

Rosters live in [src/data/rosters/](src/data/rosters/) as pipe-delimited text:

```
Name | Country | pop | alias; alias
Sadio Mane|Senegal|30|Sadio Mané
```

`pop` is the rough percentage of players expected to name that athlete for their
cell. Rarity score is `100 - pop`, so an obvious pick is worth ~45 and a deep cut
~97. A malformed row throws at module load rather than disappearing silently.

Current database: **1374 athletes** — 811 football, 563 NBA, and nothing else.
UFC, Formula 1 and tennis were removed: 763 athletes and 40% of the shipped data
that no board could ever reach on a two-column game. The bundle fell from 79 KB
to 65 KB gzipped in the same commit that added 260 players.

### Rows

| group | examples |
|---|---|
| **Blend — two conditions at once** | Former Yugoslavia · 1990s, Runs the play · Africa, 1980s · Dual national |
| **Country cluster** | Former Yugoslavia, Former Soviet Union, Baltic states, West Africa |
| Role — the same job in both sports | Plays up front, Runs the play, Holds the back |
| Region | Africa, Eastern Europe, Asia & Oceania |
| Country | 22 of them: Latvia, Lithuania, Slovenia, Greece, Ukraine, China... |
| Born decade | Born pre-1970, Born 2000s |
| Surname / given-name initial | Surname E, Given name S |
| Surname ending letter | Surname ends C, Surname ends T |
| Surname contains a letter | Surname has Z, Surname has J, Surname has W |
| Height | 190-194cm, 193-195cm |
| Wikipedia reach | Global name, Deep cut |
| Origin | Dual national |
| Name shape | Known by one name, Three-part name, Surname bookends |

`country -> region` resolves through one table in [regions.ts](src/data/regions.ts),
so classification is auditable in one place. Country and letter rows are
**generated, not hand-listed**: the set grows with the roster and can never
contain a heading no board can use.

**Clusters group countries the way the two sports actually talk about them.**
"Western Europe" is a cartographer's bucket; "the former Yugoslavia" is a thing
fans of both games have opinions about, and it is one of the very few groupings
deep on both sides of this board — 33 footballers against 44 NBA players. The
former Soviet Union is 35 and 33, the Baltic states 16 and 16. These are
hand-written rather than generated, because the whole point is that a person
decided these countries belong together.

Every cluster names its members under the heading, and so does every region: a
grouping whose membership you have to guess is worse than no grouping. The lists
are ordered by roster depth rather than alphabetically, because they get
truncated to fit and the first names are the whole message — alphabetical made
"Eastern Europe" read *"Albania, Armenia, Azerbaijan +20"*, three countries with
four players between them, hiding Serbia, Croatia and Ukraine.

**Blends are what stopped the board being a spelling test.** A blend asks two
conditions at once ("from the former Yugoslavia *and* born in the nineties"),
which is a different and harder act than either alone. They are a declared
product of places, periods, roles and citizenship: 89 are viable, spread across
all six rows and the largest group on the board. Only pairings that read as one
question are generated — a place and an era is a person you can picture, a
surname letter and a citizenship count is two questions stapled together. A
blend is a strict subset of both its parents, so a nesting check keeps
"Eastern Europe" off any board showing "Eastern Europe · 1980s". They carry
their own group, so the per-group cap stops a board becoming nothing but
compounds.

**Roles are the only rows where the two columns rhyme.** A midfielder and a
point guard are the same idea in two different games, and no other row can ask
that. Wikidata's P413 is ~98% populated in both sports, but they use entirely
separate entities — football's forward is `Q280658`, the NBA's small forward is
`Q308879` — so there is no shared value to key on and the bridge is drawn by
hand in [categories.ts](src/engine/categories.ts). Positions are stored raw
rather than pre-bucketed, so that mapping can be rethought without another
fetch, and filtered to a vocabulary on the way in because P413 is not confined
to the sport an athlete is filed under: Michael Jordan carries `outfielder`.

On their own the three roles are broad enough for row one and nothing else —
279 forwards in football, 166 in the NBA — so blending is what carries them
down the board. "At the back · Eastern Europe" is 24 and 40.

### Cut after playing rather than measuring

Six families were measured as viable, shipped, and then removed because they
were not *fun*. Viability is a floor, not a reason.

| cut | was | why |
|---|---|---|
| Exact birth years | 32 rows | Nobody enjoys recalling a birth year to the year |
| Consecutive year pairs | 33 rows | Same, with extra bookkeeping |
| World Cup / Olympic year | 2 rows | A cute rule that reads as arbitrary in play |
| Shares a birth city | 1 row + 14 blends | The pairings that justify it are invisible from the heading |
| Born in a capital | 1 row + 11 blends | A fact about a city, not about an athlete |
| Triple national | 1 row | Viable at 7 and 8, and unguessable |

That is 65 of 72 date rows gone. They had been carrying the deep end — the
windows for rows 3 and 4 fell from 96 and 108 candidates to 60 and 74. The
roster expansion that followed took them back to 72 and 81.

Row six went the other way, 62 candidates down to 54, and that is not a
regression to fix by adding more players: a bigger roster pushes rows *out* of
the tight 6-17 band from below. The bottom of a six-row board is the part the
data struggles to feed.

Things measured and rejected before shipping: **birth cities as rows**,
**surname length**, **fame from the `pop` field** (unanswerable at the
boundary), **cross-sport clubs**, **jersey numbers**, **US college**,
**handedness**. Height was rejected once and revived: no *threshold* is playable,
because "under 185cm" is 446 footballers and 8 NBA players and fits no window,
but the narrow band where the two distributions overlap works and gives two rows.

### The picker confirms a name, it does not supply one

`MIN_QUERY_LENGTH` is four. At two characters the search was answering the
board: typing "ha" listed Haaland, Harden and Hardaway, so a cell you could not
name was solvable by trying a couple of letters and reading the options. Four
means you arrive with a name in mind and the list checks your spelling. The
result list is five long rather than eight for the same reason, and the sheet
says why it is empty while the query is still short — a silent box reads as "no
such player" and the guess gets abandoned.

### Rows open one at a time

[levels.ts](src/engine/levels.ts) defines each row as a pool window. What makes
a row hard is the **ceiling** on how many answers a cell accepts, not the floor:

| row | window | candidates | tightest cell, median |
|---|---|---|---|
| 1 | 32-300 | 63 | 46 |
| 2 | 24-110 | 71 | 29 |
| 3 | 16-70 | 72 | 20 |
| 4 | 11-40 | 81 | 13 |
| 5 | 8-24 | 59 | 10 |
| 6 | 6-17 | 54 | 6 |

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
roster grows. Current coverage: **99% matched, 98% with a birth year, 99% with
gender, 98% with Wikipedia reach, 97% with a birth city, 87% with height** — 23
athletes out of 1885 remain unresolved and simply carry no decade or reach band.

Positions (P413) read 55% across the whole database, which is the wrong number
to look at: the other three rosters play neither football nor basketball. Across
the two columns that are actually on the board it is **91% of footballers and
95% of NBA players**, and a test asserts that floor because the role rows are
the first family built on a fetched field that is not near-universal.

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
