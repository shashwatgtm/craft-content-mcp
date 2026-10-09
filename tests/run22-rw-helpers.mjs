// Run 22 (content rewrite): shared helpers for the three rewrite test files. Not a test file itself.
// Companies in the tests are invented. The pool scenarios (private, real pages) are loaded from the owner's work folder only when it exists,
// so the public repo never holds a real name.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
export const rpc = async (method, params) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }) }));
  return r.json();
};
export const call = async (name, args) => {
  const j = await rpc("tools/call", { name, arguments: args });
  assert.ok(!j.result.isError, JSON.stringify(j.result).slice(0, 300));
  return j.result.content.map((c) => c.text).join("\n");
};
export const schemaOf = async (name) => (await rpc("tools/list", {})).result.tools.find((t) => t.name === name).inputSchema;

export const norm = (s) => s.toLowerCase().replace(/[^a-z0-9$%]+/g, " ").trim();
export const has = (text, phrase) => norm(text).includes(norm(phrase));
export const noLabel = (s) => s.replace(/\s*\([^)]*\)\s*$/, "").trim();
const HEALTH = /\b(clinics?|patients?|hospitals?|healthcare|pharmac\w*|medical|physician|dental)\b/i;
const JOINER_END = /\b(?:and|or|the|of|with|for|as|that|which|from|a|an|by)\.(?:\s|$)/;
const WORDS_OF_BRIEF = /words of the brief|in the words of|the brief|SPEAKER PROMPT|Stage direction|\bTBD\b|Insert|\bundefined\b|\bNaN\b|\bnull\b/i;

// the sentences of an answer, markup removed
export function sentences(t) {
  const out = [];
  for (const line of t.split("\n")) {
    const l = line.replace(/^\s*(?:[#>*\-]+|\d+\.)\s*/, "").replace(/\*\*|\*|`/g, "").trim();
    if (!l || l.startsWith("|")) continue;
    for (const s of l.split(/(?<=[.!?])\s+(?=[A-Z"“(])/)) out.push(s.trim());
  }
  return out;
}
// the quality gates every rewritten answer has to pass
export function quality(t, label, opts = {}) {
  assert.ok(t.length > 400, `${label}: too short`);
  assert.doesNotMatch(t, /\[[^\]\n]*\]/, `${label}: bracket placeholder: ${(t.match(/\[[^\]\n]*\]/) || [""])[0]}`);
  assert.doesNotMatch(t, /\{[^}\n]*\}/, `${label}: brace placeholder`);
  assert.doesNotMatch(t, WORDS_OF_BRIEF, `${label}: scaffold or placeholder word: ${(t.match(WORDS_OF_BRIEF) || [""])[0]}`);
  assert.doesNotMatch(t, /[–—]/, `${label}: dash`);
  if (!opts.allowHealth) assert.doesNotMatch(t, HEALTH, `${label}: healthcare word`);
  assert.ok(!t.includes("..."), `${label}: a cut ("...")`);
  for (const s of sentences(t)) assert.doesNotMatch(s, JOINER_END, `${label}: sentence ends on a joining word: ${s.slice(-80)}`);
  const seen = new Map();
  for (const s of sentences(t)) {
    const n = norm(s);
    if (n.length < 40) continue;
    seen.set(n, (seen.get(n) || 0) + 1);
  }
  const dup = [...seen].filter(([, c]) => c > 1).map(([s]) => s);
  assert.equal(dup.length, 0, `${label}: repeated sentence: ${dup[0]}`);
  assert.ok((t.match(/To sharpen this, give:/g) || []).length <= 1, `${label}: missing inputs named more than once`);
  assert.doesNotMatch(t, /(?:^|\n)Not given:|\*Not given:/, `${label}: the old Not given line`);
}
// "To sharpen this" is said once, at the end, with what each missing input would change
export function sharpenAtEnd(t, fields, label) {
  const i = t.indexOf("To sharpen this, give:");
  assert.ok(i > 0, `${label}: To sharpen this, give: is missing`);
  assert.equal((t.match(/To sharpen this, give:/g) || []).length, 1);
  const tail = t.slice(i);
  for (const f of fields) assert.ok(tail.includes(f), `${label}: ${f} named in the closing line`);
  assert.ok((tail.match(/\(it would change /g) || []).length >= fields.length, `${label}: each missing input says what it would change`);
  // nothing but the closing notes comes after it
  assert.ok(t.length - i < 900 || /Suggested timings/.test(t.slice(i)), `${label}: the closing line comes at the end`);
}
// how many distinct words of 5 letters or more of an input appear in the answer
export function coverage(t, text) {
  const words = [...new Set((String(text).toLowerCase().match(/[a-z]{5,}/g) || []))];
  if (!words.length) return 1;
  const low = t.toLowerCase();
  return words.filter((w) => low.includes(w)).length / words.length;
}

// pool scenarios of the private work folder (skipped when it is not there)
export const WORK = process.env.HELIX_WORK || "/home/user/directory-submission-work/work";
export const poolAvailable = existsSync(`${WORK}/run20/eval/builders20.mjs`) && existsSync(`${WORK}/run22/eval/pool2.mjs`);
export async function poolInputs(tool, ids) {
  const { BUILD20 } = await import(`${WORK}/run20/eval/builders20.mjs`);
  const { loadSet } = await import(`${WORK}/run21/eval/common21.mjs`);
  const schema = await schemaOf(tool);
  const out = [];
  for (const set of ["T", "H", "P", "Q"]) for (const sc of await loadSet(set)) if (ids.includes(sc.id)) out.push({ id: sc.id, args: await BUILD20["craft-content"][tool](sc, 0, schema) });
  return out;
}
export const POOL_IDS = [...["T6", "T7", "T8", "T9"], ...Array.from({ length: 9 }, (_, i) => `H${i + 1}`), ...Array.from({ length: 9 }, (_, i) => `P${i + 1}`), ...Array.from({ length: 18 }, (_, i) => `Q${i + 1}`)];
