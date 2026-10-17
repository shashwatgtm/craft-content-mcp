// run 21c: draft rewrite. content_repurposer printed a kit of notes around channel sketches: posting notes, a distribution matrix, a checklist, outline lines such as
// "Supporting visual", and a "[Your name]" signature. It must return finished versions per channel, built from the source, the key message, the proof and the voice.
// Two invented companies of different kinds (a construction platform and a messaging platform). Every figure is hypothetical.
// Run: npm run build && node --no-warnings --test tests/run21c-draft-content-repurposer.test.mjs
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

const SRC_A = `Why month-end cost reports arrive too late for a general contractor
Slabwise is construction management software that helps general contractors see job cost the day a change order is signed. Most controllers at general contractors still rebuild the budget from field notes at month end. The cost report shows what happened last month, so the superintendent argues with a number that is four weeks old. At Slabwise we built change order posting around this: the superintendent enters the change in the field and the controller sees the same budget line the same day. If you run job cost for a general contractor, start by listing every change order that is signed but not yet in the budget.
Proof: Change order cycle time fell from 12 days to 4 days on one pilot project (hypothetical figure); Customer quote from Dana Whitfield, Controller at Ridgeline Builders: "We stopped chasing field notes at month end." (customer quote); Slabwise is used on 1,200 jobsites (page claim)`;
const A = { source_content: SRC_A, source_type: "blog_post", brand_voice: "friendly", key_message: "Slabwise: post change orders to the budget the day they are signed" };
const SRC_B = `Why a login code that arrives late is a lost sign-up
Chatterlane is a business messaging platform that sends login codes and order alerts for consumer apps. Most product teams still judge a messaging provider by its price per message. A code that lands after the user gave up counts as a failed sign-up, whatever it cost to send. At Chatterlane we built delivery tracking around this: every message reports when it reached the phone, country by country. If you send login codes in many countries, start by measuring the time from send to delivery in your slowest country.
Proof: Median time to deliver a login code fell from 14 seconds to 5 seconds in one country (hypothetical figure); Customer quote from Omar Reyes, Head of Growth at Brightcart: "Fewer users write to support about missing codes." (customer quote); Chatterlane sends for 900 apps (page claim)`;
const B = { source_content: SRC_B, source_type: "blog_post", brand_voice: "friendly", key_message: "Chatterlane: judge delivery time in each country, not price per message" };
const ALL = "linkedin_post, twitter_thread, email, blog_summary, quote_cards, infographic_outline, video_script, podcast_talking_points, slide_deck_outline, newsletter_section";

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9$%]+/g, " ").trim();
const has = (text, phrase) => norm(text).includes(norm(phrase));
const BAD_PLACEHOLDER = /\[[^\]]*\]|\{[^}]*\}|your product|\bTBD\b|\bInsert\b|\bplaceholder\b|add the link here|\badd the link\b/i;
const HEALTH = /\b(?:clinics?|pharmac\w*|health\w*|patients?|hospitals?|medical|doctors?)\b/i;
// the generic lines of the old kit output
const FILLER = [
  "Here's what stands out", "Worth a read when you have a few minutes", "A short summary of something worth your time", "Engage with comments in the first hour",
  "Posting Notes", "Repurposing Checklist", "Review each piece for brand consistency", "Content Distribution Matrix", "Follow for more insights like this",
  "Supporting visual", "Key takeaway summary", "Tease the next episode", "a solid colour", "Use brand colors", "A story or example from your own work",
  "One thing they can do this week", "Read the full version for examples", "Customize for platform-specific", "Presenter name and date", "Shares, saves", "Design Notes",
];
const bigLines = (t) => new Set(t.split("\n").map((l) => norm(l)).filter((l) => l.length >= 30));
const overlap = (x, y) => { const a = bigLines(x), b = bigLines(y); const n = [...a].filter((l) => b.has(l)).length; return n / Math.max(1, Math.min(a.size, b.size)); };

for (const [label, args, inputs] of [
  ["construction platform", A, ["Why month-end cost reports arrive too late for a general contractor", "Slabwise is construction management software that helps general contractors see job cost the day a change order is signed", "Most controllers at general contractors still rebuild the budget from field notes at month end", "the superintendent argues with a number that is four weeks old", "the superintendent enters the change in the field and the controller sees the same budget line the same day", "post change orders to the budget the day they are signed", "Change order cycle time fell from 12 days to 4 days on one pilot project (hypothetical figure)", "Dana Whitfield", "We stopped chasing field notes at month end", "1,200 jobsites (page claim)"]],
  ["messaging platform", B, ["Why a login code that arrives late is a lost sign-up", "Chatterlane is a business messaging platform that sends login codes and order alerts for consumer apps", "Most product teams still judge a messaging provider by its price per message", "A code that lands after the user gave up counts as a failed sign-up", "every message reports when it reached the phone, country by country", "judge delivery time in each country, not price per message", "from 14 seconds to 5 seconds in one country (hypothetical figure)", "Omar Reyes", "Fewer users write to support about missing codes", "Chatterlane sends for 900 apps (page claim)"]],
]) {
  test(`content_repurposer draft (${label}): the default formats are finished pieces that use every input, with no placeholder or filler`, async () => {
    const t = await call("content_repurposer", args);
    for (const p of inputs) assert.ok(has(t, p), `missing from the draft: ${p}`);
    assert.doesNotMatch(t, BAD_PLACEHOLDER, (t.match(BAD_PLACEHOLDER) || [""])[0]);
    assert.doesNotMatch(t, HEALTH);
    assert.doesNotMatch(t, /[–—]/);
    for (const f of FILLER) assert.ok(!t.toLowerCase().includes(f.toLowerCase()), `filler: ${f}`);
    // the five default formats are all there, each with finished text
    const piece = (name, next) => (t.split(`### ${name}`)[1] || "").split(next ? `### ${next}` : "\n## ")[0];
    const li = piece("LinkedIn Post", "Twitter/X Thread");
    assert.ok(li.split(/\s+/).length >= 60, "the LinkedIn post is a post, not a sketch");
    const th = piece("Twitter/X Thread", "Email Version");
    const tweets = th.split("**Tweet ").slice(1).map((x) => x.split("\n").slice(1).join("\n").split("\n\n")[0].trim());
    assert.ok(tweets.length >= 4, `tweets ${tweets.length}`);
    for (const w of tweets) assert.ok(w.length <= 290, `${w.length}: ${w}`);
    const em = piece("Email Version", "Blog Summary");
    assert.match(em, /^\s*---\s*\n+Subject: [^\n]{10,}/m, "the email starts with one subject line");
    assert.match(em, /\n\n(?:Hello|Hi|Dear)[^\n]*,\n/, "a greeting");
    assert.ok(em.split(/\s+/).length >= 60);
    const bl = piece("Blog Summary", "Quote Cards");
    assert.ok(bl.split(/\s+/).length >= 60);
    // one line near the top says what only the user can add, once
    const head = t.split("\n").slice(0, 12).join("\n");
    assert.match(head, /Before you use it:|Not given:/);
    assert.equal((t.match(/Link /g) || []).length <= 2, true, "the link instruction is written once");
  });
}

test("content_repurposer draft: two different kinds of company get kits whose lines differ almost entirely", async () => {
  const a = await call("content_repurposer", { ...A, target_formats: ALL });
  const b = await call("content_repurposer", { ...B, target_formats: ALL });
  const o = overlap(a, b);
  assert.ok(o < 0.25, `line overlap ${(o * 100).toFixed(0)} percent`);
  const secA = a.split("## Sector Notes")[1] || "";
  const secB = b.split("## Sector Notes")[1] || "";
  assert.ok(secA && secB, "a sector notes block below the draft");
  assert.match(secA, /change order|RFI|cost variance/i);
  assert.match(secB, /delivery rate|cost per delivered message|time to deliver/i);
  assert.doesNotMatch(secB, /change order|RFI\b/i);
});

test("content_repurposer draft: all ten formats are finished and carry the inputs", async () => {
  const t = await call("content_repurposer", { ...A, target_formats: ALL });
  for (const h of ["LinkedIn Post", "Twitter/X Thread", "Email Version", "Blog Summary", "Quote Cards", "Infographic Outline", "Video Script", "Podcast Talking Points", "Slide Deck Outline", "Newsletter Section"]) assert.ok(t.includes(`### ${h}`), h);
  assert.doesNotMatch(t, BAD_PLACEHOLDER, (t.match(BAD_PLACEHOLDER) || [""])[0]);
  assert.doesNotMatch(t, /[–—]/);
  for (const f of FILLER) assert.ok(!t.toLowerCase().includes(f.toLowerCase()), `filler: ${f}`);
  const piece = (name) => (t.split(`### ${name}`)[1] || "").split(/\n### |\n## /)[0];
  // a video script is spoken lines per segment; slides have a title and text from the source; talking points are statements from the source
  assert.match(piece("Video Script"), /Slabwise/);
  assert.ok(has(piece("Video Script"), "the superintendent argues with a number that is four weeks old"));
  assert.ok(has(piece("Slide Deck Outline"), "Change order cycle time fell from 12 days to 4 days"));
  assert.ok(has(piece("Podcast Talking Points"), "Most controllers at general contractors still rebuild the budget from field notes at month end"));
  assert.ok(has(piece("Infographic Outline"), "12 days to 4 days"));
  assert.ok(has(piece("Quote Cards"), "We stopped chasing field notes at month end"));
  assert.ok(has(piece("Newsletter Section"), "post change orders to the budget the day they are signed"));
  for (const h of ["Infographic Outline", "Video Script", "Podcast Talking Points", "Slide Deck Outline"]) assert.ok(piece(h).split(/\s+/).length >= 50, `${h} is a sketch`);
});

test("content_repurposer draft: sentences of the source that no format could carry are listed in one line, and a missing proof line is said once", async () => {
  const src = `Why renewals slip in the last month
Most account managers send the renewal quote in the final two weeks. Buyers then ask for a discount because there is no time to compare. At Renewdesk we built a renewal calendar around this: every contract shows its notice date ninety days out. A second team keeps its own spreadsheet of notice dates. A third team never records the notice date at all. A fourth team records it only for the largest accounts. A fifth team keeps the notice date in a shared inbox. A sixth team tracks nothing before the quote goes out.`;
  const t = await call("content_repurposer", { source_content: src, source_type: "blog_post" });
  const notUsed = t.split("\n").filter((l) => /^Not used in the draft:/i.test(l.trim()));
  assert.equal(notUsed.length, 1, "one line");
  assert.match(notUsed[0], /because/);
  const notGiven = t.split("\n").filter((l) => /^Not given:/i.test(l.trim()));
  assert.ok(notGiven.length <= 2);
  assert.ok(notGiven.join(" ").match(/proof|key_message/i), "what is missing is named");
  assert.doesNotMatch(t, BAD_PLACEHOLDER);
  assert.doesNotMatch(t, /\d+(?:\.\d+)?\s?%/, "no figure is invented");
});

test("content_repurposer draft: the brand voice changes the greeting, the sign-off and the closing line, and an unknown format is named", async () => {
  const out = {};
  for (const voice of ["professional", "casual", "authoritative", "friendly", "bold"]) out[voice] = await call("content_repurposer", { ...A, brand_voice: voice, target_formats: "linkedin_post, email, hologram_card" });
  assert.equal(new Set(Object.values(out).map((x) => x.split("### Email Version")[1].split("### ")[0])).size, 5, "five voices, five emails");
  assert.match(out.bold, /hologram card is not a format this tool writes/i);
  for (const v of Object.values(out)) { assert.doesNotMatch(v, BAD_PLACEHOLDER); assert.doesNotMatch(v, /[–—]/); }
});

test("content_repurposer draft: the source file carries no long or short dash and no healthcare word", () => {
  const s = readFileSync(new URL("../src/content-repurposer.ts", import.meta.url), "utf8");
  assert.doesNotMatch(s, /[–—]/);
  assert.doesNotMatch(s, /\b(?:clinics?|pharmac\w*|healthcare|patients?|hospitals?)\b/i);
});
