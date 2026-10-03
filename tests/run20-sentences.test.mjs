// Run 20 round 1 (set T judges): sentences end only at real sentence ends. A decimal ("99.5%"), a grouped number ("1,000",
// "80,000", "1,00,000") and an abbreviation (Rs., Sr., Mr., Dr., Inc., vs., e.g., i.e.) never cut a sentence, and a comma inside a
// number never becomes a list break or a semicolon. Companies are invented (Lanehop, Branchwire).
// Run: npm run build && node --test tests/run20-sentences.test.mjs
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
  assert.ok(!j.result.isError, j.result.content[0].text.slice(0, 200));
  return j.result.content.map((c) => c.text).join("\n");
};
const lines = (t) => t.split("\n");
// every cut-off fragment the judges saw
const FRAGMENTS = [/(^|[\s>*\-\d./])5% on time deliveries/, /\bplan cost Rs\s*$/m, /\bcost Rs$/m, /^\s*(?:[-*>]|\d+[./)])?\s*80,000 per branch/m, /^\s*(?:[-*>]|\d+[./)])?\s*Manager Asha/m, /^\s*(?:[-*>]|\d+[./)])?\s*i\.e\. /m, /\d;\s?\d{2,3}\b/];
const noFragments = (t, where) => {
  for (const f of FRAGMENTS) {
    const m = t.match(f);
    if (m && f.source.startsWith("(^|[\\s>")) assert.ok(/99\.5% on time deliveries/.test(t) && !lines(t).some((l) => /(^|[^.\d])5% on time deliveries/.test(l)), `${where}: 99.5% cut to 5%`);
    else assert.equal(m, null, `${where}: ${f} matched "${m && m[0]}"`);
  }
};
const SRC = "Lanehop delivered 99.5% on time deliveries in the first quarter. Sr. Manager Asha Rao at Lanehop said the plan cost Rs. 80,000 per branch, i.e. a low fixed fee. Dr. Mehta of Branchwire said savings reached 1,200 hours vs. last year. Mr. Rao added that Lanehop Pvt. Ltd. saved Rs. 1,00,000 a month.";

test("content_repurposer keeps decimals, Rs., Sr., Dr., Mr., i.e. and vs. inside their sentences", async () => {
  const t = await call("content_repurposer", { source_content: SRC, source_type: "case_study" });
  noFragments(t, "content_repurposer");
  assert.match(t, /Lanehop delivered 99\.5% on time deliveries in the first quarter/);
  assert.match(t, /Sr\. Manager Asha Rao at Lanehop said the plan cost Rs\. 80,000 per branch, i\.e\. a low fixed fee/);
  assert.match(t, /Dr\. Mehta of Branchwire said savings reached 1,200 hours vs\. last year/);
  assert.match(t, /saved Rs\. 1,00,000 a month/);
});

test("testimonial_capture keeps the story whole and the role as typed", async () => {
  const t = await call("testimonial_capture", { customer_name: "Asha Rao", customer_company: "Lanehop", customer_role: "Sr. Manager, Operations", success_story: SRC, testimonial_type: "written_quote" });
  noFragments(t, "testimonial_capture");
  assert.match(t, /Sr\. Manager Asha Rao at Lanehop said the plan cost Rs\. 80,000 per branch, i\.e\. a low fixed fee/);
  assert.match(t, /Rs\. 1,00,000 a month/);
});

test("thought_leadership_series keeps each proof point whole and numbers intact", async () => {
  const t = await call("thought_leadership_series", { topic: "Last-mile delivery", your_take: "Plan the route around the window. We reached 99.5% on time deliveries in a quarter.", target_reader: "Heads of logistics", proof_points: "Lanehop reached 99.5% on time deliveries; Cost fell by Rs. 80,000 per branch, i.e. a low fee; Savings of Rs. 1,00,000 a month, vs. last year; Sr. Manager Asha Rao said it was easy", author_background: "Sr. Director at Branchwire. 12.5 years in logistics.", num_articles: 4 });
  noFragments(t, "thought_leadership_series");
  assert.match(t, /1\. Lanehop reached 99\.5% on time deliveries/);
  assert.match(t, /2\. Cost fell by Rs\. 80,000 per branch, i\.e\. a low fee/);
  assert.match(t, /3\. Savings of Rs\. 1,00,000 a month, vs\. last year/);
  assert.match(t, /4\. Sr\. Manager Asha Rao said it was easy/);
  assert.doesNotMatch(t, /logistics\.\./, "no doubled full stop after the author background");
});

test("a comma inside a number never splits a list or becomes a semicolon (newsletter, sales, case study)", async () => {
  const n = await call("newsletter_builder", { topic: "Failed first-attempt deliveries", cta_goal: "read the guide", key_points: "Saved Rs. 1,00,000 a month, vs. last year; Cut 1,200 hours; Reached 99.5% on time deliveries" });
  assert.match(n, /Saved Rs\. 1,00,000 a month, vs\. last year/);
  assert.match(n, /Cut 1,200 hours/);
  assert.match(n, /Reached 99\.5% on time deliveries/);
  assert.doesNotMatch(n, /\d;\s?\d{2,3}\b/);
  const c = await call("case_study_generator", { customer_name: "Lanehop", your_product: "Branchwire", challenge: "Late drops", solution: "Window planning", results: "Savings of Rs. 1,00,000 a month, Cost fell by 80,000 a branch, 99.5% on time deliveries" });
  assert.match(c, /Rs\. 1,00,000 a month/);
  assert.match(c, /80,000 a branch/);
  assert.match(c, /99\.5% on time deliveries/);
  assert.doesNotMatch(c, /\d;\s?\d{2,3}\b/);
  assert.doesNotMatch(c, /(^|[^.\d])5% on time deliveries/m);
});

test("case_study_generator reads results from interview notes without cutting 99.5% to 5%", async () => {
  const t = await call("case_study_generator", { customer_name: "Lanehop", your_product: "Branchwire", mode: "full", interview_notes: "Before Branchwire the problem was late drops. They adopted window planning in March. Lanehop achieved 99.5% on time deliveries and saved Rs. 80,000 per branch. Sr. Manager Asha Rao said it was easy." });
  assert.match(t, /achieved 99\.5% on time deliveries|99\.5% on time deliveries and saved Rs\. 80,000 per branch/);
  assert.doesNotMatch(t, /(^|[^.\d])5% on time deliveries/m);
  assert.doesNotMatch(t, /cost Rs\s*$/m);
});

test("craft_content_improver shows the first sentence whole and flags no false fragment", async () => {
  const content = "Lanehop reached 99.5% on time deliveries with Branchwire. Sr. Manager Asha Rao said the plan cost Rs. 80,000 per branch. Would you like to see how? Reply to this email and we can set up a call.";
  const t = await call("craft_content_improver", { content, content_type: "email" });
  assert.match(t, /> Lanehop reached 99\.5% on time deliveries with Branchwire/);
  assert.doesNotMatch(t, /\[[^\]]*fragment[^\]]*\]/, "no sentence is cut at Rs. or Sr. and flagged as a fragment");
  assert.doesNotMatch(t, /(^|[^.\d])5% on time deliveries/m);
});
