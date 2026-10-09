// Run 22 round 2 (test first): the faults the fresh judges named in the three rewritten tools, with invented companies:
// webinar takeaways that are broken sentences ("You will see accurate in noisy ..."), a partner list split at semicolons, a dangling "Such as ...",
// an audience phrase cut or pasted into every block, an agenda that repeats the takeaways, a product never named; thought leadership with a quote
// cut to a stub, headers that name another customer than the body, an award used as a component, two conflicting figures shown unflagged;
// a newsletter written for the sector's default readers instead of the readers named, a subject that is a metric phrase, a bullet split mid list.
// Run: npm run build && node --no-warnings --test tests/run22-r2-content.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { call, norm, has, quality } from "./run22-rw-helpers.mjs";

const scriptOf = (t) => t.slice(t.indexOf("## Full Script"), t.indexOf("## Notes for you"));
const takeawayLines = (t) => (t.split("## Key Takeaways for Audience")[1] || "").split("---")[0].split("\n").filter((l) => /^\d+\. /.test(l));

const WB = {
  topic: "How enterprises across industries, including banks and global tech firms; the pages state over 2,000 enterprises (about page) as customers (page claims) can address spoofed messages that reach customers under the names of real brands, with Wexpost",
  target_audience: "enterprises across industries, including banks and global tech firms; the pages state over 2,000 enterprises (about page) as customers (page claims)",
  webinar_type: "educational", duration: "45_min", include_polls: true, product_mention_level: "subtle",
  key_takeaways: "spoofed messages reach customers under the names of real brands; and existing rule based filters are slow to adapt, unify messages through one API; deliver them reliably with real time reporting, stops spoofing in real time, with 99%+ efficacy observed during deployment (page claims), accurate in noisy; accented or overlapping speech; at a fraction of the cost of legacy tools (page claim), outcomes the firm underwrites; such as a regional carrier cutting costs by 45% over 3 years (page claims), four patent pending detection engines and ecosystem partnerships with Alphabet; Beacon; Mapline; Quillpost and 20+ carriers",
};

test("r2 webinar: no takeaway is a broken sentence, a partner list stays one list, a dangling 'such as' joins the point before it", async () => {
  const t = await call("webinar_script", WB);
  quality(t, "r2 webinar");
  const lines = takeawayLines(t);
  assert.ok(lines.length >= 3, lines.join("\n"));
  for (const l of lines) {
    assert.doesNotMatch(l, /^\d+\. You will see (?:accurate|at |with |and |in |such as)/i, l);
    assert.doesNotMatch(l, /^\d+\. (?:Such as|At |With )/, l);
    assert.ok(l.replace(/^\d+\.\s*/, "").split(/\s+/).length >= 5, `a takeaway of fewer than five words: ${l}`);
  }
  const all = lines.join(" ");
  assert.match(all, /Alphabet, Beacon, Mapline, Quillpost and 20\+ carriers/, "the partner list is one list");
  assert.doesNotMatch(t, /You will see (?:Beacon|Mapline|Quillpost|Alphabet)\b|You will see 20\+ carriers/i);
  assert.match(all, /accurate in noisy, accented or overlapping speech, at a fraction of the cost of legacy tools \(page claim\)/i, "the adjective phrase and its label stay together");
  assert.match(all, /regional carrier cutting costs by 45% over 3 years \(page claims\)/i, "the example joins its point");
  assert.doesNotMatch(scriptOf(t), /You will see accurate/i);
});

test("r2 webinar: the audience is said once in a clean short form, never cut and never pasted into every block", async () => {
  const t = await call("webinar_script", { ...WB, target_audience: "SVP Product (title taken from the customer stories page) at Fintech and digital banking" });
  const s = scriptOf(t);
  assert.doesNotMatch(s, /\(title|stories page|a SVP/i);
  assert.match(s, /an SVP Product/);
  const long = await call("webinar_script", WB);
  const ls = scriptOf(long);
  assert.doesNotMatch(ls, /about page|page claims\)\.? ?(?:should be able|the number to watch)/i);
  assert.ok((ls.match(/enterprises across industries/gi) || []).length <= 6, "the audience phrase is not pasted into every speaker block");
  assert.doesNotMatch(ls, /\ban enterprises\b/i);
  assert.doesNotMatch(ls, /industries,\s*(?:\.|should|,)/, "no cut phrase");
});

test("r2 webinar: the agenda says how the time is used and does not read the takeaways again; the product is named once at the welcome", async () => {
  const t = await call("webinar_script", WB);
  const s = scriptOf(t);
  const agenda = s.slice(s.indexOf("### Agenda"), s.indexOf("### Context Setting"));
  for (const l of takeawayLines(t)) { const bare = l.replace(/^\d+\.\s*/, "").replace(/\.$/, ""); if (bare.split(/\s+/).length > 11) assert.ok(!norm(agenda).includes(norm(bare)), `the agenda repeats a takeaway: ${bare}`); }
  assert.match(agenda, /Part one covers/);
  const welcome = s.slice(s.indexOf("### Welcome"), s.indexOf("### Speaker Introduction"));
  assert.match(welcome, /with Wexpost/);
  assert.ok((s.match(/Wexpost/g) || []).length >= 1);
  const subj = (t.match(/### Email 1: Same day\n\n\*\*Subject:\*\* ([^\n]+)/) || [])[1] || "";
  assert.ok(subj.length > 0 && subj.length <= 60 && /^Thank you for joining/.test(subj), subj);
});

test("r2 webinar: a claim with no source label is not promised as something the audience will see, and the notes name it", async () => {
  const t = await call("webinar_script", WB);
  const bad = takeawayLines(t).filter((l) => /patent pending/i.test(l));
  assert.equal(bad.length, 1);
  assert.doesNotMatch(bad[0], /You will see/);
  assert.match(t.slice(t.indexOf("## Notes for you")), /Claims with no source label:[^\n]*patent pending/i);
});

const TL = {
  topic: "reviewing contracts without losing a week",
  your_take: "A contract review that waits for a lawyer's diary is a delay you chose. Route the standard clauses to a playbook and keep people for the exceptions; named a Leader in the 2026 Example Analyst Wave (page claim).",
  target_reader: "Heads of legal operations at mid-size manufacturers",
  proof_points: "A product manager at Wexbridge says: 'We cut first review from five days to one.', Plainmoor reduced review backlog by 50% (customer story headline), Gradwell Foods cut standard NDA turnaround to one day (page claim), Case study: a mid-size insurer cut review cost; savings of about 35% on the case page and 25% on the home page card (page claims)",
  author_background: "Head of product at Lexivo, 8 years in contract tooling",
  num_articles: 3, article_type: "framework",
};

test("r2 thought leadership: a quote is whole, headers match bodies and posts, the first section is the argument, names keep their capitals", async () => {
  const t = await call("thought_leadership_series", TL);
  quality(t, "r2 tl");
  assert.doesNotMatch(t, /says\.\s*$/m, "no quote cut to a stub");
  assert.match(t, /We cut first review from five days to one/);
  const arts = t.split(/\n## Article \d of 3/).slice(1).map((a) => a.split(/\n## (?:Promotional Posts|Sector Notes|Publishing Order)/)[0]);
  const promo = t.split("## Promotional Posts")[1].split(/\n## Publishing Order/)[0].split("### Promo Post").slice(1);
  const leads = arts.map((a) => (a.match(/\*\*Lead proof point:\*\* ([^\n]+)/) || [])[1]);
  assert.equal(new Set(leads).size, 3, "three different leads");
  arts.forEach((a, i) => {
    const key = norm(leads[i]).slice(0, 28);
    const body = a.split("# ").slice(2).join("# ");
    assert.ok(norm(body).includes(key), `article ${i + 1}: the header lead is the proof the body uses: ${leads[i]}`);
    assert.ok(!promo[i] || norm(promo[i]).includes(key) || !/On record|From /.test(promo[i]), `promo ${i + 1} uses the header's proof`);
  });
  assert.doesNotMatch(arts[0].split("\n### ")[1] || "", /^The objection/, "the series opens with the argument, not the objection");
  assert.doesNotMatch(t, /\bplainmoor\b|\bwexbridge\b|\bgradwell\b/, "names keep their capitals");
  assert.doesNotMatch(t, /\byou (?:gets|has|side)\b/);
});

test("r2 thought leadership: a story headline that holds a figure is a result; an award in the take is a credibility line, not a component", async () => {
  const t = await call("thought_leadership_series", TL);
  assert.doesNotMatch(t, /Its headline carries no result/, "no 'headline carries no result' beside a headline that reports a result");
  const comps = t.split("\n").filter((l) => /^- /.test(l));
  assert.ok(!comps.some((l) => /Leader in the 2026 Example Analyst Wave/i.test(l)), "the award is not a component");
  assert.match(t, /Credibility line[^\n]*Leader in the 2026 Example Analyst Wave/);
});

test("r2 thought leadership: two different figures for one case are flagged and the question is asked", async () => {
  const t = await call("thought_leadership_series", TL);
  assert.match(t.slice(t.indexOf("## Notes for you")), /Two different figures are given for one result/);
  const inArticles = t.slice(0, t.indexOf("## Promotional Posts"));
  if (/35% on the case page/.test(inArticles)) assert.match(inArticles, /these two figures differ, so confirm which one to publish/, "used in an article, the figure is flagged where it stands");
  assert.match(t, /To sharpen this, give:[^\n]*which figure to use, 35% or 25%/);
});

const NL_BASE = { cta_goal: "book a conversation about Lanehop", newsletter_type: "thought_leadership" };
test("r2 newsletter: the readers the user named win over the sector's default readers", async () => {
  const t = await call("newsletter_builder", { ...NL_BASE, topic: "How online sellers, social sellers and offline stores in India can tackle late parcels and confusing courier rates, from Lanehop", key_points: "late parcels and confusing courier rates; one dashboard for every courier; shipping cost reduction of up to 12% for online sellers (page claim)" });
  quality(t, "r2 nl readers");
  const body = t.slice(0, t.indexOf("## Notes for you"));
  assert.doesNotMatch(body, /Teams in logistics tech/i);
  assert.doesNotMatch(body.slice(0, body.indexOf("## Sector Notes") > 0 ? body.indexOf("## Sector Notes") : body.length), /\b(?:COO|ERP|Chief Operating Officer)\b/);
  assert.match(body, /online sellers/);
});

test("r2 newsletter: a general software reading that does not fit the readers named is not used in the draft", async () => {
  const t = await call("newsletter_builder", { ...NL_BASE, cta_goal: "book a conversation about Girderly", topic: "How owners, general contractors and specialty contractors in the construction industry can tackle jobs that run late and over budget, from Girderly", key_points: "jobs run late and over budget because teams work from disconnected spreadsheets; keep projects on schedule and on budget; unlimited users and 24/7 support under a volume based annual price instead of per seat licenses" });
  const draft = t.slice(0, t.indexOf("## Subject Lines"));
  assert.doesNotMatch(draft, /time to value|renewal rate|adoption by the target team|where do people drop off/i);
  const subject = /\*\*Subject:\*\* ([^\n]+)/.exec(t)[1];
  assert.ok(subject.split(/\s+/).length >= 4 && /jobs|Girderly|contractors|spreadsheets/i.test(subject), subject);
});

test("r2 newsletter: a list the builder split at semicolons stays one bullet, and a statistic hook holds a statistic", async () => {
  const t = await call("newsletter_builder", { ...NL_BASE, cta_goal: "book a conversation about Lexivo", topic: "Reviewing contracts without losing a week", key_points: "Standard clauses wait for a lawyer's diary, an engine that adapts drills; quizzes; pacing and tone to each person; a playbook library updated every week; 24/7 support and open API" });
  const bullets = t.split("\n").filter((l) => /^- /.test(l));
  assert.ok(bullets.some((l) => /adapts drills, quizzes, pacing and tone to each person/i.test(l)), bullets.join("\n"));
  assert.ok(!bullets.some((l) => /adapts drills, quizzes$/i.test(l)));
  assert.doesNotMatch(t, /### Hook \d: Statistic/, "no figure with a percentage or a count, so no statistic hook");
});
