import { parseListItems } from './utils.js';

export function generateWebinarScript(args: {
  topic: string;
  target_audience: string;
  webinar_type: string;
  duration?: string;
  key_takeaways?: string;
  speakers?: string;
  include_polls?: boolean;
  product_mention_level?: string;
}): string {
  const topic = args.topic;
  const duration = args.duration || '60_min';
  const type = args.webinar_type;
  const audience = args.target_audience;
  const speakers = args.speakers ? parseListItems(args.speakers) : ['[Speaker Name]'];
  const includePolls = args.include_polls ?? true;
  const productLevel = args.product_mention_level || 'subtle';
  
  // DERIVE key takeaways from topic if not provided
  let takeaways: string[];
  let takeawaysNote = '';
  if (args.key_takeaways) {
    takeaways = parseListItems(args.key_takeaways);
  } else {
    takeaways = generateTakeawaysFromTopic(topic, type, audience);
    takeawaysNote = '*(Auto-generated based on topic and type - customize as needed)*';
  }
  
  // Duration in minutes
  const durationMap: Record<string, number> = {
    '30_min': 30,
    '45_min': 45,
    '60_min': 60,
    '90_min': 90
  };
  const minutes = durationMap[duration] || 60;
  
  // Generate type-specific structure
  const structure = getWebinarStructure(type, minutes);
  
  let output = `# 🎬 Webinar Script: ${topic}

## Webinar Details

| Setting | Value |
|---------|-------|
| **Topic** | ${topic} |
| **Duration** | ${minutes} minutes |
| **Type** | ${type.replace(/_/g, ' ')} |
| **Audience** | ${audience} |
| **Speakers** | ${speakers.join(', ')} |
| **Product Mentions** | ${productLevel} |
${takeawaysNote ? `| **Note** | Key takeaways auto-suggested |` : ''}

---

## 🎯 Key Takeaways for Audience
${takeawaysNote}

${takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}

---

## 📋 Run of Show

${generateRunOfShow(structure, minutes)}

---

## 📝 Full Script

`;

  // Generate script sections based on structure
  for (const section of structure) {
    output += generateScriptSection(section, topic, audience, takeaways, speakers, productLevel, includePolls);
  }

  // Add Q&A prep
  output += `
---

## ❓ Q&A Preparation

### Anticipated Questions

${generateAnticipatedQuestions(topic, takeaways, type)}

### Parking Lot Responses

For questions outside scope:
- "Great question! That deserves its own session. Let me note it and follow up via email."
- "We have a resource on that—I'll share the link in the follow-up email."
- "That's a deep topic. Let's connect after the webinar to discuss your specific situation."

---

## 📧 Follow-Up Sequence

### Email 1: Same Day (Within 2 hours)

**Subject:** Recording + resources from today's ${topic} webinar

Thanks for joining us for ${topic}!

Here's what you requested:
- 🎥 [Recording link]
- 📊 [Slides]
- 📄 [Any resources mentioned]

${takeaways.length > 0 ? `**Quick recap:**
${takeaways.slice(0, 3).map((t, i) => `${i + 1}. ${t}`).join('\n')}` : ''}

Questions? Hit reply.

---

### Email 2: Day 3

**Subject:** Did you catch this from our ${topic} webinar?

One thing attendees keep asking about: [most asked question]

Here's the quick answer: [brief response]

[CTA based on product level]

---

### Email 3: Day 7

**Subject:** Next steps on ${topic}

It's been a week since our webinar. By now you've probably:
- ✅ Watched the recording (or at least meant to)
- 🤔 Thought about implementing what we discussed
- ❓ Have a few questions

[Specific next step CTA]

---

## ✅ Pre-Webinar Checklist

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

`;

  return output;
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
  
  return structure.map(s => ({
    ...s,
    duration: Math.round(s.duration * scale)
  }));
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

function generateScriptSection(
  section: { name: string; duration: number; purpose: string },
  topic: string,
  audience: string,
  takeaways: string[],
  speakers: string[],
  productLevel: string,
  includePolls: boolean
): string {
  const scripts: Record<string, string> = {
    'Welcome & Housekeeping': `
### 🎬 ${section.name} (${section.duration} min)

**[ON SCREEN: Title slide with webinar name]**

**SPEAKER:** 
"Good [morning/afternoon] everyone, and welcome to '${topic}.' I'm thrilled to have you here.

Before we dive in, a few quick housekeeping items:
- We're recording today's session and will send you the link within 24 hours
- Your audio is muted, but we want this to be interactive
- Use the chat for questions anytime—we'll address them throughout and have dedicated Q&A time
- [If polls enabled] You'll see some polls pop up—please participate, it makes this better for everyone

Let's get started!"

`,
    'Speaker Introduction': `
### 🎬 ${section.name} (${section.duration} min)

**[ON SCREEN: Speaker bio slide]**

**SPEAKER:**
"Quick introduction—I'm ${speakers[0]}. [2-3 sentences of relevant background establishing credibility for this topic].

I'm excited to share what we've learned about ${topic} and give you actionable takeaways you can use immediately."

`,
    'Agenda & Learning Objectives': `
### 🎬 ${section.name} (${section.duration} min)

**[ON SCREEN: Agenda slide]**

**SPEAKER:**
"Here's what we'll cover today:

${takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}

By the end of this session, you'll walk away with [specific outcome for ${audience}].

Sound good? Drop a '1' in the chat if you're ready to go."

`,
    'Context Setting': `
### 🎬 ${section.name} (${section.duration} min)

**[ON SCREEN: Context/problem slide]**

**SPEAKER:**
"Before we get tactical, let's talk about why ${topic} matters right now.

[Audience-specific pain point for ${audience}]

The good news? There's a better way. That's what we're here to explore.

${includePolls ? '**[LAUNCH POLL: "What\'s your biggest challenge with [topic]?"]**' : ''}

Let's see what you're dealing with..."

`,
    'Main Content Block 1': `
### 🎬 ${section.name} (${section.duration} min)

**[ON SCREEN: Key concept slide]**

**SPEAKER:**
"Let's start with ${takeaways[0] || 'the foundation'}.

[Core teaching point with specific examples]

Here's what this looks like in practice:
- [Specific example 1]
- [Specific example 2]
- [Specific example 3]

${productLevel !== 'none' ? `**[Product tie-in based on ${productLevel} level]**` : ''}

Any questions on this before we move on? Drop them in chat."

`,
    'Q&A': `
### 🎬 ${section.name} (${section.duration} min)

**[ON SCREEN: Q&A slide]**

**SPEAKER:**
"Great, now let's open it up for questions. I see some great ones in chat.

[Read and answer questions]

For questions we don't get to, I'll include answers in the follow-up email.

Keep them coming while I address these..."

`,
    'Close & CTA': `
### 🎬 ${section.name} (${section.duration} min)

**[ON SCREEN: CTA slide]**

**SPEAKER:**
"We covered a lot today. Quick recap:

${takeaways.slice(0, 3).map((t, i) => `${i + 1}. ${t}`).join('\n')}

**What's your next step?**

[CTA based on ${productLevel} product mention level]

Thanks so much for joining. You'll get the recording, slides, and resources within 24 hours.

Have a great rest of your [day/week]!"

**[END WEBINAR]**

`
  };
  
  // Return specific script if available, otherwise generate generic
  return scripts[section.name] || `
### 🎬 ${section.name} (${section.duration} min)

**[ON SCREEN: Relevant slide]**

**SPEAKER:**
"[Content for ${section.purpose}]

[Teaching points related to ${topic}]

[Transition to next section]"

`;
}

function generateAnticipatedQuestions(topic: string, takeaways: string[], type: string): string {
  return `
1. **"How do I get started with ${topic}?"**
   - Response: Start with [first step]. Focus on [key principle].

2. **"What if [common objection/concern]?"**
   - Response: Great question. The way we address this is [solution].

3. **"Can you share more examples of [takeaway 1]?"**
   - Response: Absolutely. [Specific example with details].

4. **"How does this compare to [alternative approach]?"**
   - Response: The key difference is [differentiation point].

5. **"What resources do you recommend?"**
   - Response: I'll include my top 3 in the follow-up email, but start with [resource].
`;
}

// Generate key takeaways from topic when not provided
function generateTakeawaysFromTopic(topic: string, type: string, audience: string): string[] {
  const typeSpecificTakeaways: Record<string, string[]> = {
    educational: [
      `Understand the fundamentals of ${topic}`,
      `Learn the most common mistakes to avoid`,
      `Get a practical framework you can apply immediately`,
      `Know what metrics/outcomes to track`,
      `Have clear next steps to implement`
    ],
    product_demo: [
      `See how ${topic} works in practice`,
      `Understand key features and benefits`,
      `Learn how to get started quickly`,
      `Know which use cases are best fits`,
      `Get answers to common questions`
    ],
    panel_discussion: [
      `Hear diverse perspectives on ${topic}`,
      `Learn from practitioners who've been there`,
      `Understand different approaches that work`,
      `Get insights you won't find in books/blogs`,
      `Know what questions to ask yourself`
    ],
    customer_story: [
      `Understand the real challenge they faced`,
      `Learn how they approached the solution`,
      `See specific results and timeline`,
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
      `Hear what others are asking about ${topic}`,
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
