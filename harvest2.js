// Fetch real scheme index pages from official sites and extract scheme links.
// Better signal than web search: these pages enumerate schemes directly.
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

function get(url, redirects = 0) {
  return new Promise((res, rej) => {
    if (redirects > 4) return rej(new Error('too many redirects'));
    const r = https.get(url, { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0 (YojanaPath scheme research)', 'Accept-Language': 'en' } }, (x) => {
      if (x.statusCode >= 300 && x.statusCode < 400 && x.headers.location) { x.resume(); return res(get(new URL(x.headers.location, url).href, redirects + 1)); }
      let raw = ''; x.setEncoding('utf8');
      x.on('data', (c) => raw += c);
      x.on('end', () => res({ status: x.statusCode, body: raw }));
    });
    r.on('timeout', () => { r.destroy(); rej(new Error('timeout')); });
    r.on('error', rej);
  });
}

const NOISE = /(home|search|login|about|contact|help|faq|notice|advertisement|gazette|announcement|news|press|blog|download|manual|guideline|circular|notification|user-guide|sitemap|career|apply-?online-?login)/i;
const NON_LATIN = /[ऀ-૿ঀ-৿਀-੿઀-૿଀-୿஀-௿ఀ-౿ಀ-೿ഀ-ൿ]/u;

const SOURCES = [
  { domain: 'startup-funding', url: 'https://www.startupindia.gov.in/content/sih/en/government-schemes.html', host: 'www.startupindia.gov.in', authority: 'Department for Promotion of Industry and Internal Trade (DPIIT)', benefit: 'seed-funding' },
  { domain: 'startup-funding', url: 'https://seedfund.startupindia.gov.in/', host: 'seedfund.startupindia.gov.in', authority: 'Startup India Seed Fund Scheme', benefit: 'seed-funding' },
  { domain: 'startup-funding', url: 'https://www.mudra.org.in/', host: 'www.mudra.org.in', authority: 'MUDRA Ltd / Ministry of Finance', benefit: 'loan' },
  { domain: 'startup-funding', url: 'https://www.financialservices.gov.in/psb-loans-in-59-minutes', host: 'www.financialservices.gov.in', authority: 'Ministry of Finance', benefit: 'loan' },
  { domain: 'health-coverage', url: 'https://nha.gov.in/PM-JAY', host: 'nha.gov.in', authority: 'National Health Authority (NHA)', benefit: 'health-cover' },
  { domain: 'health-coverage', url: 'https://pmjay.gov.in/', host: 'pmjay.gov.in', authority: 'National Health Authority (NHA)', benefit: 'health-cover' },
  { domain: 'health-coverage', url: 'https://ma.gujarat.gov.in/', host: 'ma.gujarat.gov.in', authority: 'Government of Gujarat', benefit: 'health-cover' }
];

function clean(s) { return s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); }
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60); }
function titleCase(s) { return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()); }

(async () => {
  const found = [];
  for (const src of SOURCES) {
    let page;
    try { page = await get(src.url); } catch (e) { console.error('FAIL', src.host, e.message); continue; }
    if (page.status !== 200) { console.error('HTTP', page.status, src.host); continue; }
    if (NON_LATIN.test(page.body.slice(0, 4000))) { console.error('non-english page, skipped:', src.host); continue; }

    const anchors = [...page.body.matchAll(/<a[^>]+href="([^"#]+)"[^>]*>([\s\S]{0,200}?)<\/a>/gi)];
    const seen = new Set();
    let kept = 0;
    for (const [, href, rawText] of anchors) {
      const text = clean(rawText);
      if (!text || text.length < 8 || text.length > 140) continue;
      if (NOISE.test(text) || NOISE.test(href)) continue;
      if (!/\b(scheme|yojana|fund|loan|credit|grant|cover|assistance|policy|support|mission|programme|program|capital|subsidy|guarantee|insurance)\b/i.test(text)) continue;
      let abs;
      try { abs = new URL(href, src.url).href; } catch { continue; }
      const k = abs.replace(/#.*$/, '');
      if (seen.has(k)) continue;
      seen.add(k);
      found.push({ domain: src.domain, name: text, url: abs, host: src.host, authority: src.authority, benefit: src.benefit });
      kept++;
    }
    console.log(`${src.host} -> ${anchors.length} anchors, ${kept} scheme-like links`);
    await new Promise((r) => setTimeout(r, 600));
  }
  fs.writeFileSync(path.join(__dirname, 'harvest2.json'), JSON.stringify(found, null, 2));
  console.log('\nTOTAL scheme-like links:', found.length);
  found.forEach((f, i) => console.log(`${i + 1}. [${f.domain}] ${f.name}  <- ${f.host}`));
})();