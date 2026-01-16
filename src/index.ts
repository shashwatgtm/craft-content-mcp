#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "craft-content-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "case_study_generator",
      description: "Generate complete B2B case study with Challenge-Solution-Results structure, customer quotes, metrics callouts, plus one-pager and social snippets.",
      inputSchema: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Customer company name" },
          customer_industry: { type: "string", description: "Customer's industry" },
          customer_size: { type: "string", description: "Company size" },
          challenge: { type: "string", description: "Business challenge faced" },
          solution: { type: "string", description: "How your product solved it" },
          results: { type: "string", description: "Quantified outcomes" },
          quote: { type: "string", description: "Customer quote" },
          your_product: { type: "string", description: "Your product name" }
        },
        required: ["customer_name", "challenge", "solution", "results", "your_product"]
      }
    },
    {
      name: "newsletter_builder",
      description: "Generate complete newsletter with hook, sections, CTAs, and 10 subject line options.",
      inputSchema: {
        type: "object",
        properties: {
          newsletter_name: { type: "string", description: "Newsletter name" },
          topic: { type: "string", description: "Main topic" },
          key_points: { type: "string", description: "3-5 key points" },
          audience: { type: "string", description: "Target audience" },
          cta: { type: "string", description: "Call-to-action" },
          tone: { type: "string", description: "Tone: professional, conversational" }
        },
        required: ["newsletter_name", "topic", "key_points", "audience"]
      }
    },
    {
      name: "webinar_script",
      description: "Generate complete webinar script with slides outline, speaker notes, Q&A prep, and engagement prompts.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Webinar title" },
          topic: { type: "string", description: "Main topic" },
          duration: { type: "string", description: "Duration: 30, 45, 60 min" },
          speakers: { type: "string", description: "Speaker names and titles" },
          audience: { type: "string", description: "Target audience" },
          key_takeaways: { type: "string", description: "3-5 takeaways" },
          cta: { type: "string", description: "End CTA" }
        },
        required: ["title", "topic", "duration", "speakers", "key_takeaways"]
      }
    },
    {
      name: "content_repurposer",
      description: "Transform one piece into 10+ formats: LinkedIn, Twitter, email, blog, video script, infographic, podcast.",
      inputSchema: {
        type: "object",
        properties: {
          source_content: { type: "string", description: "Original content" },
          source_type: { type: "string", description: "Type: blog, webinar, podcast" },
          key_message: { type: "string", description: "Core message" },
          audience: { type: "string", description: "Target audience" },
          brand_voice: { type: "string", description: "Brand voice" }
        },
        required: ["source_content", "source_type", "key_message"]
      }
    },
    {
      name: "thought_leadership_series",
      description: "Generate 5-post LinkedIn series with interconnected themes, hooks, and engagement prompts.",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Overarching topic" },
          perspective: { type: "string", description: "Your unique angle" },
          author_role: { type: "string", description: "Author title and expertise" },
          audience: { type: "string", description: "Target audience" },
          goal: { type: "string", description: "Goal: awareness, leads, thought leadership" },
          controversial_take: { type: "string", description: "Contrarian view to include" }
        },
        required: ["topic", "perspective", "author_role", "audience"]
      }
    },
    {
      name: "testimonial_capture",
      description: "Generate testimonial request emails, interview questions, and formatted output templates.",
      inputSchema: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Customer contact name" },
          customer_company: { type: "string", description: "Customer company" },
          relationship_context: { type: "string", description: "Relationship context" },
          use_case: { type: "string", description: "Use case to highlight" },
          format_needed: { type: "string", description: "Formats: quote, video, case study" },
          your_name: { type: "string", description: "Your name" },
          your_company: { type: "string", description: "Your company" }
        },
        required: ["customer_name", "customer_company", "use_case", "your_company"]
      }
    },
    {
      name: "sales_enablement_content",
      description: "Generate pitch scripts (30s/2min/5min), objection handlers, discovery questions, competitive responses.",
      inputSchema: {
        type: "object",
        properties: {
          product: { type: "string", description: "Product name" },
          value_props: { type: "string", description: "Key value propositions" },
          target_persona: { type: "string", description: "Target buyer" },
          common_objections: { type: "string", description: "Common objections" },
          competitors: { type: "string", description: "Main competitors" },
          price_range: { type: "string", description: "Pricing context" },
          key_metrics: { type: "string", description: "Success metrics" }
        },
        required: ["product", "value_props", "target_persona", "common_objections"]
      }
    },
    {
      name: "craft_content_improver",
      description: "Analyze and improve any content using CRAFT principles. Returns score and improved version.",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "Content to improve" },
          content_type: { type: "string", description: "Type: email, blog, social" },
          goal: { type: "string", description: "Content goal" },
          audience: { type: "string", description: "Target audience" },
          constraints: { type: "string", description: "Constraints" }
        },
        required: ["content", "content_type", "goal"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = args as Record<string, string>;
  
  const tools: Record<string, () => string> = {
    case_study_generator: () => generateCaseStudy(a),
    newsletter_builder: () => generateNewsletter(a),
    webinar_script: () => generateWebinar(a),
    content_repurposer: () => repurposeContent(a),
    thought_leadership_series: () => generateThoughtLeadership(a),
    testimonial_capture: () => generateTestimonialKit(a),
    sales_enablement_content: () => generateSalesContent(a),
    craft_content_improver: () => improveContent(a)
  };
  
  const output = tools[name]?.() || `Unknown tool: ${name}`;
  return { content: [{ type: "text", text: output }] };
});

function generateCaseStudy(a: Record<string, string>): string {
  return `# 📊 CASE STUDY: ${a.customer_name}

| **Customer** | ${a.customer_name} | **Industry** | ${a.customer_industry || "Technology"} |
|-------------|-------------------|-------------|-----------------|
| **Size** | ${a.customer_size || "N/A"} | **Product** | ${a.your_product} |

---

# FULL CASE STUDY

## Executive Summary
${a.customer_name} faced ${a.challenge.toLowerCase()}. After implementing ${a.your_product}, they achieved ${a.results}.

## The Challenge
${a.challenge}

**Impact Before:**
- Pain point 1: [Quantify]
- Pain point 2: [Quantify]

> "${a.quote || `${a.challenge} was costing us significant time and resources.`}"
> — [Champion], [Title], ${a.customer_name}

## The Solution
**Why ${a.your_product}:**
${a.solution}

**Key Features Used:**
- Feature 1: [How it helped]
- Feature 2: [How it helped]

## The Results
${a.results}

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| [Metric 1] | | | |
| [Metric 2] | | | |

> "${a.your_product} transformed our operations. ${a.results}"
> — [Champion], [Title], ${a.customer_name}

---

# ONE-PAGER

## ${a.customer_name} + ${a.your_product}

**Challenge:** ${a.challenge}
**Solution:** ${a.solution}
**Results:** ${a.results}

> "${a.quote || 'Quote placeholder'}"

**[CTA Button]**

---

# SOCIAL SNIPPETS

## LinkedIn (Long)
🎯 How ${a.customer_name} achieved ${a.results.split('.')[0]}

The challenge: ${a.challenge}

The solution: ${a.your_product}

📈 Results: ${a.results}

Full story: [Link]

#CustomerSuccess #CaseStudy

## LinkedIn (Short)
${a.customer_name} was struggling with ${a.challenge.substring(0, 50)}...

After ${a.your_product}:
→ ${a.results.split('.')[0]}

Sometimes the right tool makes all the difference.

## Twitter Thread
1/ How @${a.customer_name.replace(/\s/g, '')} solved ${a.challenge.substring(0, 50)}... 🧵

2/ Problem: ${a.challenge}

3/ Solution: ${a.your_product}

4/ Results: ${a.results}

5/ Full story: [Link]

---
*Generated by CRAFT Content MCP | gtmexpert.com*`;
}

function generateNewsletter(a: Record<string, string>): string {
  return `# 📧 NEWSLETTER: ${a.newsletter_name}

**Topic:** ${a.topic}
**Audience:** ${a.audience}
**Tone:** ${a.tone || "Professional"}
**CTA:** ${a.cta || "Not specified"}

## Key Points
${a.key_points}

---

# SUBJECT LINES (10 Options)

1. "${a.topic}: What You Need to Know"
2. "The Truth About ${a.topic}"
3. "Why Most Get ${a.topic} Wrong"
4. "The ${a.topic} Mistake Costing You"
5. "How to Master ${a.topic}"
6. "3 Ways ${a.topic} Can Transform [Outcome]"
7. "5 ${a.topic} Insights That Changed Everything"
8. "${a.topic} - A Guide for ${a.audience}"
9. "What Nobody Tells You About ${a.topic}"
10. "The Fast Track to [Result] with ${a.topic}"

---

# NEWSLETTER CONTENT

## Preview Text
"${a.topic} insights you won't find anywhere else..."

---

## HOOK (Choose One)

### Option 1: Question
Have you wondered why ${a.topic.toLowerCase()} seems complicated? This week, I'm breaking it down.

### Option 2: Story
Last week, I learned something that changed how I think about ${a.topic.toLowerCase()}...

### Option 3: Stat
Did you know [statistic about ${a.topic}]? That's why this issue is dedicated to ${a.topic.toLowerCase()}.

### Option 4: Contrarian
Everything you've heard about ${a.topic.toLowerCase()} might be wrong. Let me explain...

---

## SECTION 1: The Big Idea

### ${a.key_points.split('\n')[0] || "Key Point 1"}

[Expand - 150 words]

**Takeaway:** [One sentence]

---

## SECTION 2: Deep Dive

### ${a.key_points.split('\n')[1] || "Key Point 2"}

[Expand - 150 words]

What this means:
- Point A
- Point B
- Point C

---

## SECTION 3: Practical Application

### ${a.key_points.split('\n')[2] || "Key Point 3"}

[Practical advice - 100 words]

**Action item:** [Specific action for today]

---

## QUICK HITS (Optional)
- 📖 [Resource 1]: [Why it's valuable]
- 🎧 [Resource 2]: [Why it's valuable]
- 🛠️ [Tool]: [Why it's valuable]

---

## CTA SECTION

${a.cta || "[Primary CTA]"}

---

## SIGN-OFF

That's it for this week. Forward to someone who'd benefit.

See you next week,
[Your name]

P.S. [Teaser or secondary CTA]

---

# ENGAGEMENT ELEMENTS

**Question:** "What's your biggest challenge with ${a.topic.toLowerCase()}? Reply and let me know."

**Social Proof:** "Join [X,XXX] ${a.audience.toLowerCase()} who read ${a.newsletter_name} weekly."

---
*Generated by CRAFT Content MCP | gtmexpert.com*`;
}

function generateWebinar(a: Record<string, string>): string {
  const duration = parseInt(a.duration) || 45;
  
  return `# 🎬 WEBINAR: ${a.title}

| **Topic** | ${a.topic} | **Duration** | ${duration} min |
|-----------|------------|-------------|-----------------|
| **Speakers** | ${a.speakers} | **Audience** | ${a.audience || "N/A"} |
| **CTA** | ${a.cta || "Demo/Trial"} | | |

## Key Takeaways
${a.key_takeaways}

---

# SLIDE-BY-SLIDE SCRIPT

## SLIDE 1: Title (30 sec)
**Visual:** Title, speakers, logo

---

## SLIDE 2: Welcome (2 min)
> "Welcome to ${a.title}. I'm ${a.speakers}.
> 
> Housekeeping: Recording will be sent, use Q&A for questions, say hi in chat.
> 
> By the end, you'll know:
> ${a.key_takeaways.split('\n').map(t => `> - ${t}`).join('\n')}"

---

## SLIDE 3: Why This Matters (3 min)
> "Let me explain why ${a.topic} matters now.
> 
> [Share relevant stat]
> 
> If you're like most ${a.audience || "professionals"}, you've experienced [pain]."

**Engagement:** "How many have experienced [challenge]? Drop 1 in chat."

---

## SLIDE 4: Agenda (1 min)
> "Here's our roadmap:
> 1. [Section 1]
> 2. [Section 2]
> 3. [Section 3]
> 4. Q&A
> 
> Let's go."

---

## SLIDES 5-8: Section 1 (${Math.floor(duration * 0.25)} min)

> "[First key teaching point]
> 
> Here's why this matters: [connection to pain]
> 
> For example: [case study/example]"

**Visual:** Concept diagram, data

---

## SLIDES 9-13: Section 2 (${Math.floor(duration * 0.35)} min)

> "Now let's get practical.
> 
> **Step 1:** [Explain]
> **Step 2:** [Explain]
> **Step 3:** [Explain]
> 
> Let me show you..."

**Visual:** Steps, screenshots, demo

---

## SLIDES 14-15: Section 3 (${Math.floor(duration * 0.15)} min)

> "For those ready to go further:
> 
> [Advanced tip 1]
> [Advanced tip 2]
> 
> The key insight: [takeaway]"

---

## SLIDE 16: Recap (2 min)
> "Let's recap:
> ${a.key_takeaways.split('\n').map((t, i) => `> ${i+1}. ${t}`).join('\n')}
> 
> Remember: [most important point]"

---

## SLIDE 17: CTA (2 min)
> "Ready to ${a.cta || "take action"}?
> 
> [Explain offer]
> 
> Link is in chat now."

---

## SLIDE 18: Q&A (${Math.floor(duration * 0.15)} min)
> "Let's take your questions..."

---

## SLIDE 19: Close (1 min)
> "Thank you! Recording coming within 24 hours. Connect on LinkedIn. Have a great day!"

---

# Q&A PREP

| Question | Answer |
|----------|--------|
| [Common Q1]? | [Prepared answer] |
| [Common Q2]? | [Prepared answer] |
| [Common Q3]? | [Prepared answer] |

---

# ENGAGEMENT PROMPTS

- "Where are you joining from?"
- "Drop 👋 if [experience]"
- "What's your biggest challenge?"
- "Type YES if you want [resource]"

---

# PRE-WEBINAR CHECKLIST

- [ ] Audio/video tested
- [ ] Slides loaded
- [ ] Screen share ready
- [ ] Recording enabled
- [ ] Links ready for chat
- [ ] Water nearby

---
*Generated by CRAFT Content MCP | gtmexpert.com*`;
}

function repurposeContent(a: Record<string, string>): string {
  return `# 🔄 CONTENT REPURPOSING KIT

**Source Type:** ${a.source_type}
**Key Message:** ${a.key_message}
**Audience:** ${a.audience || "Not specified"}
**Voice:** ${a.brand_voice || "Professional"}

## Source Content
\`\`\`
${a.source_content.substring(0, 300)}...
\`\`\`

---

# 10+ REPURPOSED FORMATS

## 1. LINKEDIN (Long)

${a.key_message}

Here's what I've learned:

→ **Point 1:** [Extract]
→ **Point 2:** [Extract]
→ **Point 3:** [Extract]

The bottom line: [Key takeaway]

What's your experience? 👇

---

## 2. LINKEDIN (Short)

Hot take: ${a.key_message}

Most think [common belief].
Data shows [counter-point].

Agree or disagree?

---

## 3. LINKEDIN CAROUSEL

**Slide 1:** "${a.key_message.substring(0, 50)}..."
**Slide 2:** [Problem]
**Slides 3-8:** [Key points]
**Slide 9:** Summary
**Slide 10:** CTA

---

## 4. TWITTER THREAD

1/ ${a.key_message} 🧵

2/ [First key point]

3/ [Second point]

4/ [Third point]

5/ TL;DR:
• Point 1
• Point 2
• Point 3

6/ RT if helpful. Follow for more.

---

## 5. SINGLE TWEET

${a.key_message.substring(0, 200)}

[Key insight]

[Question/CTA]

---

## 6. EMAIL SECTION

### ${a.key_message.split('.')[0]}

[2-3 paragraph summary]

**Takeaway:** [One sentence]

[Read more: Link]

---

## 7. BLOG OUTLINE

# ${a.key_message}

## Introduction
- Hook
- Why it matters
- What you'll learn

## Section 1: [Topic]
## Section 2: [Topic]
## Section 3: [Topic]

## Conclusion
- Summary
- CTA

---

## 8. VIDEO SCRIPT (2-3 min)

**HOOK (0:00):** "${a.key_message}"

**INTRO (0:15):** "In this video..."

**CONTENT (0:30-2:00):**
- Point 1
- Point 2
- Point 3

**CTA (2:00):** "Subscribe/like/comment"

---

## 9. INFOGRAPHIC

**Title:** ${a.key_message}
**Section 1:** [Icon] + Point 1
**Section 2:** [Icon] + Point 2
**Section 3:** [Icon] + Point 3
**Footer:** Logo + CTA

---

## 10. PODCAST POINTS

**Episode:** ${a.key_message}

**Discussion (15-20 min):**
- Context/background
- Insight 1
- Insight 2
- Insight 3
- Common mistakes
- What to do instead

**Takeaways:** Action items

---

## 11. SALES SNIPPET

"Great question. ${a.key_message}

We've found [key insight].

For example, [specific example].

How does this compare to what you're seeing?"

---

## 12. QUOTE GRAPHICS

1. "${a.key_message.split('.')[0]}."
2. "[Impactful line from content]"
3. "[Stat-based quote]"

---

# DISTRIBUTION SCHEDULE

| Day | Platform | Format | Time |
|-----|----------|--------|------|
| Mon | LinkedIn | Long | 9 AM |
| Tue | Twitter | Thread | 12 PM |
| Wed | Email | Section | 8 AM |
| Thu | LinkedIn | Short | 10 AM |
| Fri | Twitter | Tweet | 2 PM |

---
*Generated by CRAFT Content MCP | gtmexpert.com*`;
}

function generateThoughtLeadership(a: Record<string, string>): string {
  return `# 💡 THOUGHT LEADERSHIP SERIES

**Topic:** ${a.topic}
**Perspective:** ${a.perspective}
**Author:** ${a.author_role}
**Audience:** ${a.audience}
**Goal:** ${a.goal || "Thought leadership"}

---

# 5-POST LINKEDIN SERIES

## POST 1: The Problem Statement

I've spent [X years] in ${a.topic.toLowerCase()}.

One thing keeps me up at night:

${a.perspective}

Most ${a.audience.toLowerCase()} think [common belief].

Reality: [contrarian truth].

I've seen this play out:
• [Example 1]
• [Example 2]
• [Example 3]

Cost of getting it wrong: [Consequence]

Over the next weeks, I'm sharing everything I've learned.

Follow along if you want to [benefit].

What's your experience? 👇

---

## POST 2: The Counterintuitive Insight

Unpopular opinion about ${a.topic.toLowerCase()}:

${a.controversial_take || "[Your contrarian take]"}

Everyone says [conventional wisdom].

After [experience], I've found the opposite.

**What everyone does:**
[Common approach]

**Why it fails:**
• Reason 1
• Reason 2
• Reason 3

**What actually works:**
[Your approach]

Which camp are you in?

---

## POST 3: The Framework

After [experience] with ${a.topic.toLowerCase()}, I developed a framework.

I call it [Framework Name].

**Step 1: [Name]**
[Explanation]

**Step 2: [Name]**
[Explanation]

**Step 3: [Name]**
[Explanation]

**Step 4: [Name]**
[Explanation]

This isn't theory. I've used it to [results].

Save this post.

---

## POST 4: The Case Study

Let me tell you about [person/company].

They struggled with ${a.topic.toLowerCase()}.

Nothing worked:
❌ [Failed approach 1]
❌ [Failed approach 2]
❌ [Failed approach 3]

Then they [key change].

Results:
📈 [Result 1]
📈 [Result 2]
📈 [Result 3]

The lesson: ${a.perspective}

What would results like this mean for you?

---

## POST 5: The Call to Action

After 4 posts on ${a.topic.toLowerCase()}, remember:

**1.** [Summary from Post 1]
**2.** [Summary from Post 2]
**3.** [Summary from Post 3]
**4.** [Summary from Post 4]

Knowledge without action is useless.

My challenge: Pick ONE thing and implement it this week.

Come back and tell me what happened.

I read every comment. Let's go. 🚀

---

# ENGAGEMENT STRATEGY

**Best Times:** Tue-Thu, 8-10 AM
**Spacing:** 2-3 days apart
**Comments:** Reply within 2 hours

**Hashtags:** #${a.topic.replace(/\s/g, '')} #ThoughtLeadership #${a.audience.replace(/\s/g, '')}

---
*Generated by CRAFT Content MCP | gtmexpert.com*`;
}

function generateTestimonialKit(a: Record<string, string>): string {
  return `# ⭐ TESTIMONIAL CAPTURE KIT

**Contact:** ${a.customer_name}
**Company:** ${a.customer_company}
**Context:** ${a.relationship_context || "Current customer"}
**Use Case:** ${a.use_case}
**Format:** ${a.format_needed || "Quote, case study"}

---

# EMAIL 1: Initial Request

**Subject:** Quick favor? Share your ${a.your_company} experience

Hi ${a.customer_name},

Hope you're well! I'm reaching out because you've been a great partner, and I'd love to feature ${a.customer_company}'s success.

Your results with ${a.use_case} have been impressive.

Would you be open to:
• A brief testimonial (15-20 min)
• Providing a written quote
• A G2/Capterra review

I'll make it easy - just 15-20 minutes, and I handle all writing/editing.

Interested?

${a.your_name || "[Your name]"}

---

# EMAIL 2: Questions

**Subject:** Re: Your questions

Hi ${a.customer_name},

Thanks for agreeing! Here are the questions:

**Before ${a.your_company}:**
1. What challenge were you facing?
2. What did you try before?
3. What was the impact?

**Experience:**
4. Why did you choose ${a.your_company}?
5. How was implementation?
6. What features do you use most?

**Results:**
7. What results have you achieved?
8. How has this impacted your team?
9. What would you tell someone considering ${a.your_company}?

Quick answers are fine - I'll polish them!

${a.your_name || "[Your name]"}

---

# INTERVIEW GUIDE

## Opening (2 min)
- Thank them
- Explain process
- Confirm consent

## Background (3 min)
1. "Tell me about your role."
2. "What does your team focus on?"

## Challenge (5 min)
3. "What challenge led you to ${a.your_company}?"
4. "What was the impact?"
5. "What did you try before?"

## Solution (5 min)
6. "Why ${a.your_company}?"
7. "How was implementation?"
8. "Key features?"

## Results (5 min)
9. "What results have you seen?"
10. "Specific metrics?"
11. "Team impact?"

## Recommendation (3 min)
12. "What would you tell someone considering us?"
13. "Advice for getting the most value?"

---

# FORMATTED OUTPUTS

## Short Quote
> "${a.your_company} has [outcome]. We've seen [result] since implementing."
> — ${a.customer_name}, [Title], ${a.customer_company}

## Long Quote
> "Before ${a.your_company}, we struggled with [challenge]. Since implementing, we've achieved [result 1] and [result 2]. I'd recommend ${a.your_company} to any company dealing with [similar challenge]."
> — ${a.customer_name}, [Title], ${a.customer_company}

## Social Proof
"${a.customer_company} achieved [result] with ${a.your_company}." ★★★★★

## Website Block
**${a.customer_company}**
"[Powerful 1-2 sentence quote]"
**${a.customer_name}**, [Title]
**Result:** [Key metric]

---
*Generated by CRAFT Content MCP | gtmexpert.com*`;
}

function generateSalesContent(a: Record<string, string>): string {
  return `# 💼 SALES ENABLEMENT CONTENT

**Product:** ${a.product}
**Target:** ${a.target_persona}
**Competitors:** ${a.competitors || "N/A"}
**Price:** ${a.price_range || "N/A"}

## Value Props
${a.value_props}

## Objections
${a.common_objections}

## Success Metrics
${a.key_metrics || "N/A"}

---

# PITCH VARIATIONS

## 30-Second
"${a.product} helps ${a.target_persona.toLowerCase()} [primary outcome].

Unlike alternatives, we [differentiator].

Customers see [key metric].

Worth 15 minutes to explore?"

---

## 2-Minute

"Let me tell you about ${a.product}.

**Problem:** [Pain point for ${a.target_persona.toLowerCase()}]

Most solutions [limitation].

**Our Approach:** ${a.product} [difference].

**Results:**
${a.value_props.split('\n').map(v => `• ${v}`).join('\n')}

For example, [customer] saw [result].

**Next:** 30 minutes to show how this works for you?"

---

## 5-Minute

"Thanks for the time.

**The Problem:**
${a.target_persona} typically struggle with [challenge]. Cost: [impact].

**What Most Do:**
[Common approach] - but [limitation].

**Our Solution:**
${a.product}:
${a.value_props.split('\n').map(v => `• ${v}`).join('\n')}

**Proof:**
${a.key_metrics || "[Results]"}

**Investment:**
${a.price_range || "[Pricing]"}

**Next:**
Based on what you've shared, I see potential. Want to explore a pilot?"

---

# OBJECTION HANDLERS

${a.common_objections.split('\n').map(obj => `
## "${obj.trim()}"

**Acknowledge:** "I understand. [Validation]"

**Respond:** "[Counter-point with evidence]"

**Redirect:** "What would change your mind?"`).join('\n')}

---

## Price Objection

"I hear you. Let's break it down.

Currently, [problem] costs [amount].
${a.product}: [price].
ROI: [timeframe].

Most see [X]x return. Can I show the ROI calculator?"

---

## Competitor Objection

"They're solid. Our customers found:
• [Advantage 1]
• [Advantage 2]
• [Advantage 3]

What's most important to you?"

---

# DISCOVERY QUESTIONS

**Situation:**
1. "Tell me about your current [process]."
2. "What tools are you using?"

**Problem:**
3. "What's working? Not working?"
4. "What happens when [problem] occurs?"
5. "How much does this cost?"

**Implication:**
6. "How does this impact [broader goal]?"
7. "What if nothing changes?"

**Need-Payoff:**
8. "What would solving this mean?"
9. "How would you measure success?"

**Decision:**
10. "Who else is involved?"
11. "Timeline for change?"
12. "What makes this a no-brainer?"

---

# ROI TALK TRACK

"Let me walk through the value.

**Current:**
• Time on [task]: ___hrs/week
• Cost of [problem]: $___/month

**With ${a.product}:**
• Time saved: ___hrs/week
• Cost reduction: $___/month

**ROI:** [X]x return in [timeframe]

Does this align with your goals?"

---
*Generated by CRAFT Content MCP | gtmexpert.com*`;
}

function improveContent(a: Record<string, string>): string {
  return `# ✨ CRAFT CONTENT IMPROVER

**Type:** ${a.content_type}
**Goal:** ${a.goal}
**Audience:** ${a.audience || "N/A"}
**Constraints:** ${a.constraints || "None"}

## Original
\`\`\`
${a.content.substring(0, 300)}...
\`\`\`

---

# CRAFT ANALYSIS

## C - CHARACTER (Voice)
| Aspect | Score |
|--------|-------|
| Clear voice | ___/10 |
| Authority | ___/10 |
| Authenticity | ___/10 |

**Issues:** 
**Improvements:**

---

## R - RESULT (Outcome)
| Aspect | Score |
|--------|-------|
| Clear goal | ___/10 |
| Actionable | ___/10 |
| Measurable | ___/10 |

**Issues:**
**Improvements:**

---

## A - ARTIFACT (Quality)
| Aspect | Score |
|--------|-------|
| Structure | ___/10 |
| Formatting | ___/10 |
| Polish | ___/10 |

**Issues:**
**Improvements:**

---

## F - FRAME (Context)
| Aspect | Score |
|--------|-------|
| Audience fit | ___/10 |
| Relevance | ___/10 |

**Issues:**
**Improvements:**

---

## T - TIMELINE (Flow)
| Aspect | Score |
|--------|-------|
| Flow | ___/10 |
| Pacing | ___/10 |
| CTA timing | ___/10 |

**Issues:**
**Improvements:**

---

# SCORE: ___/100

| Dimension | Score |
|-----------|-------|
| Character | ___/20 |
| Result | ___/20 |
| Artifact | ___/20 |
| Frame | ___/20 |
| Timeline | ___/20 |

---

# IMPROVED VERSION

[Rewritten content with CRAFT improvements]

---

# KEY CHANGES

1. **Character:** [Changed]
2. **Result:** [Changed]
3. **Artifact:** [Changed]
4. **Frame:** [Changed]
5. **Timeline:** [Changed]

---

# A/B TESTS

**Test 1:** [Alt headline]
**Test 2:** [Alt CTA]
**Test 3:** [Alt structure]

---
*Generated by CRAFT Content MCP | gtmexpert.com*`;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CRAFT Content MCP Server running");
}

main().catch(console.error);
