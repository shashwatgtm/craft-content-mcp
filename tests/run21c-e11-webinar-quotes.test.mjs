// Run 21c A2 (E11, test first): a takeaway that reads as a fragment is quoted inside the spoken line, and each speaker block is itself wrapped in quotes,
// so the script ended in nested quotes (words"" ###). Inside a speaker block the quoted fragments now use single quotes.
// Run: npm run build && node --no-warnings --test tests/run21c-e11-webinar-quotes.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "webinar_script", arguments: args } }) }));
  const j = await r.json();
  assert.ok(!j.result.isError);
  return j.result.content.map((c) => c.text).join("\n");
};

test("a fragment takeaway does not leave nested or doubled quotes in the speaker lines", async () => {
  const out = await call({
    webinar_type: "educational", topic: "Keeping change orders and the job budget in step", target_audience: "general contractors",
    key_takeaways: "post change orders to the budget, the day they are signed, with the field notes attached; read cost to budget each week, fast, with no extra tool; one clear owner for each open item, which cuts the back and forth",
  });
  assert.doesNotMatch(out, /""/);
  const blocks = [...out.matchAll(/\*\*SPEAKER:\*\*\n"([\s\S]*?)"(?=\s*\*Stage direction|\s*\n(?:###|\*\*|## |---)|\s*$)/g)].map((m) => m[1]);
  assert.ok(blocks.length >= 5);
  for (const b of blocks) assert.doesNotMatch(b, /"/, b.slice(0, 120));
});

// Run 21c round 3 (test first): with a product name but no host or product sentence, the script said "this session is hosted by <product>", a fact nobody gave.
test("the script does not say who hosts the session unless that was given", async () => {
  for (const webinar_type of ["educational", "product_demo"]) {
    const out = await call({ webinar_type, topic: "Keeping change orders and the job budget in step", target_audience: "general contractors", your_product: "Gridbeam", product_mention_level: webinar_type === "product_demo" ? "heavy" : "subtle", key_takeaways: "post change orders the day they are signed; read cost to budget each week" });
    assert.doesNotMatch(out, /hosted by/i, webinar_type);
  }
});
