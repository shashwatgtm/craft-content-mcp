// Run 27B (b): optional named list fields for three tools (webinar_script, thought_leadership_series, sales_enablement_content: the tools of this server whose top fault on pool P5 after fix (g) was still input ignored, cut or garbled) (owner decision "(g) and (b) together"; input schemas of these tools only).
// Each list entry is read whole: never cut at a comma or a semicolon. The old free text fields still work (every older test passes unchanged).
// Plain words only, no real company (rule B81). Loads dist (run npm run build first). Run: node --test tests/run27b-lists.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const rpc = async (method, params) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  }));
  return (await r.json()).result;
};
const call = async (name, args) => { const r = await rpc("tools/call", { name, arguments: args }); return { isError: !!r.isError, text: r.content.map((c) => c.text).join("\n") }; };

test("tools/list: the three tools offer the new list fields as optional inputs, and testimonial_capture does not", async () => {
  const tools = (await rpc("tools/list", {})).tools;
  const want = { webinar_script: ["takeaways_list"], thought_leadership_series: ["proof_list"], sales_enablement_content: ["proof_list", "value_props_list", "objections_list"] };
  for (const [name, fields] of Object.entries(want)) {
    const t = tools.find((x) => x.name === name);
    for (const f of fields) { assert.equal(t.inputSchema.properties[f].type, "array", `${name}.${f}`); assert.ok(!t.inputSchema.required.includes(f), `${name}.${f} optional`); }
  }
  assert.ok(!("success_story_list" in tools.find((x) => x.name === "testimonial_capture").inputSchema.properties));
});

test("webinar_script: each takeaway entry is one takeaway, also with a semicolon inside", async () => {
  const r = await call("webinar_script", { topic: "How store teams can finish tasks on time", target_audience: "Heads of retail operations", webinar_type: "educational", duration: "45_min",
    takeaways_list: ["one list of store tasks; photo proof for each", "why audits on paper delay fixes by weeks"], include_polls: false, product_mention_level: "subtle" });
  assert.equal(r.isError, false);
  assert.match(r.text, /one list of store tasks, photo proof for each/i);
  assert.doesNotMatch(r.text, /You will see photo proof for each\./);
});

test("thought_leadership_series: each proof entry is read whole, a quote with its speaker", async () => {
  const r = await call("thought_leadership_series", { topic: "store operations", your_take: "store tasks only get done when each one has an owner and a proof", target_reader: "heads of retail operations",
    proof_list: [{ text: "Head of Operations at a grocery chain: \"We see every store's tasks in one place; nothing is lost in chat now.\"", label: "customer quote" }, { text: "Stores finished 30% more tasks on time in the first quarter", label: "case study; page claim" }],
    num_articles: 3, article_type: "framework" });
  assert.equal(r.isError, false);
  assert.match(r.text, /We see every store's tasks in one place; nothing is lost in chat now\./);
  assert.match(r.text, /Head of Operations at a grocery chain/);
});

test("sales_enablement_content: value props, proof and objections from the lists, with the answer the user has", async () => {
  const r = await call("sales_enablement_content", { product: "Shelfwise, store operations software", target_persona: "Head of Operations at a grocery chain", proof_points: "see the list",
    proof_list: [{ text: "Stores finished 30% more tasks on time in the first quarter", label: "case study; page claim" }],
    value_props_list: ["one list of store tasks, with photo proof, for every store"],
    objections_list: [{ question: "Can staff use shared phones; or do they need their own?", answer: "shared phones work with a store login" }], sales_stage: "discovery" });
  assert.equal(r.isError, false);
  assert.match(r.text, /one list of store tasks, with photo proof, for every store/);
  assert.match(r.text, /### Objection 1: "Can staff use shared phones; or do they need their own\?"/);
  assert.match(r.text, /The answer you already have:\*\* shared phones work with a store login/);
});
