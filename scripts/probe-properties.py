"""
Investigation: which Wikidata properties are actually populated for players at
our roster's fame level? Coverage is the whole question -- a property that is
fascinating and 20% populated cannot carry a row, because a gap silently means
"does not match" and the cell quietly shrinks.

One query per property against two fixed populations, so the numbers are
comparable across properties.
"""
import json
import subprocess
import time

ENDPOINT = "https://query.wikidata.org/sparql"
UA = "ball-knowledge-research/1.0 (category investigation; contact via github.com/otduman)"

# Populations chosen to sit at roughly our roster's fame level.
POPS = {
    "football": """?p wdt:P106 wd:Q937857 . ?p wikibase:sitelinks ?sl . FILTER(?sl >= 60)""",
    "nba": """?p wdt:P54 ?tm . ?tm wdt:P118 wd:Q155223 . ?p wikibase:sitelinks ?sl . FILTER(?sl >= 15)""",
}

# label -> the triple pattern that counts as "has this fact"
PROPS = [
    ("P54  club / team",            "?p wdt:P54 ?v"),
    ("P2031 career start year",     "?p wdt:P2031 ?v"),
    ("P2032 career end year",       "?p wdt:P2032 ?v"),
    ("P166 award received",         "?p wdt:P166 ?v"),
    ("P1344 participant in",        "?p wdt:P1344 ?v"),
    ("P413 position played",        "?p wdt:P413 ?v"),
    ("P1618 sport number (jersey)", "?p wdt:P1618 ?v"),
    ("P2067 mass",                  "?p wdt:P2067 ?v"),
    ("P69  educated at",            "?p wdt:P69 ?v"),
    ("P3373 sibling",               "?p wdt:P3373 ?v"),
    ("P22  father",                 "?p wdt:P22 ?v"),
    ("P1449 nickname",              "?p wdt:P1449 ?v"),
    ("P1412 languages spoken",      "?p wdt:P1412 ?v"),
    ("P570 date of death",          "?p wdt:P570 ?v"),
    ("P26  spouse",                 "?p wdt:P26 ?v"),
    ("P1532 country for sport",     "?p wdt:P1532 ?v"),
    ("P6509 total goals",           "?p wdt:P6509 ?v"),
    ("P1350 matches played",        "?p wdt:P1350 ?v"),
    ("P734 family name",            "?p wdt:P734 ?v"),
    ("P103 native language",        "?p wdt:P103 ?v"),
]


def ask(query, tries=3):
    # curl rather than urllib: this machine's Python CA bundle has an expired
    # root and rejects query.wikidata.org, while curl's store is current.
    for attempt in range(tries):
        proc = subprocess.run(
            ["curl", "-s", "-m", "120", "-G",
             "-H", "Accept: application/sparql-results+json",
             "-H", f"User-Agent: {UA}",
             "--data-urlencode", f"query={query}", ENDPOINT],
            capture_output=True, text=True,
        )
        if proc.returncode == 0 and proc.stdout.strip().startswith("{"):
            try:
                return json.loads(proc.stdout)
            except json.JSONDecodeError:
                pass
        if attempt == tries - 1:
            return {"error": (proc.stdout or proc.stderr or "no response")[:200]}
        time.sleep(5 * (attempt + 1))
    return {"error": "unreachable"}


def count(pop_pattern, prop_pattern=None):
    inner = pop_pattern if prop_pattern is None else f"{pop_pattern} . {prop_pattern}"
    q = f"SELECT (COUNT(DISTINCT ?p) AS ?n) WHERE {{ {inner} }}"
    res = ask(q)
    if "error" in res:
        return None
    try:
        return int(res["results"]["bindings"][0]["n"]["value"])
    except (KeyError, IndexError):
        return None


totals = {}
for name, pat in POPS.items():
    totals[name] = count(pat)
    print(f"population {name}: {totals[name]}", flush=True)

print("\nproperty                        football        nba", flush=True)
for label, pat in PROPS:
    row = []
    for pop in POPS:
        n = count(POPS[pop], pat)
        t = totals[pop]
        row.append("err" if n is None or not t else f"{n:6d} ({100*n//t:3d}%)")
    print(f"  {label.ljust(28)} {row[0]}  {row[1]}", flush=True)
    time.sleep(1)
