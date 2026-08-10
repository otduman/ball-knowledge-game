import data from '../src/data/enrichment.json';
import { ATHLETES } from '../src/data/rosters';
const e = data.entries as Record<string, unknown>;
const missing = ATHLETES.filter(a => !e[a.id]);
console.log(`unmatched: ${missing.length}`);
for (const a of missing) console.log(`  ${a.sport.padEnd(9)} ${a.name}  [aliases: ${a.aliases.join('; ') || 'none'}]`);
