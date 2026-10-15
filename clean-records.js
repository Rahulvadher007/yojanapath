// Clean up records that are not schemes: raw-URL titles, circulars, duplicate names.
const fs = require('fs');
const path = require('path');
const DB = path.join(__dirname, 'data', 'schemes.json');
const db = JSON.parse(fs.readFileSync(DB, 'utf8'));

const JUNK_TITLE = /^(https?:\/\/)|policy and guidelines|^\s*-\s|annual report|user manual/i;
const seenNames = new Set();
const kept = [];
const removed = [];

for (const rec of db) {
  const name = String(rec.name || '').trim();
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (JUNK_TITLE.test(name)) { removed.push({ name, why: 'not a scheme page' }); continue; }
  if (seenNames.has(key)) { removed.push({ name, why: 'duplicate name' }); continue; }
  seenNames.add(key);
  kept.push(rec);
}

fs.writeFileSync(DB, JSON.stringify(kept, null, 2));
console.log(`kept ${kept.length}, removed ${removed.length}`);
removed.forEach((r) => console.log(`  - ${r.name.slice(0, 62)}  (${r.why})`));
['startup-funding', 'health-coverage'].forEach((d) => console.log(`  ${d}: ${kept.filter((x) => x.domain === d).length}`));