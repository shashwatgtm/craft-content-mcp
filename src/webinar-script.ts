import { lowerFirstIfCommon, cap, SUGGESTION_FOOTER } from './utils.js';
import { q, readContext, startWords, audienceLine, isClause, type Vertical, type BusinessModel } from './sector.ts';
import { splitList, unpackTopic, fixNumbers, endSentence, capFirst, shortenClauses, proseJoin, roleOf, clipAtWord } from './draft.ts';

type Ctx = { v: Vertical | null; model: BusinessModel | null; line: string };

// Everything a section of the script needs, read once from the inputs.
interface W {
  topic: string; label: string; clause: boolean; problem: string; audience: string; role: string; field: string;
  takeaways: string[]; speakers: string[]; product: string; productLevel: string; includePolls: boolean; ctx: Ctx;
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
  const label = parts.short ? topic : parts.label;
  const clause = isClause(topic) || !parts.short || LABEL_CLAUSE.test(label);
  const audience = args.target_audience.trim();
  const { role, field } = roleOf(audience);
  const duration = args.duration || '60_min';
  const type = args.webinar_type;
  // Run 12 (R12-20): a panel without named speakers lists a moderator and two panelists to fill in.
  // Run 19 (D80, problems 2 and 3): speakers are split on semicolons and line breaks first, so "Name, Title" stays whole, and every
  // speaker is printed as typed, never placed after "I'm".
  const speakerList = args.speakers
    ? (/[;\n]/.test(args.speakers) ? args.speakers.split(/[;\n]/).map((x) => x.trim()).filter(Boolean) : splitList(args.speakers))
    : [];
  const speakers = speakerList.length ? speakerList
    : args.webinar_type === 'panel_discussion' ? ['Moderator (not named)', 'Panelist 1 (not named)', 'Panelist 2 (not named)'] : ['Speaker (not named)'];
  const includePolls = args.include_polls ?? true;
  const productLevel = args.product_mention_level || 'subtle';
  const given = (args.your_product || '').trim();
  const product = given || (productLevel === 'none' ? '' : parts.company);
  // Run 19 (D80, problems 4 and 8): the sector and the business model are read from every text the user gave.
  const ctx: Ctx = readContext(args.business_model, { seller: [given || parts.company, topic], context: [args.key_takeaways, args.speakers], buyer: [audience] });

  // DERIVE key takeaways from topic if not provided
  let takeaways: string[];
  let takeawaysNote = '';
  if (args.key_takeaways) {
    takeaways = splitList(args.key_takeaways);
  } else {
    takeaways = generateTakeawaysFromTopic(label, type, audience, ctx.v);
    takeawaysNote = '*(Suggested from the topic and type: replace with your own)*';
  }
  const w: W = { topic, label, clause, problem: parts.problem || '', audience, role, field, takeaways, speakers, product, productLevel, includePolls, ctx };

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
  const productNote = given
    ? (productLevel === 'none' ? `your_product (${given}) is not mentioned in the script because product_mention_level is none.` : `${given} is mentioned at the "${productLevel}" level, one sentence at a time, where the script marks it.`)
    : product ? `your_product was not given; ${product} is read from the topic and mentioned at the "${productLevel}" level.`
    : (productLevel === 'none' ? '' : 'your_product was not given and the topic names no product, so the product mentions say "your product". Add your_product to name it.');

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
${productNote ? `\n*${productNote}*\n` : ''}${parts.short ? '' : `\n*The topic is long, so the script calls it ${q(label)} after this table.*\n`}
---

## Key Takeaways for Audience
${takeawaysNote}

${takeaways.map((t, i) => `${i + 1}. ${endSentence(capFirst(t))}`).join('\n')}

---

## Run of Show

${generateRunOfShow(structure, minutes)}

---
${sectorNotes(ctx, w)}
## Full Script

`;

  // Generate script sections based on structure
  let block = 0;
  const blocks = structure.filter((s) => /^Main Content Block/.test(s.name)).length;
  for (const section of structure) {
    const isBlock = /^Main Content Block/.test(section.name);
    output += generateScriptSection(section, w, isBlock ? block++ : 0, blocks);
  }

  // Add Q&A prep
  output += `
---

## Q&A Preparation

### Anticipated Questions

${generateAnticipatedQuestions(w)}

### Parking Lot Responses

For questions outside scope:
- "Great question! That deserves its own session. Let me note it and follow up via email."
- If you have a resource on it: "We have a resource on that. I'll share the link in the follow-up email."
- "That's a deep topic. Let's connect after the webinar to discuss your specific situation."

---

## Follow-Up Sequence

### Email 1: Same Day (Within 2 hours)

**Subject:** Recording and resources from today's webinar: ${clipAtWord(label, 90)}

Thanks for joining us for ${q(clipAtWord(label, 120))}!

Here's what you requested:
- The recording link (add it after the session)
- The slides
- Any resources mentioned during the session

${takeaways.length > 0 ? `**Quick recap:**
${takeaways.slice(0, 3).map((t, i) => `${i + 1}. ${endSentence(capFirst(t))}`).join('\n')}` : ''}

Questions? Hit reply.

---

### Email 2: Day 3

**Subject:** Did you catch this from our webinar? ${clipAtWord(label, 80)}

A question from the session: the one most asked in the chat (add it after the session).

${ctx.v ? `The question to expect from ${role || 'this audience'}: "${ctx.v.objections[0].objection}". The answer pattern: ${ctx.v.objections[0].response}` : 'Give the quick answer to the most asked question here.'}

Close with the one next step you want attendees to take.

---

### Email 3: Day 7

**Subject:** Next steps on ${clipAtWord(label, 90)}

It's been a week since our webinar. By now you've probably watched the recording (or at least meant to) and thought about what we discussed, and you probably have a few questions.

${ctx.v ? `The usual next step in ${ctx.v.name}: ${lowerFirst(ctx.v.salesMotion)}` : 'Name the specific next step and how to take it.'}

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

const LABEL_CLAUSE = /\b(?:is|are|was|were|run|runs|combine|combines|means|rely|relies|chain|chains|sits|happens|hand|hands|can|will|must|should|have|has|do|does|break|breaks|fragments|drift|drifts)\b/i;
const lowerFirst = (s: string) => (/[A-Z0-9]/.test(s.slice(1, 3)) ? s : s.charAt(0).toLowerCase() + s.slice(1));

// The sector block printed once above the script: who the audience usually is, what it measures, the proof that lands.
function sectorNotes(ctx: Ctx, w: W): string {
  const v = ctx.v;
  if (!v) return `\n## Sector Notes\n\nNo sector could be read from what you typed, so the content blocks use general prompts. Name the audience's industry or your product category to get talking points in the sector's own language.\n\n---\n`;
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
  const per = Math.ceil(takeaways.length / Math.max(1, blocks));
  return takeaways.slice(block * per, block * per + per);
}

// How the session is named aloud: a topic that is a clause is introduced as the subject of today's session.
function named(w: W): string {
  return w.clause ? `today's session on ${q(clipAtWord(w.label, 120))}` : q(clipAtWord(w.label, 120));
}

function productLine(w: W, what: string): string {
  if (w.productLevel === 'none') return '';
  return `\n*Product line (${w.productLevel}): one sentence on how ${w.product || 'your product'} helps with ${what}. Use only what you can show.*\n`;
}

// The pain point of this audience: the problem the topic names, the role it falls on, and what the sector's buyers measure.
function painPoint(w: W): string {
  const v = w.ctx.v;
  const who = w.role ? `a ${w.role}${w.field ? ` in ${w.field}` : ''}` : 'this audience';
  const problem = w.problem ? `The problem this session takes on: ${w.problem}.` : `The session is about ${w.clause ? '' : ''}${q(w.label)}.`;
  const measures = v ? ` For ${who} the usual yardsticks are ${proseJoin(v.metrics.slice(0, 3))}.` : '';
  return `${problem}${measures}`;
}

function generateScriptSection(section: { name: string; duration: number; purpose: string }, w: W, blockIndex: number, blocks: number): string {
  const v = w.ctx.v;
  const label = clipAtWord(w.label, 120);
  const mine = blockTakeaways(w.takeaways, blockIndex, blocks);
  const opening = (name: string) => `\n### ${name} (${section.duration} min)\n`;
  const scripts: Record<string, string> = {
    'Welcome & Housekeeping': `${opening(section.name)}
**ON SCREEN: Title slide with the webinar name**

**SPEAKER:**
"Good morning, afternoon or evening, everyone, and welcome to ${named(w)}. I'm thrilled to have you here.

Before we dive in, a few quick housekeeping items:
- If you are recording, say: "We're recording today's session and will send you the link within 24 hours"
- Your audio is muted, but we want this to be interactive
- Use the chat for questions anytime: we'll address them throughout and have dedicated Q&A time
${w.includePolls ? '- You\'ll see some polls pop up: please participate, it makes this better for everyone\n' : ''}
Let's get started!"

`,
    'Speaker Introduction': `${opening(section.name)}
**ON SCREEN: Speaker bio slide**

**Introduce each speaker (as you listed them):**
${w.speakers.map((sp, i) => `${i + 1}. ${sp}${/not named/.test(sp) ? ': give the name, then two or three sentences of background that make this person credible on this topic' : ': two or three sentences of background that make this person credible on this topic'}`).join('\n')}

**SPEAKER:**
"Today's session is about ${q(label)}. I'm excited to give you takeaways you can use immediately."

`,
    'Agenda & Learning Objectives': `${opening(section.name)}
**ON SCREEN: Agenda slide**

**SPEAKER:**
"Here's what we'll cover today:

${w.takeaways.map((t, i) => `${i + 1}. ${endSentence(capFirst(t))}`).join('\n')}

By the end of this session, ${w.role ? `a ${w.role}` : 'you'} should be able to ${v ? `say where they stand on ${v.metrics[0]} and what to change first` : 'name the first change to make'}.

Sound good? Type a 1 in the chat if you're ready to go."

`,
    'Context Setting': `${opening(section.name)}
**ON SCREEN: Context/problem slide**

**SPEAKER:**
"Our topic today is ${q(label)}. Before we get tactical, here's why it matters right now.

${painPoint(w)}

${v ? `In ${v.name}, the people who decide this are usually ${proseJoin(v.buyerRoles.slice(0, 3))}.` : ''} The good news? There is a better way. That's what we're here to explore.

${w.includePolls ? `**LAUNCH POLL on ${q(label)}: "Which of these is closest to your situation today?"**
Poll options:
${pollOptions(w.ctx).map((o) => `- ${o}`).join('\n')}
` : ''}
Let's see what you're dealing with..."

`,
    'Main Content Block 1': blockScript(section, w, mine, 0, opening),
    'Main Content Block 2': blockScript(section, w, mine, 1, opening),
    'Main Content Block 3': blockScript(section, w, mine, 2, opening),
    'Q&A': `${opening(section.name)}
**ON SCREEN: Q&A slide**

**SPEAKER:**
"Great, now let's open it up for questions. I see some great ones in chat.

Read and answer the questions from the chat. If the chat is quiet, start with the question ${w.role ? `a ${w.role}` : 'this audience'} asks most: ${v ? `"${v.objections[0].objection}"` : 'the one you hear most from customers'}.

For questions we don't get to, I'll include answers in the follow-up email.

Keep them coming while I address these..."

`,
    'Close & CTA': `${opening(section.name)}
**ON SCREEN: CTA slide**

**SPEAKER:**
"We covered a lot today. Quick recap:

${w.takeaways.slice(0, 3).map((t, i) => `${i + 1}. ${endSentence(capFirst(t))}`).join('\n')}

**What's your next step?**

${v ? `The usual first step in ${v.name}: ${lowerFirst(v.salesMotion)}` : 'Name the one next step for the audience.'}

Thanks so much for joining. You'll get the recording, slides and resources within 24 hours (say this only if it is true).

Have a great rest of your day!"

**END WEBINAR**

`
  };

  // Run 12 (R12-20): every other section gets a short speaker prompt written for its type, never an internal label.
  if (scripts[section.name]) return scripts[section.name];
  return `
### ${section.name} (${section.duration} min)

**ON SCREEN: Relevant slide**

**SPEAKER PROMPT:** ${speakerPrompt(section.name, w)}

`;
}

// One main content block: the takeaways it teaches, how this audience measures them, the sector objection for the last block, a
// question for the chat, and where the product line goes.
function blockScript(section: { name: string; duration: number }, w: W, mine: string[], k: number, opening: (n: string) => string): string {
  const v = w.ctx.v;
  const lead = k === 0 ? 'Let\'s start with' : k === 1 ? 'Next:' : 'Last:';
  const teach = mine.length ? mine.map((t) => `- ${endSentence(capFirst(t))}`).join('\n') : '- This block has no takeaway of its own (you gave fewer takeaways than blocks): use it for a worked example or a customer story.';
  const measure = v ? v.metrics[(k * 2) % v.metrics.length] : '';
  const question = v ? v.discovery[(k + 1) % v.discovery.length] : '';
  const objection = v ? v.objections[k % v.objections.length] : null;
  return `${opening(section.name)}
**ON SCREEN: Key concept slide**

**SPEAKER:**
"${lead} ${mine.length > 1 ? 'these points' : 'this point'}.

${teach}

${v ? `How this audience measures it: ${measure}. Ask them for their own number before you give any example.\n` : ''}${objection && k === 2 ? `\nThe objection to answer here: "${objection.objection}". ${objection.response}\n` : ''}${v ? `\nQuestion for the chat: "${question}"\n` : ''}${productLine(w, mine[0] ? q(shortenClauses(mine[0], 90)) : 'this block')}
Any questions on this before we move on? Drop them in chat."

`;
}

function generateAnticipatedQuestions(w: W): string {
  const v = w.ctx.v;
  const sectorQs = v ? v.objections.slice(0, 3) : [];
  const first = w.takeaways[0];
  let n = 1;
  const out: string[] = [];
  out.push(`${n++}. **"How do we get started with this?"**\n   - Response: ${v ? `Deals in ${v.name} usually start like this: ${lowerFirst(v.salesMotion)} Agree the first step with the person asking.` : 'Name the first step and the one principle to hold to.'}`);
  for (const o of sectorQs) out.push(`${n++}. **"${o.objection}"**\n   - Answer pattern: ${o.response}`);
  out.push(`${n++}. **"${first ? `Can you share more examples of this: ${shortenClauses(first, 110)}?` : 'Can you share more examples?'}"**\n   - Response: ${v ? `Use an example that follows this shape: ${lowerFirst(v.proofShape)}` : 'Use a real example with its numbers, and say whose it is.'}`);
  out.push(`${n++}. **"How does this compare to what we do today?"**\n   - Response: ${v ? `Ask what their current setup does not do (${v.vocabulary.slice(0, 2).join(', ')} are good places to look), then show the difference on that point only.` : 'Ask what their current setup does not do, then show the difference on that point only.'}`);
  out.push(`${n++}. **"What resources do you recommend?"**\n   - Response: Send your top three in the follow-up email.`);
  return out.join('\n\n') + '\n';
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
// the product line follows product_mention_level. Run 20 (round 1b): no bracket placeholders; each prompt says what to add.
function speakerPrompt(name: string, w: W): string {
  const label = clipAtWord(w.label, 120);
  const v = w.ctx.v;
  const model = w.ctx.model;
  const sw = startWords(model);
  const { takeaways, speakers, product, productLevel } = w;
  const nth = (i: number, word: string) => takeaways[i] ? `Teach the ${word} takeaway: ${endSentence(takeaways[i])}` : `You gave fewer takeaways than sections: use this part for a worked example.`;
  const ask = (i: number) => `Ask the panel${takeaways[i] ? `, linked to "${shortenClauses(takeaways[i], 110)}"` : ''}${v ? `: "${v.discovery[i % v.discovery.length]}"` : ': a question of your own'}. Give each panelist about two minutes, then ask one follow-up.`;
  const others = speakers.slice(1);
  const otherNames = others.length === 0 ? 'each panelist' : others.some((x) => x.includes(',')) ? others.join('; ') : others.join(' and ');
  const aud = q(w.audience);
  const prod = productLevel === 'none' ? 'the product' : (product || 'your product');
  const prompts: Record<string, string> = {
    'Summary & Key Takeaways': 'Recap each takeaway in one sentence, then name the one step to take first.',
    'Welcome & Agenda': `Welcome everyone to ${q(label)}, say that the session is recorded (only if it is), and show the agenda.`,
    'Problem Context': `Describe the problem this audience faces: ${aud}. ${painPoint(w)}`,
    'Product Overview': `Show ${prod} on one screen and say what it does for ${w.role ? `a ${w.role}` : 'this audience'} in one sentence, using the words of the takeaways.`,
    'Feature Demo 1': `Demo the core feature: start from the problem it solves${takeaways[0] ? ` (${shortenClauses(takeaways[0], 100)})` : ''}, show it working end to end, then pause for questions.`,
    'Feature Demo 2': `Demo the feature that sets ${prod} apart${takeaways[1] ? `, linked to "${shortenClauses(takeaways[1], 100)}"` : ''}. Show the result, not the settings.`,
    'Feature Demo 3': `Demo one advanced use${takeaways[2] ? `, linked to "${shortenClauses(takeaways[2], 100)}"` : ''}. Keep it short and say who it is for.`,
    'Use Case Examples': `Walk through one or two customer examples you can name, with their permission. ${v ? `Pick the ones that moved ${v.metrics[0]} or ${v.metrics[1]}.` : ''}`,
    'Pricing & Getting Started': `Explain how to start: ${startingStep(model)}, and the first step after the session. Plan for the ${sw.rollout} and say how long it usually takes to ${sw.reach}, only with a figure you can stand behind.`,
    'Special Offer & Close': 'Give the offer and when it ends, only if you have one. Thank everyone and give the one next step.',
    'Welcome & Introductions': `Welcome everyone to ${q(label)}, then ask ${otherNames} to introduce themselves in two sentences.`,
    'Topic Introduction': `Frame the discussion: why ${q(label)} matters to this audience now (${aud}), in two or three sentences. ${painPoint(w)}`,
    'Discussion Question 1': ask(0),
    'Discussion Question 2': ask(1),
    'Discussion Question 3': ask(2),
    'Rapid Fire Round': `Ask every panelist the same short question and ask for a one-sentence answer.${v ? ` A good one: "${v.discovery[3 % v.discovery.length]}"` : ''}`,
    'Audience Q&A': 'Take questions from chat. Read each one aloud and hand it to the panelist best placed to answer.',
    'Closing Thoughts': 'Ask each panelist for one thing the audience should do next.',
    'Close': 'Thank the speakers and the audience, say when the recording will arrive (only if there is one), and give the one next step.',
    'Welcome': `Welcome everyone to ${q(label)} and introduce the customer guest: ${speakers[0]}.`,
    'Customer Introduction': 'Ask the customer to introduce their company and their role in two or three sentences.',
    'The Challenge': 'Ask: "What was happening before?" Let the customer describe the problem in their own words.',
    'Solution Discovery': 'Ask: "How did you find us, and why did you choose us?"',
    'Implementation Journey': `Ask: "What was the ${sw.rollout} like?" Ask for one thing that went well and one that was hard.`,
    'Results & Impact': `Ask: "What changed, and how do you measure it?"${v ? ` Listen for measures such as ${v.metrics.slice(0, 3).join(', ')}.` : ''} Use only the numbers the customer agrees to share.`,
    'Live Demo/Walkthrough': 'Ask the customer to show how their team uses it day to day.',
    'Lessons Learned': 'Ask: "What would you tell a team starting today?"',
    'Welcome & Setup': `Welcome everyone to ${q(label)} and check that everyone has the tools or files the exercises need (list them in the invitation).`,
    'Learning Objectives': 'Say what everyone will build by the end of the session.',
    'Concept Introduction': 'Explain the idea behind the first exercise in plain words, with one example.',
    'Exercise 1': 'Give the instructions for the first exercise: the task, the time box and what done looks like. Stay in chat to help.',
    'Debrief 1': 'Ask two or three people to share what they made. Point out one thing that worked.',
    'Exercise 2': 'Give the instructions for the second exercise, which builds on the first: the task and the time box.',
    'Debrief 2': 'Ask two or three people to share what they made. Point out one thing that worked.',
    'Wrap-up & Resources': 'Recap what everyone built and share the templates or resources to keep.',
    'Welcome & Speaker Intro': `Welcome everyone to ${q(label)}, introduce ${speakers[0]} in two sentences, and explain how to ask questions.`,
    'Brief Topic Context': `Frame the session: why ${q(label)} matters to this audience now (${aud}), in two or three sentences. ${painPoint(w)}`,
    'Q&A Session': 'Take the first question from chat. Repeat it aloud, answer in under two minutes, invite a follow-up.',
    'Rapid Fire': 'Answer short questions from chat in one or two sentences each.'
  };
  return prompts[name] || `Cover ${q(label)} for this section; use the takeaways above.`;
}
