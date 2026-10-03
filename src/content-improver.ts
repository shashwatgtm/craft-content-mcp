import { analyzeContent, generateImprovedVersion, toneCheck, annotateText, bodyOf, countWords, avgWordsPerSentence, calculateReadability, ContentAnalysis, SUGGESTION_FOOTER, clipEcho, ASK } from './utils.js';
import { readContext, audienceLine, sentencesOf } from './sector.ts';
import { shortenClauses, clipAtWord, endSentence, fixNumbers, FIGURE } from './draft.ts';

// Default goals by content type
const DEFAULT_GOALS: Record<string, string> = {
  blog_post: 'Engage readers and drive shares/comments',
  email: 'Get opens, clicks, and responses',
  landing_page: 'Convert visitors to signups/purchases',
  social_post: 'Drive engagement and shares',
  sales_email: 'Get meetings booked',
  product_description: 'Clearly explain value and drive purchases',
  press_release: 'Get media coverage',
  case_study: 'Build credibility and drive inquiries'
};

export function generateContentImprover(args: {
  content: string;
  content_type: string;
  goal?: string;
  audience?: string;
  tone_preference?: string;
}): string {
  const content = fixNumbers(args.content);
  const contentType = args.content_type || 'blog_post';
  const goal = args.goal || DEFAULT_GOALS[contentType] || 'Improve clarity and engagement';
  const audience = args.audience || 'general audience';

  // Note if goal was auto-assigned
  const goalNote = args.goal ? '' : ` *(auto-assigned based on content type)*`;

  // Perform actual analysis. Run 19 (D80, problem 5): every point taken off comes from a listed finding that quotes the text.
  const analysis = analyzeContent(content, contentType, goal, { audience: args.audience });
  const readability = calculateReadability(content);
  const wordCount = countWords(content);
  const avgSentenceLength = avgWordsPerSentence(content);

  // Generate improved version: real edits, each one listed; or none, said plainly
  const improved = generateImprovedVersion(content, analysis);
  const tone = toneCheck(content, args.tone_preference);
  const emailLike = contentType === 'sales_email' || contentType === 'email';
  const shorter = emailLike && (wordCount > 120 || analysis.findings.some((f) => f.rule === 'subject-length' || f.rule === 'sentence-length' || f.rule === 'run-on')) ? shorterEmail(content) : null;
  const ctx = readContext(undefined, { seller: [(content.split('\n').find((l) => l.trim()) || '').replace(/^\s*subject:\s*/i, '').slice(0, 250)], context: [content, args.goal], buyer: [args.audience] });

  // Create specific recommendations based on analysis: the findings that cost the most points first
  const priorityFixes = [...analysis.findings].sort((a, b) => b.penalty - a.penalty).slice(0, 6).map((f) => {
    const dim = f.dimension === 'goalAlignment' ? 'Goal Alignment' : f.dimension.charAt(0).toUpperCase() + f.dimension.slice(1);
    return `**${dim}** (${analysis[f.dimension].score}/10): ${f.text}${f.suggestion ? `. Fix: ${f.suggestion}` : ''}`;
  });

  const buzzFound = analysis.findings.some((f) => f.rule === 'buzzwords');
  const hardFound = analysis.findings.some((f) => f.hard);

  let output = `# Content Analysis & Improvement Report

## Content Overview
- **Type:** ${contentType.replace(/_/g, ' ')}
- **Goal:** ${goal}${goalNote}
- **Audience:** ${args.audience || 'not given (add audience to check that the text speaks to it)'}
- **Word Count:** ${wordCount}
- **Avg Sentence Length:** ${avgSentenceLength} words

---

## Overall Score: ${analysis.overall.score}/10 (${analysis.overall.rating})

*How this is scored: each score starts at 10 and loses points only for the findings listed below, each quoted from your text. The overall score is the average of the four scores and the lowest one, so one weak area cannot hide behind three strong ones. A rating of EXCELLENT is not given while a buzzword, an unproven claim, a fragment, an unfilled merge field or an unsupported claim about the reader is open. These checks do not judge whether your claims are true.*

| Dimension | Score | Status |
|-----------|-------|--------|
| Clarity | ${analysis.clarity.score}/10 | ${analysis.clarity.score >= 7 && readability.score >= 40 ? 'Yes' : analysis.clarity.score >= 5 ? 'Note' : 'No'} |
| Structure | ${analysis.structure.score}/10 | ${analysis.structure.score >= 7 ? 'Yes' : analysis.structure.score >= 5 ? 'Note' : 'No'} |
| Engagement | ${analysis.engagement.score}/10 | ${analysis.engagement.score >= 7 ? 'Yes' : analysis.engagement.score >= 5 ? 'Note' : 'No'} |
| Goal Alignment | ${analysis.goalAlignment.score}/10 | ${analysis.goalAlignment.score >= 7 ? 'Yes' : analysis.goalAlignment.score >= 5 ? 'Note' : 'No'} |

---

## Readability Analysis

**Flesch Score:** ${readability.score}/100 (${readability.grade})

${readability.analysis}

---

## Detailed Analysis

### Clarity Issues Found
${analysis.clarity.issues.length > 0
  ? analysis.clarity.issues.map(i => `- ${i}`).join('\n')
  : '- No clarity issues found by these checks'}

### Structure Issues Found
${analysis.structure.issues.length > 0
  ? analysis.structure.issues.map(i => `- ${i}`).join('\n')
  : '- No structure issues found by these checks'}

### Engagement Issues Found
${analysis.engagement.issues.length > 0
  ? analysis.engagement.issues.map(i => `- ${i}`).join('\n')
  : '- No engagement issues found by these checks'}

### Goal Alignment Issues Found
${analysis.goalAlignment.issues.length > 0
  ? analysis.goalAlignment.issues.map(i => `- ${i}`).join('\n')
  : '- No goal alignment issues found by these checks'}

---

## Priority Fixes (Do These First)

${priorityFixes.length > 0
  ? priorityFixes.map((fix, i) => `${i + 1}. ${fix}`).join('\n\n')
  : 'No fixes needed by these checks. They do not judge whether your claims are true or your offer is strong.'}

---

## Your Text, With the Findings Marked

${annotateText(content)}

---
${improved.edits.length > 0 ? `
## Edits Made

${improved.edits.slice(0, 20).map((e, i) => `${i + 1}. Before: "${clipEcho(e.before, 200)}"
   After: "${clipEcho(e.after, 200)}"`).join('\n')}${improved.edits.length > 20 ? `\n\n*The first 20 of ${improved.edits.length} edits are listed; the improved version below has all of them.*` : ''}

*Each edit replaces a buzzword with a plainer word, or removes a claim that needs proof (add it back only with proof), or splits a very long sentence. Nothing else in your text was changed.*

---
` : ''}
## Improved Version

${improved.edits.length > 0
  ? `${improved.edits.length} edit${improved.edits.length === 1 ? '' : 's'} made (listed above). Everything else is your original text.

---

${improved.text}`
  : `No automatic edits were found. The text above contains no buzzword, long sentence or unproven claim that this tool can replace on its own, so there is no improved version to show. The findings in Priority Fixes need your facts or your judgement.`}

---
${shorter ? `
## Suggested Shorter Version

${shorter.text}

*Built only from your own text: nothing was added. ${shorter.left.length ? `Left out: ${shorter.left.map((l) => `"${l}"`).join('; ')}.` : ''} Check that nothing you need is missing before you use it.*

---
` : ''}
## Before/After Comparison

### Original First Sentence:
> ${clipEcho((sentencesOf(bodyOf(content))[0] || '').replace(/[.!?]+$/, '').trim() || 'N/A', 400)}

### Suggested Opening:
> ${suggestOpening(content)}

---
${tone.notes.length > 0 ? `
## Tone Check

${tone.notes.map((n) => `- ${n}`).join('\n')}

---
` : ''}${ctx.v ? `
## What This Audience Looks For

${ctx.line}

- ${audienceLine(ctx.v)}
- **Measures readers watch:** ${ctx.v.metrics.join(', ')}.
- **Terms this audience uses:** ${ctx.v.vocabulary.join(', ')}.
- **A proof point that lands:** ${ctx.v.proofShape}
- ${measuresNamed(content, ctx.v.metrics)}
- **Questions this reader asks before they reply:** ${ctx.v.objections.map((o) => `"${o.objection}"`).join('; ')}. A text for this audience answers the first one or two in a line each.
- **Who else reads it:** ${ctx.v.committee}

---
` : ''}
## Tips for this ${contentType.replace(/_/g, ' ')}

${getContentTypeTips(contentType, goal)}

---

## Quick Checklist

${generateChecklist(contentType, goal, analysis, buzzFound, hardFound, readability.score, content)}

---

${SUGGESTION_FOOTER}
`;

  return output;
}

// Which of the sector's measures the text already names (a measure counts when one of its long words appears).
function measuresNamed(content: string, metrics: string[]): string {
  const lower = content.toLowerCase();
  const named = metrics.filter((m) => m.toLowerCase().split(/\s+/).filter((w) => w.length >= 6).some((w) => lower.includes(w)));
  return named.length
    ? `Your text already speaks to: ${named.join(', ')}.`
    : 'Your text names none of these measures. If you have a figure you can prove for one of them, put it in the first two sentences.';
}

// Run 19 (D80, problems 2 and 5): the suggested opening is built from the text itself. It is never a blank template: with no fact
// to lead with, it says what is missing.
function suggestOpening(content: string): string {
  const body = sentencesOf(bodyOf(content));
  // a piece of a sentence (split at semicolons) that holds a figure and says what changed; else one with a figure
  const pieces = body.flatMap((s) => s.split(/;\s+/)).map((x) => x.trim()).filter(Boolean);
  const outcome = /\b(?:reduc\w+|cut|cuts|saved?|saves|improv\w+|increas\w+|grew|grow|boost\w*|achiev\w+|automat\w+|consolidat\w+|expanded|faster|from \d[\d.,]*%? to|resolved|fell|rose)\b/i;
  const fig = (x: string) => FIGURE.test(x) && !/\?\s*$/.test(x) && x.split(/\s+/).length >= 4;
  const sc = (x: string) => (fig(x) ? 2 : -9) + (outcome.test(x) ? 1 : 0) + (/from \d[\d.,]*%? to|\d%|[$₹€£]\s?\d|lakhs?/i.test(x) ? 3 : 0) + (/customer|quote|case study/i.test(x) ? 2 : 0) + (/^(?:recognition|named|leader|featured)\b/i.test(x) ? -9 : 0);
  const proof = pieces.filter((x) => sc(x) > 0).sort((a, b) => sc(b) - sc(a))[0];
  if (!proof) return 'No opening can be built from this text without a fact from you. Add one specific result or one sourced observation about the reader\'s work, then lead with it and run this tool again.';
  const clean = shortenClauses(proof.replace(/[.!?]+$/, ''), 220);
  const fragment = /^[\d$₹€£]/.test(proof) && !/\b(?:is|are|was|were|has|have|had|fell|rose|grew|cut|saved?|resolves?|helps?)\b/i.test(proof);
  return fragment
    ? `Your strongest proof is "${clean}". Open with it as a full sentence that says who got it and what changed.`
    : `Lead with the proof you already have: "${clean}".`;
}

// A shorter email cut from the user's own text: a subject line of about eight words, the opening problem, the first thing the
// product does, the one proof item that holds a figure and says what changed, and the ask. Nothing is added or reworded.
function shorterEmail(content: string): { text: string; left: string[] } | null {
  const lines = content.split('\n').map((l) => l.trim());
  const subjectLine = lines.find((l) => /^subject:/i.test(l));
  const greeting = lines.find((l) => /^(?:hi|hello|dear|hey)\b[^.!?]*,?\s*$/i.test(l));
  const signIdx = lines.findIndex((l) => /^(?:thanks|thank you|best|regards|kind regards|cheers|sincerely)\b/i.test(l));
  const sign = signIdx >= 0 ? lines.slice(signIdx).filter(Boolean) : [];
  const bodyText = lines.filter((l) => l && l !== subjectLine && l !== greeting && !sign.includes(l)).join('\n');
  const sentences = sentencesOf(bodyText);
  if (sentences.length < 2) return null;
  const ask = [...sentences].reverse().find((s) => ASK.test(s));
  const rest = sentences.filter((s) => s !== ask);
  const pieces = rest.flatMap((s) => s.split(/;\s+/)).map((x) => x.trim());
  const outcome = /\b(?:reduc\w+|cut|cuts|saved?|saves|improv\w+|increas\w+|grew|grow|boost\w*|achiev\w+|automat\w+|consolidat\w+|expanded|faster|resolved|fell|rose|from \d[\d.,]*%? to)\b/i;
  const score = (x: string) => (FIGURE.test(x) ? 2 : -9) + (outcome.test(x) ? 1 : -9) + (/from \d[\d.,]*%? to|\d%|[$₹€£]\s?\d|lakhs?/i.test(x) ? 3 : 0) + (/customer|quote|case study/i.test(x) ? 2 : 0) + (/^(?:recognition|named|leader|featured)\b/i.test(x) ? -9 : 0);
  const proof = pieces.filter((x) => score(x) > 0).sort((a, b) => score(b) - score(a))[0];
  const opening = rest[0];
  const product = rest.find((s, i) => i > 0 && s !== proof && !(proof && s.includes(proof)));
  const kept: string[] = [];
  const left: string[] = [];
  const note = (orig: string, shown: string) => { const gone = orig.replace(/[.!?]+$/, '').slice(shown.length).replace(/^[,;:\s]+/, ''); if (gone.length > 12) left.push(`${clipAtWord(gone, 45)}...`); };
  const out: string[] = [];
  if (subjectLine) {
    const full = subjectLine.replace(/^subject:\s*/i, '');
    const sub = shortenClauses(full, 60);
    out.push(`Subject: ${sub}`);
    note(full, sub);
  }
  if (greeting) out.push(greeting);
  for (const s of [opening, product]) {
    if (!s) continue;
    const sh = shortenClauses(s, 170);
    out.push(endSentence(sh)); kept.push(s); note(s, sh);
  }
  if (proof) { out.push(endSentence(shortenClauses(proof, 200))); kept.push(proof); }
  if (ask) { out.push(ask); kept.push(ask); }
  out.push(...sign);
  for (const s of rest) if (!kept.includes(s)) for (const piece of s.split(/;\s+/)) if (piece !== proof && !kept.includes(piece)) left.push(`${clipAtWord(piece.replace(/\s+/g, ' '), 45)}${piece.length > 45 ? '...' : ''}`);
  if (proof && opening && !kept.includes(opening)) return null;
  const text = out.join('\n');
  return countWords(text) < countWords(content) ? { text, left: left.slice(0, 6) } : null;
}

function getContentTypeTips(contentType: string, goal: string): string {
  const tips: Record<string, string> = {
    blog_post: `
- **Length:** as long as the argument needs, and no longer
- **Subheadings:** every few paragraphs
- **Include:** At least one image, list, or quote
- **CTA placement:** Middle and end of post
- **Meta description:** one sentence that summarizes the value`,

    email: `
- **Subject line:** short, specific, personalized if possible
- **Preview text:** Complement (don't repeat) subject line
- **Length:** short enough to read on a phone
- **CTA:** One clear, specific action
- **P.S. line:** Second CTA or reminder`,

    landing_page: `
- **Headline:** Clear benefit in a few words
- **Subheadline:** Expand on how you deliver the benefit
- **Social proof:** Above the fold
- **CTA:** Visible without scrolling, repeated where the page is long
- **Form fields:** Minimize: each field reduces conversion`,

    social_post: `
- **Hook:** First line must stop the scroll
- **Format:** Short paragraphs, line breaks, emojis sparingly
- **Engagement:** Ask a question or opinion
- **Hashtags:** a few relevant tags
- **CTA:** What action do you want?`,

    sales_email: `
- **Subject:** Personalized, curiosity-driven
- **Opening:** About THEM, not you
- **Value prop:** One clear benefit
- **Proof:** Brief case study or metric
- **CTA:** Specific, low-commitment ask
- **Length:** short enough to read in under a minute`,

    product_description: `
- **Lead with benefits:** What problem it solves
- **Features as proof:** How it delivers benefits
- **Social proof:** Reviews, testimonials, ratings
- **Specifics:** what is included, sizes, materials or limits
- **Clarity:** say what it is in the first line`,

    press_release: `
- **Headline:** Newsworthy angle, not promotional
- **Lead paragraph:** Who, what, when, where, why
- **Quotes:** From executives and/or customers
- **Boilerplate:** Company description at end
- **Contact:** Clear media contact info`,

    case_study: `
- **Structure:** Challenge → Solution → Results
- **Specifics:** Named customer, real numbers
- **Quotes:** Direct customer testimonials
- **Visuals:** Screenshots, graphs, before/after
- **CTA:** "See how you can achieve similar results"`
  };

  return tips[contentType] || `
- Focus on your primary goal: ${goal}
- Match tone to audience expectations
- Include a clear call to action
- Use specific examples and data`;
}

function generateChecklist(contentType: string, goal: string, analysis: ContentAnalysis, buzzFound: boolean, hardFound: boolean, flesch: number, content: string): string {
  const checks: string[] = [];

  // Universal checks
  // The mark is chosen first, then the text is added, so a passed check keeps its text.
  // Run 19 (B16-16): the jargon tick follows the buzzword finding as well as the clarity score.
  // Run 20 (round 1b): a text that is very hard to read (Flesch under 40) is not ticked as clear.
  checks.push((analysis.clarity.score >= 7 && !buzzFound && flesch >= 40 ? 'Yes:' : '[ ]') + ` Clear, jargon-free language${flesch < 40 ? ` (Flesch ${flesch}: hard to read)` : ''}`);
  checks.push((analysis.structure.score >= 7 ? 'Yes:' : '[ ]') + ' Logical structure');
  checks.push((analysis.engagement.score >= 7 ? 'Yes:' : '[ ]') + ' Engaging opening hook');
  checks.push((analysis.goalAlignment.score >= 7 ? 'Yes:' : '[ ]') + ' Aligns with stated goal');
  checks.push((hardFound ? '[ ]' : 'Yes:') + ' No unproven claims, fragments or unfilled merge fields');

  // Content-type specific: these are read from the text
  if (contentType === 'email' || contentType === 'sales_email') {
    const subject = content.split('\n').map((l) => l.trim()).find((l) => /^subject:/i.test(l));
    const sw = subject ? countWords(subject.replace(/^subject:\s*/i, '')) : 0;
    checks.push(!subject ? '[ ] Subject line: none found in the text' : sw <= 12 ? `Yes: Subject line short (${sw} words)` : `[ ] Subject line optimized: it is ${sw} words`);
    const asks = sentencesOf(bodyOf(content)).filter((s) => ASK.test(s)).length;
    checks.push(asks === 0 ? '[ ] Single clear CTA: no ask was found' : asks <= 2 ? `Yes: Single clear CTA (${asks} ask found)` : `[ ] Single clear CTA: ${asks} asks found, keep one`);
    const longPara = content.split(/\n\n+/).some((p) => countWords(p) > 100);
    checks.push(!longPara && avgWordsPerSentence(content) <= 25 ? 'Yes: Mobile-friendly format (short paragraphs and sentences)' : '[ ] Mobile-friendly format: long paragraphs or sentences');
  }

  if (contentType === 'landing_page') {
    checks.push('[ ] Benefit-driven headline');
    checks.push('[ ] Social proof included');
    checks.push('[ ] CTA above the fold');
  }

  if (contentType === 'blog_post') {
    checks.push('[ ] SEO-optimized title');
    checks.push('[ ] Meta description written');
    checks.push('[ ] Internal/external links added');
  }

  // Run 12 (R12-20b): one list item per check, now that no symbol starts the line.
  return checks.map((c) => `- ${c}`).join('\n');
}
