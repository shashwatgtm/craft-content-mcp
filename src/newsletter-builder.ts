import { generateHook, lowerFirstIfCommon, cap, SUGGESTION_FOOTER, clipEcho } from './utils.js';
import { splitItems, readContext, audienceLine, isClause, type Vertical } from './sector.ts';

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
  const topic = args.topic.trim();
  const segment = args.audience_segment || 'general';
  const type = args.newsletter_type || 'educational';
  const tone = args.tone || 'professional';
  const previousTopics = args.previous_topics ? splitItems(args.previous_topics) : [];
  const ctaGoal = args.cta_goal.trim();
  const product = (args.your_product || '').trim();
  // Run 19 (B15-L1): the heading and the Topic row print the topic as typed; every other echo of it is cut at 200 characters.
  const topicEcho = clipEcho(topic, 200);
  // Run 19 (D80, problems 4 and 8): the sector is read from every text the user gave.
  const ctx = readContext(undefined, [topic, args.key_points, args.previous_topics, product], [args.cta_goal]);

  // DERIVE key points from topic if not provided
  let keyPoints: string[];
  let keyPointsNote = '';
  if (args.key_points) {
    keyPoints = splitItems(args.key_points);
  } else {
    keyPoints = generateKeyPointsFromTopic(topicEcho, type, segment, ctx.v);
    keyPointsNote = '*(Suggested from the topic: replace with your own)*';
  }

  // Generate multiple subject line options
  const subjectLines = generateSubjectLines(topic, type);

  // Generate hooks
  const hooks = [
    generateHook(topicEcho, 'question'),
    generateHook(topicEcho, 'statistic'),
    generateHook(topicEcho, 'story'),
    generateHook(topicEcho, 'bold_statement')
  ];

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

---
` : `
## Sector Notes

${ctx.line}

---
`;

  let output = `# Newsletter Builder: ${topic}

## Newsletter Configuration

| Setting | Value |
|---------|-------|
| **Topic** | ${topic} |
| **Product** | ${product || 'not given (add your_product to name it in the notes below)'} |
| **Segment** | ${segment} |
| **Type** | ${type.replace(/_/g, ' ')} |
| **Tone** | ${tone} |
| **CTA Goal** | ${ctaGoal} |

---

## Subject Lines (A/B Test These)
${topic.length > TOPIC_FULL ? `\n*Your topic is ${topic.length} characters, too long for a subject line, so the subject lines show a placeholder: replace it with a label of a few words. The full topic is used in the hooks.*\n` : ''}
### Option A: Curiosity-Driven
**${subjectLines[0]}**${subjectLineLabel(type, 0)}
- Preview text: ${generatePreviewText(0, topicEcho)}

### Option B: Benefit-Focused
**${subjectLines[1]}**${subjectLineLabel(type, 1)}
- Preview text: ${generatePreviewText(1, topicEcho)}

### Option C: Number/List Style
**${subjectLines[2]}**${subjectLineLabel(type, 2)}
- Preview text: ${generatePreviewText(2, topicEcho)}

### Option D: Personal/Direct
**${subjectLines[3]}**${subjectLineLabel(type, 3)}
- Preview text: ${generatePreviewText(3, topicEcho)}

---

## Opening Hooks (Pick One)

### Hook 1: Question
> ${hooks[0]}

### Hook 2: Statistic
> ${hooks[1]}

### Hook 3: Story
> ${hooks[2]}

### Hook 4: Bold Statement
> ${hooks[3]}

---

## Newsletter Content

### Version: ${segment.charAt(0).toUpperCase() + segment.slice(1)} Focus

---

**Subject:** ${subjectLines[0]}

**Preview:** ${generatePreviewText(0, topicEcho)}

---

${hooks[0]}

${keyPointsNote ? keyPointsNote + '\n\n' : ''}${generateBodyContent(keyPoints, config, tone, args.key_points ? '' : type)}
${product ? `*Product note: [Add one sentence on how ${product} helps with this topic, only where it fits the story]*

` : ''}${generateCtaSection(ctaGoal)}

---

${previousTopics.length > 0 ? `
## Connection to Previous Content

Your recent topics: ${previousTopics.join('; ')}

**Thread this together:**
- Reference: "Last week we talked about ${lowerFirstIfCommon(previousTopics[0])}. This week, let's go deeper into ${lowerFirstIfCommon(topicEcho)}..."
- Callback: "Remember our issue on ${lowerFirstIfCommon(previousTopics[0])}? Here is how it connects to ${lowerFirstIfCommon(topicEcho)}..."
- Series (only if these issues form a series): "This continues our run on ${lowerFirstIfCommon(topicEcho)}..."
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

// Run 19 (D80, problem 2): a topic of up to 90 characters is used whole. A longer one is cut at a word boundary (never to three words),
// and never ends on a joining word.
// Over 90 characters, a topic is too long for a subject line and is never cut in the middle of a phrase: the subject lines show a
// placeholder for a short label, and the full topic stays in the hooks and the heading.
const TOPIC_FULL = 90;
const LABEL = '[Add a short label for this topic]';
function shortenTopic(topic: string): string {
  const flat = topic.trim().replace(/ +/g, ' ');
  return flat.length <= TOPIC_FULL ? flat : LABEL;
}

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
// or a question all read correctly. None puts it before "is" or after "Why" or "How to".
function generateSubjectLines(topic: string, type: string): string[] {
  const short = shortenTopic(topic);
  // Text only (run 10, R10-28): the topic placed after leading words follows the first-word rule
  // (names and acronyms keep their capitals). Product updates keep it as typed.
  const mid = lowerFirstIfCommon(short);
  const head = cap(mid);

  const templates: Record<string, string[]> = {
    educational: [
      `The truth about ${mid} (nobody talks about this)`,
      `${head}: what to do first, and what to skip`,
      `${head}: 5 mistakes even experts make`,
      `${head}: your complete guide`
    ],
    product_update: [
      isClause(topic) ? `New: ${short} [only if customers asked for it]` : `New: The ${short} feature you asked for [only if customers asked for it]`,
      `You asked, we built: ${short} [only if customers asked for it]`,
      `Just shipped: ${short} (+ what's next)`,
      `Product update: ${short}`
    ],
    industry_news: [
      `This week in ${mid}: what you need to know`,
      `${head}: what is changing, and what it means`,
      `${head}: 3 stories that matter`,
      `The update on ${mid} that everyone is talking about [only if true]`
    ],
    thought_leadership: [
      `${head}: what most people get wrong`,
      `Unpopular opinion on ${mid}`,
      `${head}: my prediction`,
      `${head}: what I learned the hard way [only if true]`
    ],
    curated_links: [
      `${head}: best reads this week`,
      `5 must-read links on ${mid}`,
      `Your reading list on ${mid}`,
      `This week's best content on ${mid}`
    ]
  };

  return templates[type] || templates.educational;
}

// Preview text: one line per option, chosen by the option's place (the same input always gives the same answer).
function generatePreviewText(index: number, topic: string): string {
  const t = topic.trim().length <= TOPIC_FULL ? lowerFirstIfCommon(topic) : 'this topic';
  const previews = [
    `Plus: [Add the one thing most people get wrong about ${t}]`,
    `Inside: [Add the tips readers can use today]`,
    `Spoiler: [Add the answer, only if it is not what readers expect]`,
    `Plus: [Add one thing you learned about ${t}]`
  ];
  return previews[index % previews.length];
}

// Run 12 (R12-20): one writing prompt per section instead of the same body under every heading. The prompts follow the
// suggested key points of each newsletter type, in order; key points the user gave get one general prompt each.
const SECTION_PROMPTS: Record<string, string[]> = {
  educational: [
    '[Add one fact from your market that shows why this matters now]',
    '[Add the two or three mistakes you see most]',
    '[Add your steps, in order]',
    '[Add a real example: a customer or your own]',
    '[Add one line to remember, and the next step]'
  ],
  product_update: [
    '[Add what changed, in one or two sentences]',
    '[Add the benefit for the reader]',
    '[Add the first steps to try it]',
    '[Add two or three tips from your team]',
    '[Only if you can share it: what comes next]'
  ],
  industry_news: [
    '[Add the news, with its source]',
    '[Add what it means for the reader]',
    '[Add a view from someone you can name, with their permission]',
    '[Add the signals to watch]',
    '[Add one or two actions to take]'
  ],
  thought_leadership: [
    '[Add your view, in one or two sentences]',
    '[Add your evidence: a story, a number or a source]',
    '[Add what you have seen them do differently]',
    '[Add your framework, in a few lines]',
    '[Add one to three actions for this week]'
  ],
  curated_links: [
    '[Add the title, link and one line on why it is worth reading]',
    '[Add the title, link and one line on why it is worth watching]',
    '[Add the name, link and what it does]',
    '[Add the take, its source and your view]',
    '[Add your note]'
  ]
};

// How deep to write for the chosen audience: printed once above the sections.
const DEPTH_NOTE: Record<string, string> = {
  'high-level': 'Keep each section to its business impact: outcomes over activities.',
  'tactical': 'Give each section one step the reader can take this week.',
  'deep': 'Give each section the mechanism and the details: the settings, the steps and the tests.',
  'accessible': 'Keep each section simple: one idea, in plain words.',
  'introductory': 'Assume the reader is new to this: start from the basics.',
  'advanced': 'Assume the reader knows the basics: go straight to the advanced use case.'
};

function generateBodyContent(keyPoints: string[], config: { depth: string; length: string; focus: string }, tone: string, type: string): string {
  const prompts = type ? (SECTION_PROMPTS[type] || SECTION_PROMPTS.educational) : [];
  let content = `*Writing note: ${DEPTH_NOTE[config.depth] || DEPTH_NOTE.accessible}*

`;

  keyPoints.forEach((point, index) => {
    content += `### ${index + 1}. ${cap(point)}

${prompts[index] || '[Add two or three sentences on this point]'}

`;
  });

  return content;
}

// Run 19 (D80, problem 3): the call to action is the one the user gave, used as the heading and as the button. It is never
// replaced by a fixed offer (a demo, a guide) the user did not name.
function generateCtaSection(ctaGoal: string): string {
  const goalLower = ctaGoal.toLowerCase();
  const button = `[${cap(ctaGoal)} →]`;
  let helper = '[Add the link or the reply address that does this]';
  if (/\b(reply|feedback)\b/.test(goalLower)) helper = 'Hit reply and let me know.';
  else if (/\bshare\b/.test(goalLower)) helper = 'Forward this to a colleague who needs to see it.';
  else if (/\b(download|guide)\b/.test(goalLower)) helper = '[Add what the download adds to this issue]';
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
