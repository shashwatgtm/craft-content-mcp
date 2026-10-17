// Run 42B round S: lists typed with semicolons for the commas inside each item are read item by item; a newsletter never asks the
// same question twice; webinar agenda labels are whole phrases; the case study notes do not contradict The Results; the content
// improver names and fixes grammar and paste slips; sector objections end on their own way to settle; a story summary with a figure is a result.
// Run: npm run build && node --no-warnings --test tests/run42b-round-s.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { semicolonCommaList } from "../dist/list-shape.js";
import { parseProof } from "../dist/draft.js";
import { fixSlips } from "../dist/content-improver.js";
import { call } from "./run22-rw-helpers.mjs";

test("a semicolon-for-comma list is read one item per line, with its commas back", () => {
  const raw = "Teams juggle many tools; spreadsheets; email and chat, A study cites 384% ROI; payback in six months and 92;400 hours saved (page claims), One platform; where AI sees tasks; docs and chat";
  assert.equal(semicolonCommaList(raw), "Teams juggle many tools, spreadsheets, email and chat\nA study cites 384% ROI, payback in six months and 92,400 hours saved (page claims)\nOne platform, where AI sees tasks, docs and chat");
  // proof points keep the "; " separator, so a quote stays whole with its speaker
  assert.equal(semicolonCommaList("Jane Roe; Head of Ops; Acme: By building one flow; we cut rework., 40% of teams use it (page claim).", "semicolon"), "Jane Roe, Head of Ops, Acme: By building one flow, we cut rework.; 40% of teams use it (page claim).");
  // ordinary lists are left as typed
  for (const t of ["Faster close; fewer audit findings; one ledger", "Cut rework by 20%, Saved 3 hours a week", "Faster audits, Fewer errors; less rework across sites"]) assert.equal(semicolonCommaList(t), t);
});

test("tools keep a semicolon-typed quote whole with its speaker", async () => {
  const out = await call("thought_leadership_series", {
    topic: "running projects without status meetings",
    your_take: "Status meetings are a symptom of scattered work; one shared plan removes most of them",
    target_reader: "heads of operations",
    proof_points: "Jane Roe; Head of Operations; Acme Works: By putting every project in one plan; we stopped holding weekly status meetings., 40% fewer meetings in one quarter (customer claim).",
    num_articles: 3, article_type: "framework", your_sector: "saas"
  });
  assert.match(out, /By putting every project in one plan, we stopped holding weekly status meetings/);
  assert.doesNotMatch(out, /"By putting every project in one plan"/);
});

test("a newsletter never asks the same team question twice", async () => {
  const out = await call("newsletter_builder", {
    topic: "How finance teams can close the month faster",
    key_points: "Finance teams juggle many bank accounts; ERPs and spreadsheets; so reconciliation is slow, Close time down 5 days on average (page claims), Connects the banks; ERPs and tax systems already in use",
    cta_goal: "book a conversation about Acme Ledger", newsletter_type: "thought_leadership", your_sector: "fintech"
  });
  const qs = [...out.matchAll(/"([^"]+\?)"/g)].map((m) => m[1]);
  assert.equal(new Set(qs).size, qs.length, `a question repeats: ${qs.join(" | ")}`);
  assert.doesNotMatch(out, /^- (?:ERPs|spreadsheets)\b/m);
});

test("webinar agenda labels are whole phrases, never cut mid-phrase, and no line is said twice", async () => {
  const out = await call("webinar_script", {
    topic: "How operations leaders can cut rework in delivery programs",
    target_audience: "COO at insurance carriers",
    key_takeaways: "Rework comes from unclear handoffs between teams and vendors; and from changes made late, Customer headlines on the page: 30% less rework at a regional insurer; and faster audits at a broker (page claims), Domain and delivery expertise with an onshore and offshore model; delivery accelerators and a data framework",
    webinar_type: "educational", duration: "45_min", your_sector: "ites"
  });
  const agenda = out.split("\n").find((l) => /Here is how we will use the time/.test(l)) || "";
  assert.ok(agenda, "an agenda line");
  assert.doesNotMatch(agenda, /\b(?:the|a|an|of|to|and|with|for|before)\.\s/i, `agenda ends a part on a joining word: ${agenda}`);
  const parts = [...agenda.matchAll(/Parts? [^.]+ covers? ([^.]+)\./g)].map((m) => m[1]);
  assert.equal(new Set(parts).size, parts.length, `a part label repeats: ${agenda}`);
  assert.doesNotMatch(out, /You will see Domain/);
  assert.doesNotMatch(out, /"I am your host for this session\."/);
});

test("case study: listed quotes are not called missing, and company-wide counts are not the customer's figure", async () => {
  const out = await call("case_study_generator", {
    customer_name: "an Acme customer (freight forwarders)", customer_industry: "freight forwarders", your_product: "Acme Freight", mode: "full",
    challenge: "Operations run on fragmented systems with duplicated data",
    solution: "One platform for bookings, customs and invoices",
    results: "Jane Roe, CIO, Northwind Cargo: The platform is the backbone of our operations.; Over 1,000 organizations trust Acme Freight (page claim).",
    your_sector: "logistics_tech"
  });
  assert.doesNotMatch(out, /No customer_quote was given\. Ask for one line/);
  assert.match(out, /stay with the people who said them/);
  assert.doesNotMatch(out, /\*\*Your results:\*\* they carry a figure\./);
});

test("a story summary with a before and after figure is a result; a news item is never a result", () => {
  const [a, b, c] = parseProof("A school district upgraded bandwidth from 1.25 Gbps to 5 Gbps across 34 buildings (page claim, customer story summary); Acme launched a new defense platform on 1 May (page news item); How Northwind scaled support (page case study headline)");
  assert.equal(a.kind, "result");
  assert.equal(b.kind, "claim");
  assert.equal(c.kind, "title");
});

test("content improver: capital articles, sentences pasted after 'deal with' and stray full stops are named and fixed", () => {
  const { text, slips } = fixSlips("Teams at carriers often deal with Customers want lower latency and simpler connectivity.\nAcme Voice is An AI-native voice platform.\nJane Roe, CIO: It works., Next line..\nAcme is Acme for teams.");
  assert.match(text, /often find that customers want lower latency/);
  assert.match(text, /is an AI-native voice platform/);
  assert.match(text, /It works, Next line\./);
  assert.ok(slips.some((s) => /said twice/.test(s.note) && s.after === null));
  assert.ok(slips.length >= 4);
  // clean text has no slips
  assert.equal(fixSlips("Teams at carriers often deal with dropped calls. Acme is a voice platform.").slips.length, 0);
});

test("content improver report lists the slips and the improved version carries the fixes", async () => {
  const out = await call("craft_content_improver", {
    content: "Subject: Quick question about latency\nHi,\nTeams at carriers often deal with Customers want lower latency and simpler connectivity.\nAcme Voice is An AI-native voice platform for carriers.\nWould you be open to a 20-minute call next week?\nThanks,\nThe Acme team",
    content_type: "sales_email", audience: "Head of Network at carriers", your_sector: "telecom"
  });
  assert.match(out, /### Grammar and Paste Slips/);
  const improved = out.slice(out.indexOf("## Improved Version"));
  assert.match(improved, /often find that customers want lower latency/);
  assert.doesNotMatch(improved, /is An AI-native/);
});

test("sales kit: a sector objection ends on the sector's own way to settle it, so scripts differ", async () => {
  const out = await call("sales_enablement_content", {
    product: "Acme Build, construction estimating and project management software for residential builders",
    target_persona: "Owner of a residential building firm",
    proof_points: "Jane Roe, Roe Homes: Now everything is in one place and managing projects is easier.",
    value_props: "Faster estimates; fewer missed change orders",
    sales_stage: "discovery", your_sector: "vertical_saas"
  });
  const scripts = [...out.matchAll(/^> "I hear you:.*$/gm)].map((m) => m[0]);
  assert.ok(scripts.length >= 2);
  const closes = scripts.map((s) => s.slice(s.lastIndexOf("?", s.length - 2) + 1));
  assert.ok(new Set(scripts.map((s) => s.replace(/^> "I hear you: '[^']*'\. /, "").replace(/'[^']*'/g, "''"))).size === scripts.length, "every script is its own");
  assert.ok(closes.length > 0);
});
