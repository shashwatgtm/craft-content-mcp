// Run 42B, set M fixes: newsletter point sorting, disclaimers, whole quotes, sub industry gate, your_sector model, company facts are not "the help offered".
// Companies are invented. Run: npm run build && node --no-warnings --test tests/run42b-ccM-fixes.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readContext } from "../dist/sector.js";
import { stripDisclaimers } from "../dist/rw-content.js";
import { call } from "./run22-rw-helpers.mjs";

test("newsletter: a capability sentence is not the problem, a where clause stays in its sentence, the intro count matches", async () => {
  const out = await call("newsletter_builder", {
    topic: "How teams of all sizes can tackle Teams juggle dozens of disconnected tools, with tasks in one place and chats in another; critical context gets lost between teams and tools, from Northwind Works",
    key_points: "Teams juggle dozens of disconnected tools, with tasks in one place and chats in another; critical context gets lost between teams and tools, Up to 30% faster handoffs (hypothetical figure), One platform built from the start for convergence instead of bundling fragmented tools or bolting on a chatbot; where the assistant sees tasks; docs and chats in real time",
    cta_goal: "book a conversation about Northwind Works",
    newsletter_type: "thought_leadership",
    your_sector: "saas"
  });
  assert.doesNotMatch(out, /###\s*\d\.\s*The problem/);
  const how = out.split(/###\s*\d\.\s*How it works/)[1] || "";
  assert.match(how, /One platform built[^\n]*where the assistant sees tasks, docs and chats in real time/);
  assert.doesNotMatch(out, /^- (?:Docs and chats in real time|Where the assistant sees tasks)\s*$/im);
  const intro = out.split("---")[1];
  assert.doesNotMatch(intro, /Two problems come up/);
});

test("stripDisclaimers: legal lines go, a colon keeps what follows, brackets stay closed", () => {
  assert.equal(stripDisclaimers("a payments app, not an insured bank; banking services provided through partner banks"), "a payments app");
  assert.equal(stripDisclaimers("Acme team (a payments app, not an insured bank; banking services provided by Partner Bank)"), "Acme team (a payments app)");
  assert.equal(stripDisclaimers("Acme's view on a payments app, not an insured bank; banking services provided by Partner Bank: Most apps wait, we do not"), "Acme's view on a payments app: Most apps wait, we do not");
  assert.equal(stripDisclaimers("plain text, with commas"), "plain text, with commas");
});

test("thought leadership: a disclaimer is never the topic, quotes stay whole, a source line keeps its result, a framework is laid out", async () => {
  const out = await call("thought_leadership_series", {
    topic: "a payments app, not an insured bank; banking services provided through partner banks",
    your_take: "Acme's view on a payments app, not an insured bank; banking services provided through partner banks: Unlike most apps, the product is built on software and everything can be done within the app in 1 to 2 minutes",
    target_reader: "small businesses and scaling companies",
    proof_points: "Jo Rivera; Founder; Orbit Labs: Unlike most apps; Acme is built on software. Everything can be done within the app in 1-2 minutes., Trade press quote on the About page: within days of an outage in March; Acme picked up more than 2 million in deposits (hypothetical figure) (page claim).",
    author_background: "Acme team (a payments app, not an insured bank; banking services provided through partner banks)",
    num_articles: 3,
    article_type: "framework",
    your_sector: "fintech"
  });
  const body = out.split("## Promotional Posts")[0];
  assert.doesNotMatch(body.split("### The framework")[0], /not an insured bank/i);
  assert.doesNotMatch(out.split("## Notes for you")[0], /A Framework for A Payments App/);
  assert.match(out, /Legal or regulatory wording left out/);
  assert.match(out, /"Unlike most apps, Acme is built on software\. Everything can be done within the app in 1-2 minutes/);
  assert.match(out, /within days of an outage in March; Acme picked up more than 2 million in deposits/);
  assert.match(out, /### The framework in \d steps\n\n1\. \*\*Start from the position:\*\*/);
  assert.match(out, /### Step 2 of the framework/);
});

test("sub industry: a global multi carrier shipping seller does not get the courier aggregator notes", () => {
  const seller = ["multi-carrier shipping software: one API and dashboard that connects merchants to carriers around the world"];
  const c = readContext(undefined, { seller, context: ["merchants and marketplaces"], role: [] }, "logistics_tech");
  assert.ok(!c.v?.subtype, `got ${c.v?.subtype}`);
  assert.ok(!/pin code|cash on delivery/i.test((c.v?.vocabulary || []).join(" ")));
  const india = readContext(undefined, { seller: ["courier aggregator for Indian online sellers: cash on delivery and pin code serviceability"], context: [], role: [] }, "logistics_tech");
  assert.equal(india.v?.subtype, "seller-shipping");
});

test("your_sector ites: network services in a product list does not make a connectivity business", () => {
  const c = readContext(undefined, { seller: ["Acme, IT services and consulting: application development, testing, cloud and network services, data and AI"], context: [], role: ["Chief Transformation Officer at banking"] }, "ites");
  assert.equal(c.model, "services");
  const stated = readContext(undefined, { seller: ["Acme managed IT services, charged per site on a term contract"], context: [], role: [] }, "ites");
  assert.equal(stated.model, "connectivity");
});

test("sales enablement: company revenue and a ranking are not the help offered and not paired with an unrelated case study", async () => {
  const out = await call("sales_enablement_content", {
    product: "Acme Services, IT services and consulting: application development, testing, cloud and network services",
    target_persona: "Chief Transformation Officer at banking",
    proof_points: "Featured case study headline: Globex cuts supplier onboarding from weeks to hours with automation (page claim)., Ranked 4th strongest IT services brand in a brand report (page claim)",
    value_props: "Revenue of more than 6 billion USD; a member of the Example Group; ranked as the 4th strongest IT services brand (page claims)",
    sales_stage: "discovery",
    your_sector: "ites"
  });
  const bridge = out.split("**Bridge (3 min):**")[1].split("**Next Step:**")[0];
  assert.doesNotMatch(bridge, /revenue|ranked|member of/i);
  assert.doesNotMatch(out, /Business model: connectivity/);
  const ranked = out.split("\n").filter((l) => /ranked as the 4th/i.test(l) && /Proof/i.test(l));
  assert.ok(!ranked.some((l) => /Globex/.test(l)));
  assert.doesNotMatch(out, /\*\*\d\. ranked as[\s\S]{0,80}\*Proof:\* Featured case study/i);
});
