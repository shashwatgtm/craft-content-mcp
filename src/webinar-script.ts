import { lowerFirstIfCommon, cap, aOrAn } from './utils.js';
import { q, readContext, startWords, audienceLine, isClause, type Vertical, type BusinessModel } from './sector.ts';
import { splitList, bestQuestion, unpackTopic, fixNumbers, endSentence, capFirst, proseJoin, roleOf, clipAtWord, productParts, softenClaims } from './draft.ts';
import { cleanSectorLine, readPoints, groupPhrases, sentenceOf, withLabel, shorten, waysToSettle, settleBare, quotedEnd, instructionNote, sharpenLine, stripGuardQuotes, lowerFirstSafe, audienceShort, shapeOf, startsImperative, companyFrom, toReader as toYou, PARTICIPLE_START, type Pt } from './rw-content.ts';

// Run 22 (rewrite): the script is written to be read aloud. The takeaways are read for what they are and said in whole sentences, the
// problem the topic names is said as the problem, and the sector file adds the measures, the questions for the chat and the objections.
// Nothing a host would have to skip is in the spoken lines: advice to the author is kept out of the script. No figure, customer, quote
// or promise is added (B82); what was not given is named once at the end.

type Ctx = { v: Vertical | null; model: BusinessModel | null; line: string; how: string };

// Everything a section of the script needs, read once from the inputs.
interface W {
  usedQ: Set<string>; usedM: Set<string>;
  topic: string; label: string; clause: boolean; problem: string; audience: string; role: string; field: string; connector: string;
  takeaways: Pt[]; speakers: string[]; product: string; productLevel: string; includePolls: boolean; ctx: Ctx;
  metrics: string[]; objectionHeld: string; haveTakeaways: boolean; haveSpeakers: boolean; problemPts: Pt[]; minutes: number; productDescription: string; productName: string; model: BusinessModel | null; type: string; shortTopic: boolean; who: string;
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
  const parts = unpackTopic(topic);
  const firstClause = (parts.problem || '').split(/[,;:]| \(/)[0].trim();
  const label = parts.short ? topic : (firstClause && firstClause.length <= 110 && firstClause.length > parts.label.length && firstClause.toLowerCase().startsWith(parts.label.toLowerCase()) ? firstClause : parts.label);
  const clause = isClause(topic) || !parts.short || LABEL_CLAUSE.test(label);
  const audienceFull = args.target_audience.trim();
  const audience = audienceShort(audienceFull);
  const { role, field, connector } = splitAudience(audience);
  const duration = args.duration || '60_min';
  const type = args.webinar_type;
  const speakerRaw = args.speakers ? stripGuardQuotes(args.speakers) : '';
  const speakerList = speakerRaw
    ? (/[;\n]/.test(speakerRaw) ? speakerRaw.split(/[;\n]/).map((x) => x.trim()).filter(Boolean) : joinNameAndTitle(splitList(speakerRaw), speakerRaw))
    : [];
  const orders: string[] = [];
  const speakers = speakerList.filter((x) => { if (INSTRUCTION_LIKE.test(x)) { orders.push(x); return false; } return true; });
  const includePolls = args.include_polls ?? true;
  const productLevel = args.product_mention_level || 'subtle';
  const given = (args.your_product || '').trim();
  const company = parts.company && parts.company.split(/\s+/).length <= 4 ? parts.company : (companyFrom(topic) || parts.company);
  const product = given || (productLevel === 'none' ? '' : company);
  const ctx: Ctx = readContext(args.business_model, { seller: [given || parts.company || company, parts.problem || topic], context: [args.key_takeaways, args.speakers], role: [audienceFull], buyer: [parts.audience, audienceFull] });

  // the takeaways: read for what each one is; the problem the topic names is said once, as the problem
  const haveTakeaways = !!(args.key_takeaways && args.key_takeaways.trim());
  const soft0 = softenClaims(args.key_takeaways || '');
  const soft = soft0.removed.length ? soft0 : { text: args.key_takeaways || '', removed: [] as string[] };
  const softP = softenClaims(parts.problem || '');
  const all = readPoints(soft.text, { problem: soft0.removed.length || softP.removed.length ? softP.text : parts.problem || '' });
  for (const p of all) if (p.role === 'instruction') orders.push(p.text);
  const problemPts = all.filter((p) => p.role === 'problem');
  const given2 = groupPhrases(all.filter((p) => p.role !== 'problem' && p.role !== 'instruction'));
  const takeaways: Pt[] = given2.length ? given2 : takeawaysFromSector(ctx.v);
  const productLabel = given ? productParts(given).name : product;
  const w: W = { usedQ: new Set<string>(), usedM: new Set<string>(), topic, label, clause, problem: parts.problem || '', audience, role, field, connector, takeaways, speakers, product, productLevel, includePolls, ctx, haveSpeakers: speakers.length > 0, haveTakeaways, problemPts, metrics: [], objectionHeld: '', minutes: 0, productDescription: '', productName: '', model: ctx.model, type, shortTopic: parts.short, who: productLevel === 'none' ? '' : productLabel };
  // the sector's measures that fit the kind of product and the topic: they share a word with it or belong to the same theme (security with blocked
  // or fraud measures, price with cost measures); the measures of another kind of product are left out
  if (ctx.v) {
    const hay = `${topic} ${takeaways.map((p) => p.text).join(' ')}`;
    const stemOf5 = (x: string) => x.replace(/(?:ing|ed|es|s)$/, '').slice(0, 6);
    const tw = new Set((hay.toLowerCase().match(/[a-z]{5,}/g) || []).map(stemOf5));
    const ranked = ctx.v.metrics.map((m) => ({ m, n: (m.toLowerCase().match(/[a-z]{5,}/g) || []).filter((x) => tw.has(stemOf5(x))).length + themeScore(hay, m) + themeScore(topic, m, 2) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
    w.metrics = !haveTakeaways ? ctx.v.metrics.slice(0, 4) : ranked.slice(0, 4).map((x) => x.m);
    const ow = (x: string) => new Set((x.toLowerCase().match(/[a-z]{5,}/g) || []).map(stemOf5));
    const objRank = ctx.v.objections.map((o) => ({ o: o.objection, n: [...ow(`${o.objection} ${o.response}`)].filter((x) => tw.has(x)).length + themeScore(hay, `${o.objection} ${o.response}`) })).sort((a, b) => b.n - a.n)[0];
    w.objectionHeld = !haveTakeaways ? ctx.v.objections[0].objection : objRank && objRank.n > 0 ? objRank.o : '';
  }

  const durationMap: Record<string, number> = { '30_min': 30, '45_min': 45, '60_min': 60, '90_min': 90 };
  const minutes = durationMap[duration] || 60;
  w.minutes = minutes;
  const durationSupplied = !!args.duration && Object.prototype.hasOwnProperty.call(durationMap, args.duration);
  const pp = given ? productParts(given) : null;
  w.productName = productLevel === 'none' ? '' : (pp ? pp.name : product);
  w.productDescription = pp && pp.description !== pp.name && pp.description.length > pp.name.length + 3 ? pp.description.replace(/\.$/, '') : '';
  const structure = getWebinarStructure(type, minutes);

  const productNote = given
    ? (productLevel === 'none' ? `your_product (${given}) is not mentioned in the script because product_mention_level is none.` : `${w.productName || given} is mentioned at the "${productLevel}" level.`)
    : product ? `your_product was not given; ${product} is read from the topic and mentioned at the "${productLevel}" level.`
    : '';

  const bareClaimsFor = takeaways.filter((p) => !p.label && shapeOf(p) !== 'imperative' && shapeOf(p) !== 'example' && p.role !== 'instruction' && p.role !== 'problem' && CLAIM_WORD.test(p.text) && haveTakeaways);
  const missing: { field: string; change: string }[] = [];
  if (!w.haveSpeakers) missing.push({ field: 'speakers', change: type === 'panel_discussion' ? 'the introductions and every line addressed to a panelist, which now say "your host" and "the panelists"' : type === 'customer_story' ? 'the guest introduction, which now says "our guest"' : 'the introduction, which now says "your host"' });
  if (!haveTakeaways) missing.push({ field: 'key_takeaways', change: ctx.v ? "the teaching content, which now comes from the sector's own measures, objection and proof shape" : 'the teaching content, which cannot be written without takeaways or a sector' });
  if (!product && productLevel !== 'none') missing.push({ field: 'your_product', change: 'every line that names what you sell' });
  if (bareClaimsFor.length) missing.push({ field: `a source for ${bareClaimsFor.length <= 2 ? proseJoin(bareClaimsFor.map((p) => `"${claimPart(p.text)}"`)) : 'each claim the script marks as the vendor\'s description'}`, change: `the ${bareClaimsFor.length === 1 ? 'line' : 'lines'} that mark ${bareClaimsFor.length === 1 ? 'it' : 'them'} as the vendor's description` });
  if (!args.business_model && ctx.v && ctx.how !== 'input') missing.push({ field: 'business_model', change: 'the wording that depends on how you sell, which now follows the usual model of this sector' });
  if (!durationSupplied) missing.push({ field: 'duration', change: `the timings, which assume ${minutes} minutes` });
  const notes: string[] = [];
  if (productNote) notes.push(productNote.replace(/^your_product was not given; /, 'No product was given; '));
  if (soft.removed.length) notes.push(`Claims to source before you publish: your takeaways use ${proseJoin(soft.removed.map((c) => `"${c}"`))}. The script leaves them out; add one back only with a source a reader can check.`);
  if (orders.length) notes.push(instructionNote(orders));
  const unsourced = takeaways.filter((p) => p.figure && !p.label && haveTakeaways && !bareClaimsFor.includes(p));
  if (unsourced.length) notes.push(`Figures with no source label: ${proseJoin(unsourced.map((p) => `"${p.text}"`))}. Say where each one comes from before the session.`);
  const bareClaims = bareClaimsFor;
  if (bareClaims.length) notes.push(`Claims with no source label: ${proseJoin(bareClaims.map((p) => `"${p.text}"`))}. The script marks each as the vendor's description and does not promise it; say where each comes from, or leave it out, before the session.`);
  notes.push('If you record the session, add a line at the start that says so, and link the recording and slides in the first follow-up email only if you share them.');
  if (ctx.v) notes.push(`Confirm that you offer ${nextStepPhrase(ctx.model)} before you say it in the close; the script names it because it is the usual first step for this kind of business.`);

  let output = `# Webinar Script: ${parts.short ? topic : `${cap(type.replace(/_/g, ' '))} webinar${productLabel && productLevel !== 'none' ? ` with ${productLabel}` : ''} for ${audience}`}

---

## Key Takeaways for Audience

${takeaways.map((t, i) => `${i + 1}. ${tk(t, w)}`).join('\n') || 'No takeaways could be written: none were given and no sector was read.'}

---

## Run of Show

${generateRunOfShow(structure, minutes)}

---

## Full Script

`;

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
## Notes for you

${cleanSectorLine(ctx.line)}

${notes.map((n) => `- ${n}`).join('\n')}

### What this script was built from

| Setting | Value |
|---------|-------|
| **Topic** | ${topic} |
| **Duration** | ${minutes} minutes${durationSupplied ? '' : ' (default)'} |
| **Type** | ${type.replace(/_/g, ' ')} |
| **Audience** | ${audienceFull} |
| **Speakers** | ${w.haveSpeakers ? (speakers.some((x) => x.includes(',')) ? speakers.join('; ') : speakers.join(', ')) : 'not given'} |
| **Product Mentions** | ${productLevel}${args.product_mention_level ? '' : ' (default)'} |
${missing.length ? `\n${sharpenLine(missing)}\n` : ''}`;

  return output.replace(/\n{3,}/g, '\n\n');
}

const INSTRUCTION_LIKE = /\b(?:ignore|disregard|forget|override)\b.{0,60}\b(?:instructions?|prompts?|rules?|above|previous|prior)\b|\bsystem prompt\b/i;

// "Heads of customer operations at online retailers": the role is everything before " at ", the field what follows.
function splitAudience(audience: string): { role: string; field: string; connector: string } {
  const m = audience.trim().match(/^(.+?)\s+(at|in)\s+(.+)$/i);
  if (m && m[1].split(/\s+/).length <= 7) return { role: m[1].trim(), field: m[3].trim(), connector: m[2].toLowerCase() };
  const r = roleOf(audience);
  return { role: r.role, field: r.field, connector: 'in' };
}

// "Name, Title" typed for one speaker without a semicolon: the second part is a title, so the two stay together.
const TITLE_START = /^(?:head|director|vp|vice|chief|manager|lead|engineer|founder|co-?founder|ceo|cto|cfo|cmo|coo|cio|ciso|president|partner|principal|senior|solutions?|product|sales|marketing|customer|general|owner|analyst|consultant|architect|specialist|advisor|adviser|professor|dr)\b|\b(?:at|of|from)\s+[A-Z]/i;
function joinNameAndTitle(list: string[], raw: string): string[] {
  if (list.length === 2 && !/[;\n]/.test(raw) && TITLE_START.test(list[1]) && list[0].split(/\s+/).length <= 4) return [`${list[0]}, ${list[1]}`];
  return list;
}

const LABEL_CLAUSE = /\b(?:is|are|was|were|run|runs|combine|combines|means|rely|relies|chain|chains|sits|happens|hand|hands|can|will|must|should|have|has|do|does|break|breaks|fragments|drift|drifts)\b/i;
const lowerFirst = (s: string) => lowerFirstSafe(s);
const lower = (s: string) => lowerFirstSafe(s);

// The sector block printed once below the script: who the audience usually is, what it measures, the proof that lands.
function sectorNotes(ctx: Ctx, w: W): string {
  const v = ctx.v;
  if (!v) return `\n## Sector Notes\n\nNo sector could be read from what you typed, so the script holds only your own words. Name the audience's industry or your product category to get the sector's measures, questions and objections into the lines.\n`;
  return `
## Sector Notes: ${cap(v.name)}

- ${audienceLine(v)}
- **Who sits in the buying group:** ${v.committee}
- **Terms this audience uses:** ${v.vocabulary.slice(0, 6).join(', ')}.
- **Objections to expect:** ${v.objections.map((o) => o.objection.toLowerCase()).join('; ')}.
- **A proof point that lands:** ${v.proofShape}
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

// What the usual first step is, by business model, said as a thing a listener can ask for (no trial, plan or demo word for a business that has none).
function nextStepPhrase(model: BusinessModel | null): string {
  switch (model) {
    case 'saas': return 'a walk through of the plans and how it would fit your team';
    case 'services': return 'a scoping conversation on the work in scope, the service levels and the transition plan';
    case 'connectivity': return 'a site survey and a conversation about pilot sites';
    case 'investment': return 'a conversation about the mandate and the reporting';
    case 'transactions': return 'a look at the integration steps and the first live transactions';
    case 'marketplace': return 'a look at the sign-up checks and the first listing';
    case 'hardware_software': return 'a site visit and a plan for pilot units';
    default: return 'a conversation about the first step';
  }
}

// Poll options: the sector's own measure and objection when the sector is known and the measure fits the topic, four neutral options otherwise.
function pollOptions(w: W): string[] {
  const v = w.ctx.v;
  if (v && w.metrics.length) {
    return [
      `We measure ${w.metrics[0]} today and know where we stand`,
      `We know ${w.metrics[0]} matters but do not measure it yet`,
      w.objectionHeld ? `${cap(w.objectionHeld)}: that is what holds us back` : 'Something else is holding us back',
      'This is not a priority this year'
    ];
  }
  return ['We have a plan and it is working', 'We have tried and it stalled', 'We have not started yet', 'This is not a priority this year'];
}

// The takeaways of one main content block: the takeaways are shared out over the blocks in order, so every one is taught.
function blockTakeaways(takeaways: Pt[], block: number, blocks: number): Pt[] {
  const n = takeaways.length;
  const base = Math.floor(n / blocks);
  const extra = n % blocks;
  const start = block * base + Math.min(block, extra);
  return takeaways.slice(start, start + base + (block < extra ? 1 : 0));
}

// ---------------------------------------------------------------------------------------------------------------------------
// Spoken lines built from the inputs.
// ---------------------------------------------------------------------------------------------------------------------------
const kindOf = (v: Vertical): string => (v.name.includes(',') ? v.name.split(',').slice(1).join(',').trim() : v.name);
// "a CFO", but a plural role ("project executives") takes no article.
function whoIs(w: W): string {
  if (!w.role) return 'this audience';
  const r = lowerFirstIfCommon(w.role);
  const noun = (r.split(/\s+(?:of|for)\s+/i)[0].split(/\s+/).pop() || '');
  return /[^s]s$/i.test(noun) ? r : `${aOrAn(w.role)} ${r}`;
}
// A role in the singular is said as a group ("people in the role of CFO"), so the session is never for one person.
function roleGroup(w: W): string {
  if (!w.role) return 'this audience';
  const noun = (lowerFirstIfCommon(w.role).split(/\s+(?:of|for)\s+/i)[0].split(/\s+/).pop() || '');
  return /[^s]s$/i.test(noun) ? lowerFirstIfCommon(w.role) : `people in the role of ${w.role}`;
}
const audienceSpoken = (w: W): string => (w.field ? `${roleGroup(w)} ${w.connector} ${w.field}` : lowerFirstIfCommon(w.audience));
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth'];

// Themes that link a topic to the sector's own measures and questions without adding any fact: a topic about phishing, scams or fraud fits the measures
// that count what is blocked or lost; a topic about price fits the cost measures; and so on.
const THEMES: [RegExp, RegExp][] = [
  [/\b(?:phish\w*|scam\w*|fraud\w*|spoof\w*|impersonat\w*|abuse\w*|spam\w*|threat\w*|attack\w*|malware|malicious|breach\w*)\b/i, /\b(?:fraud|blocked|artificial|abuse|spam|phish|false positive|impersonat|loss|threat|attack|incident|breach|malicious|suspicious)\w*/i],
  [/\b(?:cost\w*|pric\w*|fees?|saving\w*|spend\w*|budget\w*|cheap\w*|afford\w*)\b/i, /\b(?:cost|price|fee|margin|saving|spend|budget|per seat|per message|per record)\w*/i],
  [/\b(?:onboard\w*|activation|time to value|go[- ]live|implementation|set ?up)\b/i, /\b(?:onboard|activation|time to (?:go live|value|first|live)|go live|implementation|set ?up)\w*/i],
  [/\b(?:real[- ]time|latency|speed\w*|fast\w*|instant\w*|seconds|milliseconds?|response times?)\b/i, /\b(?:time to|latency|speed|response|turnaround)\w*/i],
  [/\b(?:reliab\w*|uptime|availab\w*|outage\w*|downtime|resilien\w*)\b/i, /\b(?:uptime|availability|outage|downtime|incident)\w*/i],
  [/\b(?:convers\w*|sign-?ups?|checkout|funnel|abandon\w*)\b/i, /\b(?:conversion|sign-?up|checkout|funnel|abandon)\w*/i],
  [/\b(?:accura\w*|errors?|quality|mistakes?|defects?)\b/i, /\b(?:accuracy|error|quality|rework|defect)\w*/i],
  [/\b(?:compliance|regulat\w*|audit\w*|licen[cs]\w*)\b/i, /\b(?:compliance|audit|regulat|licen)\w*/i],
  [/\b(?:retention|churn|renewal\w*)\b/i, /\b(?:retention|churn|renewal)\w*/i]
];
const themeScore = (text: string, item: string, weight = 3): number => (THEMES.some(([a, b]) => a.test(text) && b.test(item)) ? weight : 0);

// A claim a listener could ask "who says so?" about: a partnership, a patent, a licence, a first or a largest, a ranking.
const CLAIM_WORD = /\b(?:patent\w*|partner\w*|certified|licen[cs]ed|award\w*|largest|biggest|first|leader|leading|only|#1|ranked|approved|accredited|blockchain\w*|single source of truth|unified|end-to-end|all-in-one|ai[- ]powered|ai[- ]native|proprietary|seamless\w*|built (?:on|to|for)|powered by|fastest|best|world[- ]class|industry[- ]leading|cutting[- ]edge|state[- ]of[- ]the[- ]art|full (?:model )?ownership|stand alone)\b/i;
const VENDOR = "the vendor's description";
// "unify X, deliver Y and protect Z": a run of instructions said as what the listener will learn to do.
function howTo(text: string): string {
  const parts = text.split(/,\s+(?=[a-z]+\b)/).map((x) => x.trim()).filter(Boolean);
  const verbs = parts.every((x) => startsImperative(x));
  if (!verbs || parts.length < 2) return lower(text);
  return parts.length === 2 ? `${lower(parts[0])} and ${lower(parts[1])}` : `${parts.slice(0, -1).map(lower).join(', ')} and ${lower(parts[parts.length - 1])}`;
}
// One takeaway as a whole sentence to be said aloud. The sentence is built from the shape of the point: a statement stands as it is; a
// run of instructions is what the listener will learn to do; a phrase is what the session shows or covers. A fragment is never given a
// verb that does not fit it.
function tk(p0: Pt, w: W, after = false): string {
  const shape = shapeOf(p0);
  const claim = !p0.label && shape !== 'imperative' && shape !== 'example' && p0.role !== 'instruction' && p0.role !== 'problem' && CLAIM_WORD.test(p0.text) && w.takeaways.includes(p0) && w.haveTakeaways;
  const p: Pt = claim ? { ...p0, label: VENDOR } : p0;
  const t = withLabel(p);
  switch (shape) {
    case 'clause': return endSentence(capFirst(t));
    case 'imperative': return endSentence(after ? `How to ${howTo(withLabel(p))}` : `You will learn how to ${howTo(withLabel(p))}`);
    case 'example': return endSentence(`For example, ${lower(withLabel({ ...p, text: p.text.replace(/^(?:such as|for example|e\.g\.)\s+/i, '') }))}`);
    case 'participle': return w.who ? sentenceOf(p, w.who) : endSentence(`A point to cover: ${lower(t)}`);
    case 'adjective': return endSentence(`${w.who || 'The approach'} is ${lower(t)}`);
    case 'gerund': return endSentence(`${after ? 'We covered' : 'We will cover'} ${lower(t)}`);
    default:
      if (p.role === 'result' || p.role === 'quote' || p.role === 'recognition' || p.role === 'scale' || p.role === 'story') return sentenceOf(p, w.who);
      if (claim) return endSentence(`${after ? 'We covered' : 'We will cover'} ${lower(t)}`);
      if (p.role === 'outcome') return endSentence(`${after ? 'The outcome to expect' : 'You will hear what to expect'}: ${lower(t)}`);
      return endSentence(`${after ? 'We covered' : 'You will see'} ${lower(t)}`);
  }
}
const NUM = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
const ordered = (list: Pt[], w: W, style = 0): string => list.map((t, i) => (style === 0 ? `${cap(ORD[i] || `number ${i + 1}`)}, ${lower(tk(t, w))}` : `Number ${NUM[i] || i + 1}: ${tk(t, w)}`)).join(' ');
const numbered = (list: Pt[], w: W, from = 0): string => list.map((t, i) => {
  const text = i > 0 ? tk(t, w).replace(/^We will cover /, 'We will also cover ') : tk(t, w);
  const n = NUM[from + i] || from + i + 1;
  // a sentence that has a lead-in with a colon of its own follows the number after a comma, so there is one colon only
  return /^[A-Z][^.:]{0,40}:/.test(text) ? `Point ${n}, ${lower(text)}` : `Point ${n}: ${text}`;
}).join(' ');

// No takeaways given: the sector's own measures, objection and proof shape (only when a sector is read).
function takeawaysFromSector(v: Vertical | null): Pt[] {
  if (!v) return [];
  const mk = (text: string): Pt => ({ text, label: '', role: 'capability', clause: true, figure: false });
  const o = v.objections[0];
  const settle = settleBare(o.response);
  return [
    mk(`you can say where you stand on ${proseJoin(v.metrics.slice(0, 3))}`),
    ...(settle ? [mk(`the objection "${o.objection}" can be tested, by learning to ${settle}`)] : [mk(`you will hear the objection "${o.objection}" and how to weigh it`)]),
    mk(`good evidence looks like this: ${lowerFirst(toYou(v.proofShape).replace(/\.$/, ''))}`)
  ];
}

function productSentence(w: W): string {
  return w.productDescription ? `${w.productName} is ${lowerFirst(w.productDescription)}.` : '';
}

// The problem the topic names, said as the problem; the role it falls on and what the sector's buyers measure.
function problemSpoken(w: W): string {
  const texts = w.problemPts.length ? w.problemPts.map((p) => p.text) : w.problem ? [w.problem] : [];
  if (!texts.length) return '';
  const sentences = texts.flatMap((t) => t.split(/;\s+/)).map((x) => endSentence(capFirst(x.trim())));
  return `Here is the problem we are here to take on. ${sentences.join(' ')}`;
}
function painPoint(w: W): string {
  const v = w.ctx.v;
  const who = w.role ? `${whoIs(w)}${w.field ? ` ${w.connector} ${w.field}` : ''}` : 'this audience';
  const measures = v && w.metrics.length ? `For ${who}, the usual yardsticks are ${proseJoin(w.metrics.slice(0, 3))}.` : '';
  return [problemSpoken(w), measures].filter(Boolean).join(' ') || `Today's audience: ${w.audience}.`;
}

// The product line of a content block, by product_mention_level.
function productLine(w: W, k: number, mine: Pt[]): string {
  if (w.productLevel === 'none' || !w.productName) return '';
  const name = w.productName;
  if (w.productLevel === 'subtle') return k === 0 && productSentence(w) ? `A word on ${name}, kept short. ${productSentence(w)}` : '';
  const on = mine[0] && mine[0].text.length <= 90 ? ` on the point "${mine[0].text.replace(/"/g, "'")}"` : '';
  const desc = k === 0 && productSentence(w) ? ` ${productSentence(w)}` : '';
  return w.productLevel === 'heavy' ? `Here is how ${name} works${on}.${desc}` : `${name} comes in at this point${on}.${desc}`;
}

// A short phrase cut at a natural joint: the whole text when it fits, else the words before the first joining word (never in the middle of a name or a list).
const JOINER_END = /\b(?:a|an|the|of|to|and|or|with|for|in|on|at|by|is|are|than|as|from|via|so|that|which)$/i;
function cutPhrase(text: string, max: number): string {
  const t = text.replace(/^["\u201c]|["\u201d]$/g, '').replace(/\s+/g, ' ').trim().replace(/[.!?:;,]+$/, '');
  if (t.length <= max) return t;
  const joint = /,\s+|\s+(?:with|behind|that|which|so|through|across|including|via|using|and|while|because|from|at)\s+/gi;
  for (const m of t.matchAll(joint)) {
    const head = t.slice(0, m.index ?? 0).trim();
    if (head.length > max) break;
    // a comma inside a list ("noisy, accented or overlapping") is not a joint
    if (m[0].startsWith(',') && /^\S+(?:\s+\S+){0,2}\s+(?:or|and)\s/i.test(t.slice((m.index ?? 0) + m[0].length))) continue;
    if (head.split(/\s+/).length >= 3 && !JOINER_END.test(head)) return head;
  }
  return shorten(t, max, false);
}
// A takeaway named by what it is about, for the agenda, the summary and the pointer to the next part: never by its number.
function labelOf(p: Pt, w: W): string {
  const sh = shapeOf(p);
  if (sh === 'imperative') {
    const full = howTo(p.text).replace(/,\s+not\s+[^,]+$/i, '');
    return `how to ${full.length <= 80 ? full : cutPhrase(full, 80)}`;
  }
  if (sh === 'clause') return `the point that ${lower(cutPhrase(p.text, 80))}`;
  const body = cutPhrase(p.text, 70);
  switch (p.role) {
    case 'result': return /^(?:[$\u20ac\u00a3]|\d|up to|more than|over|about|around|nearly)/i.test(body) ? `the ${body} result` : `the result on ${lower(body)}`;
    case 'quote': return p.text.length <= 50 ? `the quote "${body}"` : 'the customer quote';
    case 'recognition': return `the recognition "${body}"`;
    case 'scale': return `the scale figure "${body}"`;
    case 'story': return `the customer story "${body}"`;
    default: return lower(body);
  }
}
// The part of a long claim that makes it a claim ("a blockchain based single source of truth"), for the closing request for a source.
function claimPart(text: string): string {
  if (text.length <= 90) return lower(text);
  const pieces = text.split(/,\s+|;\s+/);
  const at = pieces.findIndex((x) => CLAIM_WORD.test(x));
  if (at > 0) return lower(pieces[at].replace(/^(?:with|and|plus|including)\s+/i, '').trim());
  return lower(cutPhrase(text, 70));
}
// "If you do one thing this week": the first instruction in the takeaways as the user wrote it, else a step that fits any takeaway.
function doOneLine(w: W): string {
  if (!w.takeaways.length) return '';
  const pick = w.takeaways.find((p) => shapeOf(p) === 'imperative' && !p.figure && p.text.length <= 110);
  return pick ? `If you do one thing this week, ${howTo(pick.text)}.` : 'If you do one thing this week, take one live case from your own work and test it against what we covered today.';
}
// The agenda says how the time is used, part by part. It does not read the takeaways again.
const agendaLine = (w: W): string => {
  if (!w.takeaways.length) return '';
  const blocks = 3;
  const out: string[] = [];
  for (let b = 0; b < blocks; b++) {
    const mine = blockTakeaways(w.takeaways, b, blocks);
    if (!mine.length) continue;
    out.push(`Part ${NUM[out.length]} covers ${proseJoin(mine.map((p) => labelOf(p, w)))}.`);
  }
  return `Here is how we will use the time. ${out.join(' ')}`;
};
const stemOf = (x: string) => x.toLowerCase().replace(/(?:ing|ed|es|s)$/, '');
const wordsIn = (x: string) => new Set((x.toLowerCase().match(/[a-z]{4,}/g) || []).map((y) => stemOf(y).slice(0, 6)));
// The item that shares a word or a theme with the text; none shared means none. A measure already used once counts one less.
function relatedOne(text: string, items: string[], used: Set<string> = new Set()): string {
  const tw = wordsIn(text);
  let best = ''; let bestN = 0;
  for (const it of items) { const n = [...wordsIn(it)].filter((x) => tw.has(x)).length + themeScore(text, it) - (used.has(it) ? 1 : 0); if (n > bestN) { best = it; bestN = n; } }
  return best;
}
const places = (w: W, v: Vertical): string => (w.field ? `${/s$/i.test(w.field) ? 'Among' : 'In'} ${w.field}` : `In ${kindOf(v)}`);
const others = (w: W): string => {
  const o = w.speakers.slice(1);
  if (!w.haveSpeakers) return 'the panelists';
  if (o.length === 0) return w.speakers[0];
  return o.some((x) => x.includes(',')) ? o.join('; ') : o.join(' and ');
};
const speakersSaid = (w: W): string => w.haveSpeakers ? (w.speakers.some((x) => x.includes(',')) ? w.speakers.join('; ') : proseJoin(w.speakers)) : '';
// How the session is named aloud: a topic that is a problem is introduced as today's session, with the problem said in the context part.
const withWho = (w: W): string => (w.who && w.productLevel !== 'none' && !(w.productLevel === 'subtle' && w.productDescription) ? ` with ${w.who}` : '');
const named = (w: W): string => `${w.shortTopic ? `today's session on ${q(clipAtWord(w.label, 120))}` : "today's session"}${withWho(w)}`;
const topicLine = (w: W): string => (w.shortTopic ? `Our topic today is ${q(clipAtWord(w.label, 120))}.` : '');
const nextStep = (w: W): string => `If you would like to take this further, reply to the follow-up email and ask for ${nextStepPhrase(w.model)}${w.productLevel === 'heavy' && w.productName ? ` with ${w.productName}` : ''}.`;
const settleLine = (w: W, response: string, mode: 'block' | 'qa' | 'email' = 'block'): string => waysToSettle(response) || (mode === 'qa' ? '' : mode === 'email' ? 'Reply to this email and we will answer it.' : 'We will take it in the questions at the end.');

function seg(section: { name: string; duration: number }, screen: string, lines: string[]): string {
  return `\n### ${section.name} (${section.duration} min)\n\n**ON SCREEN: ${screen}**\n\n**SPEAKER:**\n"${lines.filter(Boolean).join('\n\n').replace(/"/g, "'")}"\n\n`;
}

function generateScriptSection(section: { name: string; duration: number; purpose: string }, w: W, blockIndex: number, blocks: number): string {
  const v = w.ctx.v;
  const mine = blockTakeaways(w.takeaways, blockIndex, blocks);
  const t = w.takeaways;
  const kind = v ? kindOf(v) : '';
  const name = w.productName;
  const thanks = 'Thank you for joining.';
  const pollBlock = (q0: string, opts: string[]) => `**LAUNCH POLL: "${q0}"**\nPoll options:\n${opts.map((o) => `- ${o}`).join('\n')}`;
  const objection = v ? v.objections[2 % v.objections.length] : null;
  const duration = `This session runs ${w.minutes} minutes and is for ${audienceSpoken(w)}.`;
  switch (section.name) {
    case 'Welcome & Housekeeping':
      return seg(section, 'Title slide with the webinar name', [
        `Welcome to ${named(w)}. ${duration}`,
        `Put your questions in the chat at any time; we have set time aside for them near the end.${w.includePolls ? ' We will run polls along the way, so keep the poll window open.' : ''}`
      ]);
    case 'Speaker Introduction':
      return seg(section, 'Speaker slide', [w.haveSpeakers ? `With us today: ${speakersSaid(w)}.` : 'I am your host for this session.']);
    case 'Agenda & Learning Objectives':
      return seg(section, 'Agenda slide', [
        t.length ? agendaLine(w) : 'We will cover this topic.',
        v && w.metrics.length ? `By the end of this session, you should be able to say where you stand on ${w.metrics[0]} and what to change first.` : 'By the end of this session, you should know what to try first on your own work.'
      ]);
    case 'Context Setting':
      return seg(section, 'Context slide', [
        topicLine(w),
        painPoint(w),
        v ? `${places(w, v)}, the people who decide this are usually ${proseJoin(v.buyerRoles.slice(0, 3))}.` : '',
        w.includePolls ? pollBlock('Which of these is closest to your situation today?', pollOptions(w)) : ''
      ]);
    case 'Main Content Block 1': case 'Main Content Block 2': case 'Main Content Block 3':
      return blockScript(section, w, mine, blockIndex, blocks);
    case 'Summary & Key Takeaways':
      return seg(section, 'Takeaways slide', [t.length ? `To sum up, you have covered ${proseJoin(t.map((p) => labelOf(p, w)))}.` : 'To sum up: that is this topic.']);
    case 'Q&A':
      return seg(section, 'Q&A slide', [
        'Now your questions. I will read each one aloud from the chat and answer it.',
        objection ? `If the chat is quiet, I will start with a concern we hear a lot: ${quotedEnd(objection.objection)} ${settleLine(w, objection.response, 'qa')}` : '',
        'Questions we do not reach will be answered in the follow-up email.'
      ]);
    case 'Close & CTA':
      return seg(section, 'Next step slide', [doOneLine(w), nextStep(w), thanks]) + '**END WEBINAR**\n\n';
    // product demo
    case 'Welcome & Agenda':
      return seg(section, 'Agenda slide', [
        `Welcome to ${named(w)}. In the next ${w.minutes} minutes we will go through the following.`,
        agendaLine(w),
        `${w.haveSpeakers ? `With us: ${speakersSaid(w)}. ` : ''}Questions go in the chat.`
      ]);
    case 'Problem Context':
      return seg(section, 'Problem slide', [topicLine(w), painPoint(w), v ? `${places(w, v)}, the people who decide this are usually ${proseJoin(v.buyerRoles.slice(0, 3))}.` : '', w.includePolls ? pollBlock('Which of these is closest to your situation today?', pollOptions(w)) : '']);
    case 'Product Overview':
      return seg(section, name ? `${name} on one screen` : 'The demo screen', [name ? (productSentence(w) || `Here is ${name} on one screen.`) : 'Here is what we show today, on one screen.', t[0] ? `It is here for one reason today: ${tk(t[0], w)}` : '']);
    case 'Feature Demo 1': case 'Feature Demo 2': case 'Feature Demo 3': {
      const i = Number(section.name.slice(-1)) - 1;
      const m = v && t[i] ? relatedOne(t[i].text, w.metrics, w.usedM) : '';
      if (m) w.usedM.add(m);
      const watch = ['Watch where it happens on the screen and say in the chat if you do this differently today.', 'Tell us in the chat how your team does this today.', 'Same question as before: how does your team handle this today?'][i % 3];
      return seg(section, t[i] ? `The screen that shows point ${i + 1}` : 'The working screen', [
        t[i] ? `Demo ${i + 1}: ${tk(t[i], w)} I will show it live. ${watch}` : 'That covers every takeaway. I will use this part for questions from the chat and a second look at any screen you want to see again.',
        m ? `In your role, the measure this touches is ${toYou(m)}.` : ''
      ]);
    }
    case 'Use Case Examples': {
      const figs = t.filter((x) => x.figure);
      return seg(section, 'Example slide', [
        figs.length ? `The numbers behind this session. ${numbered(figs, w)}` : '',
        v ? `An example for ${kind} follows this shape: ${lowerFirst(endSentence(toYou(v.proofShape)))}` : 'We will close the examples with the numbers the guests are able to share.'
      ]);
    }
    case 'Pricing & Getting Started':
      return seg(section, 'Getting started slide', [`Getting started looks different for each team. For a business like yours it usually means ${nextStepPhrase(w.model)}.`, name ? `That is how a team begins with ${name}.` : '']);
    case 'Special Offer & Close':
      return seg(section, 'Close slide', [doOneLine(w), nextStep(w), thanks]) + '**END WEBINAR**\n\n';
    // panel
    case 'Welcome & Introductions':
      return seg(section, 'Panel slide', [
        `Welcome to ${named(w)}. ${w.haveSpeakers ? `On the panel: ${speakersSaid(w)}.` : 'I will introduce the panelists in a moment.'}`,
        `${others(w) === 'the panelists' ? 'Panelists' : others(w)}: please give us two sentences on your work and why this topic matters to you.`
      ]);
    case 'Topic Introduction':
      return seg(section, 'Topic slide', [topicLine(w), painPoint(w)]);
    case 'Discussion Question 1': case 'Discussion Question 2': case 'Discussion Question 3': {
      const i = Number(section.name.slice(-1)) - 1;
      const dq = v ? toYou(v.discovery.filter((d) => !/\bme\b|\bour\b/i.test(d))[i % Math.max(1, v.discovery.filter((d) => !/\bme\b|\bour\b/i.test(d)).length)] || '') : '';
      return seg(section, `Question ${i + 1}`, [
        dq ? `Question ${i + 1}, to ${others(w)}: ${dq}` : `Question ${i + 1}, to ${others(w)}: where does this hold in your experience, and where does it not?`,
        t[i] ? `It links to point ${NUM[i]} of today's session: ${tk(t[i], w)}` : '',
        ['I will ask one follow-up after each answer.', 'Same format again: one follow-up after each answer.', 'And once more: one follow-up after each answer.'][i % 3]
      ]);
    }
    case 'Rapid Fire Round':
      return seg(section, 'Rapid fire slide', [v ? `Rapid fire, one sentence each: ${toYou(v.discovery[3 % v.discovery.length])}` : 'Rapid fire, one sentence each: of the takeaways so far, which would you put first, and why?']);
    case 'Audience Q&A':
      return seg(section, 'Q&A slide', [`Questions from the chat now. I will read each one aloud and hand it to ${others(w)}.`, objection ? `If the chat is quiet, I will start with a question we hear a lot: "${objection.objection}".` : '']);
    case 'Closing Thoughts':
      return seg(section, 'Closing slide', [`One thing each, ${others(w)}: what should ${w.field ? `${whoIs(w)} ${w.connector} ${w.field}` : lowerFirstIfCommon(w.audience)} do next?`, t.length ? recap(w) : '']);
    case 'Close':
      return seg(section, 'Close slide', [thanks, nextStep(w)]) + '**END WEBINAR**\n\n';
    // customer story
    case 'Welcome':
      return seg(section, 'Title slide', [w.haveSpeakers ? `Welcome to ${named(w)}. Joining us today: ${speakersSaid(w)}. Our guest is ${w.speakers[0]}.` : `Welcome to ${named(w)}. Our guest today is a customer.`, agendaLine(w)]);
    case 'Customer Introduction':
      return seg(section, 'Guest slide', [`${w.haveSpeakers ? w.speakers[0].split(',')[0] : 'Our guest'}, please tell us about your company and your role.`]);
    case 'The Challenge':
      return seg(section, 'Challenge slide', [w.problem ? `We have been talking about this problem. ${problemSpoken(w).replace(/^Here is the problem we are here to take on\. /, '')} What did that look like for you before you made a change?` : 'What was happening before you made a change? Tell it in your own words.']);
    case 'Solution Discovery':
      return seg(section, 'Solution slide', [name ? `How did you find ${name}, and what made you choose it?` : 'How did you find us, and what made you choose us?', name && w.productDescription ? productSentence(w) : '']);
    case 'Implementation Journey':
      return seg(section, 'Journey slide', [`What was the ${startWords(w.model).rollout} like? Tell us one thing that went well and one that was hard.`]);
    case 'Results & Impact':
      return seg(section, 'Results slide', [`What changed, and how do you measure it?${v ? ` For ${kind}, the usual measures are ${proseJoin(v.metrics.slice(0, 3))}.` : ''}`, t.length ? `The takeaways we want to land. ${numbered(t, w)}` : '', 'We use only the numbers the customer agrees to share.']);
    case 'Live Demo/Walkthrough':
      return seg(section, "The customer's own screen", [name ? `Show us how your team uses ${name} day to day.` : 'Show us how your team works with this day to day.']);
    case 'Lessons Learned':
      return seg(section, 'Lessons slide', ['What would you tell a team that is starting today?']);
    // workshop
    case 'Welcome & Setup':
      return seg(section, 'Title slide', [`Welcome to ${named(w)}. ${w.haveSpeakers ? `Leading it: ${speakersSaid(w)}.` : ''} This is a working session of ${w.minutes} minutes for ${audienceSpoken(w)}.`, agendaLine(w)]);
    case 'Learning Objectives':
      return seg(section, 'Objectives slide', [t.length ? `By the end, you will have worked through the following: ${ordered(t, w, 1)}` : 'By the end, you will have worked on this topic.']);
    case 'Concept Introduction':
      return seg(section, 'Concept slide', [t[0] ? `The idea behind the first exercise: ${tk(t[0], w)}` : 'The idea behind the first exercise is the topic itself.', painPoint(w)]);
    case 'Exercise 1':
      return seg(section, 'Exercise 1 slide', [`Exercise one: ${t[1] ? tk(t[1], w) : t[0] ? tk(t[0], w) : 'Work on the topic.'} You have ${section.duration} minutes. I am in the chat if you get stuck.`]);
    case 'Debrief 1':
      return seg(section, 'Debrief slide', ['Let us hear what you found. Who will share what they made?']);
    case 'Exercise 2':
      return seg(section, 'Exercise 2 slide', [`Exercise two builds on the first: ${t[2] ? tk(t[2], w) : t[1] ? tk(t[1], w) : 'Go one step further on the topic.'} You have ${section.duration} minutes.`, t[3] ? `One more point to keep in mind: ${tk(t[3], w)}` : '']);
    case 'Debrief 2':
      return seg(section, 'Debrief slide', ['Again: who will share what they made, and what they would change?']);
    case 'Wrap-up & Resources':
      return seg(section, 'Wrap-up slide', [recap(w), nextStep(w), thanks]);
    // ask me anything
    case 'Welcome & Speaker Intro':
      return seg(section, 'Title slide', [`Welcome to ${named(w)}. ${w.haveSpeakers ? `Answering your questions today: ${speakersSaid(w)}.` : 'I am your host.'}`, 'Type your question in the chat; I will read it aloud before I answer.']);
    case 'Brief Topic Context':
      return seg(section, 'Topic slide', [topicLine(w), painPoint(w), agendaLine(w)]);
    case 'Q&A Session':
      return seg(section, 'Q&A slide', [`First question. ${objection ? `If the chat is quiet, I will start with a concern we hear a lot: ${quotedEnd(objection.objection)} ${settleLine(w, objection.response, 'qa')}` : 'If the chat is quiet, I will start with the question I hear most.'}`, t[0] ? `Another place to start: ${tk(t[0], w)}` : '']);
    case 'Rapid Fire':
      return seg(section, 'Rapid fire slide', [v ? `Rapid fire, short answers: ${toYou(v.discovery[2 % v.discovery.length])}` : 'Rapid fire: short questions from the chat, one or two sentences each.', t.slice(1).length ? `Still to cover from the takeaways. ${numbered(t.slice(1, 4), w)}` : '']);
    default:
      return seg(section, section.name, [t.length ? numbered(t, w) : 'We continue with the topic.']);
  }
}

// A short recap, one clause per takeaway, each whole.
function recap(w: W): string {
  const bits = w.takeaways.slice(0, 3).filter((p) => withLabel(p).length <= 110).map((p) => lowerFirst(withLabel(p).replace(/[.]$/, '')));
  return bits.length ? `Quick recap in a line each: ${proseJoin(bits)}.` : '';
}

// One main content block: the takeaways it teaches, the sector measure, the chat question, the objection for later blocks, and the product line.
function blockScript(section: { name: string; duration: number }, w: W, mine: Pt[], k: number, blocks: number): string {
  const v = w.ctx.v;
  const lead = k === 0 ? "Let's start with the first idea." : k === blocks - 1 ? 'Last, and the most practical part.' : 'That brings us to the next part.';
  const kind0 = v ? kindOf(v) : '';
  const firstEmpty = w.takeaways.length < blocks ? w.takeaways.length : -1;
  const mineText = mine.map((p) => p.text).join(' ');
  const teach = mine.length ? numbered(mine, w, w.takeaways.indexOf(mine[0])) : v ? (k === firstEmpty ? `Let us put numbers to it. The yardsticks to keep in view are ${proseJoin((w.metrics.length ? w.metrics : v.metrics).slice(0, 4))}.` : `Let us make this concrete. A good example for ${kind0} follows this shape: ${lowerFirst(endSentence(toYou(v.proofShape)))}`) : 'Let us make this concrete: we take the points so far and work through one case on this topic.';
  const measure = w.metrics.length ? w.metrics[(k * 2) % w.metrics.length] : '';
  const rel0 = v && mineText ? relatedOne(mineText, w.metrics, w.usedM) : '';
  const measure0 = w.haveTakeaways ? '' : w.metrics.length ? [measure, ...w.metrics].find((x) => !w.usedM.has(x)) || '' : '';
  const rel = rel0;
  if (rel0 || measure0) w.usedM.add(rel0 || measure0);
  const questions = v ? v.discovery.filter((d) => !/current provider|client's own words|signs off each|governed|\bme\b|\bour\b/i.test(d)) : [];
  const qpool = questions.filter((d) => !w.usedQ.has(d));
  const qwords = new Set((`${mineText} ${w.haveTakeaways ? '' : w.topic}`.toLowerCase().match(/[a-z]{5,}/g) || []).map((x) => x.slice(0, 6)));
  const qbest = qpool.map((d) => ({ d, n: (d.toLowerCase().match(/[a-z]{5,}/g) || []).filter((x) => qwords.has(x.slice(0, 6))).length + themeScore(mineText, d) })).sort((a, b) => b.n - a.n)[0];
  const question = v && qbest && qbest.n > 0 ? (w.usedQ.add(qbest.d), qbest.d) : '';
  const neutralQ = ['Where does this show up in your own work today?', 'What would you change first if you could?', 'Which part of this is hardest for your team?'][k % 3];
  const objection = v && k >= 1 ? v.objections[(k - 1) % v.objections.length] : null;  // blocks 2 and 3 take the first two objections; the question time takes the third; the second email the fourth
  const nextT = blockTakeaways(w.takeaways, k + 1, blocks)[0];
  const next = k < blocks - 1 ? (nextT ? `Next is point ${NUM[w.takeaways.indexOf(nextT)] || w.takeaways.indexOf(nextT) + 1}, ${labelOf(nextT, w)}.` : '') : 'That covers the takeaways. Next, the summary.';
  const proof = v && k === 0 && mine.length && !w.takeaways.some((p) => p.figure) ? `A proof point worth asking for in ${kind0}: ${lowerFirst(endSentence(toYou(v.proofShape)))}` : '';
  const lines = [
    `${lead} ${teach}`,
    v ? [(rel || measure0) ? `${rel ? ['In your role, this comes down to', 'The measure this part speaks to is', 'The yardstick to keep in view here is'][k % 3] : 'In your role, the number to watch across this part is'} ${toYou(rel || measure0)}.` : '', `Question for the chat: "${question ? toYou(question) : neutralQ}"`].filter(Boolean).join(' ') : '',
    proof,
    (rel || measure0) ? [`Try it on one live case from your own work this week, and read it against ${toYou(rel || measure0)}.`, `Take one case from your own work and note where it stands on ${toYou(rel || measure0)} today.`, `Before you change anything, write down where you stand today on ${toYou(rel || measure0)}, so there is a number to beat.`][k % 3] : ['Try it on one live case from your own work this week.', 'Take one case from your own work and note where it stands today.', 'Before you change anything, write down where you stand today, so there is a baseline to beat.'][k % 3],
    objection ? `${k === 1 ? 'One concern that comes up often' : 'Another concern we hear'}: ${quotedEnd(objection.objection)} ${settleLine(w, objection.response)}` : '',
    productLine(w, k, mine),
    `${next ? `${next} ` : ''}Any questions before we move on? Put them in the chat.`
  ];
  return seg(section, 'Key concept slide', lines);
}

// Prepared answers for the host: the sector's objections with the pattern of a good answer, and the first step. Only when a sector is read.
function qaPrep(w: W): string {
  const v = w.ctx.v;
  if (!v) return '';
  const first = w.takeaways[0];
  let n = 1;
  const out: string[] = [];
  out.push(`${n++}. **"How do we get started with this?"**\n   - Answer pattern: Deals in ${v.name} usually start like this: ${lowerFirst(v.salesMotion)}`);
  for (const o of v.objections.slice(0, 3)) out.push(`${n++}. **"${o.objection}"**\n   - Answer pattern: ${o.response}`);
  out.push(`${n++}. **"${first && first.text.length <= 110 ? `Can you share more examples of this: ${first.text}?` : 'Can you share more examples?'}"**\n   - Answer pattern: Use an example that follows this shape: ${lowerFirst(v.proofShape)}`);
  out.push(`${n++}. **"How does this compare to what we do today?"**\n   - Answer pattern: Ask what their current setup does not do (${v.vocabulary.slice(0, 2).join(', ')} are good places to look), then show the difference on that point only.`);
  return `## Q&A Preparation (for the host, not read aloud)\n\n### Anticipated Questions\n\n${out.join('\n\n')}\n\n---\n\n`;
}

// The three follow-up emails, written from the takeaways, the sector's objection and next step, and the product the user gave.
function followUps(w: W): string {
  const v = w.ctx.v;
  const t = w.takeaways;
  const head = w.shortTopic ? w.label : "today's session";
  const name = w.productName;
  const e1 = `### Email 1: Same day

**Subject:** Thank you for joining${head === "today's session" ? " today's session" : `: ${head}`}

Thank you for joining.${t.length ? `\n\nThe takeaways, in short:\n${t.slice(0, 5).map((x, i) => `${i + 1}. ${capFirst(labelOf(x, w))}${x.label ? ` (${x.label})` : ''}`).join('\n')}` : ''}

Questions? Reply to this email.

---
`;
  const o = v ? v.objections[3 % v.objections.length] : null;
  const e2 = o ? `### Email 2: Day 3

**Subject:** A concern from the session: ${o.objection}

The concern we hear most is ${quotedEnd(o.objection)} ${settleLine(w, o.response, 'email')}

---
` : t.length ? `### Email 2: Day 3

**Subject:** One point from the session: ${shorten(t[Math.min(1, t.length - 1)].text, 70, true) || head}

Here is the point in full: ${lower(tk(t[Math.min(1, t.length - 1)], w, true))} Reply with your own example.

---
` : '';
  const e3 = `### Email 3: Day 7

**Subject:** Your next step after the session

The natural next step is ${nextStepPhrase(w.model)}. Reply to this email if you would like it${name ? `, or if you want to talk it through with ${name}` : ''}.

---
`;
  return `${e1}\n${e2 ? e2 + '\n' : ''}${e3}`;
}
