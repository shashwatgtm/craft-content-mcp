// Run 21c (draft rewrite, test first): newsletter_builder returns a first draft built from the inputs (subject, opening, one short section per
// key point, call to action), not an outline with coaching lines. Two invented companies of different kinds (a construction management platform
// and a business messaging platform). Run: npm run build && node --no-warnings --test tests/run21c-draft-newsletter.test.mjs
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

const A = {
  topic: "Fewer change order disputes on commercial building projects",
  key_points: "Change orders get approved by email and then lost in inboxes; Subcontractors send daily reports on paper and the site photos arrive a week late; Girderly keeps every change order, drawing revision and site photo on one project record; Teams using it say payment applications go out 30% faster (page claim)",
  cta_goal: "book a walkthrough of Girderly",
  audience_segment: "practitioners",
  newsletter_type: "educational",
  tone: "conversational",
  previous_topics: "Reading a schedule slip before it hits the budget; Closing out a project without a punch list backlog",
  your_product: "Girderly, a construction management platform for general contractors",
};
const B = {
  topic: "Reaching customers on the chat apps they already use",
  key_points: "Customers ignore email but answer on their phone chat apps; One shared inbox for sales and support messages across every chat channel; Verified sender profiles so customers trust the first message; Getting message templates approved takes days when it is done by hand (customer story headline)",
  cta_goal: "start a sandbox with Pingdeck",
  audience_segment: "executives",
  newsletter_type: "product_update",
  tone: "professional",
  previous_topics: "Why opt-in lists matter for chat; Pricing a message by the conversation",
  your_product: "Pingdeck, a business messaging platform with an API for chat apps",
};

const HEALTH = /\b(clinics?|patients?|hospitals?|healthcare|pharmac\w*|medical|physician|dental)\b/i;
const FILLER = [
  "A fair test", "nobody talks about", "even experts make", "your complete guide", "what most people get wrong", "Each point ends with something you can do this week",
  "one sentence on how it helps", "Pre-Send Checklist", "Optimization Tips", "Draw them in", "Use it as the opening line", "Open with a week in the life",
  "Thread this together", "Example figure: replace with your own", "Content Structure Recommendation", "Send Times for", "This week: check how your team answers it",
  "Where Girderly", "Where Pingdeck", "Unpopular opinion", "the part nobody talks about", "As you know", "fast-paced world",
];
const norm = (s) => s.toLowerCase().replace(/\s+/g, " ");
const items = (s) => s.split(";").map((x) => x.trim());
const longLines = (t) => new Set(t.split("\n").map((l) => l.trim()).filter((l) => l.length >= 30));

function checkClean(t, label) {
  assert.doesNotMatch(t, /\[[^\]\n]*\]/, `${label}: bracket placeholder`);
  assert.doesNotMatch(t, /\{[^}\n]*\}/, `${label}: brace placeholder`);
  assert.doesNotMatch(t, /your product|\bTBD\b|Insert|\bundefined\b|\bNaN\b/i, `${label}: placeholder word`);
  assert.doesNotMatch(t, /[–—]/, `${label}: dash`);
  assert.doesNotMatch(t, HEALTH, `${label}: healthcare word`);
  for (const f of FILLER) assert.ok(!t.includes(f), `${label}: filler "${f}"`);
}

for (const [label, args] of [["A construction", A], ["B messaging", B]]) {
  test(`newsletter draft (${label}): the draft comes first and holds every input`, async () => {
    const t = await call("newsletter_builder", args);
    checkClean(t, label);
    // the artifact: subject, opening, one section per point, call to action, in that order, before the alternative subject lines
    const iSubject = t.indexOf("**Subject:**");
    const iFirst = t.indexOf("### 1. ");
    const iCta = t.indexOf("Button: ");
    const iAlt = t.indexOf("## Subject Lines");
    assert.ok(iSubject > 0 && iSubject < iFirst && iFirst < iCta && iCta < iAlt, "order: subject, sections, button, then the other subject lines");
    const draft = norm(t.slice(iSubject, iAlt));
    for (const p of items(args.key_points)) {
      const bare = norm(p).replace(/\s*\([^)]*\)\s*$/, "");
      assert.ok(draft.includes(bare), `${label}: key point kept in the draft: ${p}`);
    }
    for (const p of items(args.previous_topics)) assert.ok(draft.includes(norm(p)), `${label}: previous topic ${p}`);
    assert.ok(draft.includes(norm(args.cta_goal)), "cta in the draft");
    assert.ok(norm(t).includes(norm(args.topic)), "topic");
    assert.ok(t.includes(args.your_product.split(",")[0]), "product name");
    assert.match(t, new RegExp(`\\| \\*\\*Tone\\*\\* \\| ${args.tone} \\|`));
    assert.match(t, new RegExp(`\\| \\*\\*Segment\\*\\* \\| ${args.audience_segment} \\|`));
    // a full input set: nothing is reported missing
    assert.doesNotMatch(t, /Not given:/);
  });
}

test("newsletter draft: a figure keeps its exact form and its source label", async () => {
  const a = await call("newsletter_builder", A);
  assert.ok(a.includes("payment applications go out 30% faster (page claim)"));
  const b = await call("newsletter_builder", B);
  assert.ok(b.includes("done by hand (customer story headline)"));
});

test("newsletter draft: two companies of different kinds get drafts whose lines differ almost entirely", async () => {
  const a = longLines(await call("newsletter_builder", A));
  const b = longLines(await call("newsletter_builder", B));
  const shared = [...a].filter((l) => b.has(l));
  assert.ok(shared.length / Math.min(a.size, b.size) < 0.25, `overlap ${shared.length} of ${Math.min(a.size, b.size)}: ${shared.join(" | ")}`);
});

test("newsletter draft: the sector notes differ by kind of company", async () => {
  const a = await call("newsletter_builder", A);
  const b = await call("newsletter_builder", B);
  assert.match(a, /change order|RFI|job cost/i);
  assert.doesNotMatch(b, /change order|RFI\b|job cost/i);
  assert.notEqual(a.split("## Sector Notes")[1], b.split("## Sector Notes")[1]);
});

for (const type of ["educational", "product_update", "industry_news", "thought_leadership", "curated_links"]) {
  test(`newsletter draft (${type}): no outline wording, every key point written into a section`, async () => {
    const t = await call("newsletter_builder", { ...A, newsletter_type: type });
    checkClean(t, type);
    const draft = norm(t.slice(t.indexOf("**Subject:**"), t.indexOf("## Subject Lines")));
    for (const p of items(A.key_points)) assert.ok(draft.includes(norm(p).replace(/\s*\([^)]*\)\s*$/, "")), `${type}: ${p}`);
    const nSec = (t.match(/^### \d+\. /gm) || []).length;   // run 22 rewrite: the sections are grouped by what the points are, no longer one per point
    assert.ok(nSec >= 3 && nSec <= 6, `${nSec} sections`);
  });
}

test("newsletter draft: thin input says once what is missing and does not pad", async () => {
  const t = await call("newsletter_builder", { topic: "Fewer change order disputes on commercial building projects", cta_goal: "read the guide" });
  checkClean(t, "thin");
  // run 22 rewrite: what is missing is named once, at the end, with what each input would change
  assert.equal((t.match(/To sharpen this, give:/g) || []).length, 1, "one line that says what is missing");
  assert.match(t, /To sharpen this, give:[^\n]*key_points \(it would change/);
  assert.match(t, /To sharpen this, give:[^\n]*your_product \(it would change/);
  assert.match(t, /\*\*Subject:\*\*/);
  assert.match(t, /Button: Read the guide/);
});

test("newsletter draft: a figure with no source label is named once as needing a source", async () => {
  const t = await call("newsletter_builder", { topic: "Fewer change order disputes", cta_goal: "read the guide", key_points: "Payment applications go out 30% faster; Daily reports arrive on time" });
  assert.equal((t.match(/no source label/gi) || []).length, 1);
});
