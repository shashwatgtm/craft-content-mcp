import { lowerFirstIfCommon, cap, SUGGESTION_FOOTER } from './utils.js';
import { q, readContext, startWords, audienceLine, isClause, type Vertical, type BusinessModel } from './sector.ts';
import { splitList, asAnswer, tidyPoint, softenClaims, bestQuestion, toYou, STAT, unpackTopic, fixNumbers, endSentence, capFirst, shortenClauses, proseJoin, roleOf, clipAtWord, productParts } from './draft.ts';

type Ctx = { v: Vertical | null; model: BusinessModel | null; line: string };

// Everything a section of the script needs, read once from the inputs.
interface W {
  usedQ: Set<string>;
  topic: string; label: string; clause: boolean; problem: string; audience: string; role: string; field: string;
  takeaways: string[]; speakers: string[]; product: string; productLevel: string; includePolls: boolean; ctx: Ctx;
  haveSpeakers: boolean; problemPts: string[]; minutes: number; productDescription: string; productName: string; model: BusinessModel | null; type: string;
}

export function generateWebinarScript(args: {
  topic: string;
  target_audience: string;
  webinar_type: string;
  duration?: string;
  key_takeaways?: string;
  speakers?: string;
  include_polls?: boolean;
  product_mention_level?: string;
  your_product?: string;
  business_model?: string;
}): string {
  const topic = fixNumbers(args.topic.trim());
  // Run 20 (round 1b): a long topic typed as "How <readers> can address <problem>, with <company>" is read into its parts. The heading
  // and the details table print the topic once as typed; the script and the emails use a short label for it.
  const parts = unpackTopic(topic);
  // the first clause of the problem is the label when the shared cut stopped inside it ("... because testing")
  const firstClause = (parts.problem || '').split(/[,;:]| \(/)[0].trim();
  const label = parts.short ? topic : (firstClause && firstClause.length <= 110 && firstClause.length > parts.label.length && firstClause.toLowerCase().startsWith(parts.label.toLowerCase()) ? firstClause : parts.label);
  const clause = isClause(topic) || !parts.short || LABEL_CLAUSE.test(label);
  const audience = args.target_audience.trim();
  const { role, field } = splitAudience(audience);
  const duration = args.duration || '60_min';
  const type = args.webinar_type;
  // Run 12 (R12-20): a panel without named speakers lists a moderator and two panelists to fill in.
  // Run 19 (D80, problems 2 and 3): speakers are split on semicolons and line breaks first, so "Name, Title" stays whole, and every
  // speaker is printed as typed, never placed after "I'm".
  const speakerList = args.speakers
    ? (/[;\n]/.test(args.speakers) ? args.speakers.split(/[;\n]/).map((x) => x.trim()).filter(Boolean) : joinNameAndTitle(splitList(args.speakers), args.speakers))
    : [];
  const speakers = speakerList.length ? speakerList
    : args.webinar_type === 'panel_discussion' ? ['Moderator (name not given)', 'Panelist 1 (name not given)', 'Panelist 2 (name not given)'] : ['Speaker (name not given)'];
  const includePolls = args.include_polls ?? true;
  const productLevel = args.product_mention_level || 'subtle';
  const given = (args.your_product || '').trim();
  const product = given || (productLevel === 'none' ? '' : parts.company);
  // Run 19 (D80, problems 4 and 8): the sector and the business model are read from every text the user gave.
  const ctx: Ctx = readContext(args.business_model, { seller: [given || parts.company, parts.problem || topic], context: [args.key_takeaways, args.speakers], role: [audience], buyer: [parts.audience, audience] });

  // Run 21c (draft rewrite): the takeaways are the content of the script. Without them, the sector's own measures, objection and proof shape
  // are the content (only when a sector is read); nothing else is invented.
  const haveTakeaways = !!args.key_takeaways;
  const allGiven = haveTakeaways ? splitList(args.key_takeaways).map(tidyPoint).map((p) => softenClaims(p).text) : [];
  // a takeaway that only restates the topic's own problem is said once, as the problem, and is not a takeaway of its own
  const headN = normT(label).slice(0, 40);
  const problemPts = headN.length >= 15 ? allGiven.filter((p) => normT(p).startsWith(headN)) : [];
  const takeaways: string[] = haveTakeaways
    ? allGiven.filter((p) => !problemPts.includes(p))
    : takeawaysFromSector(ctx.v);
  const w: W = { usedQ: new Set<string>(), topic, label, clause, problem: parts.problem || '', audience, role, field, takeaways, speakers, product, productLevel, includePolls, ctx, haveSpeakers: speakerList.length > 0, problemPts, minutes: 0, productDescription: '', productName: '', model: ctx.model, type };

  // Duration in minutes
  const durationMap: Record<string, number> = {
    '30_min': 30,
    '45_min': 45,
    '60_min': 60,
    '90_min': 90
  };
  const minutes = durationMap[duration] || 60;
  w.minutes = minutes;
  // 60 minutes is a default when no known duration was supplied: label it as an example
  const durationSupplied = !!args.duration && Object.prototype.hasOwnProperty.call(durationMap, args.duration);
  const durationLabel = durationSupplied ? '' : ' (Example figure: replace with your own)';
  const pp = given ? productParts(given) : null;
  w.productName = productLevel === 'none' ? '' : (pp ? pp.name : product);
  w.productDescription = pp && pp.description !== pp.name && pp.description.length > pp.name.length + 3 ? pp.description.replace(/\.$/, '') : '';

  // Generate type-specific structure
  const structure = getWebinarStructure(type, minutes);

  // Run 19 (D80, problem 3): a product the user gave but asked not to mention is named as not used, with the reason.
  const productNote = given
    ? (productLevel === 'none' ? `your_product (${given}) is not mentioned in the script because product_mention_level is none.` : `${w.productName || given} is mentioned at the "${productLevel}" level.`)
    : product ? `your_product was not given; ${product} is read from the topic and mentioned at the "${productLevel}" level.`
    : '';

  const missing: string[] = [];
  if (!w.haveSpeakers) missing.push(type === 'panel_discussion' ? 'speakers (the script says "your host" and "the panelists"; add speakers to name them)' : type === 'customer_story' ? 'speakers (the script says "our guest"; add the customer as a speaker to name them)' : 'speakers (the script says "your host"; add speakers to name them)');
  if (!haveTakeaways) missing.push(ctx.v ? 'key_takeaways (the content comes from the sector\'s own measures, objection and proof shape instead of your takeaways)' : 'key_takeaways (no sector could be read either, so the segments hold no teaching content)');
  if (!product && productLevel !== 'none') missing.push('your_product (the script names no product)');
  const notGiven = missing.length ? `\n*Not given: ${missing.join('; ')}.*\n` : '';
  const demoSteps = '';

  let output = `# Webinar Script: ${topic}

## Webinar Details

| Setting | Value |
|---------|-------|
| **Topic** | ${topic} |
| **Duration** | ${minutes} minutes${durationLabel} |
| **Type** | ${type.replace(/_/g, ' ')} |
| **Audience** | ${audience} |
| **Speakers** | ${w.haveSpeakers ? (speakers.some((x) => x.includes(',')) ? speakers.join('; ') : speakers.join(', ')) : 'not given'} |
| **Product Mentions** | ${productLevel}${args.product_mention_level ? '' : ' (default)'} |
${notGiven}${demoSteps}
${ctx.line}
${productNote ? `\n*${productNote}*\n` : ''}${parts.short ? '' : `\n*The topic is long, so the script calls it ${q(label)} after this table.*\n`}
---

## Key Takeaways for Audience

${takeaways.map((t, i) => `${i + 1}. ${tk(t)}`).join('\n') || 'No takeaways could be written: none were given and no sector was read.'}

---

## Run of Show

${generateRunOfShow(structure, minutes)}

---

## Full Script

`;

  // Generate script sections based on structure
  let block = 0;
  const blocks = structure.filter((s) => /^Main Content Block/.test(s.name)).length;
  for (const section of structure) {
    const isBlock = /^Main Content Block/.test(section.name);
    output += generateScriptSection(section, w, isBlock ? block++ : 0, blocks);
  }

  output += `
---

${qaPrep(w)}
## Follow-Up Sequence

${followUps(w)}
---
${sectorNotes(ctx, w)}
${SUGGESTION_FOOTER}
`;

  return output;
}

// "Heads of customer operations at online retailers": the role is everything before " at ", the field what follows.
function splitAudience(audience: string): { role: string; field: string } {
  const m = /^(.+?)\s+at\s+(.+)$/i.exec(audience.trim());
  if (m && m[1].split(/\s+/).length <= 7) return { role: m[1].trim(), field: m[2].trim() };
  return roleOf(audience);
}
// "Name, Title" typed for one speaker without a semicolon: the second part is a title, so the two stay together.
const TITLE_START = /^(?:head|director|vp|vice|chief|manager|lead|engineer|founder|co-?founder|ceo|cto|cfo|cmo|coo|cio|ciso|president|partner|principal|senior|solutions?|product|sales|marketing|customer|general|owner|analyst|consultant|architect|specialist|advisor|adviser|professor|dr)\b|\b(?:at|of|from)\s+[A-Z]/i;
function joinNameAndTitle(list: string[], raw: string): string[] {
  if (list.length === 2 && !/[;\n]/.test(raw) && TITLE_START.test(list[1]) && list[0].split(/\s+/).length <= 4) return [`${list[0]}, ${list[1]}`];
  return list;
}

const LABEL_CLAUSE = /\b(?:is|are|was|were|run|runs|combine|combines|means|rely|relies|chain|chains|sits|happens|hand|hands|can|will|must|should|have|has|do|does|break|breaks|fragments|drift|drifts)\b/i;
const lowerFirst = (s: string) => (/[A-Z0-9]/.test(s.slice(1, 3)) ? s : s.charAt(0).toLowerCase() + s.slice(1));

// The sector block printed once above the script: who the audience usually is, what it measures, the proof that lands.
function sectorNotes(ctx: Ctx, w: W): string {
  const v = ctx.v;
  if (!v) return `\n## Sector Notes\n\nNo sector could be read from what you typed, so the script holds only your own words. Name the audience's industry or your product category to get the sector's measures, questions and objections into the lines.\n\n---\n`;
  return `
## Sector Notes: ${cap(v.name)}

- ${audienceLine(v)}
- **Who sits in the buying group:** ${v.committee}
- **Terms this audience uses:** ${v.vocabulary.slice(0, 6).join(', ')}.
- **Objections to expect:** ${v.objections.map((o) => o.objection.toLowerCase()).join('; ')}.
- **A proof point that lands:** ${v.proofShape}

---
`;
}

function getWebinarStructure(type: string, minutes: number): Array<{ name: string; duration: number; purpose: string }> {
  const structures: Record<string, Array<{ name: string; duration: number; purpose: string }>> = {
    educational: [
      { name: 'Welcome & Housekeeping', duration: 3, purpose: 'Set expectations' },
      { name: 'Speaker Introduction', duration: 2, purpose: 'Build credibility' },
      { name: 'Agenda & Learning Objectives', duration: 2, purpose: 'Preview value' },
      { name: 'Context Setting', duration: 5, purpose: 'Why this matters now' },
      { name: 'Main Content Block 1', duration: 12, purpose: 'Core teaching' },
      { name: 'Main Content Block 2', duration: 12, purpose: 'Core teaching' },
      { name: 'Main Content Block 3', duration: 10, purpose: 'Core teaching' },
      { name: 'Summary & Key Takeaways', duration: 4, purpose: 'Reinforce learning' },
      { name: 'Q&A', duration: 8, purpose: 'Address questions' },
      { name: 'Close & CTA', duration: 2, purpose: 'Next steps' }
    ],
    product_demo: [
      { name: 'Welcome & Agenda', duration: 3, purpose: 'Set expectations' },
      { name: 'Problem Context', duration: 5, purpose: 'Why solution needed' },
      { name: 'Product Overview', duration: 3, purpose: 'High-level view' },
      { name: 'Feature Demo 1', duration: 10, purpose: 'Core feature' },
      { name: 'Feature Demo 2', duration: 10, purpose: 'Key differentiator' },
      { name: 'Feature Demo 3', duration: 8, purpose: 'Advanced capability' },
      { name: 'Use Case Examples', duration: 5, purpose: 'Real applications' },
      { name: 'Pricing & Getting Started', duration: 4, purpose: 'How to buy' },
      { name: 'Q&A', duration: 10, purpose: 'Address objections' },
      { name: 'Special Offer & Close', duration: 2, purpose: 'Urgency + CTA' }
    ],
    panel_discussion: [
      { name: 'Welcome & Introductions', duration: 5, purpose: 'Set stage' },
      { name: 'Topic Introduction', duration: 3, purpose: 'Context' },
      { name: 'Discussion Question 1', duration: 10, purpose: 'First question to the panel' },
      { name: 'Discussion Question 2', duration: 10, purpose: 'Second question to the panel' },
      { name: 'Discussion Question 3', duration: 10, purpose: 'Third question to the panel' },
      { name: 'Rapid Fire Round', duration: 5, purpose: 'Quick insights' },
      { name: 'Audience Q&A', duration: 12, purpose: 'Engagement' },
      { name: 'Closing Thoughts', duration: 4, purpose: 'Final perspectives' },
      { name: 'Close', duration: 1, purpose: 'Thank & CTA' }
    ],
    customer_story: [
      { name: 'Welcome', duration: 2, purpose: 'Set stage' },
      { name: 'Customer Introduction', duration: 3, purpose: 'Build connection' },
      { name: 'The Challenge', duration: 8, purpose: 'Before state' },
      { name: 'Solution Discovery', duration: 5, purpose: 'How they found us' },
      { name: 'Implementation Journey', duration: 10, purpose: 'The process' },
      { name: 'Results & Impact', duration: 10, purpose: 'Outcomes' },
      { name: 'Live Demo/Walkthrough', duration: 8, purpose: 'Show actual use' },
      { name: 'Lessons Learned', duration: 5, purpose: 'Advice' },
      { name: 'Q&A', duration: 7, purpose: 'Audience questions' },
      { name: 'Close', duration: 2, purpose: 'CTA' }
    ],
    workshop: [
      { name: 'Welcome & Setup', duration: 5, purpose: 'Get ready' },
      { name: 'Learning Objectives', duration: 3, purpose: 'What we\'ll build' },
      { name: 'Concept Introduction', duration: 7, purpose: 'Theory' },
      { name: 'Exercise 1', duration: 12, purpose: 'Hands-on practice' },
      { name: 'Debrief 1', duration: 5, purpose: 'Share learnings' },
      { name: 'Exercise 2', duration: 12, purpose: 'Apply learning' },
      { name: 'Debrief 2', duration: 5, purpose: 'Share learnings' },
      { name: 'Wrap-up & Resources', duration: 7, purpose: 'Next steps' },
      { name: 'Q&A', duration: 4, purpose: 'Questions' }
    ],
    ama: [
      { name: 'Welcome & Speaker Intro', duration: 5, purpose: 'Set stage' },
      { name: 'Brief Topic Context', duration: 5, purpose: 'Frame discussion' },
      { name: 'Q&A Session', duration: 45, purpose: 'Main content' },
      { name: 'Rapid Fire', duration: 3, purpose: 'Quick questions' },
      { name: 'Close', duration: 2, purpose: 'Wrap up' }
    ]
  };
  
  let structure = structures[type] || structures.educational;
  
  // Scale to actual duration
  const baseMinutes = structure.reduce((sum, s) => sum + s.duration, 0);
  const scale = minutes / baseMinutes;
  
  const scaled = structure.map(s => ({
    ...s,
    duration: Math.max(1, Math.round(s.duration * scale))
  }));
  // Rounding can leave the run of show a few minutes over or under the webinar length: take the difference from
  // (or give it to) the longest sections, one minute each, so the sections add up to exactly the length chosen.
  let diff = minutes - scaled.reduce((sum, s) => sum + s.duration, 0);
  const order = scaled.map((s, i) => i).sort((a, b) => scaled[b].duration - scaled[a].duration || a - b);
  for (let k = 0; diff !== 0 && k < order.length * 10; k++) {
    const s = scaled[order[k % order.length]];
    if (diff > 0) { s.duration += 1; diff -= 1; } else if (s.duration > 1) { s.duration -= 1; diff += 1; }
  }
  return scaled;
}

function generateRunOfShow(structure: Array<{ name: string; duration: number; purpose: string }>, totalMinutes: number): string {
  let currentTime = 0;
  let rows = '| Time | Duration | Section | Purpose |\n|------|----------|---------|----------|\n';
  
  for (const section of structure) {
    const startTime = formatTime(currentTime);
    rows += `| ${startTime} | ${section.duration} min | ${section.name} | ${section.purpose} |\n`;
    currentTime += section.duration;
  }
  
  return rows;
}

function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}:${mins.toString().padStart(2, '0')}` : `0:${mins.toString().padStart(2, '0')}`;
}

// What a buyer does to get started, by business model (no trial, plan or demo word for a business that has none).
function startingStep(model: BusinessModel | null): string {
  switch (model) {
    case 'saas': return 'your plans, and a trial only if you offer one';
    case 'services': return 'the scoping call, the statement of work and the transition plan';
    case 'connectivity': return 'the site survey, the pilot sites and the rate card';
    case 'investment': return 'the mandate discussion, the pilot allocation and the reporting';
    case 'transactions': return 'the integration steps and the first live transactions';
    case 'marketplace': return 'sign-up checks and the first listing';
    case 'hardware_software': return 'the site visit, the pilot units and the rollout plan';
    default: return 'the first step after the session';
  }
}

// Poll options: the sector's own measure and objection when the sector is known, four neutral options otherwise.
function pollOptions(ctx: Ctx): string[] {
  const v = ctx.v;
  if (v) {
    return [
      `We measure ${v.metrics[0]} today and know where we stand`,
      `We know ${v.metrics[0]} matters but do not measure it yet`,
      `${cap(v.objections[0].objection)}: that is what holds us back`,
      'This is not a priority this year'
    ];
  }
  return ['We have a plan and it is working', 'We have tried and it stalled', 'We have not started yet', 'This is not a priority this year'];
}

// The takeaways of one main content block: the takeaways are shared out over the blocks in order, so every one is taught.
function blockTakeaways(takeaways: string[], block: number, blocks: number): string[] {
  const n = takeaways.length;
  const base = Math.floor(n / blocks);
  const extra = n % blocks;
  const start = block * base + Math.min(block, extra);
  return takeaways.slice(start, start + base + (block < extra ? 1 : 0));
}

// How the session is named aloud: a topic that is a clause is introduced as the subject of today's session.
function named(w: W): string {
  return w.clause ? `today's session on ${q(clipAtWord(w.label, 120))}` : q(clipAtWord(w.label, 120));
}

// ---------------------------------------------------------------------------------------------------------------------------
// Run 21c (draft rewrite): spoken lines built from the inputs.
// ---------------------------------------------------------------------------------------------------------------------------
const kindOf = (v: Vertical): string => (v.name.includes(',') ? v.name.split(',').slice(1).join(',').trim() : v.name);
const short = (s: string, n = 110): string => { const c = shortenClauses(s, n); return /\.\.\.$/.test(c) ? clipAtWord(s, n) : c; };
// "a CFO", but a plural role ("project executives") takes no article.
function whoIs(w: W): string {
  if (!w.role) return 'this audience';
  const r = lowerFirstIfCommon(w.role);
  const noun = (r.split(/\s+(?:of|for)\s+/i)[0].split(/\s+/).pop() || '');
  return /[^s]s$/i.test(noun) ? r : `${/^[aeiou]/i.test(r) ? 'an' : 'a'} ${r}`;
}
// A takeaway that reads as one clause is spoken as it is; a fragment (long, several commas, opens on a joining word) is quoted.
const OPENS_ON_JOINER = /^(?:so|while|with|from|and|but|which|that|because|instead|plus|then|yet|rather|not|including|without)\b/i;
function isRun(point: string): boolean {
  const commas = (point.replace(/\([^)]*\)/g, '').match(/,(?!\d)/g) || []).length;
  return point.length > 120 || commas >= 2 || OPENS_ON_JOINER.test(point.trim()) || /,\s+(?:so|which|while|because|instead of|and so)\b/i.test(point);
}
const tk = (x: string): string => (isRun(x) ? `"${x.replace(/[.;,\s]+$/, '')}"` : endSentence(capFirst(x)));
const normT = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const list = (items: string[]): string => items.map(tk).join(' ');

// No takeaways given: the sector's own measures, objection and proof shape (only when a sector is read).
function takeawaysFromSector(v: Vertical | null): string[] {
  if (!v) return [];
  return [
    `Where you stand on ${proseJoin(v.metrics.slice(0, 3))}`,
    `How to answer "${v.objections[0].objection}": ${lowerFirst(asAnswer(v.objections[0].response)).replace(/^the answer is to /, '')}`,
    `What a good proof point looks like: ${lowerFirst(v.proofShape).replace(/\.$/, '')}`
  ];
}

function productSentence(w: W): string {
  return w.productDescription ? `${w.productName} is ${lowerFirst(w.productDescription)}.` : '';
}

// The pain point of this audience: the problem the topic names, the role it falls on, and what the sector's buyers measure.
function painPoint(w: W): string {
  const v = w.ctx.v;
  const who = w.role ? `${whoIs(w)}${w.field ? ` in ${w.field}` : ''}` : 'this audience';
  const problem = w.problemPts.length ? `The problem we are here to take on${w.problemPts.some(isRun) ? ', in the words of the notes' : ''}: ${w.problemPts.map((x) => (isRun(x) ? `"${x.replace(/[.;,\s]+$/, '')}."` : endSentence(x))).join(' ')}` : w.problem ? `The problem we are here to take on: ${w.problem}.` : '';
  const measures = v ? `For ${who} the usual yardsticks are ${proseJoin(v.metrics.slice(0, 3))}.` : '';
  return [problem, measures].filter(Boolean).join(' ') || `Today's audience: ${w.audience}.`;
}

// The product line of a content block, by product_mention_level.
function productLine(w: W, k: number, blocks: number, mine: string[]): string {
  if (w.productLevel === 'none' || !w.productName) return '';
  const name = w.productName;
  if (w.productLevel === 'subtle') return k === 0 ? `\nA word on ${name}, kept short: ${productSentence(w) || `this session is hosted by ${name}.`}\n` : '';
  const on = mine[0] && !isRun(mine[0]) ? ` on "${short(mine[0], 110)}"` : '';
  const desc = k === 0 && productSentence(w) ? ` ${productSentence(w)}` : '';
  return w.productLevel === 'heavy'
    ? `\nHere is how ${name} works${on}.${desc}\n`
    : `\n${name} comes in at this point${on}.${desc}\n`;
}

const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
const agendaLine = (w: W): string => w.takeaways.length ? `What you will take away: ${w.takeaways.map((t, i) => `${ORD[i] || `number ${i + 1}`}, ${lowerFirst(tk(t))}`).join(' ')}` : '';
const stemOf = (x: string) => x.toLowerCase().replace(/(?:ing|ed|es|s)$/, '');
const wordsIn = (x: string) => new Set((x.toLowerCase().match(/[a-z]{4,}/g) || []).map(stemOf));
// The item that shares a word with the text; none shared means none.
function relatedOne(text: string, items: string[]): string {
  const tw = wordsIn(text);
  let best = ''; let bestN = 0;
  for (const it of items) { const n = [...wordsIn(it)].filter((x) => tw.has(x)).length; if (n > bestN) { best = it; bestN = n; } }
  return best;
}
const places = (w: W, v: Vertical): string => (w.field ? `${/s$/i.test(w.field) ? 'Among' : 'In'} ${w.field}` : `In ${kindOf(v)}`);
const hostName = (w: W): string => w.haveSpeakers ? w.speakers[0] : 'your host';
const others = (w: W): string => {
  const o = w.speakers.slice(1);
  if (!w.haveSpeakers) return 'the panelists';
  if (o.length === 0) return w.speakers[0];
  return o.some((x) => x.includes(',')) ? o.join('; ') : o.join(' and ');
};
const speakersSaid = (w: W): string => w.haveSpeakers ? (w.speakers.some((x) => x.includes(',')) ? w.speakers.join('; ') : proseJoin(w.speakers)) : '';

function seg(section: { name: string; duration: number }, screen: string, lines: string[]): string {
  return `\n### ${section.name} (${section.duration} min)\n\n**ON SCREEN: ${screen}**\n\n**SPEAKER:**\n"${lines.filter(Boolean).join('\n\n').replace(/"/g, "'")}"\n\n`;
}

function generateScriptSection(section: { name: string; duration: number; purpose: string }, w: W, blockIndex: number, blocks: number): string {
  const v = w.ctx.v;
  const label = clipAtWord(w.label, 120);
  const mine = blockTakeaways(w.takeaways, blockIndex, blocks);
  const t = w.takeaways;
  const kind = v ? kindOf(v) : '';
  const name = w.productName;
  const prod = name || 'it';
  const nextStep = v ? `The usual first step in ${w.field || kind}: ${lowerFirst(v.salesMotion)}` : '';
  const thanks = 'Thank you for joining.';
  const pollBlock = (q0: string, opts: string[]) => `**LAUNCH POLL: "${q0}"**\nPoll options:\n${opts.map((o) => `- ${o}`).join('\n')}`;
  const nth = (i: number) => t[i] ? tk(t[i]) : '';
  const objection = v ? v.objections[0] : null;
  const rec = '*Stage direction: add the line "This session is recorded and the link will follow" only if you record it.*';
  switch (section.name) {
    case 'Welcome & Housekeeping':
      return seg(section, 'Title slide with the webinar name', [
        `Welcome to ${named(w)}. This session runs ${w.minutes} minutes and is written for ${w.audience}.`,
        `Put your questions in the chat at any time; we have set time aside for them near the end.${w.includePolls ? ' We will run polls along the way, so keep the poll window open.' : ''}`
      ]).replace(/"\n\n$/, `"\n\n${rec}\n\n`);
    case 'Speaker Introduction':
      return seg(section, 'Speaker slide', [
        w.haveSpeakers ? `With us today: ${speakersSaid(w)}.` : 'I am your host for this session.'
      ]);
    case 'Agenda & Learning Objectives':
      return seg(section, 'Agenda slide', [
        t.length ? `Here is what we will cover:\n\n${t.map((x, i) => `${i + 1}. ${tk(x)}`).join('\n')}` : 'We will cover this topic.',
        v ? `By the end of this session, ${whoIs(w)} should be able to say where they stand on ${v.metrics[0]} and what to change first.` : ''
      ]);
    case 'Context Setting':
      return seg(section, 'Context slide', [
        `Our topic today is ${q(label)}.`,
        painPoint(w),
        v ? `${places(w, v)}, the people who decide this are usually ${proseJoin(v.buyerRoles.slice(0, 3))}.` : '',
        w.includePolls ? pollBlock('Which of these is closest to your situation today?', pollOptions(w.ctx)) : ''
      ]);
    case 'Main Content Block 1': case 'Main Content Block 2': case 'Main Content Block 3':
      return blockScript(section, w, mine, blockIndex, blocks);
    case 'Summary & Key Takeaways':
      return seg(section, 'Takeaways slide', [t.length ? `To sum up, the takeaways: ${list(t)}` : 'To sum up: that is this topic.']);
    case 'Q&A':
      return seg(section, 'Q&A slide', [
        `Now your questions. I will read each one aloud from the chat and answer it.`,
        objection ? `If the chat is quiet, I will start with the question we hear most: "${objection.objection}". ${asAnswer(objection.response)}` : '',
        'Questions we do not reach will be answered in the follow-up email.'
      ]);
    case 'Close & CTA':
      return seg(section, 'Next step slide', [
        t.length ? `Quick recap: ${list(t.slice(0, 3))}` : '',
        nextStep,
        name && w.productLevel === 'heavy' ? `To take this further with ${name}, reply to the follow-up email.` : '',
        thanks
      ]) + '**END WEBINAR**\n\n';
    // product demo
    case 'Welcome & Agenda':
      return seg(section, 'Agenda slide', [
        `Welcome to ${named(w)}. In the next ${w.minutes} minutes we will go through the following.`,
        agendaLine(w),
        `${w.haveSpeakers ? `With us: ${speakersSaid(w)}. ` : ''}Questions go in the chat.`
      ]).replace(/"\n\n$/, `"\n\n${rec}\n\n`);
    case 'Problem Context':
      return seg(section, 'Problem slide', [painPoint(w), v ? `${places(w, v)}, the people who decide this are usually ${proseJoin(v.buyerRoles.slice(0, 3))}.` : '', w.includePolls ? pollBlock('Which of these is closest to your situation today?', pollOptions(w.ctx)) : '']);
    case 'Product Overview':
      return seg(section, name ? `${name} on one screen` : 'The demo screen', [name ? (productSentence(w) || `This session is hosted by ${name}.`) : 'Here is what we show today, on one screen.', t[0] ? `It is here for one reason today: ${lowerFirst(tk(t[0]))}` : '']);
    case 'Feature Demo 1': case 'Feature Demo 2': case 'Feature Demo 3': {
      const i = Number(section.name.slice(-1)) - 1;
      return seg(section, t[i] ? `The screen that shows: ${short(t[i], 90)}` : 'The working screen', [
        t[i] ? `Demo ${i + 1}: ${tk(t[i])} I will show it live. Watch where it happens on the screen and say in the chat if you do this differently today.` : 'That covers every takeaway. I will use this part for questions from the chat and a second look at any screen you want to see again.',
        v && t[i] && relatedOne(t[i], v.metrics) ? `For ${whoIs(w)}, the measure this touches is ${toYou(relatedOne(t[i], v.metrics))}.` : ''
      ]);
    }
    case 'Use Case Examples':
      return seg(section, 'Example slide', [
        t.filter((x) => STAT.test(x)).length ? `The numbers behind this session: ${list(t.filter((x) => STAT.test(x)))}` : '',
        v ? `An example for ${kind} follows this shape: ${lowerFirst(endSentence(v.proofShape))}` : `No customer example was given, so this part is yours: tell one example with the numbers behind it, and say whose it is.`
      ]);
    case 'Pricing & Getting Started':
      return seg(section, 'Getting started slide', [`To get started: ${startingStep(w.model)}.`, name ? `That is how a team begins with ${name}.` : '']);
    case 'Special Offer & Close':
      return seg(section, 'Close slide', [nextStep, name ? `Thank you for joining. To go further with ${name}, reply to the follow-up email.` : thanks]) + '**END WEBINAR**\n\n';
    // panel
    case 'Welcome & Introductions':
      return seg(section, 'Panel slide', [
        `Welcome to ${named(w)}. ${w.haveSpeakers ? `On the panel: ${speakersSaid(w)}.` : 'I will introduce the panelists in a moment.'}`,
        `${others(w) === 'the panelists' ? 'Panelists' : others(w)}: please give us two sentences on your work and why this topic matters to you.`
      ]);
    case 'Topic Introduction':
      return seg(section, 'Topic slide', [`Our topic: ${q(label)}.`, painPoint(w)]);
    case 'Discussion Question 1': case 'Discussion Question 2': case 'Discussion Question 3': {
      const i = Number(section.name.slice(-1)) - 1;
      const dq = v ? v.discovery[i % v.discovery.length] : '';
      return seg(section, `Question ${i + 1}`, [
        dq ? `Question ${i + 1}, to ${others(w)}: ${dq}` : `Question ${i + 1}, to ${others(w)}: where does this hold in your experience, and where does it not?`,
        t[i] ? `It links to this takeaway: ${tk(t[i])}` : '',
        'I will ask one follow-up after each answer.'
      ]);
    }
    case 'Rapid Fire Round':
      return seg(section, 'Rapid fire slide', [v ? `Rapid fire, one sentence each: ${v.discovery[3 % v.discovery.length]}` : `Rapid fire, one sentence each: of the takeaways so far, which would you put first, and why?`]);
    case 'Audience Q&A':
      return seg(section, 'Q&A slide', [`Questions from the chat now. I will read each one aloud and hand it to ${others(w)}.`, objection ? `If the chat is quiet, I will start with the question we hear most: "${objection.objection}".` : '']);
    case 'Closing Thoughts':
      return seg(section, 'Closing slide', [`One thing each, ${others(w)}: what should ${w.audience} do next?`, t.length ? `Takeaways so far: ${list(t.slice(0, 3))}` : '']);
    case 'Close':
      return seg(section, 'Close slide', [thanks, nextStep]) + '**END WEBINAR**\n\n';
    // customer story
    case 'Welcome':
      return seg(section, 'Title slide', [w.haveSpeakers ? `Welcome to ${named(w)}. Joining us today: ${speakersSaid(w)}. Our guest is ${w.speakers[0]}.` : `Welcome to ${named(w)}. Our guest today is a customer.`, agendaLine(w)]);
    case 'Customer Introduction':
      return seg(section, 'Guest slide', [`${w.haveSpeakers ? w.speakers[0].split(',')[0] : 'Our guest'}, please tell us about your company and your role.`]);
    case 'The Challenge':
      return seg(section, 'Challenge slide', [w.problem ? `We have been talking about ${w.problem}. What did that look like for you before you made a change?` : `What was happening before you made a change? Tell it in your own words.`]);
    case 'Solution Discovery':
      return seg(section, 'Solution slide', [name ? `How did you find ${name}, and what made you choose it?` : 'How did you find us, and what made you choose us?', name && w.productDescription ? productSentence(w) : '']);
    case 'Implementation Journey':
      return seg(section, 'Journey slide', [`What was the ${startWords(w.model).rollout} like? Tell us one thing that went well and one that was hard.`]);
    case 'Results & Impact':
      return seg(section, 'Results slide', [`What changed, and how do you measure it?${v ? ` For ${kind}, the usual measures are ${proseJoin(v.metrics.slice(0, 3))}.` : ''}`, t.length ? `The takeaways we want to land: ${list(t)}` : '', 'We use only the numbers the customer agrees to share.']);
    case 'Live Demo/Walkthrough':
      return seg(section, "The customer's own screen", [name ? `Show us how your team uses ${name} day to day.` : 'Show us how your team works with this day to day.']);
    case 'Lessons Learned':
      return seg(section, 'Lessons slide', ['What would you tell a team that is starting today?']);
    // workshop
    case 'Welcome & Setup':
      return seg(section, 'Title slide', [`Welcome to ${named(w)}. ${w.haveSpeakers ? `Leading it: ${speakersSaid(w)}.` : ''} This is a working session of ${w.minutes} minutes for ${w.audience}.`, agendaLine(w)]);
    case 'Learning Objectives':
      return seg(section, 'Objectives slide', [t.length ? `By the end, you will have worked through:\n\n${t.map((x, i) => `${i + 1}. ${tk(x)}`).join('\n')}` : 'By the end, you will have worked on this topic.']);
    case 'Concept Introduction':
      return seg(section, 'Concept slide', [t[0] ? `The idea behind the first exercise: ${tk(t[0])}` : 'The idea behind the first exercise is the topic itself.', painPoint(w)]);
    case 'Exercise 1':
      return seg(section, 'Exercise 1 slide', [`Exercise one: ${t[1] ? tk(t[1]) : t[0] ? tk(t[0]) : 'work on the topic.'} You have ${section.duration} minutes. I am in the chat if you get stuck.`]);
    case 'Debrief 1':
      return seg(section, 'Debrief slide', [`Let us hear what you found. Who will share what they made?`]);
    case 'Exercise 2':
      return seg(section, 'Exercise 2 slide', [`Exercise two builds on the first: ${t[2] ? tk(t[2]) : t[1] ? tk(t[1]) : 'go one step further on the topic.'} You have ${section.duration} minutes.`, t[3] ? `One more point to keep in mind: ${tk(t[3])}` : '']);
    case 'Debrief 2':
      return seg(section, 'Debrief slide', [`Again: who will share what they made, and what they would change?`]);
    case 'Wrap-up & Resources':
      return seg(section, 'Wrap-up slide', [t.length ? `What we worked through: ${list(t)}` : '', nextStep, thanks]);
    // ask me anything
    case 'Welcome & Speaker Intro':
      return seg(section, 'Title slide', [`Welcome to ${named(w)}. ${w.haveSpeakers ? `Answering your questions today: ${speakersSaid(w)}.` : 'I am your host.'}`, 'Type your question in the chat; I will read it aloud before I answer.']);
    case 'Brief Topic Context':
      return seg(section, 'Topic slide', [`Our topic: ${q(label)}.`, painPoint(w), agendaLine(w)]);
    case 'Q&A Session':
      return seg(section, 'Q&A slide', [`First question. ${objection ? `If the chat is quiet, I will start with the question we hear most: "${objection.objection}". ${asAnswer(objection.response)}` : 'If the chat is quiet, I will start with the question I hear most.'}`, t[0] ? `Another place to start: ${tk(t[0])}` : '']);
    case 'Rapid Fire':
      return seg(section, 'Rapid fire slide', [v ? `Rapid fire, short answers: ${v.discovery[2 % v.discovery.length]}` : 'Rapid fire: short questions from the chat, one or two sentences each.', t.slice(1).length ? `Still to cover from the takeaways: ${list(t.slice(1, 4))}` : '']);
    default:
      return seg(section, section.name, [t.length ? list(t) : 'We continue with the topic.']);
  }
}

// One main content block: the takeaways it teaches, the sector measure, the chat question, the objection for later blocks, and the product line.
function blockScript(section: { name: string; duration: number }, w: W, mine: string[], k: number, blocks: number): string {
  const v = w.ctx.v;
  const lead = k === 0 ? "Let's start with the first idea." : k === blocks - 1 ? 'Last, and the most practical part.' : 'That brings us to the next part.';
  const kind0 = v ? kindOf(v) : '';
  const teach = mine.length ? list(mine) : v ? `Let us make this concrete. A good example for ${kind0} follows this shape: ${lowerFirst(endSentence(v.proofShape))}` : 'Let us make this concrete: we take the points so far and work through one case on this topic.';
  const measure = v ? v.metrics[(k * 2) % v.metrics.length] : '';
  const question = v ? bestQuestion(mine.join(' '), v.discovery.filter((d) => !/current provider|client's own words|signs off each|governed/i.test(d)), w.usedQ) : '';
  const objection = v && k >= 1 ? v.objections[(k - 1) % v.objections.length] : null;
  const nextT = blockTakeaways(w.takeaways, k + 1, blocks)[0];
  const next = k < blocks - 1 ? (nextT && !isRun(nextT) ? `Next: ${short(nextT, 100)}.` : '') : 'That covers the takeaways. Next, the summary.';
  const lines = [
    `${lead} ${teach}`,
    v ? `For ${whoIs(w)}, ${relatedOne(mine.join(' '), v.metrics) ? 'this comes down to' : 'the number to watch across this part is'} ${toYou(relatedOne(mine.join(' '), v.metrics) || measure)}. Question for the chat: "${toYou(question)}"` : '',
    v && k === 0 && mine.length ? `A proof point readers in ${kind0} trust: ${lowerFirst(endSentence(v.proofShape))}` : '',
    objection ? `You may be thinking: "${objection.objection}." ${asAnswer(objection.response)}` : '',
    productLine(w, k, blocks, mine).trim(),
    `${next} Any questions before we move on? Put them in the chat.`
  ];
  return seg(section as { name: string; duration: number }, 'Key concept slide', lines);
}

// Prepared answers: the sector's objections with the pattern of a good answer, and the first step. Only when a sector is read.
function qaPrep(w: W): string {
  const v = w.ctx.v;
  if (!v) return '';
  const first = w.takeaways[0];
  let n = 1;
  const out: string[] = [];
  out.push(`${n++}. **"How do we get started with this?"**\n   - Answer pattern: Deals in ${v.name} usually start like this: ${lowerFirst(v.salesMotion)}`);
  for (const o of v.objections.slice(0, 3)) out.push(`${n++}. **"${o.objection}"**\n   - Answer pattern: ${o.response}`);
  out.push(`${n++}. **"${first ? `Can you share more examples of this: ${short(first, 110)}?` : 'Can you share more examples?'}"**\n   - Answer pattern: Use an example that follows this shape: ${lowerFirst(v.proofShape)}`);
  out.push(`${n++}. **"How does this compare to what we do today?"**\n   - Answer pattern: Ask what their current setup does not do (${v.vocabulary.slice(0, 2).join(', ')} are good places to look), then show the difference on that point only.`);
  return `## Q&A Preparation\n\n### Anticipated Questions\n\n${out.join('\n\n')}\n\n---\n\n`;
}

// The three follow-up emails, written from the takeaways, the sector's objection and next step, and the product the user gave.
function followUps(w: W): string {
  const v = w.ctx.v;
  const t = w.takeaways;
  const label = clipAtWord(w.label, 90);
  const name = w.productName;
  const e1 = `### Email 1: Same day

**Subject:** Thank you for joining: ${label}

Thank you for joining.${t.length ? `\n\nThe takeaways, in short:\n${t.slice(0, 5).map((x, i) => `${i + 1}. ${tk(x)}`).join('\n')}` : ''}

Link the recording and the slides here only if you share them. Questions? Reply to this email.

---
`;
  const e2 = v ? `### Email 2: Day 3

**Subject:** A question from the session: ${v.objections[0].objection}

The question we hear most: "${v.objections[0].objection}". ${asAnswer(v.objections[0].response)}

---
` : t.length ? `### Email 2: Day 3

**Subject:** One point from the session: ${short(t[Math.min(1, t.length - 1)], 80)}

${endSentence(capFirst(t[Math.min(1, t.length - 1)]))} Reply with your own example.

---
` : '';
  const e3 = `### Email 3: Day 7

**Subject:** Your next step after the session

${v ? `The usual next step in ${w.field || kindOf(v)}: ${lowerFirst(v.salesMotion)}` : `Reply to this email to talk this through.`}${name ? `\n\n${productSentence(w) ? `${productSentence(w)} Reply to this email to talk it through with ${name}.` : `To talk it through with ${name}, reply to this email.`}` : ''}

---
`;
  return `${e1}\n${e2 ? e2 + '\n' : ''}${e3}`;
}
