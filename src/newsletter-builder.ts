import { lowerFirstIfCommon, cap } from './utils.js';
import { readContext, audienceLine, isClause, type Vertical } from './sector.ts';
import { splitList, unpackTopic, fixNumbers, endSentence, capFirst, proseJoin, productParts, toYou, bestQuestion, softenClaims } from './draft.ts';
import { cleanSectorLine, looksClause, readPoints, groupPhrases, sentenceOf, renderGroup, readersFit, isStatistic, companyFrom, shorten, shortReaders, instructionNote, sharpenLine, stripGuardQuotes, waysToSettle, nk, quotedEnd, lowerFirstSafe, type Pt } from './rw-content.ts';

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
  // do the readers named share a word with the sector's own buyer roles? When they do not (online sellers against heads of supply chain), the sector's
  // measures still help but its questions and proof about systems, sites and lanes are left out
  const stemsOf = (t: string) => new Set((t.toLowerCase().match(/[a-z]{4,}/g) || []).map((x) => x.replace(/(?:ing|ed|es|s)$/, '').slice(0, 6)));
  const rolesFit = !v || !readers || [...stemsOf(readers)].some((x) => stemsOf(v.buyerRoles.join(' ')).has(x));
  const ENTERPRISE = /\b(?:systems?|data|owns?|owners?|lanes?|contracts?|vendors?|tenders?|procure\w*|erp|wms|tms|audit\w*|approv\w*|committee|stakeholders?|sign(?:s|ed)? off)\b/i;
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
    const proof = v ? (rolesFit ? `When a vendor shows you results like these, ${forWhom === 'your team' ? 'look for' : 'the evidence to ask for is'} ${lower(toYou(v.proofShape.replace(/\.$/, '')))}.` : 'When a vendor shows you results like these, ask for the same measure before and after, over the same period, for a group of a size you can compare with yours.') : '';
    sections.push({ heading: nm.evidence, body: [renderGroup(evidence, who, 'The results on record:'), proof].filter(Boolean).join('\n\n') });
  }
  // claims that carry only a page label are not results: say so, and name the evidence to ask for
  if (!evidence.length && v) {
    const claimed = [...outcomes, ...hows].filter((p) => p.label);
    const labels = [...new Set(claimed.map((p) => p.label))];
    if (claimed.length) sections.push({ heading: 'What to ask for', body: `The points marked ${proseJoin(labels.map((l) => `"${l}"`))} are the vendor's own claims, not results. Before you rely on them, ${rolesFit ? `the evidence to ask for is ${lower(toYou(v.proofShape.replace(/\.$/, '')))}` : 'ask for the same measure before and after, over the same period, for a group of a size you can compare with yours'}.` });
  }
  // the reader's own check: the sector's questions, said to the reader
  if (v) {
    const free = v.discovery.filter((d) => !/\bclient'?s?\b|current provider|signs off each|governed|\bme\b|\bour\b|\bwe\b/i.test(d) && (rolesFit || !ENTERPRISE.test(d)));
    const hookFirst = free[0] || '';
    const used = new Set<string>(hookFirst ? [hookFirst] : []);
    const n = segment === 'executives' ? 1 : 2;
    const asked: string[] = [];
    for (let i = 0; i < n; i++) { const q = bestQuestion(`${label} ${pts.map((p) => p.text).join(' ')}`, free, used); if (q && !asked.includes(toYou(q))) { asked.push(toYou(q)); used.add(q); } }
    const ms = v.metrics.filter((m) => !usedMetric.has(m)).slice(0, 2);
    const lead = asked.length === 1 ? 'Put this question to your own team' : 'Put these two questions to your own team';
    const qs = asked.length === 1 ? `"${asked[0]}"` : `First, "${asked[0]}" Second, "${asked[1]}"`;
    const body = asked.length ? [`${lead} this week. ${qs}`, ms.length ? `Whatever the answers, write down where you stand today on ${proseJoin(ms)}, so that the next change has a number to beat.` : ''].filter(Boolean).join(' ') : ms.length ? `Put this to your own team this week: where do you stand today on ${proseJoin(ms)}, and who looks at those numbers? Write the answers down, so that the next change has a number to beat.` : '';
    if (body) sections.push({ heading: nm.check, body });
  }
  if (!v && given && (hows.length || outcomes.length || evidence.length)) {
    const piece = opening ? opening.text.split(/;\s+/)[0].replace(/[.\s]+$/, '') : '';
    const first = piece && piece.split(/\s+/).length >= 4 && piece.length <= 170 ? `Does this sound like your own team today: ${lower(piece.replace(/"/g, "'"))}? How often, and who feels it first?` : 'Where does this happen in your own work today, and who feels it first?';
    sections.push({ heading: nm.check, body: `Put these two questions to your own team this week. First, "${first}" Second, "Which one number would tell you whether it is getting better?" Whatever the answers, write them down, so that the next change has a baseline to beat.` });
  }
  const pushWho = readers ? cap(readers) : kind ? `Teams in ${kind}` : 'Readers';
  // where readers push back: the sector objection that shares words with the points (never one that the input did not touch), labelled as the sector's
  if (v && given && fits) {
    const text = ` ${label} ${pts.map((p) => p.text).join(' ')} `.toLowerCase();
    let best = v.objections[0]; let bestN = 0;
    for (const o of v.objections) { const n = (o.objection.toLowerCase().match(/[a-z]{5,}/g) || []).filter((w) => text.includes(w.slice(0, 5))).length; if (n > bestN) { best = o; bestN = n; } }
    const settle = waysToSettle(best.response);
    if (settle && bestN > 1) sections.splice(Math.max(0, sections.length - 1), 0, { heading: 'Where readers push back', body: `The sector notes list this pushback for ${kind || 'this kind of product'}, and your points touch it: ${quotedEnd(best.objection)} ${settle}` });
  }
  // no key points: the sector's own objection, in the reader's voice, is the first section
  if (!given && v) {
    const o = v.objections[0];
    const settle = waysToSettle(o.response);
    sections.unshift({ heading: 'The question you will hear', body: `${readers ? cap(readers) : `Teams in ${kind}`} often say: ${quotedEnd(o.objection)} ${settle}`.trim() });
  }

  // ---- subject, preview, opening ------------------------------------------------------------------------------------
  const headSource = parts.problem ? parts.problem.split(/;\s+/)[0] : label;
  const headMax = parts.short ? 90 : 72;
  const pieceHeads = (parts.problem ? parts.problem.split(/;\s+|,\s+(?:and\s+)?(?=[a-z])/) : []).concat(problems.flatMap((p) => p.text.split(/;\s+|,\s+(?:and\s+)?(?=[a-z])/))).map((x) => x.trim()).filter(Boolean);
  const head = shorten(headSource, headMax, true) || pieceHeads.map((x) => shorten(x, headMax, true)).find((x) => x && x.split(/\s+/).length >= 4) || (v ? `Where do you stand with ${v.metrics[0]}?` : who && readers ? `${who} for ${readers}` : shorten(label, 66));
  const clause = !parts.short || isClause(topic) || LABEL_CLAUSE.test(label);
  const subjects = subjectLines(head, type, who, v, forWhom, ctaGoal, readers, clause);
  const roadmap = sections.length ? `${casual ? 'Here is what is in this issue' : 'In this issue'}: ${proseJoin(sections.map((s) => lower(s.heading)))}.` : '';
  const openLines: string[] = [];
  if (opening) openLines.push(openingSentences(opening, who));
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
  for (const c of previewPool) { const x = c.trim(); if (x && x.length >= 28 && x.length <= 125 && !previewOptions.some((y) => nk(y) === nk(x))) previewOptions.push(x); }
  const preview = (i: number) => previewOptions[i % previewOptions.length];

  // ---- closing -----------------------------------------------------------------------------------------------------
  const about = productName && productDescription && productDescription !== productName && productDescription.length > productName.length + 3 ? `${productName} is ${lower(productDescription.replace(/\.$/, ''))}. ` : '';
  const next = VERB_START.test(ctaGoal) ? `you can ${lower(ctaGoal)}` : `the next step is ${lower(ctaGoal)}`;
  const closing = `${about}${casual ? 'If this made you think, ' : 'If you would like to take this further, '}${next}.`;
  // the button says the action in a few words: a bracket note is left out, and a long product name is the short name the issue already uses
  const buttonText = ((): string => {
    let b = ctaGoal.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    if (who && b.length > 45) { const m = b.match(/^(.*?\b(?:about|with|from|for|to)\s+)(\S.*)$/i); if (m && m[2].toLowerCase().startsWith(who.toLowerCase()) && m[2].length > who.length + 3) b = `${m[1]}${who}`; }
    return cap(b);
  })();

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
  const hookQuestion = v ? toYou(v.discovery.filter((d) => !/\bclient'?s?\b|current provider|signs off each|governed|\bme\b|\bour\b|\bwe\b/i.test(d) && (rolesFit || !ENTERPRISE.test(d)))[0] || '') : '';
  const hooks: { name: string; text: string }[] = [];
  if (hookQuestion) hooks.push({ name: 'Question', text: hookQuestion });
  const fig = figures.find((p) => p.label && isStatistic(p.text)) || figures.find((p) => isStatistic(p.text));
  if (fig) hooks.push({ name: 'Statistic', text: `${capFirst(fig.text)}${fig.label ? ` (${fig.label})` : ''}: what would a figure like that mean for ${forWhom === 'your team' ? 'your own work' : forWhom}?${fig.label ? '' : ' Its source is not given yet, so add it before you use the figure.'}` });

  const sectorBlock = vFull ? `## Sector Notes: ${cap(vFull.name)}

${cleanSectorLine(ctx.line)}

- ${fits ? (rolesFit ? audienceLine(vFull) : `Readers named in your input: ${readers}. The sector file's usual readers for ${vFull.name} are ${vFull.buyerRoles.slice(0, 3).join(', ')}; the draft uses its measures and leaves out its buying group and its questions about systems and data.`) : `Readers named in your input: ${readers}. The notes below were written for ${vFull.name}, whose usual readers are ${vFull.buyerRoles.slice(0, 3).join(', ')}; they do not match your readers, so the draft does not use them.`}
- **Terms this audience uses:** ${vFull.vocabulary.slice(0, 6).join(', ')}.
- **Objections the sector file lists${fits ? '' : ' (written for its own readers, so check them against yours)'}, and how to settle each:** ${vFull.objections.map((o) => `"${o.objection}" (${lower(o.response.replace(/\.$/, ''))})`).join('; ')}.
- **A proof point that lands:** ${vFull.proofShape}` : `## Sector notes

${cleanSectorLine(ctx.line)}`;

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

Button: ${buttonText}

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

// The problem as the issue opens: a run of clauses is said as sentences of their own; a run of phrases is said as a list of problems.
function openingSentences(opening: Pt, who: string): string {
  for (const cut of [/;\s+/, /;\s+|,\s+(?:and\s+)?(?=[a-z])/]) {
    const pieces = opening.text.split(cut).map((x) => x.trim()).filter(Boolean);
    if (opening.clause && pieces.length >= 2 && pieces.every((x) => x.split(/\s+/).length >= 5 && looksClause(x))) return pieces.map((x) => endSentence(capFirst(x))).join(' ');
  }
  const phrases = opening.text.split(/;\s+/).map((x) => x.trim()).filter(Boolean);
  if (!opening.clause && phrases.length >= 2) return endSentence(`${phrases.length === 2 ? 'Two problems' : phrases.length === 3 ? 'Three problems' : 'Several problems'} come up: ${phrases.map(lower).join('; ')}`);
  return sentenceOf(opening, who);
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

// Four different subject lines, each short and whole. The first one is the subject of the draft; no two of the others repeat one phrase.
function subjectLines(head: string, type: string, who: string, v: Vertical | null, forWhom: string, ctaGoal: string, readers: string, clause: boolean): string[] {
  const mid = lower(head);
  const m0 = v ? v.metrics[0] : '';
  const m1 = v ? v.metrics[1] : '';
  const readerHead = readers && readers.length <= 40 ? `For ${readers}: ${mid}` : '';
  const base: Record<string, string[]> = {
    educational: [head, m0 ? `Where do you stand with ${m0}?` : '', who ? `${who}: ${mid}` : '', readerHead, m0 && m1 ? `${cap(m0)} and ${m1}: what to check` : ''],
    product_update: [who ? `New from ${who}: ${mid}` : `New: ${mid}`, head, m0 ? `What this changes for ${m0}` : '', readerHead, who ? `${who}: ${mid}` : ''],
    industry_news: [head, `Industry news: ${mid}`, m0 ? `What this means for ${m0}` : '', readerHead, who ? `${who} on ${mid}` : ''],
    thought_leadership: [head, m0 ? `Thinking about ${m0}` : '', who ? `${who}: ${mid}` : '', readerHead, m0 ? `Where do you stand with ${m0}?` : ''],
    curated_links: [`${head}: this week's reading`, head, readerHead, m0 ? `Reading about ${m0}` : '', who ? `${who}: ${mid}` : '']
  };
  const pool = [...(base[type] || base.educational), m0 && m1 ? `${cap(m0)} and ${m1}: what to check` : '', m0 ? `Questions to ask your team about ${m0}` : '', ctaGoal ? `Next step: ${lower(ctaGoal)}` : '', `${head}: the issue`, clause ? `A question for ${forWhom}` : `${head}: read on`, `A short read for ${forWhom}`, `What to check this week, for ${forWhom}`];
  const out: string[] = [];
  let withHead = 0;
  for (const c of pool) {
    const s = c.trim();
    if (!s || s.length > Math.max(76, head.length + 4)) continue;
    if (out.some((x) => x.toLowerCase() === s.toLowerCase())) continue;
    // an alternative repeats the subject's own words at most once; a name is never said twice in one line
    if (out.length && s.toLowerCase().includes(mid)) { if (withHead >= 1) continue; withHead++; }
    if (who && s.toLowerCase().split(who.toLowerCase()).length > 2) continue;
    out.push(s);
  }
  while (out.length < 4) out.push(`${head} (${out.length + 1})`);
  return out.slice(0, 4);
}
