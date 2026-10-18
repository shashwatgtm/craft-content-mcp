// Run 42B round U: the content improver cuts a subject at a whole phrase and splits a run-on proof line; the shorter email drops a pasted
// "find that" lead; a measure counts as named only when its words sit together; a quote typed with a semicolon speaker stays whole and a
// "number one" in a customer's words is not a ranking; a value proposition is not cut inside a run of describing words; a proof point backs a
// value proposition only by shared meaning words (not "minutes"); webinar instructions that follow each other are one sentence; the case study
// approach keeps its first clauses. Every company in these tests is invented.
// Run: npm run build && node --no-warnings --test tests/run42b-roundU.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { cutSubject } from "../dist/content-improver.js";
import { parseProof, splitList } from "../dist/draft.js";
import { semicolonCommaList } from "../dist/list-shape.js";
import { call } from "./run22-rw-helpers.mjs";

test("a subject is cut at a whole phrase, never inside a list of describing words or on a joining word", () => {
  assert.equal(cutSubject("Quick question about Orders are a traditionally long, complex and manual cycle; trucks queue at the gate and billing lacks visibility"), "Orders are a traditionally long, complex and manual cycle");
  const s = cutSubject("Quick question about Enterprises need specialized talent and reliable delivery without overextending internal teams, and complex vendors lack control");
  assert.ok(s && !/\b(?:without|and|or|to|of|the)$/i.test(s), s);
  const t = cutSubject("Quick question about Error prone and inefficient manual processes make it hard to know how jobs are performing, keep pricing consistent and control costs");
  assert.match(t, /^Quick question about error prone and inefficient manual processes$/);
});

const EMAIL = [
  "Subject: Quick question about Orders are a traditionally long, complex and manual cycle; trucks queue at the gate and billing lacks visibility",
  "Hi,",
  "Teams at shippers often deal with Orders are a traditionally long, complex and manual cycle; trucks queue at the gate and billing lacks visibility.",
  "Acme Freight is A cloud based platform with four solution areas: sourcing carriers, load matching, yard slots, and freight audit, plus planning tools and many more things for teams to use every day in many places.",
  "Quote from Jo Smith, Head of Freight, Acme: with this platform, we and our carriers save time and money.; Quote from Sam Lee, Director, Beta: with it, we reach a big database of carriers in cloud mode.; Case study headlines on the home page: Alpha Group on spot market volatility; and Gamma with Visibility.",
  "Would you be open to a 20-minute call next week to see if this fits?",
  "Thanks,",
  "The Acme team"
].join("\n");

test("the improver splits a run-on proof line and the shorter email drops the pasted lead", async () => {
  const out = await call("craft_content_improver", { content: EMAIL, content_type: "sales_email", audience: "Head of Procurement at shippers", your_sector: "logistics_tech" });
  const improved = out.slice(out.indexOf("## Improved Version"), out.indexOf("## Suggested Shorter Version"));
  assert.match(improved, /save time and money\. Quote from Sam Lee/, "the run of quotes is split into sentences");
  assert.match(improved, /Subject: Orders are a traditionally long, complex and manual cycle\n/);
  const shorter = out.slice(out.indexOf("## Suggested Shorter Version"), out.indexOf("*Built only from your own text"));
  assert.doesNotMatch(shorter, /often find that/, "the pasted lead is not kept");
  assert.match(shorter, /\nOrders are a traditionally long, complex and manual cycle/);
  assert.match(out, /Edits Made/);
});

test("a measure counts as named only when its words sit together", async () => {
  const far = "Subject: Hello\nHi,\nWe are first in many ways, and we listen to every one of you about the work you do each day across the whole of the year with a large number of other teams and our response comes in a few hours.\nThanks,\nA";
  const a = await call("craft_content_improver", { content: far, content_type: "sales_email", audience: "Head of Support at software companies", your_sector: "saas" });
  assert.doesNotMatch(a, /already speaks to: [^\n]*first response/i);
});

test("a quote typed with a semicolon speaker stays whole with its speaker; 'number one' in a customer's words is a quote; story headlines are titles", () => {
  const raw = "Quote from Jo Smith; Head of Freight Management; Acme: with transport assignment from Beta; we and our carriers save time and money., Quote from Sam Lee; Supply Chain Director South Europe; Gamma: the number one thing we can do is offer local payments at scale., Case study headlines on the home page: Alpha Group on spot market volatility; and Delta with Visibility.";
  const items = parseProof(semicolonCommaList(raw, "semicolon"));
  assert.equal(items.length, 3, JSON.stringify(items.map((i) => i.text)));
  assert.equal(items[0].kind, "quote");
  assert.match(items[0].text, /^Jo Smith, Head of Freight Management, Acme: with transport assignment from Beta, we and our carriers save time and money$/);
  assert.equal(items[1].kind, "quote", "number one inside a customer's words is not a ranking");
  assert.equal(items[2].kind, "title");
});

test("a user quote cut at semicolons before an acronym stays whole", () => {
  const raw = "Petabytes of data migrated and 30% lower cost (page claims; customer not named)., User quote: access to the cloud made setting up Python environments; CUDA and libraries a breeze; taking just 15 to 20 minutes; and it is great to see costs in INR (customer not named).";
  const items = parseProof(semicolonCommaList(raw, "semicolon"));
  assert.equal(items.length, 2, JSON.stringify(items.map((i) => i.text)));
  assert.equal(items[1].kind, "quote");
  assert.match(items[1].text, /Python environments, CUDA and libraries a breeze, taking just 15 to 20 minutes, and it is great to see costs in INR/);
});

test("a value proposition is not cut inside a run of describing words", () => {
  const props = splitList("Operated in production for consumer; industrial and public platforms with sustained traffic; financially backed availability; multi region infrastructure; built for developers; fast and reliable APIs");
  assert.equal(props[0], "Operated in production for consumer, industrial and public platforms with sustained traffic");
  assert.ok(props.includes("financially backed availability"));
  assert.ok(props.includes("built for developers"), "a plural ending is a whole phrase and stays apart");
});

test("a time word does not tie a proof point to a value proposition", async () => {
  const out = await call("sales_enablement_content", {
    product: "Acme Cloud, a cloud platform for compute", target_persona: "developers at consumer platforms",
    proof_points: "User quote: setting up the environment was a breeze; taking just 15 to 20 minutes; and costs are clear",
    value_props: "average first response under 15 minutes; multi region infrastructure", sales_stage: "discovery", your_sector: "ai_native"
  });
  const row = out.slice(out.indexOf("**1. average first response under 15 minutes**"));
  assert.match(row.split("**2.")[0], /none of your proof points speaks to this one/);
});

test("webinar instructions that follow each other are one sentence", async () => {
  const out = await call("webinar_script", {
    topic: "How construction businesses can address Error prone and inefficient manual processes make it hard to know how jobs are performing, keep pricing consistent and control costs, with Acme", target_audience: "contractors and remodelers", webinar_type: "educational", duration: "45_min",
    key_takeaways: "Error prone and inefficient manual processes make it hard to know how jobs are performing; keep pricing consistent and control costs, Get organized; finish projects on time; win more jobs with faster proposals and increase profit; rated 4.9 out of 5 on 140+ reviews (page claims), One platform for the whole contracting business with free implementation; training and support and unlimited jobs; documents and files (page claims)", your_sector: "vertical_saas"
  });
  assert.match(out, /1\. You will learn how to get organized, finish projects on time[^\n]*win more jobs with faster proposals/);
  assert.doesNotMatch(out, /\n2\. You will learn how to/);
});

test("the case study approach keeps its first clauses and the full text stays under The Solution", async () => {
  const solution = "Shared inbox with automatic assignment, workflows, SLA policies, live chat, SMS, WhatsApp, Instagram and Messenger, AI drafts, summaries and answers, a help center, beacon and contact forms, reports, integrations with Salesforce, Jira and HubSpot, SSO and SAML";
  const out = await call("case_study_generator", { customer_name: "a customer of Acme Desk (support teams)", customer_industry: "support teams", your_product: "Acme Desk", mode: "full", challenge: "Teams relying on email lose hours organizing", solution, results: "Customer quote, not named on the page: it cut our response times by about a third.", your_sector: "saas" });
  const approach = out.split("\n").find((l) => l.startsWith("**The approach.**"));
  assert.ok(approach && !approach.includes("SSO and SAML"), approach);
  assert.ok(out.includes("What was put in place: " + solution));
});
