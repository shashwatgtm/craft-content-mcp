// Run 42B: the optional your_sector input decides the sector; an unknown value is refused; without it, a boundary description stays neutral
// or takes the seller's own category. Run: npm run build && node --no-warnings --test tests/run42b-your-sector.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readContext } from "../dist/sector.js";
import { rpc, call, schemaOf } from "./run22-rw-helpers.mjs";

const NAMES = ["case_study_generator", "newsletter_builder", "webinar_script", "content_repurposer", "thought_leadership_series", "testimonial_capture", "sales_enablement_content", "craft_content_improver"];
const LIST = ["logistics_tech", "fintech", "saas", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity", "other"];

test("all eight tools declare an optional your_sector enum", async () => {
  for (const n of NAMES) {
    const s = await schemaOf(n);
    assert.deepEqual(s.properties.your_sector.enum, LIST, n);
    assert.ok(!s.required.includes("your_sector"), n);
  }
});

test("your_sector decides the sector over contrary text", () => {
  const seller = ["Acme, auto repair shop management software: estimates, card payments, financing and payouts", "payments, lending, banking, invoices, fraud"];
  const c = readContext(undefined, { seller, context: ["fraud checks on every payment"], buyer: ["a bank"] }, "vertical_saas");
  assert.equal(c.v?.id, "vertical-saas");
  assert.match(c.line, /set by your_sector as vertical SaaS/);
  const d = readContext(undefined, { seller: ["Acme platform for freight tracking and shipments"] }, "ites");
  assert.equal(d.v?.id, "ites");
  assert.equal(d.model, "services");
  const e = readContext(undefined, { seller: ["Acme payments API for banks"] }, "other");
  assert.equal(e.v, null);
  assert.match(e.line, /neutral B2B/);
  const f = readContext("saas", { seller: ["Acme"] }, "ites");
  assert.equal(f.model, "saas");
});

test("an unknown your_sector is refused without being echoed", async () => {
  const j = await rpc("tools/call", { name: "newsletter_builder", arguments: { topic: "Month-end close", cta_goal: "book a call", your_sector: "<b>evil</b>" } });
  const t = j.result.content.map((c) => c.text).join("\n");
  assert.match(t, /your_sector must be one of: logistics_tech, fintech/);
  assert.doesNotMatch(t, /evil|<b>/);
  const c = readContext(undefined, { seller: ["Acme payments API"] }, "<b>evil</b>");
  assert.doesNotMatch(c.line, /evil/);
});

test("your_sector reaches a tool answer", async () => {
  const t = await call("newsletter_builder", { topic: "Keeping bays full", cta_goal: "book a call", your_product: "Acme", your_sector: "vertical_saas" });
  assert.match(t, /vertical SaaS/);
  assert.doesNotMatch(t, /fintech/i);
});

test("without your_sector a boundary description is neutral or the seller's category, never the feature's sector", () => {
  const shop = readContext(undefined, { seller: ["Acme, auto repair shop management software: estimates, workflow, inspections, with card payments, financing and accounting built in"], context: ["Shops get paid after hours; payments, financing and accounting native to the platform"], role: ["technicians at independent auto repair shops"] });
  assert.notEqual(shop.v?.id, "fintech");
  const svc = readContext(undefined, { seller: ["Beta, A data and operations services company that began in business process services: data foundation, analytics, fraud and risk analytics, digital lending, finance and risk operations", "25+ years from business process services to data and AI"], context: ["fraud and risk analytics for insurers and banks"] });
  assert.equal(svc.v?.id, "ites");
  const net = readContext(undefined, { seller: ["Gamma, a network provider: managed security, SD-WAN, bandwidth, fibre and firewalls"], context: ["threat detection"] });
  assert.notEqual(net.v?.id, "cybersecurity");
  const agent = readContext(undefined, { seller: ["Delta, An end-to-end platform to build, activate and supervise AI agents grounded in company data, with audit logs, usage analytics and integration with the observability stack IT already uses"], context: ["support operations"], role: ["Director of Support Operations"] });
  assert.notEqual(agent.v?.id, "software");
  assert.doesNotMatch(agent.v?.name ?? "", /observab/i);
});

test("a name before its description is not split off as an item, and a cut never ends inside a phrase", async () => {
  const { splitItems } = await import("../dist/sector.js");
  const { shorten } = await import("../dist/rw-content.js");
  const a = splitItems("Acme Works; a creative agency: the director says they saved 5 hours; and the team agrees");
  assert.ok(a[0].startsWith("Acme Works, a creative agency"), a[0]);
  assert.deepEqual(splitItems("Phase One; Goal: speed; pilots"), ["Phase One", "Goal: speed", "pilots"]);
  const t = shorten("Shops across the board saw an average revenue increase of 40% in their first year of use", 66);
  assert.doesNotMatch(t, /\b(?:in|their|first)$/);
});

test("each public form and the docs carry the optional your_sector select", async () => {
  const { readFileSync } = await import("node:fs");
  for (const sl of ["case-study-generator", "newsletter-builder", "webinar-script", "content-repurposer", "thought-leadership-series", "testimonial-capture", "sales-enablement-content", "craft-content-improver"]) {
    const h = readFileSync(new URL(`../public/tools/${sl}/index.html`, import.meta.url), "utf8");
    assert.match(h, /name="your_sector"[^>]*><option value="">Not specified<\/option><option value="logistics_tech">/, sl);
  }
  const d = readFileSync(new URL("../public/docs/index.html", import.meta.url), "utf8");
  assert.equal((d.match(/<code>your_sector<\/code>/g) || []).length, 8);
});
