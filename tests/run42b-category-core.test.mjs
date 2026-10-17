// Run 42 round 2: the seller's category and the core of its description decide the sector (a feature inside the product does not),
// services and connectivity wording decide their sectors, a bare name and title is never proof, and objection scripts use the inputs.
// Run: npm run build && node --no-warnings --test tests/run42b-category-core.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readContext } from "../dist/sector.js";
import { parseProof } from "../dist/draft.js";
import { call } from "./run22-rw-helpers.mjs";

test("a category phrase for supply chain beats an AI label and a product's AI agents", () => {
  const c = readContext(undefined, { seller: ["Acme, An AI execution platform for supply chain: a network of carriers, digital twins of shipments, and AI agents that do carrier work"] });
  assert.equal(c.v?.id, "logistics-tech");
});

test("a feature list with one ambiguous item (documents, invoices) does not name the sector", () => {
  const list = "Real-time tracking, ETAs, dock appointments, yard analytics, carrier follow-up by email, supplier document processing, agent workflows";
  const c = readContext(undefined, { seller: ["Acme", list] });
  assert.notEqual(c.v?.id, "ai-native");
  const d = readContext(undefined, { seller: ["Beta", "Leasing, accounting, procure to pay, bill pay, facilities, resident portal, utilities, analytics, native AI agents"], context: ["Teams spend half a day scanning, coding and submitting invoices"] });
  assert.notEqual(d.v?.id, "fintech");
});

test("services wording means the services sector and model", () => {
  const c = readContext(undefined, { seller: ["Gamma, An agentic AI-powered intelligent operations and transformation company: finance and accounting, procurement, analytics, technology services", "66,000+ employees; 65 delivery centers in 13 countries"] });
  assert.equal(c.v?.id, "ites");
  assert.equal(c.model, "services");
});

test("connectivity wording means telecom, and a company name with Services in it names no sector", () => {
  const c = readContext(undefined, { seller: ["Delta: dark fibre, wavelengths, Ethernet, IP transit, SIP trunking, cloud connectivity"] });
  assert.equal(c.v?.id, "telecom");
  const n = readContext(undefined, { seller: ["Delta Technology Services"], buyer: ["a Delta Technology Services customer (capital markets)"] });
  assert.equal(n.v, null);
});

test("a name and title alone is never a proof item, however it was split", () => {
  for (const typed of [
    "Tracy Weston; Controller; Property Management Accounting: having all utilities on one platform is a major win and keeps things simple., A customer saved over 300 hours (page claim)",
    "Tracy Weston, Controller, Property Management Accounting: having all utilities on one platform is a major win and keeps things simple., A customer saved over 300 hours (page claim)",
  ]) {
    const items = parseProof(typed);
    assert.equal(items.length, 2, JSON.stringify(items.map((x) => x.text)));
    assert.equal(items[0].kind, "quote");
    assert.match(items[0].text, /^Tracy Weston, Controller, Property Management Accounting: having all utilities/);
  }
  assert.deepEqual(parseProof("Tracy Weston, Controller").map((x) => x.text), []);
  const per = parseProof("Virgin Atlantic won 54% of chargebacks with Acme; per Angela Maguire; Manager; Agency; Refunds and Chargebacks (page claim)");
  assert.equal(per.length, 1, JSON.stringify(per.map((x) => x.text)));
});

test("sales kit: a quote is matched to the value proposition it supports, and objection scripts name the persona and product", async () => {
  const r = await call("sales_enablement_content", {
    product: "Acme, Property management software: leasing, accounting and maintenance in one platform",
    target_persona: "Controller, Property Management Accounting at multifamily",
    proof_points: "Tracy Weston; Controller; Property Management Accounting: having all utilities managed on one platform for all properties is a major win.",
    value_props: "One platform for every property; agents run inside the operator's own policies",
    common_objections: "Owners want reports in their own format",
    sales_stage: "discovery",
  });
  const text = typeof r === "string" ? r : JSON.stringify(r);
  assert.ok(!/Proof:\* none of your proof points bears on this one\\n[^]*?\*\*2\./.test(text) || /One platform for every property[^]{0,200}Tracy Weston, Controller/.test(text));
  assert.match(text, /Which part of that matters most to a Controller/);
  assert.match(text, /how Acme handles that/);
  assert.ok(!/Tracy Weston, Controller["'.]?\s*(?:\n|$)/.test(text));
});
