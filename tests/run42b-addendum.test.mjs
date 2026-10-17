// Run 42B addendum: sub industry notes only when the seller's own category words clearly name it; typed phrases are not split; claims keep their label.
// Run: npm run build && node --no-warnings --test tests/run42b-addendum.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readContext } from "../dist/sector.js";
import { splitList } from "../dist/draft.js";
import { call } from "./run22-rw-helpers.mjs";

test("a feature word in a long description does not name the sub industry (your_sector fixes the sector only)", () => {
  const seller = ["Acme Cloud, an AI-native dealership platform: unites a dealer management system, CRM, service lane technology, payments, payroll and analytics on one platform"];
  const c = readContext(undefined, { seller, context: ["Why not legacy systems"], role: ["sales teams at manufacturers"] }, "vertical_saas");
  assert.equal(c.v?.id, "vertical-saas");
  assert.equal(c.v?.subtype, undefined);
  assert.doesNotMatch(c.v?.name ?? "", /payroll/i);
  assert.doesNotMatch((c.v?.metrics ?? []).join(" "), /payroll|pay run/i);
  // the seller's own category phrase still selects it
  const d = readContext(undefined, { seller: ["Acme Pay, payroll software for restaurants and hotels: shifts, tips and wage rules"] }, "vertical_saas");
  assert.equal(d.v?.subtype, "industry-hr-payroll");
});

test("telecom by your_sector with no sub industry words keeps the general notes and no per-site connectivity model", async () => {
  const c = readContext(undefined, { seller: ["Acme customer"], role: ["Head of Product"] }, "telecom");
  assert.equal(c.v?.id, "telecom");
  assert.equal(c.v?.subtype, undefined);
  assert.equal(c.model, null);
  const t = await call("testimonial_capture", { customer_name: "contact at an Acme customer (name not given)", customer_company: "an Acme customer (parking apps)", success_story: "Acme is reliable and covers all of our markets.", testimonial_type: "written_quote", your_sector: "telecom" });
  assert.doesNotMatch(t, /cut-?over|per site|get a site stable/i);
  // a named sub industry in the seller's own category phrase is kept
  const m = readContext(undefined, { seller: ["Acme, a messaging platform and SMS API for developers: delivery reports, sender registration"] }, "telecom");
  assert.equal(m.v?.subtype, "cpaas-messaging");
});

test("AI native without a sub industry uses general task wording, not cases and decisions", () => {
  const c = readContext(undefined, { seller: ["Acme, an AI platform for marketing teams"] }, "ai_native");
  assert.equal(c.v?.id, "ai-native");
  const all = [...(c.v?.discovery ?? []), ...(c.v?.metrics ?? []), ...(c.v?.vocabulary ?? [])].join(" | ");
  assert.doesNotMatch(all, /cases? or (?:a )?decisions?|cost per case|case review/i);
  assert.ok((c.v?.discovery ?? []).length >= 5);
});

test("a typed phrase is one item, and a place list cut at semicolons stays together", () => {
  assert.deepEqual(splitList("design, review and handoff in one place"), ["design, review and handoff in one place"]);
  assert.deepEqual(splitList("G2 and TrustRadius"), ["G2 and TrustRadius"]);
  const v = splitList("Recognised as a Leader by an analyst firm and a Great Place to Work in India; the UK; the USA; KSA and the UAE (page claims)");
  assert.equal(v.length, 1);
  assert.deepEqual(splitList("Fast setup; Strong support"), ["Fast setup", "Strong support"]);
});

test("an unlabelled vendor claim in the takeaways is labelled, not spoken as the problem", async () => {
  const t = await call("webinar_script", { topic: "How dealers can address legacy systems were not built for dealerships: disconnected tools and duplicate entry, with Acme Cloud", target_audience: "dealer groups", webinar_type: "educational", duration: "45_min", key_takeaways: "Legacy systems were not built for dealerships: disconnected tools and duplicate entry, Everything is unified on one platform with embedded AI, so integrations between sales and service are not needed", include_polls: false, your_sector: "vertical_saas" });
  const ctxAt = t.indexOf("### Context Setting");
  const context = t.slice(ctxAt, t.indexOf("###", ctxAt + 10));
  assert.doesNotMatch(context, /Everything is unified/);
  assert.match(t, /unified on one platform[^\n]*\(the vendor's description\)/);
});

test("a thought leadership headline from a seller description names the kind of company, not a fragment", async () => {
  const t = await call("thought_leadership_series", { topic: "billing, payment and interaction platform provider delivering purpose-built service capabilities", your_take: "Most providers buy for features, the winners buy for outcomes", target_reader: "billers and service providers", article_type: "framework", your_sector: "fintech" });
  const heads = [...t.matchAll(/\*\*Headline:\*\* (.+)/g)].map((m) => m[1]);
  assert.ok(heads.length >= 3);
  for (const h of heads) assert.doesNotMatch(h, /Delivering|Purpose-built/, h);
  assert.match(heads[0], /Platform Provider$/);
});
