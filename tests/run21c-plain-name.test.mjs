// Run 21c round 3 (test first): a product typed as a long plain description with no name was cut to its first four words, which ended mid clause
// ("Before I tell you about Enterprise AI platform that, ..."; "Subject: Enterprise AI platform that next steps"). The short form now ends before the
// first joining word, so it is a noun phrase.
// Run: npm run build && node --no-warnings --test tests/run21c-plain-name.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { productParts } from "../dist/draft.js";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }) }));
  return (await r.json()).result.content.map((c) => c.text).join("\n");
};
const ENDS_MID_CLAUSE = /\b(?:that|which|who|where|for|with|to|by|on|in|of|and|or|the|a|an)$/i;

test("a long plain description gives a short name that does not end mid clause", () => {
  for (const d of [
    "Enterprise AI platform that connects to company tools and data: search, an assistant and agents",
    "Freight visibility software for shippers that tracks every load across carriers and modes",
    "Messaging platform for SMS and WhatsApp with templates, routing and delivery reports",
    "Route planning software that cuts empty miles for last mile delivery fleets",
    "Observability for cloud native engineering teams with traces, metrics and logs in one place",
    "Payments that settle in minutes for marketplaces and platforms across several countries",
  ]) {
    const n = productParts(d).name;
    assert.ok(n.split(/\s+/).length >= 1 && n.length > 0, d);
    assert.doesNotMatch(n, ENDS_MID_CLAUSE, `${d} -> ${n}`);
    assert.ok(n.split(/\s+/).length >= 2, `a one word name from a description: ${d} -> ${n}`);
  }
  assert.equal(productParts("Lanehop, a route planning platform for delivery fleets").name, "Lanehop");
  // a comma inside a list of what it covers is not the end of a name
  for (const d of [
    "Integrated travel, expense and payment management platform for enterprises: expense capture, approvals and prepaid cards",
    "Billing, invoicing and revenue recognition software for subscription companies",
  ]) {
    const n = productParts(d).name;
    assert.doesNotMatch(n, /^(?:Integrated travel|Billing)$/, `${d} -> ${n}`);
    assert.ok(n.split(/\s+/).length >= 2, `${d} -> ${n}`);
  }
});

test("sales_enablement_content does not print a clause fragment as the product name", async () => {
  const out = await call("sales_enablement_content", { content_type: "sales_email", product: "Enterprise AI platform that connects to company tools and data: search, an assistant and agents", target_persona: "CIO at a bank", sales_stage: "discovery" });
  assert.doesNotMatch(out, /Enterprise AI platform that[ ,.]|about Enterprise AI platform that/);
});
