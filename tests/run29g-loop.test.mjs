// Run 29G loop (test first): a sector block whose first line is a plain lead-in sentence moves whole into section 3; no sector heading in
// section 3 is left empty and no sector question is left in section 2 without its heading. Invented companies only (rule B81).
// Run: npm run build && node --test tests/run29g-loop.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  return (await r.json()).result.content.map((c) => c.text).join("\n");
};
const part = (t, a, b) => t.split(a)[1].split(b)[0];
const emptyHeadings = (s3) => { const l = s3.split("\n"); return l.filter((x, i) => x.startsWith("#### ") && (() => { const n = l.slice(i + 1).find((y) => y.trim()); return !n || n.startsWith("#"); })()); };

test("testimonial_capture: the context questions in the sector's language move with their heading and lead-in", async () => {
  const t = await call("testimonial_capture", { customer_name: "contact at a customer (name not given)", customer_company: "a Payfern customer (expense management)",
    customer_role: "program managers", success_story: "Program managers launched a new card program in six weeks (case study; page claim)", testimonial_type: "written_quote" });
  const s2 = part(t, "\n## 2. The framework applied\n", "\n## 3. Sector checks\n"), s3 = part(t, "\n## 3. Sector checks\n", "\n## 4. Gaps\n");
  assert.deepEqual(emptyHeadings(s3), [], "a sector heading left empty in section 3");
  assert.doesNotMatch(s2, /Ask these in the past tense/, "the lead-in left in section 2 without its heading");
  assert.match(s3, /#### Context Questions in the Language of Fintech\nAsk these in the past tense/);
});
