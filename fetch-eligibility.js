// Fetch each record's real official page and extract the eligibility language it
// actually publishes. Stored as documentedEligibility (quoted, with source) so the
// UI can show REAL conditions instead of a bare "not verified".
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DB = path.join(__dirname, 'data', 'schemes.json');
const db = JSON.parse(fs.readFileSync(DB, 'utf8'));

function get(url, depth = 0) {
  return new Promise((resolve) => {
    if (depth > 4) return resolve(null);
    let mod = url.startsWith('http://') ? http : https;
    const r = mod.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (YojanaPath; scheme verification)', 'Accept-Language': 'en' } }, (x) => {
      if (x.statusCode >= 300 && x.statusCode < 400 && x.headers.location) { x.resume(); return resolve(get(new URL(x.headers.location, url).href, depth + 1)); }
      if (x.statusCode !== 200) { x.resume(); return resolve(null); }
      let raw = ''; x.setEncoding('utf8');
      x.on('data', (c) => raw += c);
      x.on('end', () => resolve(raw));
    });
    r.on('timeout', () => { r.destroy(); resolve(null); });
    r.on('error', () => resolve(null));
  });
}

const text = (h) => h
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ').trim();

const ELIG = /(eligible|eligibility|who can apply|applicant|beneficiar|coverage|entitled|qualif|must (?:be|have|reside|belong)|criteria|age (?:of|between|upto|up to)|income|occupation|residen)/i;
const NOISE = /(cookie|javascript is disabled|enable javascript|browser|404|page not found|access denied)/i;

function sentences(t) {
  return t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}
// Must read as a stated condition, not marketing copy or a case study.
const STRONG = /(eligible for|eligibility (?:criteria|condition)|is eligible|are eligible|who can (?:apply|avail)|must be (?:an?|of|residing|between|having)|persons? (?:aged|residing|belonging|having)|aged (?:between|above|below|up ?to|not exceeding)|annual (?:family )?income|family income|occupation (?:of|belonging)|beneficiaries? (?:are|will be|shall)|coverage under|shall be (?:covered|eligible)|entitled to)/i;
// Narrative / promotional text that keyword matching wrongly captures.
const NARRATIVE = /\b(she|he|her|his|beneficiary under|branch|bank officer|explained|motivated|success story|testimonial|case study|Rs\.\s?\d|loan of Rs|visited|approached)\b/i;
function extract(t) {
  const out = [];
  for (const s of sentences(t)) {
    if (s.length < 45 || s.length > 300) continue;
    if (NOISE.test(s) || NARRATIVE.test(s)) continue;
    if (!STRONG.test(s)) continue;
    if (!ELIG.test(s)) continue;
    if (out.includes(s)) continue;
    out.push(s);
    if (out.length >= 4) break;
  }
  return out;
}

(async () => {
  const todo = db.filter((s) => !(s.eligibilityRules || []).length);
  let ok = 0, fail = 0, withText = 0;
  for (const rec of todo) {
    process.stdout.write(`- ${rec.name.slice(0, 54).padEnd(54)} `);
    const html = await get(rec.officialInfoUrl);
    if (!html) { console.log('FETCH FAILED'); fail++; continue; }
    ok++;
    const t = text(html);
    const hits = extract(t);
    if (hits.length) {
      withText++;
      rec.documentedEligibility = hits;
      rec.eligibilityExtractedAt = new Date().toISOString().slice(0, 10);
      console.log(`${hits.length} condition line(s)`);
    } else {
      rec.documentedEligibility = [];
      console.log('page fetched, no eligibility text found');
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
  console.log(`\nfetched ${ok}, failed ${fail}, records with real eligibility text: ${withText}/${todo.length}`);
})();