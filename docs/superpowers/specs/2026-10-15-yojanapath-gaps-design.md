# YojanaPath Gaps — Design (2026-10-15)

## 1. Context
Minimal build exists (server.js on built-ins, 6 schemes, 8 pages, rules engine). Counter-review vs YojanaPath_Implementation_Plan.md found: no admin UI, questionnaire allows empty submit, single mixed filter, compare missing 3 rows, 0 verified records, no tests/docs/screenshots, no Gujarati stub.

## 2. Goal
Evaluation readiness + flawless demo (user picked B+C, evaluation priority, format unknown → cover demo + report + viva).

## 3. Scope & phasing
Phase 1 (demo perfection): demo-profiles.json with 3 fictional profiles (startup potential-match, health needs-info, no-match), demo reset button (clears yojanapath.* keys), homepage trust strip (sources, explanations, dates, no-approval notice), 10-step demo script (§19).
Phase 2 (full compliance): questionnaire validation + error summary; results get 3 ANDed filters (status/benefit/coverage) + relevance explanation; compare adds eligibility / missing-info / steps rows; admin.html (domain select, trigger GET /api/admin/search, cards with title/snippet/URL/date, official-domain badge, manual-update note, never writes data); Gujarati stub toggle + note; dataset keeps 6 records, 2 marked verified with real checked dates, rest needs-review.
Out of scope: accounts, auto-publish of search results, AI, loan/insurance processing.

## 4. Components & data flow
No new deps (jQuery CDN + built-ins only). demo-profiles.json is static; reset uses YPStore keys. Questionnaire blocks Continue on empty, shows inline + summary errors, persists to yojanapath.lastAnswers / draft. Results filters AND; sort relevance = status order then name, explained in UI. Compare rows read eligibilityRules, unknown counts, applicationSteps. Admin allowlist: startupindia.gov.in, mudra.org.in, nha.gov.in, gujarat.gov.in. Errors via live regions + retry; empty data → revise-answers CTA; unknown operator → unknown + console warn.

## 5. Testing & evaluation
Manual matrix: 3 profiles × match/needs-info/no-match; Gujarat vs non-Gujarat; central cross-state; empty-submit blocked; compare limit 3; saved/checklist persist reload; SerpApi missing → friendly note. Docs: README (setup, demo, limitations, update workflow), tests/rules-cases.md + sample-profiles.json (§9.5 nine cases), 5 screenshots. Done = §18 tickable except intentional out-of-scope items.

## 6. Self-review
No TBDs. Architecture matches features. Single plan scope (phased, not split). Relevance = status order + name, stated explicitly. No sensitive data collected.
