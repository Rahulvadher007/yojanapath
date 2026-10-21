# YojanaPath — find government support that fits your situation

> **Live Demo:** [https://yojanapath.onrender.com](https://yojanapath.onrender.com)  
> **GitHub Repository:** [https://github.com/ronak-ravtode/yojanapath](https://github.com/ronak-ravtode/yojanapath)

Scheme discovery for Startup Funding and Health Coverage. A user picks a domain, answers a short branching questionnaire, and sees the schemes that plausibly fit, with a per-condition breakdown of *why*.

The product constraint that shapes everything: **we never claim eligibility.** We show what we know, where it came from, and when — then point at the official source.

## Tech Stack

- **Frontend:** Pure Vanilla JavaScript (ES6+), Modern Semantic HTML5, Vanilla CSS3 (Custom Design System with CSS Tokens). **Zero jQuery or external frontend libraries.**
- **Networking:** Native `fetch()` API with `AbortController` timeouts and standard Promises.
- **Backend:** Node.js using built-in modules only (`http`, `fs`, `path`, `https`, `url`) — no Express, zero production dependencies.
- **AI Ranking:** Groq Cloud API (`openai/gpt-oss-120b` or `llama-3.1-8b-instant`) strictly for scoring relevance order, never for deciding eligibility.
- **Live Search:** SerpApi for querying verified official government domains (`.gov.in`, `.nic.in`, `mudra.org.in`).
- **Storage:** LocalStorage for IDs, drafts, and checklist states only (anonymous, privacy-first, zero sensitive data).
- **Deployment:** Render (automated Git-backed deployment via `render.yaml`).

## Run Locally

```bash
node server.js
# open http://localhost:3000
```

Node.js built-ins only (`http` / `fs` / `path` / `https` / `url`) — no Express, no bundler or build step, no npm install required. The sole dev dependency is `nodemon` for local reloading (`npm run dev`).

Copy `.env.example` to `.env` to enable the optional AI ranking and admin search. Without keys the app still works: results fall back to deterministic rule-ranked order and the admin page shows a note.

## How results are decided

Two independent layers, deliberately separated:

| Layer | Runs | Decides |
|---|---|---|
| **Rule engine** (`public/js/rules.js`) | client-side, offline | **Correctness** — `matched` / `not-matched` / `needs-confirmation` / `not-applicable` per condition |
| **AI ranking** (`POST /api/ai/suggest`, Groq) | server-side | **Order and relevance score only** — never eligibility |

After the questionnaire completes, results call the AI endpoint automatically, show a loading skeleton while scoring runs, then render **only schemes scoring 60+**. The status line states the threshold, and notes that scores are relevance rather than eligibility. Rules decide correctness; AI decides ranking. Neither is trusted for the other's job.

Filters operate on the visible 60+ subset, not the full dataset.

## API

| Route | Purpose |
|---|---|
| `GET /api/schemes?domain=` | Scheme records for a domain |
| `GET /api/categories` | Domain definitions and question sets |
| `GET /api/health` | Liveness check |
| `POST /api/ai/suggest` | AI relevance ranking (Groq) |
| `GET /api/search/live` | SerpApi search restricted to government domains |
| `POST /api/admin/{add,update,remove}` | Write to `data/schemes.json` (local dev only) |
| `GET /api/admin/search` | SerpApi-backed source discovery for the admin page |

## Environment

All secrets stay server-side in `.env` and are never sent to the client.

| Variable | Notes |
|---|---|
| `GROQ_API_KEY` | Groq key. Without it, ranking falls back to rules-only order. |
| `GROQ_MODEL` | Defaults to `llama-3.1-8b-instant`. `.env` currently sets `openai/gpt-oss-120b`. |
| `SERPAPI_KEY` | Canonical name. `SERP_API_KEY` is accepted as an alias via `ENV_ALIASES` in `server.js`. |
| `ADMIN_ENABLED` | Set to `true` locally to unlock the admin panel. |

The AI endpoint receives **only** the records already in the dataset, is told not to invent schemes, and any invented ID is filtered out server-side. Responses are cached for ten minutes; rate limits (429) are retried with backoff.

## Data & limitations

**Read this before demoing — the dataset is unevenly filled.**

23 schemes: 9 `startup-funding`, 14 `health-coverage`. But:

| Field | Populated |
|---|---|
| `eligibilityRules` | **6 / 23** |
| `documents` | **6 / 23** |
| `documentedEligibility` | 5 / 23 |
| `verificationStatus: verified` | **2 / 23** |

The remaining 17 carry placeholder application steps ("Open the official page linked below") and no stored rules or document lists. **We deliberately did not fabricate eligibility criteria or document requirements for live government schemes** — a wrong document list gets someone's application rejected. Those pages render an explicit "we have not recorded this yet" gap state linking to the official URL instead.

Every record carries `officialInfoUrl`, `sources[]` with `checkedAt`, `lastVerified` and `verificationStatus`.

Other limitations:

- `data/` sits outside `public/` and is served only through `/api/schemes`.
- Interface is **English-only**. Live search forces `hl=en` and drops Indic-script results server-side so responses never mix languages.
- localStorage keys are prefixed `yojanapath.` (lowercase) and hold IDs and drafts only — never Aadhaar, bank or medical data.
- No automated test suite. Verify changes by walking the demo flow against both domains, plus `/api/health` returning 200.

## Provenance model

Every piece of content is labelled by origin, and the distinction is surfaced in the UI:

1. **Rule result** — computed by our engine from the user's answers
2. **Source transcription** — our review of the official page, dated, with the source domain shown
3. **Official decision** — the authority's, and the only binding one

## Features

- **Questionnaire** — branching multi-step form; startup funding asks about state, applicant type, business stage, recognition, purpose, amount, urgency, registration and Udyam. Health coverage branches by intent (understand / apply / claim).
- **Results** — AI-ranked cards with a score, relevance bar, deep-dive link, and save toggle.
- **Compare drawer** — opens from any card; pick up to 5 schemes (`YPStore.MAX_COMPARE` in `storage.js`) from the current set, then view a side-by-side feature matrix. Rows are computed from real record fields, not hardcoded.
- **Scheme details** — overview plus Eligibility, How to apply, an interactive Documents checklist (persisted per scheme via `YPStore.getCheck`/`setCheck`) and Sources, each with provenance and a dated source line.
- **Build checklist** — persists in localStorage and can be checked off or printed.
- **Admin** — search official sources, add, edit descriptions and categories, mark verification, remove records (protected, local development only).

## Maintenance: asset cache-busting

Every page pins its CSS and JS with a version query (currently `?v=11`):

```html
<link rel="stylesheet" href="css/components.css?v=11">
<script src="js/app.js?v=11"></script>
```

When updating CSS or JS files, increment this version parameter across the HTML templates to ensure clients load the latest scripts immediately.

## Deploy to Render

`render.yaml` defines the service: Node runtime, `npm ci --omit=dev` build, `npm start`, health check on `/api/health`, Singapore region, free plan.

The deploy is Git-backed. Push to the GitHub repository to trigger an automated deployment:

**Live URL:** [https://yojanapath.onrender.com](https://yojanapath.onrender.com)

**Secrets** are declared with `sync: false` in `render.yaml` and must be filled in during the Blueprint step:

| Key | Required | Purpose |
|---|---|---|
| `GROQ_API_KEY` | for AI ranking | Without it, ranking falls back to rules-only order |
| `SERPAPI_KEY` | for admin search | Not needed on the live site — admin is disabled there |
| `GROQ_MODEL` | prefilled | `openai/gpt-oss-120b` |
| `ADMIN_ENABLED` | prefilled `false` | Disabled on deployed environments |

## Project Structure

```
server.js                 Hand-rolled static server + JSON API + Groq/SerpApi proxies
render.yaml               Render blueprint deployment specification
data/
  schemes.json            23 scheme records
  categories.json         Domain definitions and question sets
public/
  index / domain / questionnaire / results / scheme-details
  compare / saved / checklist / admin   .html
  css/                    tokens, base, layout, components
  js/
    api.js                Native fetch API helpers + Promise chaining
    storage.js            localStorage helpers (IDs and drafts only)
    rules.js              Deterministic rule evaluation engine
    questionnaire.js      Branching multi-stage form logic
    results.js            AI-ranked cards, filtering, sorting
    details.js            Scheme detail rendering and checklists
    compare-ui.js         Compare drawer and side-by-side feature matrix
    compare.js            Standalone comparison table
    checklist.js          Interactive scheme document checklist
    dropdown.js           Accessible custom select dropdown
    app.js                Shared navigation, back button, escaping, skeletons
docs/                     Architecture specs, viva preparation, demo scripts
```