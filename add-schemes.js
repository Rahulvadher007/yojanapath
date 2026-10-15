// Merge schemes harvested from official government pages into data/schemes.json.
// New records carry real name/authority/URL but NO eligibility rules, so the
// engine reports them as "rules-pending" rather than inventing a match.
const fs = require('fs');
const path = require('path');
const DB = path.join(__dirname, 'data', 'schemes.json');
const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
const TODAY = '2026-10-15';

const ADD = [
  ['startup-funding', 'Credit Guarantee Scheme for Startups (CGSS)', 'Department for Promotion of Industry and Internal Trade (DPIIT)', 'https://www.startupindia.gov.in/content/sih/en/credit-guarantee-scheme-for-startups.html', 'startupindia.gov.in', 'State', 'loan', 'Credit guarantee cover that helps startups obtain bank loans without collateral or third-party guarantees.'],
  ['startup-funding', 'Startup India Fund of Funds 2.0', 'Department for Promotion of Industry and Internal Trade (DPIIT)', 'https://www.startupindia.gov.in/content/sih/en/fund-of-funds.html', 'startupindia.gov.in', 'Central', 'fund-of-funds', 'Fund of funds that invests in SEBI-registered alternative investment funds supporting startups.'],
  ['startup-funding', 'Startup India Regulatory Support', 'Department for Promotion of Industry and Internal Trade (DPIIT)', 'https://www.startupindia.gov.in/content/sih/en/regulatory-support.html', 'startupindia.gov.in', 'Central', 'advisory', 'Regulatory guidance and handholding support to help startups navigate government approvals.'],
  ['startup-funding', 'PSB Loans in 59 Minutes', 'Ministry of Finance, Department of Financial Services', 'https://www.financialservices.gov.in/psb-loans-in-59-minutes', 'financialservices.gov.in', 'Central', 'loan', 'Public sector banks offer collateral-free business loans with a standardised, time-bound application process.'],
  ['startup-funding', 'Stand-Up India', 'Department of Financial Services, Ministry of Finance', 'https://www.standupmitra.in/', 'standupmitra.in', 'Central', 'loan', 'Bank loans for scheduled caste and scheduled tribe entrepreneurs in manufacturing and services.'],
  ['health-coverage', 'Mukhyamantri Amrutum Yojana (MA Yojana), Gujarat', 'Health and Family Welfare Department, Government of Gujarat', 'https://ma.gujarat.gov.in/', 'ma.gujarat.gov.in', 'Gujarat', 'health-cover', 'Cashless treatment support for eligible families in Gujarat at empanelled hospitals.'],
  ['health-coverage', 'Mukhyamantri Amrutum Vatsalya Yojana (MAV), Gujarat', 'Health and Family Welfare Department, Government of Gujarat', 'https://ma.gujarat.gov.in/', 'ma.gujarat.gov.in', 'Gujarat', 'health-cover', 'Cashless tertiary care cover extended to eligible beneficiaries in Gujarat.'],
  ['health-coverage', 'Ayushman Bharat PM-JAY (AB-PMJAY), Gujarat', 'National Health Authority / Government of Gujarat', 'https://ma.gujarat.gov.in/ABPMJAY.html', 'ma.gujarat.gov.in', 'Gujarat', 'health-cover', 'Gujarat implementation portal for the national Ayushman Bharat health assurance scheme.'],
  ['health-coverage', 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJY)', 'Government of Maharashtra', 'https://www.myscheme.gov.in/schemes/mjpjay', 'myscheme.gov.in', 'Maharashtra', 'health-cover', 'Cashless health cover for eligible beneficiary families in Maharashtra.'],
  ['health-coverage', 'Ayushman Bharat Digital Mission (ABDM)', 'National Health Authority (NHA)', 'https://abdm.gov.in/', 'abdm.gov.in', 'Central', 'health-cover', 'National digital health infrastructure enabling Ayushman Bharat health records and services.'],
  ['health-coverage', 'Employee State Insurance Scheme (ESIC)', 'Employees State Insurance Corporation', 'https://www.esic.gov.in/', 'esic.gov.in', 'Central', 'health-cover', 'Medical care and cash benefits for insured workers and their families.'],
  ['health-coverage', 'National Health Benefit Package (PM-JAY HBP)', 'National Health Authority (NHA)', 'https://nha.gov.in/PM-JAY', 'nha.gov.in', 'Central', 'health-cover', 'The official package of health benefits covered under PM-JAY at empanelled hospitals.']
];

const slug = (s, d) => d + '-' + s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
const have = new Set(db.map((x) => x.id));
let added = 0, skipped = 0;

ADD.forEach(([domain, name, authority, url, host, scope, benefitType, summary]) => {
  const id = slug(name, domain);
  if (have.has(id)) { skipped++; return; }
  have.add(id);
  db.push({
    id,
    domain,
    name,
    administeringAuthority: authority,
    coverage: { type: scope === 'Central' ? 'central' : 'state', states: scope === 'Central' ? [] : [scope] },
    benefit: { type: benefitType, summary },
    intendedFor: 'Conditions for this scheme have not been entered yet. Open the official source to check who can apply.',
    nextStep: 'Open the official page and confirm eligibility before applying.',
    eligibilityRules: [],
    documents: [],
    applicationSteps: ['Open the official page linked below', 'Read the eligibility and application conditions published there'],
    officialInfoUrl: url,
    officialApplicationUrl: null,
    sources: [{ url, sourceType: 'official', checkedAt: TODAY }],
    lastVerified: TODAY,
    verificationStatus: 'needs-review',
    notes: 'Record added from the official portal listing. Eligibility conditions are not yet stored, so this is discovery-only and must be verified on the official page.'
  });
  added++;
});

fs.writeFileSync(DB, JSON.stringify(db, null, 2));
console.log(`added ${added}, skipped ${skipped}, total now ${db.length}`);
['startup-funding', 'health-coverage'].forEach((d) => console.log(`  ${d}: ${db.filter((x) => x.domain === d).length}`));