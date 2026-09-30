// Run 15 R15-32: fixes from the edge-case matrix (evidence/run15/matrix/, triage independent-audit/run15/matrix-triage.md).
// Tested in-process through netlify/functions/mcp.mjs (no network, no deploy). Run: npm run build, then node --test tests/matrix-fixes.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const j = await r.json();
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
};
const count = (hay, needle) => hay.split(needle).length - 1;

test("content_repurposer: the Blog Summary lists each key point once, with no label cut from its first words", async () => {
  const r = await call("content_repurposer", { source_content: "Most onboarding fails in week one because new customers never reach their first success moment. Map that moment, remove every step before it, and measure time to value.", source_type: "blog_post", brand_voice: "professional", key_message: "Map the first success moment and remove every step before it" });
  const blog = r.text.split("### Blog Summary")[1].split("### Quote Cards")[0];
  assert.equal(count(blog, "Map that moment, remove every step before it, and measure time to value"), 1);
  assert.doesNotMatch(blog, /- \*\*[^*]+:\*\* /);
  assert.match(blog, /\*\*The bottom line:\*\* \[/);
});

test("sales_enablement_content: the demo script points to the objection handlers without a wrong direction; a default stage is labelled", async () => {
  const r = await call("sales_enablement_content", { product: "ExampleCo Scheduler", target_persona: "Clinic operations directors", proof_points: "No-shows down 30% at Example Clinic Group" });
  assert.doesNotMatch(r.text, /handlers above/);
  assert.match(r.text, /\| \*\*Sales Stage\*\* \| demo \(default\) \|/);
  const given = await call("sales_enablement_content", { product: "ExampleCo Scheduler", target_persona: "Clinic operations directors", proof_points: "No-shows down 30% at Example Clinic Group", sales_stage: "discovery" });
  assert.match(given.text, /\| \*\*Sales Stage\*\* \| discovery \|/);
});

test("craft_content_improver: one long paragraph is '1 paragraph', not '1 paragraphs'", async () => {
  const long = Array.from({ length: 130 }, (_, i) => `word${i}`).join(" ") + ".";
  const r = await call("craft_content_improver", { content: long, content_type: "blog_post" });
  assert.doesNotMatch(r.text, /\b1 paragraphs\b/);
});
