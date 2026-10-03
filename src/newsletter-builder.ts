import { generateHook, lowerFirstIfCommon, cap, SUGGESTION_FOOTER, clipEcho } from './utils.js';
import { readContext, audienceLine, isClause, type Vertical } from './sector.ts';
import { splitList, tidyPoint, roleOf, FIGURE, STAT, softenClaims, bestQuestion, toYou, dropTail, unpackTopic, fixNumbers, endSentence, capFirst, shortenClauses, proseJoin, clipAtWord } from './draft.ts';

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
  const ctx = readContext(undefined, { seller: [product, parts.problem || topic], context: [args.key_points, args.previous_topics, args.cta_goal], buyer: [parts.audience] });

  // DERIVE key points from topic if not provided
  let keyPoints: string[];
  let keyPointsNote = '';
  if (args.key_points) {
    keyPoints = splitList(args.key_points).map(tidyPoint).map((p) => softenClaims(p).text);
  } else {
    keyPoints = generateKeyPointsFromTopic(label, type, segment, ctx.v);
    keyPointsNote = '*(Suggested from the topic: replace with your own)*';
  }
  const figures = keyPoints.filter((p) => STAT.test(p));
  const v = ctx.v;

  // Generate multiple subject line options
  const subjectLines = generateSubjectLines(label, clause, type, keyPoints.length, v, topic);

  // Generate hooks
  const hooks = generateHooks(label, clause, v, figures);

  // Segment-specific adjustments
  const segmentConfig = {
    executives: { depth: 'high-level', length: 'concise', focus: 'business impact' },
    practitioners: { depth: 'tactical', length: 'detailed', focus: 'how-to' },
    technical: { depth: 'deep', length: 'comprehensive', focus: 'implementation' },
    general: { depth: 'accessible', length: 'moderate', focus: 'value' },
    prospects: { depth: 'introductory', length: 'short', focus: 'benefits' },
    customers: { depth: 'advanced', length: 'moderate', focus: 'optimization' }
  };

  const config = segmentConfig[segment as keyof typeof segmentConfig] || segmentConfig.general;

  const sectorBlock = ctx.v ? `
## Sector Notes: ${cap(ctx.v.name)}

${ctx.line}

- ${audienceLine(ctx.v)}
- **A proof point that lands:** ${ctx.v.proofShape}
- **Terms this audience uses:** ${ctx.v.vocabulary.slice(0, 6).join(', ')}.
- **Objections to answer in the issue:** ${ctx.v.objections.map((o) => o.objection.toLowerCase()).join('; ')}.

---
` : `
## Sector Notes

${ctx.line}

---
`;

  const readers = parts.audience ? `\n*The topic names its readers (${clipAtWord(parts.audience, 120)}). The subject lines and hooks use the problem as the label: ${q2(label)}.*\n` : '';

  const output = `# Newsletter Builder: ${topic}

## Newsletter Configuration

| Setting | Value |
|---------|-------|
| **Topic** | ${topic} |
| **Product** | ${product || (ctaProduct ? `${ctaProduct} (read from the call to action)` : parts.company ? `${parts.company} (read from the topic)` : 'not given (add your_product to name it in the notes below)')} |
| **Segment** | ${segment} |
| **Type** | ${type.replace(/_/g, ' ')} |
| **Tone** | ${tone} |
| **CTA Goal** | ${ctaGoal} |

---

## Subject Lines (A/B Test These)
${readers}
### Option A: Curiosity-Driven
**${subjectLines[0]}**${subjectLineLabel(type, 0)}
- Preview text: ${previewText(0, keyPoints, subjectLines[0])}

### Option B: Benefit-Focused
**${subjectLines[1]}**${subjectLineLabel(type, 1)}
- Preview text: ${previewText(1, keyPoints, subjectLines[1])}

### Option C: Number/List Style
**${subjectLines[2]}**${subjectLineLabel(type, 2)}
- Preview text: ${previewText(2, keyPoints, subjectLines[2])}

### Option D: Personal/Direct
**${subjectLines[3]}**${subjectLineLabel(type, 3)}
- Preview text: ${previewText(3, keyPoints, subjectLines[3])}

---

## Opening Hooks (Pick One)

${hooks.map((h, i) => `### Hook ${i + 1}: ${h.name}\n> ${h.text}`).join('\n\n')}

---

## Newsletter Content

### Version: ${segment.charAt(0).toUpperCase() + segment.slice(1)} Focus

---

**Subject:** ${subjectLines[0]}

**Preview:** ${previewText(0, keyPoints, subjectLines[0])}

---

${hooks[0].text}

${keyPointsNote ? keyPointsNote + '\n\n' : ''}${generateBodyContent(keyPoints, config, args.key_points ? '' : type, v, type, label, (() => { const f = roleOf(parts.audience).field; return f && f.length <= 40 && !/\d|;/.test(f) ? f : ''; })())}
${product ? `*Where ${product} fits: one sentence on how it helps with this topic, only where it fits the story and only with a result you can prove.*

` : ''}${generateCtaSection(ctaGoal)}

---

${previousTopics.length > 0 ? `
## Connection to Previous Content

Your recent topics: ${previousTopics.join('; ')}

**Thread this together:**
- Reference: "Last week we talked about ${lowerFirstIfCommon(previousTopics[0])}. This week, let's go deeper into ${lowerFirstIfCommon(label)}..."
- Callback: "Remember our issue on ${lowerFirstIfCommon(previousTopics[0])}? Here is how it connects to ${lowerFirstIfCommon(label)}..."
- Series (only if these issues form a series): "This continues our run on ${lowerFirstIfCommon(label)}..."
${previousTopics.length > 1 ? `- Other recent issues to link to: ${previousTopics.slice(1).join('; ')}\n` : ''}
---` : ''}

## Content Structure Recommendation

Based on ${type.replace(/_/g, ' ')} type and ${segment} audience:

${getStructureRecommendation(type, segment)}
${sectorBlock}
## Pre-Send Checklist

- [ ] Subject line A/B test set up
- [ ] Preview text complements (not repeats) subject
- [ ] All links tested and tracked
- [ ] Mobile preview checked
- [ ] Personalization tokens verified
- [ ] Unsubscribe link present
- [ ] CTA button is primary color, above fold
- [ ] Images have alt text
- [ ] Plain text version generated

---

## Optimization Tips for ${segmentPhrase(segment)}

${getSegmentTips(segment)}

---

## Send Times for ${segmentPhrase(segment)}

${getSendTimesForSegment(segment)}

---

${SUGGESTION_FOOTER}
`;

  return output;
}

const q2 = (s: string) => `"${s}"`;
// A label that is a clause (a verb inside it) cannot follow "about", "on" or "of": it is placed before a colon only.
const LABEL_CLAUSE = /\b(?:is|are|was|were|run|runs|combine|combines|means|rely|relies|chain|chains|sits|happens|hand|hands|can|will|must|should|have|has|do|does|break|breaks|fragments|drift|drifts)\b/i;

// Option indexes of the subject lines that open with an example count ("5 ... mistakes"), per newsletter type.
// Unknown types use the educational subject lines, as generateSubjectLines does.
const EXAMPLE_COUNT_SUBJECTS: Record<string, number[]> = {
  educational: [2],
  product_update: [],
  industry_news: [2],
  thought_leadership: [],
  curated_links: [1]
};

function subjectLineLabel(type: string, index: number): string {
  const indexes = Object.prototype.hasOwnProperty.call(EXAMPLE_COUNT_SUBJECTS, type)
    ? EXAMPLE_COUNT_SUBJECTS[type]
    : EXAMPLE_COUNT_SUBJECTS.educational;
  return indexes.includes(index) ? ' (Example figure: replace with your own)' : '';
}

// Run 19 (D80, problem 2): every subject line places the topic after a colon, after "about" or after "on", where a phrase, a clause
// or a question all read correctly. Run 20 (round 1b): a label that holds a verb is placed before a colon only.
function generateSubjectLines(label: string, clause: boolean, type: string, nPoints: number, v: Vertical | null, fullTopic: string): string[] {
  const short = label;
  // Text only (run 10, R10-28): the topic placed after leading words follows the first-word rule
  // (names and acronyms keep their capitals). Product updates keep it as typed.
  const mid = lowerFirstIfCommon(short);
  const head = cap(mid);
  const n = Math.max(3, Math.min(nPoints, 5));
  const measure = v ? v.metrics[0] : '';

  const templates: Record<string, string[]> = {
    educational: [
      clause ? `${head}: the part nobody talks about` : `The truth about ${mid} (nobody talks about this)`,
      measure ? `${head}: what to do first, and what to measure (${measure})` : `${head}: what to do first, and what to skip`,
      `${head}: ${n} mistakes even experts make`,
      `${head}: your complete guide`
    ],
    product_update: [
      isClause(fullTopic) || clause ? `New: ${short} (only if customers asked for it)` : `New: The ${short} feature you asked for (only if customers asked for it)`,
      `You asked, we built: ${short} (only if customers asked for it)`,
      `Just shipped: ${short} (+ what's next)`,
      `Product update: ${short}`
    ],
    industry_news: [
      clause ? `${head}: what you need to know this week` : `This week in ${mid}: what you need to know`,
      `${head}: what is changing, and what it means`,
      `${head}: ${n} stories that matter`,
      clause ? `${head}: the signals to watch` : `The update on ${mid} that everyone is talking about (only if true)`
    ],
    thought_leadership: [
      `${head}: what most people get wrong`,
      clause ? `${head}: my view, and where I disagree` : `Unpopular opinion on ${mid}`,
      `${head}: ${n} points to put to your team`,
      `${head}: the question I would ask first`
    ],
    curated_links: [
      `${head}: best reads this week`,
      `${n} must-read links on ${clause ? 'this' : mid}${clause ? ': ' + short : ''}`,
      clause ? `${head}: your reading list` : `Your reading list on ${mid}`,
      clause ? `${head}: this week's best content` : `This week's best content on ${mid}`
    ]
  };

  return templates[type] || templates.educational;
}

// Preview text: one line per option, built from key points that fit whole (never cut in a word or a phrase).
function previewText(index: number, points: string[], subject = ''): string {
  const fits = points.map((p) => shortenClauses(p, 90)).filter((p) => p.length <= 95 && !/\.\.\.$/.test(p) && !subject.toLowerCase().includes(p.toLowerCase().slice(0, 40)));
  if (!fits.length) return 'Add key_points of a few words each to get preview text built from them.';
  const a = fits[index % fits.length];
  const b = fits[(index + 1) % fits.length];
  const lead = ['Inside', 'Plus', 'In this issue', 'Also'][index % 4];
  return a === b || a.length + b.length > 120 ? `${lead}: ${a}` : `${lead}: ${a}; ${b}`;
}

// Hooks. The question is the sector's own discovery question when the sector is known; the statistic uses a figure the user gave,
// never an invented one; the story and the statement say what input would complete them.
function generateHooks(label: string, clause: boolean, v: Vertical | null, figures: string[]): { name: string; text: string }[] {
  const t = lowerFirstIfCommon(label);
  const fig = figures[0];
  return [
    { name: 'Question', text: v ? v.discovery[0] : `How are you handling this today: ${t}?` },
    { name: 'Statistic', text: fig ? `${endSentence(capFirst(shortenClauses(fig, 150)))} Use it as the opening line, and name where the figure comes from.` : 'No figure was given in key_points, so there is no statistic hook. Add one figure you can source to key_points to get it.' },
    { name: 'Story', text: v ? `Open with a week in the life of ${aRole(v.buyerRoles[0])}: what they check first, and what goes wrong. Give one real moment in key_points to have it written out.` : 'Open with one real moment from a customer or from your own week. Give it in key_points to have it written out.' },
    { name: 'Bold Statement', text: clause ? `Here is what most teams get wrong, and what to do instead: ${t}.` : `Here is what most teams get wrong about ${t}, and what to do instead.` }
  ];
}
function aRole(role: string): string { return `${/^[aeiou]/i.test(role) ? 'an' : 'a'} ${role}`; }

// How deep to write for the chosen audience: printed once above the sections.
const DEPTH_NOTE: Record<string, string> = {
  'high-level': 'Keep each section to its business impact: outcomes over activities.',
  'tactical': 'Give each section one step the reader can take this week.',
  'deep': 'Give each section the mechanism and the details: the settings, the steps and the tests.',
  'accessible': 'Keep each section simple: one idea, in plain words.',
  'introductory': 'Assume the reader is new to this: start from the basics.',
  'advanced': 'Assume the reader knows the basics: go straight to the advanced use case.'
};

// What to add to finish a section of this newsletter type, in order. Each says what input or fact would complete it.
const SECTION_FINISH: Record<string, string[]> = {
  educational: [
    'add one fact from your market that shows why this matters now',
    'add the two or three mistakes you see most',
    'add your steps, in order',
    'add a real example: a customer or your own',
    'add one line to remember, and the next step'
  ],
  product_update: [
    'add what changed, in one or two sentences',
    'add the benefit for the reader',
    'add the first steps to try it',
    'add two or three tips from your team',
    'add what comes next, only if you can share it'
  ],
  industry_news: [
    'add the news, with its source',
    'add what it means for the reader',
    'add a view from someone you can name, with their permission',
    'add the signals to watch',
    'add one or two actions to take'
  ],
  thought_leadership: [
    'add your view, in one or two sentences',
    'add your evidence: a story, a number or a source',
    'add what you have seen them do differently',
    'add your framework, in a few lines',
    'add one to three actions for this week'
  ],
  curated_links: [
    'add the title, link and one line on why it is worth reading',
    'add the title, link and one line on why it is worth watching',
    'add the name, link and what it does',
    'add the take, its source and your view',
    'add your note'
  ]
};

const MAX_SECTIONS = 6;
// What the reader is asked to do at the end of a section, by newsletter type.
const ACTION: Record<string, ((metric: string) => string)[]> = {
  educational: [
    (m) => `This week: check how your team answers it, and write down where you stand${m ? ` on ${m}` : ''}.`,
    (m) => `Next step: ask the person closest to the work for their answer, and compare it with yours${m ? ` on ${m}` : ''}.`,
    (m) => `Before you move on: pick one example from last month that shows it${m ? `, and note what it did to ${m}` : ''}.`
  ],
  product_update: [
    (m) => `Try it this week and see what changes${m ? ` in ${m}` : ''}.`,
    (m) => `Start with one team and compare before and after${m ? ` on ${m}` : ''}.`
  ],
  industry_news: [
    (m) => `What to do: decide whether this changes your plan${m ? ` for ${m}` : ''}.`,
    (m) => `Watch for it next quarter${m ? ` in ${m}` : ''}, and note who in your team owns the answer.`
  ],
  thought_leadership: [
    (m) => `What to do differently: take it to your next review${m ? ` and put ${m} next to it` : ''}.`,
    (m) => `A challenge for this week: argue the opposite view in your team meeting${m ? `, and see what it does to ${m}` : ''}.`,
    (m) => `Test it on one live case${m ? `, and write down what happens to ${m}` : ''}.`
  ],
  curated_links: [
    (m) => `Why it is worth your time: it speaks to${m ? ` ${m}` : ' your own work'}.`,
    (m) => `Read it with${m ? ` ${m}` : ' one live problem'} in mind.`
  ]
};
function generateBodyContent(keyPoints: string[], config: { depth: string; length: string; focus: string }, suggestedType: string, v: Vertical | null, type: string, label: string, field: string): string {
  const acts = ACTION[type] || ACTION.educational;
  const shown = keyPoints.slice(0, MAX_SECTIONS);
  const usedQ = new Set<string>();
  let content = `This issue looks at ${shown.length} ${shown.length === 1 ? 'point' : 'points'} on ${label}. Each point ends with something you can do this week.

`;
  shown.forEach((point, index) => {
    const figure = FIGURE.test(point);
    const heading0 = shortenClauses(point, 110); const heading = /\.\.\.$/.test(heading0) ? dropTail(point.split(/\s+/).slice(0, 12).join(' ')) : heading0;
    const full = endSentence(capFirst(point));
    const metric = v ? v.metrics[index % v.metrics.length] : '';
    const where = field || 'this field';
    content += `### ${index + 1}. ${cap(heading)}

${full === `${cap(heading)}.` ? '' : `${full} `}${v ? `For readers in ${where}, this shows up in ${toYou(metric)}. A fair test: "${toYou(bestQuestion(point, v.discovery, usedQ))}" ` : 'Put your own numbers next to this point before you decide what to do about it. '}${acts[index % acts.length](metric)}

${figure ? `*This point holds a figure. Name where it comes from before the issue goes out.*\n\n` : ''}`;
  });
  if (keyPoints.length > shown.length) {
    content += `### More points from your list

${keyPoints.slice(shown.length).map((p) => `- ${endSentence(capFirst(p))}`).join('\n')}

*These ${keyPoints.length - shown.length} points did not get a section of their own, to keep the issue short. Fold them into the sections above or hold them for the next issue.*

`;
  }
  return content;
}

// Run 19 (D80, problem 3): the call to action is the one the user gave, used as the heading and as the button. It is never
// replaced by a fixed offer (a demo, a guide) the user did not name.
function generateCtaSection(ctaGoal: string): string {
  const goalLower = ctaGoal.toLowerCase();
  const button = `[${cap(ctaGoal)} →]`;
  let helper = 'Link the button to the page or the reply address that does this.';
  if (/\b(reply|feedback)\b/.test(goalLower)) helper = 'Hit reply and let me know.';
  else if (/\bshare\b/.test(goalLower)) helper = 'Forward this to a colleague who needs to see it.';
  else if (/\b(download|guide)\b/.test(goalLower)) helper = 'Say what the download adds to this issue.';
  return `---

**${cap(ctaGoal)}**

${button}

${helper}`;
}

function getStructureRecommendation(type: string, segment: string): string {
  const structures: Record<string, string> = {
    educational: `
1. **Hook** (1-2 sentences): Draw them in
2. **Context** (1 paragraph): Why this matters now
3. **Main content** (3-5 points): The meat
4. **Summary** (1 paragraph): Key takeaway
5. **CTA** (1 line): What to do next`,
    product_update: `
1. **Announcement** (1 sentence): What's new
2. **Why it matters** (1 paragraph): User benefit
3. **How it works** (2-3 bullets): Quick overview
4. **Getting started** (1 paragraph): How to use it
5. **CTA** (1 line): Try it now`,
    industry_news: `
1. **Lead story** (1 paragraph): Most important news
2. **Analysis** (2-3 sentences): What it means
3. **Supporting stories** (2-3 bullets): Other news
4. **Your take** (1 paragraph): Expert perspective
5. **CTA** (1 line): Share your thoughts`,
    thought_leadership: `
1. **Contrarian hook** (1-2 sentences): Challenge assumption
2. **The problem** (1 paragraph): What's broken
3. **Your thesis** (1 paragraph): Your perspective
4. **Evidence** (2-3 points): Support your view
5. **Call to action** (1 paragraph): What to do differently`,
    curated_links: `
1. **Intro** (1-2 sentences): Theme of this edition
2. **Featured article** (1 paragraph + link): Best of the week
3. **Quick reads** (3-5 bullets + links): Other good content
4. **Your commentary** (1 paragraph): Why these matter
5. **CTA** (1 line): Suggest content for next week`
  };

  return structures[type] || structures.educational;
}

function getSegmentTips(segment: string): string {
  const tips: Record<string, string> = {
    executives: `
- Keep it short
- Lead with business impact
- Use bullet points for scanning
- Include executive summary at top
- Outcomes and metrics matter most`,
    practitioners: `
- Include specific how-to steps
- Link to resources and templates
- Use real examples
- Be generous with details
- They want to DO something`,
    technical: `
- Depth is expected: don't oversimplify
- Include code snippets if relevant
- Link to documentation
- Be precise with terminology
- They'll fact-check you`,
    general: `
- Balance accessibility with substance
- Mix short and longer paragraphs
- Use analogies to explain complex ideas
- Include visuals when possible
- One clear CTA`,
    prospects: `
- Focus on benefits, not features
- Social proof is essential
- Soft CTAs work better
- Educational > promotional
- Build trust first`,
    customers: `
- Assume baseline knowledge
- Focus on advanced use cases
- New features and updates matter
- Community and best practices
- They want to optimize`
  };

  return tips[segment] || tips.general;
}

// Run 19: no benchmark claims. Each line is a starting point to test against your own open and click data.
function getSendTimesForSegment(segment: string): string {
  const times: Record<string, string> = {
    executives: 'Start early in the working day, before meetings begin. Test two send times and keep the one your own opens favour.',
    practitioners: 'Start mid-morning on a working day, when people sit down to work. Test two send times and keep the one your own opens favour.',
    technical: 'Start in the afternoon, when people look for a break from focused work. Test two send times and keep the one your own opens favour.',
    general: 'Start mid-morning on a working day. Test two send times and keep the one your own opens favour.',
    prospects: 'Start mid-morning on a working day, not first thing. Test two send times and keep the one your own opens favour.',
    customers: 'Start mid-week, mid-morning. Test two send times and keep the one your own opens favour.'
  };

  return times[segment] || times.general;
}

// Generate key points from topic when not provided. Run 19: the topic is placed after a colon, so a phrase, a clause or a question
// all read correctly, and where the sector is known the points use its measures, objections and proof shape.
function generateKeyPointsFromTopic(topic: string, type: string, segment: string, v: Vertical | null): string[] {
  const T = cap(lowerFirstIfCommon(topic));
  const t = lowerFirstIfCommon(topic);
  const objection = v ? v.objections[0].objection.toLowerCase() : '';
  const measures = v ? v.metrics.slice(0, 3).join(', ') : '';
  const basePoints: Record<string, string[]> = {
    educational: [
      `${T}: why it matters now`,
      v ? `The objection readers raise most: ${objection}` : `${T}: the mistakes to avoid`,
      `${T}: a step-by-step approach`,
      v ? `What to measure: ${measures}` : `${T}: real examples in action`,
      `Key takeaway and next steps`
    ],
    product_update: [
      `What's new: ${t}`,
      `How this helps you`,
      `How to get started`,
      `Tips for best results`,
      `What's coming next`
    ],
    industry_news: [
      `Latest developments: ${t}`,
      `Why this matters to you`,
      `Expert perspectives`,
      v ? `Signals to watch: ${measures}` : `What to watch for`,
      `How to prepare`
    ],
    thought_leadership: [
      `The contrarian view: ${t}`,
      v ? `Evidence that challenges conventional wisdom: ${v.proofShape.replace(/\.$/, '').replace(/^A /, 'a ')}` : `Evidence that challenges conventional wisdom`,
      `What top performers do differently`,
      `A framework for thinking about it: ${t}`,
      `Actions to take this week`
    ],
    curated_links: [
      `Best read this week: ${t}`,
      `Must-watch video: ${t}`,
      `Tool or resource: ${t}`,
      `Hot take worth considering`,
      `What we're thinking about`
    ]
  };

  // Adjust based on segment
  const points = basePoints[type] || basePoints.educational;

  // For executives, make more strategic
  if (segment === 'executives') {
    return points.map(p => p.replace('step-by-step', 'strategic').replace('How to', 'Why to'));
  }

  // For technical, make more detailed
  if (segment === 'technical') {
    return points.map(p => p.replace('approach', 'implementation').replace('tips', 'best practices'));
  }

  return points;
}

// Run 12 (R12-20): "Tips for a general audience", not "Tips for general".
function segmentPhrase(segment: string): string {
  return segment === 'general' ? 'a general audience' : segment;
}
