// Run 21b late task (written before the fix): tables inside one repo that are keyed by the sector must use their stock wording only for
// the kind of company they were written for. The one such table in this repo is the IT buyer lens in src/sector.ts: its committee line
// named a distributor system ("DMS"), which belongs to field sales automation for consumer brands only. Two companies of the same
// vertical (vertical software), described in plain words, are called through the repo's own MCP handler with an IT buyer.
// Run: npm run build && node --test tests/run21-tables-craft-content.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const j = await r.json();
  assert.ok(!j.result.isError, `${name} returned an error`);
  return j.result.content.map((c) => c.text).join("\n");
};

const CONSTRUCTION = { name: "Alder", sells: "Alder is construction management software for general contractors, covering site schedules, drawings and subcontractor payments", persona: "Head of IT at a general contractor" };
const FMCG = { name: "Brenn", sells: "Brenn is field sales automation for consumer brands, covering outlet visits, secondary sales and distributor orders", persona: "Head of IT at a consumer goods company" };

const calls = (c) => ({
  webinar_script: { topic: `What ${c.name} changes for the team`, target_audience: c.persona, webinar_type: "educational", duration: "45_min", key_takeaways: c.sells, your_product: c.name },
  thought_leadership_series: { topic: c.sells, your_take: `${c.name} changes how the work is organized`, target_reader: c.persona, num_articles: 3, article_type: "framework", author_background: `${c.name} team (${c.sells})` },
});

for (const tool of ["webinar_script", "thought_leadership_series"]) {
  test(`${tool}: the IT lens names the distributor system only for field sales automation`, async () => {
    const a = await call(tool, calls(CONSTRUCTION)[tool]);
    const b = await call(tool, calls(FMCG)[tool]);
    assert.match(a, /vertical (?:software|SaaS)|Vertical/i, "construction company read as vertical software");
    assert.match(a, /IT checks how it fits the systems already in place/, "the IT lens applies to the construction company");
    assert.doesNotMatch(a, /\bDMS\b/, "construction text names no distributor system");
    assert.match(b, /IT checks how it fits the systems already in place/, "the IT lens applies to the consumer brand company");
    assert.match(b, /\bDMS\b/, "field sales automation keeps its distributor system");
  });
}
