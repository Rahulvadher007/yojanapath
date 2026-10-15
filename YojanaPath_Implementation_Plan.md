# YojanaPath — Full Implementation Plan

**Project title:** YojanaPath – Problem-to-Government-Support Navigator  
**Project type:** Rule-based government scheme discovery web application  
**Primary domains:** Startup Funding Support; Individual & Family Health Insurance Support  
**Technology stack:** HTML5, CSS3, JavaScript, jQuery, AJAX, JSON, Node.js built-in modules, browser `localStorage`  
**Optional integration:** SerpApi for discovering possible scheme updates  
**AI usage:** None

---

## 1. Project Overview

YojanaPath helps people discover potentially relevant government support without requiring them to know the name of a scheme or department in advance.

The initial release covers two domains:

1. **Startup Funding Support:** Government loans, grants, seed funding, subsidies, incubation support, and other business-support programs.
2. **Individual & Family Health Coverage:** Government-sponsored health coverage and healthcare-assistance programs for individuals and families.

Users choose a problem, answer a short questionnaire, and receive potential scheme matches with explanations, eligibility conditions, missing information, documents, application instructions, verification details, and official source links.

YojanaPath is an information and discovery tool. It must not promise approval or represent a preliminary match as an official eligibility decision.

## 2. Goals and Scope

### Goals

- Make government support easier to discover through problem-based navigation.
- Explain why a scheme appears in a result.
- Distinguish matches, failed conditions, and incomplete information.
- Keep scheme information structured and traceable to official sources.
- Provide comparison, shortlist, and personalized checklist features.
- Create a visually polished, accessible, responsive interface.
- Demonstrate core web-programming concepts without AI.

### In scope for version 1

- Two domain landing paths.
- Guided eligibility questionnaire.
- Rule-based matching and transparent results.
- Scheme details.
- Compare up to three schemes.
- Shortlist schemes using `localStorage`.
- Personal application checklist.
- English-first interface, with Gujarati as a planned extension.
- Admin-assisted scheme-update discovery using SerpApi, if configured.
- A small, manually verified dataset.

### Out of scope for version 1

- AI/LLM recommendations or chatbots.
- Automatic eligibility decisions or application submission.
- Collecting Aadhaar numbers, bank details, medical records, or uploaded identity documents.
- Direct insurance purchase or loan processing.
- A public multi-user account system.
- Automatically publishing unverified search results as scheme facts.

## 3. User Types

### Citizen / visitor

Can choose a domain, complete questions, view results, inspect details, compare schemes, save schemes locally, and create a checklist.

### Project administrator (prototype workflow)

Can run a scheme-update search, review candidate links, inspect the existing data, and manually approve changes. In a college prototype, this can be a local-only administrative workflow rather than a public account system.

---

## 4. User Journey

1. Visitor opens the homepage.
2. Visitor chooses **Find Startup Funding** or **Find Health Coverage for Me & My Family**.
3. Website explains the kind of information needed and why.
4. Visitor completes a short, conditional questionnaire.
5. Browser requests the scheme dataset from the Node.js server.
6. Rule-based engine checks mandatory conditions and records explanations.
7. Results are grouped into:
   - **Potential match:** all known mandatory conditions pass.
   - **Needs more information:** one or more required answers are missing.
   - **Does not match known rules:** at least one mandatory condition fails.
8. Visitor filters or sorts results and opens scheme details.
9. Visitor compares up to three schemes, saves options, or creates a checklist.
10. Visitor follows the official source or application link for confirmation.

---

## 5. Recommended Technology Architecture

```text
Browser
├── HTML pages
├── CSS design system and responsive layout
├── Vanilla JavaScript
│   ├── Questionnaire state
│   ├── Rule-based recommendation engine
│   ├── Result rendering and filters
│   └── Checklist and comparison logic
├── jQuery
│   ├── Event handling / DOM helpers
│   └── AJAX requests
└── localStorage
    ├── Shortlisted scheme IDs
    ├── Comparison IDs
    └── Checklist completion state

Node.js built-in server (no Express)
├── http: server and routing
├── fs: read scheme JSON files
├── path: safe file paths
├── https: optional SerpApi request
└── URL: query parsing

Data
├── schemes.json
├── categories.json
└── source / verification metadata
```

### Key architecture rule

The browser should not need the SerpApi key. The browser requests your own Node.js endpoint; the Node.js server calls SerpApi only when an administrator triggers a search.

Keep `data/` outside the public static directory. Serve the intended dataset through a controlled endpoint such as `/api/schemes`.

---

## 6. Stunning Frontend Design Direction

### Design concept: “Civic clarity with modern fintech polish”

The interface should feel trustworthy and welcoming—not like a crowded government form or a generic admin dashboard.

### Visual direction

- **Primary:** deep navy / ink blue for trust and strong headings.
- **Accent:** vivid teal for actions and positive progress.
- **Warm neutral background:** soft ivory or very light grey.
- **Supporting colors:** muted blue, pale mint, amber for warnings, and red only for errors.
- **Typography:** a clean sans-serif such as Inter or a system font stack.
- **Shapes:** generous whitespace, 14–20px card radii, fine borders, restrained shadows.
- **Icons:** consistent inline SVG or a consistent icon library, if permitted.
- **Motion:** subtle hover transitions, animated progress indicator, and reduced-motion support.
- **Imagery:** purposeful illustrations or simple vector-style graphics; avoid excessive stock photos.

### Design principles

1. Use one strong primary call to action per screen.
2. Make every form step short and scannable.
3. Use clear labels instead of jargon.
4. Never use color alone to communicate eligibility.
5. Show the source and last verification date prominently.
6. Keep a consistent header, footer, spacing scale, and button style.
7. Design for mobile first, then enhance for tablet and desktop.
8. Avoid fake ratings, fabricated trust statistics, and unverified government seals.

### Suggested design tokens

```css
:root {
  --color-ink: #14263d;
  --color-primary: #155eef;
  --color-teal: #0f9f91;
  --color-bg: #f6f8fb;
  --color-surface: #ffffff;
  --color-text: #1c2b3a;
  --color-muted: #637386;
  --color-border: #dce4ec;
  --color-success: #18794e;
  --color-warning: #9a6700;
  --color-danger: #b42318;

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;

  --shadow-card: 0 8px 24px rgba(20, 38, 61, 0.07);
  --content-width: 1160px;
}
```

These are starting values; test contrast and refine them during implementation.

---

## 7. Page-by-Page Frontend Plan

### 7.1 Homepage — `index.html`

**Purpose:** Explain the value proposition and let users choose a domain immediately.

**Sections:**

1. Header:
   - YojanaPath logo/wordmark.
   - Links: How it works, Explore support, Saved schemes.
   - Primary button: “Find support”.
   - Mobile navigation menu.

2. Hero:
   - Headline: **“The right support starts with your situation.”**
   - Short description explaining problem-based scheme discovery.
   - Primary CTA: “Find startup funding”.
   - Secondary CTA: “Explore health coverage”.
   - Decorative illustration showing a simple path from a problem to a scheme card.

3. Two prominent domain cards:
   - **Startup funding:** “Explore funding, loans, subsidies, and support for your business journey.”
   - **Health coverage:** “Explore government health coverage and healthcare assistance for individuals and families.”

4. How it works:
   - Tell us about your situation.
   - Check potential matches.
   - Understand the next steps.

5. Trust and transparency strip:
   - Official sources.
   - Eligibility explanations.
   - Verification dates.
   - Clear notice that final eligibility is determined by the scheme authority.

6. Footer:
   - About the prototype.
   - Data and privacy note.
   - Official-source disclaimer.
   - Contact/project information for the college demo.

**Interactions:**
- Domain cards open the relevant questionnaire route.
- Saved schemes opens the shortlist page.
- Navigation works on mobile and keyboard.
- No claim such as “100% accurate” or “guaranteed eligibility”.

### 7.2 Domain intro — `domain.html` or reusable view

Explain what the chosen domain covers, what information may be requested, and how the result is determined.

Startup examples:
- Business stage.
- State.
- Applicant or business type.
- Funding purpose.
- Startup recognition/registration status, where relevant.

Health examples:
- State.
- Age band.
- Household/family circumstances where required by an actual scheme.
- Existing coverage or relevant beneficiary category, where required.

Do not ask for sensitive identifiers unless a genuine, documented requirement exists—and do not collect them in version 1.

### 7.3 Guided questionnaire — `questionnaire.html`

**Layout:**
- Progress bar, e.g. “Step 2 of 5”.
- One topic per step.
- Back and Continue controls.
- Save-and-resume option using local state.
- Clear “Why we ask” helper text where helpful.
- Inline validation and an error summary.

**Potential steps for startup funding:**
1. State and applicant type.
2. Business stage: idea, early-stage, operating business.
3. Funding purpose.
4. Relevant business registration/recognition status.
5. Additional criteria required by the schemes in the dataset.

**Potential steps for health coverage:**
1. State and age band.
2. Individual or family context.
3. Relevant beneficiary or socioeconomic category, if the selected schemes require it.
4. Existing government health coverage, if relevant.
5. Any other question needed to check an actual scheme rule.

Question sets should be data-driven. Ask only questions that are relevant to the chosen domain and the currently available scheme rules.

### 7.4 Results — `results.html`

**Top section:**
- Heading: “Your potential matches”.
- Summary of the selected domain.
- Button to edit answers.
- Short note explaining the match labels.

**Filter/sort controls:**
- Benefit type.
- State / central coverage.
- Match status.
- Sort by relevance or name.

**Scheme result card:**
- Scheme name.
- Central/state label.
- Benefit type.
- Short description.
- Match status.
- Two or three concise match reasons.
- Missing information count, if applicable.
- Last verified date.
- Actions: “View details”, “Compare”, “Save”.

Avoid inventing a percentage score such as “98% eligible”. If a score is used for ordering, label it as a relevance score and explain its calculation; mandatory failures must not be hidden by a high score.

**Empty state:**
- Explain that no current record matched the supplied answers.
- Offer to revise answers.
- Show schemes needing more information separately where appropriate.
- Do not claim that no government support exists in reality.

### 7.5 Scheme details — `scheme-details.html`

Show:
- Scheme name and administering authority.
- Summary of benefit.
- Who it may help.
- Eligibility conditions, with each condition labelled as met, not met, or unknown.
- Required documents.
- Application steps.
- Official application/information link.
- Source link(s).
- Last verification date and status.
- “Save scheme”, “Add to comparison”, and “Build checklist”.
- Disclaimer about final official eligibility.

Open external links in a safe manner. Do not fabricate application URLs or treat a general department homepage as an application page.

### 7.6 Compare schemes — `compare.html`

Compare up to three schemes side by side on desktop, and as stacked comparison sections on mobile.

Rows:
- Benefit type.
- Intended beneficiary.
- State/central scope.
- Key eligibility conditions.
- Known missing information.
- Documents.
- Application steps.
- Official source.
- Last verification date.

Keep comparison data factual. If two benefits are not directly comparable, say so rather than forcing a numeric ranking.

### 7.7 Saved schemes — `saved.html`

- Saved scheme list.
- Remove from saved.
- Open details.
- Add/remove from comparison.
- Continue checklist.
- Empty state with CTA to explore support.

Use `localStorage` for this prototype. Explain that saved items are stored in the current browser and may not appear on another device.

### 7.8 Application checklist — `checklist.html`

Generate checklist items from the selected scheme's verified document and application-step records.

Features:
- Checkbox for each item.
- Progress count.
- Save completion state.
- Print-friendly stylesheet.
- Clear distinction between “commonly required by this scheme record” and “confirm with official authority”.

Do not claim the list is exhaustive unless it has been verified as exhaustive.

### 7.9 Admin update review — optional

A simple, local/demo-only screen can:
- Select a domain.
- Trigger a SerpApi search on the Node.js server.
- Show title, snippet, URL, and search date.
- Highlight whether the URL appears to be from an approved official domain.
- Let the reviewer open the original source.
- Require manual review before any dataset change.

In version 1, the admin may update `schemes.json` manually. Do not build a complex CMS unless time permits.

---

## 8. Data Design

### 8.1 Suggested scheme record

Use a consistent schema across both domains. A record may look like:

```json
{
  "id": "example-startup-001",
  "domain": "startup-funding",
  "name": "Example scheme name",
  "administeringAuthority": "Example authority",
  "coverage": {
    "type": "state",
    "states": ["Gujarat"]
  },
  "benefit": {
    "type": "seed-funding",
    "summary": "Illustrative placeholder only"
  },
  "eligibilityRules": [
    {
      "field": "state",
      "operator": "equals",
      "value": "Gujarat",
      "required": true,
      "description": "Applicant must meet the scheme's state condition"
    },
    {
      "field": "businessStage",
      "operator": "in",
      "value": ["idea", "early-stage"],
      "required": true,
      "description": "Business stage must be covered by the scheme"
    }
  ],
  "documents": [],
  "applicationSteps": [],
  "officialInfoUrl": "https://example.gov.in/",
  "officialApplicationUrl": null,
  "sources": [
    {
      "url": "https://example.gov.in/",
      "sourceType": "official",
      "checkedAt": "2026-10-15"
    }
  ],
  "lastVerified": "2026-10-15",
  "verificationStatus": "needs-review"
}
```

This is a structural example, not a real government scheme. Replace all placeholders with information verified from official sources.

### 8.2 Recommended fields

- `id`: stable unique ID; do not use a scheme's display name as its identifier.
- `domain`: `startup-funding` or `health-coverage`.
- `administeringAuthority`.
- `coverage`: central or state and applicable states.
- `benefit`: type, summary, and verified details.
- `eligibilityRules`: structured conditions.
- `documents`: document name and any caveats.
- `applicationSteps`: ordered instructions.
- `officialInfoUrl` and optional `officialApplicationUrl`.
- `sources`: source URLs and check dates.
- `lastVerified`.
- `verificationStatus`: `verified`, `needs-review`, or `outdated`.
- `notes`: concise caveats and known uncertainties.

### 8.3 Category data

Keep problem categories separate from scheme records, e.g.:
- `startup-funding`
- `health-coverage`

Category data can define the display title, introductory copy, question flow, and filters.

### 8.4 Data quality rules

- Only use real scheme information from reliable official sources.
- Store the source for every material eligibility claim.
- Keep facts separate from explanatory copy.
- Use ISO dates (`YYYY-MM-DD`).
- Never silently replace verified records with raw search results.
- If a scheme's status cannot be confirmed, mark it for review.
- Build a small accurate dataset before expanding the number of schemes.

---

## 9. Rule-Based Recommendation Engine (No AI)

The engine uses deterministic rules written in JavaScript.

### 9.1 Inputs

A normalized user-answer object, for example:

```javascript
const user = {
  domain: "startup-funding",
  state: "Gujarat",
  businessStage: "early-stage",
  fundingPurpose: "equipment",
  recognitionStatus: "unknown"
};
```

Use fictional/demo answers in testing. Do not store sensitive identifiers.

### 9.2 Rule evaluation outcomes

Each condition should return one of:
- `met`
- `not_met`
- `unknown`
- `not_applicable`

For every scheme, calculate:
- Mandatory conditions that pass.
- Mandatory conditions that fail.
- Mandatory conditions still unknown.
- Optional conditions, if any.
- Human-readable explanations.

### 9.3 Scheme result status

- **Potential match:** no mandatory condition fails and all mandatory conditions are known and met.
- **Needs more information:** no known mandatory condition fails, but at least one mandatory condition is unknown.
- **Does not match known rules:** one or more mandatory conditions fail.

Do not treat an empty answer as a pass. Do not treat a missing rule as a pass. Use explicit handling for every supported operator.

### 9.4 Matching sequence

1. Filter by domain.
2. Exclude or clearly flag records that are outdated or need review.
3. Evaluate coverage conditions.
4. Evaluate scheme-specific mandatory rules.
5. Collect reasons and unknown conditions.
6. Assign result status.
7. Sort potential matches first, then incomplete matches; use transparent relevance ordering within groups.
8. Render result cards.

### 9.5 Testing requirements

Test at least:
- All required conditions met.
- One mandatory condition failed.
- One required answer missing.
- A central scheme available across states.
- A Gujarat-only scheme with an out-of-state answer.
- An outdated or unverified record.
- Invalid user input.
- An empty scheme dataset.
- An unsupported rule operator.

The engine must never tell a user that they are officially approved or definitively eligible.

---

## 10. AJAX and jQuery Plan

Use jQuery for event handling and AJAX, while keeping rule logic in plain JavaScript functions.

Example request:

```javascript
$.ajax({
  url: "/api/schemes?domain=startup-funding",
  method: "GET",
  dataType: "json",
  timeout: 10000
})
.done(function (data) {
  // Validate the response shape before using it.
  // Run the local rule-based engine.
})
.fail(function () {
  // Show a useful retry message.
});
```

Recommended endpoints:
- `GET /api/health` — confirms that the local server is running.
- `GET /api/categories` — returns domain/category data.
- `GET /api/schemes?domain=startup-funding` — returns records for the requested domain.
- `GET /api/schemes?domain=health-coverage` — returns health-coverage records.
- `GET /api/admin/search?domain=startup-funding` — optional admin-triggered search; protect or disable in a public deployment.

Validate allowed domain values on the server. Do not let the client request arbitrary local filesystem paths.

---

## 11. Node.js Without Express

Use Node.js built-in modules only:
- `http` for the server.
- `fs` for reading JSON and static files.
- `path` for file paths.
- `https` for SerpApi calls.
- `URL` for parsing requests.

### Server responsibilities

1. Serve static frontend files from `public/`.
2. Implement explicit routes for the JSON API.
3. Validate query parameters.
4. Return appropriate content types and HTTP status codes.
5. Handle missing files and malformed requests.
6. Keep secrets out of public files.
7. Restrict filesystem paths to the intended directories.
8. Avoid exposing raw server errors to the browser.

For a college demo, a small explicit route handler is sufficient. If using a production server, add robust security controls, request timeouts, logging, and deployment configuration.

### Suggested folder structure

```text
YojanaPath/
├── server.js
├── README.md
├── .gitignore
├── data/
│   ├── schemes.json
│   └── categories.json
├── public/
│   ├── index.html
│   ├── domain.html
│   ├── questionnaire.html
│   ├── results.html
│   ├── scheme-details.html
│   ├── compare.html
│   ├── saved.html
│   ├── checklist.html
│   ├── css/
│   │   ├── tokens.css
│   │   ├── base.css
│   │   ├── layout.css
│   │   └── components.css
│   ├── js/
│   │   ├── app.js
│   │   ├── api.js
│   │   ├── questionnaire.js
│   │   ├── rules.js
│   │   ├── results.js
│   │   ├── details.js
│   │   ├── compare.js
│   │   ├── storage.js
│   │   └── checklist.js
│   └── assets/
│       ├── logo.svg
│       └── illustrations/
└── tests/
    ├── rules-cases.md
    └── sample-profiles.json
```

Do not place `SERPAPI_KEY` in any file under `public/`.

---

## 12. SerpApi Integration — Optional Update Discovery

SerpApi is not required for recommendation matching. It is only a way to discover candidate pages that may contain updates.

### Suggested workflow

1. Admin selects the domain.
2. Server builds a small, predefined search query.
3. Server calls SerpApi using its secret API key.
4. Server returns only necessary result fields: title, snippet, URL, and search date.
5. Admin opens the original official source.
6. Admin verifies any change.
7. Admin manually updates the JSON record and verification date.
8. Tests are run before the record is considered verified.

### Search examples

Startup:
- `site:startupindia.gov.in startup funding scheme`
- `site:gujarat.gov.in startup assistance policy`

Health:
- `site:nha.gov.in PM-JAY eligibility`
- `site:gujarat.gov.in health coverage scheme`

These are starting queries, not a guarantee that every result is relevant or official. Maintain an allowlist of expected official domains for review assistance, but do not treat a matching domain alone as proof of accuracy.

### API key handling

- Read the key from an environment variable such as `SERPAPI_KEY`.
- Never return the key in API responses.
- Never put the key in frontend JavaScript.
- Add `.env` and secret files to `.gitignore` if you use them.
- Use request timeouts and handle rate limits / API errors.
- Do not call SerpApi on every page load; use an explicit admin action or a deliberate refresh schedule.
- Check current provider pricing, free-tier limits, and terms before relying on the service.

---

## 13. localStorage Design

Use stable scheme IDs, not entire scheme objects, wherever possible.

Suggested keys:
- `yojanapath.savedSchemeIds`
- `yojanapath.compareSchemeIds`
- `yojanapath.questionnaireDraft`
- `yojanapath.checklist.<schemeId>`

### Rules

- Parse stored JSON inside `try/catch`.
- Validate data after parsing.
- Handle missing or malformed values gracefully.
- Limit comparison to three schemes.
- Remove stale scheme IDs when a dataset changes.
- Explain that data is stored in the current browser.
- Do not store Aadhaar numbers, bank information, medical records, passwords, or uploaded identity documents.
- Do not describe localStorage as encrypted or secure storage.

---

## 14. Accessibility and Responsive Design

### Accessibility

- Semantic HTML landmarks (`header`, `nav`, `main`, `footer`).
- Properly associated form labels.
- Keyboard-accessible buttons, menus, cards, and dialogs.
- Visible focus indicators.
- Sufficient text and control contrast.
- Errors described in text, not just color.
- Announce asynchronous result/error updates using an appropriate live region.
- Meaningful alt text for informative images; empty alt text for decorative images.
- Support reduced-motion preferences.

### Responsive layouts

- Mobile: one-column cards, full-width buttons where appropriate, compact navigation.
- Tablet: two-column domain cards and result grid.
- Desktop: wide content container, multi-column result grid, side-by-side comparisons.
- Keep forms readable and avoid horizontal overflow.
- Test at narrow widths and with browser zoom.

---

## 15. Privacy, Accuracy, and Security

- Request only the information necessary to evaluate the available rules.
- Explain why each sensitive or personal question is needed.
- Keep the prototype anonymous; do not require login.
- Never store sensitive identity or medical information.
- Keep SerpApi keys server-side.
- Restrict server routes and validate query parameters.
- Escape or safely insert dynamic content; avoid unsafe HTML injection.
- Open external links safely.
- Mark unverified and outdated records visibly.
- Keep source URLs and real verification dates.
- State that scheme rules and availability can change.
- Direct users to the official authority for final eligibility and application requirements.

---

## 16. Implementation Schedule

A suggested sequence for a student project:

### Phase 1 — Requirements and data model
- Finalize the two domains.
- List user questions for each domain.
- Define scheme JSON schema.
- Identify reliable official sources.
- Prepare a small initial dataset.

**Deliverable:** written requirements and sample scheme records.

### Phase 2 — Visual foundation
- Create color, typography, spacing, and component tokens.
- Build homepage and navigation.
- Build responsive domain cards and footer.
- Add basic accessibility states.

**Deliverable:** polished static frontend.

### Phase 3 — Node.js and JSON API
- Create the built-in HTTP server.
- Serve frontend files safely.
- Add explicit API routes for categories and schemes.
- Add error handling and endpoint validation.

**Deliverable:** website that loads JSON from the server.

### Phase 4 — Questionnaire
- Implement conditional questions.
- Add validation and progress state.
- Add back/continue navigation.
- Save non-sensitive draft answers locally.

**Deliverable:** working guided form for both domains.

### Phase 5 — Recommendation engine
- Implement supported rule operators.
- Implement `met`, `not_met`, `unknown`, and `not_applicable`.
- Group results by potential match, needs more information, and does not match known rules.
- Add readable reasons.

**Deliverable:** tested rule-based recommendations.

### Phase 6 — Results and scheme details
- Build result cards and filters.
- Build scheme detail page.
- Show source links, verification date, documents, and steps.
- Add useful empty/error states.

**Deliverable:** complete discovery journey.

### Phase 7 — Compare, save, checklist
- Implement shortlist.
- Implement comparison up to three schemes.
- Generate checklist from scheme data.
- Add print stylesheet and local persistence.

**Deliverable:** core user features complete.

### Phase 8 — Optional update discovery
- Add server-side SerpApi request.
- Display candidate search results to an admin.
- Require manual review and update.
- Keep search failure separate from the main scheme discovery experience.

**Deliverable:** optional scheme-update review flow.

### Phase 9 — Testing and final presentation
- Test matching edge cases.
- Test mobile/desktop layouts.
- Verify every official link and scheme fact.
- Fix console errors and broken states.
- Prepare README, screenshots, and demonstration scenarios.

**Deliverable:** stable project ready for college evaluation.

---

## 17. Test Plan

### Functional tests

- Each homepage CTA opens the correct domain.
- Questions differ by domain.
- Back/continue preserves answers.
- Invalid answers produce useful messages.
- AJAX loading, failure, and timeout states work.
- Rule outcomes are correct.
- Filters and sorting work.
- Details display the correct record.
- Compare limit is enforced.
- Save/remove works after page reload.
- Checklist completion persists.
- Broken or unavailable official links are flagged during data review.

### Data tests

- Every record has a unique ID and domain.
- URLs use valid HTTP(S) schemes.
- Eligibility rules use supported fields/operators.
- Every verified record has source and verification metadata.
- Unknown and outdated records are not falsely represented as verified.
- Placeholder/demo data is never shown as a real scheme.

### Manual user scenarios

1. Startup applicant who meets all configured mandatory conditions.
2. Startup applicant with one mandatory condition unmet.
3. Startup applicant missing a required answer.
4. Individual/family profile that matches a health coverage scheme's known rules.
5. User with no potential matches.
6. User who saves a scheme and returns later.
7. User comparing two or three schemes.
8. SerpApi unavailable or out of quota.

---

## 18. Definition of Done

The first version is ready when:

- [ ] Both domains work end-to-end.
- [ ] Homepage and forms are responsive and visually consistent.
- [ ] Scheme data loads from Node.js through AJAX.
- [ ] No Express dependency is used.
- [ ] The recommendation engine handles failed and unknown conditions correctly.
- [ ] Results explain why they appeared.
- [ ] Scheme details show documents, steps, sources, and verification metadata.
- [ ] Save, compare, and checklist features work.
- [ ] No API secret is exposed to the browser.
- [ ] No AI service is used.
- [ ] Placeholder content is clearly marked and replaced before the final demonstration.
- [ ] Official scheme claims have been reviewed against official sources.
- [ ] README explains setup, usage, data limitations, and the update workflow.

---

## 19. College Demonstration Plan

A concise demonstration can follow this sequence:

1. Open the homepage and explain the problem YojanaPath solves.
2. Choose startup funding.
3. Complete the questionnaire with a fictional profile.
4. Show a potential match and its matching conditions.
5. Change one answer and show how the result changes.
6. Open scheme details and inspect the official source.
7. Save the scheme, compare it with another, and build a checklist.
8. Repeat a short flow for health coverage.
9. Show the JSON data structure and explain the rule engine.
10. If implemented, show how SerpApi finds candidate update pages and how manual verification protects the dataset.

Use fictional demo profiles. Do not present sample or unverified scheme records as factual government benefits.

---

## 20. Final Recommended Priorities

Build in this order:

1. **Accurate scheme dataset and transparent rules.**
2. **Homepage and two polished domain journeys.**
3. **Questionnaire and AJAX data loading.**
4. **Results and scheme detail pages.**
5. **Saved schemes, comparison, and checklist.**
6. **Accessibility, security, testing, and documentation.**
7. **Optional SerpApi update discovery.**

Do not let the optional search integration delay the core project. YojanaPath is already a meaningful web-programming project when its two domains, rule-based matching, source transparency, and user tools work well.

**Core product principle:** YojanaPath helps people discover and understand potentially relevant government support. It explains the rules it checks, shows what remains unknown, and directs users to official sources for final confirmation.
