// Run 29G (test first): the five tools of this server that are among the ten weakest return clean structure (owner decision D-27B-1 (a)):
// six sections in order: 1 what the user gave, quoted as typed; 2 the framework applied (the deliverable, frozen); 3 sector checks (the user's own
// words for the kind of business, the reading, the sector notes as checks); 4 gaps; 5 questions to ask next; 6 a note to the assistant.
// Also the traced lines of run 27B (independent-audit/run27b/trace.md) not yet tested: sector notes printed as facts in the deliverable, and the
// stock fallback where an input was missing. Plain words only, no real company (rule B81). Loads dist (npm run build first). Run: node --test tests/run29g-structure.test.mjs
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
const HEADS = ["## 1. What you gave", "## 2. The framework applied", "## 3. Sector checks", "## 4. Gaps", "## 5. Questions to ask next", "## 6. Note to the assistant"];
const SECTOR_HEAD = /^#{2,4} (?:sector notes\b.*|what this audience looks for|questions on the measures .* buyers look for|context questions in the language of .*|questions in the language of .*|in the language of .*|what to check in each segment \(sector view\).*)$/im;
function sections(t) {
  const at = HEADS.map((h) => t.indexOf(`\n${h}\n`));
  at.forEach((x, i) => assert.ok(x >= 0, `missing ${HEADS[i]}`));
  for (let i = 1; i < at.length; i++) assert.ok(at[i] > at[i - 1], `${HEADS[i]} out of order`);
  return HEADS.map((h, i) => t.slice(at[i] + h.length + 2, i + 1 < at.length ? at[i + 1] : t.length));
}
// Section 1 says every field once in the whole answer (design change of R29G-02, logged: the older tests, kept unedited, forbid pasting an input
// twice): a value is quoted as typed, or quoted clause by clause in order with every word kept, or pointed to section 2 when section 2 already
// quotes it whole or uses three quarters of its words or more.
const clauses = (v) => v.split(/(?<=[.!?;:])\s+|\n+|,\s+(?=(?:and|but|so|while|which means)\s)/).map((x) => x.trim()).filter(Boolean);
function saidOnce(s, k, v) {
  const line = s[0].split("\n").findIndex((l) => l.startsWith(`- ${k}`));
  assert.ok(line >= 0, `section 1 names ${k}`);
  const block = s[0].split("\n").slice(line).join("\n");
  if (block.startsWith(`- ${k}: "${v}"`)) return;
  if (block.startsWith(`- ${k}: quoted whole, as typed, in section 2`)) { assert.ok(s[1].includes(v), `${k} is quoted whole in section 2`); return; }
  if (block.startsWith(`- ${k}: in section 2, in your words`)) return;
  let at = 0;
  for (const c of clauses(v)) { const i = block.indexOf(`"${c}"`, at); assert.ok(i >= at, `section 1 quotes every clause of ${k} in order: ${c}`); at = i; }
}
function shape(t, args) {
  const s = sections(t);
  for (const [k, v] of Object.entries(args)) {
    if (typeof v === "string") saidOnce(s, k, v);
    if (typeof v === "number") assert.ok(s[0].includes(`- ${k}: "${v}"`), `section 1 gives ${k}`);
    if (Array.isArray(v)) for (const e of v) if (typeof e === "string") assert.ok(s[0].includes(`"${e}"`), `section 1 quotes an entry of ${k}`);
  }
  assert.doesNotMatch(s[1], SECTOR_HEAD, "no sector note block left in the framework section");
  assert.doesNotMatch(s[1], /^\*?Sector: read from your inputs/m, "the sector line sits in section 3");
  assert.doesNotMatch(s[1], /^\*{0,2}To sharpen this(?: [a-z]+)?, give:/m, "the gap line sits in section 4, not in the framework");
  assert.match(s[2], /What the business is, in your words|What the business is: not stated/);
  assert.ok(s[5].trim().split("\n").length >= 2, "a short note to the assistant");
  return s;
}
const EMAIL = ["Subject: Store tasks done on time", "Hi,", "Shelfwise is store operations software for retail chains: a task manager with photo checks and an audit app.", "A grocery chain finished 30% more store tasks on time in one quarter (case study; page claim).", "Would you be open to a 20-minute call next week?", "Thanks,", "The Shelfwise team"].join("\n");

test("craft_content_improver: six sections; the scores and edits are the framework; what the audience looks for is a sector check", async () => {
  const args = { content: EMAIL, content_type: "sales_email", audience: "Heads of retail operations at grocery chains" };
  const r = await call("craft_content_improver", args);
  assert.equal(r.isError, false);
  const s = shape(r.text, args);
  assert.match(s[1], /Overall Score: /);
  assert.doesNotMatch(s[1], /^## What This Audience Looks For$/m);
  assert.match(s[2], /What the business is, in your words \(content\): "Shelfwise is store operations software for retail chains/);
});

test("testimonial_capture: six sections; sector questions read from the buyer's industry are questions, and the missing product is asked for", async () => {
  const args = { customer_name: "contact at a customer (name not given)", customer_company: "a Shelfwise customer (grocery retail)", customer_role: "Store Operations Manager",
    success_story: "A grocery chain finished 30% more store tasks on time in one quarter (case study; page claim)", testimonial_type: "written_quote" };
  const r = await call("testimonial_capture", args);
  assert.equal(r.isError, false);
  const s = shape(r.text, args);
  assert.match(s[1], /Request Email/);
  assert.match(s[4], /your product|what do you sell/i);
});

test("thought_leadership_series: six sections; the articles are the framework; the sector notes are checks", async () => {
  const args = { topic: "store operations for grocery chains", your_take: "store tasks only get done when each one has an owner and a photo proof", target_reader: "heads of retail operations",
    proof_points: "A grocery chain finished 30% more store tasks on time in one quarter (case study; page claim)", num_articles: 3, article_type: "framework" };
  const r = await call("thought_leadership_series", args);
  assert.equal(r.isError, false);
  const s = shape(r.text, args);
  assert.match(s[1], /Article 1 of 3/);
});

test("webinar_script: six sections; the script is the framework; the sector notes are checks", async () => {
  const args = { topic: "How grocery chains can finish store tasks on time, with Shelfwise", target_audience: "Heads of retail operations at grocery chains", webinar_type: "educational", duration: "45_min",
    key_takeaways: "one list of store tasks; photo proof for each task", include_polls: true, product_mention_level: "subtle" };
  const r = await call("webinar_script", args);
  assert.equal(r.isError, false);
  const s = shape(r.text, args);
  assert.match(s[1], /Run of Show/);
});

test("sales_enablement_content: six sections; the kit is the framework; the sector notes and sector language questions are checks", async () => {
  const args = { product: "Shelfwise, store operations software for retail chains: a task manager with photo checks and an audit app", target_persona: "Head of Retail Operations at a grocery chain",
    proof_points: "A grocery chain finished 30% more store tasks on time in one quarter (case study; page claim)", common_objections: "We already use spreadsheets", sales_stage: "discovery" };
  const r = await call("sales_enablement_content", args);
  assert.equal(r.isError, false);
  const s = shape(r.text, args);
  assert.match(s[1], /Objection Handlers/);
});
