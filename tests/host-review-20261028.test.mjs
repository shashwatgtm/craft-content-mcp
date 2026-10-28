// Host review, 28 October 2026: every repurposed piece keeps the source's own qualification, because each piece can be shared
// on its own. Invented companies only.
// Run: npm run build, then node --no-warnings --test tests/host-review-20261028.test.mjs
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

const SOURCE = "Synthetic Northwind planning exercise. The team started with one region. A named owner checked the reporting fields weekly. The pilot surfaced missing data before a wider rollout. These are demonstration statements, not verified Northwind company findings.";
const QUALIFIER = "These are demonstration statements, not verified Northwind company findings.";

test("content_repurposer: the LinkedIn post, the email and the blog summary each keep the source's qualification", async () => {
  const t = await call("content_repurposer", { source_content: SOURCE, source_type: "blog_post", target_formats: "linkedin_post, email, blog_summary", brand_voice: "professional" });
  for (const h of ["LinkedIn Post", "Email Version", "Blog Summary"]) assert.ok(piece(t, h).includes(QUALIFIER), h);
  // said once per piece, not repeated
  assert.equal(piece(t, "Email Version").split(QUALIFIER).length, 2);
});

test("content_repurposer: every other format keeps it too", async () => {
  const t = await call("content_repurposer", { source_content: SOURCE, source_type: "blog_post", target_formats: "twitter_thread, quote_cards, infographic_outline, video_script, podcast_talking_points, slide_deck_outline, newsletter_section" });
  for (const h of ["Twitter/X Thread", "Quote Cards", "Infographic Outline", "Video Script (60 to 90 seconds)", "Podcast Talking Points", "Slide Deck Outline", "Newsletter Section"]) {
    assert.match(piece(t, h), /not verified Northwind company findings/, h);
  }
});

test("content_repurposer: a source without a qualification gets nothing added", async () => {
  const t = await call("content_repurposer", { source_content: "The team started with one region. A named owner checked the reporting fields weekly. The pilot surfaced missing data before a wider rollout.", source_type: "blog_post", target_formats: "email" });
  assert.doesNotMatch(t, /synthetic|not verified|demonstration/i);
});

test("case_study_generator: the story does not present sector generalities as the customer's facts", async () => {
  const t = await call("case_study_generator", {
    customer_name: "Northwind", your_product: "Pipewell CRM, synthetic demonstration scenario", mode: "full",
    challenge: "Synthetic test story: the regional team used disconnected spreadsheets.", solution: "The test team centralized pipeline records and held weekly reviews.",
    results: "Synthetic result for review only: reporting preparation fell from 4 hours to 2 hours per week.", customer_industry: "telecom", business_model: "saas", your_sector: "saas",
  });
  const story = t.split("## The Story (draft)")[1].split("*The sections below")[0];
  assert.doesNotMatch(story, /a problem many in|usually show up first in|As in most of/);
  assert.doesNotMatch(story, /telecom segment, where/);
  assert.match(story, /General note for SaaS, not from your inputs/);
  assert.match(story, /4 hours to 2 hours/);
  assert.doesNotMatch(t, /^> "/m); // no quote is written when none was given
});
