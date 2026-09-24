import { parseListItems, extractKeyPoints, countWords } from './utils.js';

// Default formats when user doesn't specify
const DEFAULT_FORMATS = ['linkedin_post', 'twitter_thread', 'email', 'blog_summary', 'quote_cards'];

export function generateContentRepurposer(args: {
  source_content: string;
  source_type: string;
  target_formats?: string;
  brand_voice?: string;
  key_message?: string;
}): string {
  const content = args.source_content;
  const sourceType = args.source_type;
  const targetFormats = args.target_formats ? parseListItems(args.target_formats) : DEFAULT_FORMATS;
  const voice = args.brand_voice || 'professional';
  const keyMessage = args.key_message || '';
  
  // Extract key information from source
  const keyPoints = extractKeyPoints(content);
  const wordCount = countWords(content);
  const title = extractTitle(content);
  
  let output = `# 🔄 Content Repurposing Kit

## Source Content Analysis

| Attribute | Value |
|-----------|-------|
| **Source Type** | ${sourceType.replace(/_/g, ' ')} |
| **Word Count** | ${wordCount} |
| **Key Points Found** | ${keyPoints.length} |
| **Brand Voice** | ${voice} |
| **Core Message** | ${keyMessage || 'Extracted from content'} |
| **Formats** | ${args.target_formats ? 'Custom selection' : 'Default top 5'} |

### Key Points Extracted
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

---

## 📦 Repurposed Content

`;

  // Generate each requested format
  for (const format of targetFormats) {
    const formatOutput = generateFormat(format.toLowerCase().replace(/\s+/g, '_'), content, keyPoints, title, voice, keyMessage, sourceType);
    output += formatOutput;
  }

  output += `
---

## 📊 Content Distribution Matrix

| Format | Platform | Best Time | Engagement Goal |
|--------|----------|-----------|-----------------|
${targetFormats.map(f => `| ${f} | ${getPlatform(f)} | ${getBestTime(f)} | ${getEngagementGoal(f)} |`).join('\n')}

---

## ✅ Repurposing Checklist

- [ ] Review each piece for brand consistency
- [ ] Customize for platform-specific best practices
- [ ] Update links/CTAs for each channel
- [ ] Schedule according to optimal times
- [ ] Prepare responses for expected engagement
- [ ] Track performance across formats

`;

  return output;
}

function extractTitle(content: string): string {
  // Try to extract title from headers or first line
  const headerMatch = content.match(/^#\s+(.+)$/m);
  if (headerMatch) return headerMatch[1];
  
  const firstLine = content.split('\n')[0];
  if (firstLine.length < 100) return firstLine;
  
  return 'Content';
}

function generateFormat(
  format: string,
  content: string,
  keyPoints: string[],
  title: string,
  voice: string,
  keyMessage: string,
  sourceType: string
): string {
  const generators: Record<string, () => string> = {
    linkedin_post: () => `
### 📱 LinkedIn Post

---

${generateLinkedInPost(content, keyPoints, voice, keyMessage)}

---

**Posting Notes:**
- Best time: Tuesday-Thursday, 8-10am
- Engage with comments in first 60 min
- Add 3-5 relevant hashtags

`,
    twitter_thread: () => `
### 🐦 Twitter/X Thread

---

${generateTwitterThread(content, keyPoints, title)}

---

**Posting Notes:**
- Thread with 5-10 tweets performs best
- First tweet is crucial for engagement
- Add a "follow for more" at the end

`,
    email: () => `
### 📧 Email Version

---

**Subject Line Options:**
1. ${title}: Key insights you need to know
2. What we learned about ${keyPoints[0]?.split(' ').slice(0, 3).join(' ') || 'this topic'}
3. [First Name], don't miss this ${sourceType.replace(/_/g, ' ')} summary

**Email Body:**

${generateEmailVersion(content, keyPoints, keyMessage)}

---

`,
    blog_summary: () => `
### 📝 Blog Summary (300 words)

---

${generateBlogSummary(content, keyPoints, title)}

---

`,
    infographic_outline: () => `
### 📊 Infographic Outline

---

**Title:** ${title}

**Header Section:**
- Main statistic or hook from content
- Visual: [Icon representing topic]

**Body Sections:**

${keyPoints.slice(0, 5).map((p, i) => `
**Section ${i + 1}: ${p.split(' ').slice(0, 5).join(' ')}...**
- Key stat/visual: [Extract number or create icon]
- Supporting point: ${p}
`).join('\n')}

**Footer:**
- CTA: [Action you want viewers to take]
- Branding: Logo + website

---

`,
    video_script: () => `
### 🎥 Video Script (60-90 seconds)

---

**[HOOK - 5 seconds]**
"${keyPoints[0] ? `Did you know that ${keyPoints[0].toLowerCase()}?` : `Here's something important about ${title}...`}"

**[INTRO - 10 seconds]**
"I just shared ${sourceType.replace(/_/g, ' ')} about ${title}. Here are the key takeaways you need to know."

**[BODY - 45-60 seconds]**
${keyPoints.slice(0, 3).map((p, i) => `
"Point ${i + 1}: ${p}"
[VISUAL: Supporting image/graphic]
`).join('\n')}

**[CTA - 10 seconds]**
"${keyMessage || 'Link in bio for the full version. Follow for more insights like this.'}"

---

`,
    podcast_talking_points: () => `
### 🎙️ Podcast Talking Points

---

**Episode Title:** ${title}: A Deep Dive

**Intro (1-2 min):**
- Hook: Why this matters now
- Context: Where this ${sourceType.replace(/_/g, ' ')} came from

**Main Discussion Points:**

${keyPoints.map((p, i) => `
**Point ${i + 1}:** ${p}
- Story/example to illustrate
- Implications for listeners
- Practical application
`).join('\n')}

**Wrap-up:**
- Key takeaway summary
- CTA for listeners
- Tease next episode

---

`,
    slide_deck_outline: () => `
### 📊 Slide Deck Outline

---

**Slide 1: Title**
- ${title}
- [Presenter name, date]

**Slide 2: Why This Matters**
- Context for the content
- Key problem being addressed

${keyPoints.map((p, i) => `
**Slide ${i + 3}: ${p.split(' ').slice(0, 5).join(' ')}**
- Main point: ${p}
- Supporting visual
- Key statistic (if available)
`).join('\n')}

**Slide ${keyPoints.length + 3}: Summary**
- ${keyPoints.length} key takeaways
- One-line for each

**Slide ${keyPoints.length + 4}: Next Steps/CTA**
- What to do with this information
- Contact/follow-up details

---

`,
    quote_cards: () => `
### 💬 Quote Cards (Social Graphics)

---

${extractQuotes(content, keyPoints).map((q, i) => `
**Quote Card ${i + 1}:**
> "${q}"

- Background: [Solid color or subtle pattern]
- Font: Bold, readable
- Branding: Logo bottom corner

`).join('\n')}

**Design Notes:**
- Keep text readable on mobile
- Use brand colors
- Square format (1080x1080) for Instagram/LinkedIn
- Add visual hierarchy with font sizes

---

`,
    newsletter_section: () => `
### 📰 Newsletter Section

---

**Section Header:** ${title}

${generateNewsletterSection(content, keyPoints, keyMessage)}

**[Read the full ${sourceType.replace(/_/g, ' ')} →]**

---

`
  };
  
  return generators[format] ? generators[format]() : `
### ${format.replace(/_/g, ' ').toUpperCase()}

Content repurposed for ${format}:

${keyPoints.map(p => `• ${p}`).join('\n')}

[CTA based on format requirements]

---

`;
}

function generateLinkedInPost(content: string, keyPoints: string[], voice: string, keyMessage: string): string {
  const hook = keyPoints[0] ? `${keyPoints[0].charAt(0).toUpperCase() + keyPoints[0].slice(1)}` : 'Here\'s what I learned';
  
  return `${hook}

${keyPoints.length > 1 ? `After diving deep into this topic, here's what stands out:

${keyPoints.slice(0, 4).map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}

${keyMessage || 'The bottom line: this changes how we should think about the problem.'}

What's your take? 👇

#${content.split(' ').slice(0, 3).join('').replace(/[^a-zA-Z]/g, '')} #Insights #${voice}`;
}

function generateTwitterThread(content: string, keyPoints: string[], title: string): string {
  let thread = `**Tweet 1 (Hook):**
${title} - A thread 🧵

Here's what you need to know:\n\n`;

  keyPoints.slice(0, 6).forEach((p, i) => {
    thread += `**Tweet ${i + 2}:**
${i + 1}/ ${p}

`;
  });

  thread += `**Final Tweet:**
${keyPoints.length + 2}/ That's the TL;DR.

Full breakdown linked in bio.

Follow for more threads like this 👋`;

  return thread;
}

function generateEmailVersion(content: string, keyPoints: string[], keyMessage: string): string {
  return `Hi [First Name],

Quick summary of something important:

${keyPoints.slice(0, 3).map(p => `→ ${p}`).join('\n')}

${keyMessage || 'This matters because [reason].'}

Worth a read when you have a few minutes.

[CTA Button: Read the Full Version]

Best,
[Your name]`;
}

function generateBlogSummary(content: string, keyPoints: string[], title: string): string {
  return `## ${title}: Key Takeaways

${keyPoints[0] || 'This content explores important topics'} — and that's just the beginning.

In this ${content.length > 5000 ? 'comprehensive' : 'focused'} piece, we cover:

${keyPoints.map(p => `- **${p.split(' ').slice(0, 4).join(' ')}:** ${p}`).join('\n')}

Whether you're [audience segment 1] or [audience segment 2], these insights apply to your work.

**The bottom line:** ${keyPoints[0] || 'There\'s actionable value here.'}

[Read the full version for examples, data, and implementation details →]`;
}

function generateNewsletterSection(content: string, keyPoints: string[], keyMessage: string): string {
  return `${keyPoints[0] || 'Key insight from this content.'}

Here's the quick version:

${keyPoints.slice(1, 4).map(p => `• ${p}`).join('\n')}

${keyMessage || 'Worth your time if you care about this topic.'}`;
}

function extractQuotes(content: string, keyPoints: string[]): string[] {
  // Look for actual quotes in content
  const quotesInContent = content.match(/"[^"]{20,150}"/g) || [];
  
  // Generate quotable statements from key points
  const generated = keyPoints.slice(0, 3).map(p => {
    const words = p.split(' ');
    if (words.length > 15) {
      return words.slice(0, 12).join(' ') + '...';
    }
    return p;
  });
  
  return [...quotesInContent.map(q => q.replace(/"/g, '')), ...generated].slice(0, 5);
}

function getPlatform(format: string): string {
  const platforms: Record<string, string> = {
    linkedin_post: 'LinkedIn',
    twitter_thread: 'Twitter/X',
    email: 'Email list',
    blog_summary: 'Blog',
    infographic_outline: 'Instagram, Pinterest',
    video_script: 'YouTube, TikTok',
    podcast_talking_points: 'Podcast',
    slide_deck_outline: 'SlideShare, presentations',
    quote_cards: 'All social',
    newsletter_section: 'Newsletter'
  };
  return platforms[format.toLowerCase().replace(/\s+/g, '_')] || 'Multiple';
}

function getBestTime(format: string): string {
  const times: Record<string, string> = {
    linkedin_post: 'Tue-Thu 8-10am',
    twitter_thread: 'Mon-Fri 12pm',
    email: 'Tue 10am',
    blog_summary: 'Tuesday AM',
    infographic_outline: 'Wed/Sun',
    video_script: 'Sat/Sun',
    podcast_talking_points: 'Monday AM',
    slide_deck_outline: 'Anytime',
    quote_cards: 'Daily',
    newsletter_section: 'Weekly'
  };
  return times[format.toLowerCase().replace(/\s+/g, '_')] || 'Varies';
}

function getEngagementGoal(format: string): string {
  const goals: Record<string, string> = {
    linkedin_post: 'Comments, shares',
    twitter_thread: 'Retweets, follows',
    email: 'Opens, clicks',
    blog_summary: 'Traffic, time on page',
    infographic_outline: 'Saves, shares',
    video_script: 'Watch time, subs',
    podcast_talking_points: 'Downloads, reviews',
    slide_deck_outline: 'Views, downloads',
    quote_cards: 'Shares, saves',
    newsletter_section: 'Click-through'
  };
  return goals[format.toLowerCase().replace(/\s+/g, '_')] || 'Engagement';
}
