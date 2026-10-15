// Bulk ingest: search every official source across both pathways and add the
// candidates to data/schemes.json through the real admin endpoint (so the same
// validation runs). Records land as "conditions not yet verified".
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BASE = 'http://localhost:3000';
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

const SOURCES = {
  'startupindia.gov.in': 'site:startupindia.gov.in government scheme funding startup',
  'mudra.org.in': 'site:mudra.org.in loan scheme category eligibility',
  'financialservices.gov.in': 'site:financialservices.gov.in loan scheme for business enterprise',
  'india.gov.in': 'site:india.gov.in business loan subsidy scheme entrepreneur',
  'gujarat.gov.in': 'site:gujarat.gov.in startup scheme assistance policy',
  'sidbi.in': 'site:sidbi.in scheme lending entrepreneur',
  'nha.gov.in': 'site:nha.gov.in scheme Ayushman health cover eligibility beneficiary',
  'pmjay.gov.in': 'site:pmjay.gov.in scheme eligibility beneficiary',
  'ma.gujarat.gov.in': 'site:ma.gujarat.gov.in yojana scheme eligibility',
  'esic.gov.in': 'site:esic.gov.in scheme medical benefit contribution',
  'myscheme.gov.in': 'site:myscheme.gov.in health insurance scheme eligibility'
};
const SOURCES_BY_PATHWAY = {
  'startup-funding': ['startupindia.gov.in', 'mudra.org.in', 'financialservices.gov.in', 'india.gov.in', 'gujarat.gov.in', 'sidbi.in'],
  'health-coverage': ['nha.gov.in', 'pmjay.gov.in', 'ma.gujarat.gov.in', 'esic.gov.in', 'myscheme.gov.in', 'gujarat.gov.in']
};

const NOISE = /(home ?page|^home|search|login|sign ?in|dashboard|course|academy|training|learn|video|faq|help|contact|about us|site ?map|privacy|terms|disclaimer|advertisement|notice|gazette|notification|circular|press ?note|press ?release|news|blog|download|user ?manual|annual ?report|presentation|minutes|agenda|exam|recruitment|vacancy|result|merit ?list|admission|student|job|rss)/i;
const SCHEMEISH = /\b(scheme|yojana|fund|loan|credit|grant|cover|assistance|policy|support|mission|programme|program|capital|subsidy|guarantee|insurance|benefit|pension|allowance)\b/i;
const NON_LATIN = /[ऀ-૿ঀ-৿਀-੿઀-૿଀-୿஀-௿ఀ-౿ಀ-೿ഀ-ൿ]/u;

function search(q) {
  return new Promise((res, rej) => {
    const url = 'https://serpapi.com/search.json?q=' + encodeURIComponent(q) + '&api_key=' + encodeURIComponent(KEY) + '&num=20&hl=en&gl=in';
    const r = https.get(url, { timeout: 20000 }, (x) => {
      let raw = ''; x.on('data', (c) => raw += c);
      x.on('end', () => { try { const j = JSON.parse(raw); res(j.organic_results || []); } catch (e) { rej(e); } });
    });
    r.on('timeout', () => { r.destroy(); rej(new Error('timeout')); });
    r.on('error', rej);
  });
}
function post(path, obj) {
  return new Promise((res, rej) => {
    const data = JSON.stringify(obj);
    const u = new URL(BASE + path);
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (r) => {
      let raw = ''; r.on('data', (c) => raw += c);
      r.on('end', () => { try { res({ status: r.statusCode, body: JSON.parse(raw || '{}') }); } catch { res({ status: r.statusCode, body: {} }); } });
    });
    req.on('error', rej);
    req.write(data); req.end();
  });
}
const isPdf = (u) => /\.pdf($|\?)/i.test(u);

(async () => {
  const seen = new Set();
  const stats = { added: 0, dup: 0, noise: 0, nonScheme: 0, pdf: 0, nonEnglish: 0, notOfficial: 0, failed: 0, searched: 0 };

  for (const [pathway, sites] of Object.entries(SOURCES_BY_PATHWAY)) {
    for (const site of sites) {
      const q = SOURCES[site];
      let res = [];
      try { res = await search(q); stats.searched++; } catch { stats.failed++; console.error('  search failed:', site); continue; }
      let cands = 0;
      for (const r of res) {
        const url = String(r.link || '').trim();
        const title = String(r.title || '').replace(/\s+/g, ' ').trim();
        const snippet = String(r.snippet || '').replace(/\s+/g, ' ').trim();
        if (!url || !title) continue;
        if (NON_LATIN.test(title) || NON_LATIN.test(snippet)) { stats.nonEnglish++; continue; }
        if (seen.has(url)) continue;
        if (isPdf(url)) { stats.pdf++; continue; }
        if (NOISE.test(title) || NOISE.test(url)) { stats.noise++; continue; }
        if (!SCHEMEISH.test(title)) { stats.nonScheme++; continue; }
        seen.add(url); cands++;
        try {
          const out = await post('/api/admin/add', { name: title, url, domain: pathway, summary: snippet.slice(0, 220) });
          if (out.status === 200) { stats.added++; console.log(`  + [${pathway}] ${title.slice(0, 62)}`); }
          else { stats.dup++; }
        } catch { stats.failed++; }
        await new Promise((r) => setTimeout(r, 60));
      }
      console.log(`${site} (${pathway}): ${res.length} raw -> ${cands} candidates`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  console.log('\n=== ingest summary ===');
  console.log(JSON.stringify(stats, null, 2));
})();