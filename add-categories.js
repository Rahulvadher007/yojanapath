// Give every scheme an explicit category so records can be grouped and filtered.
const fs = require('fs');
const path = require('path');
const DB = path.join(__dirname, 'data', 'schemes.json');
const db = JSON.parse(fs.readFileSync(DB, 'utf8'));

const STARTUP = [
  [/seed fund|seed-fund/i, 'seed-funding'],
  [/guarantee/i, 'credit-guarantee'],
  [/fund of funds/i, 'fund-of-funds'],
  [/regulatory|advisory|handholding/i, 'advisory'],
  [/mudra|loan|credit|stand-?up|PSB/i, 'business-loan'],
  [/incubat/i, 'incubation']
];
const HEALTH = [
  [/esic|employee state insurance/i, 'employment-insurance'],
  [/senior|70\+|70 plus|vatsalya|child/i, 'senior-and-child'],
  [/digital|abdm/i, 'digital-health'],
  [/gujarat|gujhealth|ma\.|mukhya/i, 'state-health'],
  [/pm-?jay|ayushman|jan arogya/i, 'national-health'],
  [/insurance|bima|suraksha|niramaya|sehat/i, 'health-insurance']
];
function pick(name, benefitType, list) {
  const hay = name + ' ' + (benefitType || '');
  for (const [re, cat] of list) if (re.test(hay)) return cat;
  return null;
}

const counts = {};
db.forEach((s) => {
  const list = s.domain === 'startup-funding' ? STARTUP : HEALTH;
  let cat = pick(s.name, s.benefit && s.benefit.type, list);
  if (!cat) {
    let host = '';
    try { host = new URL(s.officialInfoUrl).hostname; } catch {}
    cat = pick(host + ' ' + s.name, '', list);
  }
  s.category = cat || (s.domain === 'startup-funding' ? 'startup-support' : 'health-cover');
  counts[s.category] = (counts[s.category] || 0) + 1;
});

fs.writeFileSync(DB, JSON.stringify(db, null, 2));
console.log(`categorised ${db.length} records`);
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
const missing = db.filter((s) => !s.category).length;
console.log('uncategorised:', missing);