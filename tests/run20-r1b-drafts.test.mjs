// Run 20 round 1b (owner decision D92): the eight tools build a draft from the user's inputs plus the sector knowledge in src/verticals.ts,
// instead of pasting the inputs into fixed sentence frames. These tests were written for the causes the set T judges found (all 72 answers
// scored 2): pasted input, cut-off or garbled sentences, bracket placeholders where an input or the sector file can supply the text,
// other customers' results and recognition presented as one customer's success, one answer pattern for every objection, fake default
// objections, an "improved" text that is the original with fragments, a very hard to read text called clear, a clear CTA called missing.
// Companies are invented (Lanehop, Branchwire, Cloudmoat, Answerloop, Shelfwalk, Spendrill). Every figure is hypothetical.
// Run: npm run build && node --test tests/run20-r1b-drafts.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const j = await r.json();
  assert.ok(!j.result.isError, j.result.content[0].text.slice(0, 200));
  return j.result.content.map((c) => c.text).join("\n");
};
// a bracket placeholder: "[Add ...]", "[Your ...]" (the signature "[Your name]" is the one slot no input fills), "[Insert", "{{"
const BRACKET = /\[(?:Add|Only if|Insert|Your (?!name\])|Describe|Write|Connect|Mention|Audience-specific|Core teaching|Speaker name|Moderator|Panelist|Day|Time|First Name|Product)/;
const noBrackets = (t, where) => assert.doesNotMatch(t, BRACKET, `${where}: ${(t.match(BRACKET) || [""])[0]}`);

// ---------------------------------------------------------------------------------------------------------------------------
// The port: one sector reader
// ---------------------------------------------------------------------------------------------------------------------------
test("one sector reader: src/sector.ts has no reader of its own, and src/verticals.ts is the shared file", () => {
  const sector = readFileSync(new URL("../src/sector.ts", import.meta.url), "utf8");
  assert.doesNotMatch(sector, /pointed/, "the old confirm-only rule is gone");
  assert.match(sector, /detectVertical\(input\)/);
  assert.match(sector, /detectModel\(explicitModel, input\)/);
  const v = readFileSync(new URL("../src/verticals.ts", import.meta.url), "utf8");
  assert.match(v, /export function explainSector/);
  assert.match(v, /export interface ReaderInput/);
});

test("the seller's fields go first: a security tool sold to banks is cybersecurity, not fintech", async () => {
  const t = await call("sales_enablement_content", { product: "Cloudmoat, cloud security monitoring that ranks misconfigurations by real exposure", target_persona: "CISO at a regional bank", proof_points: "Open critical exposures fell in six weeks at one customer" });
  assert.match(t, /Sector: read from your inputs as cybersecurity/);
});

test("an investor buyer with no seller sector gets no finance-office notes", async () => {
  const t = await call("webinar_script", { topic: "How asset allocators can judge model risk in systematic strategies", target_audience: "CIO at pension funds", webinar_type: "educational", your_product: "Lanehop" });
  assert.doesNotMatch(t, /month-end close|days to close the books|reconciliation effort/i);
});

// ---------------------------------------------------------------------------------------------------------------------------
// case_study_generator
// ---------------------------------------------------------------------------------------------------------------------------
const CS = {
  customer_name: "a Branchwire customer (Retail)", customer_industry: "Retail", your_product: "Branchwire managed SD-WAN", mode: "full",
  challenge: "branch outages, long repair times and many network providers across 400 stores",
  solution: "one managed SD-WAN across MPLS, broadband and 4G links, with one control centre",
  results: "Northfield Stores cut outage hours by 40% across 400 branches (case study); Named a Leader in the 2026 Example Analyst Wave for managed networks; 1 million+ businesses trust Branchwire (page claim); Harbor Retail launched 120 sites in two months (customer quote)",
};
test("case_study_generator: results are sorted, recognition and company-wide counts are kept out, nobody else's result is put to a generic customer", async () => {
  const t = await call("case_study_generator", CS);
  assert.match(t, /\*\*Outcomes\*\*\n\n- Northfield Stores cut outage hours by 40% across 400 branches \(case study\)\./);
  assert.match(t, /Recognition, kept out of the outcomes/);
  assert.match(t, /Company-wide claims, kept out of the outcomes/);
  assert.match(t, /Whose results these are/, "a generic customer name is named as such");
  assert.match(t, /^## Northfield Stores cut outage hours by 40%/m, "the headline is the first result with a figure");
  noBrackets(t, "case study");
  assert.doesNotMatch(t, /\[Add|\[CTA/);
  assert.doesNotMatch(t, /a Branchwire customer \(Retail\) \(Retail\)/);
});
test("case_study_generator: a semicolon typed inside a number is put back, and an all-claims input says there is no customer outcome", async () => {
  const t = await call("case_study_generator", { ...CS, customer_name: "Harbor Retail", results: "$8B+ deployed since 2015 (page claim); More than 2;000 businesses use Branchwire (page claim)" });
  assert.match(t, /More than 2,000 businesses use Branchwire/);
  assert.match(t, /No customer outcome was given/);
  assert.doesNotMatch(t, /2;000/);
});
test("case_study_generator: the sector's measures and questions fill the finish-this-section lines", async () => {
  const t = await call("case_study_generator", CS);
  assert.match(t, /starting value of one of: uptime per site, mean time to repair and latency/);
  assert.match(t, /How many sites do you run, and which ones suffer the most outages\?/);
});

// ---------------------------------------------------------------------------------------------------------------------------
// content_repurposer
// ---------------------------------------------------------------------------------------------------------------------------
const SRC = `billing and monetization (recurring billing and revenue infrastructure): what to do about pricing that changes deal by deal
Finance teams are asked to deliver: launch and change pricing in hours without engineering delays.
Many teams still rely on spreadsheets and a billing system that was built for one price list.
At Spendrill we built Spendrill around this: usage pricing, proration, dunning and revenue recognition on one ledger, with an API for the finance team's own tools.
Proof: Lanehop CFO: moved from a quote-to-cash backlog of 6 days to 1 day (customer quote); Named a Leader in the 2026 Example Analyst Wave for billing (analyst report); 99.5% of invoices posted first time (page claim)`;
test("content_repurposer: proof is used and sorted, nothing is cut mid-phrase, a decimal stays whole, the hashtags are the brand and the sector's terms", async () => {
  const t = await call("content_repurposer", { source_content: SRC, source_type: "blog_post", key_message: "Spendrill: launch and change pricing in hours without engineering delays" });
  assert.match(t, /Lanehop CFO: moved from a quote-to-cash backlog of 6 days to 1 day/);
  assert.match(t, /a recognition or ranking, not a customer outcome; not used as a result/);
  assert.match(t, /99\.5% of invoices posted first time/);
  assert.doesNotMatch(t, /(^|[^.\d])5% of invoices/m);
  assert.doesNotMatch(t, /\.\.\.\s*$/m, "no line ends in a cut");
  const tags = t.match(/^#Spendrill[^\n]*/m);
  assert.ok(tags, "the brand is a hashtag");
  assert.doesNotMatch(tags[0], /#Teams|#Spreadsheets|#Finance\b|#Launch/, "no random word of the text");
  noBrackets(t, "repurposer");
});
test("content_repurposer: every tweet is a whole clause of at most 280 characters", async () => {
  const t = await call("content_repurposer", { source_content: SRC, source_type: "blog_post", target_formats: "twitter_thread" });
  const tweets = t.split("**Tweet ").slice(1).map((x) => x.split("\n").slice(1).join("\n").split("\n\n")[0].trim());
  assert.ok(tweets.length >= 3);
  for (const w of tweets) assert.ok(w.length <= 290, `${w.length}: ${w}`);
});

// ---------------------------------------------------------------------------------------------------------------------------
// newsletter_builder
// ---------------------------------------------------------------------------------------------------------------------------
const LONG_TOPIC = "How multi-branch retailers can tackle branch outages are costly because every store depends on one congested link, with several providers selling overpriced links, from Branchwire";
test("newsletter_builder: a long topic gives short subject lines, hooks and sections without brackets, and the sector's own question as the hook", async () => {
  const t = await call("newsletter_builder", { topic: LONG_TOPIC, key_points: "branch outages are costly; several providers selling overpriced links; one control centre for every link", cta_goal: "book a conversation about Branchwire managed SD-WAN", newsletter_type: "thought_leadership" });
  const subjects = t.split("## Subject Lines")[1].split("## Opening Hooks")[0].split("\n").filter((l) => l.startsWith("**"));
  assert.equal(subjects.length, 4);
  for (const s of subjects) { assert.ok(s.length < 150, s); assert.doesNotMatch(s, /\[/, s); assert.doesNotMatch(s, /how multi-branch retailers/i, s); }
  noBrackets(t, "newsletter");
  assert.match(t, /### Hook 1: Question\n> How many sites do you run, and which ones suffer the most outages\?/);
  assert.match(t, /\| \*\*Product\*\* \| Branchwire \(read from the topic\)/);
  assert.match(t, /### 1\. Branch outages are costly/);
});
test("newsletter_builder: a statistic hook uses a figure the user gave and never invents one", async () => {
  const withFigure = await call("newsletter_builder", { topic: "Failed first-attempt deliveries", key_points: "Failed drops fell by 12.5% in one region; Plan around windows", cta_goal: "read the guide" });
  assert.match(withFigure, /### Hook 2: Statistic\n> Failed drops fell by 12\.5% in one region\./);
  const without = await call("newsletter_builder", { topic: "Failed first-attempt deliveries", key_points: "Plan around windows; Tell the customer early", cta_goal: "read the guide" });
  assert.match(without, /No figure was given in key_points/);
});

// ---------------------------------------------------------------------------------------------------------------------------
// webinar_script
// ---------------------------------------------------------------------------------------------------------------------------
test("webinar_script: the topic is printed once, the pain point is written from the topic and the sector, and every takeaway is taught", async () => {
  const topic = "How finance teams in mid-size manufacturers can tackle slow month-end close because receipts, cards and approvals live in different tools, with Spendrill";
  const t = await call("webinar_script", { topic, target_audience: "CFO at mid-size manufacturers", webinar_type: "educational", duration: "45_min", key_takeaways: "close faster by posting card spend to the ledger daily; keep one approval policy for cards and claims; give audit one trail per transaction" });
  assert.equal(t.split(topic).length - 1, 2, "the heading and the table, no more");
  noBrackets(t, "webinar");
  assert.match(t, /The problem this session takes on: slow month-end close because receipts, cards and approvals live in different tools\./);
  assert.match(t, /For a CFO in mid-size manufacturers the usual yardsticks are days to close the books, reconciliation effort and policy breach rate\./);
  for (const k of ["close faster by posting card spend to the ledger daily", "keep one approval policy for cards and claims", "give audit one trail per transaction"]) {
    assert.ok(t.split("Main Content Block 1")[2].includes(k) || t.includes(`- ${k.charAt(0).toUpperCase()}${k.slice(1)}.`), k);
  }
  assert.match(t, /Spendrill is read from the topic|CFO should be able to say where they stand/);
});

// ---------------------------------------------------------------------------------------------------------------------------
// thought_leadership_series
// ---------------------------------------------------------------------------------------------------------------------------
test("thought_leadership_series: each article leads with its own part of the take, proof and objection; recognition is not an example; superlatives are flagged", async () => {
  const take = "Cloudmoat's view on cloud security: the first and only tool that ranks findings by real exposure; teams fix fewer items and close more risk";
  const t = await call("thought_leadership_series", {
    topic: "cloud security posture", your_take: take, target_reader: "CISOs at mid-size fintech companies",
    proof_points: "Open critical exposures fell from 48 to 9 in six weeks at one fintech customer (customer quote), Alert volume per analyst fell by 30% (case study), Named a Leader in the 2026 Example Analyst Wave (analyst report)",
    author_background: "Head of Marketing at Cloudmoat", num_articles: 3, article_type: "framework",
  });
  noBrackets(t, "thought leadership");
  assert.doesNotMatch(t, /\[Write this part|\[Draw on|\[Answer the objection|\[Add your/);
  assert.match(t, /Claims to source before you publish/);
  assert.match(t, /"the first and only"/);
  const arts = t.split(/\n## Article \d of 3/).slice(1);
  assert.equal(arts.length, 3);
  const leads = arts.map((a) => (a.match(/\*\*Lead proof point:\*\* ([^\n]+)/) || [])[1]);
  assert.equal(new Set(leads).size, 2, "the two customer results are used in turn, recognition is not a lead");
  assert.ok(leads.every((l) => !/Named a Leader/.test(l)));
  const counters = arts.map((a) => (a.match(/\*\*Counter-argument it answers:\*\* ([^\n]+)/) || [])[1]);
  assert.equal(new Set(counters).size, 3, "three different sector objections");
  const theTake = t.split(take).length - 1;
  assert.ok(theTake <= 1, `the whole take is printed once (${theTake})`);
  assert.match(t, /Credibility line.*Named a Leader in the 2026 Example Analyst Wave/);
});
test("thought_leadership_series: five articles have five different headlines", async () => {
  const t = await call("thought_leadership_series", { topic: "branch networks", your_take: "Branch uptime is bought, not hoped for", target_reader: "Heads of IT infrastructure", num_articles: 5 });
  const heads = [...t.matchAll(/\*\*Headline:\*\* ([^\n]+)/g)].map((m) => m[1]);
  assert.equal(heads.length, 5);
  assert.equal(new Set(heads).size, 5);
});

// ---------------------------------------------------------------------------------------------------------------------------
// testimonial_capture
// ---------------------------------------------------------------------------------------------------------------------------
test("testimonial_capture: a generic company gets no one else's result in the email, the product is read from the company field, the role picks the questions", async () => {
  const story = "Northfield Stores cut outage hours by 40% across 400 branches (case study); Named a Leader in the 2026 Example Analyst Wave for managed networks; 1 million+ businesses trust Branchwire (page claim)";
  const t = await call("testimonial_capture", { customer_name: "contact at a Branchwire customer (name not given)", customer_company: "a Branchwire customer (Retail)", customer_role: "Head of Product", success_story: story, testimonial_type: "written_quote" });
  const email = t.split("## Request Email")[1].split("## Interview Questions")[0];
  assert.doesNotMatch(email, /Northfield|40%|Leader|1 million/);
  assert.match(email, /Branchwire/);
  assert.doesNotMatch(t, /your your|share your \w+ experience\?\n\nHello/);
  assert.match(t, /### Questions for a Head of Product/);
  assert.match(t, /pricing and packaging/);
  noBrackets(t, "testimonial");
});
test("testimonial_capture: a named company's own results go in the email, each whole; a security-operations role gets the security questions", async () => {
  const t = await call("testimonial_capture", { customer_name: "Asha Rao", customer_company: "Harbor Retail", customer_role: "Head of Security Operations", success_story: "Harbor Retail cut open critical exposures from 48 to 9 in six weeks (customer quote)", testimonial_type: "written_quote", your_product: "Cloudmoat" });
  const email = t.split("## Request Email")[1].split("## Interview Questions")[0];
  assert.match(email, /Hi Asha,/);
  assert.match(email, /- Harbor Retail cut open critical exposures from 48 to 9 in six weeks \(customer quote\)\./);
  assert.match(t, /### Questions for a Head of Security Operations\n\n1\. What did your team see in the first weeks/);
});

// ---------------------------------------------------------------------------------------------------------------------------
// sales_enablement_content
// ---------------------------------------------------------------------------------------------------------------------------
test("sales_enablement_content: objections split on capital letters, one objection with commas stays whole, the product string is printed once", async () => {
  const product = "Spendrill, a spend management platform for finance teams: card issuing, expense claims, approvals, ledger posting";
  const t = await call("sales_enablement_content", {
    product, target_persona: "CFO at mid-size manufacturers",
    proof_points: "Lanehop CFO: moved from a close of 9 days to 5 days (customer quote), Named a Leader in the 2026 Example Analyst Wave (analyst report)",
    common_objections: "How is a Spendrill card different from a corporate credit card?, How long does it take to set up my account?",
    competitor_objections: "Why not our ERP for card, claims and approvals, each with its own owner",
    value_props: "go live in weeks, not quarters; audit trail on every transaction",
  });
  assert.equal(t.split(product).length - 1, 2, "the heading and the table only");
  assert.equal([...t.matchAll(/^### Objection \d+:/gm)].length, 2);
  assert.equal([...t.matchAll(/^### Objection: /gm)].length, 1, "one competitor objection, not split at its commas");
  assert.match(t, /From your product description, the facts that bear on this/);
  assert.match(t, /card issuing/);
  assert.match(t, /None of your proof points answers this objection\. The proof that would:/);
  assert.doesNotMatch(t, /Named a Leader[^\n]*\n> I hear you/, "recognition is not used as an answer");
  noBrackets(t, "sales");
});
test("sales_enablement_content: no objections and no readable sector gives no invented handlers", async () => {
  const t = await call("sales_enablement_content", { product: "Thing", target_persona: "Buyers", proof_points: "Lanehop saved 12 hours a week" });
  assert.match(t, /no objection handlers are written/);
  assert.doesNotMatch(t, /total cost of ownership|Implementation seems complex/i);
});
test("sales_enablement_content: a value proposition that is a list typed with semicolons is rebuilt (an acronym and places stay together)", async () => {
  const t = await call("sales_enablement_content", { product: "Spendrill, spend management", target_persona: "CFO", proof_points: "Lanehop saved 12 hours a week", value_props: "AI; machine learning and mobility based automation; 6500+ engineers across the US; UK; EU; and strong partners" });
  assert.match(t, /\*\*1\. AI, machine learning and mobility based automation\*\*/);
  assert.match(t, /\*\*2\. 6500\+ engineers across the US, UK, EU, and strong partners\*\*/);
});

// ---------------------------------------------------------------------------------------------------------------------------
// craft_content_improver
// ---------------------------------------------------------------------------------------------------------------------------
const EMAIL = "Subject: Quick question about branch outages that cost sales, long repair times, many providers and a congested link at every store\nHi,\nTeams at retailers often deal with branch outages that cost sales, long repair times, many providers and a congested link at every store, so every outage turns into a long escalation call.\nBranchwire is managed SD-WAN for retailers with many branches: intelligent path control, one control centre, robust security and flexibility, running over MPLS, broadband, 4G and satellite underlays, with a 24x7 operations desk, site surveys, rollout planning and service-level reporting for every region, and we can start with the sites that fail most.\nNorthfield Stores cut outage hours by 40% across 400 branches (case study); Harbor Retail launched 120 sites in two months (customer quote); Named a Leader in the 2026 Example Analyst Wave for managed networks; 1 million+ businesses trust Branchwire (page claim).\nWould you be open to a 20-minute call next week to see if this fits?\nThanks,\nThe Branchwire team";
test("craft_content_improver: the Subject line is never split, no fragment is made, and a list is never cut at its last 'and'", async () => {
  const t = await call("craft_content_improver", { content: EMAIL, content_type: "sales_email", audience: "CIO at multi-branch retailers" });
  const improved = t.split("## Improved Version")[1].split("## Suggested Shorter Version")[0].split("## Before/After Comparison")[0];
  assert.match(improved, /^Subject: Quick question about branch outages that cost sales, long repair times, many providers and a congested link at every store$/m);
  assert.doesNotMatch(improved, /^And \w+/m);
  assert.doesNotMatch(improved, /^(?:And|But|So|Or) /m);
});
test("craft_content_improver: it names the real weaknesses (subject line, length, run-on sentence), does not tick a hard text as clear, and reads the CTA from the text", async () => {
  const t = await call("craft_content_improver", { content: EMAIL, content_type: "sales_email", audience: "CIO at multi-branch retailers" });
  assert.match(t, /The subject line is \d+ words \(\d+ characters\)/);
  assert.match(t, /The email is \d+ words; a cold email is read in about a minute/);
  assert.match(t, /the longest runs \d+ words: "/);
  assert.match(t, /Hard to read: Flesch \d+\/100/);
  assert.match(t, /- \[ \] Clear, jargon-free language \(Flesch \d+: hard to read\)/);
  assert.match(t, /- Yes: Single clear CTA \(1 ask found\)/, "a clear CTA is not marked missing");
  assert.match(t, /- \[ \] Subject line optimized: it is \d+ words/);
  assert.doesNotMatch(t, /- \[ \] Single clear CTA/);
  assert.doesNotMatch(t, /No clear section headers/, "no header advice for a cold email");
});
test("craft_content_improver: a shorter version is cut from the user's own text, with the strongest proof, and says what was left out", async () => {
  const t = await call("craft_content_improver", { content: EMAIL, content_type: "sales_email", audience: "CIO at multi-branch retailers" });
  const shorter = t.split("## Suggested Shorter Version")[1].split("## Before/After Comparison")[0];
  const lines = shorter.split("\n").filter((l) => l && !l.startsWith("*") && !l.startsWith("---"));
  assert.match(lines[0], /^Subject: /);
  assert.ok(lines[0].length < 80, lines[0]);
  assert.match(shorter, /Northfield Stores cut outage hours by 40% across 400 branches \(case study\)/);
  assert.doesNotMatch(shorter.split("*Built only")[0], /Named a Leader/);
  assert.match(shorter, /Would you be open to a 20-minute call next week/);
  assert.match(shorter, /Left out: /);
  // every sentence of the shorter version is a sentence (or a clause) of the original
  for (const l of lines.slice(1)) { const core = l.replace(/[.]$/, ""); if (core.length > 12 && !/^(Hi|Thanks|The Branchwire team)/.test(core)) assert.ok(EMAIL.includes(core.slice(0, 40)), core); }
  const suggested = t.split("### Suggested Opening:")[1].split("---")[0];
  assert.match(suggested, /Northfield Stores cut outage hours by 40%/);
});
test("craft_content_improver: the sector block adds the questions this reader asks and who else reads", async () => {
  const t = await call("craft_content_improver", { content: EMAIL, content_type: "sales_email", audience: "CIO at multi-branch retailers" });
  assert.match(t, /Questions this reader asks before they reply:/);
  assert.match(t, /Who else reads it:/);
});

// ---------------------------------------------------------------------------------------------------------------------------
// every tool: no bracket placeholder where an input or the sector file can supply the text
// ---------------------------------------------------------------------------------------------------------------------------
test("no tool prints a bracket placeholder for a full input", async () => {
  const runs = {
    case_study_generator: CS,
    newsletter_builder: { topic: "Failed first-attempt deliveries in last-mile logistics", key_points: "Plan around windows; Tell the customer early; Measure first-attempt success", cta_goal: "register for the webinar", previous_topics: "Route planning basics", your_product: "Lanehop", newsletter_type: "educational" },
    webinar_script: { topic: "Fewer failed first-attempt deliveries", target_audience: "Heads of last-mile operations at 3PLs", webinar_type: "panel_discussion", speakers: "Asha Rao, Head of Operations at Example Logistics Co; Ben Ito, Fleet Manager at Example Logistics Co", your_product: "Lanehop", key_takeaways: "Plan around windows; Tell the customer early; Measure first-attempt success" },
    content_repurposer: { source_content: SRC, source_type: "blog_post", target_formats: "linkedin_post, twitter_thread, email, blog_summary, quote_cards, infographic_outline, video_script, podcast_talking_points, slide_deck_outline, newsletter_section" },
    thought_leadership_series: { topic: "last-mile delivery", your_take: "Plan around the window, not the depot", target_reader: "Heads of logistics", proof_points: "Lanehop cut failed first attempts by 12.5% in one region (case study)", author_background: "Head of Marketing at Lanehop", article_type: "how_to", num_articles: 3 },
    testimonial_capture: { customer_name: "Asha Rao", customer_company: "Harbor Retail", customer_role: "Head of Operations", success_story: "Harbor Retail launched 120 sites in two months (customer quote)", testimonial_type: "reference_call", your_product: "Branchwire", use_case: "sales deck", incentive: "a donation" },
    sales_enablement_content: { product: "Branchwire, managed SD-WAN for retailers with many branches: path control, one control centre", target_persona: "CIO at multi-branch retailers", proof_points: "Northfield Stores cut outage hours by 40% (case study)", common_objections: "Price per site is higher than our operator, Migration risk across many sites", competitor_objections: "Why not our current operator", value_props: "uptime SLA on every site; rollout in waves", sales_stage: "demo" },
    craft_content_improver: { content: EMAIL, content_type: "sales_email" },
  };
  for (const [tool, args] of Object.entries(runs)) {
    const t = await call(tool, args);
    noBrackets(t, tool);
    assert.doesNotMatch(t, /\[(?:Add|Only if)/, tool);
  }
});

test("AI native notes are cut to what fits: no support-desk measures for a quant product, all of them for a support product", async () => {
  const quant = await call("thought_leadership_series", { topic: "AI agents that screen securities for pension funds", your_take: "Allocators should ask for the evaluation set before the demo", target_reader: "CIOs at pension funds", num_articles: 1 });
  assert.match(quant, /Sector: read from your inputs as AI native/);
  assert.doesNotMatch(quant, /automated resolution rate|escalation rate|handling time|cost per resolution|Head of Customer Experience/);
  assert.match(quant, /accuracy on an evaluation set/);
  const support = await call("thought_leadership_series", { topic: "AI agents that resolve support tickets", your_take: "Measure the resolution rate on your own tickets", target_reader: "Heads of customer support", num_articles: 1 });
  assert.match(support, /automated resolution rate/);
});
