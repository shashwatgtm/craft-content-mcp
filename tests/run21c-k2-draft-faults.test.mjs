// run 21c second pass (k2): faults the fresh judges named in the thought_leadership_series and content_repurposer drafts, as tests with invented companies.
// Faults: articles that repeat one take paragraph and the same headings; measures attached that the proof does not move; garbled articles
// ("One of a ... companies", "an unique", "an US"); a partner statement shown as a customer quote; a product list cut mid phrase; no quote cards;
// "the world's first" going out as plain fact; odd hashtags; "(page words)" left in public copy; a generic email subject.
// Every figure is hypothetical. Run: npm run build && node --no-warnings --test tests/run21c-k2-draft-faults.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  assert.ok(!j.result.isError, j.result.content[0].text.slice(0, 200));
  return j.result.content.map((c) => c.text).join("\n");
};
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9$%]+/g, " ").trim();

// a one-part take (as a long features sentence), as real pages give
const TL = {
  topic: "construction management software for general contractors",
  your_take: "Slabwise's view on construction management software: a unique approach that posts every change order to the job budget the day it is signed, plus an exclusive partner role with an accounting vendor, built as the world's first field to ledger platform",
  target_reader: "Fortune 500 general contractors (the about page calls Slabwise a trusted partner of Fortune 500 firms)",
  proof_points: "One of the world's largest steel fabricators: a Slabwise rollout resulted in 12 days saved on every change order (case study on the page), CIO of an US builder: a job cost view was needed within 60 days and the team came through (customer quote), Accounting vendor's VP thanks Slabwise as a launch partner for its ledger connector (partner quote), Named a Leader in the 2026 Example Analyst Wave for construction software",
  author_background: "Slabwise team (construction management software)",
  num_articles: 3,
  article_type: "framework",
};

test("thought leadership k2: three articles do not repeat one take paragraph or the same section headings", async () => {
  const t = await call("thought_leadership_series", TL);
  const arts = t.split(/\n## Article \d of 3/).slice(1).map((a) => a.split(/\n## (?:Promotional Posts|Sector Notes)/)[0]);
  assert.equal(arts.length, 3);
  const paras = arts.map((a) => new Set(a.split("\n").filter((l) => l.length >= 80 && !/^\*By|^\*\*|^#/.test(l)).map(norm)));
  for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) {
    const same = [...paras[i]].filter((l) => paras[j].has(l));
    assert.equal(same.length, 0, `articles ${i + 1} and ${j + 1} repeat: ${same[0]}`);
  }
  const heads = arts.flatMap((a) => a.split("\n").filter((l) => /^### /.test(l)));
  assert.ok(new Set(heads).size >= heads.length - 1, `headings repeat: ${heads.join(" | ")}`);
  const take = "plus an exclusive partner role with an accounting vendor";
  assert.ok(arts.filter((a) => norm(a).includes(norm(take))).length <= 1, "the long take opens one article only");
});

test("thought leadership k2: no measure is attached to proof or a take that does not share its words", async () => {
  const t = await call("thought_leadership_series", TL);
  assert.doesNotMatch(t, /It bears on|The answer shows up in|The measure that fits/);
  const t2 = await call("thought_leadership_series", { topic: "construction management software for general contractors", your_take: "Quiet crews finish earlier", target_reader: "Heads of operations at general contractors", num_articles: 3 });
  assert.doesNotMatch(t2, /read it against|Measure it on|Two measures show/);
});

test("thought leadership k2: grammar after a claim is taken out and article choice", async () => {
  const t = await call("thought_leadership_series", TL);
  assert.doesNotMatch(t, /\bone of an? (?:steel|\w+ \w+) fabricators/i);
  assert.match(t, /One of the steel fabricators/);
  assert.doesNotMatch(t, /\ban unique\b|\ban US\b/i);
  assert.match(t, /\ba unique approach/);
  assert.match(t, /\ba US builder/);
  assert.match(t, /\ban exclusive partner role/);
  assert.doesNotMatch(t.split("\n").filter((l) => !/^\*\*Claims to source/.test(l)).join("\n"), /\bworld's (?:first|largest)\b/i);
  const cl = t.split("\n").find((l) => /^\*\*Claims to source/.test(l));
  assert.equal((cl.match(/world's first/g) || []).length, 1, "each claim is named once: " + cl);
  assert.match(t, /Claims to source before you publish/);
});

test("thought leadership k2: a partner statement is not shown as a customer quote or used as lead proof", async () => {
  const t = await call("thought_leadership_series", TL);
  assert.doesNotMatch(t, /A customer[^\n]*launch partner/);
  for (const m of t.matchAll(/\*\*Lead proof point:\*\* ([^\n]+)/g)) assert.doesNotMatch(m[1], /partner quote/);
  assert.match(t, /Credibility line\*\* \([^)]*partner[^)]*\)[^\n]*launch partner/);
});

test("thought leadership k2: a customer quote typed without quotation marks is shown with the speaker named, not as 'A customer says: CIO of ...'", async () => {
  const t = await call("thought_leadership_series", TL);
  assert.doesNotMatch(t, /A customer says: CIO/);
  assert.match(t, /CIO of a US builder[^\n]*"A job cost view was needed within 60 days and the team came through"/);
});

test("thought leadership k2: hashtags are the brand and real terms, not one common word or a run-together phrase", async () => {
  const t = await call("thought_leadership_series", { ...TL, proof_points: "Carrier delays fell by 10% at one site (hypothetical figure)", your_take: "Slabwise: carrier delays belong in the budget", topic: "freight and logistics software for carriers" });
  const tags = (t.match(/#[A-Za-z0-9]+/g) || []);
  for (const g of tags) { assert.ok(g.length <= 24, g); assert.notEqual(g.toLowerCase(), "#carrier"); }
});

const SRC = `Why a late change order costs a general contractor a month
Slabwise is a construction management platform, described as the world's first field to ledger system. Most controllers at general contractors rebuild the budget from field notes at month end.
At Slabwise we built change order posting around this: a mobile app for the field, approval routing, job cost sync, pay application drafts, lien waiver tracking, RFI and submittal logs, daily reports, punch lists, and an open approach that plugs into ERP, payroll, estimating or document systems from other vendors.
The company is backed by an investor group, the world's largest builder of its kind, with engineers who train themselves out so the customer team owns the system (page words).
Proof: Customer quote: expanded from 500 to 4,000 jobs while improving margin by 24% in under six months; Customer quote: launched Slabwise on 24 of our jobsites in less than two months; Accounting vendor's VP thanks Slabwise as a launch partner (partner quote); Named a Leader in the 2026 Example Analyst Wave (analyst report)`;
const CR = { source_content: SRC, source_type: "blog_post", key_message: "Slabwise: post every change order to the budget the day it is signed, keep field and ledger on one system, and let the controller see the same number as the superintendent" };

test("content repurposer k2: a long product list is never cut mid phrase in the post, the email or the thread", async () => {
  const t = await call("content_repurposer", CR);
  assert.doesNotMatch(t, /\.\.\.\s*$/m);
  const listEnd = "plugs into ERP, payroll, estimating or document systems from other vendors";
  const li = t.split("### LinkedIn Post")[1].split("### Twitter")[0];
  const em = t.split("### Email Version")[1].split("### Blog")[0];
  assert.ok(norm(li).includes(norm(listEnd)) && norm(em).includes(norm(listEnd)), "the whole list is in the post and the email");
  const th = t.split("### Twitter/X Thread")[1].split("### Email")[0];
  for (const w of th.split("**Tweet ").slice(1)) assert.ok(w.split("\n").slice(1).join("\n").split("\n\n")[0].length <= 290);
  assert.ok(norm(th).includes(norm("document systems from other vendors")), "the end of the list is in the thread");
});

test("content repurposer k2: quote cards are made from customer quotes typed without quotation marks, and a partner statement is no card", async () => {
  const t = await call("content_repurposer", CR);
  const cards = t.split("### Quote Cards")[1].split("\n### ")[0].split("\n## ")[0];
  assert.match(cards, /Expanded from 500 to 4,000 jobs/i);
  assert.match(cards, /launched Slabwise on 24 of our jobsites/i);
  assert.doesNotMatch(cards, /launch partner/);
  assert.doesNotMatch(cards, /No sentence of 180 characters/);
});

test("content repurposer k2: 'world's first' and 'world's largest' do not go out as plain fact, and the claims are named once", async () => {
  const t = await call("content_repurposer", CR);
  const body = t.split("## Source Notes")[0].split("\n").filter((l) => !/^\*\*Claims to source/.test(l)).join("\n");
  assert.doesNotMatch(body, /\bworld's (?:first|largest)\b/i);
  assert.match(t, /Claims to source before you publish/);
  assert.equal((t.match(/Claims to source before you publish/g) || []).length, 1);
  assert.doesNotMatch(t, /\ba investor\b|\ban a\b/);
});

test("content repurposer k2: hashtags are short real terms, and a label without a figure is not left in public copy", async () => {
  const t = await call("content_repurposer", CR);
  const tags = t.match(/#[A-Za-z0-9]+/g) || [];
  for (const g of tags) { assert.ok(g.length <= 24, g); assert.ok(!/^#(?:Carrier|Shipment|Exception)$/i.test(g), g); }
  const li = t.split("### LinkedIn Post")[1].split("### Twitter")[0];
  assert.doesNotMatch(li, /\(page words\)/);
});

test("content repurposer k2: the email subject is a real clause of the title or key message, not a generic fallback", async () => {
  const t = await call("content_repurposer", { ...CR, source_content: SRC.replace("Why a late change order costs a general contractor a month\n", "") });
  const subj = (t.match(/^Subject: (.+)$/m) || [])[1] || "";
  assert.ok(subj.length >= 20 && subj.length <= 75, subj);
  assert.doesNotMatch(subj, /A short blog post summary|\b(?:and|the|of|to|a|that|from|with)$/i);
  assert.match(subj, /Slabwise/);
});
