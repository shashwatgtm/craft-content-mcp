import { countWords, SUGGESTION_FOOTER, clipEcho, topicWords, aOrAn, cap } from './utils.js';
import { splitItems, pickKeyPoints, readContext, audienceLine, firstSentence, sentencesOf, q, type Vertical } from './sector.ts';

// Default formats when user doesn't specify
const DEFAULT_FORMATS = ['linkedin_post', 'twitter_thread', 'email', 'blog_summary', 'quote_cards'];
const KNOWN_FORMATS = ['linkedin_post', 'twitter_thread', 'email', 'blog_summary', 'quote_cards', 'infographic_outline', 'video_script', 'podcast_talking_points', 'slide_deck_outline', 'newsletter_section'];

// Run 19 (D80, problem 3): brand_voice changes the closing line of the posts and the thread, and is named here.
const VOICE_NOTE: Record<string, string> = {
  professional: 'the closing question and the calls to action below are written plainly and formally; the sentences taken from your source are kept as you wrote them.',
  casual: 'the closing question and the calls to action below are written in a relaxed tone; the sentences taken from your source are kept as you wrote them.',
  authoritative: 'the closing line below states a position instead of asking a question; the sentences taken from your source are kept as you wrote them.',
  friendly: 'the closing question and the calls to action below are written warmly; the sentences taken from your source are kept as you wrote them.',
  bold: 'the closing line below takes a side and asks the reader to agree or disagree; the sentences taken from your source are kept as you wrote them.'
};
const VOICE_CLOSE: Record<string, string> = {
  professional: 'What is your view?',
  casual: 'What do you think?',
  authoritative: 'That is the position, and the evidence above supports it.',
  friendly: 'We would love to hear your take.',
  bold: 'Agree or disagree?'
};

export function generateContentRepurposer(args: {
  source_content: string;
  source_type: string;
  target_formats?: string;
  brand_voice?: string;
  key_message?: string;
}): string {
  const content = args.source_content;
  const sourceType = args.source_type;
  const targetFormats = args.target_formats ? splitItems(args.target_formats) : DEFAULT_FORMATS;
  const voice = args.brand_voice || 'professional';
  const keyMessage = args.key_message || '';

  // Run 19 (D80, problem 3): key points are whole sentences chosen by a stated rule (see pickKeyPoints in sector.ts), in the source's order.
  const titleInfo = extractTitle(content, keyMessage);
  const title = titleInfo.title;
  const keyPoints = pickKeyPoints(content, keyMessage, titleInfo.fromSource ? title : '').map((p) => clipEcho(p));
  const wordCount = countWords(content);
  const ctx = readContext(undefined, { seller: [keyMessage], context: [content, title] });
  const hook = titleInfo.fromSource ? title : firstSentence(content);
  const unknown = targetFormats.map((f) => f.toLowerCase().replace(/\s+/g, '_')).filter((f) => !KNOWN_FORMATS.includes(f));

  let output = `# Content Repurposing Kit

## Source Content Analysis

| Attribute | Value |
|-----------|-------|
| **Source Type** | ${sourceType.replace(/_/g, ' ')} |
| **Word Count** | ${wordCount} |
| **Key Points Found** | ${keyPoints.length} |
| **Brand Voice** | ${voice}${args.brand_voice ? '' : ' (default)'} |
| **Core Message** | ${keyMessage || 'Extracted from content'} |
| **Formats** | ${args.target_formats ? 'Custom selection' : 'Default top 5'} |

### Key Points Extracted
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

*Chosen as whole sentences from your source, in its order: a point scores for an opener such as First or Second, a name, a figure, a result word and the words of your key message.*

**Brand voice (${voice}):** ${VOICE_NOTE[voice] || VOICE_NOTE.professional}

### Audience Notes

${ctx.line}
${ctx.v ? `- ${audienceLine(ctx.v)}
- If your source has a figure for one of these measures, put it in the first line of each format below: ${ctx.v.metrics.slice(0, 4).join(', ')}.
- **Terms this audience uses:** ${ctx.v.vocabulary.slice(0, 6).join(', ')}.
- **A proof point that lands:** ${ctx.v.proofShape}` : '- Name the audience or the product category in the source to get notes in the sector\'s own language.'}
${unknown.length ? `\n${unknown.map((f) => `- ${f.replace(/_/g, ' ')} is not a format this tool writes. Choose from: ${KNOWN_FORMATS.join(', ')}.`).join('\n')}\n` : ''}
---

## Repurposed Content

`;

  // Generate each requested format
  for (const format of targetFormats) {
    const key = format.toLowerCase().replace(/\s+/g, '_');
    if (!KNOWN_FORMATS.includes(key)) continue; // named above as not a format this tool writes
    output += generateFormat(key, content, keyPoints, title, voice, keyMessage, sourceType, hook, ctx.v);
  }

  output += `
---

## Content Distribution Matrix

Post each format when your own audience is online: test two slots and keep what your own data shows.

| Format | Platform | Engagement Goal |
|--------|----------|-----------------|
${targetFormats.filter((f) => KNOWN_FORMATS.includes(f.toLowerCase().replace(/\s+/g, '_'))).map(f => `| ${formatName(f)} | ${getPlatform(f)} | ${getEngagementGoal(f)} |`).join('\n')}

---

## Repurposing Checklist

- [ ] Review each piece for brand consistency
- [ ] Customize for platform-specific best practices
- [ ] Update links/CTAs for each channel
- [ ] Schedule at the times that work for your audience
- [ ] Prepare responses for expected engagement
- [ ] Track performance across formats

---

${SUGGESTION_FOOTER}
`;

  return output;
}

function extractTitle(content: string, keyMessage: string): { title: string; fromSource: boolean } {
  // Try to extract title from headers or a short first line that stands apart from the text
  const headerMatch = content.match(/^#\s+(.+)$/m);
  if (headerMatch) return { title: clipEcho(headerMatch[1]), fromSource: true };

  const lines = content.split('\n').filter((l) => l.trim());
  const firstLine = (lines[0] || '').trim();
  if (firstLine.length < 100 && lines.length > 1) return { title: firstLine.replace(/[.!?]+\s*$/, ''), fromSource: true };

  // Run 12 (R12-20): never the word "Content" as a title: the key message, or else the source's first sentence.
  if (keyMessage) return { title: clipEcho(keyMessage.trim().replace(/[.!?]+$/, ''), 100), fromSource: false };
  const first = sentencesOf(content)[0] || '';
  return { title: clipEcho(first.replace(/[.!?]+$/, ''), 100), fromSource: false };
}

// Run 12 (R12-20): channel names written out in the distribution table.
function formatName(format: string): string {
  const names: Record<string, string> = {
    linkedin_post: 'LinkedIn post',
    twitter_thread: 'X thread',
    email: 'Email',
    blog_summary: 'Blog summary',
    quote_cards: 'Quote cards',
    infographic_outline: 'Infographic outline',
    video_script: 'Video script',
    podcast_talking_points: 'Podcast talking points',
    slide_deck_outline: 'Slide deck outline',
    newsletter_section: 'Newsletter section'
  };
  const key = format.toLowerCase().replace(/\s+/g, '_');
  return names[key] || format.replace(/_/g, ' ');
}

function generateFormat(
  format: string,
  content: string,
  keyPoints: string[],
  title: string,
  voice: string,
  keyMessage: string,
  sourceType: string,
  hook: string,
  v: Vertical | null
): string {
  const kind = sourceType.replace(/_/g, ' ');
  const generators: Record<string, () => string> = {
    linkedin_post: () => `
### LinkedIn Post

---

${generateLinkedInPost(content, keyPoints, voice, keyMessage, hook, v)}

---

**Posting Notes:**
- Post when your own audience is online: test two slots and keep what your own data shows
- Engage with comments in the first hour
- Add a few hashtags that your readers follow

`,
    twitter_thread: () => `
### Twitter/X Thread

---

${generateTwitterThread(content, keyPoints, title, voice)}

---

**Posting Notes:**
- Keep the thread to the points above: one point per post
- The first post carries the thread: lead with the strongest line
- Add a closing post that points to the full piece

`,
    email: () => `
### Email Version

---

**Subject Line Options:**
1. ${title}: the key points
2. ${subjectPoint(keyPoints[0]) ? `What we learned: ${subjectPoint(keyPoints[0])}` : 'What we learned: [Add the lesson, in a few words]'}
3. [First Name], don't miss this ${kind} summary

**Email Body:**

${generateEmailVersion(content, keyPoints, keyMessage)}

---

`,
    blog_summary: () => `
### Blog Summary (target: 300 words)

---

${generateBlogSummary(content, keyPoints, title, v)}

---

`,
    infographic_outline: () => `
### Infographic Outline

---

**Title:** ${title}

**Header Section:**
- Lead with the figure or finding that matters most in your source
- Visual: [Add an icon that represents the topic]

**Body Sections:**

${keyPoints.slice(0, 5).map((p, i) => `
**Section ${i + 1}**
- Key stat/visual: [Add the number from this point, or choose an icon]
- Supporting point: ${p}
`).join('\n')}

**Footer:**
- CTA: [Add the action you want viewers to take]
- Branding: Logo + website

---

`,
    video_script: () => `
### Video Script (60-90 seconds)

---

**[HOOK: 5 seconds]**
"${keyPoints[0] ? `Here's the point: ${keyPoints[0]}.` : `Here's something important about ${q(title)}.`}"

**[INTRO: 10 seconds]**
"I just shared ${aOrAn(kind)} ${kind} titled ${q(title)}. Here are the key takeaways you need to know."

**[BODY: 45-60 seconds]**
${keyPoints.slice(0, 3).map((p, i) => `
"Point ${i + 1}: ${p}"
[VISUAL: Supporting image/graphic]
`).join('\n')}

**[CTA: 10 seconds]**
"${keyMessage || 'Full version: [Add the link]. Follow for more insights like this.'}"

---

`,
    podcast_talking_points: () => `
### Podcast Talking Points

---

**Episode Title:** ${title}: A Deep Dive

**Intro (1-2 min):**
- Hook: Why this matters now
- Context: Where this ${kind} came from

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
### Slide Deck Outline

---

**Slide 1: Title**
- ${title}
- [Add the presenter name and date]

**Slide 2: Why This Matters**
- Context for the content
- Key problem being addressed

${keyPoints.map((p, i) => `
**Slide ${i + 3}**
- Main point: ${p}
- Supporting visual
- Key statistic (if your source gives one)
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
### Quote Cards (Social Graphics)

---

${extractQuotes(content, keyPoints).map((qt, i) => `
**Quote Card ${i + 1}:**
> "${qt}"

- Background: [Add a solid color or subtle pattern]
- Font: Bold, readable
- Branding: Logo bottom corner

`).join('\n')}

**Design Notes:**
- Keep text readable on mobile
- Use brand colors
- Pick the image size each platform asks for
- Add visual hierarchy with font sizes

---

`,
    newsletter_section: () => `
### Newsletter Section

---

**Section Header:** ${title}

${generateNewsletterSection(content, keyPoints, keyMessage)}

**[Read the full ${kind} →]**

---

`
  };

  return generators[format] ? generators[format]() : '';
}

function generateLinkedInPost(content: string, keyPoints: string[], voice: string, keyMessage: string, hook: string, v: Vertical | null): string {
  const lead = hook ? `${hook.charAt(0).toUpperCase() + hook.slice(1)}` : '[Add your hook]';
  const close = VOICE_CLOSE[voice] || VOICE_CLOSE.professional;
  const points = keyPoints.filter((p) => p.replace(/[.!?]+$/, '') !== hook.replace(/[.!?]+$/, ''));

  return `${lead}

${points.length > 0 ? `Here's what stands out:

${points.slice(0, 4).map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}

${keyMessage ? cap(keyMessage) : '[Add your one-line takeaway]'}

${close}

${hashtags(content, keyMessage, v)}`;
}

function generateTwitterThread(content: string, keyPoints: string[], title: string, voice: string): string {
  let thread = `**Tweet 1 (Hook):**
${title}: a thread

Here's what you need to know:\n\n`;

  keyPoints.slice(0, 6).forEach((p, i) => {
    thread += `**Tweet ${i + 2}:**
${i + 1}/ ${p}

`;
  });

  thread += `**Final Tweet:**
${Math.min(keyPoints.length, 6) + 1}/ ${VOICE_CLOSE[voice] || VOICE_CLOSE.professional}

Full post: [Add the link]`;

  return thread;
}

function generateEmailVersion(content: string, keyPoints: string[], keyMessage: string): string {
  return `Hi [First Name],

Quick summary of something important:

${keyPoints.slice(0, 3).map(p => `→ ${p}`).join('\n')}

${keyMessage ? cap(keyMessage) : 'This matters because [Add the reason].'}

Worth a read when you have a few minutes.

[CTA Button: Read the Full Version]

Best,
[Your name]`;
}

function generateBlogSummary(content: string, keyPoints: string[], title: string, v: Vertical | null): string {
  // Run 15 R15-32 (edge-case matrix): each key point is listed once, without a label cut from its first words (the first point
  // used to print three times: the opening line, a bullet and the bottom line).
  return `## ${title}: Key Takeaways

In this ${content.length > 5000 ? 'comprehensive' : 'focused'} piece, we cover:

${keyPoints.length ? keyPoints.map(p => `- ${p}`).join('\n') : '- [Add the main points of your piece]'}

[Add who this is for${v ? `, for example ${v.buyerRoles.slice(0, 2).join(' or ')}` : ''}]: these insights apply to their work.

**The bottom line:** [Add one sentence your readers should remember, in your words]

[Read the full version for examples, data, and implementation details →]`;
}

function generateNewsletterSection(content: string, keyPoints: string[], keyMessage: string): string {
  return `${keyPoints[0] || 'Key insight from this content.'}

Here's the quick version:

${keyPoints.slice(1, 4).map(p => `• ${p}`).join('\n')}

${keyMessage ? cap(keyMessage) : ''}`;
}

// Quote cards: sentences already in quotation marks in the source, then whole key points. Run 19 (D80, problem 2): a card is never
// cut mid-sentence; a sentence over 180 characters is left out unless nothing shorter exists.
function extractQuotes(content: string, keyPoints: string[]): string[] {
  // Look for actual quotes in content
  const quotesInContent = (content.match(/"[^"]{20,150}"/g) || []).map((x) => x.replace(/"/g, ''));
  const short = keyPoints.filter((p) => p.length <= 180);
  const generated = short.length ? short.slice(0, 3) : keyPoints.slice(0, 1);
  return [...quotesInContent, ...generated].slice(0, 5);
}

function getPlatform(format: string): string {
  const platforms: Record<string, string> = {
    linkedin_post: 'LinkedIn',
    twitter_thread: 'Twitter/X',
    email: 'Email list',
    blog_summary: 'Blog',
    infographic_outline: 'Image platforms',
    video_script: 'Video platforms',
    podcast_talking_points: 'Podcast',
    slide_deck_outline: 'Presentations',
    quote_cards: 'All social',
    newsletter_section: 'Newsletter'
  };
  return platforms[format.toLowerCase().replace(/\s+/g, '_')] || 'Multiple';
}

function getEngagementGoal(format: string): string {
  const goals: Record<string, string> = {
    linkedin_post: 'Comments, shares',
    twitter_thread: 'Reposts, follows',
    email: 'Opens, clicks',
    blog_summary: 'Traffic, time on page',
    infographic_outline: 'Saves, shares',
    video_script: 'Watch time, subscribers',
    podcast_talking_points: 'Downloads, reviews',
    slide_deck_outline: 'Views, downloads',
    quote_cards: 'Shares, saves',
    newsletter_section: 'Click-through'
  };
  return goals[format.toLowerCase().replace(/\s+/g, '_')] || 'Engagement';
}

// Run 12 (R12-20): a whole key point as the email subject when it is short, never one cut mid-phrase.
function subjectPoint(point: string | undefined): string {
  if (!point) return '';
  const p = point.trim().replace(/[.!?]+$/, '');
  return p.length <= 60 ? p : '';
}

// Words that make a poor hashtag.
const HASHTAG_GENERIC = new Set(['changing', 'change', 'buyers', 'buyer', 'decide', 'decision', 'things', 'thing', 'accept', 'expect', 'compare', 'measure', 'measuring', 'inside', 'outside', 'quarter', 'fixed', 'teams', 'people', 'companies', 'company', 'every', 'start', 'today', 'result', 'results', 'customer', 'customers', 'which', 'there', 'would', 'could']);
const camel = (t: string) => t.split(/[\s-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
// Run 19: hashtags are the sector's own terms that the source uses, then the longest topic words of the key message or the source's
// first sentence that are not generic. With neither, a prompt: never filler words.
function hashtags(content: string, keyMessage: string, v: Vertical | null): string {
  const lower = `${content} ${keyMessage}`.toLowerCase();
  const tags: string[] = [];
  if (v) for (const term of v.vocabulary) if (tags.length < 3 && lower.includes(term.toLowerCase())) tags.push(camel(term));
  if (tags.length < 3) {
    const base = keyMessage || (sentencesOf(content)[0] || '');
    for (const w of topicWords(base, 6)) if (tags.length < 3 && !HASHTAG_GENERIC.has(w) && !tags.some((t) => t.toLowerCase() === w)) tags.push(camel(w));
  }
  return tags.length ? tags.map((t) => `#${t}`).join(' ') : '[Add three hashtags: one for the topic, one for the sector]';
}
