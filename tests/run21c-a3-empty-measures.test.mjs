// Run 21c addendum A3 (test first): the "test" section of thought_leadership_series read ranked[...].m without checking that the list of measures had items,
// so a topic with no sector, or a take that shares no word with any measure, could crash or leave an empty slot ("read it against ."). An empty list now gives no line.
// Run: npm run build && node --no-warnings --test tests/run21c-a3-empty-measures.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "thought_leadership_series", arguments: args } }) }));
  const j = await r.json();
  assert.ok(j.result && !j.result.isError, JSON.stringify(j).slice(0, 300));
  return j.result.content.map((c) => c.text).join("\n");
};
const BAD = /\bundefined\b|\bNaN\b|\[object Object\]|against \.|on \.|\(\s*\)|measures? (?:is|are) \./i;
const TYPES = ["contrarian", "how_to", "lessons_learned", "prediction", "framework"];

test("a topic that names no sector gives a series with no empty measure line", async () => {
  for (const article_type of TYPES) {
    const out = await call({ topic: "keeping a weekly book club going", your_take: "Fix the date and the venue first, then pick the book together", target_reader: "organisers of small reading groups", num_articles: 5, article_type });
    assert.doesNotMatch(out, BAD, article_type);
    assert.match(out, /book club|book/i);
  }
});

test("a take that shares no word with the sector's measures gives no measure line and no crash", async () => {
  for (const article_type of TYPES) {
    const out = await call({ topic: "construction management software for general contractors", your_take: "Zebras mostly graze at dusk", target_reader: "general contractors", num_articles: 5, article_type });
    assert.doesNotMatch(out, BAD, article_type);
  }
});

// No real sector has an empty measure list, so the crash cannot be reached through the tool today; this reads the source to make sure the access stays guarded.
test("the measure list is checked for items before it is indexed", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/thought-leadership.ts", import.meta.url), "utf8");
  const at = src.indexOf("ranked[(a.index * 2) % ranked.length]");
  assert.ok(at > 0);
  const before = src.slice(Math.max(0, at - 160), at);
  assert.match(before, /if \(ranked\.length\)/);
});

// Run 21c round 3 (test first): a topic with a bracket note was cut inside the bracket in the headlines ("A Framework for X (customer Operations").
test("no headline holds an unclosed bracket", async () => {
  for (const article_type of TYPES) {
    const out = await call({ topic: "AI-native business services (customer operations, collections, intelligent back office, technology services and marketing services for banks)", your_take: "One team under one contract should own the outcome", target_reader: "heads of operations at banks", num_articles: 3, article_type });
    for (const m of out.matchAll(/^(?:\*\*Headline:\*\* |# )(.+)$/gm)) {
      const open = (m[1].match(/\(/g) || []).length, close = (m[1].match(/\)/g) || []).length;
      assert.equal(open, close, `${article_type}: ${m[1]}`);
    }
  }
});
