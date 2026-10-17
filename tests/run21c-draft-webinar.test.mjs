// Run 21c (draft rewrite, test first): webinar_script returns a script built from the inputs (spoken lines per segment, a follow-up
// sequence written from the takeaways), not prompts and checklists. Two invented companies of different kinds.
// Run: npm run build && node --no-warnings --test tests/run21c-draft-webinar.test.mjs
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
  topic: "How general contractors can keep change orders from stalling payment",
  target_audience: "Project executives at commercial general contractors",
  webinar_type: "educational",
  duration: "45_min",
  key_takeaways: "Log every change order on one record the day it is raised; Tie each site photo to the drawing revision it shows; Send payment applications from the same record the field updates; Teams using it say payment applications go out 30% faster (page claim)",
  speakers: "Dana Ortiz, Head of Field Operations at Northbridge Builders; Lee Park, Product Lead at Girderly",
  include_polls: true,
  product_mention_level: "subtle",
  your_product: "Girderly, a construction management platform for general contractors",
};
const B = {
  topic: "Run sales and support chats from one inbox",
  target_audience: "Heads of customer operations at online retailers",
  webinar_type: "product_demo",
  duration: "60_min",
  key_takeaways: "See every chat channel in one shared inbox; Check a sender profile before the first message goes out; Get a message template approved without a manual back and forth; Customers answer chat faster than email (customer story headline)",
  speakers: "Mira Chen, Solutions Engineer at Pingdeck",
  include_polls: false,
  product_mention_level: "heavy",
  your_product: "Pingdeck, a business messaging platform with an API for chat apps",
};

const HEALTH = /\b(clinics?|patients?|hospitals?|healthcare|pharmac\w*|medical|physician|dental)\b/i;
const FILLER = [
  "I'm thrilled to have you here", "Good morning, afternoon or evening", "The good news? There is a better way", "Type a 1 in the chat", "Great question!", "Parking Lot Responses",
  "Pre-Webinar Checklist", "Tech Setup", "Keep them coming", "it is built to address", "Hold that thought", "the examples only help if you can compare", "Put those three parts together",
  "By now you've probably watched", "add it after the session", "Give the quick answer to the most asked question", "name not given", "two or three sentences of background",
  "Close unnecessary applications", "Professional background", "Water nearby", "Relevant slide", "SPEAKER PROMPT", "Explore angle", "Quiet space confirmed",
];
const norm = (s) => s.toLowerCase().replace(/\s+/g, " ");
const items = (s) => s.split(";").map((x) => x.trim());
const bare = (p) => norm(p).replace(/\s*\([^)]*\)\s*$/, "");
const longLines = (t) => new Set(t.split("\n").map((l) => l.trim()).filter((l) => l.length >= 30));

function checkClean(t, label) {
  assert.doesNotMatch(t, /\[[^\]\n]*\]/, `${label}: bracket placeholder`);
  assert.doesNotMatch(t, /\{[^}\n]*\}/, `${label}: brace placeholder`);
  assert.doesNotMatch(t, /your product|\bTBD\b|Insert|\bundefined\b|\bNaN\b/i, `${label}: placeholder word`);
  assert.doesNotMatch(t, /[–—]/, `${label}: dash`);
  assert.doesNotMatch(t, HEALTH, `${label}: healthcare word`);
  for (const f of FILLER) assert.ok(!t.toLowerCase().includes(f.toLowerCase()), `${label}: filler "${f}"`);
}

for (const [label, args] of [["A construction", A], ["B messaging", B]]) {
  test(`webinar script (${label}): spoken lines hold every input`, async () => {
    const t = await call("webinar_script", args);
    checkClean(t, label);
    const script = norm(t.slice(t.indexOf("## Full Script")));
    assert.ok(t.includes("## Full Script"));
    for (const p of items(args.key_takeaways)) assert.ok(script.includes(bare(p)), `${label}: takeaway in the script: ${p}`);
    for (const sp of items(args.speakers)) assert.ok(script.includes(norm(sp)), `${label}: speaker as typed in the script: ${sp}`);
    assert.ok(script.includes(norm(args.target_audience)) || script.includes(norm(args.target_audience.replace(/^.*? at /i, ""))), "audience in the script");
    assert.ok(norm(t).includes(norm(args.topic)));
    assert.ok(script.includes(args.your_product.split(",")[0].toLowerCase()), "product name in the script");
    assert.ok(script.includes(norm(args.your_product.split(",").slice(1).join(",").trim())), "the product description, in the user's words");
    assert.match(t, new RegExp(`${args.duration.replace("_min", "")} minutes`));
    assert.doesNotMatch(t, /Not given:/);
    // each segment of the run of show is written as spoken lines
    assert.ok((t.match(/\*\*SPEAKER:\*\*/g) || []).length >= 8, "spoken lines in most segments");
  });
}

test("webinar script: a takeaway figure keeps its exact form and its source label", async () => {
  const a = await call("webinar_script", A);
  assert.ok(a.includes("payment applications go out 30% faster (page claim)"));
  const b = await call("webinar_script", B);
  assert.ok(b.includes("faster than email (customer story headline)"));
});

test("webinar script: polls only when asked, with options; product mentions follow the level", async () => {
  const a = await call("webinar_script", A);
  assert.match(a, /Poll options:\n(- [^\n]+\n){3,}/);
  const b = await call("webinar_script", B);
  assert.doesNotMatch(b, /poll/i);
  const heavy = (b.slice(b.indexOf("## Full Script")).match(/Pingdeck/g) || []).length;
  const subtle = (a.slice(a.indexOf("## Full Script")).match(/Girderly/g) || []).length;
  assert.ok(heavy >= 5, `heavy mentions: ${heavy}`);
  const none = await call("webinar_script", { ...A, product_mention_level: "none" });
  assert.match(none, /your_product \(Girderly, a construction management platform for general contractors\) is not mentioned in the script because product_mention_level is none/);
  assert.ok(!none.slice(none.indexOf("## Full Script")).includes("Girderly") || /Dana Ortiz|Lee Park/.test(none), "speaker lines may carry the name as typed");
  assert.ok(subtle >= 1);
});

test("webinar script: two companies of different kinds get scripts whose lines differ almost entirely", async () => {
  const a = longLines(await call("webinar_script", A));
  const b = longLines(await call("webinar_script", B));
  const shared = [...a].filter((l) => b.has(l));
  assert.ok(shared.length / Math.min(a.size, b.size) < 0.25, `overlap ${shared.length} of ${Math.min(a.size, b.size)}: ${shared.slice(0, 12).join(" | ")}`);
});

for (const type of ["educational", "product_demo", "panel_discussion", "customer_story", "workshop", "ama"]) {
  test(`webinar script (${type}): no prompts or checklists, every takeaway spoken, speakers kept`, async () => {
    const t = await call("webinar_script", { ...A, webinar_type: type });
    checkClean(t, type);
    const script = norm(t.slice(t.indexOf("## Full Script")));
    for (const p of items(A.key_takeaways)) assert.ok(script.includes(bare(p)), `${type}: ${p}`);
    for (const sp of items(A.speakers)) assert.ok(script.includes(norm(sp)), `${type}: ${sp}`);
    assert.doesNotMatch(t, /ON SCREEN: Relevant slide/);
  });
}

test("webinar script: thin input says once what is missing and does not pad", async () => {
  const t = await call("webinar_script", { topic: "Keeping change orders from stalling payment", target_audience: "Project executives at general contractors", webinar_type: "panel_discussion" });
  checkClean(t, "thin");
  // run 22 rewrite: what is missing is named once, at the end, with what each input would change
  assert.equal((t.match(/To sharpen this, give:/g) || []).length, 1);
  assert.match(t, /To sharpen this, give:[^\n]*speakers \(it would change/);
  assert.match(t, /To sharpen this, give:[^\n]*key_takeaways \(it would change/);
  assert.match(t, /\*\*SPEAKER:\*\*/);
});
