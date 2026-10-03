import { generateHook, lowerFirstIfCommon, cap, SUGGESTION_FOOTER, clipEcho } from './utils.js';
import { readContext, audienceLine, isClause, type Vertical } from './sector.ts';
import { splitList, tidyPoint, STAT, FIGURE, softenClaims, toYou, dropTail, unpackTopic, fixNumbers, endSentence, capFirst, shortenClauses, proseJoin, clipAtWord, productParts, asAnswer } from './draft.ts';

export function generateNewsletter(args: {
  topic: string;
  cta_goal: string;
  key_points?: string;
  audience_segment?: string;
  newsletter_type?: string;
  tone?: string;
  previous_topics?: string;
  your_product?: string;
}): string {
  // Run 18 (R18-26, P05-WS-01): topic and cta_goal are trimmed at the boundary, so the heading, the Topic and CTA Goal table rows
  // and the subject lines never carry stray spaces or line breaks. Interior whitespace is kept exactly.
  const topic = fixNumbers(args.topic.trim());
  const segment = args.audience_segment || 'general';
  const type = args.newsletter_type || 'educational';
  const tone = args.tone || 'professional';
  const previousTopics = args.previous_topics ? splitList(args.previous_topics) : [];
  const ctaGoal = args.cta_goal.trim();
  const product = (args.your_product || '').trim();
  // Run 20 (round 1b): a long topic typed as "How <readers> can tackle <problem>, from <company>" is read into its parts; every
  // repeat of the topic uses a short label (the problem's first clause), and the full topic is printed once, in the table.
  const parts = unpackTopic(topic);
  const ctaProduct = /\babout\s+(.+)$/i.exec(ctaGoal)?.[1]?.trim() || '';
  const label = parts.short ? topic.replace(/ +/g, ' ') : parts.label;
  const clause = !parts.short || isClause(topic) || LABEL_CLAUSE.test(label);
  // Run 19 (D80, problems 4 and 8): the sector is read from every text the user gave.
  const ctx = readContext(undefined, { seller: [product, args.cta_goal], context: [topic, args.key_points, args.previous_topics] });
  const v = ctx.v;
  const casual = /conversational|casual|friendly|warm|informal|relaxed/i.test(tone);

  // Run 21c (draft rewrite): the key points are the sections of the issue. Without them, the sector's own objection, measures and proof
  // shape make the sections (only when a sector is read); nothing else is invented.
  const given = !!args.key_points;
  const secs: Pt[] = given
    ? splitList(args.key_points).map(tidyPoint).map((p) => softenClaims(p).text).map((point) => ({ point }))
    : sectorSections(v);
  const keyPoints = secs.map((s) => s.point);
  const figures = keyPoints.filter((p) => STAT.test(p));
  const unsourced = given ? figures.filter((p) => !/\([^)]*[A-Za-z][^)]*\)\s*[.;]?\s*$/.test(p)) : [];

  const productName = product ? productParts(product).name : '';
  const productDescription = product ? productParts(product).description : '';
  const named = productName || ctaProduct || parts.company;
  const subjectLines = generateSubjectLines(label, clause, type, keyPoints, figures, v, topic, ctaGoal);
  const preview = (i: number) => previewText(i, keyPoints, subjectLines[i], label);

  const missing: string[] = [];
  if (!given) missing.push(v ? 'key_points (the sections come from the sector\'s own objection, measures and proof instead of your points)' : 'key_points (no sector could be read either, so the issue has an opening and a call to action only)');
  if (!named) missing.push('your_product (the draft names no product)');
  const notGiven = missing.length ? `\n*Not given: ${missing.join('; ')}. Add ${[!given ? 'key_points, one point per section,' : '', !named ? 'your_product' : ''].filter(Boolean).join(' and ').replace(/,$/, '')} to change that.*\n` : '';
  const figureNote = unsourced.length ? `\n*Figures with no source label: ${unsourced.map((p) => `"${clipAtWord(p, 90)}"`).join('; ')}. Add where each one comes from before the issue goes out.*\n` : '';

  const sectorBlock = v ? `
## Sector Notes: ${cap(v.name)}

${ctx.line}

- ${audienceLine(v)}
- **A proof point that lands:** ${v.proofShape}
- **Terms this audience uses:** ${v.vocabulary.slice(0, 6).join(', ')}.
- **Objections to answer in the issue:** ${v.objections.map((o) => o.objection.toLowerCase()).join('; ')}.

---
` : `
## Sector Notes

${ctx.line}

---
`;

  const readers = parts.audience ? `\n*The topic names its readers (${clipAtWord(parts.audience, 120)}). The subject lines and hooks use the problem as the label: ${q2(label)}.*\n` : '';
  const hooks = generateHooks(label, v, figures, keyPoints, given);

  const output = `# Newsletter Builder: ${topic}

## Newsletter Configuration

| Setting | Value |
|---------|-------|
| **Topic** | ${topic} |
| **Product** | ${product || (ctaProduct ? `${ctaProduct} (read from the call to action)` : parts.company ? `${parts.company} (read from the topic)` : 'not given (add your_product to name it in the draft)')} |
| **Segment** | ${segment}${args.audience_segment ? '' : ' (default)'} |
| **Type** | ${type.replace(/_/g, ' ')}${args.newsletter_type ? '' : ' (default)'} |
| **Tone** | ${tone}${args.tone ? '' : ' (default)'} |
| **CTA Goal** | ${ctaGoal} |
${notGiven}${figureNote}${readers}
---

## Newsletter Content

**Subject:** ${subjectLines[0]}

**Preview:** ${preview(0)}

---

${openingBlock(label, clause, v, hooks.question, previousTopics, casual, secs)}

${generateSections(secs, v, segment, label)}
${closingBlock(ctaGoal, named, productName, productDescription, secs)}

---

## Subject Lines (A/B Test These)

${[0, 1, 2, 3].map((i) => `**${subjectLines[i]}**\n- Preview text: ${preview(i)}`).join('\n\n')}

---

## Opening Hooks (Pick One)

${hooks.list.map((h, i) => `### Hook ${i + 1}: ${h.name}\n> ${h.text}`).join('\n\n')}

---
${sectorBlock}
${SUGGESTION_FOOTER}
`;

  return output;
}

const q2 = (s: string) => `"${s}"`;
// A label that is a clause (a verb inside it) cannot follow "about", "on" or "of": it is placed before a colon only.
const LABEL_CLAUSE = /\b(?:is|are|was|were|run|runs|combine|combines|means|rely|relies|chain|chains|sits|happens|hand|hands|can|will|must|should|have|has|do|does|break|breaks|fragments|drift|drifts)\b/i;

// One section of the issue: the key point it is built from, and its own body when the section does not come from a point.
interface Pt { point: string; body?: string; }

// The name of the kind of company or field, for "for teams in ...": the sub-type when the reader found one, else the sector's name.
function kindOf(v: Vertical): string {
  return v.name.includes(',') ? v.name.split(',').slice(1).join(',').trim() : v.name;
}

// No key points given: the sector's own objection, measures and proof shape are the sections (nothing else is invented).
// With no sector read, there are no sections.
function sectorSections(v: Vertical | null): Pt[] {
  if (!v) return [];
  const o = v.objections[0];
  const ms = v.metrics.slice(0, 3);
  const kind = kindOf(v);
  return [
    { point: `The objection readers raise most: ${o.objection.toLowerCase()}`, body: `Readers in ${kind} often say it this way: "${o.objection}". ${asAnswer(o.response)}` },
    { point: `What to measure: ${ms.join(', ')}`, body: `Readers in ${kind} already watch ${proseJoin(ms)}. Put each point of the issue next to one of them.` },
    { point: `What a good proof point looks like: ${lowerFirstIfCommon(v.proofShape.replace(/\.$/, ''))}`, body: endSentence(v.proofShape) }
  ];
}

const stem = (w: string) => w.toLowerCase().replace(/(?:ing|ed|es|s)$/, '');
const wordsOf = (x: string) => new Set((x.toLowerCase().match(/[a-z]{4,}/g) || []).map(stem));
// The item (a question, a measure) that shares a word with the point; none shared means none: a sector line is only placed where it fits.
function related(point: string, items: string[], used: Set<string>, min = 1): string {
  const pw = wordsOf(point);
  let best = ''; let bestN = 0;
  for (const it of items) { if (used.has(it)) continue; const n = [...wordsOf(it)].filter((w) => pw.has(w)).length; if (n > bestN) { best = it; bestN = n; } }
  if (bestN >= min) { used.add(best); return best; }
  return '';
}

// Subject lines: each one holds the topic, then a point, a figure or the call to action the user gave. The first one is the subject of the draft.
function generateSubjectLines(label: string, clause: boolean, type: string, points: string[], figures: string[], v: Vertical | null, fullTopic: string, ctaGoal: string): string[] {
  const short = label;
  // Text only (run 10, R10-28): the topic placed after leading words follows the first-word rule
  // (names and acronyms keep their capitals). Product updates keep it as typed.
  const mid = lowerFirstIfCommon(short);
  const head = cap(mid);
  const cut = (p: string, max: number) => { const c = shortenClauses(p, max); return /\.\.\.$/.test(c) ? clipAtWord(p, max) : c; };
  // A point that only repeats the topic ("Supply chains break in the gaps: supply chains break in the gaps") makes no second subject line.
  const same = (a: string) => { const x = a.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(), y = head.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); return x.length > 0 && (y.startsWith(x.slice(0, 24)) || x.startsWith(y.slice(0, 24))); };
  const withHead = (pt: string | undefined) => (pt && !same(cut(pt, 60)) ? `${head}: ${cut(pt, 60)}` : '');
  const p0 = withHead(points[0]);
  const p1 = withHead(points[1]);
  const fig = figures[0] && !same(cut(figures[0], 60)) ? `${head}: ${cut(figures[0], 60)}` : '';
  const measure = v ? `${head}: where you stand on ${v.metrics[0]}` : '';
  const n = points.length;
  const count = n >= 2 ? (clause ? `${head}: ${n} points` : `${n} points on ${mid}`) : '';
  const cta = `${head}: ${lowerFirstIfCommon(ctaGoal)}`;
  const isNew = `New: ${short}`;
  const update = `Product update: ${short}`;
  const order: Record<string, string[]> = {
    educational: [p0, fig, measure, count, cta, p1],
    product_update: [isNew, p0, update, fig, cta, p1, count],
    industry_news: [p0, `Industry news: ${short}`, fig, count, cta, p1, measure],
    thought_leadership: [p0, count ? `${head}: my view in ${n} points` : '', fig, p1, cta, measure],
    curated_links: [`${head}: this week's reading`, p0, count, p1, cta, fig]
  };
  const pool = [...(order[type] || order.educational), head, `${head}: the issue`, `${head}: read on`, `${head}: in this issue`];
  const out: string[] = [];
  for (const c of pool) if (c && !out.some((x) => x.toLowerCase() === c.toLowerCase())) out.push(c);
  return out.slice(0, 4);
}

// Preview text: one line per option, built from key points that fit whole (never cut in a word or a phrase).
function previewText(index: number, points: string[], subject = '', label = ''): string {
  const fits = points.map((p) => shortenClauses(p, 90)).filter((p) => p.length <= 95 && !/\.\.\.$/.test(p) && !subject.toLowerCase().includes(p.toLowerCase().slice(0, 40)));
  if (!fits.length) return `In this issue: ${label}`;
  const a = fits[index % fits.length];
  const b = fits[(index + 1) % fits.length];
  const lead = ['Inside', 'Plus', 'In this issue', 'Also'][index % 4];
  return a === b || a.length + b.length > 120 ? `${lead}: ${a}` : `${lead}: ${a}; ${b}`;
}

// Alternative openings. The question is the sector's own discovery question when the sector is known; the statistic uses a figure the
// user gave, never an invented one; the plain statement is the first key point as typed.
function generateHooks(label: string, v: Vertical | null, figures: string[], points: string[], given: boolean): { question: string; list: { name: string; text: string }[] } {
  const t = lowerFirstIfCommon(label);
  const fig = figures[0];
  const question = v ? v.discovery[0] : `How are you handling this today: ${t}?`;
  const list = [
    { name: 'Question', text: question },
    { name: 'Statistic', text: fig ? endSentence(capFirst(shortenClauses(fig, 150))) : 'No figure was given in key_points, so there is no statistic hook. Add one figure you can source to key_points to get it.' }
  ];
  if (given && points[0]) list.push({ name: 'Plain Statement', text: endSentence(capFirst(points[0])) });
  return { question, list };
}

const MAX_SECTIONS = 6;

// The opening of the issue: the sector's own question when the sector is read, the link to the recent issues the user named, and what the issue covers.
function openingBlock(label: string, clause: boolean, v: Vertical | null, question: string, previous: string[], casual: boolean, secs: Pt[]): string {
  const lines: string[] = [];
  if (v) lines.push(question);
  if (previous.length) {
    const list = proseJoin(previous.map((x) => lowerFirstIfCommon(x)));
    lines.push(casual ? `We have been through ${list} lately. This time: ${label}.` : `Recent issues covered ${list}. This issue moves to ${clause ? 'a new question' : 'a new topic'}: ${label}.`);
  }
  const n = Math.min(secs.length, MAX_SECTIONS);
  lines.push(n ? `This issue looks at ${n} ${n === 1 ? 'point' : 'points'} on ${label}.` : `This issue is about ${label}.`);
  return lines.join('\n\n');
}

// One section per key point: the point as the user typed it, the measure of the sector that fits it, and, for readers who work with the
// detail, the sector's own question when it shares words with the point. Nothing is added that the point or the sector file does not hold.
function generateSections(secs: Pt[], v: Vertical | null, segment: string, label: string): string {
  const shown = secs.slice(0, MAX_SECTIONS);
  const usedQ = new Set<string>(v ? [v.discovery[0]] : []);
  const usedM = new Set<string>();
  const usedO = new Set<string>();
  let usedP = false;
  const frames = [
    (m: string, k: string) => `For teams in ${k}, the number to watch here is ${m}.`,
    (m: string) => `Measure it against ${m}.`,
    (m: string) => `The measure to put next to it is ${m}.`,
    (m: string) => `Check it against ${m}.`
  ];
  let content = '';
  shown.forEach((sec, index) => {
    const point = sec.point;
    const heading0 = shortenClauses(point, 110); const heading = (/\.\.\.$/.test(heading0) ? dropTail(point.split(/\s+/).slice(0, 12).join(' ')) : heading0).replace(/\s+(?:\$|US\$)?\d[\d,.%+]*$/, '');   // a heading never ends on a bare number ("closing out projects 15")
    let body: string;
    if (sec.body) body = sec.body;
    else {
      const full = endSentence(capFirst(point));
      const bits: string[] = [full === `${cap(heading)}.` ? '' : full];
      if (v) {
        const metric = related(point, v.metrics, usedM) || v.metrics.find((m) => !usedM.has(m)) || v.metrics[index % v.metrics.length];
        usedM.add(metric);
        bits.push(frames[index % frames.length](metric, kindOf(v)));
        const ob = related(point, v.objections.map((o) => o.objection), usedO, 2);
        if (ob) bits.push(`Readers often push back with "${ob}". ${asAnswer(v.objections.find((o) => o.objection === ob)!.response)}`);
        else if (FIGURE.test(point) && !usedP) { usedP = true; bits.push(`A proof point readers in ${kindOf(v)} trust: ${lowerFirstIfCommon(endSentence(v.proofShape))}`); }
        if (segment !== 'executives') {
          const qn = related(point, v.discovery, usedQ, 2);
          if (qn) bits.push(`Ask: "${toYou(qn)}"`);
        }
      }
      body = bits.filter(Boolean).join(' ');
    }
    content += `### ${index + 1}. ${cap(heading)}\n\n${body}\n\n`;
  });
  if (secs.length > shown.length) {
    content += `Not used in the draft: ${secs.length - shown.length} points, because the issue holds ${MAX_SECTIONS} sections. Fold them into the sections above or hold them for the next issue:\n\n${secs.slice(shown.length).map((p) => `- ${endSentence(capFirst(p.point))}`).join('\n')}\n\n`;
  }
  return content.replace(/\n+$/, '\n');
}

// Run 19 (D80, problem 3): the call to action is the one the user gave, used as the heading and as the button. It is never
// replaced by a fixed offer (a demo, a guide) the user did not name.
function closingBlock(ctaGoal: string, named: string, productName: string, productDescription: string, points: Pt[]): string {
  const goalLower = ctaGoal.toLowerCase();
  let helper = 'Link the button to the page or the reply address that does this.';
  if (/\b(reply|feedback)\b/.test(goalLower)) helper = 'Hit reply and let me know.';
  else if (/\bshare\b/.test(goalLower)) helper = 'Forward this to a colleague who needs to see it.';
  const about = productName && productDescription && productDescription !== productName && productDescription.length > productName.length + 3 ? `About ${productName}: ${productDescription.replace(/\.$/, '')}.\n\n` : '';
  return `${about}---

**${cap(ctaGoal)}**

Button: ${cap(ctaGoal)}

${helper}`;
}
