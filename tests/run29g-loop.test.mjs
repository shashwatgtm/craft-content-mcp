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
const DEFAULT_TOOL = "webinar_script", DEFAULT_ARGS = { topic: "Moving a service desk to a new provider", target_audience: "Heads of IT operations at insurers", webinar_type: "panel_discussion" };
const emptyHeadings = (s3) => { const l = s3.split("\n"); return l.filter((x, i) => x.startsWith("#### ") && (() => { const n = l.slice(i + 1).find((y) => y.trim()); return !n || n.startsWith("#"); })()); };

test("testimonial_capture: the context questions in the sector's language move with their heading and lead-in", async () => {
  const t = await call("testimonial_capture", { customer_name: "contact at a customer (name not given)", customer_company: "a Payfern customer (expense management)",
    customer_role: "program managers", success_story: "Program managers launched a new card program in six weeks (case study; page claim)", testimonial_type: "written_quote" });
  const s2 = part(t, "\n## 2. The framework applied\n", "\n## 3. Sector checks\n"), s3 = part(t, "\n## 3. Sector checks\n", "\n## 4. Gaps\n");
  assert.deepEqual(emptyHeadings(s3), [], "a sector heading left empty in section 3");
  assert.doesNotMatch(s2, /Ask these in the past tense/, "the lead-in left in section 2 without its heading");
  assert.match(s3, /#### Context Questions in the Language of Fintech\nAsk these in the past tense/);
});

// Round 2 (from the judges' reasons on pools P5 and P6): an objection is never split at a semicolon inside its own brackets, and a list of places
// typed after "across" stays one value proposition (a company fact, so not value to the buyer); a list of acronyms ("CIOs; CTOs and CXOs") is one item.
test("sales_enablement_content: a bracket note with a semicolon stays inside its objection; a list of places is not a value proposition", async () => {
  const t = await call("sales_enablement_content", { product: "Cardwell, a card issuing platform for fintech companies: virtual cards, spend controls and a ledger", target_persona: "Head of Payments",
    proof_points: "Cardwell processes card payments for 40 fintech companies (page claim)",
    common_objections: "Is there a minimum spend? (the page answers yes; a single minimum commitment), Do we need a bank partner to get started? (the page answers no)",
    value_props: "founded in 2018; a global team of 120 employees across Portugal; the United Kingdom; the United States; the Netherlands and South Africa; backed by investors alongside 30+ CIOs; CTOs and CXOs who put their own money in (page claims)" });
  assert.doesNotMatch(t, /^### Objection \d+: "?a single minimum commitment/m, "an objection cut inside its bracket");
  assert.match(t, /^### Objection \d+: "?Is there a minimum spend\? \(the page answers yes; a single minimum commitment\)/m);
  assert.doesNotMatch(t, /could help: the United Kingdom|^\| the United Kingdom|^- the United Kingdom/m, "a place name used as a value proposition");
  assert.doesNotMatch(t, /^\| CTOs and CXOs|could help: CTOs and CXOs/m, "the second half of a list of acronyms used as a value proposition");
});

// Round 2 (judges on pools P5 and P6 read the imperative note to the assistant as an instruction inside a tool answer, rule B86): the note says
// what each section holds; it gives no order.
test("the note to the assistant states what the sections hold and gives no order", async () => {
  const t = await call(DEFAULT_TOOL, DEFAULT_ARGS);
  const note = t.split("\n## 6. Note to the assistant\n")[1];
  assert.ok(note && note.trim().split("\n").length >= 2);
  for (const l of note.trim().split("\n")) assert.doesNotMatch(l, /^(?:Write|Use|Add|Ask|Keep|Invent|Do not|Don't)\b/, `an order in the note: ${l}`);
  assert.match(note, /^Section 2 is /m);
});

// Round 3 (judges on pools P5 and P6): the improver never says the text "contains no long sentence" right after listing long sentences; a sales
// kit does not pitch press quotes, profitability or download counts as value to the buyer.
test("craft_content_improver: with no automatic edit, the answer does not say the text holds no long sentence", async () => {
  const long = "Teams at regional grocery chains often lose hours every week because store tasks arrive by email, chat and phone from several managers at once, so nobody can see what is done, what is late and what needs a photo check before the area manager visits the store.";
  const t = await call("craft_content_improver", { content: `Subject: Store tasks\n\nHi,\n\n${long}\n\nWould you be open to a call?\n\nThanks`, content_type: "sales_email" });
  assert.doesNotMatch(t, /contains no buzzword, long sentence/);
});
test("sales_enablement_content: press quotes, profitability and download counts are company facts, not value propositions", async () => {
  const t = await call("sales_enablement_content", { product: "Cardwell, a card issuing platform for fintech companies: virtual cards, spend controls and a ledger", target_persona: "Head of Payments",
    proof_points: "Cardwell processes card payments for 40 fintech companies (page claim)",
    value_props: "crossed profitability in 2020; press quotes on the about page; 2 million app downloads; virtual cards issued in minutes (page claims)" });
  const facts = (t.match(/Facts about the company you gave in value_props[^\n]*/) || [""])[0];
  for (const f of ["crossed profitability in 2020", "press quotes on the about page", "2 million app downloads"]) assert.ok(facts.includes(f), `kept out of the pitch as a company fact: ${f}`);
});

// Round 6 (judges on pools P5 and P6: the shorter version printed the same sentence twice, and reworded a customer's quoted words, "value
// unlocked" to "value got", while saying nothing was reworded): no sentence twice, and quoted words stay as typed.
test("craft_content_improver: the shorter version never repeats a sentence and keeps quoted words as typed", async () => {
  const email = ["Subject: Faster invoicing for repair shops that work on trucks and trailers every single day", "", "Hi,", "",
    "Teams at independent truck repair shops often deal with every job needs to be done right, with the correct parts on hand and every hour billed accurately.",
    "Gridshop is a repair shop management platform that lets shops take repair requests, build estimates and invoice customers from one place.",
    "One shop said “the value unlocked in the first month paid for the whole year” and cut invoice time from 3 days to 1 day (customer quote).",
    "Would you be open to a 20-minute call next week?", "", "Thanks,", "The Gridshop team"].join("\n");
  const t = await call("craft_content_improver", { content: email, content_type: "sales_email" });
  const sv = (t.split("## Suggested Shorter Version")[1] || "").split("\n---")[0];
  assert.ok(sv.trim(), "a shorter version is given");
  const lines = sv.split("\n").map((l) => l.trim()).filter((l) => l.length > 30 && !l.startsWith("*"));
  assert.equal(new Set(lines).size, lines.length, `a sentence printed twice: ${lines.join(" | ")}`);
  assert.doesNotMatch(sv, /value got/, "a quoted word was reworded");
});

// Round 7 (judges on pools P5 and P6: "Good question. Let me answer it first" with no answer, when the objection carried its own answer in a
// bracket): the handler says the answer the user gave, labelled as theirs, and then asks what is behind the question.
test("sales_enablement_content: an objection with its own answer in a bracket is answered with it", async () => {
  const t = await call("sales_enablement_content", { product: "Cardwell, a card issuing platform for fintech companies: virtual cards, spend controls and a ledger", target_persona: "Head of Payments",
    proof_points: "Cardwell processes card payments for 40 fintech companies (page claim)",
    common_objections: "Can I choose specific modules and pay only for what I use? (the page answers yes; pay based on usage)" });
  const block = (t.split(/^### Objection 1: /m)[1] || "").split(/\n### /)[0];
  assert.ok(block, "an objection block");
  assert.doesNotMatch(block, /Let me answer it first/, "the answer is promised but not given");
  assert.match(block, /\*\*Reframe:\*\*\n> [^\n]*yes, pay based on usage/i);
});

// Round 8 (judge PJ1 on pool P6: the spoken script read the user's own bracket note, "(the page answers ...)", aloud to the prospect): the
// line to say quotes the buyer's question without the note; the note stays in the heading.
test("sales_enablement_content: the spoken line does not read the user's bracket note to the buyer", async () => {
  const t = await call("sales_enablement_content", { product: "Cardwell, a card issuing platform for fintech companies: virtual cards, spend controls and a ledger", target_persona: "Head of Payments",
    proof_points: "Cardwell processes card payments for 40 fintech companies (page claim)",
    common_objections: "Can I choose specific modules and pay only for what I use? (the page answers yes; pay based on usage)" });
  const said = t.split("\n").filter((l) => /I hear you: /.test(l));
  assert.ok(said.length, "a spoken line");
  for (const l of said) assert.doesNotMatch(l, /the page answers/, `the note read aloud: ${l}`);
  assert.match(t, /^### Objection 1: "?Can I choose specific modules and pay only for what I use\? \(the page answers yes; pay based on usage\)/m);
});
