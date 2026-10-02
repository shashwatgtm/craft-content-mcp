import { lowerFirstIfCommon, cap, SUGGESTION_FOOTER } from './utils.js';
import { splitItems, q, readContext, startWords, audienceLine, type Vertical, type BusinessModel } from './sector.ts';

type Ctx = { v: Vertical | null; model: BusinessModel | null; line: string };

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
  const topic = args.topic;
  const duration = args.duration || '60_min';
  const type = args.webinar_type;
  const audience = args.target_audience;
  // Run 12 (R12-20): a panel without named speakers lists a moderator and two panelists to fill in.
  // Run 19 (D80, problems 2 and 3): speakers are split on semicolons and line breaks first, so "Name, Title" stays whole, and every
  // speaker is printed as typed, never placed after "I'm".
  const speakerList = args.speakers
    ? (/[;\n]/.test(args.speakers) ? args.speakers.split(/[;\n]/).map((x) => x.trim()).filter(Boolean) : splitItems(args.speakers))
    : [];
  const speakers = speakerList.length ? speakerList
    : args.webinar_type === 'panel_discussion' ? ['[Moderator]', '[Panelist 1]', '[Panelist 2]'] : ['[Speaker name]'];
  const includePolls = args.include_polls ?? true;
  const productLevel = args.product_mention_level || 'subtle';
  const product = (args.your_product || '').trim();
  // Run 19 (D80, problems 4 and 8): the sector and the business model are read from every text the user gave.
  const ctx: Ctx = readContext(args.business_model, [topic, args.key_takeaways, product, args.speakers], [audience]);

  // DERIVE key takeaways from topic if not provided
  let takeaways: string[];
  let takeawaysNote = '';
  if (args.key_takeaways) {
    takeaways = splitItems(args.key_takeaways);
  } else {
    takeaways = generateTakeawaysFromTopic(topic, type, audience, ctx.v);
    takeawaysNote = '*(Suggested from the topic and type: replace with your own)*';
  }

  // Duration in minutes
  const durationMap: Record<string, number> = {
    '30_min': 30,
    '45_min': 45,
    '60_min': 60,
    '90_min': 90
  };
  const minutes = durationMap[duration] || 60;
  // 60 minutes is a default when no known duration was supplied: label it as an example
  const durationSupplied = !!args.duration && Object.prototype.hasOwnProperty.call(durationMap, args.duration);
  const durationLabel = durationSupplied ? '' : ' (Example figure: replace with your own)';

  // Generate type-specific structure
  const structure = getWebinarStructure(type, minutes);

  // Run 19 (D80, problem 3): a product the user gave but asked not to mention is named as not used, with the reason.
  const productNote = product
    ? (productLevel === 'none' ? `your_product (${product}) is not mentioned in the script because product_mention_level is none.` : `${product} is mentioned at the "${productLevel}" level, one sentence at a time, where the script marks it.`)
    : (productLevel === 'none' ? '' : 'your_product was not given, so the product mentions say "your product". Add your_product to name it.');

  let output = `# Webinar Script: ${topic}

## Webinar Details

| Setting | Value |
|---------|-------|
| **Topic** | ${topic} |
| **Duration** | ${minutes} minutes${durationLabel} |
| **Type** | ${type.replace(/_/g, ' ')} |
| **Audience** | ${audience} |
| **Speakers** | ${speakers.some((x) => x.includes(',')) ? speakers.join('; ') : speakers.join(', ')} |
| **Product Mentions** | ${productLevel}${args.product_mention_level ? '' : ' (default)'} |
${takeawaysNote ? `| **Note** | Key takeaways auto-suggested |` : ''}

${ctx.line}
${productNote ? `\n*${productNote}*\n` : ''}
---

## Key Takeaways for Audience
${takeawaysNote}

${takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}

---

## Run of Show

${generateRunOfShow(structure, minutes)}

---
${sectorNotes(ctx)}
## Full Script

`;

  // Generate script sections based on structure
  for (const section of structure) {
    output += generateScriptSection(section, topic, audience, takeaways, speakers, productLevel, includePolls, product, ctx);
  }

  // Add Q&A prep
  output += `
---

## Q&A Preparation

### Anticipated Questions

${generateAnticipatedQuestions(topic, takeaways, ctx)}

### Parking Lot Responses

For questions outside scope:
- "Great question! That deserves its own session. Let me note it and follow up via email."
- [Only if you have one: "We have a resource on that. I'll share the link in the follow-up email."]
- "That's a deep topic. Let's connect after the webinar to discuss your specific situation."

---

## Follow-Up Sequence

### Email 1: Same Day (Within 2 hours)

**Subject:** Recording and resources from today's webinar: ${topic}

Thanks for joining us for ${q(topic)}!

Here's what you requested:
- [Add the recording link]
- [Add the slides]
- [Add any resources mentioned]

${takeaways.length > 0 ? `**Quick recap:**
${takeaways.slice(0, 3).map((t, i) => `${i + 1}. ${t}`).join('\n')}` : ''}

Questions? Hit reply.

---

### Email 2: Day 3

**Subject:** Did you catch this from our webinar? ${topic}

A question from the session: [Add the most asked question]

Here's the quick answer: [Add a brief response]

[Add your call to action]

---

### Email 3: Day 7

**Subject:** Next steps on ${topic}

It's been a week since our webinar. By now you've probably watched the recording (or at least meant to) and thought about what we discussed, and you probably have a few questions.

[Add the specific next step and how to take it]

---

## Pre-Webinar Checklist

### Tech Setup (30 min before)
- [ ] Test audio/video quality
- [ ] Check screen sharing works
- [ ] Verify recording is enabled
- [ ] Test poll functionality
- [ ] Have backup slides accessible
- [ ] Close unnecessary applications

### Content Ready
- [ ] Slides loaded and tested
- [ ] All links/demos prepared
- [ ] Q&A questions pre-seeded
- [ ] Co-host/moderator briefed
- [ ] Timer visible

### Environment
- [ ] Quiet space confirmed
- [ ] Good lighting
- [ ] Professional background
- [ ] Water nearby
- [ ] Phone on silent

---

${SUGGESTION_FOOTER}
`;

  return output;
}

// The sector block printed once above the script: who the audience usually is, what it measures, the proof that lands.
function sectorNotes(ctx: Ctx): string {
  const v = ctx.v;
  if (!v) return `\n## Sector Notes\n\nNo sector could be read from what you typed, so the content blocks use general prompts. Name the audience's industry or your product category to get talking points in the sector's own language.\n\n---\n`;
  return `
## Sector Notes: ${cap(v.name)}

- ${audienceLine(v)}
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
      { name: 'Discussion Question 1', duration: 10, purpose: 'Explore angle 1' },
      { name: 'Discussion Question 2', duration: 10, purpose: 'Explore angle 2' },
      { name: 'Discussion Question 3', duration: 10, purpose: 'Explore angle 3' },
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
    case 'saas': return '[Add how a buyer starts: your plans, and a trial only if you offer one]';
    case 'services': return '[Add how a buyer starts: the scoping call, the statement of work and the transition plan]';
    case 'connectivity': return '[Add how a buyer starts: the site survey, the pilot sites and the rate card]';
    case 'investment': return '[Add how an allocator starts: the mandate discussion, the pilot allocation and the reporting]';
    case 'transactions': return '[Add how a buyer starts: the integration steps and the first live transactions]';
    case 'marketplace': return '[Add how a participant starts: sign-up checks and the first listing]';
    case 'hardware_software': return '[Add how a buyer starts: the site visit, the pilot units and the rollout plan]';
    default: return '[Add how a buyer starts and the first step after the session]';
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

function generateScriptSection(
  section: { name: string; duration: number; purpose: string },
  topic: string,
  audience: string,
  takeaways: string[],
  speakers: string[],
  productLevel: string,
  includePolls: boolean,
  product: string,
  ctx: Ctx
): string {
  const productLine = (what: string) => productLevel === 'none' ? '' : (product ? `**[Mention ${product}: one sentence on ${what}]**` : `**[Mention your product here: one sentence on ${what}]**`);
  const v = ctx.v;
  const scripts: Record<string, string> = {
    'Welcome & Housekeeping': `
### ${section.name} (${section.duration} min)

**[ON SCREEN: Title slide with webinar name]**

**SPEAKER:** 
"Good [morning/afternoon] everyone, and welcome to ${q(topic)}. I'm thrilled to have you here.

Before we dive in, a few quick housekeeping items:
- [Only if true: We're recording today's session and will send you the link within 24 hours]
- Your audio is muted, but we want this to be interactive
- Use the chat for questions anytime: we'll address them throughout and have dedicated Q&A time
${includePolls ? '- You\'ll see some polls pop up: please participate, it makes this better for everyone\n' : ''}
Let's get started!"

`,
    'Speaker Introduction': `
### ${section.name} (${section.duration} min)

**[ON SCREEN: Speaker bio slide]**

**Introduce each speaker (as you listed them):**
${speakers.map((sp, i) => `${i + 1}. ${sp}: [Add two or three sentences of background that make this person credible on this topic]`).join('\n')}

**SPEAKER:**
"Today's session is about ${q(topic)}. I'm excited to give you takeaways you can use immediately. [Only if true: what you have learned about it, in one sentence]"

`,
    'Agenda & Learning Objectives': `
### ${section.name} (${section.duration} min)

**[ON SCREEN: Agenda slide]**

**SPEAKER:**
"Here's what we'll cover today:

${takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}

By the end of this session, you'll walk away with [Add the outcome attendees leave with; audience: ${audience}].

Sound good? Drop a '1' in the chat if you're ready to go."

`,
    'Context Setting': `
### ${section.name} (${section.duration} min)

**[ON SCREEN: Context/problem slide]**

**SPEAKER:**
"Our topic today is ${q(topic)}. Before we get tactical, here's why it matters right now.

[Add the pain point this audience feels: ${audience}]

The good news? There's a better way. That's what we're here to explore.

${includePolls ? `**[LAUNCH POLL on ${q(topic)}: "Which of these is closest to your situation today?"]**
Poll options:
${pollOptions(ctx).map((o) => `- ${o}`).join('\n')}
` : ''}
Let's see what you're dealing with..."

`,
    'Main Content Block 1': `
### ${section.name} (${section.duration} min)

**[ON SCREEN: Key concept slide]**

**SPEAKER:**
"Let's start with ${takeaways[0] ? `the first takeaway: ${takeaways[0]}` : 'the foundation'}.

[Add the core teaching point with specific examples]

Here's what this looks like in practice:
- [Add example 1]
- [Add example 2]
- [Add example 3]
${v ? `\n[Sector point to weave in: how ${v.name} buyers measure this today: ${v.metrics.slice(0, 3).join(', ')}]\n` : ''}
${productLine('how it helps with this takeaway')}

Any questions on this before we move on? Drop them in chat."

`,
    'Q&A': `
### ${section.name} (${section.duration} min)

**[ON SCREEN: Q&A slide]**

**SPEAKER:**
"Great, now let's open it up for questions. I see some great ones in chat.

[Read and answer questions]

For questions we don't get to, I'll include answers in the follow-up email.

Keep them coming while I address these..."

`,
    'Close & CTA': `
### ${section.name} (${section.duration} min)

**[ON SCREEN: CTA slide]**

**SPEAKER:**
"We covered a lot today. Quick recap:

${takeaways.slice(0, 3).map((t, i) => `${i + 1}. ${t}`).join('\n')}

**What's your next step?**

[Add the one next step for the audience]

Thanks so much for joining. [Only if true: You'll get the recording, slides, and resources within 24 hours.]

Have a great rest of your [day/week]!"

**[END WEBINAR]**

`
  };

  // Run 12 (R12-20): every other section gets a short speaker prompt written for its type, never an internal label
  // such as "[Content for Set stage]".
  if (scripts[section.name]) return scripts[section.name];
  return `
### ${section.name} (${section.duration} min)

**[ON SCREEN: Relevant slide]**

**SPEAKER PROMPT:** ${speakerPrompt(section.name, topic, audience, takeaways, speakers, product, productLevel, ctx)}

`;
}

function generateAnticipatedQuestions(topic: string, takeaways: string[], ctx: Ctx): string {
  const v = ctx.v;
  const sectorQs = v ? v.objections.slice(0, 2) : [];
  const first = takeaways[0];
  return `
1. **"How do we get started with this?"**
   - Response: Start with [Add the first step]. Focus on [Add the key principle].

${sectorQs.length > 0 ? sectorQs.map((o, i) => `${i + 2}. **"${o.objection}"**
   - Answer pattern: ${o.response}
`).join('\n') : `2. **"What if [Add a common objection or concern]?"**
   - Response: Great question. The way we address this is [Add your solution].
`}
${sectorQs.length + 2}. **"${first ? `Can you share more examples of this: ${first}?` : 'Can you share more examples?'}"**
   - Response: Absolutely. [Add a specific example with details].

${sectorQs.length + 3}. **"How does this compare to [Add an alternative approach]?"**
   - Response: The key difference is [Add your differentiation point].

${sectorQs.length + 4}. **"What resources do you recommend?"**
   - Response: I'll include my top 3 in the follow-up email, but start with [Add one resource].
`;
}

// Generate key takeaways from topic when not provided. Run 19: the topic follows a colon, where a phrase, a clause or a question
// all read correctly; the measures come from the sector when it is known.
function generateTakeawaysFromTopic(topic: string, type: string, audience: string, v: Vertical | null): string[] {
  const t = lowerFirstIfCommon(topic);
  const measures = v ? `Know which measures to track: ${v.metrics.slice(0, 3).join(', ')}` : 'Know what metrics and outcomes to track';
  const typeSpecificTakeaways: Record<string, string[]> = {
    educational: [
      `Understand the fundamentals: ${t}`,
      `Learn the most common mistakes to avoid`,
      `Get a practical framework you can apply immediately`,
      measures,
      `Have clear next steps to implement`
    ],
    product_demo: [
      `See how it works in practice: ${t}`,
      `Understand key features and benefits`,
      `Learn how to get started quickly`,
      `Know which use cases are best fits`,
      `Get answers to common questions`
    ],
    panel_discussion: [
      `Hear diverse perspectives: ${t}`,
      `Learn from practitioners who've been there`,
      `Understand different approaches that work`,
      `Get insights you won't find in books or blogs`,
      `Know what questions to ask yourself`
    ],
    customer_story: [
      `Understand the real challenge they faced`,
      `Learn how they approached the solution`,
      v ? `See specific results and timeline, measured in terms such as ${v.metrics[0]}` : `See specific results and timeline`,
      `Know what they'd do differently`,
      `Get actionable lessons for your own situation`
    ],
    workshop: [
      `Complete hands-on exercises during the session`,
      `Build something you can use immediately`,
      `Learn by doing, not just listening`,
      `Get feedback on your work`,
      `Leave with tangible deliverables`
    ],
    ama: [
      `Get direct answers to your specific questions`,
      `Hear what others are asking: ${t}`,
      `Gain insider perspective and honest opinions`,
      `Learn from rapid-fire exchanges`,
      `Know what to focus on next`
    ]
  };

  const takeaways = typeSpecificTakeaways[type] || typeSpecificTakeaways.educational;

  // Adjust based on audience level
  if (audience.toLowerCase().includes('beginner') || audience.toLowerCase().includes('new')) {
    return takeaways.map(t => t.replace('framework', 'simple steps').replace('advanced', 'foundational'));
  }

  if (audience.toLowerCase().includes('advanced') || audience.toLowerCase().includes('senior')) {
    return takeaways.map(t => t.replace('fundamentals', 'advanced strategies').replace('basics', 'nuances'));
  }

  return takeaways;
}

// Run 12 (R12-20): what the speaker does in each section that has no written script.
// Run 19: speaker names are used as typed (never after "I'm"), the sector's measure and objection fill the content blocks, and
// the product line follows product_mention_level.
function speakerPrompt(name: string, topic: string, audience: string, takeaways: string[], speakers: string[], product: string, productLevel: string, ctx: Ctx): string {
  const t = lowerFirstIfCommon(topic);
  const v = ctx.v;
  const w = startWords(ctx.model);
  const nth = (i: number, word: string) => takeaways[i] ? `Teach the ${word} takeaway: ${takeaways[i]}.` : `Teach the ${word} point of the session: [Add the point].`;
  const ask = (i: number) => `Ask the panel: [Add your question ${i + 1}${takeaways[i] ? `, linked to "${takeaways[i]}"` : ''}]. Give each panelist about two minutes, then ask one follow-up.`;
  const aud = q(audience);
  const productStep = (what: string) => productLevel === 'none' ? '' : ` ${product ? `Mention ${product} in one sentence: ${what}.` : `Mention your product in one sentence: ${what}.`}`;
  const prompts: Record<string, string> = {
    'Main Content Block 2': `${nth(1, 'second')} Give one example from your own work.${v ? ` Show how this audience measures it: ${v.metrics[3] || v.metrics[1]}.` : ''} Then check the chat for questions.`,
    'Main Content Block 3': `${nth(2, 'third')} ${v ? `Answer the objection this audience raises most: "${v.objections[0].objection}". ${v.objections[0].response}` : 'Give one example from your own work'} Then check the chat for questions.`,
    'Summary & Key Takeaways': 'Recap each takeaway in one sentence, then name the one step to take first.',
    'Welcome & Agenda': `Welcome everyone to ${q(topic)}, say that the session is recorded (only if it is), and show the agenda.`,
    'Problem Context': `Describe the problem this audience faces: ${aud}. Topic: ${q(topic)}. [Add one example you have seen]`,
    'Product Overview': `Show the product on one screen and say what it does for this audience in one sentence: [Add your sentence].${productStep('what it does')}`,
    'Feature Demo 1': 'Demo the core feature: start from the problem it solves, show it working end to end, then pause for questions.',
    'Feature Demo 2': 'Demo the feature that sets you apart: [Add the feature]. Show the result, not the settings.',
    'Feature Demo 3': 'Demo one advanced use: [Add the feature]. Keep it short and say who it is for.',
    'Use Case Examples': 'Walk through [Add one or two customer examples you can name, with their permission].',
    'Pricing & Getting Started': `Explain how to start: ${startingStep(ctx.model)} and the first step after the session. Plan for the ${w.rollout} and say how long it usually takes to reach ${w.value}, only with a figure you can stand behind.`,
    'Special Offer & Close': '[Only if you have one: the offer and when it ends]. Thank everyone and give the one next step.',
    'Welcome & Introductions': `Welcome everyone to ${q(topic)}, then ask ${speakers.length > 1 ? speakers.slice(1).join(' and ') : 'each panelist'} to introduce themselves in two sentences.`,
    'Topic Introduction': `Frame the discussion: why ${q(topic)} matters to this audience now (${aud}), in two or three sentences.`,
    'Discussion Question 1': ask(0),
    'Discussion Question 2': ask(1),
    'Discussion Question 3': ask(2),
    'Rapid Fire Round': 'Ask every panelist the same short question and ask for a one-sentence answer: [Add your question].',
    'Audience Q&A': 'Take questions from chat. Read each one aloud and hand it to the panelist best placed to answer.',
    'Closing Thoughts': 'Ask each panelist for one thing the audience should do next.',
    'Close': 'Thank the speakers and the audience, say when the recording will arrive (only if there is one), and give the one next step.',
    'Welcome': `Welcome everyone to ${q(topic)} and introduce the customer guest: ${speakers[0]}.`,
    'Customer Introduction': 'Ask the customer to introduce their company and their role in two or three sentences.',
    'The Challenge': 'Ask: "What was happening before?" Let the customer describe the problem in their own words.',
    'Solution Discovery': 'Ask: "How did you find us, and why did you choose us?"',
    'Implementation Journey': `Ask: "What was the ${w.rollout} like?" Ask for one thing that went well and one that was hard.`,
    'Results & Impact': `Ask: "What changed, and how do you measure it?"${v ? ` Listen for measures such as ${v.metrics.slice(0, 3).join(', ')}.` : ''} Use only the numbers the customer agrees to share.`,
    'Live Demo/Walkthrough': 'Ask the customer to show how their team uses it day to day.',
    'Lessons Learned': 'Ask: "What would you tell a team starting today?"',
    'Welcome & Setup': `Welcome everyone to ${q(topic)} and check that everyone has [Add the tools or files needed].`,
    'Learning Objectives': 'Say what everyone will build by the end: [Add the deliverable].',
    'Concept Introduction': 'Explain the idea behind the first exercise in plain words, with one example.',
    'Exercise 1': 'Give the instructions for the first exercise: [Add the task, the time box and what done looks like]. Stay in chat to help.',
    'Debrief 1': 'Ask two or three people to share what they made. Point out one thing that worked.',
    'Exercise 2': 'Give the instructions for the second exercise, which builds on the first: [Add the task and the time box].',
    'Debrief 2': 'Ask two or three people to share what they made. Point out one thing that worked.',
    'Wrap-up & Resources': 'Recap what everyone built and share [Add the templates or resources to keep].',
    'Welcome & Speaker Intro': `Welcome everyone to ${q(topic)}, introduce ${speakers[0]} in two sentences, and explain how to ask questions.`,
    'Brief Topic Context': `Frame the session: why ${q(topic)} matters to this audience now (${aud}), in two or three sentences.`,
    'Q&A Session': 'Take the first question from chat. Repeat it aloud, answer in under two minutes, invite a follow-up.',
    'Rapid Fire': 'Answer short questions from chat in one or two sentences each.'
  };
  return prompts[name] || `[Add what to say in this section about ${t}]`;
}
