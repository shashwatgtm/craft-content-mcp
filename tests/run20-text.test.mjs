// Run 20 round 1, task B (ledger rows A17-O20, A17-O25 and the percentage rule): tool text in plain sentence case,
// richer one-line descriptions, num_articles hints that agree with what the code accepts, and no noisy percentage in an answer.
// Run: npm run build && node --test tests/run20-text.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const rpc = async (method, params) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  }));
  return r.json();
};
const call = async (name, args) => {
  const j = await rpc("tools/call", { name, arguments: args });
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
};
const { tools } = (await rpc("tools/list", {})).result;
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

// every text of every tool: its description and the description of each input
const texts = [];
for (const t of tools) {
  texts.push([`${t.name} description`, t.description]);
  for (const [k, p] of Object.entries(t.inputSchema.properties || {})) texts.push([`${t.name}.${k}`, p.description || ""]);
}

test("no ALL-CAPS word in any tool description or field hint (A17-O20)", () => {
  assert.ok(texts.length > 50);
  for (const [where, s] of texts) assert.doesNotMatch(s, /\b[A-Z]{3,}\b/, `${where}: ${s}`);
});

test("a hint does not start a word with a capital after 'Optional:' (sentence case, A17-O20)", () => {
  for (const [where, s] of texts) assert.doesNotMatch(s, /Optional: [A-Z]/, `${where}: ${s}`);
});

test("each tool description is one line that says what the tool needs and what it returns, with no figure (A17-O20)", () => {
  for (const t of tools) {
    const d = t.description;
    assert.doesNotMatch(d, /\n/, `${t.name}: one line`);
    assert.match(d, /^[A-Z]/, `${t.name}: starts with a capital`);
    assert.match(d, /\b(from|needs?)\b/i, `${t.name}: says what it needs`);
    assert.match(d, /\bReturns\b/, `${t.name}: says what it returns`);
    assert.match(d, /\bOptional\b/, `${t.name}: names the optional inputs`);
    assert.ok(d.length >= 220 && d.length <= 700, `${t.name}: length ${d.length}`);
    assert.doesNotMatch(d, /\d|\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/i, `${t.name}: no figure`);
    assert.doesNotMatch(d, /\b(guarantee\w*|always|never|best|proven|instantly|every)\b/i, `${t.name}: no promise word`);
  }
});

test("a field hint gives no figure of its own except the ones the code enforces (A17-O20)", () => {
  for (const [where, s] of texts) {
    if (where === "thought_leadership_series.num_articles") continue;
    assert.doesNotMatch(s, /\b\d+(?:\s*[-to]+\s*\d+)?\s*(%|points|things|minute|min)\b|\b\d+-\d+\b/i, `${where}: ${s}`);
  }
});

test("num_articles: the schema, the hint, the README and the docs page agree and the code enforces them (A17-O25)", async () => {
  const t = tools.find((x) => x.name === "thought_leadership_series");
  const p = t.inputSchema.properties.num_articles;
  assert.equal(p.type, "integer");
  assert.equal(p.minimum, 1);
  assert.equal(p.maximum, 5);
  assert.match(p.description, /whole number from 1 to 5/);
  assert.doesNotMatch(p.description, /\(1-5\)/);
  const readme = read("../README.md");
  const row = readme.split("\n").find((l) => l.startsWith("| `num_articles`"));
  assert.ok(row, "README row");
  assert.doesNotMatch(row, /1 or more/);
  assert.match(row, /integer \(1 to 5\)/);
  const docs = read("../public/docs/index.html");
  assert.doesNotMatch(docs, /number \(1 or more\)/);
  assert.match(docs, /<code>num_articles<\/code><\/td><td>integer \(1 to 5\)<\/td>/);
  const base = { topic: "managed SD-WAN for branch networks", your_take: "Branch uptime is bought, not hoped for", target_reader: "Heads of IT infrastructure at companies with many branches" };
  for (const n of [1, 5, "2"]) {
    const r = await call("thought_leadership_series", { ...base, num_articles: n });
    assert.equal(r.isError, false, `num_articles ${n} is accepted`);
    assert.equal((r.text.match(/^## Article \d+ of \d+/gm) || []).length, Number(n));
  }
  for (const n of [0, 6, 2.5, "2.5", -1]) {
    const r = await call("thought_leadership_series", { ...base, num_articles: n });
    assert.equal(r.isError, true, `num_articles ${n} is refused`);
    assert.match(r.text, /num_articles must be/);
  }
  const frac = await call("thought_leadership_series", { ...base, num_articles: 2.5 });
  assert.match(frac.text, /whole number/);
});

test("a printed percentage has at most one decimal and no float noise, in every tool answer (rounding rule)", async () => {
  const inputs = [
    ["case_study_generator", { customer_name: "Lanehop", your_product: "Branchwire", challenge: "Late deliveries", solution: "Route planning", results: "Failed first attempts fell by 12.5%; Cost per drop fell by 8%", customer_quote: "It cut our failed drops by a third." }],
    ["newsletter_builder", { topic: "Failed first-attempt deliveries", cta_goal: "book a 20-minute call", key_points: "Failed drops fell by 12.5%" }],
    ["webinar_script", { topic: "Failed first-attempt deliveries", target_audience: "Heads of logistics", webinar_type: "educational", include_polls: true }],
    ["content_repurposer", { source_content: "Lanehop cut failed first attempts by 12.5% in one region. The result held for a second region. Branchwire planned the routes.", source_type: "case_study" }],
    ["thought_leadership_series", { topic: "Failed first-attempt deliveries", your_take: "Plan the last mile around the customer's window", target_reader: "Heads of logistics", proof_points: "Failed first attempts fell by 12.5%", num_articles: 3 }],
    ["testimonial_capture", { customer_name: "Pat", customer_company: "Lanehop", success_story: "Failed first attempts fell by 12.5%", testimonial_type: "written_quote" }],
    ["sales_enablement_content", { product: "Branchwire route planning", target_persona: "Heads of logistics", proof_points: "Failed first attempts fell by 12.5%" }],
    ["craft_content_improver", { content: "Branchwire cut failed first attempts by 12.5% at Lanehop. Would you like to see how? Book a call this week and we will walk you through it.", content_type: "sales_email" }],
  ];
  for (const [name, args] of inputs) {
    const r = await call(name, args);
    assert.equal(r.isError, false, `${name}: ${r.text.slice(0, 120)}`);
    // the user's own 12.5% stays as typed; nothing else may print more than one decimal before a percent sign
    const bad = r.text.match(/\d+\.\d{2,}\s*%/g);
    assert.equal(bad, null, `${name}: ${bad}`);
    assert.doesNotMatch(r.text, /\d(?:\.\d+)?e-\d|0{6,}\d*\s*%|9{6,}\d*\s*%|NaN|Infinity/, `${name}: float noise`);
  }
});
