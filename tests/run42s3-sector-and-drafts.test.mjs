// Run 42B round S3: hidden sector flavour removed from the general notes (vertical SaaS served industry, SaaS for freelancers and small
// businesses, logistics fleets, software for non-engineering teams), quotes kept whole with their speakers, the content improver's
// subject line, capital and self-reference slips, and framework headlines from a take typed as what the product does.
// Run: npm run build && node --test tests/run42s3-sector-and-drafts.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { readContext, splitItems } = await import(new URL("../dist/sector.js", import.meta.url));
const { gerundSubject } = await import(new URL("../dist/thought-leadership.js", import.meta.url));
const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};
const SMB = /Owner or Managing Director|Head of Finance|accounting, ERP|particular to the trade/;

test("vertical SaaS serving schools: roles, committee and questions come from the served industry, never trades or SMB defaults", () => {
  const c = readContext(undefined, { seller: ["A teaching and learning platform for K12 schools: planning and gradebook"], role: ["teachers at IB schools"] }, "vertical_saas");
  const all = JSON.stringify(c.v);
  assert.doesNotMatch(all, SMB);
  assert.equal(c.v.buyerRoles[0], "teachers");
  assert.match(c.v.committee, /at IB schools/);
  assert.ok(c.v.discovery.some((d) => /systems already in use at IB schools/.test(d)));
});

test("vertical SaaS with no served industry stays neutral; trades or small business words keep the owner-led notes", () => {
  const n = readContext(undefined, { seller: ["Vertical SaaS platform"] }, "vertical_saas");
  assert.doesNotMatch(JSON.stringify(n.v), SMB);
  const t = readContext(undefined, { seller: ["Vertical SaaS platform for small businesses in the trades"] }, "vertical_saas");
  assert.match(JSON.stringify(t.v), /Owner or Managing Director/);
});

test("webinar and sales kit for a school platform name no owner, finance head or ERP", async () => {
  const w = await call("webinar_script", { topic: "How K12 schools can cut planning time, with Classly", target_audience: "K12 schools and districts, independent and public", webinar_type: "educational", duration: "45_min", key_takeaways: "Teachers spend hours on planning, One place to plan and assess", your_sector: "vertical_saas" });
  assert.doesNotMatch(w, SMB);
  const s = await call("sales_enablement_content", { product: "Classly, a teaching and learning platform for K12 schools", target_persona: "teachers at IB schools", proof_points: "Not given", value_props: "One place to plan, teach and assess", your_sector: "vertical_saas" });
  assert.doesNotMatch(s, SMB);
  assert.match(s, /IB schools/);
});

test("SaaS for freelancers and small businesses: no buying committee of finance, IT and security, no team adoption measures", () => {
  const c = readContext(undefined, { seller: ["invoice and accounting software for small businesses"], role: ["freelancers and solopreneurs"] }, "saas");
  assert.doesNotMatch(c.v.committee, /finance, IT and security/);
  assert.match(c.v.committee, /freelancers/);
  assert.ok(!c.v.metrics.some((m) => /target team|seats/.test(m)));
  const big = readContext(undefined, { seller: ["B2B software for enterprise teams"] }, "saas");
  assert.match(big.v.committee, /finance, IT and security/);
});

test("logistics tech for fleets: measures come from the inputs' own words, not shipments and orders", () => {
  const c = readContext(undefined, { seller: ["Acme Platform"], context: ["Accidents, fuel costs and compliance rules add cost. A fleet of vehicles with telematics and drivers."] }, "logistics_tech");
  assert.ok(c.v.metrics.includes("fuel costs"), c.v.metrics.join(", "));
  assert.ok(!c.v.metrics.some((m) => /shipment|order/.test(m)));
  assert.ok(!c.v.discovery.some((d) => /goods have left|shipments/.test(d)));
  const ship = readContext(undefined, { seller: ["Shipment tracking for shippers and carriers"], context: ["orders and freight"] }, "logistics_tech");
  assert.ok(ship.v.metrics.some((m) => /shipment|order|on time/.test(m)));
});

test("software sold to IT teams for internal tools: no release, build or pipeline measures; developer tools keep them", () => {
  const c = readContext(undefined, { seller: ["A platform to build internal software with AI"], role: ["IT at manufacturers"] }, "software");
  assert.ok(!c.v.metrics.some((m) => /release|build time|lead time for changes/.test(m)), c.v.metrics.join(", "));
  const dev = readContext(undefined, { seller: ["CI/CD pipelines for engineering teams"] }, "software");
  assert.ok(dev.v.metrics.some((m) => /release/.test(m)));
});

test("a quote stays whole with its speaker; a plain list still splits", () => {
  assert.deepEqual(splitItems("Quote from Jo Smith, VP of Transport: Instead of juggling vendors, we now have one platform.; 7 tools replaced"), ["Quote from Jo Smith, VP of Transport: Instead of juggling vendors, we now have one platform.", "7 tools replaced"]);
  assert.deepEqual(splitItems("Hillside School of Prague, The Czech Republic: with Classly, goals are now linked to lesson plans, evidence and evaluation."), ["Hillside School of Prague, The Czech Republic: with Classly, goals are now linked to lesson plans, evidence and evaluation."]);
  assert.deepEqual(splitItems("Results: faster close, fewer errors, happier teams"), ["Results: faster close", "fewer errors", "happier teams"]);
});

test("case study: a split quote is never shown as an outcome", async () => {
  const t = await call("case_study_generator", { customer_name: "a Fleetly customer (transport)", customer_industry: "transport", your_product: "Fleetly", mode: "full", challenge: "Manual reporting and separate tools", solution: "Telematics and dash cams", results: "Quote from Jo Smith, VP of Transport: Instead of juggling vendors, we now have one platform.; Acme Haulage saves fuel with telematics (page customer story headline).", your_sector: "logistics_tech" });
  assert.doesNotMatch(t, /Quote from Jo Smith\.\s*$/m);
  assert.match(t, /customer quote: taken from the results/);
  assert.doesNotMatch(t, /^-?\s*Quote from Jo Smith\.?$/m);
});

const EMAIL = "Subject: Quick question about Vulnerabilities go unnoticed across web apps, mobile apps, APIs, cloud and network, and teams waste time on false positives\nHi,\nTeams at SaaS often deal with Vulnerabilities go unnoticed across web apps, mobile apps, APIs, cloud and network, and teams waste time on false positives instead of the real flaws.\nScanly is VAPT (vulnerability assessment and penetration testing) and compliance services plus Scanly, an AI-driven pentest platform that scans web apps, mobile apps, APIs, cloud and networks and ranks findings by risk.\nNetlink connectivity is Reliable high-speed connectivity and data centres for enterprises.\nWould you be open to a 20-minute call next week to see if this fits?\nThanks,\nThe Scanly team";
test("content improver: a pasted subject is cut to its first clause, 'deal with' + sentence and a capital after 'is' are fixed, and no cut ends on the sentence's own name", async () => {
  const t = await call("craft_content_improver", { content: EMAIL, content_type: "sales_email", audience: "CISO at SaaS", your_sector: "cybersecurity" });
  const improved = t.split("## Improved Version")[1].split("## Suggested Shorter Version")[0];
  const shorter = t.split("## Suggested Shorter Version")[1].split("## Before/After")[0];
  assert.match(improved, /^Subject: Vulnerabilities go unnoticed across web apps$/m);
  assert.match(improved, /often find that vulnerabilities go unnoticed/);
  assert.match(improved, /is reliable high-speed/);
  assert.match(shorter, /^Subject: Vulnerabilities go unnoticed across web apps$/m);
  assert.doesNotMatch(shorter, /plus Scanly\.$/m);
});

test("a certification is a claim, not a customer result", async () => {
  const { parseProof } = await import(new URL("../dist/draft.js", import.meta.url));
  assert.equal(parseProof("Certified SOC 2 Type 2, ISO 27001 and PCI DSS (page claims)")[0].kind, "claim");
  assert.equal(parseProof("Beta Mills cut downtime by 30% in a year (case study)")[0].kind, "result");
});

test("framework headlines: a take typed as what the product does reads as an activity", async () => {
  assert.equal(gerundSubject("Connects local payment rails"), "Connecting local payment rails");
  assert.equal(gerundSubject("Payments infrastructure for platforms"), "Payments infrastructure for platforms");
  const t = await call("thought_leadership_series", { topic: "a payments company that lets businesses accept payments everywhere through one platform", your_take: "Payly's view on a payments company: Connects local payment rails, card networks and business accounts into one infrastructure", target_reader: "businesses that sell in many countries", num_articles: 2, article_type: "framework", your_sector: "fintech" });
  assert.doesNotMatch(t, /Framework for Connects/);
});
