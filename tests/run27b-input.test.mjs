// Run 27B (test first): the worst lines of five tools on two test pools, traced to the code that wrote them (fault: field parsing, sentence
// template, dropped input, sector lookup). Each test is one of those lines as a failing check; plain words only, no real company (rule B81).
// The rule they share: a list is never cut inside a quote or inside one statement; a person's quoted words are never edited; the tool never
// builds a sentence from a piece it could not read (it quotes the user's words instead); company facts are not value to the buyer.
// Tested in-process through netlify/functions/mcp.mjs, which loads dist (run npm run build first). Run: node --test tests/run27b-input.test.mjs
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

const EMAIL = [
  "Subject: Quick question about without help, reps hunt through calls for customer insights and fill CRM updates from memory after every call",
  "Hi,",
  "Teams at sales teams often deal with without help, reps hunt through calls for customer insights and fill CRM updates from memory after every call.",
  "Notewise is a meeting assistant that records, transcribes and summarizes calls and fills CRM fields after every call.",
  "Head of Sales at a software firm: \"Before this, two people copied notes into the CRM. Notewise lets us leverage every call. That is the point.\" (customer quote)",
  "Would you be open to a 20-minute call next week to see if this fits?",
  "Thanks,",
  "The Notewise team",
].join("\n");

test("craft_content_improver: a person's quoted words are never edited", async () => {
  const r = await call("craft_content_improver", { content: EMAIL, content_type: "sales_email", audience: "Sales leaders at software firms" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /Notewise lets us use every call/);
});

test("craft_content_improver: a template line whose slot holds a whole sentence is named as broken, and the shorter version does not open with it", async () => {
  const r = await call("craft_content_improver", { content: EMAIL, content_type: "sales_email", audience: "Sales leaders at software firms" });
  assert.equal(r.isError, false);
  assert.match(r.text, /broken opening/i);
  assert.doesNotMatch(r.text, /Shorter version[\s\S]{0,400}Teams at sales teams often deal with without help/i);
});

test("craft_content_improver: what the reader looks for is about the audience typed, not the seller's own sector", async () => {
  const content = "Subject: Get paid on time\nHi,\nBillwise is subscription billing software for SaaS companies: invoicing, dunning and revenue recognition.\nWould you be open to a call next week?\nThanks,\nThe Billwise team";
  const r = await call("craft_content_improver", { content, content_type: "sales_email", audience: "Owner (the person running the shop) at roofing contractors" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /Readers in [^\n]*SaaS[^\n]* are usually/);
  assert.match(r.text, /Owner \(the person running the shop\) at roofing contractors/);
});

test("thought_leadership_series: a customer quote with a semicolon inside it stays one quote, credited to its speaker", async () => {
  const r = await call("thought_leadership_series", {
    topic: "loan collections technology", your_take: "collections work best when each lender's strategy is tuned to its borrowers",
    target_reader: "banks and digital lenders",
    proof_points: "Head of Collections at a lending firm; on the home page: \"Our reminders now go out on time; the team trusts the numbers again.\" (customer quote), Named a top collections platform (recognition; page claim)",
    author_background: "a collections software team", num_articles: 3, article_type: "framework",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /The evidence: Head of Collections at a lending firm,?:/);
  assert.match(r.text, /Our reminders now go out on time; the team trusts the numbers again/);
});

test("thought_leadership_series: one named customer's deployment is that customer's result, not a company-wide count", async () => {
  const r = await call("thought_leadership_series", {
    topic: "IoT connectivity for devices worldwide", your_take: "devices need networks they can switch between without a site visit",
    target_reader: "IoT product teams",
    proof_points: "Skyline Air: 3,000+ tablets connected in 40+ countries (page claim), 50,000+ trackers use the network (page claim)",
    author_background: "an IoT connectivity team", num_articles: 3, article_type: "framework",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /company-wide count[^\n]*Skyline Air/);
});

test("webinar_script: a takeaway cut at a semicolon inside its sentence is not given a sentence it does not fit", async () => {
  const r = await call("webinar_script", {
    topic: "How security teams can cut noise from code to cloud", target_audience: "CISO at startups", webinar_type: "educational", duration: "45_min",
    key_takeaways: "fewer alerts so engineers can keep shipping; one view where code; cloud and runtime findings meet; adds checks for running apps while keeping current tools",
    include_polls: true, product_mention_level: "subtle",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /You will see one view where code\./);
  assert.doesNotMatch(r.text, /You will see adds /);
});

test("sales_enablement_content: company facts are not pitched as value, and the product's own parts are", async () => {
  const r = await call("sales_enablement_content", {
    product: "Codewise, one security platform from code to production: code security (dependency scanning, static analysis, secrets), cloud security (posture and container scanning) and runtime protection",
    target_persona: "CISO at startups",
    proof_points: "Head of AppSec at a fintech: \"Low false positives save our teams hours every week.\" (customer quote)",
    common_objections: "Do I need to give access to my source code?",
    value_props: "founded in 2021; $40M funding raised; 300+ employees (page claims)",
    sales_stage: "discovery",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /could help: founded in 2021/);
  assert.doesNotMatch(r.text, /\*\*1\. founded in 2021\*\*/);
});

test("sales_enablement_content: a way of working named as the alternative is not asked about as if it were a vendor", async () => {
  const r = await call("sales_enablement_content", {
    product: "Collectwise, a loan collections platform with digital reminders and field collection tools",
    target_persona: "Chief Risk Officer at a bank",
    proof_points: "A lender raised its resolution rate with digital reminders (case study; page claim)",
    value_props: "digital reminders in the borrower's language; field collection app",
    competitor_objections: "Why not manual collections",
    sales_stage: "discovery",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /When you looked at manual collections, how did it do/);
});

test("testimonial_capture: a staff role is not asked leader questions", async () => {
  const r = await call("testimonial_capture", {
    customer_name: "contact at a customer (name not given)", customer_company: "a customer (roofing and exteriors)", customer_role: "Office Manager",
    success_story: "When a storm hit, a roofing customer faced a surge in inbound calls; with the AI agent it avoided missed calls (customer story summary, page claim)",
    testimonial_type: "written_quote",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /another leader in your position/);
  assert.match(r.text, /Office Manager/);
});
