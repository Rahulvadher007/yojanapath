// One-off harvest: discover REAL scheme pages on official government domains
// via SerpApi, so new records are built from real sources rather than memory.
const fs = require('fs');
const path = require('path');
const https = require('https');

function loadEnv() {
  try {
    fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach((l) => {
      const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  } catch {}
}
loadEnv();
const KEY = process.env.SERPAPI_KEY;
if (!KEY) { console.error('no SERPAPI_KEY'); process.exit(1); }

function search(q) {
  return new Promise((res, rej) => {
    const url = 'https://serpapi.com/search.json?q=' + encodeURIComponent(q) + '&api_key=' + encodeURIComponent(KEY) + '&num=20&hl=en&gl=in';
    const r = https.get(url, { timeout: 15000 }, (x) => {
      let raw = ''; x.on('data', (c) => raw += c);
      x.on('end', () => { try { res(JSON.parse(raw).organic_results || []); } catch (e) { rej(e); } });
    });
    r.on('timeout', () => { r.destroy(); rej(new Error('timeout')); });
    r.on('error', rej);
  });
}
const NON_LATIN = /[ऀ-૿ঀ-৿਀-੿઀-૿଀-୿஀-௿ఀ-౿ಀ-೿ഀ-ൿ]/u;
const isOfficial = (h) => /\.gov\.in$/.test(h) || /\.nic\.in$/.test(h) || /\.gov\.[a-z]{2}$/.test(h) || h === 'mudra.org.in';

const QUERIES = [
  ['startup-funding', 'site:startupindia.gov.in government scheme funding'],
  ['startup-funding', 'site:mudra.org.in loan category shishu kishore tarun'],
  ['startup-funding', 'site:gujarat.gov.in startup policy assistance scheme'],
  ['startup-funding', 'site:myscheme.gov.in startup business loan scheme'],
  ['startup-funding', 'site:sidbi.in lending scheme entrepreneur'],
  ['startup-funding', 'site:india.gov.in business loan subsidy scheme'],
  ['health-coverage', 'site:nha.gov.in scheme Ayushman coverage'],
  ['health-coverage', 'site:nhrc.gov.in OR site:gujarat.gov.in health assurance scheme'],
  ['health-coverage', 'site:gujarat.gov.in ma yojana health scheme'],
  ['health-coverage', 'site:myscheme.gov.in health insurance scheme'],
  ['health-coverage', 'site:cdsco.gov.in senior citizen health insurance scheme'],
  ['health-coverage', 'site:gov.in Ayushman Bharat PM-JAY state health assurance']
];

(async () => {
  const out = { 'startup-funding': [], 'health-coverage': [] };
  const seen = new Set();
  for (const [domain, q] of QUERIES) {
    let res = [];
    try { res = await search(q); } catch (e) { console.error('FAIL', q, e.message); continue; }
    let kept = 0;
    for (const r of res) {
      const link = String(r.link || '').trim();
      const title = String(r.title || '').replace(/\s+/g, ' ').trim();
      const snippet = String(r.snippet || '').replace(/\s+/g, ' ').trim();
      if (!link || !title) continue;
      if (NON_LATIN.test(title) || NON_LATIN.test(snippet)) continue;
      let host = ''; try { host = new URL(link).hostname; } catch { continue; }
      if (!isOfficial(host)) continue;
      if (seen.has(link)) continue;
      seen.add(link);
      out[domain].push({ title, link, host, snippet: snippet.slice(0, 220) });
      kept++;
    }
    console.log(`${q}\n   -> ${res.length} raw, ${kept} kept`);
    await new Promise((r) => setTimeout(r, 400));
  }
  fs.writeFileSync(path.join(__dirname, 'harvest.json'), JSON.stringify(out, null, 2));
  console.log('\nTOTAL startup:', out['startup-funding'].length, ' health:', out['health-coverage'].length);
})();