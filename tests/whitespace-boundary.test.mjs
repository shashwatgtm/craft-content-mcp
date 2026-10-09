// Run 18 R18-26 (P05-WS-01, owner decision D68): newsletter_builder trims topic and cta_goal at the boundary, and the shortened topic
// in the subject lines never holds an empty word (no double space). Interior whitespace the user typed is kept in the echoes.
// The preview text is a random pick (src/newsletter-builder.ts generatePreviewText): lines "- Preview text:" and "**Preview:**" are masked before comparing.
// Tested in-process through netlify/functions/mcp.mjs (no network).
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
const mask = (t) => t.split("\n").map((l) => (l.startsWith("- Preview text:") ? "- Preview text: <masked>" : l.startsWith("**Preview:**") ? "**Preview:** <masked>" : l)).join("\n");
const nl = async (topic, cta_goal, extra = {}) => {
  const r = await call("newsletter_builder", { topic, cta_goal, ...extra });
  assert.equal(r.isError, false);
  return r.text;
};
const subjectsOf = (t) => t.split("## Subject Lines")[1].split("---")[0].split("\n").filter((l) => l.startsWith("**"));

const TYPES = ["product_update", "educational", "industry_news", "thought_leadership", "curated_links"];
const PADS = {
  "trailing space": ["", " "],
  "trailing newline": ["", "\n"],
  "trailing CRLF": ["", "\r\n"],
  "leading space": ["  ", ""],
  "leading newline": ["\n", ""],
  "leading and trailing blank lines": ["\n\n", "\n\n"],
  "mixed padding": [" \r\n\t ", "\t \r\n\n  "],
};

for (const type of TYPES) {
  for (const [label, [pre, post]] of Object.entries(PADS)) {
    test(`newsletter_builder (${type}): topic and cta_goal with ${label} give the same output as unpadded, apart from the random preview lines`, async () => {
      const opts = { newsletter_type: type, audience_segment: "practitioners" };
      const plain = mask(await nl("AI agents for finance teams", "read the blog", opts));
      const padded = mask(await nl(pre + "AI agents for finance teams" + post, pre + "read the blog" + post, opts));
      assert.equal(padded, plain);
    });
  }
}

test("newsletter_builder: a padded topic prints no double space in the subject lines and keeps the Topic and CTA Goal rows intact", async () => {
  for (const type of TYPES) {
    const t = await nl("AI agents \n", "download the guide\n", { newsletter_type: type });
    assert.match(t, /^\*\*Subject:\*\* [^\n]*AI agents[^\n]*$/m);   // run 22 rewrite: the title line no longer echoes the topic; the subject and the Topic row do
    assert.match(t, /^\| \*\*Topic\*\* \| AI agents \|$/m);
    assert.match(t, /^\| \*\*CTA Goal\*\* \| download the guide \|$/m);
    const subjects = subjectsOf(t);
    assert.equal(subjects.length, 3);   // run 22 rewrite: the subject of the issue plus three alternatives
    for (const s of [...subjects, t.match(/\*\*Subject:\*\* ([^\n]+)/)[1]]) assert.doesNotMatch(s, /\S {2,}\S/, s);
    for (const l of t.split("\n")) if (l.startsWith("| **")) assert.match(l, /\|$/, l);
  }
});

test("newsletter_builder: a topic with a trailing space in a product update has single spaces in every subject line", async () => {
  const t = await nl("AI agents ", "read the blog", { newsletter_type: "product_update" });
  // run 21c: draft rewrite (no "you asked for it" claim in the subject lines; the first one is "New: <topic>")
  assert.match(t, /^\*\*Subject:\*\* New: AI agents$/m);
  // Run 19 (D80, problem 2): the topic is never pasted before "is", so a subject line is "Product update: AI agents".
  assert.doesNotMatch(t, /AI agents {2,}| {2,}AI agents/);   // run 22 rewrite: the "Product update:" variant is gone; no stray space is the rule that remains
});

test("newsletter_builder: interior double spaces and interior newlines in topic and cta_goal are kept exactly in the echoes", async () => {
  const t = await nl(" AI  agents  for finance ", " read  the blog ", { newsletter_type: "educational" });
  assert.match(t, /^\| \*\*Topic\*\* \| AI {2}agents {2}for finance \|$/m);
  assert.match(t, /^\| \*\*CTA Goal\*\* \| read {2}the blog \|$/m);
  const n = await call("newsletter_builder", { topic: "AI\nagents", cta_goal: "read\nthe blog" });
  assert.ok(n.text.includes("| **Topic** | AI\nagents |"));
  assert.ok(n.text.includes("| **CTA Goal** | read\nthe blog |"));
});

test("newsletter_builder: a topic with interior runs of spaces makes subject lines with no empty word", async () => {
  const t = await nl("AI   agents  for finance", "read the blog", { newsletter_type: "product_update" });
  // Run 19 (D80, problem 2): the whole topic is used (it is no longer cut to three words), with single spaces.
  assert.match(t, /^\*\*Subject:\*\* New: AI agents for finance$/m);   // run 22 rewrite
  for (const s of subjectsOf(t)) assert.doesNotMatch(s, /\S {2,}\S/, s);
});

test("newsletter_builder: a topic or cta_goal that is only whitespace is still refused as missing", async () => {
  const a = await call("newsletter_builder", { topic: " \n ", cta_goal: "read the blog" });
  assert.equal(a.isError, true);
  assert.match(a.text, /Missing required input for newsletter_builder: topic/);
  const b = await call("newsletter_builder", { topic: "AI agents", cta_goal: "\n\t" });
  assert.equal(b.isError, true);
  assert.match(b.text, /Missing required input for newsletter_builder: cta_goal/);
});
