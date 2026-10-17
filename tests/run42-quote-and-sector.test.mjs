// Run 42: (1) a quote or an attributed statement stays whole with its speaker and is never chopped into a name, a title and fragments;
// (2) the seller's own category outweighs one ambiguous word and the words about its customers' industries; weak or conflicting
// signals read as no sector (neutral B2B wording), not as a confident wrong sector.
// Run: npm run build && node --no-warnings --test tests/run42-quote-and-sector.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { call } from "./run22-rw-helpers.mjs";
import { parseProof } from "../dist/draft.js";
import { readContext } from "../dist/sector.js";

const ATTRIBUTED = [
  "Hope Barrett, Director of Product Management at SoundCloud: MoEngage's support teams helped migrate 200 live campaigns from the previous platform in 12 weeks.",
  "Sandile Sikhondze, Head of Technology Payments at Standard Bank, says Zensar's journey from a staff augmentation vendor to a strategic managed services partner brought greater stability, increased productivity and deeper alignment.",
  "Head of International Trade Product Management at Kbank: 'We have many criteria: The network, the connectivity, a good commercial team, good after-sales service. And Nium fulfills every criteria that we have.'",
];

test("an attributed statement or quote stays one whole item, whether typed with commas or semicolons", () => {
  for (const t of ATTRIBUTED) {
    for (const typed of [t, t.replace(/, /g, "; ")]) {
      const items = parseProof(typed);
      assert.equal(items.length, 1, JSON.stringify(items.map((x) => x.text)));
      assert.equal(items[0].kind, "quote");
      assert.match(items[0].text, /^(?:Hope Barrett, |Sandile Sikhondze, )?(?:Director|Head)/);
    }
  }
});

test("a bare name, title or fragment is never an item of its own; ordinary result lists still split", () => {
  const items = parseProof("Jane Roe; Chief Executive Officer at Fabrikam; says the rollout finished early; Cut costs 30%; Doubled output in 4 months");
  assert.ok(items.every((x) => !/^(?:Jane Roe|Chief Executive Officer at Fabrikam)$/.test(x.text)), JSON.stringify(items.map((x) => x.text)));
  assert.ok(items.some((x) => /^Jane Roe, Chief Executive Officer at Fabrikam, says the rollout finished early/.test(x.text)));
  assert.ok(items.length >= 3);
});

test("tools keep the quote whole and the speaker attached", async () => {
  for (const tool of ["case_study_generator", "testimonial_capture"]) {
    const args = tool === "case_study_generator"
      ? { customer_name: "a Northwind customer", customer_industry: "retail", your_product: "Northwind", mode: "full", challenge: "Stores run out of stock", solution: "Replenishment planning", results: ATTRIBUTED[1] }
      : { customer_name: "Sandile Sikhondze", customer_company: "Standard Bank", your_product: "Northwind", success_story: ATTRIBUTED[1], testimonial_type: "reference_call" };
    const r = await call(tool, args);
    assert.match(r, /Sandile Sikhondze, Head of Technology Payments at Standard Bank, says Zensar's journey/);
    assert.doesNotMatch(r, /^- (?:Sandile Sikhondze|Head of Technology Payments at Standard Bank|says Zensar's journey[^\n]{0,80}stability|increased productivity and deeper alignment)\.?$/m);
  }
});

const read = (raw) => readContext(undefined, raw).v?.id ?? null;

test("one ambiguous word in the seller's description does not name a sector", () => {
  assert.equal(read({ seller: ["Acmeflow", "Warehouse data activation, analytics, journeys across 16+ channels, transactional alerts"], context: ["Marketing teams need to win outcomes, with data scattered across channels"], buyer: ["travel and hospitality"] }), null);
  assert.equal(read({ seller: ["Acmeflow", "Enterprises must modernize applications, data, cloud and security while keeping systems running"], role: ["CIO at banking and financial services"], buyer: ["banking and financial services"] }), null);
});

test("a clear seller category still names its sector", () => {
  assert.equal(read({ seller: ["a warehouse management system with slotting, picking and dock scheduling for distribution centres"] }), "logistics-tech");
  assert.equal(read({ seller: ["managed detection and response with a 24x7 security operations centre"] }), "cybersecurity");
});

test("a list of customer industries is not the seller's sector", () => {
  assert.equal(read({ seller: ["", "book a conversation about Acmeflow"], context: ["How 400+ enterprises across banking and financial services, manufacturing, retail and telecom can modernize"], buyer: ["400+ enterprises across banking and financial services, manufacturing, retail and telecom"] }), null);
});

test("job titles still count when the seller names no sector", () => {
  assert.equal(read({ seller: ["Cloudmoat", "Ranking cloud exposure before alerts"], role: ["CISOs at mid-size fintech and SaaS companies"] }), "cybersecurity");
});
