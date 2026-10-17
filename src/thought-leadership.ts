import { cap, lowerFirstIfCommon, titleWords } from './utils.js';
import { cleanClaims, tagsFor } from './content-repurposer.ts';
import { readContext, isClause, clipWords, type Vertical } from './sector.ts';
import { parseProof, fixNumbers, RECOGNITION, endSentence, capFirst, shortenClauses, proseJoin, brandFrom, claimsToSource, headlineSubject, KIND_NOTE, bestQuestion, clipAtWord, dropTail, type ProofItem } from './draft.ts';
import { cleanSectorLine, looksClause, isInstruction, instructionNote, sharpenLine, stripGuardQuotes, waysToSettle, shorten, quotedEnd, readersFit, shortReaders, splitQuoteRuns, isStatistic, lowerFirstSafe, toReader as toYou } from './rw-content.ts';

// Run 21c (draft rewrite): the series is a first draft built from the inputs. Each article is written out in full sentences: an opening
// that states one part of the take, sections built from the proof points, the sector's objections and measures, and a closing line.
// Then one finished promo post per article. Nothing is added that the inputs or src/verticals.ts do not hold: no figure, no quote,
// no customer, no story the author did not give (B82).

const ECHO = 400; // a long pasted value is shortened to a whole clause at this length when it is repeated
// A long value shortened without a cut mark: a whole clause if one fits, else at a word.
function clipEcho(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return shorten(t, max, true) || dropTail(clipAtWord(t, max));
}

export function generateThoughtLeadership(args: {
  topic: string;
  your_take: string;
  target_reader: string;
  proof_points?: string;
  author_background?: string;
  num_articles?: number;
  article_type?: string;
}): string {
  const g = (x?: string) => stripGuardQuotes((x || '').trim());
  const gk = (x?: string) => stripGuardQuotes((x || '').trim(), true);
  const orders: string[] = [];
  const topic = fixNumbers(gk(args.topic));
  // sentences of the take that read like an order to the writing tool are kept aside, quoted, and never built into an article
  const takeRaw = fixNumbers(g(args.your_take).replace(/^"|"$/g, ''));
  const takeKept = takeRaw.split(/(?<=[.!?])\s+(?=[A-Z0-9"])/).filter((sn) => { if (isInstruction(sn)) { orders.push(sn.trim()); return false; } return true; });
  const yourTake = takeKept.join(' ').trim() || topic;
  const targetReader = gk(args.target_reader);
  const proofRaw = g(args.proof_points);
  const hasAuthor = !!(args.author_background && g(args.author_background));
  const authorBackground = hasAuthor ? gk(args.author_background) : '';
  const numArticles = args.num_articles || 3;
  const articleType = args.article_type && TYPE_VERB[args.article_type] ? args.article_type : 'contrarian';
  // Run 19 (D80, problems 4 and 8): the sector is read from every text the user gave.
  const ctx = readContext(undefined, { seller: [topic], context: [yourTake, proofRaw, args.author_background], role: [targetReader] });
  const vFull = ctx.v;
  // a general software reading that does not fit the readers the user named is not used in the articles: its measures belong to other readers
  const fits = !vFull || readersFit(shortReaders(targetReader) || targetReader, vFull);
  const generic = !!vFull && !fits && !vFull.subtype && ['saas', 'software'].includes(vFull.id);
  const v = generic && vFull ? { ...vFull, metrics: [] as string[] } : vFull;   // the objections and questions stay; the measures of other readers go

  // Proof points: sorted by what they are. Customer results, quotes and story titles carry the argument; recognition, company-wide counts and page claims are credibility lines.
  const suggested = !proofRaw;
  const removedClaims: string[] = [];
  const soft = (t: string) => { const r = cleanClaims(t); removedClaims.push(...r.removed); return r.text; };
  const SAYS = /^(.{3,90}?)\s+says?:\s*['"“](.+?)['"”]\.?$/;
  const items: ProofItem[] = proofRaw ? parseProof(splitQuoteRuns(proofRaw).replace(/\bon the (home|about|pricing|product|customers?) page card\b/gi, 'on the $1-page card').replace(/,\s+(?=(?:Named an?|Named as|Recogni[sz]ed as|Featured in|Winner of)\b)/g, '; ')).filter((i) => { if (isInstruction(i.text)) { orders.push(i.text); return false; } return true; }).map((i) => ({ ...i, text: soft(i.text), shown: soft(i.shown) })).map((i): ProofItem => {
    // a customer who "says: '...'" is a quote; a story title that holds a figure reports a result, so it is not "a headline with no result"
    if (i.kind === 'result' && SAYS.test(i.text)) return { ...i, kind: 'quote' };
    if (i.kind === 'title' && isStatistic(i.text)) return { ...i, kind: 'result' };
    if (i.kind === 'claim' && i.figure && /\b(?:avoid\w*|sav(?:e|ed|es|ing|ings)|reduc\w+|cut|lower\w*|improv\w+|increas\w+|faster|fewer|gain\w*|growth|grew|raised|cost)\b/i.test(i.text)) return { ...i, kind: 'result' };
    return i;
  }) : [];
  const evidence = items.filter((i) => (i.kind === 'result' || i.kind === 'quote') && !isPartner(i));
  const stories = items.filter((i) => i.kind === 'title');
  const credibilityItems = items.filter((i) => !evidence.includes(i) && !stories.includes(i));

  const topicNorm = topic.toLowerCase().replace(/\W+/g, ' ').trim();
  const takeAll = splitTake(soft(yourTake));
  const takeNew = takeAll.filter((t) => { const n = t.toLowerCase().replace(/\W+/g, ' ').trim(); return !(topicNorm.includes(n) || n.includes(topicNorm)); });
  const partsAll = (takeNew.length ? takeNew : takeAll).map((t) => clipEcho(t, ECHO));
  const recognitionParts = partsAll.filter((t) => RECOGNITION.test(t));
  const parts = partsAll.filter((t) => !RECOGNITION.test(t)).length ? partsAll.filter((t) => !RECOGNITION.test(t)) : partsAll;
  const credibility = [...credibilityItems, ...recognitionParts.map((t): ProofItem => ({ text: t.replace(/[.\s]+$/, ''), label: '', kind: 'recognition', figure: false, shown: t.replace(/[.\s]+$/, '') }))];
  // a take typed as "X's view on Y: Z" is opened as "X's view on Y is this: Z", so the first article does not start on a fragment
  const viewMatch = soft(yourTake).match(/^([A-Z][\w&.-]*(?:\s[A-Z][\w&.-]*)?(?:'s|’s)\s+(?:view|take|position)\s+on\s+(?:[^:()]|\([^)]*\))+?):\s+\S/);
  const view = viewMatch ? viewMatch[1] : '';
  const brand = brandFrom(yourTake, args.author_background || '', topic);
  const tags = tagsFor(`${topic} ${yourTake} ${proofRaw}`, brand, v);
  const allClaims = [...new Set([...claimsToSource([yourTake, proofRaw]), ...removedClaims])];
  const claims = allClaims.filter((c) => !allClaims.includes(`the ${c}`));
  const readerNoun = readerPhrase(targetReader);
  const topicLabel = shortTopic(topic);
  const takeText = [...parts, ...evidence.map((e) => e.text)].join(' ');

  const conflicts = items.filter((i) => { const pc = [...new Set((i.text.match(/\d[\d.,]*\s?%/g) || []).map((x) => x.replace(/\s/g, '')))]; return pc.length >= 2 && (/\bon the [^%]{0,40}\b(?:page|card)\b/i.test(i.text) || /\b(?:vs\.?|versus)\b/i.test(i.text)); });
  const used = new Map<ProofItem, number[]>();
  const mark = (p: ProofItem, article: number) => { const l = used.get(p) || []; if (!l.includes(article)) l.push(article); used.set(p, l); };
  const count = (p: ProofItem) => (used.get(p) || []).length;
  const askedQuestions = new Set<string>();
  const metricsSeries = new Set<string>();
  const listedParts = new Map<string, number>();
  const testUsed = new Set<string>();

  const arts: { head: Angle; text: string; lead: string; objection: string; leadItem?: ProofItem }[] = [];
  const heads = Array.from({ length: numArticles }, (_, i) => getArticleAngle(i, articleType, topicLabel, evidence.length + stories.length > 0));
  for (let i = 0; i < numArticles; i++) {
    const a: Art = { index: i, total: numArticles, type: articleType, topic: topicLabel, parts, readerNoun, v, evidence, stories, mark, count, suggested, heads, askedQuestions, takeText, view, metricsSeries, listedParts, testUsed, conflicts };
    arts.push(buildArticle(a, authorBackground, targetReader, credibility));
  }

  // What was not given is named once, at the end.
  const missing: { field: string; change: string }[] = [];
  if (suggested) missing.push({ field: 'proof_points', change: `every article, which now quotes no result, customer or figure${v ? ` and names instead what would carry the argument in this field: ${lowerFirst(v.proofShape).replace(/\.$/, '')}` : ''}` });
  for (const c of conflicts) { const pc = [...new Set((c.text.match(/\d[\d.,]*\s?%/g) || []).map((x) => x.replace(/\s/g, '')))]; missing.push({ field: `which figure to use, ${pc.join(' or ')}, for one case`, change: 'the evidence sentence, which now shows both figures as typed and flags that they differ' }); }
  if (!hasAuthor) missing.push({ field: 'author_background', change: 'the bylines, which now read "the author"' });
  const notUsed = items.filter((i) => !used.has(i) && !credibility.includes(i));
  const notes: string[] = [];
  if (claims.length) notes.push(`**Claims to source before you publish:** your take or proof points use ${proseJoin(claims.map((c) => `"${c}"`))}. The articles and posts leave them out; add one back once, in one place, and only if you can prove it with a source a reader can check.`);
  if (notUsed.length) notes.push(`Not used as examples: ${proseJoin(notUsed.map((i) => `"${clipEcho(i.text, 80)}"`))}, because ${numArticles === 1 ? 'the article has' : `the ${numArticles} articles have`} room for only so many; ${notUsed.length === 1 ? 'it is' : 'they are'} listed under the proof points below.`);
  if (conflicts.length) notes.push(`Two different figures are given for one result: ${proseJoin(conflicts.map((c) => `"${clipEcho(c.shown, 200)}"`))}. They differ, so the articles show both as typed and mark the case.`);
  if (orders.length) notes.push(instructionNote(orders));

  let output = `# Thought Leadership Series
`;

  for (const x of arts) output += x.text;

  output += `
---

## Promotional Posts

${generatePromotionalPosts(parts, arts.map((x) => x.leadItem), arts.map((x) => x.head.title), readerNoun, v, takeText)}
---

## Publishing Order

${Array.from({ length: numArticles }, (_, i) => `${i + 1}. Article ${i + 1}, "${arts[i].head.title}", then its promo post.`).join('\n')}

Link each promo post to its article. ${tags ? `Hashtags for the posts: ${tags}.` : ''}

---

## Proof Points Used

${items.length || credibility.length ? `| Proof point | What it is | How it is used |\n|---|---|---|\n${[...items, ...credibility.filter((c) => !items.includes(c))].map((p) => `| ${clipEcho(p.shown, 600).replace(/\|/g, '/')} | ${noteOf(p)} | ${credibility.includes(p) ? 'a credibility line, not an example' : used.has(p) ? `article ${(used.get(p) as number[]).join(' and ')}` : 'not used as an example'} |`).join('\n')}` : 'None were given.'}
${sectorBlock(vFull, askedQuestions.has('who'))}${generic ? '\n- The readers you named do not match the readers this sector reading is written for, so the articles use none of its measures.\n' : ''}
---

## Notes for you

${cleanSectorLine(ctx.line)}

${numArticles === 1 ? 'One article' : `${numArticles} articles`} in the ${articleType.replace(/_/g, ' ')} style, written for ${readerNoun}.

${notes.length ? notes.map((n) => (n.startsWith('**') ? n : `- ${n}`)).join('\n\n') : 'Nothing in your inputs needed flagging.'}

### What this series was built from

| Element | Detail |
|---------|--------|
| **Topic** | ${topic} |
| **Your Take** | ${soft(yourTake)} |
| **Target Reader** | ${targetReader} |
| **Author** | ${hasAuthor ? authorBackground : 'not given'} |
| **Articles** | ${numArticles} in the ${articleType.replace(/_/g, ' ')} style |
${missing.length ? `\n${sharpenLine(missing)}\n` : ''}`;

  return output;
}

// A statement from a partner (a label such as "partner quote") is not a customer's word and is never used as customer proof.
const isPartner = (p: ProofItem) => /partner/i.test(p.label);
const noteOf = (p: ProofItem) => (isPartner(p) ? 'a partner statement, not a customer\'s words' : KIND_NOTE[p.kind]);

const OPENS: Record<string, string> = {
  contrarian: 'This article makes the case for it.',
  how_to: 'This article turns it into steps.',
  lessons_learned: 'This article sets out what it has taught the author.',
  prediction: 'This article treats it as a forecast.',
  framework: 'This article sets it out as a framework.',
};
const TYPE_VERB: Record<string, string> = {
  contrarian: 'argues for that position and answers the objection to it',
  how_to: 'turns that position into steps',
  lessons_learned: 'sets out what that position has taught the author',
  prediction: 'treats that position as a forecast and names what to watch',
  framework: 'sets that position out as a framework',
};

// A topic for a headline: the whole topic when it is short, else the part before a trailing description ("... while the work is still going on").
function shortTopic(topic: string): string {
  const t = topic.replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '');
  if (t.length <= 48) return t;
  const cut = t.split(/\s+(?:while|because|when|so that|that|which|with|without|where|as)\s+|,\s+|:\s+|;\s+/)[0].trim();
  if (cut.split(/\s+/).length >= 2 && cut.length <= 70) return cut;
  return headlineSubject(t, 80);
}

// The reader as a phrase inside a sentence: the whole description when it is short, else its first part.
function readerPhrase(target: string): string {
  const first = target.split(/;/)[0].trim();
  const keep = /^[A-Z][a-z]+ \d/.test(first); // a name with a number ("Fortune 500 companies") keeps its capital
  if (first.length <= 110) return keep ? first : lowerFirstIfCommon(first);
  const short = shortenClauses(first, 110);
  return /\.\.\.$/.test(short) ? 'these readers' : keep ? short : lowerFirstIfCommon(short);
}

// The take, cut into the parts each article can lead with: sentences first, then the parts after a colon or a semicolon. A short
// take is one part. Each part is kept whole.
function splitTake(take: string): string[] {
  const sentences = take.split(/(?<=[.!?])\s+(?=[A-Z0-9"])/).map((x) => x.trim()).filter(Boolean);
  const out: string[] = [];
  for (const s of sentences) {
    const pieces = s.split(/[:;]\s+/).map((x) => x.trim()).filter((x) => x.length >= 25);
    if (pieces.length > 1) out.push(...pieces); else out.push(s);
  }
  const real = out.filter((p) => !/^[A-Z][\w&.-]*(?:\s[A-Z][\w&.-]*)?(?:'s|’s)\s+(?:view|take|position)\s+on\b/.test(p));
  const use = real.length ? real : out;
  return use.length ? use.map((p) => p.replace(/[.!?]+$/, '')) : [take.replace(/[.!?]+$/, '')];
}

// What readers in the sector usually raise against a take, and what a proof point that lands looks like (no figures, rule B82).
function sectorBlock(v: Vertical | null, whoShown = false): string {
  if (!v) return '';
  return `
---

## Sector Notes: ${cap(v.name)}

- **Counter-arguments your readers will raise:** ${v.objections.map((o) => o.objection.toLowerCase()).join('; ')}. The articles answer them in turn.
- **Measures your readers use:** ${v.metrics.slice(0, 5).join(', ')}. Cite the ones your proof points really move.
- **Terms your readers use:** ${v.vocabulary.slice(0, 6).join(', ')}.
${whoShown ? '' : `- **Who decides:** ${v.committee}\n`}- **A proof point that lands:** ${v.proofShape}
`;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Article angles: a headline and a plan of sections for each position in the series.
// ---------------------------------------------------------------------------------------------------------------------------
type Kind = 'objection' | 'evidence' | 'parts' | 'test' | 'quote' | 'story' | 'question' | 'who' | 'measures' | 'position' | 'next';
type Angle = { title: string; plan: { head: string; kind: Kind }[] };

// The plan of each position in the series; the headings follow the article type.
const PLANS: Kind[][] = [
  ['position', 'evidence', 'objection', 'who', 'next'],
  ['objection', 'quote', 'evidence', 'next'],
  ['story', 'evidence', 'who', 'objection', 'next'],
  ['evidence', 'objection', 'quote', 'next'],
  ['quote', 'evidence', 'who', 'next'],
];
const FOCUS: Record<string, string> = {
  objection: 'It starts with the objection readers raise.',
  parts: 'It starts from the rest of the position.',
  story: 'It starts from one customer story.',
  quote: 'It starts from a customer\'s words.',
  evidence: 'It starts from the evidence.',
  question: 'It starts from the question to ask.',
  test: 'It starts from how to check it.',
  who: 'It starts from who has to agree.',
  measures: 'It starts from what the position should change in the numbers.',
};
const PARTS_HEADINGS: Record<string, string[]> = {
  contrarian: ['The position in parts', 'What else the position holds', 'The rest of the case'],
  how_to: ['The steps', 'The next steps', 'What follows'],
  lessons_learned: ['The lessons', 'More lessons', 'What else it teaches'],
  prediction: ['The predictions', 'What else to expect', 'Further forecasts'],
  framework: ['The components', 'The other components', 'What else the framework holds'],
};
const HEADINGS: Record<string, Record<string, string>> = {
  contrarian: { objection: 'The objection, and the answer', evidence: 'What the evidence shows', parts: 'The position in parts', test: 'How to test it', quote: 'In a customer\'s words', story: 'One customer story', question: 'The question to ask', who: 'Who has to agree', measures: 'What it should change in the numbers' },
  how_to: { objection: 'What gets in the way', evidence: 'A worked example', parts: 'The steps', test: 'How to check it worked', quote: 'A customer\'s view', story: 'One customer story', question: 'The question to ask first', who: 'Who to bring in', measures: 'What to expect to see' },
  lessons_learned: { objection: 'What pushed back', evidence: 'What the results showed', parts: 'The lessons', test: 'How to check the lesson', quote: 'In a customer\'s words', story: 'One customer story', question: 'The question the lesson raises', who: 'Who had to be won over', measures: 'What the lessons change' },
  prediction: { objection: 'What could slow it down', evidence: 'The early signals', parts: 'The predictions', test: 'What to watch', quote: 'In a customer\'s words', story: 'One customer story', question: 'The question to ask now', who: 'Who decides', measures: 'What the numbers would show' },
  framework: { objection: 'Where the framework is challenged', evidence: 'The framework in use', parts: 'The components', test: 'How to apply it', quote: 'In a customer\'s words', story: 'One customer story', question: 'The first question to ask', who: 'Who the framework has to convince', measures: 'What the framework moves' },
};
const POSITION_HEADING: Record<string, string> = { contrarian: 'The position in parts', how_to: 'The steps', lessons_learned: 'The lessons', prediction: 'The predictions', framework: 'The components' };
const NEXT_HEADINGS = ['What to do next', 'Where to start', 'The first thing to try', 'What to try this week', 'How to begin'];
for (const [k, row] of Object.entries(HEADINGS)) { row.position = POSITION_HEADING[k]; row.next = 'What to do next'; }
// The word that numbers a part of the take in each article type.
const ON_ITS_OWN: Record<string, string> = { contrarian: 'one part of the position', how_to: 'one step', lessons_learned: 'one lesson', prediction: 'one prediction', framework: 'one component of the framework' };
const PART_WORD: Record<string, string> = { contrarian: 'Part', how_to: 'Step', lessons_learned: 'Lesson', prediction: 'Prediction', framework: 'Component' };
// [phrase headline, clause suffix]: a topic that is a clause ("how finance teams close the month") goes before a colon.
const TITLES: Record<string, [(t: string) => string, string][]> = {
  contrarian: [
    [(t) => `The Case Against the Usual View of ${t}`, 'The Case Against the Usual View'],
    [(t) => `What the Objections to ${t} Miss`, 'What the Objections Miss'],
    [(t) => `One Customer's Case on ${t}`, 'One Customer\'s Case'],
    [(t) => `What to Ask Before You Decide on ${t}`, 'What to Ask Before You Decide'],
    [(t) => `What the Evidence Shows About ${t}`, 'What the Evidence Shows'],
  ],
  how_to: [
    [(t) => `How to Approach ${t}: The Steps`, 'The Steps'],
    [(t) => `Where ${t} Gets Stuck, and the Way Through`, 'Where It Gets Stuck, and the Way Through'],
    [(t) => `${t}: A Customer Story and What It Shows`, 'A Customer Story and What It Shows'],
    [(t) => `Before You Start on ${t}: The First Question`, 'The First Question'],
    [(t) => `Checking That ${t} Is Working`, 'Checking That It Is Working'],
  ],
  lessons_learned: [
    [(t) => `What ${t} Teaches`, 'What It Teaches'],
    [(t) => `The Pushback on ${t}, and What It Taught`, 'The Pushback, and What It Taught'],
    [(t) => `One Customer's Lesson on ${t}`, 'One Customer\'s Lesson'],
    [(t) => `The Question ${t} Raises`, 'The Question It Raises'],
    [(t) => `What the Results on ${t} Teach`, 'What the Results Teach'],
  ],
  prediction: [
    [(t) => `Where ${t} Is Heading`, 'Where It Is Heading'],
    [(t) => `What Could Slow ${t} Down`, 'What Could Slow It Down'],
    [(t) => `A Customer Story That Points to Where ${t} Goes Next`, 'A Customer Story That Points Ahead'],
    [(t) => `The Question to Ask as ${t} Changes`, 'The Question to Ask as It Changes'],
    [(t) => `What to Watch in ${t}`, 'What to Watch'],
  ],
  framework: [
    [(t) => `A Framework for ${t}`, 'A Framework'],
    [(t) => `Where the Framework for ${t} Is Challenged`, 'Where the Framework Is Challenged'],
    [(t) => `The Framework for ${t} in Use`, 'The Framework in Use'],
    [(t) => `The First Question in the Framework for ${t}`, 'The First Question in the Framework'],
    [(t) => `Applying the Framework for ${t}`, 'Applying the Framework'],
  ],
};

// Run 19 (D80, problem 2): no headline holds an unfilled bracket. A topic that is a clause or a question goes before a colon.
// A headline that names a customer is used only when a customer proof point was given.
const NO_CUSTOMER: Record<string, [(t: string) => string, string]> = {
  contrarian: [(t) => `What to Do First About ${t}`, 'What to Do First'],
  how_to: [(t) => `${t}: Where to Start`, 'Where to Start'],
  lessons_learned: [(t) => `A Lesson on ${t} for Your Own Team`, 'A Lesson for Your Own Team'],
  prediction: [(t) => `What Comes After ${t}`, 'What Comes Next'],
  framework: [(t) => `The Framework for ${t} in Use`, 'The Framework in Use'],
};
function getArticleAngle(index: number, articleType: string, topic: string, hasCustomer = true): Angle {
  // run 21c round 3: a cut inside a bracket note drops the open bracket and what follows it
  const T = titleWords(clipWords(topic, 120)).replace(/\s*\([^)]*$/, '').trim();
  const clause = isClause(topic);
  const list = TITLES[articleType] || TITLES.contrarian;
  let [phrase, suffix] = list[index % list.length];
  if (!hasCustomer && (/customer/i.test(phrase('x')) || /customer/i.test(suffix))) [phrase, suffix] = NO_CUSTOMER[articleType] || NO_CUSTOMER.contrarian;
  const heads = HEADINGS[articleType] || HEADINGS.contrarian;
  return { title: clause ? `${T}: ${suffix}` : phrase(T), plan: PLANS[index % PLANS.length].map((kind) => ({ head: heads[kind], kind })) };
}

interface Art {
  index: number; total: number; type: string; topic: string; parts: string[]; readerNoun: string; v: Vertical | null;
  evidence: ProofItem[]; stories: ProofItem[]; mark: (p: ProofItem, article: number) => void; count: (p: ProofItem) => number;
  suggested: boolean; heads: Angle[]; askedQuestions: Set<string>; takeText: string; view: string;
  metricsSeries: Set<string>; listedParts: Map<string, number>; testUsed: Set<string>; conflicts: ProofItem[];
}

const lowerFirst = (s: string) => lowerFirstSafe(s);
const sentence = (s: string) => endSentence(capFirst(s.trim()));
const stems = (s: string) => new Set((s.toLowerCase().match(/[a-z]{4,}/g) || []).map((w) => w.slice(0, 5)));

// A customer quote typed as "Customer quote from <who>: "<words>"" is shown as the words with the person named; anything else is shown as typed.
function quoteParts(p: ProofItem): { who: string; words: string } {
  const m = /^(?:customer|partner) (?:quote|words)(?: from)?\s*(.*?):\s*["“](.+?)["”]\.?$/i.exec(p.text);
  if (m) return { who: m[1].trim().replace(/^from\s+/i, ''), words: clipEcho(m[2], ECHO) };
  const sy = p.text.match(/^(.{3,90}?)\s+says?:\s*['"“](.+?)['"”]\.?$/);
  if (sy) return { who: sy[1].trim(), words: clipEcho(sy[2], ECHO) };
  const bare = p.text.replace(/^(?:customer|partner) (?:quote|words):\s*/i, '');
  const sp = /^([^:"]{3,90}):\s+(.+)$/.exec(bare);
  if (sp) return { who: sp[1].trim(), words: capFirst(clipEcho(sp[2], ECHO)) };
  return { who: '', words: capFirst(clipEcho(bare, ECHO)) };
}
// "A Product Manager at X" after "A customer," keeps its sense: the article is lowered. The full stop of the words stays inside the quotes.
function quoteLine(p: ProofItem, seen = 0): string {
  const { who: who0, words } = quoteParts(p);
  const who = who0.replace(/^(A|An|The)\s/, (m) => m.toLowerCase());
  const label = p.label ? ` (${p.label})` : '';
  const q2 = `"${words}"`;
  const end = /[.!?]$/.test(words) ? '' : '.';
  if (seen === 1) return `In ${who ? `${who}'s` : "the customer's"} words: ${q2}${label}${end}`;
  if (seen >= 2) return `${who ? capFirst(who) : 'The customer'} says it again: ${q2}${label}${end}`;
  return `A customer${who ? `, ${who},` : ''} puts it this way: ${q2}${label}${end}`;
}
// The same quote for a short post: the words first, then who said them.
function quotePost(p: ProofItem): string {
  const { who, words } = quoteParts(p);
  const label = p.label ? ` (${p.label})` : '';
  return `"${words.replace(/[.]$/, '')}."${who ? ` From ${who}.` : ''}${label}`;
}

// The sector's measures ranked by the words they share with a text (stems of five letters); a measure that shares none ranks last, in file order.
// A measure counts as related to a text only when the text shares two of its words (one, for a measure of a single word): a shared common word is not enough.
function rankMetrics(v: Vertical | null, text: string): { m: string; n: number; ok: boolean }[] {
  if (!v) return [];
  const t = stems(text);
  return v.metrics.map((m, i) => ({ m, i, n: [...stems(m)].filter((x) => t.has(x)).length, size: stems(m).size })).sort((x, y) => y.n - x.n || x.i - y.i).map(({ m, n, size }) => ({ m, n, ok: n >= Math.min(2, size) && n > 0 }));
}
function questionsFor(a: Art): string[] {
  return a.v ? a.v.discovery.filter((d) => !/\bclient'?s?\b|current provider/i.test(d)) : [];
}

// A single part that is a plain list ("AI layered over X, predictive execution and integration with ERPs") names its components itself.
function componentItems(part: string): string[] {
  const t = part.replace(/[.\s]+$/, '');
  if (t.length > 260) return [];
  const items = t.split(/,\s+(?:and\s+)?|\s+and\s+(?=[a-z]+\s+[a-z]+)/).map((x) => x.trim()).filter(Boolean);
  if (items.length < 3 || items.length > 8 || items.some((x) => x.split(/\s+/).length > 9 || x.split(/\s+/).length < 2)) return [];
  // a list of phrases: no item is a statement with a verb of its own
  if (items.some((x) => /\b(?:is|are|was|were|has|have|can|will|would|must|should)\b/i.test(x))) return [];
  return items;
}
function buildArticle(a: Art, authorBackground: string, targetReader: string, credibility: ProofItem[]): { head: Angle; text: string; lead: string; objection: string; leadItem?: ProofItem } {
  const head = a.heads[a.index];
  const { v } = a;
  const n = a.parts.length;
  const items = n === 1 ? componentItems(a.parts[0]) : [];
  const list = n >= 2 ? a.parts : items;
  const multi = n >= 2;
  const thesis = a.parts[a.index % n];
  const word = PART_WORD[a.type] || PART_WORD.contrarian;
  const objections = v ? v.objections : [];
  const objection = objections.length && a.index < objections.length ? objections[a.index] : null;
  const picked = new Set<ProofItem>();
  // the proof point this article has not used yet that the series has used least; a quote is preferred for a quote section
  const nextProof = (list: ProofItem[], prefer?: ProofItem['kind']): ProofItem | undefined => {
    const free = list.filter((p) => !picked.has(p) && a.count(p) < 2);   // a proof point serves two articles at most
    if (!free.length) return undefined;
    const least = Math.min(...free.map((p) => a.count(p)));
    const tier = free.filter((p) => a.count(p) === least);
    const liked = prefer ? tier.filter((p) => p.kind === prefer) : [];
    const from = liked.length ? liked : tier;
    const pick = from[a.index % from.length];
    picked.add(pick);
    return pick;
  };
  let lead: ProofItem | undefined;
  const metricsUsed = new Set<string>();
  const relevantMetric = (text: string, skipIfNamed = true): string => {
    const top = rankMetrics(v, text).find((x) => x.ok && !metricsUsed.has(x.m) && !a.metricsSeries.has(x.m));
    if (!top) return '';
    if (skipIfNamed && [...stems(top.m)].every((x) => stems(text).has(x))) return '';
    metricsUsed.add(top.m); a.metricsSeries.add(top.m);
    return top.m;
  };

  const sections: string[] = [];
  head.plan.forEach(({ head: h, kind }, k) => {
    const body: string[] = [];
    let heading = h;
    if (kind === 'position') {
      // article 1 names every part of the take, numbered, each in the author's own words
      if (a.index === 0 && list.length >= 2) {
        heading = `${POSITION_HEADING[a.type] || POSITION_HEADING.contrarian}`;
        list.forEach((p, i) => body.push(`${i + 1}. ${sentence(clipEcho(p, ECHO))}`));
      }
    } else if (kind === 'objection') {
      if (objection) {
        const settle = waysToSettle(objection.response);
        const frames = [
          `${cap(a.readerNoun)} will push back with this: ${quotedEnd(objection.objection)}`,
          `The objection to expect from ${a.readerNoun} is ${quotedEnd(objection.objection)}`,
          `Someone at the table will say: ${quotedEnd(objection.objection)}`,
        ];
        body.push(`${frames[(a.index + k) % frames.length]}${settle ? ` ${settle}` : ''}`);
        const m = relevantMetric(`${objection.objection} ${objection.response}`);
        if (m) body.push(`The measure to read it by is ${toYou(m)}.`);
        heading = `The objection: ${lowerFirst(objection.objection.replace(/[.?!]+$/, ''))}`;
      }
    } else if (kind === 'evidence' || kind === 'quote' || kind === 'story') {
      const item = kind === 'story' && a.stories.length ? nextProof(a.stories) : nextProof(a.evidence.filter((x) => !(x.kind === 'quote' && a.count(x) > 0)), kind === 'quote' ? 'quote' : undefined) || nextProof(a.stories);
      if (item) {
        if (!lead && item.kind !== 'title') lead = item;
        const seen = a.count(item);
        a.mark(item, a.index + 1);
        const hh = (HEADINGS[a.type] || HEADINGS.contrarian)[item.kind === 'quote' ? 'quote' : item.kind === 'title' ? 'story' : 'evidence'];
        heading = item.kind === 'result' ? [hh, 'A result on record', 'More evidence'][a.index % 3] : hh;
        if (item.kind === 'quote') body.push(quoteLine(item, seen));
        else if (item.kind === 'title') { const nS = [...a.askedQuestions].filter((x) => x.startsWith('story:')).length; a.askedQuestions.add(`story:${item.text}`); const t0 = clipEcho(item.shown, ECHO).replace(/[.]$/, ''); body.push(seen >= 2 ? `The same customer story once more, from the angle of this piece: ${t0}.` : seen === 1 ? `Back to the customer story: ${t0}. Its headline gives no result of its own.` : nS === 0 ? `One customer story points the same way: ${t0}. Its headline carries no result, so none is claimed for it here.` : `Another customer story points the same way: ${t0}, again a headline with no result of its own.`); }
        else {
          const flag = a.conflicts.includes(item) ? ' (two different figures are given for this case)' : '';
          const shownT = clipEcho(seen > 0 ? item.shown.replace(/([.!?])\s+(?=[A-Z])/g, '; ') : item.shown, ECHO);
          const frames = [`The evidence: ${endSentence(capFirst(shownT + flag))}`, `Here is a result: ${endSentence(capFirst(shownT + flag))}`, `One result on record: ${endSentence(capFirst(shownT + flag))}`];
          body.push(frames[seen % frames.length]);
        }
        if (v && !a.askedQuestions.has('proofShape')) { a.askedQuestions.add('proofShape'); body.push(`Evidence of this kind is strongest when it looks like this: ${lowerFirst(toYou(v.proofShape)).replace(/\.$/, '')}.`); }
      }
    } else if (kind === 'who') {
      if (v && !a.askedQuestions.has('who')) { a.askedQuestions.add('who'); body.push(`Whoever reads this will not decide alone. ${toYou(v.committee)}`); }
    } else if (kind === 'next') {
      // what to do next: test the position on one live piece of work, and the question to take into the next meeting
      heading = NEXT_HEADINGS[a.index % NEXT_HEADINGS.length];
      const pool = rankMetrics(v, a.takeText).filter((x) => x.ok).map((x) => x.m).filter((m) => !a.testUsed.has(m));
      if (pool.length) {
        const m0 = pool[0]; const m1 = pool[1];
        a.testUsed.add(m0); if (m1) a.testUsed.add(m1);
        const frames = [
          `Take one live piece of work and read it against ${m0}${m1 ? ` and ${m1}` : ''}.`,
          `Measure it on ${m0}${m1 ? `, then on ${m1}` : ''}, before and after the change.`,
          m1 ? `Two measures show whether it holds: ${m0} and ${m1}.` : `The measure that shows whether it holds is ${m0}.`,
        ];
        body.push(frames[(a.index + k) % frames.length]);
      } else {
        body.push(['Pick one live piece of work and test the position on it before you change anything else.', 'Start with one team and one piece of work, and write down where it stands today.', 'Choose the piece of work that hurts most, and try the position on that one first.'][a.index % 3]);
      }
      const qs = questionsFor(a);
      if (qs.length) body.push(`Then take this question into the next meeting: "${bestQuestion(`${thesis} ${a.takeText}`, qs, a.askedQuestions)}"`);
    }
    if (body.length) sections.push(`## ${heading}\n\n${kind === 'position' ? body.join('\n') : body.join('\n\n')}`);
  });

  const isFirst = a.index === 0;
  const aboutAuthor = authorBackground ? clipEcho(authorBackground.replace(/[.!?]+\s*$/, ''), 200) : 'the author';
  const byline = isFirst ? `*By ${aboutAuthor}. Written for ${clipEcho(targetReader, ECHO)}.*` : `*Part ${a.index + 1} of ${a.total}, by ${aboutAuthor}.*`;
  const repeat = a.index >= n;
  // the opening: the author's own words. A take with several parts opens the series with a lead-in and lists the parts; later articles open on their own part.
  const lowThesis = lowerFirst(clipEcho(thesis, ECHO)).replace(/[.]$/, '');
  let first: string;
  if (a.index === 0 && list.length >= 2) first = a.view ? `${a.view} has ${list.length} ${list.length === 2 ? 'parts' : 'parts'}.` : '';
  else if (a.index === 0) first = a.view ? `${a.view} is this: ${lowThesis}.` : sentence(clipEcho(thesis, ECHO));
  else if (!repeat && multi) first = `Take ${ON_ITS_OWN[a.type] || ON_ITS_OWN.contrarian} on its own: ${lowThesis}.`;
  else first = `This picks up from "${a.heads[a.index - 1].title}".`;
  // the measure this reader watches, only when the sector's measure shares words with the take
  const mm = v ? rankMetrics(v, a.takeText).find((x) => x.ok && !a.metricsSeries.has(x.m)) : undefined;
  if (mm) a.metricsSeries.add(mm.m);
  const readerLine = mm ? `For ${a.readerNoun}, the measure to watch is ${toYou(mm.m)}.` : '';
  const opener = [first, readerLine].filter(Boolean).join(' ') || `Here is the position on ${a.topic}, part by part.`;
  const isLast = a.index === a.total - 1;
  const next = !isLast ? `Next in the series: ${a.heads[a.index + 1].title}.` : '';
  const about = isLast
    ? [authorBackground ? `*About the author: ${endSentence(clipEcho(authorBackground.replace(/[.!?]+\s*$/, ''), 200))}*` : '',
      ...credibility.map((c) => `**Credibility line** (${noteOf(c)}, for the byline or the footer): ${endSentence(capFirst(clipEcho(c.shown, 300)))}`)].filter(Boolean).join('\n\n')
    : '';
  const bodyWords = [opener, ...sections].join(' ').split(/\s+/).length;
  const leadText = lead ? (lead.kind === 'quote' ? `${quoteParts(lead).who ? `${capFirst(quoteParts(lead).who)}: ` : ''}"${quoteParts(lead).words.replace(/[.]$/, '')}."${lead.label ? ` (${lead.label})` : ''}` : endSentence(capFirst(clipEcho(lead.shown, 300)))) : a.suggested ? 'none given' : 'none of your proof points is a customer result';

  const text = `
---

## Article ${a.index + 1} of ${a.total}

**Headline:** ${head.title}

---

# ${head.title}

${byline}

${opener}

${sections.join('\n\n')}${sections.length ? '\n\n' : ''}${next ? `${next}\n\n` : ''}${about ? `${about}\n\n` : ''}*Notes on this article, not part of it:*

**Lead proof point:** ${leadText}
**Counter-argument it answers:** ${objection ? `"${objection.objection}"` : 'none read (the sector is not clear from your inputs)'}
**Draft length:** about ${bodyWords} words
`;
  return { head, text: text.replace(/\n{3,}/g, '\n\n').replace(/^## (?!Article )/gm, '### '), lead: leadText, objection: objection ? objection.objection : '', leadItem: lead };
}

// The parts of the take that go with this article's thesis: the others, from the one after it, at most three; a part that no article
// leads with (when the take has more parts than the series has articles) goes to the article its position falls on.
function listOthers(a: Art, thesis: string): string[] {
  const n = a.parts.length;
  const lead = a.index % n;
  const out: string[] = [];
  for (let j = 1; j < n && out.length < 3; j++) out.push(a.parts[(lead + j) % n]);
  for (let j = a.total; j < n; j++) if (j % a.total === a.index && !out.includes(a.parts[j]) && a.parts[j] !== thesis) out.push(a.parts[j]);
  return out.filter((p) => p !== thesis);
}

// One finished promo post per article: the new headline, the article's part of the take in short, its evidence (each item once), and a
// question from the sector. A part, a proof point or a question is used in one post only.
function generatePromotionalPosts(parts: string[], leads: (ProofItem | undefined)[], titles: string[], readerNoun: string, v: Vertical | null, takeText: string): string {
  let posts = '';
  const qs = v ? v.discovery.filter((d) => !/\bclient'?s?\b|current provider|\bme\b|\bour\b/i.test(d)) : [];
  const asked = new Set<string>();
  const usedProof = new Set<ProofItem>();
  for (let i = 0; i < titles.length; i++) {
    const proof = leads[i] && !usedProof.has(leads[i] as ProofItem) ? leads[i] : undefined;
    if (proof) usedProof.add(proof);
    const proofLine = proof ? (proof.kind === 'quote' ? quotePost(proof) : `On record: ${endSentence(capFirst(clipEcho(proof.shown, 300).replace(/([.!?])\s+(?=[A-Z])/g, '; ')))}`) : '';
    const part = i < parts.length ? parts[i] : '';
    const question = qs.length ? `A question for ${readerNoun}: "${bestQuestion(`${part} ${takeText}`, qs, asked)}"` : '';
    const blocks = [`New article: "${titles[i]}".`, part ? `The short version: ${clipEcho(part, 300).replace(/[.]$/, '')}.` : '', proofLine, question].filter(Boolean);
    posts += `### Promo Post ${i + 1} (for Article ${i + 1})

---

${blocks.join('\n\n')}

---

`;
  }
  return posts;
}
