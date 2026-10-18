import { analyzeContent, generateImprovedVersion, editSentence, toneCheck, annotateText, bodyOf, countWords, avgWordsPerSentence, calculateReadability, ContentAnalysis, SUGGESTION_FOOTER, clipEcho, ASK } from './utils.js';
import { lowerFirstIfCommon, isCommonWord } from './utils.js';
import { readContext, audienceLine, sentencesOf } from './sector.ts';
import { shortenClauses, clipAtWord, endSentence, fixNumbers, FIGURE, dropTail } from './draft.ts';

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
  your_sector?: string;
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
  // Run 42B round S: grammar and paste slips (a capital letter mid-sentence, a whole sentence pasted after "deal with", stray full
  // stops) are listed apart from the score, fixed in the improved and the shorter versions, and each fix is shown as an edit.
  const slipRead = fixSlips(content);
  const improved0 = generateImprovedVersion(slipRead.text, analysis);
  const improved = { text: improved0.text, edits: [...slipRead.slips.filter((x) => x.after !== null).map((x) => ({ before: x.before, after: x.after as string })), ...improved0.edits] };
  // Run 42B round S3: a long subject line that holds a whole sentence pasted after "about" ("Quick question about Vulnerabilities go
  // unnoticed ...") is a paste slip: the improved version cuts it to that sentence's first clause (the user's own words, at most nine)
  if (contentType === 'sales_email' || contentType === 'email') {
    const subj = improved.text.split('\n').find((l) => /^\s*subject:/i.test(l));
    const pasted = subj ? /\b(?:about|on|re:?)\s+([A-Z][a-z']+)\s+[a-z]/.exec(subj.replace(/^\s*subject:\s*/i, '')) : null;
    const cut = subj && pasted && !/[A-Z]/.test(pasted[1].slice(1)) && SUBJECT_VERB.test(subj.split(/,|;/)[0]) ? cutSubject(subj.replace(/^\s*subject:\s*/i, '')) : null;
    if (subj && cut) { improved.text = improved.text.replace(subj, `Subject: ${cut}`); improved.edits.push({ before: subj.trim(), after: `Subject: ${cut}` }); }
  }
  // Run 42B round U: a body line that runs on in one sentence of over 35 words, joined by semicolons, is split at the semicolons into
  // sentences (the user's own words, a capital letter at each start); each split is listed as an edit
  if (contentType === 'sales_email' || contentType === 'email') {
    improved.text = improved.text.split('\n').map((line) => {
      if (/^\s*subject:/i.test(line) || countWords(line) <= 35 || !/;\s+\S/.test(line)) return line;
      const parts = line.split(/;\s+/);
      if (parts.length < 2 || parts.some((x) => countWords(x) < 4)) return line;
      const fixed = parts.map((x, i) => { const t = x.trim().replace(/[.!?]+$/, ''); return `${i === 0 ? t : t.charAt(0).toUpperCase() + t.slice(1)}.`; }).join(' ');
      improved.edits.push({ before: `${clipAtWord(parts[0], 40)} ...; ${clipAtWord(parts[1], 30)} ...`, after: `${clipAtWord(parts[0], 40)} ... . ${clipAtWord(parts[1].charAt(0).toUpperCase() + parts[1].slice(1), 30)} ...` });
      return fixed;
    }).join('\n');
  }
  const tone = toneCheck(content, args.tone_preference);
  const emailLike = contentType === 'sales_email' || contentType === 'email';
  const shorter = emailLike && (wordCount > 120 || analysis.findings.some((f) => f.rule === 'subject-length' || f.rule === 'sentence-length' || f.rule === 'run-on')) ? shorterEmail(slipRead.text, slipRead.slips.some((x) => /deal with/.test(x.note))) : null;
  const ctx = readContext(undefined, { seller: [sellerWords(content, contentType)], context: [content, args.goal], role: [args.audience], buyer: [args.audience] }, args.your_sector);

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
${slipRead.slips.length ? `
### Grammar and Paste Slips (not scored; fixed in the versions below where a safe fix exists)
${slipRead.slips.map((x) => `- "${x.before}": ${x.note}.${x.after ? ` Fixed: "${x.after}"` : ''}`).join('\n')}
` : ''}
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

*Each edit replaces a buzzword with a plainer word, or removes a claim that needs proof (add it back only with proof), or splits a very long sentence, or cuts a long subject line to its first clause, or fixes a grammar or paste slip listed above. Nothing else in your text was changed.*

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
  // a measure counts as named only when every content word of it (four letters or more, not a joining word) is in the text as a whole
  // word and all of them sit within six words of each other, so "first" in one place and "response" in another do not count
  const toks = content.toLowerCase().match(/[a-z]{2,}/g) || [];
  const JOIN = new Set(['per', 'of', 'to', 'the', 'and', 'for', 'with', 'by', 'in', 'on', 'from', 'time']);
  const near = (m: string): boolean => {
    const need = m.toLowerCase().split(/\s+/).filter((w) => w.length >= 4 && !JOIN.has(w));
    if (!need.length || !m.toLowerCase().split(/\s+/).some((w) => w.length >= 5)) return false;
    for (let i = 0; i < toks.length; i++) {
      if (toks[i] !== need[0]) continue;
      const win = new Set(toks.slice(Math.max(0, i - 6), i + 7));
      if (need.every((w) => win.has(w))) return true;
    }
    return false;
  };
  const named = metrics.filter(near);
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
  const sc = (x: string) => (fig(x) ? 2 : -9) + (outcome.test(x) ? 1 : -9) + (/title\)\s*$/i.test(x) ? -9 : 0) + (/from \d[\d.,]*%? to|\d%|[$₹€£]\s?\d|lakhs?/i.test(x) ? 3 : 0) + (/customer|quote|case study/i.test(x) ? 2 : 0) + (/^(?:recognition|named|leader|featured)\b/i.test(x) ? -9 : 0);
  const proof = pieces.filter((x) => sc(x) > 0).sort((a, b) => sc(b) - sc(a))[0];
  if (!proof) return 'No opening can be built from this text without a fact from you. Add one specific result or one sourced observation about the reader\'s work, then lead with it and run this tool again.';
  const clean = shortenClauses(proof.replace(/[.!?]+$/, ''), 220);
  const fragment = /^[\d$₹€£]/.test(proof) && !/\b(?:is|are|was|were|has|have|had|fell|rose|grew|cut|saved?|resolves?|helps?)\b/i.test(proof);
  return fragment
    ? `Your strongest proof is "${clean}". Open with it as a full sentence that says who got it and what changed.`
    : `Lead with the proof you already have: "${clean}".`;
}

// Run 42B round S: slips a reader sees at once, read line by line. Each is quoted with the fix made (or, where no safe fix exists,
// the fix to make). Linear regular expressions only; no word is invented: a fix changes a capital letter, splits a sentence pasted
// after "deal with" into "find that" plus the sentence, or removes a doubled full stop.
type Slip = { before: string; after: string | null; note: string };
// a customer quote with its speaker ("Name, Role, Company: words"), kept whole as the proof of a shorter email when no figure is given
const QUOTED_PROOF = /^[A-Z][^:]{3,90}:\s+\S/;
const SLIP_VERBS = '(?:is|are|was|were|use|uses|want|wants|need|needs|juggle|juggles|lack|lacks|have|has|sit|sits|run|runs|get|gets|ship|ships|evolve|evolve|leave|leaves|lose|loses|struggle|struggles|spend|spends|face|faces|make|makes|can|cannot|must|should|will|rely|relies|grow|grows|take|takes|depend|depends|move|moves|fail|fails|break|breaks|cost|costs|stay|stays|go|goes|pile|piles|slip|slips|happen|happens|arrive|arrives|change|changes|come|comes|drift|drifts|remain|remains|lag|lags|vary|varies|wait|waits|miss|misses|add|adds|live|lives|spread|spreads|sprawl|sprawls|end|ends|keep|keeps|feel|feels|see|sees|find|finds|work|works|pay|pays|wait|waits|file|files|push|pushes)';
const PASTED_CLAUSE = new RegExp(`\\b(deal|deals|dealing|struggle|struggles|struggling) with ((?:[A-Z][a-z]+|[A-Z]{2,5}\\s+[a-z]+)(?:\\s+[A-Za-z][\\w'-]*,?){0,8}?\\s+${SLIP_VERBS}\\b)`, 'g');
export function fixSlips(content: string): { text: string; slips: Slip[] } {
  const slips: Slip[] = [];
  const lines = content.split('\n').map((line) => {
    if (!line.trim()) return line;
    let out = line;
    // each slip is shown by the few words around it, not the whole line
    const words = (s: string, n: number) => { const w = s.split(/\s+/); return w.length > n ? `${w.slice(0, n).join(' ')} ...` : s; };
    // a capital article after "is" ("Snyk is An AI-native platform")
    out = out.replace(/\b(is|are|was|were|as) (A|An|The) ([A-Za-z][\w-]*)/g, (m, v: string, art: string, nx: string) => {
      const fixed = `${v} ${art.toLowerCase()} ${nx}`;
      slips.push({ before: m, after: fixed, note: 'a capital letter in the middle of a sentence' });
      return fixed;
    });
    // Run 42B round S3: a capital common word after "is" ("connectivity is Reliable high-speed connectivity"); a word that is capitalised
    // elsewhere in the middle of the text is a name and stays
    if (!/^\s*subject:/i.test(out)) out = out.replace(/\b(is|are|was|were) ([A-Z][a-z]{2,})(?= [a-z])/g, (m, v: string, w: string) => {
      if (/^(?:An|The)$/.test(w) || !(isCommonWord(w) || /(?:able|ible|ful|ous|ive|less|ent|ant|ic|ly|ing|ed|al)$/.test(w))) return m;
      if (new RegExp(`[a-z,;] ${w}\\b`).test(content.split(m).join(' '))) return m;
      const fixed = `${v} ${w.toLowerCase()}`;
      slips.push({ before: m, after: fixed, note: 'a capital letter in the middle of a sentence' });
      return fixed;
    });
    // a whole sentence pasted after "deal with" ("Teams often deal with Customers want ..."): one sentence again, its first word in small letters
    if (!/^\s*subject:/i.test(out)) out = out.replace(PASTED_CLAUSE, (m, verb: string, clause: string) => {
      const fixed = `${/^deal/i.test(verb) ? verb.replace(/^deal(s|ing)?/i, (x, e) => (e === "ing" ? "finding" : e === "s" ? "finds" : "find")) : verb.replace(/^struggl(e|es|ing)/i, (x, e) => (e === "ing" ? "finding" : e === "es" ? "finds" : "find"))} that ${lowerFirstIfCommon(clause)}`;
      slips.push({ before: words(m, 9), after: words(fixed, 11), note: 'a whole sentence pasted after "deal with", so the line does not read' });
      return fixed;
    });
    // doubled or stray full stops ("deployments., Shailen", "well..", "claim).; Among")
    out = out.replace(/(\S{0,24})(?:([^.\s])\.\.(?!\.)|\.([,;])(\s))/g, (m, pre: string, ch: string | undefined, punct: string | undefined, sp: string | undefined) => {
      const fixed = ch !== undefined ? `${pre}${ch}.` : `${pre}${punct}${sp}`;
      slips.push({ before: m.trim(), after: fixed.trim(), note: 'a doubled or stray full stop' });
      return fixed;
    });
    // a name said twice ("AppTrana is AppTrana"): no safe fix, so the fix to make is named
    const twice = /\b([A-Z][\w-]+(?: [A-Z][\w-]+){0,3}) is \1\b/.exec(out);
    if (twice) slips.push({ before: clipEcho(twice[0], 120), after: null, note: `the name is said twice; say what ${twice[1]} is instead` });
    return out;
  });
  return { text: lines.join('\n'), slips };
}

// Run 42B round S3: a subject line over twelve words (or 70 characters) cut to its first clause, at most nine words, never with "...". A clause
// pasted after "Quick question about" reads as its own subject ("Vulnerabilities go unnoticed across web apps"). Null when it is short already.
const SUBJECT_VERB = new RegExp(`\\b${SLIP_VERBS}\\b`, 'i');
export function cutSubject(full: string): string | null {
  const t = full.trim().replace(/[.!?]+$/, '');
  if (countWords(t) <= 12 && t.length <= 70) return null;
  const lead = /^((?:a )?quick question (?:about|on)|question (?:about|on)|a thought on|thoughts on|about|re:?)\s+/i.exec(t);
  let core = lead ? t.slice(lead[0].length) : t;
  const semi = core.split(/\s*[;:(]\s*|\s+(?:so|but|while|because|instead of|and then|which|where)\s+/)[0].trim();
  const comma = semi.split(/\s*,\s+/)[0].trim();
  // a comma that opens a list of describing words ("a long, complex and manual cycle") is not a place to cut
  const listLead = comma !== semi && /^[a-z]+(?:\s+[a-z]+)?\s+(?:and|or)\s/i.test(semi.slice(comma.length).replace(/^\s*,\s*/, '')) && countWords(semi) <= 10;
  core = listLead ? semi : comma;
  let clause = SUBJECT_VERB.test(core);
  let w = core.split(/\s+/);
  // a clause too long to keep whole is not chopped mid phrase: the words before its verb stay, after "quick question about"
  if (lead && clause && !listLead && w.length > 9) { const vi = w.findIndex((x, i) => i > 0 && SUBJECT_VERB.test(x)); if (vi >= 2) { core = w.slice(0, vi).join(' '); w = core.split(/\s+/); clause = false; } }
  const room = lead && !clause ? 9 - countWords(lead[1]) : listLead ? 10 : 9;
  if (w.length > room) core = dropTail(w.slice(0, room).join(' '));
  if (countWords(core) < 3) return null;
  if (lead && !clause) return `${lead[1].charAt(0).toUpperCase()}${lead[1].slice(1)} ${lowerFirstIfCommon(core)}`;
  return core.charAt(0).toUpperCase() + core.slice(1);
}

// A shorter email cut from the user's own text: a subject line of about eight words, the opening problem, the first thing the
// product does, the one proof item that holds a figure and says what changed, and the ask. Nothing is added or reworded.
function shorterEmail(content: string, pasted = false): { text: string; left: string[] } | null {
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
  const score = (x: string) => (FIGURE.test(x) ? 2 : -9) + (outcome.test(x) ? 1 : -9) + (/title\)\s*$/i.test(x) ? -9 : 0) + (/from \d[\d.,]*%? to|\d%|[$₹€£]\s?\d|lakhs?/i.test(x) ? 3 : 0) + (/customer|quote|case study/i.test(x) ? 2 : 0) + (/^(?:recognition|named|leader|featured)\b/i.test(x) ? -9 : 0);
  const proof = pieces.filter((x) => score(x) > 0).sort((a, b) => score(b) - score(a))[0] || pieces.find((x) => QUOTED_PROOF.test(x) && x.length <= 260);
  const opening = rest[0];
  const product = rest.find((s, i) => i > 0 && s !== proof && !(proof && s.includes(proof)));
  const kept: string[] = [];
  const left: string[] = [];
  const note = (orig: string, shown: string) => {
    const o = orig.replace(/[.!?]+$/, '');
    const sh = shown.replace(/(?:\.\.\.|…)\s*$/, '').replace(/[.!?]+$/, '');
    // the text that is left out is what is not in the shown version: the tail when the shown text is the start, else the clauses it dropped
    const gone = o.startsWith(sh) ? o.slice(sh.length).replace(/^[,;:\s]+/, '') : o.split(/,\s+/).filter((c) => c.length > 12 && !sh.includes(c.trim())).join(', ');
    if (gone.length > 12) left.push(`${clipAtWord(gone, 45)}${gone.length > 45 ? '...' : ''}`);
  };
  const out: string[] = [];
  if (subjectLine) {
    const full = subjectLine.replace(/^subject:\s*/i, '');
    const sub = cutSubject(full) ?? shortenClauses(full, 60);
    out.push(`Subject: ${sub}`);
    note(full, sub);
  }
  if (greeting) out.push(greeting);
  for (const s of [opening, product]) {
    if (!s) continue;
    // a sentence that had a whole sentence pasted into it ("Teams at X often find that Y ...") keeps the pasted sentence alone, whole
    const joined = pasted && s === opening ? /^[A-Z][^;:]{0,80}?\bfind(?:s|ing)? that ([a-z][^]*)$/.exec(s) : null;
    let sh = shortenClauses(joined ? joined[1].charAt(0).toUpperCase() + joined[1].slice(1) : s, 170);
    // a cut that ends on the name the sentence starts with ("X is a service plus X.") takes the next clause, which says what that name is
    const lead = (s.match(/^[A-Z][\w-]*/) || [''])[0];
    if (lead && sh.length < s.length && new RegExp(`\\b(?:plus|and|with|by|from|of)\\s+${lead}$`).test(sh.replace(/[.!?]+$/, ''))) { const nxt = s.indexOf(', ', sh.length + 2); sh = nxt > 0 ? s.slice(0, nxt) : s; }
    out.push(endSentence(sh)); kept.push(s); note(s, sh);
  }
  if (proof) { out.push(endSentence(shortenClauses(proof, 200))); kept.push(proof); }
  if (ask) { out.push(ask); kept.push(ask); }
  out.push(...sign);
  for (const s of rest) if (!kept.includes(s)) for (const piece of s.split(/;\s+/)) if (piece !== proof && !kept.includes(piece)) left.push(`${clipAtWord(piece.replace(/\s+/g, ' '), 45)}${piece.length > 45 ? '...' : ''}`);
  if (proof && opening && !kept.includes(opening)) return null;
  const text = out.map((l, i) => (/^subject:/i.test(l) || l === greeting || sign.includes(l) ? l : editSentence(l))).join('\n');
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
    checks.push(asks === 0 ? '[ ] Single clear CTA: no ask was found' : asks === 1 ? 'Yes: Single clear CTA (1 ask found)' : `[ ] Single clear CTA: ${asks} asks found, keep one`);
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

// The words the author uses for what the company sells. In copy written in the seller's own voice (an email, a landing page, a product
// description, a press release) these are the lines that are not the subject, the greeting, the sign-off, the ask or the line about the
// reader's problem ("Teams at ... often deal with ..."). In a blog post, a social post or a case study the title and the body are about a
// subject, not necessarily about what the author sells, so they stay free text for the reader.
const SELLER_VOICE = new Set(['sales_email', 'email', 'landing_page', 'product_description', 'press_release']);
const NOT_SELLER_LINE = /^(?:subject:|(?:hi|hello|dear|hey)\b|(?:thanks|thank you|best|regards|kind regards|cheers|sincerely)\b|teams? at\b|would you be open|are you open|can we (?:talk|book|schedule)|reply\b)|\boften deal with\b/i;
function sellerWords(content: string, contentType: string): string {
  if (!SELLER_VOICE.has(contentType)) return '';
  const lines = content.split('\n').map((l) => l.trim()).filter((l) => l && !NOT_SELLER_LINE.test(l));
  // The line that states what the sender sells ("Brightline X is ...", "X helps ...") first; a line about the reader ("Many heads of IT at banks tell us ...") names the buyer's industry, not the product.
  const states = lines.find((l) => /^[A-Z][\w&.-]*(?:\s+[A-Za-z0-9&.-]+){0,5}\s+(?:is|are|helps?|provides?|offers?|builds?|makes?|gives?|runs?)\s/.test(l) && !/^(?:I|We|You|Many|Most|Teams?)\s/.test(l));
  return (states || lines[0] || '').slice(0, 300);
}
