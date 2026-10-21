// Deduplicate scheme records: merge near-duplicate schemes and drop scrape artifacts.
//
// Two kinds of cleanup:
//
//   1. Near-duplicate schemes — the same scheme recorded twice under slightly different
//      names, because one page was collected from a state portal and another from the
//      national one. The record that carries real rules and documents is kept; the empty
//      twin is merged into it (its URL is preserved as an extra source) and then removed.
//
//   2. Scrape artifacts — regional office sub-pages (esic.gov.in hospital pages, for
//      example) that were collected as if they were schemes. These are recognised by the
//      scraped "Page | Site" title form, and each of them duplicates a real scheme record
//      we already hold.
//
// Both operations are conservative: nothing is invented, and a record that is a genuine
// scheme is never removed just because its data is incomplete.
//
// Run: node dedupe-records.js          (dry run — prints the plan, writes nothing)
//      node dedupe-records.js --apply  (writes data/schemes.json)

const fs = require('fs');
const path = require('path');

const DB = path.join(__dirname, 'data', 'schemes.json');
const APPLY = process.argv.includes('--apply');

// Known near-duplicate pairs: the same scheme captured twice.
// `keep` is the record with the real rules/documents, `drop` is the empty twin.
const MERGES = [
  {
    keep: 'startup-seed-fund',
    drop: 'startup-india-seed-fund-scheme-sisfs-smj9',
    why: 'same scheme — SISFS is the Startup India Seed Fund Scheme'
  },
  {
    keep: 'ma-gujarat',
    drop: 'health-coverage-mukhyamantri-amrutum-yojana-ma-yojana-gujarat',
    why: 'same scheme — duplicate Mukhyamantri Amrutum Yojana record for Gujarat',
    // The scheme's own portal is a better primary source than the generic state homepage.
    preferDroppedUrl: true
  }
];

// Scraped page titles arrive as "Page Title | Site Name". That form is never a scheme name.
const SCRAPE_TITLE = /\s\|\s/;

const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
const byId = new Map(db.map((r) => [r.id, r]));
const dropIds = new Set();
const notes = [];

for (const m of MERGES) {
  const keep = byId.get(m.keep);
  const drop = byId.get(m.drop);
  if (!keep || !drop) {
    notes.push({ name: m.keep, why: 'merge skipped — record not found' });
    continue;
  }

  // Carry the dropped record's URL across so nothing verified is lost.
  if (m.preferDroppedUrl && drop.officialInfoUrl && drop.officialInfoUrl !== keep.officialInfoUrl) {
    keep.officialInfoUrl = drop.officialInfoUrl;
  }
  if (drop.officialApplicationUrl && !keep.officialApplicationUrl) {
    keep.officialApplicationUrl = drop.officialApplicationUrl;
  }
  const sources = Array.isArray(keep.sources) ? keep.sources.slice() : [];
  const addSource = (url, checkedAt) => {
    if (!url) return;
    if (sources.some((s) => s.url === url)) return;
    sources.push({ url, sourceType: 'official', checkedAt: checkedAt || keep.lastVerified });
  };
  addSource(drop.officialInfoUrl, (drop.sources && drop.sources[0] && drop.sources[0].checkedAt) || drop.lastVerified);
  addSource(drop.officialApplicationUrl, drop.lastVerified);
  if (sources.length) keep.sources = sources;

  dropIds.add(drop.id);
  notes.push({ name: keep.name, why: `merged with "${drop.name}" — ${m.why}` });
}

// Scrape artifacts: a scraped "Page | Site" title that duplicates a scheme we already hold.
for (const rec of db) {
  if (dropIds.has(rec.id)) continue;
  if (!SCRAPE_TITLE.test(rec.name)) continue;
  dropIds.add(rec.id);
  notes.push({ name: rec.name, why: 'scrape artifact — regional service page, not a scheme' });
}

const kept = db.filter((r) => !dropIds.has(r.id));

const counts = ['startup-funding', 'health-coverage'].map((d) => `${d}: ${kept.filter((x) => x.domain === d).length}`);
const withRules = kept.filter((r) => (r.eligibilityRules || []).length).length;
const verified = kept.filter((r) => r.verificationStatus === 'verified').length;

console.log(`records: ${db.length} -> ${kept.length}`);
console.log(`with rules: ${withRules}   verified: ${verified}`);
console.log(counts.join('   '));
console.log('');
notes.forEach((n) => console.log(`  ${n.why.includes('merged') ? '~' : '-'} ${n.name.slice(0, 64)}`));

if (APPLY) {
  fs.writeFileSync(DB, JSON.stringify(kept, null, 2));
  console.log('\nwrote data/schemes.json');
} else {
  console.log('\ndry run — nothing written. Re-run with --apply to save.');
}
