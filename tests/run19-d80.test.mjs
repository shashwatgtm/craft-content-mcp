// Run 19 R19-35 (owner decision D80): the 8 problems of the real-world test, fixed in every CRAFT Content tool.
// Written before the fixes (B43); every test here failed on the head before the fixes (06591a1, the run19-after-review start plus the two run18-ws commits).
// Companies are the invented ones of the run 19 examples (Shelfwalk, Answerloop, Cloudmoat, Spendrill, Lanehop, Branchwire,
// Example Logistics Co, Example Manufacturing Co, Example IT Services Co, Example Food Delivery Co). Real companies are tested
// only in the private project repo (rule B81).
// Run: npm run build && node --test tests/run19-d80.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const rpc = async (method, params) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  }));
  return r.json();
};
const call = async (name, args) => {
  const j = await rpc("tools/call", { name, arguments: args });
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
};
const B75 = /\b(clinics?|patients?|hospitals?|healthcare|hipaa|ehr|appointments?|no-shows?|dental|physio\w*|ExampleCo|Example Co|Acme Notes|Clausewise|ClinicFlow|legal tech)\b/i;
const PROMISES = /guaranteed|price protection|no long-term commitment/i;
const SAAS_ONLY = /\b(MRR|free trial|freemium|self-serve sign-?up|per seat|seats?|aha moment)\b/i;
// an unfilled marker where the matching input was given ("[Your name]" is the one signature slot no input fills)
const UNFILLED = /\[Your (?!name\])|\[Insert|\{\{|\bundefined\b|\bNaN\b|XX%|Lorem ipsum|\bTBD\b/;

// The shared assertions of the brief: the answer names the company, prints no B75 word, has no unfilled marker, no invented
// promise and, for a business that is not a software subscription, no SaaS-only term.
function shared(text, { names = [], sector, saas = true, label = "" } = {}) {
  for (const n of names) assert.ok(text.includes(n), `${label}: names ${n}`);
  assert.doesNotMatch(text, B75, `${label}: B75 word`);
  assert.doesNotMatch(text, PROMISES, `${label}: invented promise`);
  assert.doesNotMatch(text, UNFILLED, `${label}: unfilled marker`);
  if (!saas) assert.doesNotMatch(text, SAAS_ONLY, `${label}: SaaS-only term`);
  if (sector) assert.match(text, sector, `${label}: a sector word the input did not supply`);
  assert.doesNotMatch(text, /—|–/, `${label}: em or en dash`);
}

// ---- the invented companies of examples-new.json ----
const ANSWERLOOP_CASE = {
  customer_name: "Example Food Delivery Co", your_product: "Answerloop", customer_industry: "Food delivery", mode: "full",
  challenge: "A ticket backlog growing faster than the support team could hire",
  solution: "AI agents that resolve refund and order-status tickets inside the help desk, with human approval for refunds, powered by an LLM with guardrails",
  results: "45% of tickets resolved without a human in 60 days; first response time down from 6 hours to 2 minutes",
  customer_quote: "We picked Answerloop because the agents act inside our help desk and a person still approves every refund, so our team trusts it.",
};
const AI_SECTOR = /resolution rate|human in the loop|guardrails|evaluation set|escalation rate|hallucination/i;

// ---- Problem 1: no clinic or dummy-company word in the tool code or in tools/list ----
test("problem 1: no clinic or dummy-company word in src/ or in tools/list", async () => {
  for (const f of readdirSync(new URL("../src/", import.meta.url)).filter((x) => x.endsWith(".ts"))) {
    assert.doesNotMatch(readFileSync(new URL("../src/" + f, import.meta.url), "utf8"), B75, f);
  }
  const tl = await rpc("tools/list", {});
  assert.doesNotMatch(JSON.stringify(tl.result.tools), B75);
});

test("one data file: src/verticals.ts is shared and the nine verticals are in it", async () => {
  const v = await import("../dist/verticals.js");
  assert.equal(v.VERTICALS.length, 9);
  assert.deepEqual(v.VERTICALS.map((x) => x.id).sort(), ["ai-native", "cybersecurity", "fintech", "ites", "logistics-tech", "saas", "software", "telecom", "vertical-saas"]);
  assert.match(readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8"), /"rewriteRelativeImportExtensions": true/);
  assert.equal(v.detectModel("services", "managed SD-WAN").model, "services"); // the input wins over the text
  assert.equal(v.detectModel(undefined, "managed SD-WAN for branches").model, "connectivity");
});

// ---- tools/list: the new optional inputs ----
test("tools/list: new optional inputs business_model and your_product exist and are not required", async () => {
  const tools = (await rpc("tools/list", {})).result.tools;
  const by = Object.fromEntries(tools.map((t) => [t.name, t.inputSchema]));
  for (const t of ["case_study_generator", "webinar_script", "testimonial_capture", "sales_enablement_content"]) {
    assert.deepEqual(by[t].properties.business_model.enum, ["saas", "services", "connectivity", "transactions", "marketplace", "hardware_software", "investment"], t);
    assert.ok(!by[t].required.includes("business_model"));
  }
  for (const t of ["newsletter_builder", "webinar_script", "testimonial_capture"]) {
    assert.equal(by[t].properties.your_product.type, "string", t);
    assert.ok(!by[t].required.includes("your_product"));
  }
  const bad = await call("webinar_script", { topic: "x", target_audience: "y", webinar_type: "educational", business_model: "banana" });
  assert.equal(bad.isError, true);
  assert.match(bad.text, /business_model must be one of/);
});

// ---- case_study_generator ----
test("case_study_generator: every result kept, the whole quote and challenge, no 'aha moment', no invented subscriber count", async () => {
  const r = await call("case_study_generator", ANSWERLOOP_CASE);
  assert.equal(r.isError, false);
  shared(r.text, { names: ["Answerloop", "Example Food Delivery Co"], sector: AI_SECTOR, label: "case study" });
  assert.match(r.text, /^- 45% of tickets resolved without a human in 60 days/m);
  assert.match(r.text, /^- First response time down from 6 hours to 2 minutes/m);
  assert.ok(r.text.includes(ANSWERLOOP_CASE.customer_quote), "the whole quote");
  assert.ok(!/so our team trusts it\.?\.\.\./.test(r.text) && !/human a\.\.\./.test(r.text), "no quote cut");
  assert.ok(r.text.includes("A ticket backlog growing faster than the support team could hire"), "the whole challenge");
  assert.doesNotMatch(r.text, /could hire\.\.\./);
  assert.doesNotMatch(r.text, /aha moment|50,000/i);
  assert.doesNotMatch(r.text, /Increased visibility for/);
});

test("case_study_generator: interview_notes given with all three facts is named as not used, with the reason", async () => {
  const r = await call("case_study_generator", { ...ANSWERLOOP_CASE, interview_notes: "The CTO said refunds were the slowest part. We started in March." });
  assert.match(r.text, /interview_notes was not used/i);
  assert.match(r.text, /because you gave the challenge, the solution and the results/i);
});

test("case_study_generator: discovery kit for a connectivity business follows the business model, no 'aha moment'", async () => {
  const r = await call("case_study_generator", { customer_name: "Example Manufacturing Co", your_product: "Branchwire managed SD-WAN", customer_industry: "Manufacturing", mode: "discovery", business_model: "connectivity" });
  shared(r.text, { names: ["Branchwire managed SD-WAN"], sector: /uptime|latency|cut-over|site survey|mean time to repair/i, saas: false, label: "discovery" });
  assert.doesNotMatch(r.text, /aha moment/i);
});

test("case_study_generator: a missing industry and a short quote are handled in the customer's own words", async () => {
  const r = await call("case_study_generator", { customer_name: "Example IT Services Co", your_product: "Lanehop", mode: "full", challenge: "Dispatchers re-plan routes by hand", solution: "Live re-routing", results: "Cost per delivery down 12% in a quarter", customer_quote: "It saved our mornings." });
  assert.match(r.text, /It saved our mornings\./);
  assert.match(r.text, /\*\*Industry\*\* \| not given \(add customer_industry\)/);
});

// ---- newsletter_builder ----
test("newsletter_builder: the full topic in grammar-safe subject lines, no invented statistic, the user's own call to action as the button", async () => {
  const r = await call("newsletter_builder", { topic: "AI agents in customer support", key_points: "How an LLM is evaluated before go-live, Why a person approves every refund", cta_goal: "register for our support automation webinar", audience_segment: "practitioners", newsletter_type: "educational", tone: "conversational", your_product: "Answerloop" });
  assert.equal(r.isError, false);
  shared(r.text, { names: ["Answerloop"], sector: AI_SECTOR, label: "newsletter" });
  const subjects = r.text.split("## Subject Lines")[1].split("## Opening Hooks")[0].split("\n").filter((l) => l.startsWith("**"));
  assert.equal(subjects.length, 4);
  for (const s of subjects) assert.match(s, /AI agents in customer support/i, s);
  assert.doesNotMatch(r.text, /Why AI agents is|AI agents is broken/);
  assert.doesNotMatch(r.text, /78%/);
  assert.match(r.text, /Button: Register for our support automation webinar/i);   // run 21c: draft rewrite (the button is a plain line, no bracket placeholder)
  assert.doesNotMatch(r.text, /15-minute demo|No pressure/);
});

test("newsletter_builder: a topic that is a clause is never pasted into a verb slot", async () => {
  const r = await call("newsletter_builder", { topic: "How heads of logistics at 3PLs are tackling failed first-attempt deliveries", cta_goal: "book a 20-minute call", newsletter_type: "thought_leadership", audience_segment: "executives", your_product: "Lanehop" });
  assert.doesNotMatch(r.text, /Why how|how heads is|is broken/i);
  assert.match(r.text, /book a 20-minute call/i);
  assert.doesNotMatch(r.text, /15-minute demo/);
  shared(r.text, { names: ["Lanehop"], sector: /dispatch|fleet|last-mile|proof of delivery|cost per delivery|shipment|carrier|consignment|on time delivery/i, label: "newsletter 2" });
});

test("newsletter_builder: a topic of up to 90 characters is used whole in every subject line, never clipped to three words", async () => {
  const topic = "Month-end close without spreadsheets for finance controllers at mid-size manufacturers";
  const long = await call("newsletter_builder", { topic, cta_goal: "reply with your biggest close problem", newsletter_type: "educational" });
  const subjects = long.text.split("## Subject Lines")[1].split("## Opening Hooks")[0].split("\n").filter((l) => l.startsWith("**"));
  assert.equal(subjects.length, 4);
  for (const s of subjects) assert.ok(s.toLowerCase().includes(topic.toLowerCase()), s);
});

// ---- webinar_script ----
test("webinar_script: speakers are listed as typed, never pasted after 'I'm'; polls carry options; product named; the recording promise is conditional", async () => {
  const r = await call("webinar_script", { topic: "AI agents that resolve support tickets safely", target_audience: "Support leaders at consumer apps and SaaS companies", webinar_type: "educational", duration: "45_min", product_mention_level: "subtle", key_takeaways: "How an LLM is evaluated before go-live, Why a person approves every refund, What to measure after launch",
    speakers: "Head of Support Operations from a customer, Head of Marketing at Answerloop", your_product: "Answerloop", include_polls: true });
  assert.equal(r.isError, false);
  shared(r.text, { names: ["Answerloop", "Head of Support Operations from a customer", "Head of Marketing at Answerloop"], sector: AI_SECTOR, label: "webinar" });
  assert.doesNotMatch(r.text, /I'm Head of|I'm \[?Speaker/);
  assert.match(r.text, /Poll options:\n(- [^\n]+\n){3,}/);
  // run 21c: draft rewrite (the subtle product line is the user's own description; the recording line is one stage direction, conditional)
  assert.doesNotMatch(r.text, /hosted by/i); // run 21c round 3: a name with no description gives no product line (no invented host)
  assert.doesNotMatch(r.text, /^- We're recording today's session/m);
  assert.match(r.text, /add the line "This session is recorded and the link will follow" only if you record it/i);
  assert.doesNotMatch(r.text, /free trial|plans or trial/i);
});

test("webinar_script: product_mention_level none leaves the product out and says why it is not used", async () => {
  const r = await call("webinar_script", { topic: "Month-end close and expense reconciliation", target_audience: "Finance controllers at mid-size manufacturers", webinar_type: "product_demo", your_product: "Spendrill", product_mention_level: "none", business_model: "saas" });
  assert.match(r.text, /your_product \(Spendrill\) is not mentioned in the script because product_mention_level is none/i);
  shared(r.text, { sector: /reconciliation|month-end close|ERP posting|audit trail/i, label: "webinar none" });
});

test("webinar_script: a customer story and a panel keep every speaker; content blocks carry sector content", async () => {
  const r = await call("webinar_script", { topic: "Fewer failed first-attempt deliveries", target_audience: "Heads of last-mile operations at 3PLs", webinar_type: "panel_discussion", duration: "60_min", speakers: "Asha Rao, Head of Operations at Example Logistics Co; Ben Ito, Fleet Manager at Example Logistics Co", your_product: "Lanehop" });
  assert.match(r.text, /Asha Rao, Head of Operations at Example Logistics Co/);
  assert.match(r.text, /Ben Ito, Fleet Manager at Example Logistics Co/);
  shared(r.text, { names: ["Lanehop"], sector: /cost per delivery|dispatch|fleet|proof of delivery|3PL/i, label: "panel" });
});

// ---- content_repurposer ----
const SHELFWALK_SOURCE = `Why consumer goods buyers are changing how they decide.
Over the last year we spoke with more than 60 heads of sales operations at consumer goods brands. Three things came up again and again.
First, thin secondary sales visibility is now a board-level topic, not a field detail.
Second, buyers no longer accept long rollouts: they expect to see value inside one quarter.
Third, they compare every vendor with doing nothing, which is often spreadsheets and distributor reports.
At Shelfwalk we built a field sales app around these three facts: it captures orders offline and suggests the next order for each outlet.
The result for one customer: secondary sales up 12% in two quarters.
If you lead sales operations, start by measuring secondary sales every week; most teams cannot today.`;

test("content_repurposer: whole sentences in source order, the product and the findings kept, quote cards never cut", async () => {
  const r = await call("content_repurposer", { source_content: SHELFWALK_SOURCE, source_type: "blog_post", brand_voice: "bold", key_message: "Secondary sales visibility can be fixed inside one quarter" });
  assert.equal(r.isError, false);
  shared(r.text, { names: ["Shelfwalk"], sector: /productive calls|lines per call|outlet coverage|strike rate|beat plan/i, label: "repurposer" });
  const kp = r.text.split("### Key Points Extracted")[1].split("---")[0];
  const items = kp.split("\n").filter((l) => /^\d+\. /.test(l)).map((l) => l.replace(/^\d+\. /, ""));
  assert.ok(items.length >= 4 && items.length <= 5, "four or five key points: " + items.length);
  const pos = items.map((s) => SHELFWALK_SOURCE.indexOf(s));
  assert.ok(pos.every((p) => p >= 0), "every key point is a whole sentence of the source: " + JSON.stringify(items));
  assert.deepEqual([...pos].sort((a, b) => a - b), pos, "source order");
  assert.ok(items.some((s) => /At Shelfwalk we built/.test(s)), "the product sentence");
  assert.ok(items.some((s) => /thin secondary sales visibility/.test(s)) && items.some((s) => /long rollouts/.test(s)) && items.some((s) => /doing nothing/.test(s)), "the findings");
  assert.ok(items.some((s) => /secondary sales up 12%/.test(s)), "the result sentence");
  const li = r.text.split("### LinkedIn Post")[1].split("---")[1];
  assert.match(li.trim(), /^Why consumer goods buyers are changing how they decide/);
  for (const card of r.text.split("**Quote Card ").slice(1)) assert.doesNotMatch(card.split("- Background")[0], /\.\.\./);
  assert.doesNotMatch(r.text, /#Changing|#Buyers/);
  assert.match(r.text, /Brand voice \(bold\)/);
  assert.match(r.text, /Audience Notes/);
});

test("content_repurposer: a decimal figure does not end a sentence and an unknown format is named", async () => {
  const r = await call("content_repurposer", { source_content: "Spend control starts at the card. Churn fell to 1.5% monthly after the change. Finance controllers close the books in 7 days.", source_type: "blog_post", target_formats: "linkedin_post, hologram_card" });
  assert.match(r.text, /Churn fell to 1\.5% monthly after the change/);
  assert.match(r.text, /hologram card is not a format this tool writes/i);
});

// ---- thought_leadership_series ----
test("thought_leadership_series: three different articles, every proof point used, the take quoted and never pasted, no unfilled headline, no named outlets", async () => {
  const take = "Most sales heads buy for features; the ones who win buy for secondary sales growth of 12%";
  const r = await call("thought_leadership_series", { topic: "consumer goods field sales", your_take: take, target_reader: "Sales heads at consumer goods brands", proof_points: "Secondary sales up 12% at a regional brand, Offline order capture live in three weeks, Rep adoption measured weekly in one region", author_background: "Head of Marketing at Shelfwalk, 12 years in field sales software", num_articles: 3, article_type: "contrarian" });
  assert.equal(r.isError, false);
  shared(r.text, { names: ["Shelfwalk"], sector: /productive calls|lines per call|outlet coverage|strike rate|beat plan|general trade/i, label: "thought leadership" });
  const arts = r.text.split(/\n## Article \d of 3/).slice(1).map((a) => a.split("## Promotional Posts")[0]);
  assert.equal(arts.length, 3);
  const lines = (a) => new Set(a.split("\n").map((l) => l.trim()).filter((l) => l.length > 25));
  for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) {
    const A = lines(arts[i]), B = lines(arts[j]);
    const shared_ = [...A].filter((l) => B.has(l)).length;
    assert.ok(shared_ / Math.min(A.size, B.size) < 0.4, `articles ${i + 1} and ${j + 1} share ${shared_} of ${Math.min(A.size, B.size)} lines`);
  }
  for (const p of ["Secondary sales up 12% at a regional brand", "Offline order capture live in three weeks", "Rep adoption measured weekly in one region"]) assert.ok(r.text.includes(p), p);
  // run 21c: draft rewrite. The take is printed whole once, in the overview; the articles open with its parts as the author's own sentences.
  assert.ok(r.text.includes(take), "the take is printed whole");
  // run 21c: draft rewrite. The part of the take after the semicolon is now its own whole sentence ("The ones who win buy ..."); it must still never be joined into a sentence of ours.
  assert.doesNotMatch(r.text, /accept that most|Let me tell you about|buy for for|(?<!The ones who )win buy for secondary sales growth of 12%\./);
  assert.doesNotMatch(r.text, /\[Common Practice\]|\[Topic\]|\[Name\]|\[X Years\]|\[Number\]|\[Year\]/);
  assert.doesNotMatch(r.text, /Forbes|Entrepreneur|Harvard|Word Count: ~750/);
  // run 21c: draft rewrite. Each article states the length of the draft it is, not a target.
  assert.match(r.text, /Draft length:\*\* about \d+ words/);
});

test("thought_leadership_series: without proof points the drafts name suggested evidence and the sector's proof shape", async () => {
  const r = await call("thought_leadership_series", { topic: "managed SD-WAN for branch networks", your_take: "Branch uptime is bought, not hoped for", target_reader: "Heads of IT infrastructure at companies with many branches", num_articles: 1, article_type: "how_to" });
  shared(r.text, { sector: /uptime|mean time to repair|cost per site|wave plan|site survey/i, label: "thought leadership 2" });
  // run 21c: draft rewrite. The generic list of proof to gather is gone; the missing proof is named once, with the sector's proof shape.
  assert.match(r.text, /Not given: proof_points/);
});

// ---- testimonial_capture ----
test("testimonial_capture: the product is used, role and sector questions are added, no 'aha moment'", async () => {
  const r = await call("testimonial_capture", { customer_name: "Sam Example (fictional)", customer_company: "Example Food Delivery Co", success_story: "Answerloop AI agents, running on an LLM with guardrails, resolved 45% of support tickets without a human in 60 days", testimonial_type: "video_interview", customer_role: "Head of Support Operations", relationship_context: "customer for 18 months, renewed last quarter", use_case: "website and sales deck", your_product: "Answerloop" });
  assert.equal(r.isError, false);
  shared(r.text, { names: ["Answerloop", "Example Food Delivery Co", "Sam Example (fictional)"], sector: AI_SECTOR, label: "testimonial" });
  assert.doesNotMatch(r.text, /\[Product\]|aha moment/i);
  assert.match(r.text, /### Questions for this role \(Head of Support Operations\)/);
  assert.match(r.text, /customer for 18 months, renewed last quarter/);
  assert.match(r.text, /Who at Example Food Delivery Co needs to approve/);
});

test("testimonial_capture: a review-site request for a connectivity business is named as a poor fit and the matrix has no review-site row", async () => {
  const r = await call("testimonial_capture", { customer_name: "Priya Example (fictional)", customer_company: "Example Manufacturing Co", success_story: "All 40 plant sites moved to one partner with fewer outages", testimonial_type: "g2_review", customer_role: "Head of IT Infrastructure", your_product: "Branchwire", business_model: "connectivity" });
  shared(r.text, { names: ["Branchwire"], sector: /uptime|mean time to repair|latency|cut-over|site survey/i, saas: false, label: "testimonial 2" });
  assert.match(r.text, /review sites suit software/i);
  assert.doesNotMatch(r.text, /\| G2\/Review site/);
});

test("testimonial_capture: without your_product the answer says so instead of printing [Product] everywhere", async () => {
  const r = await call("testimonial_capture", { customer_name: "Lee Example (fictional)", customer_company: "Example IT Services Co", success_story: "Service desk SLA attainment rose in one quarter", testimonial_type: "written_quote" });
  assert.match(r.text, /your_product was not given/i);
  assert.doesNotMatch(r.text, /\[Product\]/);
});

// ---- sales_enablement_content ----
const SALES = { product: "Answerloop, AI agents (built on an LLM) that resolve customer support tickets inside the help desk", target_persona: "VPs of Customer Support at consumer apps", proof_points: "45% of tickets resolved without a human at Example Food Delivery Co, Live in two weeks, A person approves every refund", common_objections: "Setup will take too long, Our agents will make mistakes with refunds, Too expensive for our margins", value_props: "Resolve tickets end to end, Human approval for refunds", competitor_objections: "Why not the AI add-on in our help desk, Why not build on a model API ourselves", price_context: "Mid-market", sales_stage: "discovery" };
test("sales_enablement_content: three objections get three different answers; the implementation objection uses the supplied 'Live in two weeks'", async () => {
  const r = await call("sales_enablement_content", SALES);
  assert.equal(r.isError, false);
  shared(r.text, { names: ["Answerloop"], sector: AI_SECTOR, label: "sales" });
  const blocks = r.text.split("### Objection ").slice(1, 4);
  assert.equal(blocks.length, 3);
  const scripts = blocks.map((b) => (b.match(/\*\*Full Response Script:\*\*\n> "([^\n]*)"/) || [])[1]);
  assert.ok(scripts.every(Boolean), "scripts found");
  assert.equal(new Set(scripts).size, 3, "three different scripts");
  assert.match(blocks[0], /Live in two weeks/);
  assert.match(blocks[1], /A person approves every refund/);
  assert.doesNotMatch(r.text, /Here's how we address it/);
});

test("sales_enablement_content: each competitor objection gets its own response; no empty table cell; no 'guarantee'", async () => {
  const r = await call("sales_enablement_content", SALES);
  const comp = r.text.split("## Competitive Responses")[1].split("## Price Justification")[0].split("### Objection: ").slice(1);
  assert.equal(comp.length, 2);
  assert.notEqual(comp[0].split("**Response:**")[1], comp[1].split("**Response:**")[1]);
  assert.doesNotMatch(r.text, /^\|\s*\|/m);
  assert.doesNotMatch(r.text, /guarantee/i);
});

test("sales_enablement_content: a connectivity business gets no SaaS-only term and a sector-specific discovery list", async () => {
  const r = await call("sales_enablement_content", { product: "Branchwire managed SD-WAN and business internet for companies with many branches", target_persona: "Heads of IT infrastructure at multi-branch retailers", proof_points: "Outage hours cut across 40 branches, Migration done in waves with no downtime", common_objections: "Price per site is higher than our operator, Migration risk across many sites, We have a long relationship with our operator", business_model: "connectivity", sales_stage: "demo" });
  shared(r.text, { names: ["Branchwire"], sector: /uptime|mean time to repair|site survey|wave plan|cost per site/i, saas: false, label: "sales 2" });
  assert.doesNotMatch(r.text, /\btrials?\b/i);
});

test("sales_enablement_content: without objections the suggested ones come from the sector and are labelled", async () => {
  const r = await call("sales_enablement_content", { product: "Cloudmoat, cloud security monitoring that ranks misconfigurations by real exposure", target_persona: "CISOs at mid-size fintech and SaaS companies", proof_points: "Open critical exposures fell in six weeks at one fintech customer" });
  assert.match(r.text, /Objections suggested/);
  assert.match(r.text, /too many alerts/i);
  shared(r.text, { names: ["Cloudmoat"], sector: /alert fatigue|mean time to detect|proof of value|SIEM|exposure/i, label: "sales 3" });
});

// ---- craft_content_improver: honest scores and real edits ----
const LANDING = "Answerloop leverages cutting-edge AI to empower support teams to deliver best-in-class customer experiences at scale across every channel.\n\nOur innovative platform utilizes advanced automation to streamline workflows, so teams can do more with less and delight customers every single day.\n\nOur onboarding team configures each workspace in line with your processes, so you can unlock value from day one.";
const score = (t) => Number(t.match(/## Overall Score: ([\d.]+)\/10/)[1]);
test("craft_content_improver: hype copy gets a real edit, a quoted finding and a score below 8; the improved text differs", async () => {
  const r = await call("craft_content_improver", { content: LANDING, content_type: "landing_page" });
  assert.equal(r.isError, false);
  shared(r.text, { names: ["Answerloop"], label: "improver" });
  assert.ok(score(r.text) < 8, "score " + score(r.text));
  assert.match(r.text, /cutting-edge/);
  assert.match(r.text, /## Edits Made/);
  const improved = r.text.split("## Improved Version")[1].split("## Before/After Comparison")[0];
  assert.doesNotMatch(improved, /leverages|utilizes|cutting-edge|best-in-class/);
  assert.match(improved, /uses/);
  assert.ok(!improved.includes(LANDING), "not the original");
});

test("craft_content_improver: a weak email is not rated EXCELLENT and says what it could not fix", async () => {
  const email = "Subject: Quick question about branch outages\nHi {first name},\nI noticed your team is growing fast. Many IT heads tell us they struggle with branch outages.\nBranchwire is managed SD-WAN for companies with many branches. 18% fewer outage hours at a 400-site retailer.\nWould you be open to a 20-minute call next week to see if this fits?\nThanks,\nPriyanka, Branchwire";
  const r = await call("craft_content_improver", { content: email, content_type: "sales_email", goal: "book a first meeting", audience: "Heads of IT infrastructure at multi-branch retailers" });
  assert.ok(score(r.text) <= 7.5, "score " + score(r.text));
  assert.notEqual(r.text.match(/## Overall Score: [\d.]+\/10 \(([A-Z ]+)\)/)[1], "EXCELLENT");
  assert.match(r.text, /\{first name\}/);
  assert.match(r.text, /I noticed your team is growing fast/);
  assert.match(r.text, /18% fewer outage hours at a 400-site retailer/);
  assert.match(r.text, /No automatic edits were found/);
  assert.doesNotMatch(r.text, /Below is an auto-improved version/);
  assert.doesNotMatch(r.text, /\[Name\], I noticed \[specific observation/);
});

test("craft_content_improver: a clean text scores high and says plainly that it found nothing to edit", async () => {
  const clean = "Cloudmoat ranks cloud misconfigurations by real exposure, so your security team fixes the few that matter first. At one fintech customer, open critical exposures fell from 48 to 9 in six weeks. Would you like to see the ranking for your own AWS account? You can reply to this message or book 20 minutes with us.";
  const r = await call("craft_content_improver", { content: clean, content_type: "sales_email", goal: "book a first meeting", audience: "CISOs at mid-size fintech companies" });
  assert.ok(score(r.text) >= 9, "score " + score(r.text));
  assert.match(r.text, /No automatic edits were found/);
  assert.doesNotMatch(r.text, /## Edits Made/);
});

test("craft_content_improver: tone_preference and audience are used or named as not used", async () => {
  const r = await call("craft_content_improver", { content: "We're glad you're here. We can't wait to show you the new dashboard, and you won't be disappointed.", content_type: "email", tone_preference: "more_formal", audience: "Finance controllers at mid-size manufacturers" });
  assert.match(r.text, /contraction/i);
  assert.match(r.text, /never mentions your audience/i);
  const u = await call("craft_content_improver", { content: "Short note.", content_type: "email", tone_preference: "more_urgent" });
  assert.match(u.text, /tone_preference more_urgent was not used/i);
});

// ---- unit tests for each score or calculation rule (dist/utils.js and dist/sector.js) ----
const U = async () => await import("../dist/utils.js");
const STEADY = "Do you want fewer open alerts? Your team fixes 9 of 10 critical exposures in 6 weeks, and you see them ranked. Book a call to see yours.";
test("rule: buzzwords deduct one point each from clarity, at most four", async () => {
  const { analyzeContent } = await U();
  const base = analyzeContent(STEADY, "email", "book a call").clarity.score;
  assert.equal(base, 10);
  assert.equal(analyzeContent(STEADY + " We leverage synergy. We utilize methodology.", "email", "book a call").clarity.score, 6);
  assert.equal(analyzeContent(STEADY + " We leverage synergy and utilize methodology and facilitate holistic robust optimize.", "email", "book a call").clarity.score, 6, "capped at four");
});
test("rule: an unsupported superlative deducts from engagement and the rating cannot be EXCELLENT", async () => {
  const { analyzeContent } = await U();
  assert.equal(analyzeContent(STEADY, "email", "book a call").engagement.score, 10);
  const a = analyzeContent(STEADY + " Our best-in-class tool is world-class.", "email", "book a call");
  assert.equal(a.engagement.score, 8);
  assert.notEqual(a.overall.rating, "EXCELLENT");
});
test("rule: a sentence that starts with a number and has no verb is a fragment and costs two clarity points", async () => {
  const { analyzeContent } = await U();
  const a = analyzeContent(STEADY + " 18% fewer outage hours at a 400-site retailer.", "email", "book a call");
  assert.equal(a.clarity.score, 8);
  assert.ok(a.clarity.issues.some((i) => /fragment/i.test(i) && i.includes("18% fewer outage hours at a 400-site retailer")));
  assert.equal(analyzeContent(STEADY + " 18% of tickets are resolved by agents.", "email", "book a call").clarity.score, 10, "a sentence with a verb is not a fragment");
});
test("rule: an unfilled merge field costs two structure points", async () => {
  const { analyzeContent } = await U();
  assert.equal(analyzeContent("Hi {first name}, " + STEADY, "email", "book a call").structure.score, 8);
  assert.equal(analyzeContent("Hi [Name], " + STEADY, "email", "book a call").structure.score, 8);
});
test("rule: a claim about the reader in a sales email costs two engagement points; the same sentence in a blog post does not", async () => {
  const { analyzeContent } = await U();
  const s = "I noticed your team is growing fast. " + STEADY;
  assert.equal(analyzeContent(s, "sales_email", "book a call").engagement.score, 8);
  assert.equal(analyzeContent(s, "blog_post", "educate").engagement.score, 10);
});
test("rule: a text of 20 words or more with no figure costs two engagement points", async () => {
  const { analyzeContent } = await U();
  const nf = "Do you want fewer open alerts? Your team can fix the critical exposures in a few weeks, and you see them ranked by real exposure. Book a call to see yours.";
  assert.equal(analyzeContent(nf, "email", "book a call").engagement.score, 8);
});
test("rule: a goal that needs an ask with no ask in the text costs four goal-alignment points", async () => {
  const { analyzeContent } = await U();
  const noAsk = "Your team fixes 9 of 10 critical exposures in 6 weeks, and you see them ranked. Do you want that?";
  assert.equal(analyzeContent(noAsk, "email", "book a first meeting").goalAlignment.score, 6);
  assert.equal(analyzeContent(STEADY, "email", "book a first meeting").goalAlignment.score, 10);
});
test("rule: transition words match whole words only ('secondary' is not 'second', 'renewal' is not 'new')", async () => {
  const { analyzeContent } = await U();
  const paras = ["Secondary sales rose.", "Renewals rose too.", "Distributor claims settled faster.", "Firstly, reps adopted it."].join("\n\n");
  const a = analyzeContent(paras, "blog_post", "educate");
  assert.ok(a.structure.issues.some((i) => /Few transition words/.test(i)));
});
test("rule: the advice never suggests promises or free offers (no 'free', 'guaranteed', 'exclusive')", async () => {
  const { analyzeContent } = await U();
  const a = analyzeContent("Short text without much in it, but it is long enough to be scored by the rules that run on text.", "email", "get replies");
  for (const d of ["clarity", "structure", "engagement", "goalAlignment"]) for (const s of a[d].suggestions) assert.doesNotMatch(s, /free|guaranteed|exclusive/i, s);
});
test("rule: the jargon tick in the checklist follows the jargon finding, not only the clarity score", async () => {
  const r = await call("craft_content_improver", { content: STEADY + " We leverage it.", content_type: "email", goal: "book a call" });
  assert.match(r.text, /- \[ \] Clear, jargon-free language/);
});
test("rule: result lists split on lines and semicolons and keep a short comma list; a clause with a comma stays whole", async () => {
  const { splitItems } = await import("../dist/sector.js");
  assert.deepEqual(splitItems("45% of tickets resolved without a human in 60 days; first response time down from 6 hours to 2 minutes"), ["45% of tickets resolved without a human in 60 days", "first response time down from 6 hours to 2 minutes"]);
  assert.deepEqual(splitItems("45% of tickets resolved without a human at Example Food Delivery Co, Live in two weeks"), ["45% of tickets resolved without a human at Example Food Delivery Co", "Live in two weeks"]);
  assert.deepEqual(splitItems("Routes re-planned in under a minute, not overnight"), ["Routes re-planned in under a minute, not overnight"]);
  assert.deepEqual(splitItems("one\ntwo\n- three"), ["one", "two", "three"]);
});
test("rule: key points for the repurposer are whole sentences, at most five, in source order", async () => {
  const { pickKeyPoints } = await import("../dist/sector.js");
  const pts = pickKeyPoints(SHELFWALK_SOURCE, "Secondary sales visibility can be fixed inside one quarter");
  assert.ok(pts.length >= 4 && pts.length <= 5);
  const pos = pts.map((p) => SHELFWALK_SOURCE.indexOf(p));
  assert.ok(pos.every((p) => p >= 0));
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
});

// ---- every tool, every shared assertion, seven of the nine verticals with invented companies ----
const CASES = [
  ["case_study_generator", { customer_name: "Example Logistics Co", your_product: "Lanehop", customer_industry: "Third-party logistics", mode: "full", challenge: "Dispatchers re-plan routes by hand when orders change", solution: "Live re-routing of every route during the day", results: "Cost per delivery down 12% in a quarter" }, ["Lanehop"], /dispatch|fleet|first-attempt|proof of delivery|cost per delivery/i],
  ["newsletter_builder", { topic: "Month-end close and expense reconciliation", cta_goal: "book a 20-minute review", your_product: "Spendrill" }, ["Spendrill"], /reconciliation|ERP posting|audit trail|days to close|policy/i],
  ["webinar_script", { topic: "Ranking cloud exposure before alerts", target_audience: "CISOs at mid-size fintech and SaaS companies", webinar_type: "educational", your_product: "Cloudmoat" }, ["Cloudmoat"], /alert fatigue|mean time to detect|attack surface|misconfiguration|proof of value/i],
  ["content_repurposer", { source_content: "Cloudmoat ranks cloud misconfigurations by real exposure. Security teams then fix the few that matter first. At one fintech customer, open critical exposures fell from 48 to 9 in six weeks.", source_type: "blog_post" }, ["Cloudmoat"], /alert fatigue|mean time to detect|critical exposures|SIEM|CISO/i],
  ["thought_leadership_series", { topic: "managed IT service desks", your_take: "Service desks should be bought on SLA attainment, not hourly rates", target_reader: "CIOs at mid-size insurers", num_articles: 2, author_background: "Head of Marketing at Example IT Services Co" }, ["Example IT Services Co"], /SLA|transition|steady state|service credits|statement of work/i],
  ["testimonial_capture", { customer_name: "Jo Example (fictional)", customer_company: "Example Manufacturing Co", success_story: "Uptime improved across 40 branch sites after the move to one managed SD-WAN partner", testimonial_type: "reference_call", customer_role: "Network Manager", your_product: "Branchwire" }, ["Branchwire"], /uptime|mean time to repair|latency|site survey|cut-over/i],
  ["sales_enablement_content", { product: "Shelfwalk, a field sales app for consumer goods brands and their distributors", target_persona: "National sales heads at consumer goods brands", proof_points: "Orders captured offline in every outlet, Live in one region in three weeks" }, ["Shelfwalk"], /secondary sales|beat plan|productive calls|outlet|general trade|distributor/i],
  ["craft_content_improver", { content: "Shelfwalk captures orders offline in every outlet. Reps see the next order to suggest for each outlet. Would you like to see it on a low-end phone? Book a 20-minute call with us.", content_type: "sales_email", goal: "book a first meeting", audience: "National sales heads at consumer goods brands" }, ["Shelfwalk"], undefined],
];
for (const [tool, args, names, sector] of CASES) {
  test(`${tool}: names the company, no B75 word, no unfilled marker, no invented promise (invented company)`, async () => {
    const r = await call(tool, args);
    assert.equal(r.isError, false, r.text.slice(0, 200));
    shared(r.text, { names, sector, saas: !/IT Services|Branchwire/.test(JSON.stringify(args)), label: tool });
  });
}

// ---- ledger B15-L1: a long pasted text cannot make an answer many times its size (repeats are cut at 200 to 280 characters) ----
test("B15-L1: a 3,990-character text in one field gives an answer under 6 times the input plus 20,000 characters, in every tool", async () => {
  const L = "a long pasted sentence about field sales ".repeat(95).slice(0, 3990);
  const cases = {
    case_study_generator: { customer_name: "Example Food Delivery Co", your_product: "Answerloop", mode: "full", challenge: L, solution: L, results: L },
    newsletter_builder: { topic: L, cta_goal: "book a call" },
    webinar_script: { topic: L, target_audience: L, webinar_type: "educational" },
    content_repurposer: { source_content: L, source_type: "blog_post" },
    thought_leadership_series: { topic: L, your_take: L, target_reader: L },
    testimonial_capture: { customer_name: "Sam Example (fictional)", customer_company: "Example Food Delivery Co", success_story: L, testimonial_type: "video_interview" },
    sales_enablement_content: { product: L, target_persona: L, proof_points: L },
    craft_content_improver: { content: L, content_type: "blog_post" },
  };
  for (const [tool, args] of Object.entries(cases)) {
    const total = Object.values(args).filter((v) => v === L).length * L.length;
    const r = await call(tool, args);
    assert.equal(r.isError, false, tool);
    assert.ok(r.text.length < 6 * total + 20000, `${tool}: ${r.text.length} characters for ${total} typed`);
  }
});
