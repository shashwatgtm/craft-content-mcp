# Timing patch compatibility, 29 October 2026

Current main checkpoint: `34384340f3a8dfe218b31b9a9d8a3aaa78b4b9f1`. Verified directly through the connected GitHub branch API. This matches the coordinator's 18:50 IST checkpoint.

Existing draft patch head tested: `3a8b508143e511a4609b1094b14f3a11636d4bdf` on `codex/timing-tests-20261029`.

This is a compatibility overlay check. No history rewrite or merge was performed. The original draft base stays unchanged. No current-main production file is added to the timing branch.

## Exact overlay

Export the local verified original base with `git archive HEAD`. Replace only the changed main files using connected GitHub blob reads. Verify every base blob against the complete current-main Git tree. Copy the two timing files from the actual draft patch. Verify their Git blob hashes against that patch head. Build inside the isolated cloud overlay using existing cloud dependencies.

The timing files are `tests/helpers/cpu-budget.mjs` and `tests/run22-echo-gaps.test.mjs`. Both hashes are recorded in the archive metadata. The timing helper and production escape/neutralise modules are unchanged from the earlier checked patch. A source comparison confirms every deterministic correctness assertion and adversarial value is preserved. No retry, sleep, skipped timing test or larger CPU ceiling was added.

The archive includes complete argv, working directories, exit codes, log hashes, full logs, base and patch metadata, and the exact cloud harness. Initial workstream mutant evidence remains in the ICP archive. It was not repeated because this base does not change the timing helper or the production escape/neutralise functions.

## Results

| Check | Exit | Pass | Fail | Existing skip |
| --- | --- | --- | --- | --- |
| build | 0 | n/a | n/a | n/a |
| suite | 0 | 1060 | 0 | 3 |
| busy-targeted | 0 | 14 | 0 | 0 |
| busy-host-review | 0 | 9 | 0 | 0 |

Busy checks ran on CPU 0 with two bounded Python CPU workers on that same CPU. Each worker had a 120 second maximum. Both were stopped in a finally block. The affected test file and all host-review tests passed under that contention. The full isolated suite passed. Existing suite skips were preserved. No new skip was introduced.

Accepted commands in the isolated overlay:

```sh
npm run build
node --test --test-isolation=none --test-reporter=tap tests/*.test.mjs
taskset -c 0 node --test --test-isolation=none --test-reporter=tap tests/run22-echo-gaps.test.mjs
taskset -c 0 node --test --test-isolation=none --test-reporter=tap tests/host-review-20261028.test.mjs tests/host-review-20261029.test.mjs
```

The JSON receipt retains the exact expanded suite argv. Node 24.19.0 uses `--test-isolation=none` here because this cloud restricts nested Node child-process execution. All heavy computation stayed in the cloud. No live endpoint was called.

All nine Content host-review tests passed under CPU contention. The current-base suite includes preservation of source qualifications, all supplied story outcomes, and nonduplicated blog summaries.

## Documentation and boundaries

Read directly again through the connected web reader:

- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/deploy/app-review

The UI guide keeps tools useful without a UI and uses MCP Apps resource attachment and bridge messages. The review page requires exact CSP domains. This work adds no UI, render tool, checkout or durable storage. No browser check was run because no UI changed.

Current-main and draft Git trees contain no workflow files. The coordinator's existing register confirms these two sites deploy manually. Only documentation and review evidence are appended to the existing draft branch. No production file, dependency, version, tool name, endpoint, authentication, hosted video, challenge or header changed. No main/master write, force push, merge, deployment, Netlify command, workflow dispatch, DNS change, submission, package upload, publication, declaration, credential access, client/prospect data, paid API call, OpenAI skill or shell MCP tool. IMPACT, ICP and Revenue are untouched in this follow-up.
