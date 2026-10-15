# YojanaPath — find government support that fits your situation

Scheme discovery for Startup Funding and Health Coverage. A user picks a domain, answers a
short branching questionnaire, and sees the schemes that plausibly fit, with a per-condition
breakdown of *why*.

The product constraint that shapes everything: **we never claim eligibility.** We show what we
know, where it came from, and when — then point at the official source.

## Run

```bash
node server.js
# open http://localhost:3000
```

Node.js built-ins only (`http` / `fs` / `path` / `https` / `url`) — no Express, no build step,
no install required. The sole dependency is `nodemon` for development.

Copy `.env.example` to `.env` to enable the optional AI ranking and admin search. Without keys
the app still works: results fall back to rule-ranked order and the admin page shows a note.

## How results are decided

Two independent layers, deliberately separated:

| Layer | Runs | Decides |
|---|---|---|
| **Rule engine** (`public/js/rules.js`) | client-side, offline | **Correctness** — `matched` / `not-matched` / `needs-confirmation` / `not-applicable` per condition |
| **AI ranking** (`POST /api/ai/suggest`, Groq) | server-side | **Order and relevance score only** — never eligibility |

After the questionnaire completes, results call the AI endpoint automatically, show a loading
skeleton while scoring runs, then render **only schemes scoring 60+**. The status line states the
threshold, and notes that scores are relevance rather than eligibility. Rules decide correctness;
AI decides ranking. Neither is trusted for the other's job.

Filters operate on the visible 60+ subset, not the full dataset.

## API

| Route | Purpose |
|---|---|
| `GET /api/schemes?domain=` | Scheme records for a domain |
| `GET /api/categories` | Domain definitions and question sets |
| `GET /api/health` | Liveness check |
| `POST /api/ai/suggest` | AI relevance ranking (Groq) |
| `GET /api/search/live` | SerpApi search restricted to government domains |
| `POST /api/admin/{add,update,remove}` | Write to `data/schemes.json` |
| `GET /api/admin/search` | SerpApi-backed source discovery for the admin page |

## Environment

All secrets stay server-side in `.env` and are never sent to the client.

| Variable | Notes |
|---|---|
| `GROQ_API_KEY` | Groq key. Without it, ranking falls back to rules-only order. |
| `GROQ_MODEL` | Defaults to `llama-3.1-8b-instant`. `.env` currently sets `openai/gpt-oss-120b`. Reasoning models can exhaust `max_tokens` before emitting JSON — if you get truncated JSON, pick a different model. |
| `SERPAPI_KEY` | Canonical name. `SERP_API_KEY` is accepted as an alias via `ENV_ALIASES` in `server.js`. |

The AI endpoint receives **only** the records already in the dataset, is told not to invent
schemes, and any invented ID is filtered out server-side. Responses are cached for ten minutes;
rate limits (429) are retried with backoff.

## Data & limitations

**Read this before demoing — the dataset is unevenly filled.**

29 schemes: 10 `startup-funding`, 19 `health-coverage`. But:

| Field | Populated |
|---|---|
| `eligibilityRules` | **6 / 29** |
| `documents` | **6 / 29** |
| `documentedEligibility` | 5 / 29 |
| `verificationStatus: verified` | **2 / 29** |

The remaining 23 carry placeholder application steps ("Open the official page linked below") and
no stored rules or document lists. **We deliberately did not fabricate eligibility criteria or
document requirements for live government schemes** — a wrong document list gets someone's
application rejected. Those pages render an explicit "we have not recorded this yet" gap state
linking to the official URL instead.

Every record carries `officialInfoUrl`, `sources[]` with `checkedAt`, `lastVerified` and
`verificationStatus`.

Other limitations:

- `data/` sits outside `public/` and is served only through `/api/schemes`.
- Interface is **English-only**. Live search forces `hl=en` and drops Indic-script results
  server-side so responses never mix languages.
- localStorage keys are prefixed `yojanapath.` (lowercase) and hold IDs and drafts only — never
  Aadhaar, bank or medical data.
- Testing is manual: `tests/rules-cases.md` and `tests/sample-profiles.json` cover met / failed /
  missing, central cross-state, Gujarat out-of-state, invalid input, empty data and bad operators.

## Provenance model

Every piece of content is labelled by origin, and the distinction is surfaced in the UI:

1. **Rule result** — computed by our engine from the user's answers
2. **Source transcription** — our review of the official page, dated, with the source domain shown
3. **Official decision** — the authority's, and the only binding one

## Features

- **Questionnaire** — branching multi-step form; startup funding asks about state, applicant
  type, business stage, recognition, purpose, amount, urgency, registration and Udyam. Health
  coverage branches by intent (understand / apply / claim).
- **Results** — AI-ranked cards with a score, relevance bar, deep-dive link, and save toggle.
- **Compare drawer** — opens from any card; pick up to 5 schemes (`MAX_COLS` in `compare-ui.js`)
  from the current 60+ set, then view a side-by-side feature matrix. Rows are computed from real
  record fields, not hardcoded, and rows where every column agrees are dimmed.
- **Scheme details** — centred overview plus Eligibility, How to apply, an interactive Documents
  checklist (persisted per scheme via `YPStore.getCheck`/`setCheck`) and Sources, each with
  provenance and a dated source line.
- **Build checklist** — persists and prints.
- **Admin** — search official sources, add, edit descriptions and categories, mark verification,
  remove records.

`compare.html` and `saved.html` still exist as standalone pages. `compare.html` is no longer
linked from the main navigation; the drawer is the primary comparison flow. `saved.html` remains
linked.

## Updating data

1. `/admin.html` → search for the scheme → open the original source.
2. Hand-verify, then edit `data/schemes.json` and update `lastVerified`.
3. Re-run the manual cases in `tests/rules-cases.md`.
4. For public deployment, disable or remove `admin.html` and the `/api/admin/*` routes.

Filling the 23 incomplete records: `harvest.js`, `fetch-eligibility.js` and `bulk-ingest.js`
fetch the official URLs already stored on each record. Transcribe what they return into
`eligibilityRules`, `documents` and `applicationSteps`, keeping `sourceUrl` and `checkedAt` so the
provenance lines stay truthful.

## Maintenance gotcha: asset cache-busting

Every page pins its CSS and JS with a version query, currently `?v=10`:

```html
<link rel="stylesheet" href="css/components.css?v=10">
```

**If you edit any CSS or JS you must bump that number in all nine HTML pages.** Browsers cache
aggressively, so an unbumped edit appears to do nothing — this caused real confusion during
development. Static responses also send `Cache-Control: no-store`, but the version bump is still
required.

## Deploy to Render

`render.yaml` defines the service: Node runtime, `npm ci --omit=dev` build, `npm start`,
health check on `/api/health`, Singapore region, free plan.

The deploy is Git-backed, so the repo must be pushed to GitHub, GitLab or Bitbucket first.

**Secrets** are declared with `sync: false` and must be filled in during the Blueprint step:

| Key | Required | Purpose |
|---|---|---|
| `GROQ_API_KEY` | for AI ranking | Without it, ranking falls back to rules-only order |
| `SERPAPI_KEY` | for admin search | Not needed on the live site — admin is disabled there |
| `GROQ_MODEL` | prefilled | `openai/gpt-oss-120b` |
| `ADMIN_ENABLED` | prefilled `false` | See below |

**Admin is disabled on the deployed site by default**, and `/admin.html` plus `/api/admin/*`
return 404 rather than 403 so their existence isn't advertised. Two reasons, both deliberate:

1. The admin endpoints write to `data/schemes.json`, and Render's filesystem is **ephemeral** —
   every edit would silently vanish on the next restart or redeploy.
2. The page has no authentication. Anyone could edit or delete the scheme data.

To edit data, work locally (`ADMIN_ENABLED=true` in `.env`), commit the updated
`data/schemes.json`, and let the next deploy pick it up. If you later need a writable admin on
a public host, attach a paid Render disk and put the page behind a password before exposing it.

`.env` is gitignored. Never commit it — set secrets in the Render dashboard instead.

## Structure

```
server.js                 hand-rolled static server + JSON API + Groq/SerpApi proxies
data/
  schemes.json            29 scheme records
  categories.json         domain definitions and question sets
public/
  index / domain / questionnaire / results / scheme-details
  compare / saved / checklist / admin   .html
  css/                    tokens, base, layout, components
  js/
    api.js                jQuery AJAX helpers
    storage.js            localStorage (IDs and drafts only)
    rules.js              rule evaluation engine
    questionnaire.js      branching form definition
    results.js            AI-ranked results, filters, cards
    details.js            scheme detail sections
    compare-ui.js         compare drawer and feature matrix
    checklist.js / admin.js / dropdown.js / app.js
docs/                     spec, demo script
tests/                    manual rule cases and sample profiles
```

`public/js/live.js` and `GET /api/search/live` remain in the codebase but are no longer loaded by
`results.html` — the "Explore live official sources" section was removed from the results page.