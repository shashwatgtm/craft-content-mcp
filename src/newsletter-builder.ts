import { parseListItems, generateHook, lowerCommonWords, lowerFirstIfCommon, cap, SUGGESTION_FOOTER } from './utils.js';

export function generateNewsletter(args: {
  topic: string;
  cta_goal: string;
  key_points?: string;
  audience_segment?: string;
  newsletter_type?: string;
  tone?: string;
  previous_topics?: string;
}): string {
  const topic = args.topic;
  const segment = args.audience_segment || 'general';
  const type = args.newsletter_type || 'educational';
  const tone = args.tone || 'professional';
  const previousTopics = args.previous_topics ? parseListItems(args.previous_topics) : [];
  const ctaGoal = args.cta_goal;
  
  // DERIVE key points from topic if not provided
  let keyPoints: string[];
  let keyPointsNote = '';
  if (args.key_points) {
    keyPoints = parseListItems(args.key_points);
  } else {
    keyPoints = generateKeyPointsFromTopic(topic, type, segment);
    keyPointsNote = '*(Suggested from the topic: replace with your own)*';
  }

  // Generate multiple subject line options
  const subjectLines = generateSubjectLines(topic, type, segment);
  
  // Generate hooks
  const hooks = [
    generateHook(topic, 'question'),
    generateHook(topic, 'statistic'),
    generateHook(topic, 'story'),
    generateHook(topic, 'bold_statement')
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

  let output = `# Newsletter Builder: ${topic}

## Newsletter Configuration

| Setting | Value |
|---------|-------|
| **Topic** | ${topic} |
| **Segment** | ${segment} |
| **Type** | ${type.replace(/_/g, ' ')} |
| **Tone** | ${tone} |
| **CTA Goal** | ${ctaGoal} |

---

## Subject Lines (A/B Test These)

### Option A: Curiosity-Driven
**${subjectLines[0]}**${subjectLineLabel(type, 0)}
- Preview text: ${generatePreviewText(subjectLines[0], topic)}

### Option B: Benefit-Focused  
**${subjectLines[1]}**${subjectLineLabel(type, 1)}
- Preview text: ${generatePreviewText(subjectLines[1], topic)}

### Option C: Number/List Style
**${subjectLines[2]}**${subjectLineLabel(type, 2)}
- Preview text: ${generatePreviewText(subjectLines[2], topic)}

### Option D: Personal/Direct
**${subjectLines[3]}**${subjectLineLabel(type, 3)}
- Preview text: ${generatePreviewText(subjectLines[3], topic)}

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

**Preview:** ${generatePreviewText(subjectLines[0], topic)}

---

${hooks[0]}

${generateBodyContent(keyPoints, config, tone, args.key_points ? '' : type)}

${generateCtaSection(ctaGoal, segment)}

---

${previousTopics.length > 0 ? `
## Connection to Previous Content

Your recent topics: ${previousTopics.join(', ')}

**Thread this together:**
- Reference: "Last week we talked about ${lowerFirstIfCommon(previousTopics[0])}. This week, let's go deeper into ${lowerFirstIfCommon(topic)}..."
- Callback: "Remember the ${lowerFirstIfCommon(previousTopics[0])} framework? Here's how it applies to ${lowerFirstIfCommon(topic)}..."
- Series (only if these issues form a series): "This continues our ${lowerFirstIfCommon(topic)} series..."

---` : ''}

## Content Structure Recommendation

Based on ${type.replace(/_/g, ' ')} type and ${segment} audience:

${getStructureRecommendation(type, segment)}

---

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

## Best Send Times for ${segmentPhrase(segment)}

${getSendTimesForSegment(segment)}

---

${SUGGESTION_FOOTER}
`;

  return output;
}

// Words that cannot end a shortened topic: cutting "Onboarding checklists for SaaS teams"
// to its first 3 words gave "Onboarding checklists for", which broke every subject line.
const TRAILING_CONNECTORS = new Set(['a', 'an', 'the', 'and', 'or', 'for', 'of', 'to', 'in', 'on', 'at', 'by', 'with', 'from', 'about', 'into', 'vs', 'vs.', '&']);

function shortenTopic(topic: string): string {
  const words = topic.split(' ').slice(0, 3);
  while (words.length > 1 && TRAILING_CONNECTORS.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }
  return words.join(' ');
}

// Option indexes of the subject lines that open with an example count ("5 ... mistakes"), per newsletter type.
// Unknown types use the educational subject lines, as generateSubjectLines does.
const EXAMPLE_COUNT_SUBJECTS: Record<string, number[]> = {
  educational: [2],
  product_update: [],
  industry_news: [],
  thought_leadership: [],
  curated_links: [1]
};

function subjectLineLabel(type: string, index: number): string {
  const indexes = Object.prototype.hasOwnProperty.call(EXAMPLE_COUNT_SUBJECTS, type)
    ? EXAMPLE_COUNT_SUBJECTS[type]
    : EXAMPLE_COUNT_SUBJECTS.educational;
  return indexes.includes(index) ? ' (Example figure: replace with your own)' : '';
}

function generateSubjectLines(topic: string, type: string, segment: string): string[] {
  const topicWords = shortenTopic(topic);
  // Text only (run 10, R10-28): the topic placed after leading words follows the first-word rule
  // ("5 faster contract review mistakes"; names and acronyms keep their capitals). Product updates keep it as typed.
  const topicMid = lowerFirstIfCommon(topicWords);
  
  const templates = {
    educational: [
      `The truth about ${topicMid} (nobody talks about this)`,
      `How to master ${topicMid} in ${new Date().getFullYear()}`,
      `5 ${topicMid} mistakes even experts make`,
      `${cap(topicMid)}: Your complete guide`
    ],
    product_update: [
      `New: The ${topicWords} feature you asked for`,
      `You asked, we built: ${topicWords}`,
      `Just shipped: ${topicWords} (+ what's next)`,
      `[Product Update] ${topicWords} is here`
    ],
    industry_news: [
      `This week in ${topicMid}: What you need to know`,
      `Breaking: ${topicWords} is changing (here's how)`,
      `${topicWords} news: 3 stories that matter`,
      `The ${topicMid} update everyone's talking about`
    ],
    thought_leadership: [
      `Why ${topicMid} is broken (and how to fix it)`,
      `Unpopular opinion: ${topicWords}`,
      `The future of ${topicMid} (my prediction)`,
      `What I learned about ${topicMid} the hard way`
    ],
    curated_links: [
      `${topicWords}: Best reads this week`,
      `5 must-read ${topicMid} articles`,
      `Your ${topicMid} reading list`,
      `This week's best ${topicMid} content`
    ]
  };
  
  return templates[type as keyof typeof templates] || templates.educational;
}

function generatePreviewText(subject: string, topic: string): string {
  // Preview should complement, not repeat subject
  const previews = [
    `Plus: the one thing most people get wrong...`,
    `Inside: actionable tips you can use today`,
    `Spoiler: it's not what you think`,
    `Plus: [one thing you learned about ${lowerFirstIfCommon(topic)}]`,
    `Read time: 4 minutes`
  ];
  return previews[Math.floor(Math.random() * previews.length)];
}

// Run 12 (R12-20): one writing prompt per section instead of the same body under every heading. The prompts follow the
// suggested key points of each newsletter type, in order; key points the user gave get one general prompt each.
const SECTION_PROMPTS: Record<string, string[]> = {
  educational: [
    '[One fact from your market that shows why this matters now]',
    '[The two or three mistakes you see most]',
    '[Your steps, in order]',
    '[A real example: a customer or your own]',
    '[One line to remember, and the next step]'
  ],
  product_update: [
    '[What changed, in one or two sentences]',
    '[The benefit for the reader]',
    '[The first steps to try it]',
    '[Two or three tips from your team]',
    '[Only if you can share it: what comes next]'
  ],
  industry_news: [
    '[The news, with its source]',
    '[What it means for the reader]',
    '[A view from someone you can name, with their permission]',
    '[The signals to watch]',
    '[One or two actions to take]'
  ],
  thought_leadership: [
    '[Your view, in one or two sentences]',
    '[Your evidence: a story, a number or a source]',
    '[What you have seen them do differently]',
    '[Your framework, in a few lines]',
    '[One to three actions for this week]'
  ],
  curated_links: [
    '[Title, link and one line on why it is worth reading]',
    '[Title, link and one line on why it is worth watching]',
    '[Name, link and what it does]',
    '[The take, its source and your view]',
    '[Your note]'
  ]
};

// How deep to write for the chosen audience: printed once above the sections.
const DEPTH_NOTE: Record<string, string> = {
  'high-level': 'Keep each section to its business impact: outcomes over activities.',
  'tactical': 'Give each section one step the reader can take this week.',
  'deep': 'Give each section the mechanism and the details: [specific settings], [specific steps], [specific tests].',
  'accessible': 'Keep each section simple: one idea, in plain words.',
  'introductory': 'Assume the reader is new to this: start from the basics.',
  'advanced': 'Assume the reader knows the basics: go straight to [advanced use case].'
};

function generateBodyContent(keyPoints: string[], config: { depth: string; length: string; focus: string }, tone: string, type: string): string {
  const prompts = type ? (SECTION_PROMPTS[type] || SECTION_PROMPTS.educational) : [];
  let content = `*Writing note: ${DEPTH_NOTE[config.depth] || DEPTH_NOTE.accessible}*

`;

  keyPoints.forEach((point, index) => {
    content += `### ${index + 1}. ${point}

${prompts[index] || '[Your two or three sentences on this point]'}

`;
  });

  return content;
}

function generateCtaSection(ctaGoal: string, segment: string): string {
  const goalLower = ctaGoal.toLowerCase();
  
  if (goalLower.includes('demo') || goalLower.includes('call')) {
    return `---

**Ready to see this in action?**

[Book a 15-minute demo →]

No pressure, just answers.`;
  }
  
  if (goalLower.includes('download') || goalLower.includes('guide')) {
    return `---

**Want the complete playbook?**

[Download the free guide →]

[What the guide adds to this issue]`;
  }
  
  if (goalLower.includes('reply') || goalLower.includes('feedback')) {
    return `---

**What do you think?**

Hit reply and let me know.`;
  }
  
  if (goalLower.includes('share')) {
    return `---

**Found this useful?**

Forward to a colleague who needs to see this.

[Share on LinkedIn →]`;
  }
  
  return `---

**${cap(ctaGoal)}**

[Take action now →]`;
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
- Keep it under 300 words
- Lead with business impact
- Use bullet points for scanning
- Include executive summary at top
- ROI and metrics matter most`,
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

function getSendTimesForSegment(segment: string): string {
  const times: Record<string, string> = {
    executives: '**Tuesday or Thursday, 7-8am** (before their day gets busy) (Example figure: replace with your own)',
    practitioners: '**Tuesday-Thursday, 10-11am** (mid-morning productive time) (Example figure: replace with your own)',
    technical: '**Tuesday-Wednesday, 2-3pm** (afternoon coding break) (Example figure: replace with your own)',
    general: '**Tuesday, 10am** (highest average open rates) (Example figure: replace with your own)',
    prospects: '**Tuesday or Thursday, 9-10am** (early but not too early) (Example figure: replace with your own)',
    customers: '**Wednesday, 10am** (mid-week, good engagement) (Example figure: replace with your own)'
  };
  
  return times[segment] || times.general;
}

// Generate key points from topic when not provided
function generateKeyPointsFromTopic(topic: string, type: string, segment: string): string[] {
  // Text only (run 10, R10-28): "Why faster contract review matters now", not "Why Faster contract review ...".
  const t = lowerFirstIfCommon(topic);
  // Base points that apply to most topics
  const basePoints: Record<string, string[]> = {
    educational: [
      `Why ${t} matters now`,
      `Common mistakes with ${t}`,
      `Step-by-step approach to ${t}`,
      `Real examples of ${t} in action`,
      `Key takeaway and next steps`
    ],
    product_update: [
      `What's new with ${lowerFirstIfCommon(topic)}`,
      `How this helps you`,
      `How to get started`,
      `Tips for best results`,
      `What's coming next`
    ],
    industry_news: [
      `Latest developments in ${t}`,
      `Why this matters to you`,
      `Expert perspectives`,
      `What to watch for`,
      `How to prepare`
    ],
    thought_leadership: [
      `The contrarian view on ${t}`,
      `Evidence that challenges conventional wisdom`,
      `What top performers do differently`,
      `Framework for thinking about ${t}`,
      `Actions to take this week`
    ],
    curated_links: [
      `Best read on ${t} this week`,
      `Must-watch video on ${t}`,
      `Tool/resource for ${t}`,
      `Hot take worth considering`,
      `What we're thinking about`
    ]
  };

  // Adjust based on segment
  const points = basePoints[type] || basePoints.educational;
  
  // For executives, make more strategic
  if (segment === 'executives') {
    return points.map(p => p.replace('Step-by-step', 'Strategic').replace('How to', 'Why to'));
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
