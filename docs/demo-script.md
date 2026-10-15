# Demo script (plan §19, ~8 minutes, fictional profiles only)

1. Open homepage — "The right support starts with your situation." Point out mint hero, ticker, trust facts (2 domains, 0 promises).
2. Choose **Find startup funding** → domain intro lists what we ask and why.
3. Questionnaire → **Load match profile** → results show potential matches with Met reasons + verified dates.
4. Open a match → details show per-condition labels, documents, steps, official link. Stress: authority decides.
5. Back to questionnaire → **Load no-match profile** → changed answers flip cards to does-not-match with Not-met reasons.
6. **Load needs-info profile** (health) → Missing-info count + unknown reasons; empty submit is blocked with error summary.
7. Save a scheme, open Saved (reloads to prove localStorage), add 2–3 to Compare — show new rows: eligibility, missing info, steps.
8. Build a checklist → check items, reload → progress persists; Print button.
9. Admin page (`/admin.html`) → search with no key shows friendly note; with key shows title/snippet/URL/date + official-domain badge; nothing auto-publishes.
10. Code tour: `data/schemes.json` schema, `public/js/rules.js` evaluate/rank, `server.js` built-ins only, `tests/rules-cases.md`.

Reset between runs: questionnaire → **Reset demo**.
