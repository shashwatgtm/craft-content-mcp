import { cap, aOrAn, SUGGESTION_FOOTER, clipEcho } from './utils.js';
import { readContext, startWords, type Vertical, type BusinessModel } from './sector.ts';

export function generateTestimonialCapture(args: {
  customer_name: string;
  customer_company: string;
  customer_role?: string;
  relationship_context?: string;
  success_story: string;
  testimonial_type: string;
  use_case?: string;
  incentive?: string;
  your_product?: string;
  business_model?: string;
}): string {
  const name = args.customer_name;
  const company = args.customer_company;
  const role = args.customer_role || '[their role]';
  // Run 12 (R12-20): defaults are marked as assumed in the profile table.
  const roleShown = args.customer_role || '[not supplied]';
  const context = args.relationship_context || 'not supplied';
  const storyFull = args.success_story.trim();
  // Run 19 (B15-L1): the Success Story Summary prints the story as typed; the emails and the quote drafts echo it cut at 280 characters.
  const story = clipEcho(storyFull);
  const type = args.testimonial_type;
  const useCase = args.use_case || 'marketing materials (assumed, not supplied)';
  const incentive = args.incentive || '';
  // Run 19 (D80, problems 3, 4 and 8): the product the user named is used everywhere the old kit printed "[Product]"; the sector and the
  // business model are read from every text the user gave.
  const product = (args.your_product || '').trim();
  const P = product || '[your product]';
  const ctx = readContext(args.business_model, { seller: [product], context: [storyFull, args.use_case, args.relationship_context], role: [args.customer_role] });
  const w = startWords(ctx.model);

  let output = `# Testimonial Capture Kit
## ${name} at ${company}

---

## Customer Profile

| Detail | Information |
|--------|-------------|
| **Name** | ${name} |
| **Company** | ${company} |
| **Role** | ${roleShown} |
| **Product** | ${product || 'not given (your_product was not given, so the templates show [your product]; add it to name your product)'} |
| **Relationship** | ${context} |
| **Testimonial Type** | ${type.replace(/_/g, ' ')} |
| **Use Case** | ${useCase} |

${ctx.line}

---

## Success Story Summary

${storyFull}

---

## Request Email

`;

  // Generate type-specific request email
  output += generateRequestEmail(name, company, story, type, useCase, incentive, P, ctx.model);

  // Generate interview questions based on type
  output += `

---

## Interview Questions

${generateInterviewQuestions(type, P, company, args.customer_role, ctx.v, ctx.model, w)}

---

## Testimonial Templates

*Drafts for the customer to edit and approve. The words in brackets are theirs to write; change anything in the result line that is not true.*

### Short Format (1-2 sentences)
*For: Website hero section, social proof snippets*

"[Add one sentence in their words about ${P}]"

Result to quote: ${story}

${name}, ${role} at ${company}

---

### Medium Format (3-4 sentences)
*For: Case study pull quotes, sales deck*

"Before ${P}: [Add the problem, in their words]. With ${P}: [Add what changed, in their words]. [Add what they valued, in their words]."

Result to quote: ${story}

${name}, ${role} at ${company}

---

### Long Format (Full paragraph)
*For: Case studies, press releases, testimonial pages*

"At ${company}, [Add the problem, in their words] was a major obstacle. We chose ${P} because [Add the key differentiator, in their words]. The ${w.rollout} was [Add their experience], and within [Add the timeframe] we saw the result below. [Add what they valued, in their words]."

Result to quote: ${story}

${name}, ${role} at ${company}

---

`;

  // Add type-specific guidance
  output += generateTypeSpecificGuidance(type, name, company, useCase, incentive, P, w, ctx.model);

  const reviewRow = !ctx.model || ctx.model === 'saas' || ctx.model === 'hardware_software' ? '| Review site | Review post | Pending |\n' : '';
  output += `
---

## Process Checklist

### Before Request
- [ ] Confirm customer satisfaction (NPS/CSAT check)
- [ ] Review account health and relationship history${args.relationship_context ? `: ${context}` : ''}
- [ ] Identify specific success metrics to highlight
- [ ] Prepare any incentive details

### Request Phase
- [ ] Send personalized request email
- [ ] Follow up after 3 days if no response
- [ ] Schedule at their convenience
- [ ] Send questions in advance

### Capture Phase
- [ ] Record session (with permission)
- [ ] Take detailed notes
- [ ] Ask for specific numbers/outcomes
- [ ] Request approval for quotes

### Post-Capture
- [ ] Send thank you + any promised incentive
- [ ] Draft testimonial for their approval
- [ ] Get written sign-off before publishing
- [ ] Add to testimonial database
- [ ] Track usage across channels

---

## Testimonial Usage Matrix

| Channel | Format | Status |
|---------|--------|--------|
| Website homepage | Short quote | Pending |
| Case study page | Full story | Pending |
| Sales deck | Medium quote | Pending |
| Social media | Short + photo | Pending |
| Press release | Full paragraph | Pending |
${reviewRow}
---

${SUGGESTION_FOOTER}
`;

  return output;
}

function generateRequestEmail(
  name: string,
  company: string,
  story: string,
  type: string,
  useCase: string,
  incentive: string,
  P: string,
  model: BusinessModel | null
): string {
  const reviewNote = model && model !== 'saas' && model !== 'hardware_software'
    ? `
*Note: review sites suit software products, where buyers read them before they buy. For this kind of business a named reference call or a case study is the more usual proof. Send this email only if your buyers do read a review site.*
`
    : '';
  const templates: Record<string, string> = {
    written_quote: `
**Subject:** Quick favor: share your success story?

Hi [First name],

I hope this finds you well!

I've loved seeing ${company}'s success with ${P}: ${story.replace(/[.!?]+$/, '')}.

Would you be willing to share a brief quote about your experience? Just 2-3 sentences about what ${P} has meant for your team.

Here's what it involves:
- **Time:** 5 minutes to write (or I can draft it for you) (Example figure: replace with your own)
- **Approval:** You'll see and approve anything before it's used
- **Usage:** ${useCase}
${incentive ? `- **Thank you:** ${incentive}` : ''}

I can even draft something based on what you've shared, and you just edit/approve. Would that work?

Thanks for considering,
[Your name]
`,
    video_interview: `
**Subject:** Invite: Share ${company}'s story in a quick video

Hi [First name],

I hope you're doing well!

${company}'s success with ${P} (${story.replace(/[.!?]+$/, '')}) is exactly the kind of story that helps others facing similar challenges.

Would you be open to a brief video interview? Here's what it looks like:

- **Time:** 20-30 minute video call at your convenience
- **Topics:** Your challenges before, experience with ${P}, results you've seen
- **Format:** Casual conversation, not scripted
- **Usage:** ${useCase}
- **Your review:** You'll approve the final edit before anything goes live
${incentive ? `- **Thank you:** ${incentive}` : ''}

[Only if true: We handle all production. You just show up and share your story.]

Would [next week] work for you?

Best,
[Your name]
`,
    case_study_interview: `
**Subject:** Feature ${company} in our next case study?

Hi [First name],

Your team's results with ${P} have been impressive: ${story.replace(/[.!?]+$/, '')}.

I'd love to tell ${company}'s story in a detailed case study. This would include:

- **Interview:** 30-45 minute call about your journey
- **Draft review:** You approve all content before publishing
- **Exposure:** Featured on our website [Only if true: and shared with our newsletter readers]
- **Backlinks:** [Only if you offer them: links to ${company} throughout]
${incentive ? `- **Thank you:** ${incentive}` : ''}

Would you be open to a quick call to discuss? [Only if you have them: I can share examples of past case studies we've done.]

Best,
[Your name]
`,
    g2_review: `${reviewNote}
**Subject:** Quick favor: a short review of ${P}?

Hi [First name],

I hope you're well!

[Only if true: We're building our presence on a review site, and] your experience with ${P} would really help others make informed decisions.

Would you be willing to leave a quick review? Here's the link: [Add the review link]

It takes only a few minutes, and you can be as detailed or brief as you'd like.
${incentive ? `\nAs a thank you: ${incentive}` : ''}

Your honest feedback helps others like you find solutions that work. (And selfishly, helps us understand what we're doing right!)

Thanks for considering,
[Your name]
`,
    reference_call: `
**Subject:** Would you be a reference for ${P}?

Hi [First name],

I hope you're doing well!

A prospect, [Add their company], is evaluating ${P} and facing [Add their challenge, only if it is similar to what ${company} had]. They'd love to hear directly from someone who's been through the journey.

Would you be open to a brief reference call? Here's what it involves:

- **Time:** 15-20 minutes at your convenience (Example figure: replace with your own)
- **Topics:** Your experience with ${P} and results you've seen
- **When:** We'll coordinate with your availability
${incentive ? `- **Thank you:** ${incentive}` : ''}

These conversations are incredibly valuable to prospects making big decisions. I'll make sure it's scheduled at a time that works for you.

Would you be willing?

Thanks,
[Your name]
`
  };

  return templates[type] || templates.written_quote;
}

// Role families read from the customer's job title: each gets three questions in that role's own terms.
const ROLE_QUESTIONS: [RegExp, string, string[]][] = [
  [/finance|controller|cfo|accounts|treasury|audit/i, 'finance', [
    'How did the month-end close, the approvals or the audit preparation change for your team?',
    'What did your own review or audit say before and after?',
    'Who in finance had to be convinced, and what convinced them?']],
  [/operations|\bops\b|logistics|supply|transport|fleet|dispatch|last-mile|warehouse/i, 'operations', [
    'What did a normal day look like for your team before, and what is different now?',
    'Which part of the daily work got easier first, and which part did not change?',
    'How did your frontline team react in the first weeks?']],
  [/\bIT\b|network|infrastructure|cio|cto|technology|systems/i, 'IT', [
    'What did you have to change in your own systems, and how long did the change take?',
    'How did the change affect your team\'s workload and incident handling?',
    'What did your security or architecture review need to see?']],
  [/security|ciso|\bsoc\b|risk|compliance/i, 'security', [
    'What did your team see in the first weeks that it had not seen before?',
    'How did the change affect the time your analysts spend on low-value work?',
    'What did your auditors or leadership ask for, and what did you show them?']],
  [/support|customer (?:service|experience|success)|\bcx\b/i, 'support', [
    'How did your team\'s day change once the product took over the routine work?',
    'What did your agents think of it in the first month?',
    'Which kinds of cases do you still keep with people, and why?']],
  [/engineer|developer|\bqa\b|devops|platform/i, 'engineering', [
    'What did your developers notice first in their daily work?',
    'How did it fit into the pipeline and tools you already had?',
    'What would you tell another engineering lead about the effort to adopt it?']],
  [/sales|marketing|revenue|growth|\bcro\b|distribution/i, 'revenue', [
    'What changed in the way your reps or campaigns work?',
    'Which number moved first, and how soon did you see it?',
    'How did you get your team to adopt it?']]
];

function roleBlock(role: string | undefined): string {
  if (!role) return `### Questions for Their Role\n\n(customer_role was not given: add it to get questions written for their role.)\n`;
  const hit = ROLE_QUESTIONS.find(([re]) => re.test(role));
  const qs = hit ? hit[2] : [
    'What was your own part in choosing and rolling it out?',
    'What did you have to explain to your own leadership, and what convinced them?',
    'What would you tell another leader in your position?'];
  return `### Questions for ${aOrAn(role)} ${role}\n\n${qs.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n`;
}

function generateInterviewQuestions(type: string, P: string, company: string, role: string | undefined, v: Vertical | null, model: BusinessModel | null, w: { rollout: string; value: string; reach: string }): string {
  const learning = !model || model === 'saas' || model === 'hardware_software' ? "What's the learning curve like?" : 'What did your team have to change in how it works?';
  const baseQuestions = `
### Warm-Up
1. Tell me about your role at ${company}.
2. How long have you been using ${P}?

### Before ${P}
3. What was happening before you found ${P}?
4. What specific challenges were you trying to solve?
5. What was the impact of those challenges on your team/business?
6. What had you tried before?

### Decision & ${cap(w.rollout)}
7. How did you first hear about ${P}?
8. What made you choose ${P} over alternatives?
9. What was the ${w.rollout} like?
10. How long did it take to ${w.reach}?

### Results
11. What specific results have you seen?
12. Can you put numbers on that? (%, $, time saved)
13. How has this impacted your team's day-to-day?
14. What's the biggest win you've had with ${P}?

### Recommendation
15. What would you tell someone considering ${P}?
16. Who would you recommend ${P} to?

${roleBlock(role)}
${v ? `### Questions on the Measures ${cap(v.name)} Buyers Look For

${v.metrics.slice(0, 3).map((m, i) => `${i + 1}. How did ${m} change after the ${w.rollout}? What was it before, and over what period?`).join('\n')}

*A strong proof point here: ${v.proofShape}*
*Terms this sector's buyers use, to listen for in the answers: ${v.vocabulary.slice(0, 6).join(', ')}.*
` : `### Questions on Measures

(No sector could be read from what you typed. Name the customer's industry or your product category to get questions on the measures that sector watches.)
`}
### Approval and Sign-Off
- Who at ${company} needs to approve a named quote or a logo (legal, communications, the customer's own manager)?
- Is there anything about ${company}'s use that must not be mentioned (customer data, security details, pricing)?
`;

  const typeSpecific: Record<string, string> = {
    video_interview: `

### Video-Specific Questions
17. What was the moment you knew ${P} was working?
18. If you could go back, what would you tell yourself about this decision?
19. What surprised you most about working with us?`,

    case_study_interview: `

### Case Study Deep-Dive
17. Can you walk me through a specific scenario where ${P} made a difference?
18. What metrics do you track? How have they changed?
19. What does your team's workflow look like now vs. before?
20. Any unexpected benefits?`,

    reference_call: `

### Reference-Specific
17. What should prospects know about the ${w.rollout}?
18. ${learning}
19. How responsive is support?
20. What would you do differently if starting over?`
  };

  return baseQuestions + (typeSpecific[type] || '');
}

function generateTypeSpecificGuidance(
  type: string,
  name: string,
  company: string,
  useCase: string,
  incentive: string,
  P: string,
  w: { rollout: string },
  model: BusinessModel | null
): string {
  const guidance: Record<string, string> = {
    video_interview: `
## Video Interview Tips

### Production Checklist
- [ ] Good lighting (natural or ring light)
- [ ] Quiet environment
- [ ] Stable camera (laptop or phone on tripod)
- [ ] Professional background (or blur)
- [ ] Test audio before recording

### Interview Flow
1. Start with easy warm-up questions
2. Let them tell their story naturally
3. Ask follow-up questions for specifics
4. Get the "sound bites" you need
5. End with their recommendation

### Post-Production
- Edit down to 2-3 minute highlight (Example figure: replace with your own)
- Create 30-second clips for social (Example figure: replace with your own)
- Transcribe for written testimonials
- Get approval before publishing
`,
    case_study_interview: `
## Case Study Interview Tips

### Information to Gather
- Company background and context
- Specific challenge (with metrics if possible)
- Selection process and criteria
- Implementation timeline and experience
- Results (quantified wherever possible)
- Future plans

### Case Study Structure
1. **Executive Summary** (challenge → solution → results)
2. **About ${company}** (industry, size, context)
3. **The Challenge** (detailed pain points)
4. **The Solution** (why ${P}, the ${w.rollout})
5. **The Results** (metrics, outcomes)
6. **What's Next** (future plans)
7. **CTA** (how to learn more)

### Assets to Request
- Company logo (high-res)
- ${name}'s headshot
- Screenshots (if relevant)
- Any data visualizations
`,
    g2_review: `
## Review Site Tips

### What Makes a Great Review
- Specific use case and role
- Pros AND cons (balanced = credible)
- Real metrics or outcomes
- Implementation experience
- Support quality

### Gentle Prompts to Include
If they ask what to write:
- Your role and how you use ${P}
- What problem it solves for you
- Your favorite feature
- Any areas for improvement
- Who you'd recommend it to

### Follow-Up
- Thank them personally
- Share when the review is live
- Recognize them internally
`,
    reference_call: `
## Reference Call Tips

### Before the Call
- Brief ${name} on the prospect's situation
- Share likely questions in advance
- Confirm availability and contact info
- Thank them for their time

### Call Logistics
- Three-way intro or direct connection
- 15-20 minutes typical (Example figure: replace with your own)
- Let them drive the conversation
- Available for follow-up questions

### After the Call
- Thank ${name} again
- Update them on outcome when possible
- Consider additional recognition
`
  };

  return guidance[type] || '';
}


