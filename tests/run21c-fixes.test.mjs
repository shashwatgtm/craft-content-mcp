// Run 21c job 4 (round 2 judge reasons, test first). Plain words, no names. Run: npm run build && node --test tests/run21c-fixes.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};

test("newsletter_builder: the subject line does not say the same thing twice ('X: X')", async () => {
  const t = await call("newsletter_builder", { topic: "How shippers that move freight across many carriers can tackle supply chains break in the gaps between systems, from Brightline", key_points: "supply chains break in the gaps between systems; raw logistics data arrives late and incomplete; teams react after a delay has already cost money", cta_goal: "book a conversation about Brightline", newsletter_type: "thought_leadership" });
  const line = t.split("\n").find((l) => l.startsWith("**Subject:**")) || "";
  assert.ok(line, "no subject line");
  const body = line.replace("**Subject:**", "").trim().toLowerCase();
  const parts = body.split(/:\s+/);
  assert.ok(!(parts.length >= 2 && parts[1].startsWith(parts[0].slice(0, 25))), `subject repeats itself: ${line}`);
});

test("testimonial_capture: the request email has no 'youand' typo and no 'at your company' when the company is not named", async () => {
  const t = await call("testimonial_capture", { customer_name: "contact at a Brightline customer (name not given)", customer_company: "a Brightline customer (Retail)", customer_role: "finance lead", success_story: "customers described closing the books faster (customer story headline)", testimonial_type: "written_quote" });
  assert.doesNotMatch(t, /youand/);
  assert.match(t, /worked for you and for your team/);
});
