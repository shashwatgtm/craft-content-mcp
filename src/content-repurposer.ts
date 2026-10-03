import { countWords, aOrAn } from './utils.js';
import { splitItems, pickKeyPoints, readContext, audienceLine, firstSentence, sentencesOf, q, type Vertical } from './sector.ts';
import { parseProof, fixNumbers, endSentence, shortenClauses, proseJoin, makeHashtags, brandFrom, KIND_NOTE, FIGURE, type ProofItem } from './draft.ts';

// Run 21c (draft rewrite): the kit is a set of finished pieces, one per channel, built from the source, the key message, the proof and the
// voice. Each piece uses whole sentences of the source (a long one is shortened at a clause boundary in posts and tweets only). Nothing is
// added that the inputs or src/verticals.ts do not hold: no figure, no quote, no customer (B82). What the notes below the pieces say about
// the source (key points, proof, sector) stays; what the user must add by hand is said once, in one line at the top.

// Default formats when user doesn't specify
const DEFAULT_FORMATS = ['linkedin_post', 'twitter_thread', 'email', 'blog_summary', 'quote_cards'];
const KNOWN_FORMATS = ['linkedin_post', 'twitter_thread', 'email', 'blog_summary', 'quote_cards', 'infographic_outline', 'video_script', 'podcast_talking_points', 'slide_deck_outline', 'newsletter_section'];

// Run 19 (D80, problem 3): brand_voice changes the greeting, the sign-off and the closing line, and is named in the notes.
const VOICE: Record<string, { greet: string; bye: string; close: string }> = {
  professional: { greet: 'Hello,', bye: 'Best regards,', close: 'What is your view?' },
  casual: { greet: 'Hi there,', bye: 'Cheers,', close: 'What do you think?' },
  authoritative: { greet: 'Hello,', bye: 'Regards,', close: 'That is the position.' },
  friendly: { greet: 'Hi,', bye: 'Warm regards,', close: 'We would love to hear your take.' },
  bold: { greet: 'Hi,', bye: 'Talk soon,', close: 'Agree or disagree?' },
};
const VOICE_NOTE: Record<string, string> = {
  professional: 'plain and formal greeting, sign-off and closing question',
  casual: 'relaxed greeting, sign-off and closing question',
  authoritative: 'a closing line that states a position instead of asking',
  friendly: 'a warm greeting, sign-off and closing line',
  bold: 'a closing line that asks the reader to agree or disagree',
};

const VENDOR_SENTENCE = /^(?:[A-Z][\w&.-]*(?:\s[A-Z][\w&.-]*)?\s+(?:is|are|helps?|gives|lets|makes|provides|offers|builds|sells|runs|sends|turns|connects|automates)\b|At [A-Z][\w&.-]*(?:\s[A-Z][\w&.-]*)? we (?:built|build|make|made|offer|sell))/;

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
  const voice = args.brand_voice && VOICE[args.brand_voice] ? args.brand_voice : 'professional';
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
  // The sentence that says what the company is or sells ("X is ...", "X helps ...", "At X we built ...") is the seller's own description and is read first.
  const vendorSentence = sentencesOf(body).find((x) => VENDOR_SENTENCE.test(x)) || '';
  const ctx = readContext(undefined, { seller: [vendorSentence.slice(0, 200), (paras[0] || '').split(/:\s*what to do about\b/i)[0].slice(0, 150)].filter(Boolean), context: [keyMessage, content, title] });
  const hook = titleInfo.fromSource && title.split(/\s+/).length > 4 ? title : keyMessage ? shortenClauses(keyMessage, 160) : shortenClauses(firstSentence(body), 160);
  const keys = targetFormats.map((f) => f.toLowerCase().replace(/\s+/g, '_'));
  const unknown = keys.filter((f) => !KNOWN_FORMATS.includes(f));
  const known = keys.filter((f) => KNOWN_FORMATS.includes(f));
  const customerProof = proof.filter((p) => p.kind === 'result' || p.kind === 'quote' || (p.kind === 'title' && p.figure));
  const bestProof = ['result', 'quote', 'title'].map((kind) => customerProof.find((p) => p.kind === kind && p.figure)).find(Boolean) || customerProof[0];
  const otherProof = proof.filter((p) => !customerProof.includes(p));
  const tags = hashtags(content, keyMessage, ctx.v);
  const kind = sourceType.replace(/_/g, ' ');
  const k: Kit = { points, pointsFull, proof, bestProof, hook, title, voice, keyMessage, kind, v: ctx.v, tags: /^Hashtags:/.test(tags) ? '' : tags, content };

  // What the user must supply or add by hand, once.
  const notGiven: string[] = [];
  if (!proof.length) notGiven.push('Not given: a proof line. The source has no line that starts "Proof:" or "Results:", so no piece carries a customer result; add one customer result with its figure to the source to make the pieces stronger.');
  if (!keyMessage) notGiven.push('Not given: key_message. The hooks come from the source\'s title or first sentence; add key_message to set the core message.');
  if (!points.length) notGiven.push('Not given: a full sentence of 25 characters or more. The source has no key points to carry, so paste the finished text or add a key_message.');
  const places: string[] = [];
  if (known.includes('email')) places.push(`the "Read the full ${kind}" line of the email`);
  if (known.includes('newsletter_section')) places.push(`the "Read the full ${kind}" line of the newsletter section`);
  if (known.includes('twitter_thread')) places.push('the last tweet');
  if (known.includes('video_script')) places.push('the video description');
  const toDo = [places.length ? `link ${proseJoin(places)} to the full ${kind}` : '', known.includes('email') ? 'add the sender\'s name under the email sign-off' : ''].filter(Boolean);
  const beforeUse = toDo.length ? `Before you use it: ${proseJoin(toDo)}.` : '';

  // Sentences of the source that no piece carries: the key points are the five the rule chose; the others are named in one line.
  const wordSet = (s: string) => new Set((s.toLowerCase().match(/[a-z]{4,}/g) || []).map((w) => w.slice(0, 5)));
  const carried = [title, ...pointsFull, keyMessage].filter(Boolean).map(wordSet);
  const left = sentencesOf(body).filter((s) => s.length >= 25).filter((s) => { const w = wordSet(s); if (!w.size) return false; return !carried.some((c) => [...w].filter((x) => c.has(x)).length / w.size > 0.7); });
  const notUsed = left.length ? `Not used in the draft: ${left.length} ${left.length === 1 ? 'sentence' : 'sentences'} of the source (${left.slice(0, 3).map((s) => `"${s.split(/\s+/).slice(0, 6).join(' ')}"`).join(', ')}${left.length > 3 ? ' and others' : ''}), because the pieces carry the ${points.length} key points the selection rule chose.` : '';

  let output = `# Content Repurposing Kit

${[...notGiven, beforeUse, notUsed].filter(Boolean).join('\n')}
${unknown.length ? `\n${unknown.map((f) => `${f.replace(/_/g, ' ')} is not a format this tool writes. Choose from: ${KNOWN_FORMATS.join(', ')}.`).join('\n')}\n` : ''}
## Repurposed Content

`;

  for (const key of known) output += generateFormat(key, k);

  output += `
---

## Source Notes

| Attribute | Value |
|-----------|-------|
| **Source Type** | ${kind} |
| **Word Count** | ${wordCount} |
| **Key Points Found** | ${points.length} |
| **Proof Items Found** | ${proof.length}${proof.length ? ` (${customerProof.length} usable as results or quotes, ${otherProof.length} kept out: ${otherProof.map((p) => KIND_NOTE[p.kind]).filter((x, i, a) => a.indexOf(x) === i).join('; ') || 'none'})` : ''} |
| **Brand Voice** | ${voice}${args.brand_voice ? '' : ' (default)'} |
| **Core Message** | ${keyMessage || points[0] || 'not found'} |
| **Formats** | ${args.target_formats ? 'Custom selection' : 'Default top 5'} |

### Key Points Extracted
${points.length ? pointsFull.map((p, i) => `${i + 1}. ${shortenClauses(p, 400)}`).join('\n') : 'None found.'}

*Chosen as whole sentences from your source, in its order. In the posts and tweets a sentence over 260 characters is shortened at a clause boundary; the list above and the blog summary keep the longer form.*

**Brand voice (${voice}):** ${VOICE_NOTE[voice]}; the sentences taken from your source are kept as you wrote them.

### Proof Used
${proof.length ? proof.map((p) => `- ${endSentence(capFirstChar(p.shown))} *(${KIND_NOTE[p.kind]}${customerProof.includes(p) ? '' : '; not used as a result'})*`).join('\n') : '- None: the source holds no proof line.'}
${/^Hashtags:/.test(tags) ? `\n${tags}\n` : ''}
---

## Sector Notes

### Audience Notes

${ctx.line}
${ctx.v ? `- ${audienceLine(ctx.v)}
- If your source has a figure for one of these measures, put it in the first line of each piece: ${ctx.v.metrics.slice(0, 4).join(', ')}.
- **Terms this audience uses:** ${ctx.v.vocabulary.slice(0, 6).join(', ')}.
- **A proof point that lands:** ${ctx.v.proofShape}` : '- Name the audience or the product category in the source to get notes in the sector\'s own language.'}
`;

  return output;
}

function capFirstChar(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

// Sentences built as "<audience> are asked to deliver: <what>" and "<topic>: what to do about <problem>" are kept as the part that
// says something; "The obstacle is <x>" becomes "The obstacle: <x>".
function cleanPoint(p: string): string {
  const t = p.trim();
  const cap1 = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  const deliver = /^.{3,400}?\b(?:are|is) asked to deliver:\s*(.+)$/i.exec(t);
  if (deliver) return cap1(deliver[1]);
  const todo = /^.{3,300}?:\s*what to do about\s+(.+)$/i.exec(t);
  if (todo) return `The problem: ${todo[1]}`;
  const built = /^At ([A-Z][\w&.-]*(?:\s[A-Z][\w&.-]*)?) we built (?:[\w&.\s-]+?) around (?:this|these)(?:\s+\w+)?:\s*(.+)$/.exec(t);
  if (built) return `What ${built[1]} built: ${built[2]}`;
  return t.replace(/^The obstacle is\s+/i, 'The obstacle: ');
}
// A line fit for a subject line: a whole clause of at most `max` characters, else nothing (never a cut phrase).
function subjectSafe(text: string | undefined, max: number): string {
  if (!text) return '';
  const t = shortenClauses(text.replace(/^(?:The problem|The obstacle|What [\w&.\s-]+ built):\s*/, ''), max);
  return t.length <= max && !/\.\.\.$/.test(t) ? t : '';
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

// The best proof as a line: a customer quote is shown as its words and the person named; a result or a story is shown as typed, with its label.
const proofLine = (k: Kit, label = 'Result'): string => {
  const p = k.bestProof;
  if (!p) return '';
  const m = /^(?:customer|partner) (?:quote|words)(?: from)?\s*(.*?):\s*["“](.+?)["”]\.?$/i.exec(p.text);
  const tag = p.label ? ` (${p.label})` : '';
  if (m) { const who = m[1].trim().replace(/^from\s+/i, ''); return endSentence(`A customer${who ? `, ${who},` : ''} says: "${m[2]}"${tag}`); }
  if (/^customer (?:quote|words):/i.test(p.text)) return endSentence(p.shown);
  return `${p.kind === 'title' ? 'Customer story' : label}: ${endSentence(p.shown)}`;
};
// A line for a tweet: complete, at most 270 characters, ending at a clause boundary.
const tweet = (s: string): string => endSentence(shortenClauses(s, 270));
const stemSet = (s: string) => new Set((s.toLowerCase().match(/[a-z]{4,}/g) || []).map((w) => w.slice(0, 5)));
// The sector measure a sentence shares words with, or nothing: a point is tied to a measure only when it names it.
function metricFor(k: Kit, text: string): string {
  if (!k.v) return '';
  const t = stemSet(text);
  let best = ''; let n = 0;
  for (const m of k.v.metrics) { const c = [...stemSet(m)].filter((x) => t.has(x)).length; if (c > n) { best = m; n = c; } }
  return best;
}
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function generateFormat(format: string, k: Kit): string {
  const kind = k.kind;
  const vc = VOICE[k.voice] || VOICE.professional;
  const lead = capFirstChar(k.hook);
  const rest = dedupe([k.hook, ...k.points]).slice(1);
  const msgRaw = k.keyMessage ? endSentence(capFirstChar(shortenClauses(k.keyMessage, 200))) : '';
  // the key message is said again only when the hook has not already said it
  const msg = msgRaw && !norm(msgRaw).includes(norm(k.hook)) && !norm(k.hook).includes(norm(msgRaw)) ? msgRaw : '';
  const proof = proofLine(k);
  const close = k.voice === 'authoritative' && k.bestProof ? 'That is the position, and the evidence above supports it.' : vc.close;
  const spoken = (s: string) => s.replace(/"/g, "'");
  const roles = k.v ? proseJoin(k.v.buyerRoles.slice(0, 2).map((r) => r.toLowerCase())) : '';

  const generators: Record<string, () => string> = {
    linkedin_post: () => `
### LinkedIn Post

---

${[endSentence(lead), ...rest.slice(0, 4).map((p) => endSentence(p)), proof, msg, close, k.tags].filter(Boolean).join('\n\n')}

---

`,
    twitter_thread: () => {
      const tweets = [`${tweet(k.hook)} A thread.`, ...rest.slice(0, 5).map((p, i) => `${i + 1}/ ${tweet(p)}`)];
      if (k.bestProof) tweets.push(`${tweets.length}/ ${tweet(proof)}`);
      tweets.push(`${tweets.length}/ ${[msg ? tweet(msg) : '', close].filter(Boolean).join(' ')}`);
      return `
### Twitter/X Thread

---

${tweets.map((t, i) => `**Tweet ${i + 1}${i === 0 ? ' (Hook)' : ''}:**\n${t}${t.length > 280 ? '\n*(Over 280 characters: split it into two posts.)*' : ''}`).join('\n\n')}

---

`;
    },
    email: () => {
      const s1 = subjectSafe(k.title, 70) ? subjectSafe(k.title, 70) : subjectSafe(k.hook, 70) ? subjectSafe(k.hook, 70) : `A short ${kind} summary`;
      const alts = [
        subjectSafe(rest[0], 60) ? `What we learned: ${subjectSafe(rest[0], 60)}` : '',
        k.bestProof && subjectSafe(k.bestProof.text.replace(/^Customer (?:quote|words)(?: from [^:]*)?:\s*/i, '').replace(/^["“]|["”]$/g, ''), 60) ? `${k.bestProof.kind === 'title' ? 'A customer story' : 'Proof inside'}: ${subjectSafe(k.bestProof.text.replace(/^Customer (?:quote|words)(?: from [^:]*)?:\s*/i, '').replace(/^["“]|["”]$/g, ''), 60)}` : '',
      ].filter((x) => x && norm(x) !== norm(s1));
      return `
### Email Version

---

Subject: ${s1}

${vc.greet}

${[subjectSafe(k.title, 70) === s1 ? '' : endSentence(lead), ...(rest.length ? rest : k.points).slice(0, 3).map((p) => endSentence(p)), proof, msg, `Read the full ${kind}`].filter(Boolean).join('\n\n')}

${vc.bye}

${alts.length ? `Other subject lines to test: ${alts.join('; ')}\n\n` : ''}---

`;
    },
    blog_summary: () => `
### Blog Summary

---

**${k.title}**

${endSentence(lead)}

${k.pointsFull.length ? k.pointsFull.map((p) => `- ${endSentence(shortenClauses(p, 400))}`).join('\n') : 'No key point was found in the source: paste the finished text.'}
${k.bestProof ? `\n**Proof:** ${endSentence(k.bestProof.shown)}\n` : ''}
${k.v ? `This is written for readers such as ${roles}, who watch ${proseJoin(k.v.metrics.slice(0, 3))}.\n` : ''}
${msg || msgRaw ? `**The bottom line:** ${msgRaw}\n` : ''}
---

`,
    infographic_outline: () => {
      const figs = (p: string) => (FIGURE.exec(p) || [''])[0];
      return `
### Infographic Outline

---

**Title:** ${k.title}

**Lead figure:** ${k.bestProof ? endSentence(shortenClauses(k.bestProof.shown, 200)) : `the source holds no proof line, so the lead is the key message: ${msgRaw || endSentence(lead)}`}

${k.points.slice(0, 5).map((p, i) => `**Panel ${i + 1}:** ${endSentence(p)}${figs(p) ? `\nFigure to feature: ${figs(p)}` : ''}`).join('\n\n')}

**Closing line:** ${msgRaw || endSentence(lead)}

---

`;
    },
    video_script: () => `
### Video Script (60 to 90 seconds)

---

**Hook (5 seconds)**
"${spoken(endSentence(lead))}"

**Intro (10 seconds)**
"This ${kind} is called ${spoken(q(k.title))}. Here is what is in it."

**Body (45 to 60 seconds)**
${(rest.length ? rest : k.points).slice(0, 3).map((p, i) => `
Spoken: "${spoken(endSentence(p))}"${/\d/.test(p) ? `\nOn screen: ${(FIGURE.exec(p) || [(p.match(/\d[\d.,%]*/) || [''])[0]])[0]}` : ''}`).join('\n')}${k.bestProof ? `\n\nSpoken: "${spoken(proofLine(k, 'The result'))}"` : ''}

**Call to action (10 seconds)**
"${spoken(msg || close)} The full ${kind} is linked in the description."

---

`,
    podcast_talking_points: () => `
### Podcast Talking Points

---

**Episode title:** ${k.title}

**Opening line:** ${endSentence(lead)}

${k.points.map((p, i) => `**Point ${i + 1}:** ${endSentence(p)}${metricFor(k, p) ? `\nFor listeners: this bears on ${metricFor(k, p)}.` : ''}`).join('\n\n')}
${k.bestProof ? `\n**Proof to mention:** ${endSentence(k.bestProof.shown)}\n` : ''}
**Closing line:** ${msg || msgRaw || close}

---

`,
    slide_deck_outline: () => `
### Slide Deck Outline

---

**Slide 1: ${k.title}**
- ${endSentence(lead)}

${k.points.map((p, i) => `**Slide ${i + 2}**\n- ${endSentence(p)}${/\d/.test(p) ? `\n- Figure on the slide: ${(FIGURE.exec(p) || [(p.match(/\d[\d.,%]*/) || [''])[0]])[0]}` : ''}`).join('\n\n')}
${k.bestProof ? `\n**Slide ${k.points.length + 2}: Proof**\n- ${endSentence(k.bestProof.shown)}\n` : ''}
**Slide ${k.points.length + (k.bestProof ? 3 : 2)}: ${msgRaw ? 'The key message' : 'Summary'}**
- ${msgRaw || k.points.map((p) => endSentence(shortenClauses(p, 80))).slice(0, 2).join(' ')}
${k.v ? `- Measures this audience watches: ${proseJoin(k.v.metrics.slice(0, 3))}` : ''}

---

`,
    quote_cards: () => {
      const cards = extractQuotes(k);
      return `
### Quote Cards

---

${cards.length ? cards.map((qt, i) => `**Quote Card ${i + 1}:**
> "${qt.text}"${qt.by ? `\n>\n> ${qt.by}` : ''}
`).join('\n') : 'No sentence of 180 characters or less was found, so there is no card text. Add a short line to the source or a key_message.\n'}
---

`;
    },
    newsletter_section: () => `
### Newsletter Section

---

**${k.title}**

${endSentence(rest[0] || k.points[0] || k.hook)}

${(rest.length ? rest : k.points).slice(1, 4).map((p) => `- ${endSentence(p)}`).join('\n')}

${[proof, msg, `Read the full ${kind}`].filter(Boolean).join('\n\n')}

---

`,
  };

  return generators[format] ? generators[format]() : '';
}

// Quote cards: customer quotes in your proof, sentences already in quotation marks in the source, then whole key points that fit
// on a card (180 characters). A card is never cut mid-sentence.
function extractQuotes(k: Kit): { text: string; by?: string }[] {
  const out: { text: string; by?: string }[] = [];
  for (const p of k.proof) if (p.kind === 'quote' && /customer quote|customer words/i.test(`${p.label} ${p.text}`) && /\b(?:we|our|us|my|I)\b/.test(p.text.replace(/^[^:]{0,60}:\s*/, '')) && p.text.length <= 180) out.push({ text: p.text.replace(/^(?:customer (?:quote|words)):\s*/i, ''), by: p.label ? `(${p.label})` : undefined });
  for (const m of k.content.match(/"[^"]{20,180}"/g) || []) out.push({ text: m.replace(/"/g, '') });
  const short = k.points.filter((p) => p.length <= 180 && !/^(?:The problem|The obstacle|What [\w&.\s-]+ built):/.test(p));
  for (const p of short) out.push({ text: p });
  return out.filter((x, i, a) => a.findIndex((y) => y.text === x.text) === i).slice(0, 5);
}

// Hashtags: the brand named in the key message or in "At X we built" (never a random word of the text), the sector's own terms that the
// source uses, then the sector's name. With none of them, no hashtag is invented.
function hashtags(content: string, keyMessage: string, v: Vertical | null): string {
  return makeHashtags(`${content} ${keyMessage}`, brandFrom(keyMessage, content), v);
}
