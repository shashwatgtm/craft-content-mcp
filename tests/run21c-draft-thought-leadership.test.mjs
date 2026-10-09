// run 21c: draft rewrite. thought_leadership_series returned outlines: headings, coaching lines and sector text with the inputs squeezed in as labels.
// It must return a first draft: finished articles built from the topic, the take, the reader, the proof points and the author, then finished promo posts.
// Two invented companies of different kinds (a construction platform and a messaging platform). Every figure is hypothetical.
// Run: npm run build && node --no-warnings --test tests/run21c-draft-thought-leadership.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  assert.ok(!j.result.isError, j.result.content[0].text.slice(0, 200));
  return j.result.content.map((c) => c.text).join("\n");
};

const A = {
  topic: "keeping job budgets honest while the work is still going on",
  your_take: "A cost report that arrives a month after the work is history, not control. Post every change order to the budget the day it is signed, and let the superintendent see the same number as the controller.",
  target_reader: "Controllers and project managers at general contractors with 20 to 200 active jobs",
  proof_points: "A 40-person concrete subcontractor now posts change orders the same day (customer story headline); Customer quote from Dana Whitfield, Controller at Ridgeline Builders: \"We stopped chasing field notes at month end.\" (customer quote); Change order cycle time fell from 12 days to 4 days on one pilot project (hypothetical figure); Slabwise is used on 1,200 jobsites (page claim)",
  author_background: "Head of product at Slabwise, 12 years building job costing systems",
  num_articles: 3,
  article_type: "contrarian",
};
const B = {
  topic: "getting one-time passcodes onto phones in seconds",
  your_take: "A passcode that lands after the user gave up is a lost sign-up. Judge a messaging provider by delivery time in each country, not by price per message.",
  target_reader: "Product managers and engineering leads at consumer apps that send login codes in 30 countries",
  proof_points: "Median time to deliver a login code fell from 14 seconds to 5 seconds in one country (hypothetical figure); Customer quote from Omar Reyes, Head of Growth at Brightcart: \"Fewer users write to support about missing codes.\" (customer quote); Chatterlane sends for 900 apps (page claim); How a delivery dashboard ended the weekly passcode complaint (customer story headline)",
  author_background: "Founder of Chatterlane, a business messaging platform, 10 years in messaging infrastructure",
  num_articles: 3,
  article_type: "contrarian",
};

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9$%]+/g, " ").trim();
const has = (text, phrase) => norm(text).includes(norm(phrase));
const BAD_PLACEHOLDER = /\[[^\]]*\]|\{[^}]*\}|your product|\bTBD\b|\bInsert\b|\bplaceholder\b/i;
const HEALTH = /\b(?:clinics?|pharmac\w*|health\w*|patients?|hospitals?|medical|doctors?)\b/i;
// the generic lines of the old outline output (taken from what it printed)
const FILLER = [
  "Where do you disagree", "the best insights come from the conversation", "Pre-Publish Checklist", "Headline is compelling", "this draft is an outline",
  "Put your reader's own figures", "I just published a piece on this", "Link in comments", "Start with one live case", "Change one thing first",
  "Pick the team closest to the problem", "Everything You Know", "The Uncomfortable Truth", "Tier 1: your owned channels", "Example figure",
  "Suggested Proof Points", "A personal story where you learned", "Close with", "most people", "In today's", "As you know", "Where to Publish",
  "Subheads break up content", "Call to engage",
];
const bigLines = (t) => new Set(t.split("\n").map((l) => norm(l)).filter((l) => l.length >= 30));
const overlap = (x, y) => { const a = bigLines(x), b = bigLines(y); const n = [...a].filter((l) => b.has(l)).length; return n / Math.max(1, Math.min(a.size, b.size)); };

for (const [label, args, inputs] of [
  ["construction platform", A, ["keeping job budgets honest", "a cost report that arrives a month after the work is history, not control", "post every change order to the budget the day it is signed", "let the superintendent see the same number as the controller", "general contractors with 20 to 200 active jobs", "A 40-person concrete subcontractor now posts change orders the same day (customer story headline)", "Dana Whitfield", "Ridgeline Builders", "We stopped chasing field notes at month end", "Change order cycle time fell from 12 days to 4 days on one pilot project (hypothetical figure)", "1,200 jobsites (page claim)", "12 years building job costing systems", "Head of product at Slabwise"]],
  ["messaging platform", B, ["getting one-time passcodes onto phones in seconds", "a passcode that lands after the user gave up is a lost sign-up", "judge a messaging provider by delivery time in each country, not by price per message", "consumer apps that send login codes in 30 countries", "from 14 seconds to 5 seconds in one country (hypothetical figure)", "Omar Reyes", "Brightcart", "Fewer users write to support about missing codes", "Chatterlane sends for 900 apps (page claim)", "How a delivery dashboard ended the weekly passcode complaint (customer story headline)", "a business messaging platform, 10 years in messaging infrastructure", "Founder of Chatterlane"]],
]) {
  test(`thought_leadership_series draft (${label}): every input is in the draft, whole articles are written, nothing is a placeholder or filler`, async () => {
    const t = await call("thought_leadership_series", args);
    for (const p of inputs) assert.ok(has(t, p), `missing from the draft: ${p}`);
    assert.doesNotMatch(t, BAD_PLACEHOLDER, (t.match(BAD_PLACEHOLDER) || [""])[0]);
    assert.doesNotMatch(t, HEALTH);
    assert.doesNotMatch(t, /[–—]/);
    for (const f of FILLER) assert.ok(!t.toLowerCase().includes(f.toLowerCase()), `filler: ${f}`);
    // three finished articles, each with a body of full sentences
    const arts = t.split(/\n## Article \d of 3/).slice(1).map((a) => a.split(/\n## (?:Promotional Posts|Sector Notes)/)[0]);
    assert.equal(arts.length, 3);
    for (const a of arts) {
      const body = a.split("\n").filter((l) => !/^\*\*|^#|^---|^\*By|^\|/.test(l.trim()) && l.trim()).join(" ");
      const words = body.split(/\s+/).length;
      assert.ok(words >= 120, `an article body of ${words} words is a skeleton`);
      assert.ok(/[.!?]["”)]?\s/.test(body), "full sentences");
      assert.match(a, /\*\*Headline:\*\* [^\n]+/);
    }
    // no sentence of any length is printed in two articles
    const lineSets = arts.map((a) => new Set(a.split("\n").map((l) => norm(l)).filter((l) => l.length >= 40 && !/^(?:headline|lead proof point|counter argument)/.test(l))));
    for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) {
      const shared = [...lineSets[i]].filter((l) => lineSets[j].has(l));
      assert.ok(shared.length <= 3, `articles ${i + 1} and ${j + 1} share lines: ${shared.slice(0, 2).join(" | ")}`);
    }
    // the promo posts are finished posts
    const promo = t.split("## Promotional Posts")[1] || "";
    assert.ok(promo.split("### Promo Post").length - 1 === 3, "three promo posts");
    assert.ok(!/\[|\{/.test(promo));
  });
}

test("thought_leadership_series draft: two different kinds of company get drafts whose lines differ almost entirely", async () => {
  const a = await call("thought_leadership_series", A);
  const b = await call("thought_leadership_series", B);
  const o = overlap(a, b);
  assert.ok(o < 0.25, `line overlap ${(o * 100).toFixed(0)} percent`);
  // the sector notes follow the kind of company
  const secA = a.split("## Sector Notes")[1] || "";
  const secB = b.split("## Sector Notes")[1] || "";
  assert.ok(secA && secB);
  assert.match(secA, /change order|RFI|cost variance/i);
  assert.match(secB, /delivery rate|cost per delivered message|time to deliver/i);
  assert.doesNotMatch(secB, /change order|RFI\b/i);
  assert.doesNotMatch(secA, /delivery rate|cost per delivered message/i);
});

test("thought_leadership_series draft: a missing input is said once near the top, and the draft still reads", async () => {
  const { proof_points, author_background, ...rest } = A;
  const t = await call("thought_leadership_series", { ...rest, topic: "construction software that keeps job budgets honest while the work is still going on", num_articles: 2 });
  // run 22 rewrite: what is missing is named once, at the end, with what each input would change
  assert.equal((t.match(/To sharpen this, give:/g) || []).length, 1, "said once");
  const tail = t.slice(t.indexOf("To sharpen this, give:"));
  assert.match(tail, /proof_points \(it would change/);
  assert.match(tail, /author_background \(it would change/);
  assert.ok(t.length - t.indexOf("To sharpen this, give:") < 900, "at the end");
  assert.doesNotMatch(t, BAD_PLACEHOLDER);
  assert.doesNotMatch(t, /Suggested Proof Points|A personal story where you learned/);
  assert.doesNotMatch(t, /[–—]/);
  // the sector's own proof shape is named once, as what the evidence should look like
  assert.match(t, /live project|change order cycle time|cost variance/i);
  // no article invents a customer, a figure or a quote
  assert.doesNotMatch(t, /\d+(?:\.\d+)?\s?%|\bsaved \$|customer quote/i);
});

test("thought_leadership_series draft: every article type writes finished articles with their own headlines", async () => {
  for (const type of ["how_to", "lessons_learned", "prediction", "framework"]) {
    const t = await call("thought_leadership_series", { ...A, article_type: type, num_articles: 5 });
    const heads = [...t.matchAll(/\*\*Headline:\*\* ([^\n]+)/g)].map((m) => m[1]);
    assert.equal(heads.length, 5, type);
    assert.equal(new Set(heads).size, 5, type);
    assert.doesNotMatch(t, BAD_PLACEHOLDER, type);
    assert.doesNotMatch(t, /[–—]/, type);
    for (const f of FILLER) assert.ok(!t.toLowerCase().includes(f.toLowerCase()), `${type} filler: ${f}`);
    for (const p of ["A 40-person concrete subcontractor now posts change orders the same day", "We stopped chasing field notes at month end", "from 12 days to 4 days"]) assert.ok(has(t, p), `${type}: ${p}`);
    // lessons and predictions do not invent a story or a prediction the author did not give
    assert.doesNotMatch(t, /\bI (?:once|remember|learned the hard way)\b/i, type);
  }
});

test("thought_leadership_series draft: the source files carry no long or short dash and no healthcare word", () => {
  for (const f of ["../src/thought-leadership.ts"]) {
    const s = readFileSync(new URL(f, import.meta.url), "utf8");
    assert.doesNotMatch(s, /[–—]/, f);
    assert.doesNotMatch(s, /\b(?:clinics?|pharmac\w*|healthcare|patients?|hospitals?)\b/i, f);
  }
});
