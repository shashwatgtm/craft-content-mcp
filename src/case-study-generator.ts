import { SUGGESTION_FOOTER, clipEcho, cap } from './utils.js';
import { splitItems, q, readContext, startWords, firstSentence, sentencesOf, type Vertical, type BusinessModel } from './sector.ts';

type Ctx = { v: Vertical | null; model: BusinessModel | null; line: string };

export function generateCaseStudy(args: {
  customer_name: string;
  customer_industry?: string;
  mode?: string;
  interview_notes?: string;
  challenge?: string;
  solution?: string;
  results?: string;
  customer_quote?: string;
  your_product: string;
  business_model?: string;
}): string {
  const customerName = args.customer_name;
  // Run 12 (R12-20, B5): an industry the user did not give is printed as "[not supplied]", never guessed.
  const industry = args.customer_industry || '';
  const mode = args.mode || (args.challenge && args.solution && args.results ? 'full' : 'discovery');
  const product = args.your_product;
  // Run 19 (D80, problems 4 and 8): the sector and the business model are read from every text the user gave.
  const ctx = readContext(args.business_model, [product, args.challenge, args.solution, args.results, args.interview_notes]);

  // Run 15 (R15-11, D35): mode "full", no interview notes, and a fact left out: the discovery interview kit,
  // with a first line that names what is missing. A part that is only spaces counts as missing.
  if (mode === 'full' && !args.interview_notes) {
    const missing: string[] = [];
    if (!args.challenge?.trim()) missing.push('the challenge');
    if (!args.solution?.trim()) missing.push('the solution');
    if (!args.results?.trim()) missing.push('the results');
    if (missing.length > 0) {
      const names = missing.length === 1 ? missing[0] : missing.slice(0, -1).join(', ') + ' and ' + missing[missing.length - 1];
      return `Full mode needs the challenge, the solution and the results. Missing: ${names}. Use the interview questions below to collect them.` + '\n\n' +
        generateDiscoveryKit(customerName, industry, product, args.results?.trim() ? args.results : undefined, ctx);
    }
  }

  // DISCOVERY MODE - Generate interview questions
  if (mode === 'discovery' || (!args.challenge && !args.solution && !args.results && !args.interview_notes)) {
    return generateDiscoveryKit(customerName, industry, product, args.results, ctx);
  }

  // If interview notes provided and a fact is missing, parse the notes for the missing facts; the facts the user gave are kept.
  if (args.interview_notes && (!args.challenge?.trim() || !args.solution?.trim() || !args.results?.trim())) {
    return generateFromNotes(args.interview_notes, customerName, industry, product, args.customer_quote, args, ctx);
  }

  // FULL MODE - Generate complete case study
  return generateFullCaseStudy(
    customerName,
    industry,
    // A missing part prints "not supplied" instead of crashing (mode "full" with a part left out).
    args.challenge || 'not supplied',
    args.solution || 'not supplied',
    args.results || 'not supplied',
    args.customer_quote,
    product,
    ctx,
    args.interview_notes ? { notes: args.interview_notes } : undefined
  );
}

// A phrase ends with one full stop, whatever the user typed.
function sentence(text: string): string {
  const t = text.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}
function capFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function discoverySector(ctx: Ctx): string {
  const v = ctx.v;
  if (!v) return `\n---\n\n## Sector Questions\n\n${ctx.line}\n\nNo sector could be read from what you typed, so only the general questions are below. Name the customer's industry or your product category to get questions in the sector's own language.\n`;
  return `
---

## Questions in the Language of ${capFirst(v.name)}

${ctx.line}

${v.discovery.map((d, i) => `${i + 1}. ${d}`).join('\n')}

**Measures to ask the customer for, with the starting value and the timeframe:** ${v.metrics.join(', ')}.

**What a strong proof point looks like here:** ${v.proofShape}
`;
}

function generateDiscoveryKit(customerName: string, industry: string, product: string, knownResults: string | undefined, ctx: Ctx): string {
  const w = startWords(ctx.model);
  return `# Case Study Discovery Kit
## For: ${customerName}

---
${knownResults ? `
You already have one result: ${q(knownResults)}. Confirm the baseline and the timeframe.

---
` : ''}
## Information Needed

Before we can create a compelling case study, we need to gather the customer story. Here's your interview guide.

---

## Customer Interview Questions

### Part 1: The Challenge (5-7 minutes)

Ask these questions to understand their "before" state:

1. **"Take me back to before you started using ${product}. What was happening in your business?"**
   - Listen for: Pain points, frustrations, failed solutions

2. **"What specific problem were you trying to solve?"**
   - Listen for: Quantifiable issues (time, money, efficiency)

3. **"How was this problem affecting your team/customers/revenue?"**
   - Listen for: Business impact metrics

4. **"What had you tried before? Why didn't it work?"**
   - Listen for: Competitor mentions, DIY attempts

5. **"What made you start looking for a solution when you did?"**
   - Listen for: Trigger event, urgency

---

### Part 2: The Solution (5-7 minutes)

Ask these questions about their journey to ${product}:

6. **"How did you first hear about ${product}?"**
   - Listen for: Channel attribution

7. **"What made you choose ${product} over alternatives?"**
   - Listen for: Key differentiators, decision criteria

8. **"Walk me through the ${w.rollout}. What was that like?"**
   - Listen for: ${capFirst(w.rollout)} experience, ${w.value}

9. **"What was the moment you knew this was working?"**
   - Listen for: Quotable moments, early wins

---

### Part 3: The Results (5-7 minutes)

Ask these questions to capture outcomes:

10. **"What results have you seen since starting with ${product}?"**
    - Listen for: Metrics, before/after comparisons

11. **"Can you put numbers on that? Percentage improvement, time saved, revenue impact?"**
    - Listen for: Specific, quotable statistics

12. **"How has this affected your team's day-to-day work?"**
    - Listen for: Quality of life improvements

13. **"What would you tell someone considering ${product}?"**
    - Listen for: Ready-made testimonial quote

---

### Bonus Questions for Rich Stories

14. **"Was there a moment where ${product} really saved the day?"**
    - Listen for: Anecdotes, crisis averted stories

15. **"What surprised you most about working with us?"**
    - Listen for: Unexpected benefits, delighters
${discoverySector(ctx)}
---

## Interview Notes Template

Use this structure to capture responses:

\`\`\`
CUSTOMER: ${customerName}
INDUSTRY: ${industry || '[not supplied]'}
DATE: [Interview date]
INTERVIEWER: [Your name]

CHALLENGE:
- Main problem:
- Business impact:
- Previous attempts:
- Trigger event:

SOLUTION:
- Discovery channel:
- Why ${product}:
- ${capFirst(w.rollout)} experience:
- ${capFirst(w.value)}:

RESULTS:
- Key metric 1:
- Key metric 2:
- Key metric 3:
- Team impact:

QUOTES:
- Best quote:
- Backup quote:

STORY ANGLE:
- Unique aspect:
- Emotional hook:
\`\`\`

---

## Interview Request Email Template

Subject: Quick favor: share your ${product} success story?

---

Hi [First Name],

I hope this finds you well!

I'm reaching out because I'd love to share how your team uses ${product} with others who might benefit.

Would you be open to a 20-minute call where I ask a few questions about your experience? Here's what it would involve:

- **Time:** 20-minute video call at your convenience
- **Topics:** Your challenges before, how you use ${product}, results you've seen
- **Approval:** You'll review the final case study before it goes live
- **Benefit:** [Only if true: what ${customerName} gains from being featured, for example links to their site]

[Only if true and provable: We'd also love to feature you in our customer spotlight and share your story with our newsletter readers.]

Would next [Day] at [Time] work for a quick call?

Thanks,
[Your name]

---

## Once You Have the Story

Run this tool again with mode="full" and include:
- **challenge:** What they were struggling with
- **solution:** How ${product} helped
- **results:** Quantifiable outcomes
- **customer_quote:** Their best testimonial quote

---

${SUGGESTION_FOOTER}
`;
}

function generateFromNotes(notes: string, customerName: string, industry: string, product: string, quote: string | undefined, given: { challenge?: string; solution?: string; results?: string }, ctx: Ctx): string {
  // Parse the interview notes to extract structure
  const keyPoints = sentencesOf(notes).filter((s) => s.length > 10).slice(0, 5).map((p) => clipEcho(p.replace(/[.!?]+$/, '')));

  // Look for challenge indicators
  const challengePatterns = /(?:problem|struggle|challenge|issue|pain|before|difficult|hard|couldn't|wasn't|weren't)[^.]*[.!?]/gi;
  const challengeMatches = notes.match(challengePatterns) || [];
  const challenge = given.challenge?.trim() || challengeMatches.slice(0, 2).join(' ') || '[Challenge: not found in the notes]';

  // Look for solution indicators
  const solutionPatterns = /(?:implemented|started using|switched to|chose|selected|adopted|began|onboard)[^.]*[.!?]/gi;
  const solutionMatches = notes.match(solutionPatterns) || [];
  const solution = given.solution?.trim() || solutionMatches.slice(0, 2).join(' ') || '[Solution: not found in the notes]';

  // Look for results indicators
  const resultsPatterns = /(?:\d+%|\$\d+|\d+x|reduced|increased|improved|saved|grew|achieved)[^.]*[.!?]/gi;
  const resultsMatches = notes.match(resultsPatterns) || [];
  const results = given.results?.trim() || resultsMatches.slice(0, 3).join(' ') || '[Results: not found in the notes]';

  // Look for quotes
  const quotePatterns = /"[^"]+"/g;
  const foundQuotes = notes.match(quotePatterns) || [];
  const bestQuote = quote || foundQuotes[0]?.replace(/"/g, '') || '';

  const usedFromNotes = [!given.challenge?.trim() && 'the challenge', !given.solution?.trim() && 'the solution', !given.results?.trim() && 'the results'].filter(Boolean) as string[];

  return `# Case Study Draft (Parsed from Notes)
## ${customerName} + ${product}

**Note:** The facts you typed are kept as typed. ${usedFromNotes.length ? `${capFirst(usedFromNotes.join(' and '))} came from the interview notes, so review ${usedFromNotes.length === 1 ? 'it' : 'them'} and enhance with specific details.` : ''}

---

${generateFullCaseStudy(customerName, industry, challenge, solution, results, bestQuote, product, ctx)}

---

## Key Points Extracted from Notes

${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

---

## Items to Verify/Enhance

1. **Challenge section:** Add specific metrics (time wasted, money lost, etc.)
2. **Solution section:** Verify implementation timeline and process
3. **Results section:** Confirm exact percentages and timeframes
4. **Quote:** Get customer approval for the extracted quote
5. **Company description:** Add accurate ${customerName} company info

`;
}

// The sector's measures that the results do not mention: ask the customer for one of them.
function missingMeasures(v: Vertical, results: string): string[] {
  const lower = results.toLowerCase();
  return v.metrics.filter((m) => !m.toLowerCase().split(/\s+/).filter((w) => w.length >= 6).some((w) => lower.includes(w)));
}

function generateFullCaseStudy(
  customerName: string,
  industry: string,
  challenge: string,
  solution: string,
  results: string,
  quote: string | undefined,
  product: string,
  ctx: Ctx,
  extra?: { notes: string }
): string {
  const w = startWords(ctx.model);
  // Run 19 (D80, problem 3): results split on lines and semicolons, so every result the user gave is its own item.
  const resultPoints = splitItems(results).length ? splitItems(results) : [results];
  const headlineResult = clipEcho(resultPoints[0] || results, 200);
  // Run 19 (B15-L1): the whole challenge, solution and results are printed once, in their own sections; every repeat of them
  // (the summary box, the takeaways, the social copy, the email) is cut at 280 characters, so a long pasted text cannot fill the answer.
  const challengeShort = clipEcho(challenge);
  const solutionShort = clipEcho(solution);
  const impactShort = clipEcho(resultPoints.map((r) => cap(r)).join('; '));
  // A long quote is cut only at the end of a sentence; a short one is used whole.
  const shortQuote = quote ? (quote.length <= 160 ? quote : firstSentence(quote) + '.') : '';
  const sector = ctx.v ? sectorBlock(ctx.v, results) : '';
  const notUsed = extra?.notes ? `
## Inputs Not Used

- **interview_notes was not used** for this draft because you gave the challenge, the solution and the results directly. ${((extra.notes.match(/"[^"]+"/g) || []).length ? `The notes hold ${(extra.notes.match(/"[^"]+"/g) || []).length} quoted line(s): ${(extra.notes.match(/"[^"]+"/g) || []).slice(0, 2).join(' ')}. Use one as the customer quote.` : 'The notes hold no quoted line; ask the customer for one.')}

---
` : '';

  return `# Case Study: ${customerName}

## ${customerName} and ${product}: ${headlineResult}

${ctx.line}

---

### About ${customerName}

**Industry:** ${industry || '[not supplied]'}
**Challenge:** ${challengeShort}
**Solution:** ${product}
**Key Result:** ${headlineResult}

---

## The Challenge

${challenge}

[Add what the problem cost them, in their words]

---

## The Solution

${solution}

### Why ${customerName} Chose ${product}

[Add why they chose ${product}, in their words]

### ${capFirst(w.rollout)}

[Add how the ${w.rollout} went, in their words]

---

## The Results

${resultPoints.map((r, i) => `### ${i + 1}. ${cap(r)}

[Add what this result changed for them, in their words]`).join('\n\n')}

---

${quote ? `## In Their Words

> "${quote.replace(/^"|"$/g, '')}"
>
> ${customerName}

---` : ''}

## Key Takeaways

1. **Challenge:** ${challengeShort}
2. **Solution:** ${solutionShort}
3. **Impact:** ${impactShort}

---

## Ready to Achieve Similar Results?

[CTA: say what the reader should do next, for example book a call or read a related story]

---
${sector}${notUsed}
## Distribution Formats

### One-Line Version (for testimonial pages):
"${customerName} with ${product}: ${headlineResult.replace(/[.]$/, '')}."

### Social Media Version:
Challenge at ${customerName}: ${sentence(challengeShort)}
What changed with ${product}: ${sentence(solutionShort)}

Results:
${resultPoints.slice(0, 3).map(r => `- ${clipEcho(cap(r))}`).join('\n')}

${quote ? `> "${shortQuote.replace(/^"|"$/g, '')}"` : ''}

Read the full story: [Add the link]

### Email Snippet:
Quick success story: ${customerName}${industry ? ` (${industry})` : ''}. Challenge: ${sentence(challengeShort)} Result: ${resultPoints.slice(0, 2).map((r) => clipEcho(cap(r), 140)).join('; ')}. [Add the link to the full story]

`;
}

function sectorBlock(v: Vertical, results: string): string {
  const missing = missingMeasures(v, results);
  const hasNumber = /\d/.test(results);
  return `
## Sector Notes: ${capFirst(v.name)}

- **A strong proof point here:** ${v.proofShape}
- **What readers in this sector measure:** ${v.metrics.join(', ')}.
- **Terms this sector's buyers use:** ${v.vocabulary.join(', ')}.
- **Your results:** ${hasNumber ? 'they carry a figure.' : 'they carry no figure. A case study without a number is easy to ignore: ask the customer for the starting value, the end value and the timeframe of one measure.'}${missing.length && missing.length < v.metrics.length ? ` Not yet shown: ${missing.slice(0, 4).join(', ')}. If the customer tracks any of these, add one.` : missing.length === v.metrics.length ? ` None of the sector's usual measures appears in them (${v.metrics.slice(0, 4).join(', ')}); if the customer tracks one, add it.` : ''}

---
`;
}
