// Host review, 29 October 2026: the case study story carries every supplied outcome, and the blog summary does not repeat a
// sentence it has already shown. Invented companies only.
// Run: npm run build, then node --no-warnings --test tests/host-review-20261029.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  return (await r.json()).result.content.map((c) => c.text).join("\n");
};
const piece = (t, heading) => t.split(`### ${heading}`)[1].split("\n---\n")[1];
const story = (t) => t.split("## The Story (draft)")[1].split("*The sections below")[0];
const caseStudy = (results) => call("case_study_generator", {
  customer_name: "Northwind", your_product: "Pipewell CRM, synthetic demonstration scenario", mode: "full",
  challenge: "Synthetic test story: the regional team used disconnected spreadsheets.", solution: "The test team centralized pipeline records and held weekly reviews.",
  results, customer_industry: "telecom", business_model: "saas", your_sector: "saas",
});

test("case_study_generator: four supplied outcomes all appear in the story", async () => {
  const s = story(await caseStudy("Synthetic results for review only: reporting preparation fell from 4 hours to 2 hours per week; forecast accuracy rose from 70% to 85%; data entry errors fell from 12 to 4 per month; review time fell from 6 hours to 3 hours."));
  for (const r of ["4 hours to 2 hours", "70% to 85%", "12 to 4 per month", "6 hours to 3 hours"]) assert.ok(s.includes(r), r);
  assert.doesNotMatch(s, /more results? (?:is|are) listed/);
});

test("case_study_generator: past six outcomes the story points to the rest instead of dropping them silently", async () => {
  const eight = Array.from({ length: 8 }, (_, i) => `metric ${i + 1} fell from ${20 + i} to ${10 + i}`).join("; ");
  const s = story(await caseStudy(`Synthetic results for review only: ${eight}.`));
  assert.match(s, /2 more results are listed under Outcomes below\./);
});

test("case_study_generator: a single outcome reads as before", async () => {
  const s = story(await caseStudy("Synthetic result for review only: reporting preparation fell from 4 hours to 2 hours per week."));
  assert.match(s, /\*\*The result\.\*\* Synthetic result for review only: reporting preparation fell from 4 hours to 2 hours per week\.\n/);
});

test("content_repurposer: the blog summary says its opening once", async () => {
  const t = await call("content_repurposer", { source_content: "Synthetic Northwind planning exercise. The team started with one region. A named owner checked the reporting fields weekly. The pilot surfaced missing data before a wider rollout. These are demonstration statements, not verified Northwind company findings.", source_type: "blog_post", target_formats: "blog_summary", brand_voice: "professional" });
  const b = piece(t, "Blog Summary");
  assert.equal(b.split("Synthetic Northwind planning exercise").length, 2, b);
  for (const p of ["The team started with one region.", "A named owner checked the reporting fields weekly.", "not verified Northwind company findings"]) assert.ok(b.includes(p), p);
  // the full list of points is still reported in the source notes
  assert.match(t, /1\. Synthetic Northwind planning exercise/);
});

test("content_repurposer: with a key message as the title, the summary keeps every source sentence as a point", async () => {
  const t = await call("content_repurposer", { source_content: "Most rollouts fail when every region starts at once. Start with one region and a named owner. Check the reporting fields every week. Widen the rollout only when the data is complete.", source_type: "blog_post", target_formats: "blog_summary", key_message: "Start small and widen only when the data is complete" });
  const b = piece(t, "Blog Summary");
  assert.match(b, /^\n\*\*Start small and widen only when the data is complete\*\*\n\n- Most rollouts fail/);
  assert.equal(b.split("\n").filter((l) => l.startsWith("- ")).length, 4, b);
});
