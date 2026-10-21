// YojanaPath server — Node.js built-in modules only (no Express).
const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const ALLOWED_DOMAINS = new Set(['startup-funding', 'health-coverage']);

// Load .env into process.env (no dependency). Existing env vars win.
// Common spelling variants are accepted so a hand-edited .env still works.
const ENV_ALIASES = { SERP_API_KEY: 'SERPAPI_KEY', GROQ_KEY: 'GROQ_API_KEY', SERPAPI: 'SERPAPI_KEY' };
function loadEnv() {
  try {
    fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  } catch { /* no .env is fine */ }
  Object.keys(ENV_ALIASES).forEach((from) => {
    const to = ENV_ALIASES[from];
    if (process.env[from] && !process.env[to]) process.env[to] = process.env[from];
  });
}
loadEnv();

// Live official-source search: never returns eligibility claims, only candidate links.
const LIVE_TTL = 10 * 60 * 1000;
const liveCache = new Map();
function cacheGet(k) { const e = liveCache.get(k); if (!e) return null; if (Date.now() - e.ts > LIVE_TTL) { liveCache.delete(k); return null; } return e.data; }
function isOfficial(host) {
  host = String(host || '').toLowerCase();
  return /\.gov\.in$/.test(host) || /\.nic\.in$/.test(host) || /\.gov\.[a-z]{2}$/.test(host) || host === 'mudra.org.in';
}
function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
// English-only product: drop any result whose text carries Gujarati (or other Indic) script.
const NON_LATIN = /[ऀ-૿ঀ-৿਀-੿઀-૿଀-୿஀-௿ఀ-౿ಀ-೿ഀ-ൿ]/u;
const isEnglishText = (s) => !NON_LATIN.test(String(s || ''));
function liveQueries(domain, ctx) {
  const state = clean(ctx.state).toLowerCase();
  const stateHost = state && state !== 'other' ? state + '.gov.in' : '';
  if (domain === 'startup-funding') {
    const q = [];
    if (stateHost) q.push(`site:${stateHost} startup scheme funding assistance`);
    q.push(`site:startupindia.gov.in seed fund scheme eligibility ${clean(ctx.stage)} ${clean(ctx.purpose)}`.replace(/\s+/g, ' ').trim());
    return q.slice(0, 2);
  }
  const q = [`site:nha.gov.in Ayushman Bharat PM-JAY eligibility ${clean(ctx.stage)}`.replace(/\s+/g, ' ').trim()];
  if (stateHost) q.push(`site:${stateHost} government health coverage scheme`);
  return q.slice(0, 2);
}
function serpSearch(query) {
  return new Promise((resolve, reject) => {
    const url = 'https://serpapi.com/search.json?q=' + encodeURIComponent(query) + '&api_key=' + encodeURIComponent(process.env.SERPAPI_KEY) + '&num=8&hl=en&gl=in';
    const req = https.get(url, { timeout: 9000 }, (r) => {
      let raw = '';
      r.on('data', (c) => (raw += c));
      r.on('end', () => {
        try {
          const j = JSON.parse(raw);
          if (j.error) return reject(new Error(j.error));
          resolve(j.organic_results || []);
        } catch { reject(new Error('bad response')); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

// A response can only be written once. Guard here so a late socket error can
// never crash the process with ERR_HTTP_HEADERS_SENT.
function send(res, code, body, type) {
  if (res.headersSent || res.writableEnded) return;
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8' });
  res.end(body);
}
function sendJson(res, code, obj) { send(res, code, JSON.stringify(obj)); }
function readJsonFile(p, cb) {
  fs.readFile(p, 'utf8', (e, d) => {
    if (e) return cb(e);
    try { cb(null, JSON.parse(d)); } catch (err) { cb(err); }
  });
}
function safeStatic(urlPath, res) {
  let rel = decodeURIComponent(urlPath === '/' ? '/index.html' : urlPath).split('?')[0];
  const full = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!full.startsWith(PUBLIC_DIR)) return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
  fs.readFile(full, (e, data) => {
    if (e) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}
const ADMIN_SOURCES = {
  'startupindia.gov.in': 'site:startupindia.gov.in government scheme funding startup',
  'mudra.org.in': 'site:mudra.org.in loan scheme category eligibility',
  'financialservices.gov.in': 'site:financialservices.gov.in loan scheme for business',
  'india.gov.in': 'site:india.gov.in business loan subsidy scheme',
  'gujarat.gov.in': 'site:gujarat.gov.in startup assistance scheme',
  'nha.gov.in': 'site:nha.gov.in scheme Ayushman health cover eligibility',
  'pmjay.gov.in': 'site:pmjay.gov.in scheme eligibility beneficiary',
  'ma.gujarat.gov.in': 'site:ma.gujarat.gov.in yojana scheme eligibility',
  'esic.gov.in': 'site:esic.gov.in scheme medical benefit',
  'myscheme.gov.in': 'site:myscheme.gov.in health insurance scheme'
};
function handleAdminSearch(q, res) {
  const domain = q.get('domain');
  if (!ALLOWED_DOMAINS.has(domain)) return sendJson(res, 400, { error: 'Invalid domain' });
  const key = process.env.SERPAPI_KEY;
  if (!key) return sendJson(res, 200, { results: [], note: 'SERPAPI_KEY not configured on this server.' });

  const site = q.get('site');
  const defaults = domain === 'startup-funding' ? ['startupindia.gov.in', 'gujarat.gov.in'] : ['nha.gov.in', 'ma.gujarat.gov.in'];
  const hosts = (site && ADMIN_SOURCES[site]) ? [site] : defaults;
  const query = ADMIN_SOURCES[hosts[0]];
  const apiUrl = 'https://serpapi.com/search.json?q=' + encodeURIComponent(query) + '&api_key=' + encodeURIComponent(key) + '&num=10&hl=en&gl=in';
  const req = https.get(apiUrl, { timeout: 12000 }, (r) => {
    let raw = '';
    r.on('data', (c) => (raw += c));
    r.on('end', () => {
      try {
        const j = JSON.parse(raw);
        if (j.error) return sendJson(res, 200, { results: [], note: 'Search provider: ' + j.error });
        const out = (j.organic_results || []).map((x) => {
          const link = String(x.link || '').trim();
          let host = ''; try { host = new URL(link).hostname; } catch { host = ''; }
          return {
            title: String(x.title || '').replace(/\s+/g, ' ').trim(),
            link,
            snippet: String(x.snippet || '').replace(/\s+/g, ' ').trim().slice(0, 240),
            host,
            official: isOfficial(host),
            date: new Date().toISOString().slice(0, 10)
          };
        }).filter((x) => x.title && x.link && isEnglishText(x.title) && isEnglishText(x.snippet));
        sendJson(res, 200, { results: out, searched: hosts[0], note: 'Candidate links only. Review each source, then add the ones you have verified.' });
      } catch { sendJson(res, 502, { error: 'Search provider returned an invalid response' }); }
    });
  });
  // destroy() on timeout also emits 'error', so both handlers race to respond.
  // send() is idempotent, but fail fast here too so the intended 504 wins.
  let settled = false;
  req.on('timeout', () => { settled = true; req.destroy(); sendJson(res, 504, { error: 'Search timed out' }); });
  req.on('error', () => { if (settled) return; sendJson(res, 502, { error: 'Search unavailable' }); });
}

// --- manual dataset review: the admin decides, never an automatic write ---
const SCHEMES_FILE = path.join(DATA_DIR, 'schemes.json');
function readSchemes() { try { return JSON.parse(fs.readFileSync(SCHEMES_FILE, 'utf8')); } catch { return null; } }
function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48); }
function handleAdminAdd(body, res) {
  const name = clean(body.name), url = clean(body.url), domain = body.domain;
  if (!name || !url) return sendJson(res, 400, { error: 'name and url are required' });
  if (!ALLOWED_DOMAINS.has(domain)) return sendJson(res, 400, { error: 'Invalid domain' });
  let host = '';
  try { const u = new URL(url); if (u.protocol !== 'https:') throw new Error('scheme'); host = u.hostname; } catch { return sendJson(res, 400, { error: 'url must be a valid https address' }); }
  if (!isOfficial(host)) return sendJson(res, 400, { error: 'Not an official government domain: ' + host });
  const db = readSchemes();
  if (!db) return sendJson(res, 500, { error: 'Cannot read schemes.json' });
  // A single official site can host several distinct schemes — ma.gujarat.gov.in carries
  // both the MA Yojana and the MAV Yojana, and nha.gov.in carries PM-JAY and its Health
  // Benefit Package. A shared URL is therefore not proof of a duplicate; the same scheme
  // name on the same URL is.
  const schemeKey = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (db.some((s) => s.officialInfoUrl === url && schemeKey(s.name) === schemeKey(name))) {
    return sendJson(res, 409, { error: 'This scheme is already in the dataset' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const id = slugify(name.slice(0, 40)) + '-' + Math.random().toString(36).slice(2, 6);
  const rec = {
    id,
    domain,
    name,
    category: clean(body.category) || (domain === 'startup-funding' ? 'startup-support' : 'health-cover'),
    administeringAuthority: clean(body.authority) || host,
    coverage: { type: 'central', states: [] },
    benefit: { type: clean(body.benefit) || 'scheme', summary: clean(body.summary) || 'Description pending — open the official source to read what this scheme offers.' },
    intendedFor: 'Eligibility conditions have not been entered yet. Open the official source to check who can apply.',
    nextStep: 'Open the official page and confirm eligibility before applying.',
    eligibilityRules: [],
    documents: [],
    applicationSteps: ['Open the official source', 'Read the published eligibility and application conditions'],
    officialInfoUrl: url,
    officialApplicationUrl: null,
    sources: [{ url, sourceType: 'official', checkedAt: today }],
    lastVerified: today,
    verificationStatus: 'needs-review',
    notes: 'Added from admin review on ' + today + '. Conditions not yet transcribed — discovery only.'
  };
  db.push(rec);
  fs.writeFileSync(SCHEMES_FILE, JSON.stringify(db, null, 2));
  sendJson(res, 200, { added: rec, total: db.length });
}
function handleAdminRemove(body, res) {
  const db = readSchemes();
  if (!db) return sendJson(res, 500, { error: 'Cannot read schemes.json' });
  const i = db.findIndex((s) => s.id === body.id);
  if (i < 0) return sendJson(res, 404, { error: 'No such record' });
  const [removed] = db.splice(i, 1);
  fs.writeFileSync(SCHEMES_FILE, JSON.stringify(db, null, 2));
  sendJson(res, 200, { removed, total: db.length });
}
function handleAdminUpdate(body, res) {
  const db = readSchemes();
  if (!db) return sendJson(res, 500, { error: 'Cannot read schemes.json' });
  const i = db.findIndex((s) => s.id === body.id);
  if (i < 0) return sendJson(res, 404, { error: 'No such record' });
  const rec = db[i];
  if (body.name !== undefined) rec.name = clean(body.name) || rec.name;
  if (body.description !== undefined) rec.benefit.summary = clean(body.description) || rec.benefit.summary;
  if (body.category !== undefined) rec.category = clean(body.category) || rec.category;
  if (body.intendedFor !== undefined) rec.intendedFor = clean(body.intendedFor) || rec.intendedFor;
  if (body.reviewed === true) {
    rec.verificationStatus = 'verified';
    rec.lastVerified = new Date().toISOString().slice(0, 10);
  }
  if (body.reviewed === false) rec.verificationStatus = 'needs-review';
  if (ALLOWED_DOMAINS.has(body.domain)) rec.domain = body.domain;
  db[i] = rec;
  fs.writeFileSync(SCHEMES_FILE, JSON.stringify(db, null, 2));
  sendJson(res, 200, { updated: rec, total: db.length });
}
// Optional AI guidance. Server-side only; the key is never sent to the browser.
// The model is given ONLY the records already in the dataset and is told not to
// invent schemes. Its output is explanatory text, never written back to data.
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
// gpt-oss and similar reasoning models count reasoning tokens against max_tokens and can
// emit JSON that is cut off mid-array. Recover as much of it as possible.
function repairJson(s) {
  s = String(s || '').trim();
  if (!s) return null;
  const first = s.indexOf('{');
  if (first > 0) s = s.slice(first);
  const last = s.lastIndexOf('}');
  if (last > -1 && last < s.length - 1) s = s.slice(0, last + 1);
  try { return JSON.parse(s); } catch {}
  const stack = [];
  let inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{' || c === '[') stack.push(c);
    else if (c === '}' || c === ']') stack.pop();
  }
  let fixed = s.replace(/,\s*([}\]])/g, '$1');
  while (stack.length) fixed += stack.pop() === '{' ? '}' : ']';
  try { return JSON.parse(fixed); } catch { return null; }
}

function handleAiSuggest(body, res) {
  const key = process.env.GROQ_API_KEY;
  const domain = body.domain;
  if (!key) return sendJson(res, 200, { configured: false, text: '', note: 'AI guidance is not configured on this server. The rule-based results above are unaffected.' });
  if (!ALLOWED_DOMAINS.has(domain)) return sendJson(res, 400, { error: 'Invalid domain' });

  const db = readSchemes();
  if (!db) return sendJson(res, 500, { error: 'Cannot read schemes.json' });
  const allowed = db.filter((s) => s.domain === domain);
  if (!allowed.length) return sendJson(res, 200, { configured: true, text: '', note: 'No records for this pathway yet.' });

  const catalogue = allowed.map((s) => {
    const rules = (s.eligibilityRules || []).map((r) => `${r.field} ${r.operator} ${JSON.stringify(r.value)}`).join('; ') || 'none stored';
    return `- ${s.id} | ${s.name} | ${s.benefit.summary.slice(0, 110)} | conditions: ${rules} | ${s.verificationStatus}`;
  }).join('\n');

  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const answerLines = Object.keys(answers).filter((k) => k !== 'domain').map((k) => `${k}: ${answers[k]}`).join('\n') || '(none)';

  const prompt = [
    'Rank these government schemes for a citizen. Use only the ids listed.',
    'Never invent an id, scheme, amount, deadline or income ceiling. You rank; you never decide eligibility.',
    'Reply with ONLY this JSON and nothing else:',
    '{"ranked":[{"id":"<id>","score":<0-100>,"why":"<=15 words","verify":"<=15 words"}]}',
    'Include every id. Most relevant first.',
    '',
    'SCHEMES (id | name | benefit | conditions | status):',
    catalogue,
    '',
    'ANSWERS: ' + answerLines.replace(/\n/g, ', '),
    '',
    'JSON only.'
  ].join('\n');

  // Free tiers cap tokens per minute, so cache identical requests briefly.
  const aiKey = domain + '|' + JSON.stringify(answers);
  const aiHit = cacheGet('ai:' + aiKey);
  if (aiHit) return sendJson(res, 200, Object.assign({ cached: true }, aiHit));

  const payload = JSON.stringify({
    model: GROQ_MODEL,
    temperature: 0.1,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });
  const req = https.request({
    hostname: 'api.groq.com', path: '/openai/v1/chat/completions', method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    timeout: 25000
  }, (r) => {
    let raw = '';
    r.on('data', (c) => (raw += c));
    r.on('end', () => {
      try {
        const j = JSON.parse(raw);
        if (j.error) {
          const msg = String(j.error.message || 'error');
          if (/rate limit|429|tokens per minute|requests per minute/i.test(msg)) {
            const m = msg.match(/try again in\s*([\d.]+)\s*s?/i);
            return sendJson(res, 429, { error: 'Groq rate limit reached (free tier).', retryAfter: m ? Math.ceil(Number(m[1])) : 10 });
          }
          const hint = /does not exist|access/i.test(msg)
            ? ' Set GROQ_MODEL in .env to a model your key can use (check https://console.groq.com/docs/models).'
            : (/unauthorized|invalid.*key|401/i.test(msg) ? ' Check GROQ_API_KEY in .env — rotate it if it was ever pasted into a chat.' : '');
          return sendJson(res, 502, { error: 'AI provider: ' + msg + hint });
        }
        const content = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').trim();
        const finish = j.choices && j.choices[0] && j.choices[0].finish_reason;
        const parsed = repairJson(content);
        const byId = new Map(allowed.map((s) => [s.id, s]));
        const ranked = ((parsed && parsed.ranked) || [])
          .filter((r) => r && byId.has(r.id))              // drop anything not in the dataset
          .map((r) => ({ id: r.id, name: byId.get(r.id).name, score: Math.max(0, Math.min(100, Number(r.score) || 0)), why: clean(r.why).slice(0, 220), verify: clean(r.verify).slice(0, 220) }));
        const dropped = ((parsed && parsed.ranked) || []).filter((r) => r && !byId.has(r.id)).map((r) => r.id);
        if (!parsed || !Array.isArray(parsed.ranked) || !parsed.ranked.length) {
          return sendJson(res, 502, { error: 'The AI did not return usable JSON for this model' + (finish === 'length' ? ' (response was cut off). ' : '. ') + 'Try a different GROQ_MODEL in .env — reasoning models can spend their token budget before finishing the JSON.' });
        }
        // Any scheme the model forgot still gets ranked, so no record silently disappears.
        allowed.forEach((s) => { if (!ranked.some((r) => r.id === s.id)) ranked.push({ id: s.id, name: s.name, score: 0, why: '', verify: '' }); });
        const out = { configured: true, ranked, dropped, model: GROQ_MODEL };
        liveCache.set('ai:' + aiKey, { ts: Date.now(), data: out });
        sendJson(res, 200, out);
      } catch { sendJson(res, 502, { error: 'AI provider returned an invalid response' }); }
    });
  });
  req.on('timeout', () => { req.destroy(); sendJson(res, 504, { error: 'AI request timed out' }); });
  req.on('error', () => sendJson(res, 502, { error: 'AI service unavailable' }));
  req.write(payload);
  req.end();
}

function readBody(req, cb) {
  let raw = '';
  let size = 0;
  req.on('data', (c) => { size += c.length; if (size > 20000) { req.destroy(); return cb({}); } raw += c; });
  req.on('end', () => { try { cb(JSON.parse(raw || '{}')); } catch { cb({}); } });
  req.on('error', () => cb({}));
}

function handleLiveSearch(q, res) {
  const domain = q.get('domain');
  if (!ALLOWED_DOMAINS.has(domain)) return sendJson(res, 400, { error: 'Invalid domain' });
  const key = process.env.SERPAPI_KEY;
  if (!key) return sendJson(res, 200, { results: [], configured: false, note: 'Live search is not configured on this server. Ask an administrator to set SERPAPI_KEY, or open the official links on each scheme page.' });

  const ctx = { state: q.get('state'), stage: q.get('stage'), purpose: q.get('purpose'), category: q.get('category') };
  const cacheKey = domain + '|' + JSON.stringify(ctx);
  const hit = cacheGet(cacheKey);
  if (hit) return sendJson(res, 200, Object.assign({ cached: true }, hit));

  const queries = liveQueries(domain, ctx);
  Promise.all(queries.map((qq) => serpSearch(qq).catch(() => [])))
    .then((batches) => {
      const seen = new Set();
      const results = [];
      let droppedNonEnglish = 0;
      batches.flat().forEach((r) => {
        const link = clean(r.link);
        if (!link || seen.has(link)) return;
        seen.add(link);
        let host = '';
        try { host = new URL(link).hostname; } catch { return; }
        const title = clean(r.title);
        const snippet = clean(r.snippet).slice(0, 240);
        if (!isEnglishText(title) || !isEnglishText(snippet)) { droppedNonEnglish++; return; }
        results.push({
          title,
          link,
          snippet,
          domain: host,
          official: isOfficial(host),
          foundAt: new Date().toISOString().slice(0, 10)
        });
      });
      const payload = {
        results,
        configured: true,
        officialOnly: results.filter((r) => r.official).length,
        language: 'en',
        droppedNonEnglish,
        note: results.some((r) => r.official) ? '' : 'No official English government pages were returned for these answers. Check the domains carefully before relying on them.'
      };
      liveCache.set(cacheKey, { ts: Date.now(), data: payload });
      sendJson(res, 200, payload);
    })
    .catch((e) => sendJson(res, 502, { error: 'Live search is unavailable right now', detail: String(e.message || e) }));
}

// Admin writes to data/schemes.json, which is ephemeral on most hosts. Off by default;
// set ADMIN_ENABLED=true to expose it (local development only).
const ADMIN_ENABLED = process.env.ADMIN_ENABLED === 'true';

const server = http.createServer((req, res) => {
  let u;
  try { u = new URL(req.url, 'http://localhost'); } catch { return send(res, 400, 'Bad request', 'text/plain; charset=utf-8'); }
  const p = u.pathname, q = u.searchParams;
  // The admin panel writes to data/schemes.json. On a deployed host the filesystem is
  // ephemeral and unauthenticated, so it stays off unless explicitly enabled, and returns
  // 404 rather than 403 so its existence is not advertised.
  if (ADMIN_ENABLED && (p.startsWith('/api/admin') || p === '/admin.html')) { /* allowed */ }
  else if (p.startsWith('/api/admin') || p === '/admin.html') return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
  if (req.method === 'POST') {
    if (p === '/api/admin/add') { readBody(req, (b) => handleAdminAdd(b, res)); return; }
    if (p === '/api/admin/remove') { readBody(req, (b) => handleAdminRemove(b, res)); return; }
    if (p === '/api/admin/update') { readBody(req, (b) => handleAdminUpdate(b, res)); return; }
    if (p === '/api/ai/suggest') { readBody(req, (b) => handleAiSuggest(b, res)); return; }
    return sendJson(res, 404, { error: 'Unknown API route' });
  }
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
  if (p === '/api/health') return sendJson(res, 200, { ok: true, time: new Date().toISOString() });
  if (p === '/api/categories') return readJsonFile(path.join(DATA_DIR, 'categories.json'), (e, d) => e ? sendJson(res, 500, { error: 'Cannot load categories' }) : sendJson(res, 200, d));
  if (p === '/api/schemes') {
    const domain = q.get('domain');
    if (domain && !ALLOWED_DOMAINS.has(domain)) return sendJson(res, 400, { error: 'Invalid domain. Use startup-funding or health-coverage.' });
    return readJsonFile(path.join(DATA_DIR, 'schemes.json'), (e, d) => {
      if (e) return sendJson(res, 500, { error: 'Cannot load schemes' });
      sendJson(res, 200, domain ? d.filter((s) => s.domain === domain) : d);
    });
  }
  if (p === '/api/admin/search') return handleAdminSearch(q, res);
  if (p === '/api/search/live') return handleLiveSearch(q, res);
  if (p.startsWith('/api/')) return sendJson(res, 404, { error: 'Unknown API route' });
  safeStatic(p, res);
});

server.on('clientError', (err, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
  else socket.destroy();
});
// Never let one request take the dev server down — log and keep serving.
process.on('uncaughtException', (err) => console.error('[server] uncaught:', err && err.message));
process.on('unhandledRejection', (err) => console.error('[server] unhandled rejection:', err && (err.message || err)));

// Render (and most PaaS) require binding to 0.0.0.0 and injecting PORT.
server.listen(PORT, '0.0.0.0', () => console.log('YojanaPath running on http://localhost:' + PORT));
