# Discovery report: craft-content-mcp

Source work is closed on codex/discovery-20261111. Nothing was deployed or published.

Before: The case study page had a good title but a weak source and next step explanation.

Why it matters: Buyers need to keep measured results and quotes attached to their sources.

Now in the draft: A visible case study answer and guide 09 route, current ChatGPT setup and counts, and a typed CRAFT reference.

Checks: build passed; changed HTML has one h1, valid JSON-LD, titles at most 65 characters, extensionless canonicals, full raw text and resolving local targets. Browser source review passed at 375 and 1280 px with JavaScript disabled. Exact, same meaning and opposite buyer questions are retained in the hub acceptance cases. Runtime tool code, descriptions, schemas, tests and assistant JSON were left untouched.

Full suite: 7487 tests, 7482 passed, 2 failed, 3 skipped. The suite is not clean.

Already failing on main:

- `large and adversarial inputs run quickly`
- `scripts/test-in-field.mjs`

Files changed:

- `discovery-20261111/REPORT.md`
- `discovery-20261111/state.json`
- `public/connect/index.html`
- `public/index.html`
- `public/llms.txt`
- `public/tools/case-study-generator/index.html`
- `public/tools/content-repurposer/index.html`
- `public/tools/craft-content-improver/index.html`
- `public/tools/newsletter-builder/index.html`
- `public/tools/sales-enablement-content/index.html`
- `public/tools/testimonial-capture/index.html`
- `public/tools/thought-leadership-series/index.html`
- `public/tools/webinar-script/index.html`

Owner questions: no additional question for this source branch. Cross-site blockers and the release sequence are in the hub discovery-20261111/OWNER-QUESTIONS.md and REPORT.md. Claude reviews the assembled draft, the owner approves release, then Fable checks the live result.
