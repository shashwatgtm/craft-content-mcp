import { cap, aOrAn, SUGGESTION_FOOTER, clipEcho } from './utils.js';
import { readContext, startWords, type Vertical, type BusinessModel } from './sector.ts';
import { parseProof, fixNumbers, endSentence, capFirst, proseJoin, isGenericName, shortenClauses, KIND_NOTE, type ProofItem } from './draft.ts';

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
  const name = args.customer_name.trim();
  const company = args.customer_company.trim();
  const role = args.customer_role?.trim() || '';
  // Run 12 (R12-20): defaults are marked as assumed in the profile table.
  const roleShown = role || 'not supplied';
  const context = args.relationship_context || 'not supplied';
  const storyFull = fixNumbers(args.success_story.trim());
  const type = args.testimonial_type;
  const useCase = args.use_case || 'marketing materials (assumed, not supplied)';
  const incentive = args.incentive || '';
  // Run 19 (D80, problems 3, 4 and 8): the product the user named is used everywhere the old kit printed "[Product]"; the sector and the
  // business model are read from every text the user gave.
  const product = (args.your_product || '').trim();
  const genericCo = isGenericName(company);
  const fromCompany = genericCo ? (/^(?:an?|the)\s+(.+?)\s+customer\b/i.exec(company)?.[1] || '') : '';
  const P = product || fromCompany || 'the product';
  const co = genericCo ? 'your company' : company;
  const ctx = readContext(args.business_model, { seller: [product, args.use_case], context: [storyFull, args.relationship_context], role: [args.customer_role], buyer: [args.customer_company] });
  const w = startWords(ctx.model);

  // The success story is sorted: only a result, a quote or a story with a figure can be said to belong to this company, and only when
  // the company is named. A result of another customer, a recognition or a company-wide count is never put in this contact's mouth.
  const items = parseProof(storyFull);
  const own = genericCo ? [] : items.filter((i) => i.kind === 'result' || i.kind === 'quote' || (i.kind === 'title' && i.figure));
  const elsewhere = items.filter((i) => !own.includes(i));
  const first = isGenericName(name) ? '' : name.replace(/\s*\(.*\)\s*$/, '').split(/\s+/)[0];
  const greeting = first ? `Hi ${first},` : 'Hello,';
  const person = isGenericName(name) ? 'the contact' : name;

  const storyBlock = items.length ? `${items.map((p, i) => `${i + 1}. ${endSentence(capFirst(clipEcho(p.shown, 300)))} *(${KIND_NOTE[p.kind]}${own.includes(p) ? `; used as ${company}'s result` : genericCo ? '; company name not given, so not put to this contact' : '; not put to this contact'})*`).join('\n')}` : '';

  let output = `# Testimonial Capture Kit
## ${isGenericName(name) ? (role || 'Contact') : name} at ${company}

---

## Customer Profile

| Detail | Information |
|--------|-------------|
| **Name** | ${name} |
| **Company** | ${company} |
| **Role** | ${roleShown} |
| **Product** | ${product || (fromCompany ? `not given (your_product was not given; ${fromCompany} is read from the company field; add your_product to name your product)` : 'not given (your_product was not given, so the templates say "the product"; add it to name your product)')} |
| **Relationship** | ${context} |
| **Testimonial Type** | ${type.replace(/_/g, ' ')} |
| **Use Case** | ${useCase} |

${ctx.line}

---

## Success Story Summary

${storyFull}

${items.length > 1 || (items.length === 1 && own.length === 0) ? `**What each part of the story is, and how this kit uses it:**\n\n${storyBlock}\n\n${genericCo ? `*The company name (${company}) does not name a company, so none of these is put to the contact as their own result. The request email asks about their experience instead, and the results are kept for you to check against what the contact tells you.*` : own.length ? `*${own.length} of ${items.length} ${own.length === 1 ? 'part is' : 'parts are'} used as ${company}'s result in the email and the templates. Recognition, company-wide counts and claims are not.*` : `*None of these is a customer result or quote, so the email does not state a result.*`}\n` : ''}
---

## Request Email

`;

  output += generateRequestEmail(greeting, co, own, type, args.use_case || '', incentive, P, ctx.model, role);

  output += `

*Notes for you, not part of the email: the time in the email (5 minutes to write, 15-20 minutes for a call) is an example, so change it to what you will really ask for.${args.use_case ? '' : ' use_case was not given, so the email names no usage; add it if the customer should know where the quote will appear.'} Review sites suit software products; for other businesses a named reference call or a case study is the usual proof.*

---

## Interview Questions

${generateInterviewQuestions(type, P, co, role, ctx.v, ctx.model, w, own)}

---

## Testimonial Templates

*Sentence starters to offer the customer. The customer completes them in their own words and approves the final text; nothing below is a quote until they do.*

### Short Format (1-2 sentences)
*For: Website hero section, social proof snippets*

Starter: "Since we started with ${P}, ..."
${own.length ? `\nFact to check with the customer before quoting: ${endSentence(capFirst(clipEcho(own[0].shown, 220)))}\n` : ''}
${isGenericName(name) ? (role || 'Contact') : name}${isGenericName(name) || !role ? '' : `, ${role}`} at ${company}

---

### Medium Format (3-4 sentences)
*For: Case study pull quotes, sales deck*

Starters: "Before ${P}, ..." then "With ${P}, ..." then "What I value most is ..."
${own.length ? `\nFacts to check with the customer before quoting:\n${own.slice(0, 3).map((p) => `- ${endSentence(capFirst(clipEcho(p.shown, 220)))}`).join('\n')}\n` : ''}
${isGenericName(name) ? (role || 'Contact') : name}${isGenericName(name) || !role ? '' : `, ${role}`} at ${company}

---

### Long Format (Full paragraph)
*For: Case studies, press releases, testimonial pages*

Starters: "At ${co}, the problem was ..." then "We chose ${P} because ..." then "The ${w.rollout} was ..." then "Within ... we saw ..."
${own.length ? `\nFacts to check with the customer before quoting:\n${own.slice(0, 4).map((p) => `- ${endSentence(capFirst(clipEcho(p.shown, 220)))}`).join('\n')}\n` : ''}
${isGenericName(name) ? (role || 'Contact') : name}${isGenericName(name) || !role ? '' : `, ${role}`} at ${company}

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

// The lines of the request that state what the sender has seen: only results that belong to this company, each whole, as a list.
function seenBlock(company: string, own: ProofItem[]): string {
  if (!own.length) return '';
  return `\nWhat I have seen at ${company}:\n${own.slice(0, 3).map((p) => `- ${endSentence(capFirst(clipEcho(p.shown, 220)))}`).join('\n')}\n`;
}

function generateRequestEmail(
  greeting: string,
  company: string,
  own: ProofItem[],
  type: string,
  useCase: string,
  incentive: string,
  P: string,
  model: BusinessModel | null,
  role: string
): string {
  const reviewNote = model && model !== 'saas' && model !== 'hardware_software'
    ? `
*Note: review sites suit software products, where buyers read them before they buy. For this kind of business a named reference call or a case study is the more usual proof. Send this email only if your buyers do read a review site.*
`
    : '';
  const about = own.length ? `${seenBlock(company, own)}` : `\nI would like to hear how ${P} has worked for youand for your team at ${company}.\n`;
  const templates: Record<string, string> = {
    written_quote: `
**Subject:** Quick favor: share your experience with ${P}?

${greeting}

I hope this finds you well!
${about}
Would you be willing to share a brief quote about your experience? Just 2-3 sentences about what ${P} has meant for your team.

Here's what it involves:
- **Time:** 5 minutes to write (or I can draft it for you)
- **Approval:** You'll see and approve anything before it's used
${useCase ? `- **Usage:** ${useCase}\n` : ''}${incentive ? `- **Thank you:** ${incentive}` : ''}

I can even draft something based on what you've shared, and you just edit/approve. Would that work?

Thanks for considering,
[Your name]
`,
    video_interview: `
**Subject:** Invite: share your story in a quick video

${greeting}

I hope you're doing well!
${about}
Your story is exactly the kind that helps others facing similar challenges.

Would you be open to a brief video interview? Here's what it looks like:

- **Time:** 20-30 minute video call at your convenience
- **Topics:** Your challenges before, experience with ${P}, results you've seen
- **Format:** Casual conversation, not scripted
${useCase ? `- **Usage:** ${useCase}\n` : ''}- **Your review:** You'll approve the final edit before anything goes live
${incentive ? `- **Thank you:** ${incentive}` : ''}

If you say yes, tell me whether you want us to handle the production so you only have to show up and share your story.

Would next week work for you?

Best,
[Your name]
`,
    case_study_interview: `
**Subject:** ${company === 'your company' ? 'Feature your company' : `Feature ${company}`} in our next case study?

${greeting}
${about}
I'd love to tell your story in a detailed case study. This would include:

- **Interview:** 30-45 minute call about your journey
- **Draft review:** You approve all content before publishing
- **Exposure:** Featured on our website, and in our newsletter if you agree
${incentive ? `- **Thank you:** ${incentive}` : ''}

Would you be open to a quick call to discuss? I can share examples of past case studies we've done if that helps.

Best,
[Your name]
`,
    g2_review: `${reviewNote}
**Subject:** Quick favor: a short review of ${P}?

${greeting}

I hope you're well!
${about}
Your experience with ${P} would really help others make informed decisions.

Would you be willing to leave a quick review? Send them the link to the review page (add it before sending).

It takes only a few minutes, and you can be as detailed or brief as you'd like.
${incentive ? `\nAs a thank you: ${incentive}` : ''}

Your honest feedback helps others like you find solutions that work. (And selfishly, helps us understand what we're doing right!)

Thanks for considering,
[Your name]
`,
    reference_call: `
**Subject:** Would you be a reference for ${P}?

${greeting}

I hope you're doing well!
${about}
A prospect who is evaluating ${P} would like to hear directly from someone who has been through the journey. (Name the prospect and their challenge in this paragraph, only if it is similar to what ${company} had.)

Would you be open to a brief reference call? Here's what it involves:

- **Time:** 15-20 minutes at your convenience
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

// Role families read from the customer's job title: each gets three questions in that role's own terms. The first family that matches wins,
// so a security operations role is read as security, not operations.
const ROLE_QUESTIONS: [RegExp, string, string[]][] = [
  [/security|ciso|\bsoc\b|risk|compliance|analyst/i, 'security', [
    'What did your team see in the first weeks that it had not seen before?',
    'How did the change affect the time your analysts spend on low-value work, and on alerts that turned out not to matter?',
    'What did your auditors or leadership ask for, and what did you show them?']],
  [/finance|controller|cfo|accounts|treasury|audit/i, 'finance', [
    'How did the month-end close, the approvals or the audit preparation change for your team?',
    'What did your own review or audit say before and after?',
    'Who in finance had to be convinced, and what convinced them?']],
  [/product|pricing|billing|packaging/i, 'product', [
    'How did the way you launch or change pricing and packaging change, and how long does a change take now?',
    'What did your finance and engineering teams stop having to do by hand?',
    'What would you tell another product leader about moving off the old setup?']],
  [/engineer|developer|\bqa\b|devops|platform/i, 'engineering', [
    'What did your developers notice first in their daily work?',
    'How did it fit into the pipeline and tools you already had?',
    'What would you tell another engineering lead about the effort to adopt it?']],
  [/\bIT\b|network|infrastructure|cio|cto|technology|systems/i, 'IT', [
    'What did you have to change in your own systems, and how long did the change take?',
    'How did the change affect your team\'s workload and incident handling?',
    'What did your security or architecture review need to see?']],
  [/support|customer (?:service|experience|success)|\bcx\b/i, 'support', [
    'How did your team\'s day change once the product took over the routine work?',
    'What did your agents think of it in the first month?',
    'Which kinds of cases do you still keep with people, and why?']],
  [/sales|marketing|revenue|growth|\bcro\b|distribution|national/i, 'revenue', [
    'What changed in the way your reps or campaigns work?',
    'Which number moved first, and how soon did you see it?',
    'How did you get your team to adopt it?']],
  [/operations|\bops\b|\bcoo\b|logistics|supply|transport|fleet|dispatch|last-mile|warehouse/i, 'operations', [
    'What did a normal day look like for your team before, and what is different now?',
    'Which part of the daily work got easier first, and which part did not change?',
    'How did your frontline team react in the first weeks?']],
  [/investment|portfolio|allocat|\bcio\b/i, 'investment', [
    'How did the way you form a view or build a portfolio change, and what did your investment committee ask to see?',
    'What did you need to understand about how the output is produced before you relied on it?',
    'What would you tell another allocator about the first months?']]
];

function roleBlock(role: string | undefined): string {
  if (!role) return `### Questions for Their Role\n\n1. What was your own part in choosing and rolling it out?\n2. What did you have to explain to your own leadership, and what convinced them?\n3. What would you tell another leader in your position?\n`;
  const hit = ROLE_QUESTIONS.find(([re]) => re.test(role));
  const qs = hit ? hit[2] : [
    'What was your own part in choosing and rolling it out?',
    'What did you have to explain to your own leadership, and what convinced them?',
    'What would you tell another leader in your position?'];
  return `### Questions for this role (${role})\n\n${qs.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n`;
}

function generateInterviewQuestions(type: string, P: string, company: string, role: string | undefined, v: Vertical | null, model: BusinessModel | null, w: { rollout: string; value: string; reach: string }, own: ProofItem[]): string {
  const learning = !model || model === 'saas' || model === 'hardware_software' ? "What's the learning curve like?" : 'What did your team have to change in how it works?';
  const figures = own.filter((p) => p.figure).slice(0, 3);
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
${figures.map((f, i) => `${15 + i}. You told us: "${clipEcho(f.text, 160)}". What was the figure before, what is it now, over what period, and who measured it?`).join('\n')}

### Recommendation
${15 + figures.length}. What would you tell someone considering ${P}?
${16 + figures.length}. Who would you recommend ${P} to?

${roleBlock(role)}
${v ? `### Questions on the Measures ${cap(v.name)} Buyers Look For

${v.metrics.slice(0, 3).map((m, i) => `${i + 1}. How did ${m} change after the ${w.rollout}? What was it before, and over what period?`).join('\n')}

### Context Questions in the Language of ${cap(v.name)}
Ask these in the past tense, about the time before ${P}:

${v.discovery.filter((d) => !/\bwill\b/i.test(d)).slice(0, 3).map((d, i) => `${i + 1}. ${d}`).join('\n')}

*A strong proof point here: ${v.proofShape}*
*Terms this sector's buyers use, to listen for in the answers: ${v.vocabulary.slice(0, 6).join(', ')}.*
` : `### Questions on Measures

1. Which one measure did the customer's leadership watch before, and what is it now? Ask for the value before, the value after and the period.
2. What did the work cost them in time, money or risk before ${P}, and what does it cost now?
3. Which part of the result would the customer's own manager or committee stand behind in writing?
`}
### Approval and Sign-Off
- Who at ${company === 'your company' ? 'your company' : company} needs to approve a named quote or a logo (legal, communications, the customer's own manager)?
- Is there anything about ${company === 'your company' ? 'your company\'s' : `${company}'s`} use that must not be mentioned (customer data, security details, pricing)?
`;

  const n = 17 + figures.length;
  const typeSpecific: Record<string, string> = {
    video_interview: `

### Video-Specific Questions
${n}. What was the moment you knew ${P} was working?
${n + 1}. If you could go back, what would you tell yourself about this decision?
${n + 2}. What surprised you most about working with us?`,

    case_study_interview: `

### Case Study Deep-Dive
${n}. Can you walk me through a specific scenario where ${P} made a difference?
${n + 1}. What metrics do you track? How have they changed?
${n + 2}. What does your team's workflow look like now vs. before?
${n + 3}. Any unexpected benefits?`,

    reference_call: `

### Reference-Specific
${n}. What should prospects know about the ${w.rollout}?
${n + 1}. ${learning}
${n + 2}. How responsive is support?
${n + 3}. What would you do differently if starting over?`
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


