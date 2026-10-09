// Run 22 round 3 (test first): the faults the fresh judges still named after round 2, with invented companies.
// Webinar: ordinal placeholders in the agenda and summary ("the second result"), a verb slip ("you names"), seller claims with no label, a Q&A opener
// that points at the questions it is already in, measures of another kind of product, a request to the user inside the script.
// Newsletter: a run on opening, alternative subject lines that repeat one phrase, a long product name said three times in the call to action,
// questions about systems and data put to online sellers. Thought leadership: scaffolding at the head of a later article.
// Run: npm run build && node --no-warnings --test tests/run22-r3-content.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { call, norm, quality } from "./run22-rw-helpers.mjs";

const scriptOf = (t) => t.slice(t.indexOf("## Full Script"), t.indexOf("## Notes for you"));
const ORDINAL = /\b(?:the|a) (?:first|second|third|fourth|fifth|sixth|seventh) (?:result|point|takeaway)\b/i;

const WS = {
  topic: "How enterprises across industries, including banks and global tech firms, can address spoofed SMS messages reach customers under the names of real brands; and existing rule based filters are slow to adapt, with Wexpost",
  target_audience: "enterprises across industries, including banks and global tech firms",
  webinar_type: "educational", duration: "45_min", include_polls: true, product_mention_level: "subtle",
  key_takeaways: "spoofed SMS messages reach customers under the names of real brands; and existing rule based filters are slow to adapt, unify messages through one API; deliver them reliably with real time reporting; and stop spoofing in real time; with 99%+ efficacy observed during deployment (page claims), one API led platform that covers the whole communication value chain; with a blockchain based single source of truth; four patent pending detection engines and ecosystem partnerships with Alphabet; Beacon; Mapline and 20+ carriers",
};

test("r3 webinar: the agenda, the summary and the pointer to the next part name the point and never count it", async () => {
  const t = await call("webinar_script", WS);
  quality(t, "r3 webinar");
  const s = scriptOf(t);
  assert.doesNotMatch(s, ORDINAL, "an ordinal placeholder in the spoken script");
  const agenda = s.slice(s.indexOf("### Agenda"), s.indexOf("### Context Setting"));
  assert.match(agenda, /Part one covers how to unify messages/);
  const summary = s.slice(s.indexOf("### Summary"), s.indexOf("### Q&A"));
  assert.match(summary, /how to unify messages/);
  assert.match(s, /Next is point three, [a-z]/, "the pointer to the next part says what it is");
  const emails = t.slice(t.indexOf("### Email 1"), t.indexOf("### Email 3"));
  assert.doesNotMatch(emails, /Takeaway \d:|You will learn|You will see/, "an email after the session is not written in the future tense");
});

test("r3 webinar: a seller claim with no source label is marked as the vendor's description and asked for once at the end", async () => {
  const t = await call("webinar_script", WS);
  const takeaways = t.split("## Key Takeaways for Audience")[1].split("---")[0];
  assert.match(takeaways, /blockchain based single source of truth \(the vendor's description\)/);
  assert.match(takeaways, /patent pending detection engines[^\n]*\(the vendor's description\)/);
  assert.match(t, /To sharpen this, give:[^\n]*a source for "[^"\n]*blockchain based single source of truth/);
  assert.equal((t.match(/To sharpen this, give:/g) || []).length, 1);
});

test("r3 webinar: the question time does not point at itself, and no line asks the author for anything outside the closing line", async () => {
  const t = await call("webinar_script", WS);
  const s = scriptOf(t);
  const qa = s.slice(s.indexOf("### Q&A"), s.indexOf("### Close"));
  assert.doesNotMatch(qa, /questions at the end|in the questions/i);
  assert.doesNotMatch(t, /set business_model|tell me which|give me|please (?:give|tell|set)/i);
  const body = t.slice(0, t.lastIndexOf("To sharpen this, give:"));
  assert.doesNotMatch(body, /To sharpen this/);
});

test("r3 webinar: the measures follow the kind of product, a fraud topic gets the sector's fraud measure and not the price measure", async () => {
  const t = await call("webinar_script", WS);
  const poll = t.slice(t.indexOf("Poll options:"), t.indexOf("### Main Content Block 1"));
  assert.match(poll, /artificial traffic blocked/);
  assert.doesNotMatch(poll, /cost per delivered message/i);
  const s = scriptOf(t);
  assert.doesNotMatch(s.slice(s.indexOf("### Context Setting"), s.indexOf("### Main Content Block 1")), /cost per delivered message, delivery rate/);
});

test("r3 webinar: a settle line is a sentence a listener can follow (no 'ask to have stated', no 'you names', no 'the buyer')", async () => {
  const t = await call("webinar_script", { ...WS, topic: "How fintech teams can link bank accounts and move money by API, with Paylattice", target_audience: "Heads of payments at fintech companies", key_takeaways: "link bank accounts in seconds, settle in one day instead of three" });
  const s = scriptOf(t).split("## Q&A Preparation")[0];
  assert.match(s, /A fair way to settle it is to /);
  assert.doesNotMatch(s, /You will see settle|covers settle/, "an instruction typed without an article is still an instruction");
  assert.doesNotMatch(s, /ask to have \w+|\byou (?:names|gets|has|is|uses)\b|\bthe buyer\b/i);
});

const NL = {
  topic: "How security teams that want to reduce employee cyber risk can tackle old awareness metrics give an incomplete view of true human risk, running phishing programs is busywork for security teams, and analysts lose time on false-positive reports of suspicious emails, from Cyphernest",
  key_points: "old awareness metrics give an incomplete view of true human risk; running phishing programs is busywork for security teams; and analysts lose time on false-positive reports of suspicious emails, cut risky clicks at scale: turn employees from the greatest risk into the best defense; with 20x lower failure rates (page claims), an agentic engine that adapts simulations; coaching and cadence to each employee",
  cta_goal: "book a conversation about Cyphernest Human Risk Management Platform (adaptive phishing training, security awareness training and email incident response automation)",
  newsletter_type: "thought_leadership",
};

test("r3 newsletter: three pains open as three sentences, the subject is a whole line, and the alternatives repeat no phrase", async () => {
  const t = await call("newsletter_builder", NL);
  quality(t, "r3 newsletter");
  const opening = t.split("---")[1].trim().split("\n\n")[0];
  assert.ok((opening.match(/[.!?](?:\s|$)/g) || []).length >= 3, `the opening is one run on: ${opening}`);
  assert.doesNotMatch(opening, /, and analysts/);
  const subject = t.match(/\*\*Subject:\*\* ([^\n]+)/)[1];
  assert.doesNotMatch(subject, /^Cyphernest for /, "a name and a reader group are not a subject");
  const alts = t.split("## Subject Lines")[1].split("## Opening Hooks")[0].split("\n").filter((l) => l.startsWith("**")).map((l) => l.replace(/\*/g, ""));
  assert.equal(alts.length, 3);
  for (const a of alts) assert.ok((a.toLowerCase().split("cyphernest").length - 1) <= 1, `a name twice in one subject: ${a}`);
  assert.ok(alts.filter((a) => norm(a).includes(norm(subject))).length <= 1, `two alternatives repeat the subject: ${alts.join(" | ")}`);
  assert.doesNotMatch(t, /\bon on\b/i);
});

test("r3 newsletter: the long product name is said once; the button is a few words", async () => {
  const t = await call("newsletter_builder", NL);
  const draft = t.slice(0, t.indexOf("## Subject Lines"));
  assert.equal((draft.match(/Human Risk Management Platform/g) || []).length, 1, "the long name is said once");
  assert.match(draft, /Button: Book a conversation about Cyphernest\n/);
  assert.match(draft, /you can book a conversation about Cyphernest Human Risk Management Platform \(adaptive phishing training, security awareness training and email incident response automation\)/, "the call to action as typed stays once");
});

test("r3 newsletter: online sellers are not asked about systems, data owners or sites, and the proof asked for fits a small seller", async () => {
  const t = await call("newsletter_builder", {
    topic: "How online sellers, social sellers and small shops can tackle late deliveries and confusing courier rates, from Parcelnest",
    key_points: "late deliveries and confusing courier rates; one dashboard for every courier, cut shipping cost by up to 12% for online sellers (page claims)",
    cta_goal: "book a conversation about Parcelnest", newsletter_type: "educational",
  });
  quality(t, "r3 sellers");
  const draft = t.slice(0, t.indexOf("## Subject Lines")) + t.slice(t.indexOf("## Opening Hooks"), t.indexOf("## Notes for you"));
  assert.doesNotMatch(draft, /which systems|who owns the data|one lane, site|owns those numbers|who must approve/i);
  assert.match(draft, /online sellers/);
});

test("r3 newsletter: no sector used still gives the reader something to ask their own team, and no line asks the author for anything but the closing line", async () => {
  const t = await call("newsletter_builder", {
    topic: "How owners and general contractors can stop processes taking people away from the project, from Slabforge",
    key_points: "teams work from disconnected spreadsheets and manual workflows; keep projects on schedule and on budget, one place for the office and the field",
    cta_goal: "book a conversation about Slabforge", newsletter_type: "thought_leadership",
  });
  assert.match(t, /### \d\. What to ask your own team/);
  assert.doesNotMatch(t, /set business_model/);
});

const TL = {
  topic: "continuous localization for software teams", author_background: "Head of product at Glossmint, a localization platform",
  target_reader: "product and engineering leads at software companies",
  your_take: "Glossmint's view on localization has 3 parts: translation lives in the developer workflow; reviewers see every string in context; releases never wait on translators",
  proof_points: "a product team shipping in 12 locales without a release delay (customer story headline); 3x faster review cycles (page claim)",
  num_articles: 3, article_type: "framework",
};

test("r3 thought leadership: a later article opens in the author's voice, not with a counted label", async () => {
  const t = await call("thought_leadership_series", TL);
  quality(t, "r3 tl");
  assert.doesNotMatch(t, /\b(?:Component|Part|Step|Lesson|Prediction) \d: /, "a counted label at the head of an article");
  assert.doesNotMatch(t, /takes up|sets that position out|starts from the evidence|the article before it/i);
  assert.match(t, /Take one component of the framework on its own: /);
});
