# Content Repurposer widget candidate

Draft implementation against `craft-content-mcp` main `66d888fde2377059112359da172a7877d7207b91`. Content Studio remains In review. No release, version, hosting or submission change is authorized by this draft.

The existing `content_repurposer` now exposes a bundled MCP Apps component and an additive structured result. Its name, argument schema, original content array and writer rules stay unchanged. Each structured piece is captured during the same generation pass as the original text and receives the same final bracket cleanup. The component never reconstructs a result by parsing Markdown.

The empty Helix component keeps source inputs beside a channel draft, with source qualifications, proof classifications and removed claims nearby. Local draft edits are explicitly labelled. Regeneration and reset ask before replacing edits; copying a draft with missing source qualifications asks for a review. Input edits mark old drafts stale and disable copying until regeneration. Literal form values round trip only in an allowlisted component metadata field; model-visible results retain the existing neutralisation pipeline.

The component calls only `content_repurposer`, after an explicit button action. It initializes inline display, rejects stale replies and uncorrelated notifications after local ownership, and reports natural height changes. Rendering uses textContent and form values. Fonts are bundled Helix Archivo and IBM Plex Mono assets. Resource external CSP lists are empty. No storage, credential, external request, model call or publish action is added.

## First working checkpoint

| Check | Result |
| --- | --- |
| Original source snapshot | 86 source, configuration and test files verified against Git blob hashes; 11 unchanged website/readme files added to make existing tests runnable |
| Dependencies | All 145 lockfile package versions match the independently accessible C dependency tree copied into this isolated candidate; SDK 1.32.2, TypeScript 5.9.3 |
| TypeScript build | PASS |
| Focused source and real in-memory SDK tests | PASS, 66 tests, zero failures |
| Differential contract | 29 valid inputs plus four invalid inputs; exact text and error parity, unchanged tool schemas and other tool metadata, resource MIME/CSP, literal round trips |
| Full repository suite | Pending at this checkpoint |
| Simulated browser suite | Pending at this checkpoint |
| Actual ChatGPT host and deployed endpoint | NOT_TESTED |

The baseline writer and server fixtures are mechanical transpilation of the pinned main, with imports redirected to the unchanged shared dependencies. Tests cover all ten formats, duplicates, unknown formats, no proof, no key points, source order, voices, sector override, inert markup, long source, caveats and removed claims. New test data has no example company or client.

## Failures retained and fixes explained

An initial build was started before an ordinary dependency copy finished and could not find TypeScript. After the copy completed, TypeScript reported an explicit interface conversion issue; an `unknown` intermediate cast preserves the already validated dispatch contract. No validation rule changed.

The first focused run passed 63 of 64 checks. Its partner fixture used `(partner words).`, which the existing parser did not recognize as a source label. The test now uses the existing canonical `(partner quote)` form for the exclusion assertion and retains the original ambiguous form as a differential case. The component warns when partner wording lacks a recognized label. The legacy writer and its text are unchanged. This limitation needs owner review before release; no broader proof verification is claimed.

## Reproduce

```powershell
npm run build
node scripts/build-content-repurposer-ui.mjs --check
node --test --test-isolation=none tests/content-repurposer-widget.test.mjs
node --test --test-isolation=none
```

Browser harness: `scripts/check-content-repurposer-browser.mjs`, using an existing Playwright Core installation and local Chrome through `HELIX_PLAYWRIGHT_MODULE` and `HELIX_CHROME_EXECUTABLE`. It follows the established inline parent plus srcdoc iframe harness, with real in-memory SDK calls. It uses no localhost or file URL navigation. This is a simulated MCP Apps host, not ChatGPT.

Source files and test receipts are local under `heavy-run-20261029/widget-builds-20261030/content-repurposer`. Raw setup/build/focused logs are retained under `review`. Screenshots are local evidence only. The generated UI TypeScript is tracked with its HTML source; `dist` is ignored and untracked in this repository.

## Release gate

Keep this PR draft while Content Studio is In review. A later owner decision must identify an authorized host test endpoint, complete the real ChatGPT pack, approve the precise UI metadata and resource, and determine required plugin version or review work under the rules then in force. This draft makes no version change and creates no release package. It does not authorize merge, deployment, upload, submission or publication.
