import { parseListItems, extractKeyPoints, lowerCommonWords, lowerFirstIfCommon, SUGGESTION_FOOTER } from './utils.js';

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
}): string {
  const customerName = args.customer_name;
  // Run 12 (R12-20, B5): an industry the user did not give is printed as "[not supplied]", never guessed.
  const industry = args.customer_industry || '';
  const mode = args.mode || (args.challenge && args.solution && args.results ? 'full' : 'discovery');
  const product = args.your_product;
  
  // DISCOVERY MODE - Generate interview questions
  if (mode === 'discovery' || (!args.challenge && !args.solution && !args.results && !args.interview_notes)) {
    return generateDiscoveryKit(customerName, industry, product, args.results);
  }
  
  // If interview notes provided, parse them
  if (args.interview_notes && (!args.challenge || !args.solution || !args.results)) {
    return generateFromNotes(args.interview_notes, customerName, industry, product, args.customer_quote);
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
    product
  );
}

function generateDiscoveryKit(customerName: string, industry: string, product: string, knownResults?: string): string {
  return `# 🔍 Case Study Discovery Kit
## For: ${customerName}

---
${knownResults ? `
You already have one result: ${lowerCommonWords(knownResults)}. Confirm the baseline and the timeframe.

---
` : ''}
## 📋 Information Needed

Before we can create a compelling case study, we need to gather the customer story. Here's your interview guide.

---

## 🎙️ Customer Interview Questions

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

8. **"Walk me through your implementation. What was that like?"**
   - Listen for: Onboarding experience, time to value

9. **"What was the 'aha moment' when you knew this was working?"**
   - Listen for: Quotable moments, early wins

---

### Part 3: The Results (5-7 minutes)

Ask these questions to capture outcomes:

10. **"What results have you seen since implementing ${product}?"**
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

---

## 📝 Interview Notes Template

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
- Implementation experience: 
- Time to value: 

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

## 📧 Interview Request Email Template

Subject: Quick favor: share your ${product} success story?

---

Hi [First Name],

I hope this finds you well!

I'm reaching out because I'd love to share how your team uses ${product} with others who might benefit.

Would you be open to a 20-minute call where I ask a few questions about your experience? Here's what it would involve:

- **Time:** 20-minute video call at your convenience
- **Topics:** Your challenges before, how you use ${product}, results you've seen
- **Approval:** You'll review the final case study before it goes live
- **Benefit:** Increased visibility for ${customerName} + potential backlinks to your site

[OPTIONAL: We'd also love to feature you in our customer spotlight and share your story with our 50,000+ newsletter subscribers.] (Example figure: replace with your own)

Would next [Day] at [Time] work for a quick call?

Thanks,
[Your name]

---

## 🔄 Once You Have the Story

Run this tool again with mode="full" and include:
- **challenge:** What they were struggling with
- **solution:** How ${product} helped
- **results:** Quantifiable outcomes
- **customer_quote:** Their best testimonial quote

---

${SUGGESTION_FOOTER}
`;
}

function generateFromNotes(notes: string, customerName: string, industry: string, product: string, quote?: string): string {
  // Parse the interview notes to extract structure
  const keyPoints = extractKeyPoints(notes);
  
  // Look for challenge indicators
  const challengePatterns = /(?:problem|struggle|challenge|issue|pain|before|difficult|hard|couldn't|wasn't|weren't)[^.]*[.!?]/gi;
  const challengeMatches = notes.match(challengePatterns) || [];
  const challenge = challengeMatches.slice(0, 2).join(' ') || '[Challenge: not found in the notes]';
  
  // Look for solution indicators
  const solutionPatterns = /(?:implemented|started using|switched to|chose|selected|adopted|began|onboard)[^.]*[.!?]/gi;
  const solutionMatches = notes.match(solutionPatterns) || [];
  const solution = solutionMatches.slice(0, 2).join(' ') || '[Solution: not found in the notes]';
  
  // Look for results indicators
  const resultsPatterns = /(?:\d+%|\$\d+|\d+x|reduced|increased|improved|saved|grew|achieved)[^.]*[.!?]/gi;
  const resultsMatches = notes.match(resultsPatterns) || [];
  const results = resultsMatches.slice(0, 3).join(' ') || '[Results: not found in the notes]';
  
  // Look for quotes
  const quotePatterns = /"[^"]+"/g;
  const foundQuotes = notes.match(quotePatterns) || [];
  const bestQuote = quote || foundQuotes[0]?.replace(/"/g, '') || '';
  
  return `# 📝 Case Study Draft (Parsed from Notes)
## ${customerName} + ${product}

⚠️ **Note:** This case study was auto-generated from interview notes. Please review and enhance with specific details.

---

${generateFullCaseStudy(customerName, industry, challenge, solution, results, bestQuote, product)}

---

## 🔍 Key Points Extracted from Notes

${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

---

## ⚠️ Items to Verify/Enhance

1. **Challenge section:** Add specific metrics (time wasted, money lost, etc.)
2. **Solution section:** Verify implementation timeline and process
3. **Results section:** Confirm exact percentages and timeframes
4. **Quote:** Get customer approval for the extracted quote
5. **Company description:** Add accurate ${customerName} company info

`;
}

function generateFullCaseStudy(
  customerName: string,
  industry: string,
  challenge: string,
  solution: string,
  results: string,
  quote: string | undefined,
  product: string
): string {
  // Parse results into bullet points
  const resultPoints = parseListItems(results);
  
  // Run 12 (R12-20): the title is the result the user gave ("No-shows down 30% in 3 months with ExampleCo Scheduler").
  const headlineResult = resultPoints[0] || results;
  
  return `# 📊 Case Study: ${customerName}

## ${headlineResult} with ${product}

---

### About ${customerName}

**Industry:** ${industry || '[not supplied]'}
**Challenge:** ${getSummaryChallenge(challenge)}
**Solution:** ${product}
**Key Result:** ${resultPoints[0] || results}

---

## The Challenge

${challenge}

[What the problem cost them, in their words]

---

## The Solution

${solution ?? 'not supplied'}

### Why ${customerName} Chose ${product}

[Why they chose you, in their words]

### Implementation

[How the rollout went, in their words]

---

## The Results

${resultPoints.map((r, i) => `### ${i + 1}. ${r}

[What this result changed for them, in their words]`).join('\n\n')}

---

${quote ? `## In Their Words

> "${quote}"
>
> ${customerName}

---` : ''}

## Key Takeaways

1. **Challenge:** ${getSummaryChallenge(challenge)}
2. **Solution:** ${solution}
3. **Impact:** ${resultPoints[0] || results}

---

## Ready to Achieve Similar Results?

[CTA: Schedule a demo / Get started / Talk to sales]

---

## 📋 Distribution Formats

### One-Line Version (for testimonial pages):
"${customerName}: ${lowerCommonWords(headlineResult)} after implementing ${product}."

### Social Media Version:
🎯 ${customerName} was struggling with ${lowerCommonWords(getSummaryChallenge(challenge))}.

Then they implemented ${product}.

The results?
${resultPoints.slice(0, 3).map(r => `✅ ${r}`).join('\n')}

${quote ? `"${quote.substring(0, 100)}..."` : ''}

Read the full story: [link]

### Email Snippet:
Quick success story: ${customerName}${industry ? ` (${industry})` : ''} faced ${lowerCommonWords(getSummaryChallenge(challenge))}. After implementing ${product}, they saw ${resultPoints[0] ? lowerCommonWords(resultPoints[0]) : 'significant improvements'}. [Read the full story →]

`;
}

function getSummaryChallenge(challenge: string): string {
  const words = challenge.split(/\s+/).slice(0, 10);
  return words.join(' ') + (challenge.split(/\s+/).length > 10 ? '...' : '');
}
