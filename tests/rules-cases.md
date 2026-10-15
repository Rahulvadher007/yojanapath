# Rules engine cases (plan §9.5) — software tests only

These verify the matching software, not government data accuracy. Source verification is tracked separately per record (`verificationStatus`, per-rule `sourceUrl` + `sourceCheckedAt` in `data/schemes.json`); only 2 of 6 records are `verified`.

Engine: `public/js/rules.js` → `YPRules.evaluate(scheme, answers)` returns `potential-match` (no mandatory fail, none unknown), `needs-info` (none fail, ≥1 unknown), `does-not-match` (≥1 mandatory fail). Empty answers never pass. Unsupported operators return `unknown`.

Profiles: `tests/sample-profiles.json`.

| # | Case | Profile | Expected |
|---|------|---------|----------|
| 1 | All required met | all-met | potential-match |
| 2 | One mandatory failed | one-failed | does-not-match |
| 3 | One required answer missing | one-missing | needs-info |
| 4 | Central scheme across states | central-cross-state | potential-match |
| 5 | Gujarat-only, out-of-state answer | gujarat-out-of-state | does-not-match |
| 6 | Unverified record | any profile on `verificationStatus: needs-review` record | status still computed; UI shows needs-review badge, never hidden |
| 7 | Invalid user input | invalid-input | does-not-match (value not in list) |
| 8 | Empty dataset | `GET /api/schemes?domain=bogus` → 400; empty array → "No current record matched" empty state | error/empty state, no crash |
| 9 | Unsupported operator | temporarily set a rule `operator: "regex"` | that rule → unknown; scheme → needs-info unless another rule fails |

Quick check (open results page, DevTools console):
```js
fetch('/api/schemes?domain=startup-funding').then(r=>r.json()).then(d=>{
  const s=d.find(x=>x.id==='startup-seed-fund');
  console.log(YPRules.evaluate(s,{state:'Gujarat',applicantType:'startup',businessStage:'early-stage',fundingPurpose:'seed',recognitionStatus:'recognised'}).status);
});
```
