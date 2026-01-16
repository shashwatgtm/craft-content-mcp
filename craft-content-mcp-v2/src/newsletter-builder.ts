import { parseListItems, generateHook } from './utils.js';

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
    keyPointsNote = '*(Auto-generated - customize as needed)*';
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

  let output = `# 📧 Newsletter Builder: ${topic}

## Newsletter Configuration

| Setting | Value |
|---------|-------|
| **Topic** | ${topic} |
| **Segment** | ${segment} |
| **Type** | ${type.replace(/_/g, ' ')} |
| **Tone** | ${tone} |
| **CTA Goal** | ${ctaGoal} |

---

## 📬 Subject Lines (A/B Test These)

### Option A: Curiosity-Driven
**${subjectLines[0]}**
- Preview text: ${generatePreviewText(subjectLines[0], topic)}

### Option B: Benefit-Focused  
**${subjectLines[1]}**
- Preview text: ${generatePreviewText(subjectLines[1], topic)}

### Option C: Number/List Style
**${subjectLines[2]}**
- Preview text: ${generatePreviewText(subjectLines[2], topic)}

### Option D: Personal/Direct
**${subjectLines[3]}**
- Preview text: ${generatePreviewText(subjectLines[3], topic)}

---

## 🎣 Opening Hooks (Pick One)

### Hook 1: Question
> ${hooks[0]}

### Hook 2: Statistic
> ${hooks[1]}

### Hook 3: Story
> ${hooks[2]}

### Hook 4: Bold Statement
> ${hooks[3]}

---

## 📝 Newsletter Content

### Version: ${segment.charAt(0).toUpperCase() + segment.slice(1)} Focus

---

**Subject:** ${subjectLines[0]}

**Preview:** ${generatePreviewText(subjectLines[0], topic)}

---

${hooks[0]}

${generateBodyContent(keyPoints, config, tone, type)}

${generateCtaSection(ctaGoal, segment)}

---

${previousTopics.length > 0 ? `
## 🔗 Connection to Previous Content

Your recent topics: ${previousTopics.join(', ')}

**Thread this together:**
- Reference: "Last week we talked about ${previousTopics[0]}. This week, let's go deeper into ${topic}..."
- Callback: "Remember the ${previousTopics[0]} framework? Here's how it applies to ${topic}..."
- Series: "This is Part 2 of our ${topic} series..."

---` : ''}

## 📊 Content Structure Recommendation

Based on ${type.replace(/_/g, ' ')} type and ${segment} audience:

${getStructureRecommendation(type, segment)}

---

## ✅ Pre-Send Checklist

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

## 📈 Optimization Tips for ${segment}

${getSegmentTips(segment)}

---

## 🕐 Best Send Times for ${segment}

${getSendTimesForSegment(segment)}

`;

  return output;
}

function generateSubjectLines(topic: string, type: string, segment: string): string[] {
  const topicWords = topic.split(' ').slice(0, 3).join(' ');
  
  const templates = {
    educational: [
      `The truth about ${topicWords} (nobody talks about this)`,
      `How to master ${topicWords} in 2025`,
      `5 ${topicWords} mistakes even experts make`,
      `${topicWords}: Your complete guide`
    ],
    product_update: [
      `New: The ${topicWords} feature you asked for`,
      `You asked, we built: ${topicWords}`,
      `Just shipped: ${topicWords} (+ what's next)`,
      `[Product Update] ${topicWords} is here`
    ],
    industry_news: [
      `This week in ${topicWords}: What you need to know`,
      `Breaking: ${topicWords} is changing (here's how)`,
      `${topicWords} news: 3 stories that matter`,
      `The ${topicWords} update everyone's talking about`
    ],
    thought_leadership: [
      `Why ${topicWords} is broken (and how to fix it)`,
      `Unpopular opinion: ${topicWords}`,
      `The future of ${topicWords} (my prediction)`,
      `What I learned about ${topicWords} the hard way`
    ],
    curated_links: [
      `${topicWords}: Best reads this week`,
      `5 must-read ${topicWords} articles`,
      `Your ${topicWords} reading list`,
      `This week's best ${topicWords} content`
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
    `This changed how I approach ${topic.split(' ')[0]}...`,
    `Read time: 4 minutes`
  ];
  return previews[Math.floor(Math.random() * previews.length)];
}

function generateBodyContent(keyPoints: string[], config: { depth: string; length: string; focus: string }, tone: string, type: string): string {
  let content = '';
  
  keyPoints.forEach((point, index) => {
    content += `### ${index + 1}. ${point}

${generatePointContent(point, config.depth, tone)}

`;
  });
  
  return content;
}

function generatePointContent(point: string, depth: string, tone: string): string {
  const depthContent: Record<string, string> = {
    'high-level': `This matters because it directly impacts your bottom line. The key insight: focus on outcomes over activities.`,
    'tactical': `Here's how to apply this:
1. Start by auditing your current approach
2. Identify the biggest gap
3. Implement one change this week`,
    'deep': `Let me break this down technically. The underlying principle involves [specific mechanism]. For implementation:
- Configuration: [specific settings]
- Integration: [specific steps]
- Validation: [specific tests]`,
    'accessible': `In simple terms: ${point.toLowerCase()} can transform how you work. Most people overcomplicate this—don't.`,
    'introductory': `If you're new to this, here's what you need to know: ${point.toLowerCase()} is the foundation everything else builds on.`,
    'advanced': `You already know the basics. The next level: apply this to [advanced use case] for 10x the impact.`
  };
  
  return depthContent[depth] || depthContent.accessible;
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

Everything covered here, plus bonus frameworks.`;
  }
  
  if (goalLower.includes('reply') || goalLower.includes('feedback')) {
    return `---

**What do you think?**

Hit reply and let me know—I read every response.`;
  }
  
  if (goalLower.includes('share')) {
    return `---

**Found this useful?**

Forward to a colleague who needs to see this.

[Share on LinkedIn →]`;
  }
  
  return `---

**${ctaGoal}**

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
- Depth is expected—don't oversimplify
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
    executives: '**Tuesday or Thursday, 7-8am** (before their day gets busy)',
    practitioners: '**Tuesday-Thursday, 10-11am** (mid-morning productive time)',
    technical: '**Tuesday-Wednesday, 2-3pm** (afternoon coding break)',
    general: '**Tuesday, 10am** (highest average open rates)',
    prospects: '**Tuesday or Thursday, 9-10am** (early but not too early)',
    customers: '**Wednesday, 10am** (mid-week, good engagement)'
  };
  
  return times[segment] || times.general;
}

// Generate key points from topic when not provided
function generateKeyPointsFromTopic(topic: string, type: string, segment: string): string[] {
  // Base points that apply to most topics
  const basePoints: Record<string, string[]> = {
    educational: [
      `Why ${topic} matters now`,
      `Common mistakes with ${topic}`,
      `Step-by-step approach to ${topic}`,
      `Real examples of ${topic} in action`,
      `Key takeaway and next steps`
    ],
    product_update: [
      `What's new with ${topic}`,
      `How this helps you`,
      `How to get started`,
      `Tips for best results`,
      `What's coming next`
    ],
    industry_news: [
      `Latest developments in ${topic}`,
      `Why this matters to you`,
      `Expert perspectives`,
      `What to watch for`,
      `How to prepare`
    ],
    thought_leadership: [
      `The contrarian view on ${topic}`,
      `Evidence that challenges conventional wisdom`,
      `What top performers do differently`,
      `Framework for thinking about ${topic}`,
      `Actions to take this week`
    ],
    curated_links: [
      `Best read on ${topic} this week`,
      `Must-watch video on ${topic}`,
      `Tool/resource for ${topic}`,
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
