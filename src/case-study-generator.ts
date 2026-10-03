import { SUGGESTION_FOOTER, clipEcho, cap } from './utils.js';
import { q, readContext, startWords, firstSentence, sentencesOf, fromIndicator, type Vertical, type BusinessModel } from './sector.ts';
import { parseProof, fixNumbers, endSentence, lowerFirstWord, isGenericName, proseJoin, plural, type ProofItem, type ProofKind } from './draft.ts';

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
  const ctx = readContext(args.business_model, { seller: [product], context: [args.challenge, args.solution, args.results, args.interview_notes], buyer: [args.customer_industry, args.customer_name] });

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
INDUSTRY: ${industry || 'not given'}
DATE:
INTERVIEWER:

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

Hello,

I hope this finds you well!

I'm reaching out because I'd love to share how your team uses ${product} with others who might benefit.

Would you be open to a 20-minute call where I ask a few questions about your experience? Here's what it would involve:

- **Time:** 20-minute video call at your convenience
- **Topics:** Your challenges before, how you use ${product}, results you've seen
- **Approval:** You'll review the final case study before it goes live
- **Benefit:** add what ${customerName} gains from being featured, only if it is true (for example a link to their site)

Would a time next week work for a quick call?

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
  const challengeMatches = fromIndicator(notes, /(?:problem|struggle|challenge|issue|pain|before|difficult|hard|couldn't|wasn't|weren't)/i);
  const challenge = given.challenge?.trim() || challengeMatches.slice(0, 2).join(' ') || '';

  // Look for solution indicators
  const solutionMatches = fromIndicator(notes, /(?:implemented|started using|switched to|chose|selected|adopted|began|onboard)/i);
  const solution = given.solution?.trim() || solutionMatches.slice(0, 2).join(' ') || '';

  // Look for results indicators
  // a figure starts at its first digit: "99.5%" is never read from its "5%"
  const resultsMatches = fromIndicator(notes, /(?<![\d.,])\d+(?:[.,]\d+)*%|\$\d+|(?<![\d.,])\d+x\b|reduced|increased|improved|saved|grew|achieved/i);
  const results = given.results?.trim() || resultsMatches.slice(0, 3).join('; ') || '';

  // Look for quotes
  const quotePatterns = /"[^"]+"/g;
  const foundQuotes = notes.match(quotePatterns) || [];
  const bestQuote = quote || foundQuotes[0]?.replace(/"/g, '') || '';

  const usedFromNotes = [!given.challenge?.trim() && challenge && 'the challenge', !given.solution?.trim() && solution && 'the solution', !given.results?.trim() && results && 'the results'].filter(Boolean) as string[];
  const notFound = [!challenge && 'the challenge', !solution && 'the solution', !results && 'the results'].filter(Boolean) as string[];

  return `# Case Study Draft (Parsed from Notes)
## ${customerName} + ${product}

**Note:** The facts you typed are kept as typed. ${usedFromNotes.length ? `${capFirst(usedFromNotes.join(' and '))} came from the interview notes, so review ${usedFromNotes.length === 1 ? 'it' : 'them'} and enhance with specific details. ` : ''}${notFound.length ? `The notes do not state ${notFound.join(' or ')}; the draft says so where it is missing.` : ''}

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

function bullets(items: ProofItem[]): string {
  return items.map((p) => `- ${endSentence(capFirst(p.shown))}`).join('\n');
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
  const v = ctx.v;
  const w = startWords(ctx.model);
  const generic = isGenericName(customerName);
  const items = results.trim() && results !== 'not supplied' ? parseProof(results) : [];
  const grp = (k: ProofKind[]) => items.filter((i) => k.includes(i.kind));
  const outcomes = grp(['result']);
  const quotes = grp(['quote']);
  const titles = grp(['title']);
  const claims = grp(['scale', 'claim']);
  const recognition = grp(['recognition']);
  // the lead result: a result with a figure, else a customer quote, else a story title that states an outcome
  const lead = outcomes.find((i) => i.figure) || quotes.find((i) => i.figure) || titles.find((i) => i.figure) || outcomes[0] || quotes[0] || titles[0];
  const hasCustomerOutcome = !!lead;
  const challengeText = challenge && challenge !== 'not supplied' ? fixNumbers(challenge.trim()) : '';
  const solutionText = solution && solution !== 'not supplied' ? fixNumbers(solution.trim()) : '';
  const industryText = industry || '';
  const sectorName = v ? v.name : '';
  const askMetrics = v ? proseJoin(v.metrics.slice(0, 3)) : 'one measure the customer tracks';
  const notUsed = extra?.notes ? `
## Inputs Not Used

- **interview_notes was not used** for this draft because you gave the challenge, the solution and the results directly. ${((extra.notes.match(/"[^"]+"/g) || []).length ? `The notes hold ${(extra.notes.match(/"[^"]+"/g) || []).length} quoted line(s): ${(extra.notes.match(/"[^"]+"/g) || []).slice(0, 2).join(' ')}. Use one as the customer quote.` : 'The notes hold no quoted line; ask the customer for one.')}

---
` : '';

  // what the draft is built from, so nothing given goes unused without being said
  const built = [
    `challenge: ${challengeText ? 'given' : 'not found'}`,
    `solution: ${solutionText ? 'given' : 'not found'}`,
    `results: ${items.length ? `${items.length} ${plural(items.length, 'item')}${items.length > 1 ? ` (${[outcomes.length && `${outcomes.length} ${plural(outcomes.length, 'outcome')}`, quotes.length && `${quotes.length} ${plural(quotes.length, 'quote')}`, titles.length && `${titles.length} story ${plural(titles.length, 'title')}`, claims.length && `${claims.length} company-wide ${plural(claims.length, 'claim')}`, recognition.length && `${recognition.length} ${plural(recognition.length, 'recognition item')}`].filter(Boolean).join(', ')})` : ''}` : 'not found'}`,
    `customer quote: ${quote ? 'given' : quotes.length ? 'taken from the results' : 'not given'}`,
    `industry: ${industryText ? 'given' : 'not given'}`
  ].join('; ');

  // An unnamed customer with results from several sources has no single story yet: the headline is about what customers report, and
  // no one company's result is shown as the story's own.
  const label = generic ? customerName.replace(/\s*\([^)]*\)/g, '').replace(/^contact at /i, '').trim() : customerName;
  const manySources = generic && (outcomes.length + quotes.length + titles.length) >= 1;
  const headline = manySources ? `${product}${industryText ? ` in ${industryText}` : ''}: what customers report` : lead ? capFirst(lead.text.replace(/^customer (?:quote|words):\s*/i, '')) : `${label} and ${product}`;
  const headlineOk = (lead && headline.length <= 160) || manySources;
  const reported = (outcomes.length ? outcomes : quotes.length ? quotes : titles).slice(0, 2);

  const genericNote = generic && items.length > 1 ? `
> **Whose results these are.** customer_name is ${q(customerName)}, which does not name a company, and the results name their own sources. A case study tells one customer's story, so each result below stays with the company or source that reported it, and none is presented as this customer's own. To write the single story, pick one customer from the list and run this tool again with that name and only its results.
` : '';

  const outcomeBlocks: string[] = [];
  if (outcomes.length) outcomeBlocks.push(`**Outcomes**\n\n${bullets(outcomes)}`);
  if (quotes.length) outcomeBlocks.push(`**Customer quotes in your results**\n\n${bullets(quotes)}`);
  if (titles.length) outcomeBlocks.push(`**Customer stories known by their title only.** The title states an outcome. Read the story and take its detail before you print it as a result.\n\n${bullets(titles)}`);
  if (claims.length) outcomeBlocks.push(`**Company-wide claims, kept out of the outcomes.** These describe the vendor, not one customer. Use them in a "who uses ${product}" line, not as this story's result.\n\n${bullets(claims)}`);
  if (recognition.length) outcomeBlocks.push(`**Recognition, kept out of the outcomes.** A ranking or an award is not something the customer achieved. Use it as a "Recognised by" line beside the story.\n\n${bullets(recognition)}`);

  const noOutcome = !hasCustomerOutcome ? `
**No customer outcome was given.** Every item above is a company-wide claim or a recognition, so there is no result to build this story on yet. Ask the customer for ${v ? askMetrics : 'one measure it tracks'}: the value before, the value after and the period. ${v ? `A strong proof point here: ${v.proofShape}` : ''}
` : '';

  const cta = v ? `Close with one action for the reader. Deals in ${sectorName} usually start like this: ${lowerFirstWord(v.salesMotion)} Write the reader's next step to match, for example a pilot request.` : `Suggested closing line for readers: say what the reader does next (a call, a pilot, a visit) and keep it to one action.`;

  const pullable = quotes.filter((x) => /customer quote/i.test(x.label) && /\b(?:we|our|us|my|I)\b/.test(x.text.replace(/^[^:]{0,60}:\s*/, '')));
  const pull = quote
    ? `> "${quote.replace(/^"|"$/g, '')}"\n>\n> ${customerName}`
    : pullable.length
      ? `No customer_quote was given. A quote in your results can serve as the pull quote once the customer has approved it:\n\n${bullets(pullable.slice(0, 2))}`
      : `No customer_quote was given. Ask for one line the customer would say aloud about what changed${v ? ` in ${v.metrics[0]}` : ''}, and get written approval before you print it.`;

  return `# Case Study: ${customerName}

## ${headlineOk ? headline : `${label} and ${product}`}

${ctx.line}

*Built from: ${built}.*

---

### About ${customerName}

| | |
|---|---|
| **Customer** | ${customerName} |
| **Industry** | ${industryText || 'not given (add customer_industry)'} |
| **Product** | ${product} |
| **Lead result** | ${manySources ? 'none for one customer: see The Results' : lead ? endSentence(lead.shown) : 'none given'} |
${genericNote}
---

## The Challenge

What the team was dealing with: ${challengeText ? challengeText : 'not found. Ask the customer what was happening before they started.'}

**To finish this section** (ask the customer, and use their words):
- What the problem cost them, with the starting value of ${v ? `one of: ${askMetrics}` : askMetrics}.
${v ? `- Interview question in the sector's language: "${v.discovery[0]}"` : '- What had they tried before, and why did it not work?'}

---

## The Solution

What was put in place: ${solutionText ? solutionText : 'not found. Ask what was set up, by whom and in what order.'}

**To finish this section:**
- Why ${customerName} chose ${product}${v ? `, and which alternative it weighed (a common reaction in ${sectorName}: "${v.objections[0].objection}")` : ''}.
- How the ${w.rollout} went, and how long it took to ${w.reach}. Use only a duration the customer confirms.
${v ? `- Words to use as the customer says them: ${v.vocabulary.slice(0, 5).join(', ')}.` : ''}

---

## The Results

${items.length ? outcomeBlocks.join('\n\n') : 'No results were given.'}
${noOutcome}
**To finish this section:** for each figure, give the value before, the value after and the period it was measured over. ${v ? `A strong proof point here: ${v.proofShape}` : ''}${hasCustomerOutcome && v && missingMeasures(v, results).length < v.metrics.length ? ` Measures of this sector that the results do not yet show: ${proseJoin(missingMeasures(v, results).slice(0, 4))}. Add one if the customer tracks it.` : ''}

---

## In Their Words

${pull}

---

## Where This Goes Next

${cta}

---
${v ? sectorBlock(v, results) : ''}${notUsed}
## Distribution Formats

${manySources ? `### Until one customer is chosen
Use each result with its own source, never as one customer's story:
${reported.map((r) => `- ${endSentence(capFirst(clipEcho(r.shown, 260)))}`).join('\n')}
${reported.length ? '' : '- No result was given.'}
Read the full story: add the link when the case study is published.
` : lead ? `### One-line version (testimonial pages)
${lead.text.replace(/[.!?]+$/, '')} (${product}).

### Social media version
${endSentence(lead.shown)}

Product: ${product}.
${quote ? `\n> "${(quote.length <= 160 ? quote : firstSentence(quote) + '.').replace(/^"|"$/g, '')}"\n` : ''}
Read the full story: add the link when the case study is published.

### Email snippet
Quick success story: ${headline.replace(/[.!?]+$/, '')}. Add the link to the full story when it is published.
` : `No distribution copy is written: there is no customer outcome to put in it yet. Collect one result (see The Results) and run this tool again.
`}
---

## Check Before You Publish

- The customer has approved the story, every figure and the quote in writing.
- Every figure comes from the customer or a page you can cite; page claims stay labelled as the vendor's own claims.
- Nothing in the recognition or company-wide claims is shown as this customer's result.

`;
}

function sectorBlock(v: Vertical, results: string): string {
  const hasNumber = /\d/.test(results);
  return `
## Sector Notes: ${capFirst(v.name)}

- **A strong proof point here:** ${v.proofShape}
- **What readers in this sector measure:** ${v.metrics.join(', ')}.
- **Terms this sector's buyers use:** ${v.vocabulary.join(', ')}.
- **Your results:** ${hasNumber ? 'they carry a figure.' : 'they carry no figure. A case study without a number is easy to ignore: ask the customer for the starting value, the end value and the timeframe of one measure.'}

---
`;
}
