import { lowerFirstIfCommon, cap } from './utils.js';
import { readContext, audienceLine, isClause, type Vertical } from './sector.ts';
import { splitList, unpackTopic, fixNumbers, endSentence, capFirst, proseJoin, productParts, toYou, bestQuestion, softenClaims } from './draft.ts';
import { readPoints, groupPhrases, sentenceOf, renderGroup, readersFit, isStatistic, companyFrom, shorten, shortReaders, instructionNote, sharpenLine, stripGuardQuotes, waysToSettle, nk, quotedEnd, lowerFirstSafe, type Pt } from './rw-content.ts';

// Run 22 (rewrite): the issue is written, not assembled. The key points are read for what they are (the problem, what changes, how it
// works, the evidence), each is said in a whole sentence, and the sector file adds the measures, the proof to ask for and the questions
// a reader can put to their own team. No figure, customer, quote or promise is added (B82); what was not given is named once at the end.

const lower = (s: string) => lowerFirstSafe(s);
const VERB_START = /^(?:book|see|register|read|download|request|start|join|reply|share|try|get|talk|schedule|subscribe|sign|watch|explore|learn|contact|call|visit|take|view|ask|send|forward|review|apply|buy|order|claim|speak|meet|discover|compare|check|find|build|create|set|add|use|come|hear|listen|plan)\b/i;
const LABEL_CLAUSE = /\b(?:is|are|was|were|run|runs|combine|combines|means|rely|relies|chain|chains|sits|happens|hand|hands|can|will|must|should|have|has|do|does|break|breaks|fragments|drift|drifts)\b/i;

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
  const topic = fixNumbers(args.topic.trim());
  const segment = args.audience_segment || 'general';
  const type = args.newsletter_type || 'educational';
  const tone = args.tone || 'professional';
  const previous = args.previous_topics ? splitList(stripGuardQuotes(args.previous_topics)) : [];
  const ctaGoal = args.cta_goal.trim();
  const product = (args.your_product || '').trim();
  const parts = unpackTopic(topic);
  const ctaProduct = /\babout\s+(.+)$/i.exec(ctaGoal)?.[1]?.trim() || '';
  const firstClause = (parts.problem || '').split(/[,;:]| \(/)[0].trim();
  const label = parts.short ? topic.replace(/ +/g, ' ') : (firstClause && firstClause.length <= 110 && firstClause.length > parts.label.length && firstClause.toLowerCase().startsWith(parts.label.toLowerCase()) ? firstClause : parts.label);
  const ctx = readContext(undefined, { seller: [product, args.cta_goal], context: [topic, args.key_points, args.previous_topics], buyer: [parts.audience] });
  const vFull = ctx.v;
  const casual = /conversational|casual|friendly|warm|informal|relaxed/i.test(tone);
  const productName = product ? productParts(product).name : '';
  const productDescription = product ? productParts(product).description : '';
  const who = productName || (parts.company && parts.company.split(/\s+/).length <= 4 ? parts.company : (companyFrom(topic) || parts.company)) || (ctaProduct ? productParts(ctaProduct).name : '');
  const readers = parts.audience ? shortReaders(parts.audience) : '';
  const fits = !vFull || !readers || readersFit(readers, vFull);   // the readers the user named win over the sector's default readers
  // a general software reading (SaaS, software) that does not fit the readers named is not used in the draft at all: its measures belong to other readers
  const v = vFull && !fits && !vFull.subtype && ['saas', 'software'].includes(vFull.id) ? null : vFull;
  const kind = v ? (v.name.includes(',') ? v.name.split(',').slice(1).join(',').trim() : v.name) : '';
  const forWhom = readers || (kind ? `teams in ${kind}` : 'your team');

  // ---- the points --------------------------------------------------------------------------------------------------
  const given = !!(args.key_points && args.key_points.trim());
  const soft0 = softenClaims(args.key_points || '');
  const soft = soft0.removed.length ? soft0 : { text: args.key_points || '', removed: [] as string[] };
  const softP = softenClaims(parts.problem || '');
  const all = readPoints(soft.text, { problem: soft0.removed.length || softP.removed.length ? softP.text : parts.problem || '' });
  const orders = all.filter((p) => p.role === 'instruction').map((p) => p.text);
  const pts = all.filter((p) => p.role !== 'instruction');
  const problems = pts.filter((p) => p.role === 'problem');
  const outcomes = pts.filter((p) => p.role === 'outcome');
  const hows = groupPhrases(pts.filter((p) => p.role === 'capability'));
  const evidence = pts.filter((p) => ['result', 'quote', 'recognition', 'scale', 'story'].includes(p.role));
  const figures = pts.filter((p) => p.figure && p.role !== 'problem');
  const unsourced = figures.filter((p) => !p.label);
  const opening = problems[0];
  const laterProblems = problems.slice(1);

  // ---- sections ----------------------------------------------------------------------------------------------------
  const usedMetric = new Set<string>();
  const metricFor = (p: Pt[]): string => {
    if (!v) return '';
    const words = new Set((p.map((x) => x.text).join(' ').toLowerCase().match(/[a-z]{4,}/g) || []).map((w) => w.replace(/(?:ing|ed|es|s)$/, '')));
    let best = ''; let bestN = 0;
    for (const m of v.metrics) { if (usedMetric.has(m)) continue; const n = (m.toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => words.has(w.replace(/(?:ing|ed|es|s)$/, ''))).length; if (n > bestN) { best = m; bestN = n; } }
    if (!best) best = v.metrics.find((m) => !usedMetric.has(m)) || '';
    if (best) usedMetric.add(best);
    return best;
  };
  const NAMES: Record<string, { problem: string; how: string; evidence: string; check: string }> = {
    educational: { problem: 'Where it goes wrong', how: 'How it works', evidence: 'What the evidence shows', check: 'What to check in your own operation' },
    product_update: { problem: 'What this fixes', how: "What's new", evidence: 'What the evidence shows', check: 'What to check before you switch anything on' },
    industry_news: { problem: 'What is happening', how: 'What it adds', evidence: 'What the evidence shows', check: 'What to check in your own operation' },
    thought_leadership: { problem: 'The problem', how: 'How it works', evidence: 'What the evidence shows', check: 'What to ask your own team' },
    curated_links: { problem: 'Why it matters', how: 'How it works', evidence: 'What the evidence shows', check: 'Questions for your own team' }
  };
  const nm = NAMES[type] || NAMES.educational;
  const sections: { heading: string; body: string }[] = [];
  const bring = who ? `What ${who} brings:` : 'What it brings:';

  if (laterProblems.length) {
    const m = metricFor(laterProblems);
    sections.push({ heading: nm.problem, body: [renderGroup(laterProblems, who, 'Where it goes wrong:'), m ? `${cap(forWhom)} read it in ${m}.` : ''].filter(Boolean).join('\n\n') });
  }
  if (outcomes.length) {
    const m = metricFor(outcomes);
    sections.push({ heading: 'What changes', body: [renderGroup(outcomes, who, 'What readers can expect:'), m ? `To judge a claim like this, put it next to ${m}.` : ''].filter(Boolean).join('\n\n') });
  }
  if (hows.length) {
    const m = outcomes.length ? '' : metricFor(hows);
    sections.push({ heading: nm.how, body: [renderGroup(hows, who, bring, 1), m ? `${cap(forWhom)} would judge it on ${m}.` : ''].filter(Boolean).join('\n\n') });
  }
  if (evidence.length) {
    const proof = v ? `When a vendor shows you results like these, ${forWhom === 'your team' ? 'look for' : 'the evidence to ask for is'} ${lower(toYou(v.proofShape.replace(/\.$/, '')))}.` : '';
    sections.push({ heading: nm.evidence, body: [renderGroup(evidence, who, 'The results on record:'), proof].filter(Boolean).join('\n\n') });
  }
  // the reader's own check: the sector's questions, said to the reader
  if (v) {
    const free = v.discovery.filter((d) => !/\bclient'?s?\b|current provider|signs off each|governed|\bme\b|\bour\b|\bwe\b/i.test(d));
    const hookFirst = free[0] || '';
    const used = new Set<string>(hookFirst ? [hookFirst] : []);
    const n = segment === 'executives' ? 1 : 2;
    const asked: string[] = [];
    for (let i = 0; i < n; i++) { const q = bestQuestion(`${label} ${pts.map((p) => p.text).join(' ')}`, free, used); if (q) asked.push(toYou(q)); }
    const ms = v.metrics.filter((m) => !usedMetric.has(m)).slice(0, 2);
    const lead = asked.length === 1 ? 'Put this question to your own team' : 'Put these two questions to your own team';
    const qs = asked.length === 1 ? `"${asked[0]}"` : `First, "${asked[0]}" Second, "${asked[1]}"`;
    const body = [asked.length ? `${lead} this week. ${qs}` : '', ms.length ? `Whatever the answers, write down where you stand today on ${proseJoin(ms)}, so that the next change has a number to beat.` : ''].filter(Boolean).join(' ');
    if (body) sections.push({ heading: nm.check, body });
  }
  const pushWho = readers ? cap(readers) : kind ? `Teams in ${kind}` : 'Readers';
  // where readers push back: the sector objection that shares most words with the points, and a way to test it
  if (v && given && fits) {
    const text = ` ${label} ${pts.map((p) => p.text).join(' ')} `.toLowerCase();
    let best = v.objections[0]; let bestN = -1;
    for (const o of v.objections) { const n = (o.objection.toLowerCase().match(/[a-z]{5,}/g) || []).filter((w) => text.includes(w.slice(0, 5))).length; if (n > bestN) { best = o; bestN = n; } }
    const settle = waysToSettle(best.response);
    if (settle) sections.splice(Math.max(0, sections.length - 1), 0, { heading: 'Where readers push back', body: `${pushWho} often say: ${quotedEnd(best.objection)} ${settle}` });
  }
  // no key points: the sector's own objection, in the reader's voice, is the first section
  if (!given && v) {
    const o = v.objections[0];
    const settle = waysToSettle(o.response);
    sections.unshift({ heading: 'The question you will hear', body: `${readers ? cap(readers) : `Teams in ${kind}`} often say: ${quotedEnd(o.objection)} ${settle}`.trim() });
  }

  // ---- subject, preview, opening ------------------------------------------------------------------------------------
  const headSource = parts.problem ? parts.problem.split(/;\s+/)[0] : label;
  const headMax = parts.short ? 90 : 66;
  const head = shorten(headSource, headMax, true) || (who && readers ? `${who} for ${readers}` : v ? `Where do you stand on ${v.metrics[0]}?` : shorten(label, 66));
  const clause = !parts.short || isClause(topic) || LABEL_CLAUSE.test(label);
  const subjects = subjectLines(head, type, who, v, forWhom, ctaGoal, readers, clause);
  const roadmap = sections.length ? `${casual ? 'Here is what is in this issue' : 'In this issue'}: ${proseJoin(sections.map((s) => lower(s.heading)))}.` : '';
  const openLines: string[] = [];
  if (opening) openLines.push(opening.clause && opening.text.includes('; ') && opening.text.split('; ').every((x) => x.trim().split(/\s+/).length >= 4) ? opening.text.split('; ').map((x) => endSentence(capFirst(x.trim()))).join(' ') : sentenceOf(opening, who));
  else openLines.push(parts.short ? `This issue is about ${clause ? `"${label}"` : lower(label)}.` : `This issue is about ${lower(head)}.`);
  if (v) openLines.push(`For ${forWhom}, the numbers to watch are ${proseJoin(v.metrics.slice(0, 2))}.`);
  if (previous.length) {
    const list = proseJoin(previous.map((x) => `"${x.replace(/[.\s]+$/, '')}"`));
    openLines.push(casual ? `Last time we looked at ${list}. This time it is ${clause ? 'a different question' : 'a different topic'}.` : `Recent issues covered ${list}. This one moves on to ${clause ? 'a new question' : 'a new topic'}.`);
  }
  if (roadmap) openLines.push(roadmap);
  const previewPool = [v ? `For ${forWhom}, the numbers to watch are ${proseJoin(v.metrics.slice(0, 2))}.` : '', firstSentence(openLines[0]), sections.length ? `Inside: ${proseJoin(sections.map((x) => lower(x.heading)))}.` : '', who ? `From ${who}: ${lower(head)}.` : '', `${cap(head)}.`,
    sections.length >= 2 ? `${sections.length} short sections and one next step.` : '', `A ${type.replace(/_/g, ' ')} issue for ${forWhom}.`, sections[0] ? `Starting with ${lower(sections[0].heading)}.` : ''];
  const previewOptions: string[] = [];
  for (const c of previewPool) { const x = c.trim(); if (x && x.length <= 125 && !previewOptions.some((y) => nk(y) === nk(x))) previewOptions.push(x); }
  const preview = (i: number) => previewOptions[i % previewOptions.length];

  // ---- closing -----------------------------------------------------------------------------------------------------
  const about = productName && productDescription && productDescription !== productName && productDescription.length > productName.length + 3 ? `${productName} is ${lower(productDescription.replace(/\.$/, ''))}. ` : '';
  const next = VERB_START.test(ctaGoal) ? `you can ${lower(ctaGoal)}` : `the next step is ${lower(ctaGoal)}`;
  const closing = `${about}${casual ? 'If this made you think, ' : 'If you would like to take this further, '}${next}.`;

  // ---- what was not given ------------------------------------------------------------------------------------------
  const missing: { field: string; change: string }[] = [];
  if (!given) missing.push({ field: 'key_points', change: v ? "the sections, which now come from the sector's own objection, measures and questions instead of your points" : 'the sections, which cannot be written without points or a sector' });
  if (!who) missing.push({ field: 'your_product', change: 'the closing paragraph and every place the draft names what you sell' });
  const notes: string[] = [];
  if (soft.removed.length) notes.push(`Claims to source before you publish: your key points use ${proseJoin(soft.removed.map((c) => `"${c}"`))}. The issue leaves them out; add one back only with a source a reader can check.`);
  if (unsourced.length) notes.push(`Figures with no source label: ${proseJoin(unsourced.map((p) => `"${p.text}"`))}. Add where each one comes from before the issue goes out.`);
  if (orders.length) notes.push(instructionNote(orders));
  notes.push('Link the button to the page or the reply address that does what the call to action says.');

  // ---- the hooks ---------------------------------------------------------------------------------------------------
  // alternative openings: a question the issue does not already ask, and the figure as the first line
  const askedInDraft = new Set(sections.flatMap((x) => x.body.split('"')));
  const hookQuestion = v ? toYou(v.discovery.filter((d) => !/\bclient'?s?\b|current provider|signs off each|governed|\bme\b|\bour\b|\bwe\b/i.test(d))[0] || '') : '';
  const hooks: { name: string; text: string }[] = [];
  if (hookQuestion) hooks.push({ name: 'Question', text: hookQuestion });
  const fig = figures.find((p) => p.label && isStatistic(p.text)) || figures.find((p) => isStatistic(p.text));
  if (fig) hooks.push({ name: 'Statistic', text: `Open with the figure from the evidence section, "${fig.text}"${fig.label ? ` (${fig.label})` : ''}, and state the problem second.${fig.label ? '' : ' Its source is not given yet, so add it before you use the figure.'}` });

  const sectorBlock = vFull ? `## Sector Notes: ${cap(vFull.name)}

${ctx.line}

- ${fits ? audienceLine(vFull) : `Readers named in your input: ${readers}. The notes below were written for ${vFull.name}, whose usual readers are ${vFull.buyerRoles.slice(0, 3).join(', ')}; they do not match your readers, so the draft does not use them.`}
- **Terms this audience uses:** ${vFull.vocabulary.slice(0, 6).join(', ')}.
- **Objections the sector file lists${fits ? '' : ' (written for its own readers, so check them against yours)'}, and how to settle each:** ${vFull.objections.map((o) => `"${o.objection}" (${lower(o.response.replace(/\.$/, ''))})`).join('; ')}.
- **A proof point that lands:** ${vFull.proofShape}` : `## Sector notes

${ctx.line}`;

  const table = `| Setting | Value |
|---------|-------|
| **Topic** | ${topic} |
| **Product** | ${product || (ctaProduct ? `${ctaProduct} (read from the call to action)` : parts.company ? `${parts.company} (read from the topic)` : 'not given')} |
| **Segment** | ${segment}${args.audience_segment ? '' : ' (default)'} |
| **Type** | ${type.replace(/_/g, ' ')}${args.newsletter_type ? '' : ' (default)'} |
| **Tone** | ${tone}${args.tone ? '' : ' (default)'} |
| **CTA Goal** | ${ctaGoal} |`;

  const out = `# Newsletter issue draft

**Subject:** ${subjects[0]}

**Preview:** ${preview(0)}

---

${openLines.join('\n\n')}

${sections.map((s, i) => `### ${i + 1}. ${s.heading}\n\n${s.body}`).join('\n\n')}

---

${closing}

**${cap(ctaGoal)}**

Button: ${cap(ctaGoal)}

---

## Subject Lines (A/B Test These)

The subject above is the first option. Test it against these three:

${subjects.slice(1, 4).map((s, i) => `**${s}**\n- Preview text: ${preview(i + 1)}`).join('\n\n')}
${hooks.length ? `\n---\n\n## Opening Hooks (Pick One)\n\n${hooks.map((h, i) => `### Hook ${i + 1}: ${h.name}\n> ${h.text}`).join('\n\n')}\n` : ''}
---

## Notes for you

${notes.map((n) => `- ${n}`).join('\n')}

${sectorBlock}

### What this draft was built from

${table}
${missing.length ? `\n${sharpenLine(missing)}\n` : ''}`;
  return out.replace(/\n{3,}/g, '\n\n');
}

// The first whole sentence of a paragraph, short enough for a preview line.
function firstSentence(text: string): string {
  const one = text.split(/(?<=[.!?])\s+(?=[A-Z"])/)[0].trim();
  return one.length <= 125 ? one : shorten(one, 110, true);
}
// A way to settle an objection, said to the reader; the sector's answer pattern is written for the seller.
function settleFor(response: string): string {
  const r = response.trim().replace(/\.$/, '');
  return `The way to test it is to ${r.charAt(0).toLowerCase()}${r.slice(1)}.`.replace(/\bthe buyer'?s own\b/gi, 'your own').replace(/\bthe buyer'?s\b/gi, 'your').replace(/\bthe buyer\b/gi, 'you');
}

// Four different subject lines, each short and whole. The first one is the subject of the draft.
function subjectLines(head: string, type: string, who: string, v: Vertical | null, forWhom: string, ctaGoal: string, readers: string, clause: boolean): string[] {
  const mid = lower(head);
  const m0 = v ? v.metrics[0] : '';
  const m1 = v ? v.metrics[1] : '';
  const readerHead = readers && readers.length <= 40 ? `For ${readers}: ${mid}` : '';
  const base: Record<string, string[]> = {
    educational: [head, m0 ? `Where do you stand on ${m0}?` : '', who ? `${who}: ${mid}` : '', readerHead, m0 && m1 ? `${cap(m0)} and ${m1}: what to check` : ''],
    product_update: [who ? `New from ${who}: ${mid}` : `New: ${mid}`, head, m0 ? `What this changes for ${m0}` : '', readerHead, who ? `${who}: ${mid}` : ''],
    industry_news: [head, `Industry news: ${mid}`, m0 ? `What this means for ${m0}` : '', readerHead, who ? `${who} on ${mid}` : ''],
    thought_leadership: [head, m0 ? `A view on ${m0}` : '', who ? `${who}: ${mid}` : '', readerHead, m0 ? `Where do you stand on ${m0}?` : ''],
    curated_links: [`${head}: this week's reading`, head, readerHead, m0 ? `Reading on ${m0}` : '', who ? `${who}: ${mid}` : '']
  };
  const pool = [...(base[type] || base.educational), ctaGoal ? `Next step: ${lower(ctaGoal)}` : '', `${head}: the issue`, clause ? `A question for ${forWhom}` : `${head}: read on`];
  const out: string[] = [];
  for (const c of pool) {
    const s = c.trim();
    if (!s || s.length > Math.max(76, head.length + 4)) continue;
    if (out.some((x) => x.toLowerCase() === s.toLowerCase())) continue;
    out.push(s);
  }
  while (out.length < 4) out.push(`${head} (${out.length + 1})`);
  return out.slice(0, 4);
}
