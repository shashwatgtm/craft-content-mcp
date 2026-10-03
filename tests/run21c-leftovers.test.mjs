// Run 21c job 2 (test first): craft_content_improver took the first line that was not a greeting as the seller's words. In a sales email that line is often
// about the reader ("Many IT infrastructure heads at banks tell us ..."), so a telecom seller read as fintech. The line that states what the sender sells
// ("X is ...", "X helps ...") now comes first. Plain words, no names. Run: npm run build && node --test tests/run21c-leftovers.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  assert.ok(!j.result.isError);
  return j.result.content.map((c) => c.text).join("\n");
};

test("craft_content_improver: a sales email that talks about banks first still reads the sender's product (managed SD-WAN is telecom)", async () => {
  const content = "Subject: Quick question about branch outages\nHi {first name},\nI noticed your team is growing fast. Many IT infrastructure heads at banks, retail chains and manufacturers with 50+ branches tell us they struggle with branch outages across local internet providers.\nBrightline Managed SD-WAN is managed SD-WAN and business internet for companies with many branches, with one contract and an uptime commitment.\nWould you be open to a 20-minute call next week?\nThanks,\nPriya, Brightline";
  const t = await call("craft_content_improver", { content, content_type: "sales_email", goal: "book a first meeting", audience: "IT infrastructure heads at banks" });
  assert.match(t, /Sector: read from your inputs as telecom/);
});
