   # YojanaPath — Viva Preparation Guide (4 Members)

   **Project:** YojanaPath — Government scheme discovery for Startup Funding and Health Coverage
   **Stack:** Node.js (built-in modules only) + Pure Vanilla JavaScript (zero jQuery/frontend libraries) + JSON + Groq (AI ranking) + SerpApi (official-source search) + Render (deploy)

   > **How to use this document.** Each member owns exactly one section. Read your own section
   > completely, then read Part 0 (everyone must know this) and Part 5 (shared Q&A). Sections are
   > written so you can explain them out loud without opening the code.

   ---

   ## Part 0 — The 60-second project pitch (EVERYONE must know this)

   **Problem:** In India there are hundreds of central and state government schemes — startup
   funding, loans, subsidies, health coverage. The information exists on official `.gov.in`
   websites, but it is scattered across dozens of departments, written in bureaucratic language,
   and people don't know *which* scheme applies to *their* situation. Most citizens search by
   scheme name, not by situation, so they never find the one that fits.

   **Solution:** YojanaPath inverts the search. The user never types a scheme name. Instead the
   user describes their situation through a short branching questionnaire, and the app maps that
   situation onto government schemes and shows **why** each result appeared.

   **The one rule that defines the whole project:**
   > **We never claim eligibility. We show what we know, where it came from, and when — then point
   > at the official source.**

   Three layers of truth are kept separate and shown separately in the UI:

   | Layer | What it is | Who produces it |
   |---|---|---|
   | **Rule result** | `matched` / `not-matched` / `needs-confirmation` / `not-applicable` | Our rule engine, from the user's answers |
   | **Source transcription** | Our human review of the official page, with a date | Us, manually, dated |
   | **Official decision** | The authority's ruling | The government. The only binding one |

   **Two independent engines, deliberately separated:**

   | Layer | Where it runs | What it decides | Never decides |
   |---|---|---|---|
   | **Rule engine** (`public/js/rules.js`) | Client-side, offline, in the browser | **Correctness** — matched / not-matched / needs-info | Ranking order, relevance |
   | **AI ranking** (`POST /api/ai/suggest`, Groq) | Server-side | **Order and relevance score only** | Eligibility — ever |

   Rules decide correctness. AI decides ranking. Neither is trusted for the other's job. That
   separation is the strongest design decision in the project and it is the single best answer to
   "why did you use AI in a government-scheme tool?"

   **Scale of the dataset (say these numbers exactly):**
   - 2 pathways (domains): `startup-funding`, `health-coverage`
   - **23 scheme records** in `data/schemes.json` — **9 startup-funding**, **14 health-coverage**
   - 2 domain definitions + question sets in `data/categories.json`
   - Only **6 of 23** records have stored eligibility rules; only **2 of 23** are marked `verified`
   - The other 17 deliberately carry placeholder text instead of invented criteria — see Part 6

   **One-line answer if asked "what did *you* build?":**
   Pick the honest answer for *your* section, name 2–3 concrete files, and say what a user can now
   do that they couldn't before. Never say "we built everything" — the team owns four parts.

   ---

   ## Part 1 — Member 1: Startup Funding Section

   ### 1.1 Your role in one line
   > "I own the **startup funding pathway** — the startup goal cards, the startup branch of the
   > questionnaire, the startup rule conditions, and the 9 startup scheme records that feed the
   > results page."

   ### 1.2 What your section does (features)

   1. **Startup goal cards.** When a user picks the startup pathway, the first stage shows five
      visually distinct goal cards with inline SVG icons:
      - Turn an idea into a business (`idea`)
      - Fund an early-stage startup (`early`)
      - Purchase equipment or expand (`equipment`)
      - Find seed or innovation support (`seed`)
      - Find a business loan or subsidy (`loan`)

   2. **Goal-driven question flow.** The goal the user picks actually *changes* the questions they
      are asked later. This is the "branching" part:
      - Choosing `idea`, `early`, or `seed` **adds** a *DPIIT recognition* stage, because seed
      programmes are the only ones that gate on recognition status.
      - Choosing `equipment` **filters** the *funding purpose* dropdown down to only
      "Buying equipment" and "Day-to-day working capital" — incubation options are removed.
      - Choosing `loan` removes the "Incubation support" option, because loan schemes don't fund incubation.
      - A user who only wants to explore is never shown *personal* questions they didn't need.

   3. **Startup-only question fields.** Ten fields in total across the startup flow:
      - `state` — where will it operate? (Gujarat, Maharashtra, Delhi, Karnataka, Other)
      - `applicantType` — individual founder / recognised startup / MSME
      - `businessStage` — just an idea / early-stage / already operating
      - `recognitionStatus` — recognised / applied-awaiting-decision / no recognition
      - `fundingPurpose` — starting / equipment / working capital / incubation
      - `fundingAmount` — **numeric input in ₹ lakh** (0–100, step 0.5), with a select fallback band
      - `urgency` — radio chips: within a month / within a few months / just planning
      - `occupation` — salaried / self-employed / agriculture / daily-wage / not working
      - `incorporationStatus` — not registered / proprietorship / partnership / private limited
      - `msmeUdyam` — registered on the Udyam portal? yes / no / not sure

   4. **Startup-specific rule conditions.** Startup records carry machine-readable conditions such
      as:
      - Startup India Seed Fund: `applicantType in [startup, individual]` **AND**
      `businessStage in [idea, early-stage]` **AND** `recognitionStatus in [recognised, applied]`
      - Gujarat Startup Innovation Assistance: state-based + applicant type + amount band
      - PM MUDRA Yojana: applicant type + business stage + purpose (the only **verified** startup record)

   5. **The 9 startup records you own** in `data/schemes.json` (all `domain: "startup-funding"`):

      | # | Scheme | Benefit type | Rules | Docs | Status |
      |---|---|---|---|---|---|
      | 1 | Startup India Seed Fund Scheme | `seed-funding` | 3 | 3 | needs-review |
      | 2 | Gujarat Startup Innovation Assistance | `grant` | 3 | 3 | needs-review |
      | 3 | Pradhan Mantri MUDRA Yojana | `loan` | 3 | 3 | **verified** |
      | 4 | Credit Guarantee Scheme for Startups (CGSS) | `loan` | 0 | 0 | needs-review |
      | 5 | Startup India Fund of Funds 2.0 | `fund-of-funds` | 0 | 0 | needs-review |
      | 6 | Startup India Regulatory Support | `advisory` | 0 | 0 | needs-review |
      | 7 | PSB Loans in 59 Minutes | `loan` | 0 | 0 | needs-review |
      | 8 | Stand-Up India | `loan` | 0 | 0 | needs-review |
      | 9 | Startup India Scheme | `scheme` | 0 | 0 | needs-review |

   6. **Startup result cards** on the results page show the AI relevance score, the score bar, the
      administering authority, a one-line benefit summary, the "For" line, a verified badge (only
      on verified records), a "Next" hint (only when a condition is unresolved), plus *Deep dive*
      and *Compare* buttons.

   ### 1.3 The user flow you own

   ```
   index.html  "Explore startup funding" button
         ↓  (domain=startup-funding)
   domain.html → single-domain intro: description + "what we will ask" list + Start
         ↓
   questionnaire.html?domain=startup-funding
      Stage 1  Your goal            → pick one of 5 goal cards
      Stage 2  About the business   → state, applicantType, businessStage
      Stage 3  Recognition          → recognitionStatus  (ONLY if goal = idea/early/seed)
      Stage 4  Narrow it down       → fundingPurpose, fundingAmount, urgency, occupation
      Stage 5  Registration         → incorporationStatus, msmeUdyam
      Stage 6  Review answers       → editable table of your answers
         ↓  (answers saved to localStorage)
   results.html?domain=startup-funding
      GET /api/schemes?domain=startup-funding  → 10 records
      YPRules.evaluate() per record  →  YPRules.rank()
      POST /api/ai/suggest  →  AI scores  →  show only 60+
   ```

   ### 1.4 Files you own / will be asked about

   | File | Lines | Why it matters |
   |---|---|---|
   | `public/js/questionnaire.js` | 223 | `GOALS['startup-funding']` (5 goals), `FIELDS` (field definitions, labels, options, "Why" help text), `flowFor()` startup branch, `purposeOptions()` goal-based option filtering |
   | `public/js/rules.js` | 40 | The engine — see Part 4 (shared) |
   | `data/schemes.json` (startup records) | — | Your 10 records, their `eligibilityRules`, `documents`, `applicationSteps`, `sources`, `verificationStatus` |
   | `data/categories.json` | 16 | The `startup-funding` domain definition and its `questionsAsked` list |
   | `public/results.html` + `public/js/results.js` | 3.7KB / 132 | Card rendering, filters, AI threshold — shared, but you demo with startup data |

   ### 1.5 Tech stack used in your section

   - **Pure Vanilla JavaScript (ES6+)** inside IIFEs (`(function (g) { ... })(window)`) using standard
   DOM and Web APIs (`document.querySelector`, `querySelectorAll`, `addEventListener`, `classList`,
   `setAttribute`, native `fetch`). No modules, no bundler, no build step. Global namespace objects:
   `window.YPRules`, `window.YPStore`, `window.YPApi`, `window.YPResults`.
   - **Zero frontend dependencies or CDN scripts** — completely migrated away from jQuery to native
   browser APIs (`fetch` with `AbortController`, standard DOM methods). Instant load, zero external CDN risks.
   - **JSON** as the only data format; the server parses it with `JSON.parse`.
   - **HTML5** native form semantics — `<select>`, `<input type="number">`, `<input type="radio">`
   with `role="radiogroup"`, `<button role="radio" aria-checked>`.
   - **Inline SVG icons** for the goal cards (no image files, so no network cost and they inherit
   `currentColor` for theming).
   - **No database** — JSON files on disk + `localStorage` in the browser.

   ### 1.6 Requirements your section satisfies

   **Functional**
   - FR-S1: The startup pathway MUST offer at least 5 distinct goal choices before asking any detail question.
   - FR-S2: The question flow MUST be goal-dependent (recognition asked only for seed-type goals; funding purpose options filtered by goal).
   - FR-S3: The flow MUST be skippable-safe — every question has an explicit *"I'm not sure — skip for now"* option, and "not sure" is a legal answer that maps to `needs-confirmation`, never to a failure.
   - FR-S4: Startup scheme records MUST express eligibility as machine-readable rules with field/operator/value, a human description, the source URL, and the date it was checked.
   - FR-S5: The results page MUST show, for each result, the AI relevance score and the reason status, and MUST label the score as relevance, not eligibility.
   - FR-S6: Only records scoring **60+** on AI relevance are shown; the status line MUST state the threshold.

   **Non-functional**
   - NFR-S1: Rule evaluation MUST work **fully offline** in the browser (no network dependency for correctness).
   - NFR-S2: Zero personal or sensitive data stored — no Aadhaar, no bank details, no medical records.
   - NFR-S3: Accessible — every control has a label, `aria-describedby` help text, visible focus, error summary with `role="alert"`, `aria-invalid` on failed fields.
   - NFR-S4: The questionnaire MUST survive a page refresh (draft persisted per domain).
   - NFR-S5: The app MUST work with no API keys at all (AI ranking degrades to rule-only order).

   ### 1.7 Viva Q&A for you

   **Q: Why did you make the questionnaire goal-driven instead of just asking a fixed list of questions?**
   > Because a fixed list wastes the user's time and asks irrelevant things. If you only want a
   > business loan, asking about DPIIT recognition is noise. We start with a goal card, then only
   > ask follow-ups that can *change the recommendation*. Fewer questions, and every question earns
   > its place. It also mirrors how people actually think — "I need money for equipment" — not in
   > department language.

   **Q: Why is `fundingAmount` a number in lakhs and not a dropdown?**
   > Because precise amounts matter for eligibility bands (a scheme may cover up to ₹10 lakh but
   > not ₹50 lakh). We ask in lakhs with `inputmode="decimal"`, min/max/step validation, and a
   > "rough figure is enough" hint — and we still keep a banded select fallback so the user is never
   > blocked.

   **Q: How is a startup record's eligibility represented?**
   > As an array of rules, each with `field` (which questionnaire answer it reads), `operator`
   > (`equals` / `in` / `gte` / `lte`), `value`, `required`, a human-readable `description`, the
   > `sourceUrl` we transcribed it from, `sourceCheckedAt`, and an `unknownNextStep` telling the
   > user what to do if they answered "not sure". That last field is what turns a dead end into an
   > action.

   **Q: What happens to a startup scheme that has no stored rules?**
   > It is labelled **`rules-pending` — "Conditions not yet verified"**, and it is ranked *below*
   > a scheme that matched but below a scheme that needs info. It is never shown as a match. A
   > record with no conditions proves nothing, so it must never read as a match — that line is
   > literally in `rules.js`.

   **Q: How many startup schemes are in your dataset and how complete are they?**
   > 9 startup records. 3 have full rules and document lists (Startup India Seed Fund, Gujarat
   > Startup Innovation Assistance, MUDRA), and 1 is verified (MUDRA). The other 7 have no stored
   > conditions — and that is a deliberate choice, see Part 6.

   ### 1.8 Demo script for your section (2 minutes)

   1. On the homepage click **"Explore startup funding"**.
   2. Show the pathway card and the "What we will ask" list.
   3. In the questionnaire pick the goal **"Turn an idea into a business"** → point out that the
      **Recognition** stage now appears. *(This is the branching proof.)*
   4. Change the goal to **"Find a business loan or subsidy"** → show that funding-purpose options
      no longer include incubation, and Recognition drops away.
   5. Answer a couple of fields, leave one as **"I'm not sure"** → click Continue.
   6. On Review, point at the "Not sure" note: *"those conditions become needs confirmation."*
   7. On results, point at the score (relevance, not eligibility), a **Matched** badge, and a
      **Needs confirmation** badge with its "Next" hint.
   8. Open the MUDRA record — it has the **Verified** badge with the date.

   ---

   ## Part 2 — Member 2: Healthcare Section

   ### 2.1 Your role in one line
   > "I own the **health coverage pathway** — the healthcare goal cards, the health branch of the
   > questionnaire, the health rule conditions, and the 14 health scheme records."

   ### 2.2 What your section does (features)

   1. **Healthcare goal cards.** Four goals, each framed around *intent*, not around a scheme:
      - Help with hospital costs (`hospital`)
      - Coverage for myself (`myself`)
      - Coverage for my family (`family`)
      - Understand a health scheme (`understand`) — explicitly "just exploring — skip the personal questions"

   2. **Intent-driven branching.** The `understand` goal is the "explorer" path: it **skips the
      personal-data stage entirely**. Users who pick `hospital`, `myself`, or `family` get an extra
      *Existing cover* stage asking whether they already have government health cover, so we can
      avoid recommending a scheme they already have.

   3. **Health-specific question fields:**
      - `state` — same field, but the label changes to *"Which state do you live in?"* (`labelHealth`)
      - `ageBand` — 0–18 / 18–25 / 26–40 / 41–59 / 60+ (used for senior-citizen schemes and upper age limits)
      - `beneficiaryCategory` — low-income family / general or other / senior citizen / worker family
      - `hasGovtCoverage` — yes / no (avoid duplicates)
      - `occupation` — label switches to *"What is your work category?"* — ESIC covers specific worker categories
      - `incomeBand` — below ₹1L / ₹1–3L / ₹3–6L / above ₹6L — *"You may skip this."*
      - `familySize` — 1–2 / 3–4 / 5+
      - `rationCard` — yes / no / not sure — *"Many state schemes use the ration card as an income proxy. You may skip this."*
      - `gender` — female / male / prefer not to say — a few schemes target women specifically
      - `hospitalizationType` — any treatment / planned surgery / ongoing treatment / just checking

   4. **Health-specific rule conditions:**
      - **Ayushman Bharat PM-JAY** (verified): beneficiary category + occupation — cashless cover up to ₹5 lakh per family per year for eligible families
      - **Mukhyamantri Amrutum (MA) Yojana, Gujarat**: state + beneficiary category
      - **Senior Citizen Health Support (PM-JAY 70+ expansion)**: age band + category

   5. **The 14 health records you own** (all `domain: "health-coverage"`):

      | # | Scheme | Benefit type | Rules | Docs | Status |
      |---|---|---|---|---|---|
      | 1 | Ayushman Bharat PM-JAY | `health-cover` | 2 | 3 | **verified** |
      | 2 | Mukhyamantri Amrutum (MA) Yojana — Gujarat | `health-cover` | 2 | 3 | needs-review |
      | 3 | Senior Citizen Health Support (PM-JAY 70+ expansion) | `health-cover` | 2 | 2 | needs-review |
      | 4 | Mukhyamantri Amrutum Vatsalya Yojana (MAV), Gujarat | `health-cover` | 0 | 0 | needs-review |
      | 5 | Ayushman Bharat PM-JAY (AB-PMJAY), Gujarat | `health-cover` | 0 | 0 | needs-review |
      | 6 | Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJY) | `health-cover` | 0 | 0 | needs-review |
      | 7 | Ayushman Bharat Digital Mission (ABDM) | `health-cover` | 0 | 0 | needs-review |
      | 8 | Employee State Insurance Scheme (ESIC) | `health-cover` | 0 | 0 | needs-review |
      | 9 | National Health Benefit Package (PM-JAY HBP) | `health-cover` | 0 | 0 | needs-review |
      | 10 | Chief Minister's Comprehensive Health Insurance Scheme | `scheme` | 0 | 0 | needs-review |
      | 11 | Mukhmantri Sehat Bima Yojana | `scheme` | 0 | 0 | needs-review |
      | 12 | Niramaya Health Insurance Scheme | `scheme` | 0 | 0 | needs-review |
      | 13 | Pradhan Mantri Suraksha Bima Yojana | `scheme` | 0 | 0 | needs-review |
      | 14 | Mukhya Mantri Himachal Health Care Scheme (HIMCARE) | `scheme` | 0 | 0 | needs-review |

   6. **Your domain definition** in `data/categories.json`:
      > *"Answer a few questions about your state, age band and beneficiary category. We show
      > potential matches and what is still unknown."* — questions asked: State, Age band,
      > Beneficiary category, Existing government health coverage.

   7. **Health result cards** additionally carry the *hospitalization type* context, so a user
      looking at cashless vs reimbursement cover sees the right scheme first.

   ### 2.3 The user flow you own

   ```
   index.html  "Health coverage for me or my family"
         ↓  (domain=health-coverage)
   domain.html → single-domain intro
         ↓
   questionnaire.html?domain=health-coverage
      Stage 1  Your goal              → hospital / myself / family / understand
      Stage 2  Household basics       → state, ageBand, beneficiaryCategory
      Stage 3  Existing cover         → hasGovtCoverage   (SKIPPED if goal = understand)
      Stage 4  Family circumstances   → occupation, incomeBand, familySize, rationCard, gender
      Stage 5  Care needed            → hospitalizationType
      Stage 6  Review answers
         ↓
   results.html?domain=health-coverage  →  GET /api/schemes?domain=health-coverage  →  14 records
   ```

   ### 2.4 Files you own

   | File | Why it matters |
   |---|---|
   | `public/js/questionnaire.js` → `GOALS['health-coverage']`, health branch of `flowFor()`, health entries in `FIELDS` (note the `labelHealth` dual-label mechanism) | Your goal cards, your branch, your questions |
   | `data/schemes.json` (14 health records) | Your dataset |
   | `data/categories.json` → `health-coverage` entry | Your domain description + question list |
   | `public/scheme-details.html` + `public/js/details.js` | Where health users read eligibility, documents, and sources |
   | `public/js/results.js` (shared) | Your health cards |

   ### 2.5 Tech stack used in your section

   Same base stack as the rest of the project (pure Vanilla JS IIFE with modern standard Web APIs,
   zero jQuery/frameworks, JSON, no build step), plus health-specific details:

   - **Dual-label mechanism** — each field can have `label` and `labelHealth`, so `state` becomes
   *"Where will it operate?"* for a business but *"Which state do you live in?"* for a patient,
   and `occupation` becomes *"What is your work category?"*. Same stored key, right wording.
   - **`role="radiogroup"` + `<button role="radio" aria-checked>`** for goal cards — because a
   button card is not a native radio input, we implement the ARIA radio pattern manually.
   - **`<input type="number" inputmode="decimal">`** for numeric answers (funding amount) so mobile
   keyboards show digits only.
   - **Inline SVG** medical/gov icons — a cross for hospital, a shield for coverage, a family glyph.
   - **No PHI (protected health information)** is ever requested, stored, or logged. The app asks
   for *categories*, never diagnoses, never medical records.

   ### 2.6 Requirements your section satisfies

   **Functional**
   - FR-H1: The health pathway MUST offer 4 intent-based goals, including a non-personal "understand" path.
   - FR-H2: The "understand" goal MUST NOT request personal household data.
   - FR-H3: Personal financial questions (`incomeBand`, `rationCard`) MUST be explicitly marked optional/skippable — we should not deter a user who will not disclose income.
   - FR-H4: Health records MUST distinguish beneficiary categories (low-income / general / senior citizen / worker family) and occupations, because eligibility differs.
   - FR-H5: Age must be captured as a band, not a date of birth — we need a band to match senior-citizen schemes, and a band avoids collecting identifying data.
   - FR-H6: Where a scheme's conditions are unknown, the detail page MUST show an explicit "we have not recorded this yet" state with a link to the official page — never a blank section.

   **Non-functional**
   - NFR-H1: **Privacy by design** — no identifiable health data, ever. Only categories and bands.
   - NFR-H2: No Aadhaar, bank, or medical-record fields exist anywhere in the questionnaire.
   - NFR-H3: Sensitive-sounding questions must carry a "Why" explanation so the user understands why it is being asked.
   - NFR-H4: Must be usable on a low-end phone (large tap targets, chips instead of tiny radio dots, horizontal scroll for wide tables).

   ### 2.7 Viva Q&A for you

   **Q: Why ask age as a band and not a date of birth?**
   > Two reasons. First, functionally: what we need is the band, because schemes gate on bands like
   > "60 and above" or "70+". Second, privacy: a band is not an identifier, a DOB is. We collect the
   > least identifying information that still lets us match a rule.

   **Q: Why are income and ration card optional?**
   > Because they are the most sensitive questions and the most likely to make someone abandon the
   > form. Many state schemes use the ration card as an income proxy, so it's genuinely useful — but
   > the user can skip it, and a skipped condition becomes **"needs confirmation"** with a next step,
   > not a wrong answer. Skipping must never produce a false rejection.

   **Q: What is the difference between `needs-info` and `does-not-match`?**
   > `does-not-match` means a known condition failed — we have the rule, your answer contradicts it.
   > `needs-info` means a condition is genuinely undetermined because you skipped it. The second is
   > actionable ("check your ration card status") and the first is a real rule-out. Conflating them
   > would be a lie in either direction.

   **Q: How do you know PM-JAY covers "up to ₹5 lakh per family per year"?**
   > We transcribed it from the official page on a specific date and stored that date and URL with
   > the rule. The UI shows the source domain and the checked date next to the condition. We do not
   > claim it — we cite it and date it, and the authority makes the final call.

   **Q: Why do some health records show "no conditions recorded" instead of details?**
   > We refuse to fabricate eligibility for live government schemes. A wrong document list or income
   > ceiling gets someone's application rejected. Those records show an explicit gap state pointing
   > at the official page. See Part 6.

   ### 2.8 Demo script for your section (2 minutes)

   1. On the homepage click **"Health coverage for me or my family"**.
   2. Pick the goal **"Understand a health scheme"** → show that the personal stages (Existing
      cover, Household basics, Family circumstances) are skipped and you go straight to Care needed.
      *(This is your branching proof.)*
   3. Go back, pick **"Coverage for my family"** → show the *Existing cover* stage now appears.
   4. Answer household basics; set **income band** to *"I'm not sure"* and **ration card** to *"Not sure"*.
   5. On Review, point out the "Not sure" note.
   6. On results, show the **Ayushman Bharat PM-JAY** card: the **Verified** badge with the date,
      and a condition where your "not sure" answer produced a **Needs confirmation** badge with a
      "Next" action.
   7. Deep-dive into PM-JAY → show Eligibility split into *Matches / Does not match / Needs
      confirmation / Not applicable*, the documents checklist, and the dated Sources list.

   ---

   ## Part 3 — Member 3: Landing Page & Compare Section

   ### 3.1 Your role in one line
   > "I own the **landing experience and the comparison feature** — the homepage, the pathway
   > picker, the visual design system, and the side-by-side compare drawer that compares real
   > record fields rather than hardcoded text."

   ### 3.2 What your section does (features)

   **Landing — `public/index.html`**
   1. **Hero section** — headline *"Find the support that fits your situation."* plus a lead
      paragraph that states the value proposition: *"You don't need to know a scheme's name or
      department. Tell us what you need, and we'll check the known government scheme rules, show
      you exactly why something matches, and point you to the official source for confirmation."*
   2. **Two direct CTAs** — "Explore startup funding" and "Health coverage for me or my family",
      both deep-linking straight into the questionnaire with `?domain=`.
   3. **Trust bar (factbar)** — Pathways: 2 · Schemes in the dataset: 6 · Records verified: 2 of 6,
      with the disclaimer *"Potential matches only — the scheme authority makes every eligibility
      decision."*
   4. **An inline result-card mockup** built in HTML/CSS — shows a *Potential match* badge, "2 of 3
      conditions checked", a scheme name, "verified 15 Oct 2026", and two **Matched** conditions
      plus one **Needs confirmation** condition. It is fully static markup, not an image — so it
      scales and is readable by screen readers (`role="img"` with a full `aria-label`).
   5. **Two feature cards** — "Capital for your business" and "Cover for treatment costs", each
      with 4 tick-list bullets explaining what the pathway covers.
   6. **Privacy reassurance** — *"No account. Nothing sensitive is asked. Never a promise of approval."*
   7. **Shared header/footer** — brand mark, mobile menu toggle, nav with `aria-current="page"`
      highlighting, footer with a "verify every fact on the official site" note.

   **Pathway picker — `public/domain.html`**
   8. **Two-up pathway picker** with custom SVG artwork per domain (a rising bar chart for startup,
      a shield with a heartbeat line for health), rendered from `GET /api/categories` — so the
      pathways are **data-driven, not hardcoded**.
   9. **Animated dot indicator** showing which of the two pathways is selected.
   10. **Dual-mode page** — if the URL already has `?domain=startup-funding` (deep link from the
      homepage), the page shows a **single-domain intro view** instead of the picker: the domain
      description, the *What we will ask* list, and a Start button. Same file, two modes.
   11. **Graceful failure** — if `/api/categories` fails, the picker is replaced with a friendly
      alert offering direct links to both pathways, so the user is never stuck.

   **Compare — `public/js/compare-ui.js`**
   12. **Drawer-based compare** launched from any result card's *Compare* button. It is a slide-over
      panel with an overlay, `aria-hidden` toggling, focus capture on open, focus restore on
      close, and Escape-to-close.
   13. **Two-stage flow:**
      - **Stage 1 — Pick.** The scheme you clicked is pinned as the "Starting from" column (with
         its AI score), and you tick up to **4 more** from the currently visible results (`MAX_COLS
         = 5` total). The counter shows "n of 4 selected"; at the limit the remaining checkboxes
         are disabled and a message appears.
      - **Stage 2 — Matrix.** A side-by-side table.
   14. **Rows computed from real record fields — nothing hardcoded.** Nine boolean feature rows are
      derived by *testing* each record:
      - Cashless treatment cover → `benefit.type === 'health-cover'`
      - Loan or credit support → `benefit.type === 'loan'`
      - Grant or seed support → `benefit.type` in `[grant, seed-funding, fund-of-funds]`
      - Advisory or guidance only → `benefit.type === 'advisory'`
      - Pan-India (central) → `coverage.type === 'central'`
      - State-specific → `coverage.type === 'state'`
      - Eligibility rules stored → `eligibilityRules.length > 0`
      - Documents listed → `documents.length > 0`
      - Source verified → `verificationStatus === 'verified'`
      Plus three text rows: Benefit, Coverage, Authority.
   15. **Unanimous rows are dimmed** (`.cmp-unanimous`) — if every column agrees on a row, that
      row carries no information, so it is visually de-emphasised.
   16. **Tick / dash marks** — ✓ for yes, — for no, each with an `aria-label` of "Included" /
      "Not included" so the meaning is not colour-only.
   17. **Every row shows its data source** in a small hint (`benefit.type = health-cover`) — so the
      comparison is auditable, not magic.
   18. **Scoping** — the drawer only offers schemes from the *currently visible* AI-60+ set, so
      you never compare something the user was not shown.

   ### 3.3 The user flow you own

   ```
   index.html (landing)
      ├─ "Explore startup funding" ──────────────► questionnaire.html?domain=startup-funding
      ├─ "Health coverage for me or my family" ───► questionnaire.html?domain=health-coverage
      └─ feature card CTA ───────────────────────► domain.html?domain=...
                           ↓
   domain.html (pathway picker OR single-domain intro, data-driven from /api/categories)
                           ↓
   questionnaire → results → [Compare] button on a card
                           ↓
   compare drawer:  Pick (up to 5)  →  Matrix (side-by-side feature table)
   ```

   ### 3.4 Files you own

   | File | Size | Why it matters |
   |---|---|---|
   | `public/index.html` | 6.3 KB | The landing page |
   | `public/domain.html` | 6.5 KB | Pathway picker + single-domain intro (inline `<script>` at the bottom) |
   | `public/js/compare-ui.js` | 8.1 KB | The whole compare drawer — `MAX_COLS`, `FEATURES`, `TEXT_ROWS`, `open()`, `build()` |
   | `public/css/tokens.css` | 2.0 KB | The design system: colours, spacing, type scale, radii, shadows |
   | `public/css/base.css` | 1.5 KB | Reset + element defaults |
   | `public/css/layout.css` | 4.3 KB | Page shells, grids, bands, containers |
   | `public/css/components.css` | 31.3 KB | Cards, buttons, badges, forms, drawer, tables, skeletons |
   | `public/js/app.js` | 4.4 KB | Shared header/footer, back button, `esc()` escaping, `ypSkel()` skeletons, `ypCond()` evidence rendering |
   | `public/js/dropdown.js` | 7.0 KB | Nav dropdown behaviour |
   | `public/assets/logo.svg` | 0.3 KB | Vector logo |
   | `public/compare.html` + `public/js/compare.js` | 1.5 + 3.5 KB | The **older standalone compare page** — kept for reference, no longer linked from nav (the drawer is the primary flow) |

   ### 3.5 Tech stack used in your section

   - **Semantic HTML5** + a small, hand-written CSS system in four layers:
   `tokens.css` (variables) → `base.css` (reset) → `layout.css` (structure) → `components.css`
   (UI parts). No CSS framework, no Tailwind, no Bootstrap.
   - **CSS custom properties** for the whole theme — colour, radius, spacing, and type scale — so
   the palette can change in one file.
   - **One accent colour** (`#f54e00`, a government-India saffron-adjacent orange) plus a warm
   off-white canvas (`#26251e` ink). Design concept in the plan: *"Civic clarity with modern
   fintech polish."*
   - **Inline SVG** for all artwork — hero illustration, pathway icons, UI icons. No raster images,
   no icon font. SVGs inherit `currentColor`, so they theme automatically.
   - **Pure Vanilla JS** with native EventListeners, DOM traversal, and element manipulation (zero external libraries/CDN dependencies).
   - **ARIA patterns implemented manually** where HTML has no native equivalent:
   `role="radiogroup"` + `role="radio"` + `aria-checked` for card pickers;
   `role="img"` + `aria-label` for the decorative mockup;
   `aria-busy` + `aria-live` for loading states;
   `aria-hidden` on the closed drawer.
   - **Accessibility built in, not bolted on** — skip link, visible focus rings, `prefers-reduced-motion`
   respect, `aria-current="page"` on the active nav item, keyboard-closable drawer.
   - **Responsive** — mobile-first layout, grids collapse to a single column, wide tables get a
   horizontal-scroll wrapper (`.table-scroll`) instead of breaking the layout.
   - **Cache-busting:** every page pins CSS/JS with `?v=11`. **If you edit any CSS or JS you must
   bump that number in all nine HTML pages** — browsers cache hard, and an unbumped edit looks
   like nothing happened. This already caused confusion once during development.

   ### 3.6 Requirements your section satisfies

   **Functional**
   - FR-L1: The landing page MUST offer both pathways in the first screen and route directly into the correct questionnaire with the domain pre-set.
   - FR-L2: The pathway list MUST be data-driven from `/api/categories`, not hardcoded in HTML.
   - FR-L3: A deep link with `?domain=` MUST show a single-domain intro; without it, a picker.
   - FR-L4: The compare drawer MUST support up to 5 schemes, one of which is the "starting from" scheme.
   - FR-L5: Compare rows MUST be computed from actual record fields; no row may be hardcoded text.
   - FR-L6: Rows where all columns agree MUST be visually de-emphasised.
   - FR-L7: The compare pool MUST be limited to the currently visible (AI 60+) results.
   - FR-L8: The compare drawer MUST be fully keyboard-operable and Escape-closable, and MUST restore focus to the button that opened it.
   - FR-L9: Every failure state (API down) MUST offer a usable path forward.

   **Non-functional**
   - NFR-L1: **No build step, no bundler, no framework.** Plain files served as-is.
   - NFR-L2: WCAG-minded: contrast, focus visibility, labels, `aria-*` on custom controls, no colour-only meaning.
   - NFR-L3: Layout must not break on narrow screens; tables scroll horizontally.
   - NFR-L4: Fast first paint — static assets only, system font stack, no webfonts, no images to download.
   - NFR-L5: `Cache-Control: no-store` on static responses, plus the `?v=` version query as belt-and-braces.
   - NFR-L6: All user-supplied or data-supplied text must pass through `g.esc()` before it reaches `innerHTML` (XSS defence).

   ### 3.7 Viva Q&A for you

   **Q: Why build a drawer instead of a separate compare page?**
   > Because the compare action starts from a specific card. The user says "compare *this* one with
   > others". A separate page loses that context and adds a page load. The drawer keeps the starting
   > scheme pinned, keeps the results behind it, and lets the user change their mind and go back to
   > the pick list without losing anything. The old `compare.html` still exists but the drawer is
   > the primary flow.

   **Q: How do you generate the comparison rows? Are they hardcoded?**
   > No. Each row is a small function that *tests* the record: `s.benefit.type === 'loan'`,
   > `s.coverage.type === 'state'`, `(s.eligibilityRules || []).length > 0`. The label is
   > human-facing and the hint shows the underlying field and expression. So if we add a new scheme
   > with `benefit.type: 'grant'`, it lights up automatically — we never touch the compare code.

   **Q: Why dim rows where every column agrees?**
   > Because a row where all schemes say the same thing carries no decision value. It's noise
   > competing with the rows that actually differ between the schemes you chose. The information
   > density of the matrix goes up and the reading time goes down.

   **Q: Why limit compare to 5?**
   > Because a comparison matrix stops being a comparison past a handful of columns — it becomes a
   > wall. Five is the point where a user can still see all columns at once on a laptop. We also
   > cap it in code (`MAX_COLS`) and disable the remaining checkboxes with an explanatory message
   > rather than silently refusing.

   **Q: What is the accessibility story?**
   > Every custom control implements a proper ARIA pattern: card pickers are `radiogroup`/`radio`
   > with `aria-checked`; the drawer manages focus — it moves focus in on open, traps the user's
   > attention, and restores focus to the opening button on close; Escape closes it; the comparison
   > ticks carry text alternatives ("Included" / "Not included") so meaning is never carried by
   > colour alone; there's a skip link; the active nav item is marked `aria-current="page"`.

   **Q: Why no CSS framework?**
   > Because we wanted zero build step and zero install — `node server.js` and the app runs. A
   > framework would have added a dependency, a build pipeline, and a layer of abstraction we don't
   > need for 11 pages. Instead we wrote a small token-based system: `tokens.css` holds the design
   > variables, `components.css` holds the UI parts. Changing the theme is a one-file change.

   **Q: How do you protect against XSS given you build HTML with string concatenation?**
   > Every piece of data-derived text goes through `g.esc()` before it is inserted, which escapes
   > `& < > " '`. We build HTML by string concatenation for simplicity and speed, but the escaping
   > is applied at every interpolation point.

   ### 3.8 Demo script for your section (2 minutes)

   1. Land on the homepage. Point at the hero, the two CTAs, and the privacy line.
   2. Point at the inline mockup card — "this is what your result will look like: two conditions
      matched, one needs confirmation." (It is HTML, not an image — resize the window to show it scales.)
   3. Show the factbar and the disclaimer under it.
   4. Click **"Explore startup funding"** → lands directly in the startup questionnaire with the
      domain already set. *(This proves the deep link.)*
   5. Go back and click the feature-card CTA → `domain.html?domain=...` shows the **single-domain
      intro view** with the "What we will ask" list.
   6. Go to `domain.html` with no parameter → the **two-up picker** with dot indicator.
   7. Results → click **Compare** on two cards → the drawer opens → pick two more → **Compare 4
      schemes** → the matrix appears. Point out:
      - the "Starting from" column is pinned,
      - the row hints show the underlying field,
      - one row is dimmed because every column agrees,
      - the "Documents listed" row differs (MUDRA has documents, CGSS does not).

   ---

   ## Part 4 — Member 4: Form / Questionnaire & Data Handling

   ### 4.1 Your role in one line
   > "I own the **questionnaire engine, the rule engine, client-side storage, the dataset, and the
   > Node.js server + API** — the whole data-handling spine that the other three sections sit on."

   ### 4.2 What your section does (features)

   **The branching questionnaire engine — `public/js/questionnaire.js` (223 lines)**
   1. **A declarative field registry.** All 19 fields live in one `FIELDS` object. Each field
      declares: `label`, optional `labelHealth`, `options` (value + display text pairs), optional
      `type` (`number` / `radio`), `unit`, `min`/`max`/`step`, `placeholder`, and a **`help` string
      that explains *why* we are asking** — rendered next to every question under a **"Why"** tag.
      Adding a question = adding one object. No template changes.
   2. **Flow defined as data.** `flowFor(domain, answers)` returns an array of steps, each
      `{ kind: 'goal' | 'fields' | 'review', stage, fields }`. The renderer is generic over steps.
      The branch logic is 3 conditional lines per domain.
   3. **Three control types** rendered by one function: `<select>` (default), `<input type=number>`
      with an affixed unit, and a `<div role="radiogroup">` of radio chips.
   4. **"I'm not sure — skip for now"** is a real, first-class option on every select. It is not a
      failure — it is stored and later reported as `needs-confirmation`.
   5. **Validation** — a required field left unanswered blocks Continue, sets `aria-invalid="true"`,
      writes an inline `role="alert"` message, and renders an error summary box at the top with a
      link jumping to the offending question. The summary receives focus.
   6. **Draft persistence** — every change and every step advance writes the draft to
      `localStorage` under `yojanapath.questionnaireDraft.<domain>`, so a refresh resumes exactly
      where the user was, **per domain** (your startup draft does not pollute your health draft).
   7. **Review step** — a table of every question with the *human-readable label the user picked*
      (not the stored code like `early-stage`, but "Early-stage startup"), plus the explicit note:
      *"Not sure is fine — those conditions become needs confirmation in your results."*
   8. **On submit** — answers are written to `yojanapath.lastAnswers` and the user is redirected to
      `results.html?domain=<domain>`.
   9. **Provenance of the user's own state** — the domain is stored with the answers, and if the
      user lands on a results page for a different domain than their saved answers, the app falls
      back to the per-domain draft rather than showing mismatched results.

   **The rule engine — `public/js/rules.js` (40 lines)**
   10. **Four operators**: `equals`, `in`, `gte`, `lte`.
   11. **Four outcomes per condition**: `met`, `not_met`, `unknown`, `not_applicable`.
      - `unknown` — the answer was skipped and the condition is `required`
      - `not_applicable` — the answer was skipped and the condition is optional
   12. **Four scheme-level statuses**, derived in strict priority order:
      | Status | Meaning | UI label |
      |---|---|---|
      | `potential-match` | All conditions met | Potential match |
      | `needs-info` | Nothing failed, but something is unknown | Needs more information |
      | `rules-pending` | **No rules stored at all** | Conditions not yet verified |
      | `does-not-match` | At least one condition failed | Does not match known rules |
   13. **Rank order** — `potential-match` → `needs-info` → `rules-pending` → `does-not-match`, then
      alphabetical by name for stability.
   14. **The critical guard:** `if (!rules.length) status = 'rules-pending'` — **a record with no
      stored conditions proves nothing and must never read as a match.** This single line is the
      ethical backbone of the project.

   **Client-side storage — `public/js/storage.js` (21 lines)**
   15. All keys prefixed `yojanapath.` and lowercase. Seven stores:
      `savedSchemeIds`, `compareSchemeIds`, `questionnaireDraft.<domain>`, `lastAnswers`,
      `checklist.<schemeId>`, `lastDomain`.
   16. **Stores IDs and drafts only. Never Aadhaar, bank details, or medical data.** This is
      enforced by design — there is no code path that writes sensitive data, because no sensitive
      data is ever collected.
   17. **Fail-safe** — every read/write is wrapped in try/catch so a disabled or full localStorage
      never breaks the page. `resetDemo()` clears every `yojanapath.*` key (used between demo runs).
   18. **Per-scheme document checklist** persists independently per scheme id.

   **The server — `server.js` (448 lines)**
   19. **Node.js built-in modules only** — `http`, `fs`, `path`, `https`, `url`. **No Express.**
      No `npm install` needed to run. The only dependency is `nodemon`, and that is dev-only.
   20. **Hand-rolled static file server** with:
      - **path traversal protection** — `path.normalize` + `startsWith(PUBLIC_DIR)` check → 403
      - MIME map by extension, `Cache-Control: no-store`
      - `send()` is idempotent — guards against `ERR_HTTP_HEADERS_SENT` crashing the process
   21. **JSON API:**
      | Route | Method | Purpose |
      |---|---|---|
      | `/api/health` | GET | Liveness check (also the Render health check) |
      | `/api/categories` | GET | Domain definitions + question sets |
      | `/api/schemes?domain=` | GET | Scheme records, optionally filtered by domain |
      | `/api/ai/suggest` | POST | AI relevance ranking (Groq) |
      | `/api/search/live` | GET | SerpApi search restricted to government domains |
      | `/api/admin/search` | GET | SerpApi source discovery for the admin page |
      | `/api/admin/add\|update\|remove` | POST | Write to `data/schemes.json` |
   22. **Domain allowlist** — `ALLOWED_DOMAINS = {startup-funding, health-coverage}`. Anything else
      returns 400. `data/` lives **outside** `public/` and is only ever exposed through
      `/api/schemes` — the raw JSON file is never directly downloadable.
   23. **`.env` loader written by hand** — no `dotenv` dependency. Existing real environment
      variables win over `.env`. Common misspellings are accepted as aliases via `ENV_ALIASES`
      (`SERP_API_KEY` → `SERPAPI_KEY`, `GROQ_KEY` → `GROQ_API_KEY`).
   24. **Secrets never reach the browser.** The Groq and SerpApi keys are used only in `server.js`,
      in outbound requests. There is no endpoint that echoes them.
   25. **The AI endpoint is locked down:**
      - The prompt contains **only** the records already in the dataset — the model is given the
         catalogue and told *"Never invent an id, scheme, amount, deadline or income ceiling. You
         rank; you never decide eligibility."*
      - The model must reply with **JSON only**, in a fixed schema:
         `{"ranked":[{"id","score","why","verify"}]}`
      - **`repairJson()`** recovers truncated JSON (reasoning models spend their token budget on
         reasoning and cut the JSON off mid-array) by trimming to the outer braces, stripping
         trailing commas, and re-balancing brackets.
      - **Any id not present in the dataset is dropped server-side** — hallucinated schemes cannot
         reach the user.
      - **Any scheme the model forgot is still added back** with score 0 — so no record silently
         disappears from the results.
      - Scores are clamped to 0–100. `why` and `verify` are cleaned and truncated to 220 chars.
      - **10-minute in-memory cache** keyed on domain + answers (free-tier rate limits).
      - **429 handling** — the API returns `retryAfter`; the client shows "Free-tier rate limit —
         retrying in Ns…" and retries.
   26. **SerpApi integration** — queries are built with `site:` operators against a curated list of
      official hosts (`startupindia.gov.in`, `mudra.org.in`, `nha.gov.in`, `pmjay.gov.in`,
      `esic.gov.in`, `myscheme.gov.in`, `ma.gujarat.gov.in`, `gujarat.gov.in`, …).
      - **`isOfficial(host)`** filters results to `.gov.in`, `.nic.in`, `.gov.xx`, and `mudra.org.in`
      - **English-only enforcement** — a regex detects Indic script (Devanagari, Bengali, Gurmukhi,
         Gujarati, Kannada, Malayalam, Tamil, Telugu, Odia, Assamese) in titles and snippets, and
         those results are dropped server-side, with a `droppedNonEnglish` count reported. The
         search also forces `hl=en`.
      - It returns **candidate links only** — never eligibility claims.
   27. **Admin panel is off by default and returns 404 (not 403)** on the deployed site, so its
      existence is not advertised. Two reasons: Render's filesystem is **ephemeral** (edits would
      vanish on the next restart) and the page has **no authentication**.
      - `ADMIN_ENABLED=true` enables it locally
      - Admin **add** validates: name + url required, domain allowlisted, URL must be **https**,
         host must be an official government domain, and duplicates are rejected with 409
      - New records are created with `verificationStatus: 'needs-review'`, empty `eligibilityRules`,
         empty `documents`, and a placeholder application step — a record always starts as
         discovery-only
   28. **Body size cap** — request bodies over 20 KB are destroyed, so a malicious or broken
      client cannot exhaust memory.
   29. **Crash resilience** — `uncaughtException` and `unhandledRejection` are logged, and the
      server keeps serving. One bad request can never take the server down.
   30. **Binds to `0.0.0.0`** and reads `PORT` from the environment — required by Render and most
      PaaS providers.

   **The dataset — `data/schemes.json` (51 KB, 23 records)**
   31. **Record schema** (18 fields): `id`, `domain`, `name`, `administeringAuthority`,
      `coverage {type, states[]}`, `benefit {type, summary}`, `intendedFor`, `nextStep`,
      `eligibilityRules[]`, `documents[]`, `applicationSteps[]`, `officialInfoUrl`,
      `officialApplicationUrl`, `sources[] {url, sourceType, checkedAt}`, `lastVerified`,
      `verificationStatus`, `notes`, `category`.
   32. **The rule sub-schema** — `{field, operator, value, required, description, sourceUrl,
      sourceCheckedAt, unknownNextStep}`.
   33. **Provenance is first-class** — every rule carries the source URL and the date it was
      checked. Every record carries `sources[]` with `checkedAt`, `lastVerified`, and
      `verificationStatus` (`verified` / `needs-review`).
   34. **Data lives outside `public/`** — served only through the API, never as a static file.
   35. **Data preparation tools** — during development, one-off harvesting and deduplication scripts
      were run to populate and clean `data/schemes.json`. Once the clean 23-scheme database was verified,
      these temporary scripts were archived to keep the production repository clean and lightweight.

   ### 4.3 The data flow, end to end

   ```
   Questionnaire (public/js/questionnaire.js)
      │  user answers
      ▼
   localStorage  yojanapath.questionnaireDraft.<domain>   (draft, per domain)
      │  submit
      ▼
   localStorage  yojanapath.lastAnswers                    (final answers + domain)
      │
      ▼
   results.js  ──► GET /api/schemes?domain=X
      │                server.js reads data/schemes.json, filters by domain, returns JSON
      ▼
   YPRules.evaluate(scheme, answers)   → met / not_met / unknown / not_applicable
   YPRules.rank(results)               → potential-match, needs-info, rules-pending, does-not-match
      │
      ▼
   POST /api/ai/suggest {domain, answers}
      │   server.js builds the prompt from the SAME dataset, calls Groq, repairs JSON,
      │   drops unknown ids, re-adds forgotten ids, caches for 10 min
      ▼
   client keeps only score >= 60  →  sorts by score  →  renders cards
      │
      ▼
   Filters (status / benefit type / coverage type / sort by name) apply to the VISIBLE 60+ set
   ```

   ### 4.4 Files you own

   | File | Size | Responsibility |
   |---|---|---|
   | `server.js` | 23.5 KB | Static server, JSON API, Groq proxy, SerpApi proxy, admin CRUD, env loader, caching, security guards |
   | `public/js/questionnaire.js` | 17.4 KB | Flow definition, field registry, rendering, validation, drafts |
   | `public/js/rules.js` | 1.9 KB | The rule engine — correctness layer |
   | `public/js/storage.js` | 2.2 KB | localStorage abstraction, 7 stores, reset |
   | `public/js/api.js` | 0.9 KB | Native fetch API helpers with AbortController timeout & Promise chaining |
   | `public/js/checklist.js` | 2.5 KB | Application checklist + print |
   | `public/js/admin.js` | 11.8 KB | Admin panel: search official sources, add/edit/verify/remove records |
   | `data/schemes.json` | 42 KB | 23 verified & candidate scheme records |
   | `data/categories.json` | 0.9 KB | 2 domain definitions |
   | `.env` / `.env.example` | — | Secret management — `.env` is gitignored, never committed |

   ### 4.5 Tech stack used in your section

   | Concern | Choice | Why |
   |---|---|---|
   | Runtime | **Node.js ≥ 18** (built-in `http`, `fs`, `path`, `https`, `url`) | Zero runtime dependencies → `node server.js` and it runs. No Express, no npm install, no build step. Fewer deps = fewer CVEs, simpler deployment. |
   | Frontend | **Pure Vanilla JS (ES6+) IIFEs + Standard Web APIs** | Zero dependencies, no jQuery, no bundler, no framework, no transpile. Global namespace objects (`YPApi`, `YPRules`, `YPStore`) keep the modules loosely coupled without a module system. Native `fetch` with `AbortController` handles all networking. |
   | Data | **JSON files** | Human-readable, diff-able in git, zero-ops. Right call for 23 records. The honest upgrade path is a real DB when the dataset grows and needs concurrent writes. |
   | AI | **Groq** (`api.groq.com`, OpenAI-compatible `/openai/v1/chat/completions`) | Fast inference, generous free tier, OpenAI-compatible API so the model is swappable via one env var. Model default `llama-3.1-8b-instant`; `.env` currently sets `openai/gpt-oss-120b`. |
   | Search | **SerpApi** | Real search with `site:` operators so we can restrict to government domains. |
   | Hosting | **Render** (`render.yaml`) | Git-backed, free plan, Singapore region, `npm ci --omit=dev` → `npm start`, health check on `/api/health`. |
   | Secrets | **Server-side `.env`** + Render dashboard | Never in the client bundle. `.env` is gitignored. |
   | Dev | **nodemon** | The only dependency, dev-only. |

   ### 4.6 Requirements your section satisfies

   **Functional**
   - FR-D1: The questionnaire MUST adapt its questions to the selected domain and the user's goal.
   - FR-D2: Every question MUST be optional-safe ("not sure") and MUST never cause a false rejection.
   - FR-D3: Answers MUST persist across refresh, per domain, until submission.
   - FR-D4: Rule evaluation MUST support `equals`, `in`, `gte`, `lte` and produce four per-condition outcomes.
   - FR-D5: A scheme with zero stored rules MUST be labelled `rules-pending` and MUST NOT be presented as a match.
   - FR-D6: The dataset MUST record, for every rule and every record, the source URL and the date it was checked.
   - FR-D7: The API MUST expose schemes only by domain, from an allowlist.
   - FR-D8: The AI layer MUST be optional — with no key the app MUST still work end-to-end, falling back to rule-ranked order.
   - FR-D9: The AI layer MUST NOT be able to introduce a scheme that is not in the dataset.
   - FR-D10: The admin panel MUST be disabled by default and MUST validate that added URLs are https and on official government domains.
   - FR-D11: Sensitive data MUST NOT be stored — localStorage holds IDs and drafts only.
   - FR-D12: The server MUST NOT crash on a bad request, and MUST cap request body size.

   **Non-functional**
   - NFR-D1: **Zero-dependency runtime** — no `npm install` required to run.
   - NFR-D2: **Secrets stay server-side** — no key ever reaches the browser.
   - NFR-D3: **Path traversal protection** on all static file serving.
   - NFR-D4: **Resilience** — `uncaughtException` / `unhandledRejection` are caught and logged; the server keeps serving.
   - NFR-D5: **Rate-limit resilience** — AI 429s are retried with backoff; responses are cached for 10 minutes.
   - NFR-D6: **Language consistency** — the API forces `hl=en` and drops Indic-script results server-side so responses never mix languages.
   - NFR-D7: **Provenance integrity** — the AI's output is never written back into the dataset. Only the admin can write, and only after human review.
   - NFR-D8: **Deployability** — one `render.yaml`, no build step, health check wired up.

   ### 4.7 Viva Q&A for you

   **Q: Why did you not use Express?**
   > Because we wanted the app to run with `node server.js` and nothing else — no install, no build,
   > no dependency tree to audit or update. The Node `http` module plus a small static-file handler
   > plus a URL-based router is about 60 lines. We use `path.normalize` plus a `startsWith` check to
   > block path traversal. For 11 pages and 8 endpoints, Express would have added a dependency
   > without removing meaningful work.

   **Q: You have an AI model ranking government schemes. Isn't that dangerous?**
   > That's exactly why we separated the two layers. The AI **never** decides eligibility — it only
   > assigns a relevance score for ordering. Eligibility is decided by a deterministic rule engine
   > that runs in the browser and can be reasoned about and audited line by line. On top of that:
   > the model is only *given* the schemes already in our dataset, it is explicitly told never to
   > invent one, any id it invents is dropped server-side, any scheme it forgets is re-added with
   > score 0 so nothing silently disappears, and the UI labels the number "AI relevance" and states
   > the threshold. The AI can move a scheme up the list; it can never make a false claim appear.

   **Q: Why not a database? 23 records is small, but still.**
   > For 23 records, a JSON file is genuinely better: it's diff-able in git so every data change is
   > reviewable, it needs no server, no migrations, no credentials, and no ORM. The honest
   > limitation is **concurrent writes** — two admins editing at once would conflict, and on Render
   > the filesystem is ephemeral so admin writes are disabled entirely. The upgrade path when we
   > outgrow it: move to SQLite or Postgres behind the same `/api/schemes` contract, so the frontend
   > doesn't change.

   **Q: How do you prevent path traversal on the static server?**
   > We `decodeURIComponent` the path, `path.normalize` it after joining it to the public
   > directory, and then check that the resolved absolute path still starts with the public
   > directory. If it doesn't, we return 403. That means `../../server.js` or `..%2f.env` can never
   > escape the public folder.

   **Q: How do you handle the free-tier AI rate limit?**
   > Three ways. We cache identical requests for ten minutes, keyed on domain + answers, so
   > re-running the same questionnaire costs nothing. When Groq returns 429 we parse the "try again
   > in Ns" hint out of the error and send `retryAfter` to the client, which shows "Free-tier rate
   > limit — retrying in Ns…" and retries automatically. And we always have the fallback — if the
   > AI is unavailable, misconfigured, or rate-limited, the app falls back to the deterministic
   > rule-ranked order and the user is none the wiser.

   **Q: What happens if the AI returns broken JSON?**
   > Reasoning models count reasoning tokens against `max_tokens` and can emit JSON that is cut off
   > mid-array. We wrote `repairJson()`: trim to the outermost braces, strip trailing commas before
   > `}` or `]`, and re-balance any unclosed brackets. If it still won't parse, we return a 502 with
   > a clear message pointing at `GROQ_MODEL`, and the client falls back to rule order.

   **Q: How is the dataset kept honest?**
   > Every rule carries the URL it was transcribed from and the date it was checked, and every
   > record carries `lastVerified` and a `verificationStatus` of `verified` or `needs-review`. The
   > admin panel only creates records as `needs-review` with empty rules and documents — a record
   > always starts as discovery-only and has to be reviewed by a human. And nothing the AI says is
   > ever written back into the data. Only a person can write.

   **Q: What is stored in the browser?**
   > Only scheme IDs and questionnaire drafts. Seven localStorage keys, all prefixed
   > `yojanapath.`: saved scheme IDs, compare IDs, the per-domain questionnaire draft, the last
   > answers, the per-scheme document checklist, and the last domain. There is no code path that
   > stores an Aadhaar number, bank detail, or medical record — because we never ask for one.

   **Q: How do you test this without an automated test suite?**
   > Honestly — by walking the demo flow against both domains and checking `/api/health` returns
   > 200. That's the gap in the project. The rules engine, though, is pure and side-effect free —
   > it takes `(scheme, answers)` and returns a status — so it's the obvious first thing to cover
   > with unit tests, and the `evaluate`/`rank` functions are already separated for exactly that.
   > We'd also want an API smoke test for each route.

   **Q: Why is the admin panel disabled on the live site?**
   > Two reasons, both deliberate. First, Render's filesystem is ephemeral — the admin writes to
   > `data/schemes.json`, so every edit would silently vanish on the next restart or redeploy.
   > Second, the admin page has no authentication, so anyone could edit or delete the scheme data.
   > We return **404 rather than 403** for `/admin.html` and `/api/admin/*` so the existence of the
   > panel isn't advertised either. Data changes go through local edits + git commit + redeploy. If
   > we ever need a writable admin in production, the fix is a paid disk plus a password — both
   > are required, not optional.

   ### 4.8 Demo script for your section (2 minutes)

   1. Show `server.js` and say: *"Node built-ins only — `http`, `fs`, `path`, `https`, `url`. No
      Express, no build step, no install."*
   2. `node server.js` → open `http://localhost:3000/api/health` → show `{ok: true, time: ...}`.
   3. Show `/api/schemes?domain=startup-funding` → 10 records; `?domain=health-coverage` → 19.
      Show one record's `eligibilityRules` with its `sourceUrl` and `sourceCheckedAt`.
   4. Open `public/js/rules.js` → point at the four outcomes and the one guard line:
      *"a record with no stored conditions proves nothing — it must never read as a match."*
   5. Open `public/js/storage.js` → show the seven `yojanapath.*` keys. Say: *"IDs and drafts only.
      No Aadhaar, no bank details, no medical records."*
   6. Show `server.js` → the AI prompt (the model is given only our dataset and told never to
      invent), the `byId` filter that drops hallucinated ids, and the re-add loop for forgotten ids.
   7. Show the `.env` → `.env.example` → `render.yaml` chain: secrets are server-side only, and
      `ADMIN_ENABLED=false` on deploy.

   ---

   ## Part 5 — Shared Viva Q&A (everyone should be able to answer these)

   **Q: What is your project in one sentence?**
   > YojanaPath helps a citizen find Indian government schemes by describing their situation instead
   > of searching for scheme names, and shows exactly why each result appeared, with a dated link to
   > the official source.

   **Q: What is the biggest technical challenge you faced?**
   > Making the app work correctly **without** letting the AI make any eligibility claim. The
   > resolution was to split it into two independent layers — a deterministic rule engine for
   > correctness and a separate AI layer for ranking only — and then to enforce the boundary in
   > code: the model only ever sees schemes already in our dataset, invented IDs are dropped
   > server-side, forgotten schemes are re-added, and the whole thing degrades gracefully to
   > rule-order when no key is configured.

   **Q: Why should we trust this app when it decides what government money you can get?**
   > We don't decide. That is the entire point. We show a *potential match* and explain it; we cite
   > where we got each condition and when we checked it; and we link to the official page. The
   > authority makes the decision. The UI says so on the landing page, on the results status line,
   > and in the footer of every detail page.

   **Q: How do you handle a scheme whose rules you could not verify?**
   > We show it as "Conditions not yet verified" (`rules-pending`), ranked below schemes that matched
   > and below schemes that need one more piece of information — but above schemes that genuinely
   > fail. It is never presented as a match, and the detail page shows an explicit "we have not
   > recorded this yet" state linking to the official source.

   **Q: What would you build next?**
   > Three things, in order: (1) finish transcribing the 17 unverified records — that's the single
   > biggest quality gap and it's manual work, not architecture; (2) add an automated test suite,
   > starting with the pure `rules.js` engine, then API smoke tests; (3) make the dataset editable
   > with authentication, so the admin panel is safe to expose and the data can be updated
   > in production instead of through git commits.

   **Q: What are the limitations of your project?**
   > Four, and we would rather state them than be caught by them:
   > 1. **Dataset completeness** — only 6 of 23 records have stored conditions; 2 are verified.
   > 2. **No automated tests** — verification is manual, via the demo flow.
   > 3. **English-only** — Indic-script search results are dropped server-side, so some regional
   >    schemes won't surface.
   > 4. **Admin is off in production** — data updates need a local edit + git commit + redeploy.

   **Q: Why pure Vanilla JavaScript instead of React, Vue, or jQuery?**
   > Deliberate architectural simplicity, speed, and standard compliance. This is a 9-page, zero-build,
   > ultra-fast application. Frameworks like React or Vue introduce complex bundlers, build steps, large
   > node_modules dependency trees, hydration overhead, and state-management bloat — none of which
   > help a citizen discover a scheme faster. Furthermore, we deliberately eliminated jQuery to avoid
   > any external client-side script dependencies, eliminating CDN downtime risks and security supply-chain
   > vulnerabilities. Modern browsers already support standard Web APIs natively: `fetch()` with
   > `AbortController` replaces `$.ajax()`, `document.querySelector`/`querySelectorAll` replaces `$()`,
   > and `classList` replaces jQuery classes. We also wrote our own accessible drawer, dropdown, and ARIA
   > patterns, giving us 100% control over accessibility and keyboard navigation.

   **Q: How do you make sure the site is accessible?**
   > Skip link; visible focus rings; every input has a `<label>`; custom card pickers implement
   > `role="radiogroup"`/`role="radio"` with `aria-checked`; the drawer traps and restores focus and
   > closes on Escape; loading states use `aria-busy` and live regions; validation uses an
   > `role="alert"` summary that receives focus; comparison ticks carry text alternatives so meaning
   > is not carried by colour alone; and `prefers-reduced-motion` is respected.

   **Q: Why is your data in `data/` and not in `public/`?**
   > Because `public/` is served as static files — anything in it is directly downloadable. The
   > dataset is only ever exposed through `/api/schemes`, which filters by the domain allowlist.
   > That keeps one controlled path to the data.

   **Q: How do you keep secrets safe?**
   > `GROQ_API_KEY` and `SERPAPI_KEY` are read from `.env` (gitignored) or from the Render
   > dashboard, and are used only inside `server.js`. There is no endpoint that returns them and
   > they never appear in client-side code. The deployed admin panel is off by default.

   **Q: How does the AI ranking actually work end to end?**
   > The client sends `{domain, answers}` to `/api/ai/suggest`. The server builds a prompt
   > containing only that domain's records from `data/schemes.json` plus the user's answers, and
   > asks for JSON only: `{"ranked":[{"id","score","why","verify"}]}` with the instruction that it
   > must never invent a scheme and never decide eligibility. The server repairs truncated JSON,
   > drops any id not in the dataset, re-adds any scheme the model forgot (score 0), clamps scores to
   > 0–100, and caches the result for ten minutes. The client keeps only schemes scoring **60 or
   > above**, sorts by score, and tells the user the threshold and that the score is relevance, not
   > eligibility.

   **Q: What if there is no API key at all?**
   > Everything still works. The `/api/ai/suggest` endpoint returns `{configured: false}` and the
   > client falls back to the deterministic rule-ranked order. Nothing in the correctness path
   > depends on the AI.

   **Q: Why is the compare limit 5, and why dim the agreeing rows?**
   > A matrix stops being readable past a handful of columns, so we cap at 5 in code
   > (`MAX_COLS`) and disable the remaining checkboxes with an explanation. And a row where every
   > column agrees carries no decision value, so it is dimmed to push attention onto the rows that
   > actually differ between the chosen schemes.

   **Q: What did each of you contribute?** *(Agree on this beforehand — consistency matters)*
   > Member 1 — Startup funding pathway: goals, startup branch of the questionnaire, startup rule
   > conditions, 9 startup records.
   > Member 2 — Health coverage pathway: goals, health branch of the questionnaire, health rule
   > conditions, 14 health records.
   > Member 3 — Landing and compare: homepage, pathway picker, compare drawer, the whole CSS design
   > system, shared UI shell.
   > Member 4 — Questionnaire engine, rule engine, storage, dataset, Node server, API, AI and
   > SerpApi integration, admin, deployment.

   ---

   ## Part 6 — Known gaps, and the honest answers (READ THIS BEFORE THE VIVA)

   These are real. If an examiner finds them, having the answer ready is far better than being
   surprised. Do **not** hide them — framing them as deliberate design decisions is much stronger
   than being caught.

   > **Status:** 6.2 (stale factbar), 6.3 (duplicate records) and 6.4 (compare limit) have been
   > **fixed** — read the "What to say if asked" box in each, because "we found it and we fixed it"
   > is a stronger answer than "we hadn't noticed". 6.1, 6.5 and 6.6 are still open and are the
   > ones you should be ready to explain.

   ### 6.1 The dataset is unevenly filled — and that is deliberate
   **Fact:** 23 records. `eligibilityRules` populated in **6**. `documents` in **6**.
   `documentedEligibility` in 5. `verificationStatus: verified` in **2** (MUDRA Yojana and
   Ayushman Bharat PM-JAY). The other 17 carry the placeholder application step *"Open the official
   page linked below"* and no stored rules or document lists.

   **The answer:**
   > We deliberately did not fabricate eligibility criteria or document requirements for live
   > government schemes. A wrong document list gets someone's application rejected — a hallucinated
   > rule is worse than no rule. Where we have not verified a condition, the app shows an explicit
   > *"we have not recorded this yet"* gap state that links to the official page, and the record is
   > ranked as `rules-pending`, never as a match. Our system can represent all 23 schemes correctly;
   > what we are short of is verified source material, and that is transcription work, not
   > engineering.

   **Follow-up they may ask — "so why does it show schemes with no data?"**
   > Because discovery is still useful. A user learns the scheme exists, who runs it, what it
   > offers, and where the official page is. Silently hiding unverified schemes would hide real
   > support; showing them *as unverified* is the honest middle.

   ### 6.2 The landing page factbar numbers — FIXED ✅
   **Was:** `public/index.html` hardcoded "Schemes in the dataset: **6**" and "Records verified: **2
   of 6**" while the dataset actually held 23 records.

   **Fixed:** the factbar now reads live counts from `GET /api/schemes` and `GET /api/categories`.
   `index.html` loads `js/api.js` and fills the three figures at runtime, with a graceful
   "Unavailable" state if the API fails. The hardcoded numbers are gone, so the bar can never go
   stale again — add a scheme and the number changes by itself.

   **What to say if asked:**
   > We originally hardcoded those figures and they went stale the moment we added records. Now the
   > landing page reads the counts from the same API the results page uses, so there is one source of
   > truth for the dataset size.

   ### 6.3 Near-duplicate records — FIXED ✅
   **Was:** the dataset held both *"Startup India Seed Fund Scheme"* and *"Startup India Seed Fund
   Scheme (SISFS)"*, both *"Mukhyamantri Amrutum (MA) Yojana — Gujarat"* and *"Mukhyamantri Amrutum
   Yojana (MA Yojana), Gujarat"*, plus four ESIC **service pages** (ESIC Benefits / Finance /
   Contribution / Medical Benefit) that had been collected as if they were schemes.

   **Fixed** by `dedupe-records.js` (new tool at the repo root, alongside `clean-records.js`):
   - The two near-duplicate pairs were **merged** into the record that carried real rules and
   documents. The empty twin was removed, and its URL was **preserved as an extra source** so
   nothing verified was lost — the SISFS record contributed `seedfund.startupindia.gov.in`, and
   the MA duplicate contributed the scheme-specific `ma.gujarat.gov.in` portal, which is now the
   primary link on that record.
   - The four ESIC regional service pages were removed. They are scrape artifacts of a site we
   already cover with a real record (*Employee State Insurance Scheme*), recognised by the
   scraped "Page | Site" title form.
   - **Result: 29 → 23 records** (9 startup, 14 health). Rules coverage stayed at 6 and verified
   at 2 — we removed only records that carried nothing.

   **Prevention:** the admin panel's duplicate guard was URL-only, which was wrong — a single
   official site can host several distinct schemes (`ma.gujarat.gov.in` carries both the MA Yojana
   and the MAV Yojana; `nha.gov.in` carries PM-JAY and its Health Benefit Package). It now
   rejects a re-add only when **the same scheme name appears on the same URL**, so shared portals
   are allowed while true duplicates are still blocked.

   **What to say if asked:**
   > We found the duplicates during review and fixed them rather than hiding them. The tool is
   > `dedupe-records.js` — it merges near-duplicate schemes into the richer record, preserves the
   > dropped record's URL as an extra source, and drops scrape artifacts. We also fixed the admin
   > guard, because a URL alone cannot identify a scheme: one official portal can host several.
   > That guard now checks scheme name *and* URL together.

   ### 6.4 The compare limit differed between the two compare UIs — FIXED ✅
   **Was:** the drawer allowed 5 (`MAX_COLS = 5` in `compare-ui.js`), but `storage.js`
   `toggleCompare` capped at 3, and the standalone `compare.js` / `compare.html` used that older
   path. The standalone page was also effectively dead, because nothing ever wrote to the compare
   store — `toggleCompare` was defined but never called.

   **Fixed:**
   - `YPStore.MAX_COMPARE = 5` in `storage.js` is now the **single source of truth**. The drawer
   reads it instead of hardcoding its own value, and `toggleCompare` uses it too.
   - The drawer now **persists** its selection to the compare store, so the standalone compare page
   shows the same selection instead of an empty list.
   - `compare.html`'s heading and the empty-state copy are set from the same constant, so the
   wording cannot drift from the behaviour.

   **What to say if asked:**
   > We had one comparison limit defined in two places, and they disagreed. Now there is a single
   > constant, `YPStore.MAX_COMPARE`, that the drawer and the standalone page both read — so the
   > two cannot drift apart. While fixing it we also found the standalone page was reading a store
   > nothing wrote to, so the drawer now persists its selection and the two views agree.

   ### 6.5 No automated test suite
   **Fact:** there is no `tests/` directory (it was removed in the deploy commit), and the README
   says verification is manual via `docs/demo-script.md` plus `/api/health`.

   **The answer:**
   > Our verification is currently manual — the demo flow against both domains, plus the health
   > check. The rule engine is the obvious first target for unit tests because it is pure and
   > side-effect free: `evaluate(scheme, answers)` takes two inputs and returns a status, with no
   > I/O. That pure separation is deliberate and it is what makes it testable. We would add API
   > smoke tests next.

   ### 6.6 Removal of unused `live.js` / `ai.js` from the UI — FIXED ✅
   **Fact:** `public/js/live.js` was previously unused in `results.html`, and `ai.js` was an empty placeholder.
   Both have now been pruned completely from the client codebase, and `results.html` script tags were cleaned up.
   `GET /api/search/live` remains securely accessible on the backend server for source exploration.

   **The answer:**
   > We cleaned up unused client files to keep the production bundle minimal. The raw search script was removed
   > because displaying unverified live links alongside deterministic eligibility rules confused users into
   > treating search hits as official recommendations. The backend proxy remains available for admin queries.

   ### 6.7 Key safety — VERIFIED CLEAN ✅
   **Checked for you:** `git ls-files` shows only `.env.example` is tracked — `.env` itself is
   **not** in the repository. `.gitignore` line 2 excludes it. A scan of the full git history for
   `.env` content found **no key ever committed**. This is correct and needs no action.

   **Still do this before the viva:**
   - Never show a live key on a projector. If you demo the admin search or the AI, `.env` must not
   be open on screen.
   - Confirm `.env` is still untracked after any commit: `git status` should not list it.
   - If a key is ever accidentally committed, **rotate it** in the provider console
   (Groq / SerpApi) immediately — deleting the commit is not enough.

   **The answer if asked about key safety:**
   > Secrets are read server-side only, from a gitignored `.env` locally and from the Render
   > dashboard in production. There is no endpoint that returns them and they never reach the
   > browser. The client only ever receives scheme data and relevance scores.

   ### 6.8 Other honest limitations worth volunteering
   - **English-only interface and English-only search results** — Indic-script results are dropped
   server-side so responses never mix languages, but that also means some regional-language
   scheme pages will not surface.
   - **Health domain is skewed** — 14 health vs 9 startup records, and the health records include
   several state schemes outside Gujarat (Maharashtra, Himachal Pradesh). This is a data
   coverage gap, not a design one.
   - **The 60+ AI threshold is a fixed product decision**, not a tuned parameter — it is a
   deliberate trade: fewer, more relevant results over a complete but noisy list.
   - **`fundingAmount` is entered in lakhs** — a deliberate UX choice to keep the input short and
   mobile-friendly, at the cost of some ambiguity for users who think in rupees.

   ---

   ## Part 7 — Pre-viva checklist (do these tonight)

   **Technical**
   - [x] Factbar on `index.html` now reads live counts from `/api/schemes` - it can no longer go stale
   - [ ] Run `node server.js` and walk `docs/demo-script.md` end to end on **both** domains
   - [ ] Confirm `/api/health` returns `{"ok": true}`
   - [ ] Test with **no** `.env` keys — the app must still work (rule-order fallback)
   - [ ] Verify `git status` shows `.env` untracked, and check git history for any leaked key; rotate if needed
   - [ ] Test on a phone-sized window — the layout must collapse correctly
   - [ ] Test keyboard-only navigation: Tab through the questionnaire, open/close the compare drawer with Escape

   **Rehearsal**
   - [ ] Each member says their one-line role (Part 0 → section one-liner) in under 20 seconds
   - [ ] Each member demonstrates their section in under 2 minutes (the demo scripts above)
   - [ ] Each member answers at least one question from their own section's Q&A without notes
   - [ ] All four agree on the Part 5 answers (pitch, limitations, "what did you build")
   - [ ] Everyone can state the count: **2 pathways, 23 records, 9 startup, 14 health, 6 with rules, 2 verified**

   **Presentation**
   - [ ] One person opens, one person closes
   - [ ] Decide who handles "why didn't you use React / Express / a database" — assign it, don't freestyle it
   - [ ] Have `docs/demo-script.md` open in a second tab as a fallback if the live demo breaks
   - [ ] Have the plan document (`YojanaPath_Implementation_Plan.md`) available if they ask "how did you plan this"

   ---

   ## Appendix A — File map (who owns what)

   ```
   server.js                 hand-rolled static server + JSON API + Groq/SerpApi proxies   [M4]
   data/
   schemes.json            23 scheme records (9 startup [M1], 14 health [M2])            [M4]
   categories.json         2 domain definitions + question sets                        [M4]
   public/
   index.html              landing page                                                    [M3]
   domain.html             pathway picker + single-domain intro                          [M3]
   questionnaire.html      the form shell                                                  [M4]
   results.html            AI-ranked results + filters                                    [M1][M2]
   scheme-details.html     per-scheme deep dive                                            [M2]
   compare.html            legacy standalone compare (not linked from nav)                [M3]
   saved.html              saved schemes                                                   [M3]
   checklist.html          application checklist + print                                  [M4]
   admin.html              admin panel (disabled in production)                           [M4]
   css/  tokens, base, layout, components                                               [M3]
   js/
      api.js                Native fetch API helpers + Promise chaining [M4]
      storage.js            localStorage (IDs and drafts only)       [M4]
      rules.js              rule evaluation engine                    [M4]
      questionnaire.js      branching form definition       [M1][M2][M4]
      results.js            AI-ranked results, filters, cards  [M1][M2]
      details.js            scheme detail sections                    [M2]
      compare-ui.js         compare drawer and feature matrix         [M3]
      checklist.js / admin.js / dropdown.js / app.js    [M4] / [M4] / [M3] / [M3]
   docs/
   demo-script.md          the ~8 minute demo plan                                       [all]
   VIVA_PREPARATION.md     this document                                                 [all]
   ```

   ## Appendix B — Quick reference: the four rule outcomes and the four scheme statuses

   | Per-condition outcome | When | Meaning to the user |
   |---|---|---|
   | `met` | The answer satisfies the rule | **Matched** |
   | `not_met` | The answer contradicts the rule | **Not matched** — rules this scheme out |
   | `unknown` | Answer skipped, condition required | **Needs confirmation** — with a next step |
   | `not_applicable` | Answer skipped, condition optional | **Not applicable** to you |

   | Scheme status | When | UI label | Rank |
   |---|---|---|---|
   | `potential-match` | No failures, no unknowns | Potential match | 1 |
   | `needs-info` | No failures, at least one unknown | Needs more information | 2 |
   | `rules-pending` | **No rules stored at all** | Conditions not yet verified | 3 |
   | `does-not-match` | At least one failure | Does not match known rules | 4 |
