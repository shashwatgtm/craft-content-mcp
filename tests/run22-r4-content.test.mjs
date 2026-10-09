// Run 22 round 4 (test first): the faults the fresh judges still named after round 3, with invented companies.
// Webinar: content blocks that only announce the vendor's features ("We will cover ..."), a host intro of one line, a close that sets an unlabelled
// claim as the task for the week, buyer roles of the wrong kind of vendor. Newsletter: the same question printed twice, a pushback and a trial that
// came from the sector notes and not from the input, a hook that is an instruction, generic closing questions. Thought leadership: a recognition shown
// as a result, a label lost on a credibility line, "Case study:" pasted, a quote shown as plain text, generic software questions for a niche topic.
// Run: npm run build && node --no-warnings --test tests/run22-r4-content.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { call, norm, quality } from "./run22-rw-helpers.mjs";

const scriptOf = (t) => t.slice(t.indexOf("## Full Script"), t.indexOf("## Q&A Preparation") > 0 ? t.indexOf("## Q&A Preparation") : t.indexOf("## Notes for you"));
const section = (t, name) => { const s = t.slice(t.indexOf(`### ${name}`)); return s.slice(0, s.indexOf("\n### ", 5) > 0 ? s.indexOf("\n### ", 5) : s.length); };
const questions = (t) => [...t.matchAll(/"([^"\n]{12,}\?)"/g)].map((m) => norm(m[1]));

const WR = {
  topic: "How finance leads at mid-size manufacturers can close the month faster and with fewer manual steps, with Ledgerlark",
  target_audience: "Heads of finance at mid-size manufacturers",
  webinar_type: "educational", duration: "45_min", include_polls: true, product_mention_level: "subtle",
  key_takeaways: "match supplier invoices to orders before the month ends, close the month in two days instead of ten, a single ledger that holds every entity, 30% fewer manual journals (page claim), agree one owner for every reconciliation",
  your_product: "Ledgerlark, month-end close software for manufacturers",
  business_model: "saas",
};

test("r4 webinar: each content block teaches, with what it is, how to check it and a question, and never only announces the vendor's features", async () => {
  const t = await call("webinar_script", WR);
  quality(t, "r4 webinar");
  const s = scriptOf(t);
  const blocks = ["Main Content Block 1", "Main Content Block 2", "Main Content Block 3"].map((n) => section(s, n));
  for (const b of blocks) {
    assert.doesNotMatch(b, /We will (?:also )?cover/, "a block that only announces");
    assert.match(b, /to check it|you can check it/i, "no way to check the point");
    assert.match(b, /Question for the chat/);
    assert.ok(b.split(/\s+/).length >= 90, `a block of fewer than 90 words: ${b.split(/\s+/).length}`);
  }
  assert.doesNotMatch(s, /We will (?:also )?cover/);
});

test("r4 webinar: a claim with no label is never the task for the week, and the close holds the user's own material", async () => {
  const t = await call("webinar_script", WR);
  const s = scriptOf(t);
  assert.match(t.split("## Key Takeaways for Audience")[1].split("---")[0], /two days instead of ten[^\n]*\(the vendor's description\)/);
  const close = section(s, "Close & CTA");
  assert.doesNotMatch(close, /two days instead of ten|single ledger/, "a vendor claim set as the task for the week");
  assert.match(close, /If you do one thing this week/);
  assert.ok((close.match(/[.!?](?:\s|$)/g) || []).length >= 5, `the close is too short: ${close}`);
  assert.match(close, /Ledgerlark/);
});

test("r4 webinar: the host intro is longer than one line and uses the topic and the points", async () => {
  const t = await call("webinar_script", WR);
  const intro = section(scriptOf(t), "Speaker Introduction");
  assert.ok(intro.split(/\s+/).length >= 45, `the host intro is too short: ${intro}`);
  assert.match(intro, /close the month|manufacturers/i);
});

test("r4 webinar: the buyers named are those of the topic, not the first roles of the sector file", async () => {
  const t = await call("webinar_script", {
    topic: "How enterprises across industries can address spoofed SMS messages that reach customers under the names of real brands, with Wexpost",
    target_audience: "enterprises across industries, including banks and global tech firms",
    webinar_type: "educational", duration: "45_min", include_polls: true, product_mention_level: "subtle",
    key_takeaways: "stop spoofing in real time; with 99%+ efficacy observed during deployment (page claims), four patent pending detection engines",
  });
  const ctxLine = scriptOf(t).split("\n").find((l) => /the people who decide this are usually/.test(l)) || "";
  assert.match(ctxLine, /Fraud/, ctxLine);
  assert.match(scriptOf(t), /Words you will hear in /);
});

test("r4 webinar: the audience's own field is used in the teaching, not only at the welcome", async () => {
  const t = await call("webinar_script", { ...WR, topic: "How customer experience leaders at banks can keep service quality when work moves to a partner, with Callwell", target_audience: "Chief Customer Experience Officers at Banking and financial services", key_takeaways: "one team under one contract, quality scored on the bank's own scorecard (page claim), 25% call containment for a logistics provider (page claims)", your_product: "Callwell, customer service outsourcing", business_model: "services" });
  const s = scriptOf(t);
  assert.ok((s.match(/Banking and financial services/g) || []).length >= 3, "the field is said only once or twice");
});

const NL = {
  topic: "How online retailers (D2C brands, traders, drop shippers), social sellers and offline stores in India can tackle delivery delays and expensive warehousing across cities; confusing courier rates and areas that are not serviceable, from Parcelnest",
  key_points: "delivery delays and expensive warehousing across cities; confusing courier rates and areas that are not serviceable, simpler shipping and end to end growth: shipping cost reduction of up to 10 to 12% for online retailers and social sellers (page claims), more than a shipping partner: one platform for shipping; fulfilment; checkout and capital",
  cta_goal: "book a conversation about Parcelnest", newsletter_type: "educational",
};

test("r4 newsletter: no question is printed twice", async () => {
  for (const args of [NL, { ...NL, newsletter_type: "thought_leadership" }]) {
    const t = await call("newsletter_builder", args);
    const q = questions(t.slice(0, t.indexOf("## Subject Lines")));
    assert.equal(new Set(q).size, q.length, `a question printed twice: ${q.join(" | ")}`);
  }
});

const NT = {
  topic: "How developer and QA teams can test on every browser and device without a lab, from Testforge",
  key_points: "Build and release faster at scale (page words), AI agents at every step in an open and flexible test platform, on real devices with minimal latency",
  cta_goal: "book a conversation about Testforge", newsletter_type: "thought_leadership",
};

test("r4 newsletter: a pushback or a trial that came from the sector notes is labelled or left out, and the claims get an ask-for line", async () => {
  const t = await call("newsletter_builder", NT);
  const draft = t.slice(0, t.indexOf("## Subject Lines"));
  assert.doesNotMatch(draft, /often say|measured in a trial|free trial/i, "a claim about readers that the input never made");
  if (/push back|pushback/i.test(draft)) assert.match(draft, /sector notes/i, "an unlabelled sector pushback");
  assert.match(draft, /What to ask for|ask for/i);
});

const NC = {
  topic: "How owners and general contractors can stop processes taking people away from the project, from Slabforge",
  key_points: "when processes take people away from the project, things slow down and mistakes get made; the page cites an average increase in margins of 3.7% (page claims; based on a 2022 survey of customers), manage change in real time and keep billing on one record",
  cta_goal: "book a conversation about Slabforge", newsletter_type: "thought_leadership",
};

test("r4 newsletter: the statistic hook is a hook, not an instruction, and the closing questions use the user's own words", async () => {
  const t = await call("newsletter_builder", NC);
  const hook = (t.match(/### Hook \d: Statistic\n> ([^\n]+)/) || [])[1] || "";
  assert.ok(hook, "a statistic hook");
  assert.doesNotMatch(hook, /^(?:Open|Use|Start|Begin|Lead) /, hook);
  assert.match(hook, /3\.7%/);
  assert.match(hook, /\(page claims; based on a 2022 survey of customers\)/);
  const q = questions(t.slice(0, t.indexOf("## Subject Lines")));
  assert.ok(q.some((x) => /things slow down|mistakes get made|processes take people/.test(x)), `no question uses the user's words: ${q.join(" | ")}`);
});

const TL = {
  topic: "keeping a services provider's quality steady during a transition",
  your_take: "Brightmoor's view on transitions has 2 parts: agree service levels before any work moves; run a shadow period so the new team learns the knowledge base",
  target_reader: "Heads of IT operations at mid-size insurers",
  proof_points: "Named an Exceptional Performer for Overall Client Satisfaction in the 2025 Sourcing Study (page claim), Named a Leader in the 2026 Services Wave (page claim), Case study: a regional insurer cut handling time by 20% over a year (page claim), Rated 4.8 out of 5 across 598 reviews as of August 2026 (page claim), Marta Lind, Head of Operations at a regional insurer, says: 'We moved 40 people in six weeks and service levels held.' (customer quote)",
  author_background: "Head of transitions at Brightmoor",
  num_articles: 3, article_type: "framework",
};

test("r4 thought leadership: a recognition is never shown as a result, 'Case study:' is not pasted, a credibility line keeps its label", async () => {
  const t = await call("thought_leadership_series", TL);
  quality(t, "r4 tl");
  assert.doesNotMatch(t, /(?:The evidence|One result on record|Here is a result): (?:Named an? |Case study:)/, "a recognition or a pasted label shown as a result");
  const cred = t.split("\n").filter((l) => /Credibility line/.test(l)).join("\n");
  assert.match(cred, /Exceptional Performer/);
  assert.match(cred, /4\.8 out of 5[^\n]*\(page claim\)/, "the label was lost on a credibility line");
  assert.match(t, /Marta Lind[^\n]*"We moved 40 people in six weeks and service levels held\.?"/, "a quote is quoted");
});

test("r4 thought leadership: a niche topic read as general software gets no generic software questions or buying group", async () => {
  const t = await call("thought_leadership_series", {
    topic: "a continuous localization and translation management platform for software teams",
    your_take: "Glossmint's view on continuous localization and translation management platform (translation management system) has 2 parts: one system that connects product and marketing teams, with continuous localization built into the developer workflow; it bills on processed words, not on stored translation memory",
    target_reader: "product, engineering, localization and marketing teams at software companies and global enterprises",
    author_background: "Glossmint team (continuous localization and translation management platform)",
    proof_points: "a product team shipping in 12 locales without a release delay (customer story headline), 3x faster review cycles (page claim)",
    num_articles: 3, article_type: "framework",
  });
  const body = t.slice(0, t.indexOf("## Sector Notes"));
  assert.doesNotMatch(body, /before they get value|budget owner of the function signs|time to first value/i);
  assert.match(body, /Then take this question into the next meeting: "[^"]*(?:localiz|translat|developer|strings?|locales?)/i, "the question comes from the take");
});
