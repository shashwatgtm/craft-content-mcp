// Run 42B round P: one gate for sub industry lines; quotes keep their own speaker; teasers and rankings are not proof; headlines are whole phrases; sales_enablement objections.
// Run: npm run build && node --no-warnings --test tests/run42b-roundP.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readContext, subIndustryFor } from "../dist/sector.js";
import { splitProof } from "../dist/draft.js";
import { SUBTYPES, VERTICALS } from "../dist/verticals.js";
import { call } from "./run22-rw-helpers.mjs";

const SECTOR_ID = { logistics_tech: "logistics-tech", fintech: "fintech", saas: "saas", vertical_saas: "vertical-saas", ai_native: "ai-native", ites: "ites", telecom: "telecom", software: "software", cybersecurity: "cybersecurity" };

function tools(seller) {
  return {
    case_study_generator: { customer_name: "a customer of Acme", your_product: seller, challenge: "Work was slow", solution: "Acme", results: "Cut time by 20% (hypothetical)" },
    newsletter_builder: { topic: "Where the work goes", cta_goal: "book a call", your_product: seller },
    webinar_script: { topic: "Where the work goes", target_audience: "managers", webinar_type: "educational", your_product: seller },
    content_repurposer: { source_content: `${seller}: what to do about slow work\nTeams lose time on manual steps. Acme removes some of them.`, source_type: "blog_post" },
    thought_leadership_series: { topic: seller, your_take: "Most teams buy for features", target_reader: "managers", num_articles: 3 },
    testimonial_capture: { customer_name: "a contact", customer_company: "a customer of Acme", success_story: "Acme saved us time.", testimonial_type: "written_quote", your_product: seller },
    sales_enablement_content: { product: seller, target_persona: "managers", proof_points: "Acme cut manual steps by 20% (hypothetical)" },
    craft_content_improver: { content: `Subject: Quick question\n\nHello, ${seller}. We help teams save time. Worth a call?`, content_type: "email" },
  };
}

test("for every sector, a description without sub industry words gets no sub industry lines in any tool", async () => {
  const seller = "Acme, a platform for teams";
  for (const [sector, id] of Object.entries(SECTOR_ID)) {
    const base = VERTICALS.find((v) => v.id === id);
    const general = new Set([...base.vocabulary, ...base.metrics, ...base.buyerRoles, ...base.discovery, ...base.objections.map((o) => o.objection), base.proofShape, base.committee].map((x) => x.toLowerCase()));
    const specific = [];
    for (const st of SUBTYPES.filter((x) => x.vertical === id)) {
      for (const x of [...st.notes.vocabulary, ...st.notes.metrics, ...st.notes.buyerRoles, ...st.notes.discovery, ...st.notes.objections.map((o) => o.objection), st.notes.proofShape, st.notes.committee]) {
        if (x.length >= 8 && ![...general].some((g) => g.includes(x.toLowerCase()))) specific.push(x.toLowerCase());
      }
    }
    const c = readContext(undefined, { seller: [seller], context: ["Why teams switch"], role: ["managers"] }, sector);
    assert.equal(c.v?.subtype, undefined, sector);
    for (const [name, args] of Object.entries(tools(seller))) {
      const t = (await call(name, { ...args, your_sector: sector })).toLowerCase();
      const neutral = (await call(name, { ...args, your_sector: "other" })).toLowerCase();   // words the tool itself uses are not sector lines
      const hit = specific.find((x) => t.includes(x) && !neutral.includes(x));
      assert.ok(!hit, `${sector} ${name}: sub industry line "${hit}"`);
    }
  }
});

test("a generic job management phrase does not name field service; its own words do", () => {
  const fs = SUBTYPES.find((x) => x.id === "field-services");
  assert.ok(fs, "field service sub industry exists");
  assert.equal(subIndustryFor(["Acme, total job management software designed for residential builders: estimates and bids"], fs), false);
  assert.equal(subIndustryFor(["Acme, field service software for HVAC and plumbing contractors"], fs), true);
  const c = readContext(undefined, { seller: ["Acme, total job management software designed for residential builders: estimates and bids"], context: ["slow bids"] }, "vertical_saas");
  assert.equal(c.v?.subtype, undefined);
  assert.doesNotMatch((c.v?.metrics ?? []).join(" "), /first time fix|technician/i);
});

test("a quote keeps its own speaker, and the next customer's name is never spliced in", () => {
  const items = splitProof("Pua Pakele; Founder at RBL Media: I use Calendly every single day. Without it; I honestly couldn't run my business., Marques Stewart; Managing Director of Technology at Achievement First: Calendly helps us protect our team's time.");
  assert.equal(items.length, 2);
  assert.doesNotMatch(items[0], /Marques/);
  assert.match(items[1], /^Marques Stewart, Managing Director/);
  const k = splitProof("Jaime Hommerding; XPRES Kitchen & Bath: Now; everything is in one location; and managing projects has become significantly easier., Nook Construction cut estimating time from days to hours (page case study).");
  assert.match(k[0], /^Jaime Hommerding, XPRES Kitchen & Bath: Now, everything is in one location/);
  assert.equal(k.length, 2);
});

test("two proof points are never merged, a financing teaser and a ranking are not proof", async () => {
  const t = await call("thought_leadership_series", { topic: "a freight forwarder and customs broker", your_take: "One partner beats many", target_reader: "shippers", proof_points: "Kitchenware brand Acme Foods uses Acme Capital to fund its cash flow cycle (page case study teaser)., A trade magazine names the Acme Customs Suite one of the Best Inventions of 2026 (page banner).", your_sector: "logistics_tech" });
  assert.doesNotMatch(t, /\)\.,\s+A trade magazine/);
  assert.match(t, /none of your proof points is a customer result/);
  assert.doesNotMatch(t, /\*\*Lead proof point:\*\* Kitchenware/);
});

test("headlines never end in a stray comma", async () => {
  const t = await call("thought_leadership_series", { topic: "scheduling and meeting management platform, built to handle all of the work around meetings", your_take: "One place beats three tools", target_reader: "teams", article_type: "framework", your_sector: "saas" });
  const heads = [...t.matchAll(/\*\*Headline:\*\* (.+)/g)].map((m) => m[1]);
  assert.ok(heads.length >= 3);
  for (const h of heads) assert.doesNotMatch(h, /,/, h);
});

test("sales_enablement: a given objection is not reported as none given, each gets its own reframe, the strongest proof is kept, #1 is no proof", async () => {
  const t = await call("sales_enablement_content", {
    product: "Acme, estimating software for residential builders: takeoffs, bids and invoicing", target_persona: "builders and owners at residential builders",
    proof_points: "Nook Builders cut estimating time from days to hours (page case story); Jo Smith, Nook Builders: Now everything is in one place.",
    value_props: "Ranked #1 construction estimating software (page claim); live supplier pricing in every estimate", competitor_objections: "Why not manual estimating on paper", your_sector: "vertical_saas",
  });
  assert.doesNotMatch(t, /You didn't provide objections/);
  assert.match(t, /competitor_objections/);
  const reframes = [...t.matchAll(/\*\*Reframe:\*\*\n> (.+)/g)].map((m) => m[1]);
  assert.ok(reframes.length >= 3);
  assert.equal(new Set(reframes).size, reframes.length, "no identical reframe repeated");
  assert.doesNotMatch(t, /to a builders and owners/);
  assert.match(t, /strongest (?:proof )?you gave is: Nook Builders cut estimating time/);
  assert.match(t, /a ranking claim from a page is not proof/);
  assert.ok(t.indexOf("live supplier pricing") < t.indexOf("Ranked #1"), "ranking claim is not the lead");
});

test("content_repurposer keeps the strongest result next to a quote", async () => {
  const t = await call("content_repurposer", { source_content: "total job software for builders: what to do about slow bids\nBuilders lose work to slow bids. Acme gives them estimates in hours.\nAt Acme we built an estimating tool.\nProof: Jo Smith; Nook Kitchens: Now; everything is in one place., Nook Builders cut estimating time from days to hours (page case story).", source_type: "blog_post", your_sector: "vertical_saas" });
  assert.match(t, /Nook Builders cut estimating time from days to hours/);
  assert.match(t, /Jo Smith, Nook Kitchens: Now, everything is in one place/);
  assert.doesNotMatch(t, /first time fix|per technician/i);
});
