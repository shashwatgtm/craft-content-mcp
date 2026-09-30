// Run 15 (R15-11, D35): Case Study Generator, mode "full" with no interview_notes and a fact left out.
// The answer is the existing discovery interview kit, with a first line that names the missing facts.
// A complete input returns exactly the case study of version 2.2.12 (saved in tests/fixtures/).
// In-process through the Netlify function handlers (no network, no deploy): /mcp (mcp.mjs) and the web form endpoint (api.mjs).
// Run: npm run build, then node --test tests/case-study-missing-facts.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const { default: mcp } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
const { default: api } = await import(new URL("../netlify/functions/api.mjs", import.meta.url));

const ACCEPT = "application/json, text/event-stream";
const FIXTURE_ARGS = JSON.parse(fs.readFileSync(new URL("./fixtures/case-study-complete-2.2.12.json", import.meta.url), "utf8"));
const FIXTURE_TEXT = fs.readFileSync(new URL("./fixtures/case-study-complete-2.2.12.txt", import.meta.url), "utf8");

let nextId = 1;
async function viaMcp(args) {
  const r = await mcp(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: ACCEPT },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "case_study_generator", arguments: args } }),
  }));
  const j = await r.json();
  assert.notEqual(j.result.isError, true);
  return j.result.content.map((c) => c.text).join("\n");
}
async function viaForm(args) {
  const r = await api(new Request("https://x.gtmhelix.com/api/tools/case_study_generator", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input: args }),
  }), { params: { tool: "case_study_generator" } });
  const j = await r.json();
  assert.equal(j.ok, true, JSON.stringify(j));
  return j.text;
}

const base = { customer_name: "FlowOps", customer_industry: "Logistics", your_product: "RouteIQ", mode: "full" };
const FACTS = { challenge: FIXTURE_ARGS.challenge, solution: FIXTURE_ARGS.solution, results: FIXTURE_ARGS.results };
const LABEL = { challenge: "the challenge", solution: "the solution", results: "the results" };
const list = (miss) => (miss.length === 1 ? LABEL[miss[0]] : miss.slice(0, -1).map((k) => LABEL[k]).join(", ") + " and " + LABEL[miss[miss.length - 1]]);
const firstLine = (miss) => `Full mode needs the challenge, the solution and the results. Missing: ${list(miss)}. Use the interview questions below to collect them.`;

const CASES = [
  ["challenge left out", ["challenge"]],
  ["solution left out", ["solution"]],
  ["results left out", ["results"]],
  ["challenge and solution left out", ["challenge", "solution"]],
  ["solution and results left out", ["solution", "results"]],
  ["all 3 left out", ["challenge", "solution", "results"]],
  ["only the challenge given (Claude chat measurement C-CONT-01)", ["solution", "results"]],
];

for (const [label, missing] of CASES) {
  test(`full mode, ${label}: first line names the missing facts, then the discovery kit`, async () => {
    const args = { ...base };
    for (const k of Object.keys(FACTS)) if (!missing.includes(k)) args[k] = FACTS[k];
    const out = await viaMcp(args);
    const lines = out.split("\n");
    assert.equal(lines[0], firstLine(missing));
    assert.equal(lines[1], "");
    // the existing discovery kit follows, exactly as mode "discovery" gives it for the same input
    const kit = await viaMcp({ ...args, mode: "discovery" });
    assert.equal(lines.slice(2).join("\n"), kit);
    assert.ok(out.includes("# Case Study Discovery Kit"));
    assert.ok(out.includes("## Customer Interview Questions"));
    // no heading says "not supplied"
    for (const line of lines) if (/^#/.test(line)) assert.ok(!/not supplied/i.test(line), line);
    assert.ok(!out.includes("## not supplied"));
    assert.ok(!out.includes("Case Study: FlowOps"));
    // the browser form path gives the same answer as /mcp
    assert.equal(await viaForm(args), out);
  });
}

test("full mode, a fact that is only spaces counts as missing (the web form trims it away, so both paths agree)", async () => {
  const args = { ...base, challenge: FACTS.challenge, solution: "   ", results: FACTS.results };
  const out = await viaMcp(args);
  assert.equal(out.split("\n")[0], firstLine(["solution"]));
  assert.equal(await viaForm(args), out);
});

test("full mode, a complete input returns exactly the case study of 2.2.12, on /mcp and on the web form", async () => {
  const out = await viaMcp(FIXTURE_ARGS);
  assert.equal(out, FIXTURE_TEXT);
  assert.equal(await viaForm(FIXTURE_ARGS), FIXTURE_TEXT);
  assert.ok(out.startsWith("# Case Study: FlowOps"));
  assert.ok(!out.includes("Full mode needs"));
});

test("full mode with interview notes is unchanged: the notes are parsed, no kit", async () => {
  const out = await viaMcp({ ...base, interview_notes: "Before RouteIQ the problem was late deliveries. They implemented it in May. Late deliveries fell 60%." });
  assert.ok(out.startsWith("# Case Study Draft (Parsed from Notes)"));
  assert.ok(!out.includes("Full mode needs"));
});

test("mode left out or discovery: the kit has no first line about full mode", async () => {
  const noMode = await viaMcp({ customer_name: "FlowOps", your_product: "RouteIQ", challenge: "Late deliveries." });
  const disc = await viaMcp({ ...base, mode: "discovery" });
  assert.ok(noMode.startsWith("# Case Study Discovery Kit"));
  assert.ok(disc.startsWith("# Case Study Discovery Kit"));
});
