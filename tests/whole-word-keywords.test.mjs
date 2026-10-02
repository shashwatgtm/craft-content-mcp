// Run 16 R16-13 (D46): craft_content_improver matches the jargon list as whole words, so "implementation" does not count as "implement".
// The inputs are the run 15 matrix cases O4 (mytest, minimal, emptyopt) plus inputs where the whole word is present.
// Tested in-process through netlify/functions/mcp.mjs (no network, no deploy). Run: npm run build, then node --test tests/whole-word-keywords.test.mjs
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
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
};

// The Clarity score and the named buzzwords (empty when no buzzword line is shown), read from the answer text.
// Run 19 (D80, problem 5): the line is now "- Buzzwords (n): "word" in "sentence"; ..." and every buzzword found takes one point, at most four.
const clarity = (text) => {
  const score = Number(text.match(/\| Clarity \| (\d+)\/10 \|/)[1]);
  const line = text.match(/^- Buzzwords \(\d+\): (.*)$/m);
  return { score, jargon: line ? [...line[1].matchAll(/"([^"]+)" in "/g)].map((m) => m[1].toLowerCase()) : [] };
};

const MYTEST = "Our platform lets revenue teams leverage AI-driven insights to optimize every stage of the pipeline across the whole organization, and our methodology aligns sales, marketing and customer success around one shared view of each account.\n\nTeams utilize real-time dashboards that pull data from the CRM, the billing system and the support desk, so leaders can act on accurate numbers every single day of the quarter.\n\nOur implementation team configures each workspace in line with the operating rhythm of the business, including weekly forecast calls, monthly board packs and quarterly planning cycles.\n\nLeading enterprises across financial services, healthcare and manufacturing rely on the platform to drive alignment at scale and deliver predictable growth across every region they operate in.";

for (const name of ["mytest", "minimal", "emptyopt"]) {
  test(`craft_content_improver ${name}: "implementation" is not named as the jargon word "implement"`, async () => {
    const args = { content: MYTEST, content_type: "landing_page" };
    if (name === "emptyopt") Object.assign(args, { goal: "", audience: "" });
    const r = await call("craft_content_improver", args);
    assert.equal(r.isError, false);
    const c = clarity(r.text);
    assert.deepEqual(c.jargon, ["leverage", "optimize", "methodology", "utilize"]);
    assert.equal(c.score, 3); // 10, minus 3 for sentences over 25 words on average, minus 4 for four buzzwords (run 19)
  });
}

test("craft_content_improver: parts of longer words are not buzzwords, so the clarity score is not cut for them", async () => {
  const r = await call("craft_content_improver", { content: "The implementation of the synergistic plan shows robustness and empowerment. Expect more.", content_type: "blog_post" });
  assert.equal(r.isError, false);
  const c = clarity(r.text);
  assert.deepEqual(c.jargon, []);
  assert.equal(c.score, 10);
});

test("craft_content_improver: whole buzzwords still count, in any letter case ('implement' is no longer on the list: it was replaced by 'start' and changed the meaning)", async () => {
  const r = await call("craft_content_improver", { content: "We Utilize tools, leverage data and implement plans. Expect more.", content_type: "blog_post" });
  assert.equal(r.isError, false);
  const c = clarity(r.text);
  assert.deepEqual(c.jargon, ["utilize", "leverage"]);
  assert.equal(c.score, 8);
});
