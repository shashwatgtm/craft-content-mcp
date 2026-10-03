// Run 21c second pass (test first): the recurring faults the fresh judges named in newsletter_builder and webinar_script, tested with an invented
// services firm and an invented software company. Input fragments that cannot be made grammatical are quoted, never spliced into our own sentences.
// Run: npm run build && node --no-warnings --test tests/run21c-draft-k1.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  assert.ok(!j.result.isError, JSON.stringify(j.result));
  return j.result.content.map((c) => c.text).join("\n");
};

const TOPIC = "How retail banks with decades old core systems can tackle releases that wait on a quarterly freeze because testing is manual and nobody dares to change the core, from Brightwork";
const POINTS = "releases that wait on a quarterly freeze because testing is manual and nobody dares to change the core; so every fix queues behind the next release, and the team spends its time on the freeze calendar; 40% fewer defects after automated testing is in place; 12 weeks from kickoff to the first release (page claim); a transition team that stays until the bank's own staff run the work";
const NL = { topic: TOPIC, key_points: POINTS, cta_goal: "book a conversation about Brightwork", newsletter_type: "thought_leadership" };
const WB = {
  topic: TOPIC.replace("from Brightwork", "with Brightwork"), target_audience: "technology leaders at retail banks", webinar_type: "educational", duration: "45_min",
  key_takeaways: POINTS, include_polls: true, product_mention_level: "subtle",
};
const sections = (t) => [...t.matchAll(/^### (\d+)\. (.+)$/gm)].map((m) => ({ n: Number(m[1]), heading: m[2] }));
const draftOf = (t) => t.slice(t.indexOf("**Subject:**"), t.indexOf("## Subject Lines"));

test("newsletter: a section heading is never a raw figure, and figures sit in one labelled section", async () => {
  const t = await call("newsletter_builder", NL);
  for (const s of sections(t)) assert.doesNotMatch(s.heading, /^[\d$]|%/, s.heading);
  assert.match(t, /40% fewer defects after automated testing is in place/);
  assert.match(t, /12 weeks from kickoff to the first release \(page claim\)/);
});

test("newsletter: every count in a subject line or in the opening equals the number of sections", async () => {
  const t = await call("newsletter_builder", NL);
  const n = sections(t).length;
  assert.ok(n >= 2);
  const counts = [...t.replace(/Not used in the draft: \d+ points/, "").matchAll(/\b(\d+) points\b/g)].map((m) => Number(m[1]));
  assert.ok(counts.length >= 1);
  for (const c of counts) assert.equal(c, n, `count ${c} against ${n} sections`);
});

test("newsletter: a long run-on key point is quoted, not spliced into a sentence of ours", async () => {
  const t = await call("newsletter_builder", NL);
  const d = draftOf(t);
  const run = "releases that wait on a quarterly freeze because testing is manual and nobody dares to change the core, so every fix queues behind the next release, and the team spends its time on the freeze calendar";
  const at = d.toLowerCase().indexOf(run);
  assert.ok(at > 0, "the point is kept");
  assert.equal(d[at - 1], '"', "and quoted");
  // outside the quotes, none of the fragment's words are spliced into a sentence of ours
  const noQuotes = d.slice(d.indexOf("\n---\n")).replace(/"[^"\n]*"/g, "");
  assert.doesNotMatch(noQuotes, /nobody dares|freeze calendar|queues behind/i);
});

test("newsletter: the topic's own problem is not a section of its own, and a clause label is quoted after 'points on'", async () => {
  const t = await call("newsletter_builder", NL);
  const d = draftOf(t);
  assert.doesNotMatch(t, /^### 1\. Releases that wait on a quarterly freeze/m);
  assert.doesNotMatch(d, /This issue looks at \d+ points on [^"\n]+\.$/m);
  assert.match(d, /This issue looks at \d+ points on [^\n]*"/);
});

test("newsletter: a figure with no source label is not a hook, a subject line or a heading", async () => {
  const t = await call("newsletter_builder", { ...NL, key_points: "Releases wait on a quarterly freeze; 40% fewer defects after automated testing is in place; A transition team that stays until the bank's own staff run the work" });
  const subj = t.split("## Subject Lines")[1].split("## Opening Hooks")[0];
  assert.doesNotMatch(subj, /40%/);
  assert.match(t, /### Hook 2: Statistic\n> [^\n]*40% fewer defects[^\n]*(source|sourced)/i);
});

test("webinar: a services firm is never called a product, and the mention is not hollow", async () => {
  const t = await call("webinar_script", { ...WB, business_model: "services" });
  assert.doesNotMatch(t.split("## Sector Notes")[0], /product behind|see it on your own case|the product\b/i);
  assert.match(t, /hosted by Brightwork|Brightwork's own work|how Brightwork works/i);
  assert.doesNotMatch(t, /kept short: it is/i);
});

test("webinar: no stage note is spoken, and a block with no takeaway is written from the sector or the topic", async () => {
  const t = await call("webinar_script", { ...WB, key_takeaways: "Releases wait on a quarterly freeze; Testing is manual", business_model: "services" });
  assert.doesNotMatch(t, /no takeaway of its own|use it for a worked example/i);
  const blocks = [...t.matchAll(/### Main Content Block \d[^\n]*\n[\s\S]*?(?=\n### )/g)].map((m) => m[0]);
  assert.equal(blocks.length, 3);
  for (const b of blocks) assert.ok(b.split("**SPEAKER:**")[1].length > 120, b);
});

test("webinar: the long topic is spoken once, and a run-on takeaway is quoted", async () => {
  const t = await call("webinar_script", WB);
  const script = t.slice(t.indexOf("## Full Script"));
  const label = "releases that wait on a quarterly freeze because testing is manual and nobody dares to change the core";
  assert.ok((script.toLowerCase().split(label).length - 1) <= 3, "the long label is not echoed through the script");
  const run = "releases that wait on a quarterly freeze because testing is manual and nobody dares to change the core, so every fix queues behind the next release, and the team spends its time on the freeze calendar";
  let i = script.toLowerCase().indexOf(run);
  assert.ok(i > 0);
  while (i >= 0) { assert.equal(script[i - 1], '"'); i = script.toLowerCase().indexOf(run, i + 1); }
});

test("newsletter: eight key points give six sections and every count says six", async () => {
  const eight = Array.from({ length: 8 }, (_, i) => `Point number ${["one", "two", "three", "four", "five", "six", "seven", "eight"][i]} about the freeze calendar`).join("; ");
  const t = await call("newsletter_builder", { ...NL, key_points: eight });
  assert.equal(sections(t).length, 6);
  for (const m of t.replace(/Not used in the draft: \d+ points/, "").matchAll(/\b(\d+) points\b/g)) assert.equal(Number(m[1]), 6, m[0]);
  assert.match(t, /Not used in the draft: 2 points/);
});
