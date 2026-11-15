# Content Repurposer: later ChatGPT host acceptance

Status: every case below is NOT_TESTED in ChatGPT. Local Chrome checks use a simulated MCP Apps parent with real in-memory SDK calls. Neither those checks nor in-process HTTP tests establish ChatGPT acceptance.

## Before testing

Content Studio 2.2.23 remains In review. This draft does not authorize any live endpoint, package, connection, version or submission change. The owner must first approve an appropriate test environment and the exact candidate commit from draft PR #4. The current live Content Studio connection cannot demonstrate this new widget unless an authorized candidate is separately made available later. Do not modify the live In-review submission to run this pack.

The test host must support MCP Apps UI resources, the existing `content_repurposer` tool, `ui/initialize`, tool input/result notifications, component `tools/call`, component-only result metadata and size notifications. It must allow the bundled font data resources under the declared empty external CSP lists. Test with browser clipboard access as actually granted, including a refusal. No new tool or input argument is needed.

Record the candidate commit, endpoint identity without credentials, host/browser versions, test time, case result and redacted screenshots. Use the owner's chosen source or the clearly synthetic technical fixture below. Never use a client or prospect. Preserve failures and raw error messages; do not infer a pass from the assistant's prose.

## Technical fixture

```json
{
  "source_content": "Teams keep their source notes beside every draft. Reviewers check each claim before using it.\nThese statements are synthetic and unverified, for review only.\nProof: Review time fell by 20% (synthetic customer result)",
  "source_type": "blog_post",
  "key_message": "Keep source notes beside the draft."
}
```

This is fabricated test data, not an example company or a measured result.

## Cases

| Case | Action | Required observation | Status |
| --- | --- | --- | --- |
| 1. Discovery | Inspect tools/list and resources/read on the authorized candidate | Eight existing tools; only Content Repurposer adds its UI resource metadata. Its input schema is unchanged. `ui://helix/content-repurposer/v1.html` returns `text/html;profile=mcp-app` with empty external CSP lists. | NOT_TESTED |
| 2. First render | Call the fixture through ChatGPT | Helix identity and inline component render, with the caller's source populated and five default pieces. No automatic extra tool call. Complete original text remains available. | NOT_TESTED |
| 3. Empty start | Click Start empty and confirm | Empty source and source type, no example company or old result. Generate with missing source makes no call. | NOT_TESTED |
| 4. All formats | Request all ten names listed in the component | Ten channel pieces. Switching channels shows the matching server text. No invented additional format. | NOT_TESTED |
| 5. Unknown format | Set target_formats to `unsupported` | A clear unknown-format warning, no piece, and Copy disabled. | NOT_TESTED |
| 6. Proof absence | Remove the Proof line and regenerate | No invented customer result. Missing proof is visible beside the drafts. | NOT_TESTED |
| 7. Partner label | Use `Proof: We have worked together for years (partner quote)` | Partner statement is labelled as such and is not described as a customer's words. | NOT_TESTED |
| 8. Ambiguous proof label | Use `Proof: We have worked together for years (partner words).` | The existing parser limitation is explicitly warned about. Do not treat its classification as verification. | NOT_TESTED |
| 9. Qualifications | Keep synthetic/unverified text and inspect all ten formats | Qualifications survive the returned pieces. Remove a qualification in a local edit: warning appears and Copy asks for review. | NOT_TESTED |
| 10. Local edits | Edit one channel, switch away and back, then regenerate | Edit is retained and labelled local. Regeneration asks before discarding all local edits. Cancel preserves them; a successful confirmed call replaces them. | NOT_TESTED |
| 11. Reset confirmation | Open Reset this draft, then switch channel | Pending confirmation closes. No hidden draft is reset. Confirming a fresh reset restores exact server text. | NOT_TESTED |
| 12. Stale source | Change source or key message after a result; also request new host input before cancellation | Previous draft is visibly stale and cannot be copied. Cancellation does not make the old draft current. | NOT_TESTED |
| 13. Delayed result and error | Edit during a pending call and inspect cancellation/error behavior | New local edits survive delayed success, delayed error and uncorrelated host notifications. No fabricated success. | NOT_TESTED |
| 14. Literal round trip | Paste harmless literal `<b>Raw & literal</b>` into test source and regenerate three times | Input characters remain literal; no HTML element executes and no escaping accumulates in the form. Model-visible text remains safely neutralized. | NOT_TESTED |
| 15. Clipboard | Copy an unchanged draft and an edited qualified draft; test clipboard refusal | Clipboard matches the current draft. If unavailable, the exact draft is selected for keyboard copy. Missing qualifications require confirmation. Nothing is published or sent. | NOT_TESTED |
| 16. Accessibility | Use keyboard only, a screen reader, 320/768/1280 px layouts and actual browser 200 percent zoom | Labels, field errors, status changes, confirmation choices and controls are usable. Natural resize grows and shrinks. Source and draft are side by side on wide screens and stacked on narrow screens. No page overflow. | NOT_TESTED |
| 17. Errors and fallback | Test unsupported host, malformed result, unknown resource, tool rejection and reconnect | Honest error or text fallback; useful inputs and edits remain. Reconnect behavior needs direct host observation. | NOT_TESTED |
| 18. Host policy | Inspect actual resource loading and browser requests | Bundled assets load with declared CSP; no external request, credential, storage service or paid API call. | NOT_TESTED |

## Later release work

1. Complete this pack on the exact candidate and resolve any failures. Review the legacy ambiguous-proof limitation explicitly.
2. Review tool metadata, component-only data flow, UI resource, CSP and the unchanged text contract. Recheck current OpenAI requirements before deciding whether a plugin version or review update is required.
3. Have the owner choose how and when the In-review hold is resolved. No automatic version bump or cancellation of review is proposed.
4. Only after separate authorization, prepare the approved release and any required review evidence. This pack performs no merge, deployment, version change, upload, submission, publication or legal declaration.
