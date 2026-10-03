import { countWords, SUGGESTION_FOOTER, aOrAn } from './utils.js';
import { splitItems, pickKeyPoints, readContext, audienceLine, firstSentence, sentencesOf, q, type Vertical } from './sector.ts';
import { parseProof, fixNumbers, endSentence, shortenClauses, proseJoin, KIND_NOTE, type ProofItem } from './draft.ts';

// Default formats when user doesn't specify
const DEFAULT_FORMATS = ['linkedin_post', 'twitter_thread', 'email', 'blog_summary', 'quote_cards'];
const KNOWN_FORMATS = ['linkedin_post', 'twitter_thread', 'email', 'blog_summary', 'quote_cards', 'infographic_outline', 'video_script', 'podcast_talking_points', 'slide_deck_outline', 'newsletter_section'];

// Run 19 (D80, problem 3): brand_voice changes the closing line of the posts and the thread, and is named here.
const VOICE_NOTE: Record<string, string> = {
  professional: 'the closing question and the calls to action below are written plainly and formally; the sentences taken from your source are kept as you wrote them (a long one is shortened at a clause boundary in posts and tweets only).',
  casual: 'the closing question and the calls to action below are written in a relaxed tone; the sentences taken from your source are kept as you wrote them (a long one is shortened at a clause boundary in posts and tweets only).',
  authoritative: 'the closing line below states a position instead of asking a question; the sentences taken from your source are kept as you wrote them (a long one is shortened at a clause boundary in posts and tweets only).',
  friendly: 'the closing question and the calls to action below are written warmly; the sentences taken from your source are kept as you wrote them (a long one is shortened at a clause boundary in posts and tweets only).',
  bold: 'the closing line below takes a side and asks the reader to agree or disagree; the sentences taken from your source are kept as you wrote them (a long one is shortened at a clause boundary in posts and tweets only).'
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
  const content = fixNumbers(args.source_content);
  const sourceType = args.source_type;
  const targetFormats = args.target_formats ? splitItems(args.target_formats) : DEFAULT_FORMATS;
  const voice = args.brand_voice || 'professional';
  const keyMessage = fixNumbers(args.key_message || '').trim();

  // Proof paragraphs ("Proof: ..." or "Results: ...") are read as proof items; the rest of the source gives the key points.
  const paras = content.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const proofParas = paras.filter((l) => /^(?:proof|results?|evidence|customer results?)\s*:/i.test(l));
  const proof = parseProof(proofParas.map((l) => l.replace(/^[A-Za-z ]+:\s*/, '')).join('\n'));
  const body = paras.filter((l) => !proofParas.includes(l)).join('\n');
  const titleInfo = extractTitle(body, keyMessage);
  const title = titleInfo.title;
  const pointsFull = dedupe(pickKeyPoints(body, keyMessage, titleInfo.fromSource ? title : '', 5)).map(cleanPoint);
  const points = pointsFull.map((p) => shortenClauses(p, 260));
  const wordCount = countWords(content);
  const ctx = readContext(undefined, { context: [keyMessage, content, title] });
  const hook = titleInfo.fromSource ? title : keyMessage ? shortenClauses(keyMessage, 160) : shortenClauses(firstSentence(body), 160);
  const unknown = targetFormats.map((f) => f.toLowerCase().replace(/\s+/g, '_')).filter((f) => !KNOWN_FORMATS.includes(f));
  const customerProof = proof.filter((p) => p.kind === 'result' || p.kind === 'quote' || (p.kind === 'title' && p.figure));
  const bestProof = ['result', 'quote', 'title'].map((kind) => customerProof.find((p) => p.kind === kind && p.figure)).find(Boolean) || customerProof[0];
  const otherProof = proof.filter((p) => !customerProof.includes(p));
  const tags = hashtags(content, keyMessage, ctx.v);
  const k: Kit = { points, pointsFull, proof, bestProof, hook, title, voice, keyMessage, kind: sourceType.replace(/_/g, ' '), v: ctx.v, tags, content };

  let output = `# Content Repurposing Kit

## Source Content Analysis

| Attribute | Value |
|-----------|-------|
| **Source Type** | ${sourceType.replace(/_/g, ' ')} |
| **Word Count** | ${wordCount} |
| **Key Points Found** | ${points.length} |
| **Proof Items Found** | ${proof.length}${proof.length ? ` (${customerProof.length} usable as results or quotes, ${otherProof.length} kept out: ${otherProof.map((p) => KIND_NOTE[p.kind]).filter((x, i, a) => a.indexOf(x) === i).join('; ') || 'none'})` : ''} |
| **Brand Voice** | ${voice}${args.brand_voice ? '' : ' (default)'} |
| **Core Message** | ${keyMessage || points[0] || 'not found'} |
| **Formats** | ${args.target_formats ? 'Custom selection' : 'Default top 5'} |

### Key Points Extracted
${points.length ? pointsFull.map((p, i) => `${i + 1}. ${shortenClauses(p, 400)}`).join('\n') : 'No full sentence of 25 characters or more was found in the source, so there are no key points. Paste the finished text or add a key_message.'}

*Chosen as whole sentences from your source, in its order: a point scores for an opener such as First or Second, a name, a figure, a result word and the words of your key message. In the posts and tweets a sentence over 260 characters is shortened at a clause boundary (never in the middle of a phrase); the lines above and the blog summary keep the longer form.*

**Brand voice (${voice}):** ${VOICE_NOTE[voice] || VOICE_NOTE.professional}

### Proof Used
${proof.length ? proof.map((p) => `- ${endSentence(capFirstChar(p.shown))} *(${KIND_NOTE[p.kind]}${customerProof.includes(p) ? '' : '; not used as a result'})*`).join('\n') : '- The source holds no proof line (a line that starts "Proof:" or "Results:"), so the posts carry no result. Add one customer result with its figure to make the posts stronger.'}

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

  for (const format of targetFormats) {
    const key = format.toLowerCase().replace(/\s+/g, '_');
    if (!KNOWN_FORMATS.includes(key)) continue; // named above as not a format this tool writes
    output += generateFormat(key, k);
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

function capFirstChar(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

// Sentences built as "<audience> are asked to deliver: <what>" and "<topic>: what to do about <problem>" are kept as the part that
// says something; "The obstacle is <x>" becomes "The obstacle: <x>".
function cleanPoint(p: string): string {
  const t = p.trim();
  const deliver = /^.{3,400}?\b(?:are|is) asked to deliver:\s*(.+)$/i.exec(t);
  if (deliver) return `The audience is asked to deliver: ${deliver[1]}`;
  const todo = /^.{3,300}?:\s*what to do about\s+(.+)$/i.exec(t);
  if (todo) return `The problem: ${todo[1]}`;
  return t.replace(/^The obstacle is\s+/i, 'The obstacle: ');
}

// Two key points that say the same thing (more than half of their long words shared) are one point; the earlier stays.
function dedupe(points: string[]): string[] {
  const words = (s: string) => new Set((s.toLowerCase().match(/[a-z]{4,}/g) || []));
  const out: string[] = [];
  for (const p of points) {
    const a = words(p);
    const same = out.some((o) => { const b = words(o); const shared = [...a].filter((w) => b.has(w)).length; return shared / Math.max(1, Math.min(a.size, b.size)) > 0.6; });
    if (!same) out.push(p);
  }
  return out;
}

function extractTitle(content: string, keyMessage: string): { title: string; fromSource: boolean } {
  // Try to extract title from headers or a short first line that stands apart from the text
  const headerMatch = content.match(/^#\s+(.+)$/m);
  if (headerMatch) return { title: shortenClauses(headerMatch[1], 100), fromSource: true };

  const lines = content.split('\n').filter((l) => l.trim());
  const firstLine = (lines[0] || '').trim();
  if (firstLine.length < 100 && lines.length > 1) return { title: firstLine.replace(/[.!?]+\s*$/, ''), fromSource: true };

  // Run 12 (R12-20): never the word "Content" as a title: the key message, or else the source's first sentence.
  if (keyMessage) return { title: shortenClauses(keyMessage.trim(), 100), fromSource: false };
  const first = sentencesOf(content)[0] || '';
  return { title: shortenClauses(first, 100), fromSource: false };
}

interface Kit {
  points: string[]; pointsFull: string[]; proof: ProofItem[]; bestProof: ProofItem | undefined; hook: string; title: string; voice: string;
  keyMessage: string; kind: string; v: Vertical | null; tags: string; content: string;
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

const proofLine = (k: Kit, label = 'Result'): string => k.bestProof ? (/^customer (?:quote|words):/i.test(k.bestProof.text) ? endSentence(k.bestProof.shown) : `${label}: ${endSentence(k.bestProof.shown)}`) : '';
const pointLines = (ps: string[], mark: (p: string, i: number) => string): string => ps.map(mark).join('\n');
// A line for a tweet: complete, at most 270 characters, ending at a clause boundary.
const tweet = (s: string): string => endSentence(shortenClauses(s, 270));

function generateFormat(format: string, k: Kit): string {
  const kind = k.kind;
  const close = VOICE_CLOSE[k.voice] || VOICE_CLOSE.professional;
  const lead = capFirstChar(k.hook);
  const rest = dedupe([k.hook, ...k.points]).slice(1);
  const msg = k.keyMessage ? endSentence(capFirstChar(shortenClauses(k.keyMessage, 200))) : '';
  const generators: Record<string, () => string> = {
    linkedin_post: () => `
### LinkedIn Post

---

${endSentence(lead)}

${rest.length ? `Here's what stands out:\n\n${pointLines(rest.slice(0, 4), (p, i) => `${i + 1}. ${endSentence(p)}`)}\n` : ''}${k.bestProof ? `\n${proofLine(k)}\n` : ''}${msg && msg.replace(/[.!?]+$/, '') !== lead.replace(/[.!?]+$/, '') ? `\n${msg}\n` : ''}
${close}

${k.tags}

---

**Posting Notes:**
- Post when your own audience is online: test two slots and keep what your own data shows
- Engage with comments in the first hour
- The hashtags are the sector's terms your source uses and the brand name; keep three or four

`,
    twitter_thread: () => {
      const tweets = [`${tweet(k.hook)} A thread.`, ...rest.slice(0, 5).map((p, i) => `${i + 1}/ ${tweet(p)}`)];
      if (k.bestProof) tweets.push(`${tweets.length}/ ${tweet(proofLine(k))}`);
      tweets.push(`${tweets.length}/ ${close} Full post: add the link.`);
      return `
### Twitter/X Thread

---

${tweets.map((t, i) => `**Tweet ${i + 1}${i === 0 ? ' (Hook)' : ''}:**\n${t}${t.length > 280 ? '\n*(Over 280 characters: split it into two posts.)*' : ''}`).join('\n\n')}

---

**Posting Notes:**
- One point per post; the first post carries the thread
- Each post above is a whole clause or sentence from your source, shortened at a clause boundary when it was long

`;
    },
    email: () => `
### Email Version

---

**Subject Line Options:**
1. ${k.title}${/[?!]$/.test(k.title) ? '' : ': the key points'}
2. ${subjectPoint(rest[0]) ? `What we learned: ${subjectPoint(rest[0])}` : subjectPoint(k.hook) ? `What to know: ${subjectPoint(k.hook)}` : `A short ${kind} summary`}
3. ${k.bestProof ? `Proof inside: ${shortenClauses(k.bestProof.text, 70)}` : `A short ${kind} summary for you`}

**Email Body:**

Hello,

A short summary of something worth your time:

${(rest.length ? rest : k.points).slice(0, 3).map((p) => `→ ${endSentence(p)}`).join('\n')}
${k.bestProof ? `\n${proofLine(k)}\n` : ''}
${msg}

Worth a read when you have a few minutes.

Read the full version: add the link here.

Best,
[Your name]

---

`,
    blog_summary: () => `
### Blog Summary (target: 300 words)

---

## ${k.title}: Key Takeaways

In this ${k.content.length > 5000 ? 'comprehensive' : 'focused'} piece, we cover:

${k.pointsFull.length ? k.pointsFull.map((p) => `- ${endSentence(shortenClauses(p, 400))}`).join('\n') : '- The main points of your piece (none found in the source: paste the finished text).'}
${k.bestProof ? `\n**Proof:** ${endSentence(k.bestProof.shown)}\n` : ''}
${k.v ? `This is written for readers such as ${proseJoin(k.v.buyerRoles.slice(0, 2).map((r) => r.toLowerCase().replace(/^chief /, 'chief ')))}, who watch ${proseJoin(k.v.metrics.slice(0, 3))}.\n` : ''}
${msg ? `**The bottom line:** ${msg}\n` : ''}
Read the full version for examples, data and implementation details.

---

`,
    infographic_outline: () => `
### Infographic Outline

---

**Title:** ${k.title}

**Header Section:**
- Lead with the figure or finding that matters most: ${k.bestProof ? shortenClauses(k.bestProof.shown, 160) : 'your source holds no proof line, so lead with the key message'}
- Visual: an icon for the topic

**Body Sections:**

${k.points.slice(0, 5).map((p, i) => `
**Section ${i + 1}**
- Key stat or visual: ${/\d/.test(p) ? 'the number in this point' : 'an icon that matches the point'}
- Supporting point: ${endSentence(p)}
`).join('\n')}

**Footer:**
- CTA: the one action you want viewers to take
- Branding: logo and website

---

`,
    video_script: () => `
### Video Script (60-90 seconds)

---

**HOOK: 5 seconds**
"${k.hook ? `${endSentence(capFirstChar(k.hook))}` : `Here's something important about ${q(k.title)}.`}"

**INTRO: 10 seconds**
"I just shared ${aOrAn(kind)} ${kind} on ${q(k.title)}. Here are the key takeaways."

**BODY: 45-60 seconds**
${rest.slice(0, 3).map((p, i) => `
"Point ${i + 1}: ${endSentence(p)}"
Visual: the supporting image or graphic for this point
`).join('\n')}${k.bestProof ? `\n"${proofLine(k)}"\n` : ''}
**CTA: 10 seconds**
"${msg || 'Follow for more insights like this.'} Full version: add the link."

---

`,
    podcast_talking_points: () => `
### Podcast Talking Points

---

**Episode Title:** ${k.title}: A Deep Dive

**Intro (1-2 min):**
- Hook: ${endSentence(k.hook)}
- Context: where this ${kind} came from

**Main Discussion Points:**

${k.points.map((p, i) => `
**Point ${i + 1}:** ${endSentence(p)}
- A story or example from your own work that shows it
- What it means for listeners${k.v ? ` (they watch ${k.v.metrics[i % k.v.metrics.length]})` : ''}
- One thing they can do this week
`).join('\n')}${k.bestProof ? `\n**Proof to mention:** ${endSentence(k.bestProof.shown)}\n` : ''}
**Wrap-up:**
- Key takeaway summary
- CTA for listeners
- Tease the next episode

---

`,
    slide_deck_outline: () => `
### Slide Deck Outline

---

**Slide 1: Title**
- ${k.title}
- Presenter name and date

**Slide 2: Why This Matters**
- ${endSentence(k.hook)}${k.v ? `\n- What this audience watches: ${proseJoin(k.v.metrics.slice(0, 3))}` : ''}

${k.points.map((p, i) => `
**Slide ${i + 3}**
- Main point: ${endSentence(p)}
- Supporting visual
- Key statistic: ${/\d/.test(p) ? 'the figure in this point' : 'only if your source gives one'}
`).join('\n')}${k.bestProof ? `\n**Slide ${k.points.length + 3}: Proof**\n- ${endSentence(k.bestProof.shown)}\n` : ''}
**Slide ${k.points.length + (k.bestProof ? 4 : 3)}: Summary and next step**
- ${k.points.length} key takeaways, one line each
- What to do with this information

---

`,
    quote_cards: () => `
### Quote Cards (Social Graphics)

---

${extractQuotes(k).map((qt, i) => `
**Quote Card ${i + 1}:**
> "${qt.text}"${qt.by ? `\n>\n> ${qt.by}` : ''}

- Background: a solid colour or a subtle pattern
- Font: bold and readable

`).join('\n')}${extractQuotes(k).length === 0 ? 'No sentence of 180 characters or less was found, so there is no card text. Add a short line to the source or a key_message.\n' : ''}
**Design Notes:**
- Keep text readable on mobile
- Use brand colors
- Pick the image size each platform asks for
- Each card holds one whole sentence from your source; none is cut

---

`,
    newsletter_section: () => `
### Newsletter Section

---

**Section Header:** ${k.title}

${endSentence(rest[0] || k.points[0] || k.hook)}

Here's the quick version:

${(rest.length ? rest : k.points).slice(1, 4).map((p) => `• ${endSentence(p)}`).join('\n')}
${k.bestProof ? `\n${proofLine(k)}\n` : ''}
${msg}

Read the full ${kind}: add the link.

---

`
  };

  return generators[format] ? generators[format]() : '';
}

// Quote cards: customer quotes in your proof, sentences already in quotation marks in the source, then whole key points that fit
// on a card (180 characters). A card is never cut mid-sentence.
function extractQuotes(k: Kit): { text: string; by?: string }[] {
  const out: { text: string; by?: string }[] = [];
  for (const p of k.proof) if (p.kind === 'quote' && p.text.length <= 180) out.push({ text: p.text.replace(/^(?:customer (?:quote|words)):\s*/i, ''), by: p.label ? `(${p.label})` : undefined });
  for (const m of k.content.match(/"[^"]{20,180}"/g) || []) out.push({ text: m.replace(/"/g, '') });
  const short = k.points.filter((p) => p.length <= 180);
  for (const p of short) out.push({ text: p });
  return out.filter((x, i, a) => a.findIndex((y) => y.text === x.text) === i).slice(0, 5);
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

const camel = (t: string) => t.split(/[\s-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('').replace(/[^A-Za-z0-9]/g, '');
// Hashtags: the brand named in the key message or in "At X we built" (never a random word of the text), the sector's own terms that the
// source uses, then the sector's name. With none of them, no hashtag is invented.
function hashtags(content: string, keyMessage: string, v: Vertical | null): string {
  const lower = `${content} ${keyMessage}`.toLowerCase();
  const tags: string[] = [];
  const brand = /^([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)?)\s*:/.exec(keyMessage.trim()) || /\bAt ([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)?) we\b/.exec(content);
  if (brand) tags.push(camel(brand[1]));
  if (v) for (const term of v.vocabulary) if (tags.length < 4 && lower.includes(term.toLowerCase())) tags.push(camel(term));
  if (v && tags.length < 4) tags.push(camel(v.name));
  const uniq = tags.filter((t, i) => t && tags.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i);
  return uniq.length ? uniq.map((t) => `#${t}`).join(' ') : 'Hashtags: none are suggested because the source names no brand and no sector term. Add the brand name and one term your readers search for.';
}
