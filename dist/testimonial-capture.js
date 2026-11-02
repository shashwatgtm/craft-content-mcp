import { signal, readSignal, evidenceLine } from './text-signals.js';
import { cap, SUGGESTION_FOOTER, clipEcho } from './utils.js';
import { readContext, startWords } from "./sector.js";
import { parseProof, fixNumbers, endSentence, capFirst, isGenericName, KIND_NOTE, missingEvidence } from "./draft.js";
export function generateTestimonialCapture(args) {
    const cancellation = signal([args.success_story, args.relationship_context].filter(Boolean).join('; '), 'cancelled');
    const adverse = signal(args.success_story, 'adverse_result');
    const cancelled = args.customer_status ? args.customer_status === 'cancelled' : cancellation.state === 'affirmed';
    if (cancelled || adverse.state === 'affirmed')
        return `# Testimonial request on hold\n\nDo not ask for a quote from this customer now. The supplied account has a cancellation, refund request or adverse result. Resolve the complaint and confirm the customer's current position before considering a request.\n\n${cancelled && args.customer_status ? 'Basis: confirmed customer status is cancelled.' : evidenceLine('Account evidence', cancelled ? cancellation : adverse)}`;
    const name = args.customer_name.trim();
    const company = args.customer_company.trim();
    const role = args.customer_role?.trim() || '';
    // Run 12 (R12-20): defaults are marked as assumed in the profile table.
    const roleShown = role || 'not supplied';
    const context = args.relationship_context || 'not supplied';
    const storyFull = fixNumbers(args.success_story.trim());
    const type = args.testimonial_type;
    const useCase = args.use_case || 'Use not approved';
    const permissionText = args.use_case || '';
    const confirmation = (label) => permissionText.split(/[;\n]/).find(line => new RegExp('^Approved ' + label + ':\\s*\\S', 'i').test(line.trim()))?.replace(/^[^:]+:\s*/, '').trim() || '';
    const channel = confirmation('channel'), attribution = confirmation('attribution'), wording = confirmation('wording');
    const unknownScope = (value) => !value || /^(?:unknown|none|pending|not (?:yet )?(?:approved|supplied|confirmed)|tbd|to be confirmed)\b/i.test(value);
    const permissionConflict = [storyFull, permissionText, args.relationship_context || ''].some(text => {
        const state = readSignal(text, /\b(?:permission|approval|consent)\b/i).state;
        return state === 'negated' || state === 'unclear' || /\b(?:permission|approval|consent)\b[^.!?;]{0,60}\b(?:absent|pending|withdrawn|revoked|declined)\b/i.test(text);
    });
    const permissionComplete = !permissionConflict && [channel, attribution, wording].every(value => !unknownScope(value));
    const incentive = args.incentive || '';
    // Run 19 (D80, problems 3, 4 and 8): the product the user named is used everywhere the old kit printed "[Product]"; the sector and the
    // business model are read from every text the user gave.
    const product = (args.your_product || '').trim();
    const genericCo = isGenericName(company);
    const fromCompany = genericCo ? (/^(?:an?|the)\s+(.+?)\s+customer\b/i.exec(company)?.[1] || '') : '';
    const P = product || fromCompany || 'the product';
    const co = genericCo ? 'your company' : company;
    // The success story tells what the customer's result was, in the customer's words and industry ("at a payments API company"): when no product is given it is not evidence of what the seller sells, so the sector stays unread.
    const ctx = readContext(args.business_model, { seller: [product || fromCompany], context: [product ? storyFull : '', args.use_case, args.relationship_context], role: [/^\s*(?:the\s+)?(?:developers?|engineers?|engineering teams?|developers? and engineering teams?)\s*$/i.test(args.customer_role || '') && args.customer_company ? '' : args.customer_role], buyer: [args.customer_company] }, args.your_sector); // run 21c round 5: a plain developer title says who uses the product, not what the seller sells, when the customer's own industry is given
    const w = startWords(ctx.model);
    // The success story is sorted: only a result, a quote or a story with a figure can be said to belong to this company, and only when
    // the company is named. A result of another customer, a recognition or a company-wide count is never put in this contact's mouth.
    const items = parseProof(storyFull);
    const evidenceLimit = (p) => missingEvidence(p.text) || /\bno (?:measured|verified)\b|\b(?:permission|approval|consent)\b.{0,60}\b(?:not|unknown|pending|absent|withdrawn|revoked|declined)\b/i.test(p.text);
    const own = genericCo ? [] : items.filter(i => !evidenceLimit(i) && (i.kind === 'result' || i.kind === 'quote' || (i.kind === 'title' && i.figure)));
    const evidenceNote = (p) => evidenceLimit(p) ? 'an evidence or permission limit, not a customer result' : !p.figure && /\b(?:said|says|reported|felt|according to)\b/i.test(p.text) ? 'reported experience, not measured proof' : KIND_NOTE[p.kind];
    const elsewhere = items.filter((i) => !own.includes(i));
    const first = isGenericName(name) ? '' : name.replace(/\s*\(.*\)\s*$/, '').split(/\s+/)[0];
    const greeting = first ? `Hi ${first},` : 'Hello,';
    const person = isGenericName(name) ? 'the contact' : name;
    const storyBlock = items.length ? `${items.map((p, i) => `${i + 1}. ${endSentence(capFirst(clipEcho(p.shown, 300)))} *(${evidenceNote(p)}${own.includes(p) ? `; used as ${company}'s result` : genericCo ? "; your contact's company is not named, so this is not put to them as their own" : '; not put to this contact'})*`).join('\n')}` : '';
    let output = `# Testimonial Capture Kit

## Publication permission first
${permissionComplete ? 'Permission scope supplied; confirm the final quote matches the approved wording before publication.' : 'Use not approved. The material below is for interview and permission review only; no publishable quote is approved.'}
| Confirmation | Status |
| --- | --- |
| Channel | ${channel || 'Unknown; ask where the customer permits use'} |
| Attribution | ${attribution || 'Unknown; confirm name, role, company or anonymity'} |
| Permitted wording | ${wording || 'Unknown; ask the customer to approve the exact words'} |
Keep the customer permission record and date with the final quote. Suggested wording remains a draft for the customer to correct.
## ${isGenericName(name) ? (role || 'Contact') : name} at ${company}

---

## Customer Profile

| Detail | Information |
|--------|-------------|
| **Name** | ${name} |
| **Company** | ${company} |
| **Role** | ${roleShown} |
| **Product** | ${product || (fromCompany ? `not given (your product was not given; ${fromCompany} is read from the company field; add your product to name your product)` : 'not given (your product was not given, so the templates say "the product"; add it to name your product)')} |
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

*Notes for you, not part of the email: all suggested times in the email are planning examples; confirm the actual effort before sending.${args.use_case ? '' : ' Usage was not given; agree the channel and scope with the customer before collecting permission.'} Review sites suit software products; for other businesses a named reference call or a case study is the usual proof.*

---

## Interview Questions

${generateInterviewQuestions(type, P, co, role, ctx.v, ctx.model, w, own)}

---

## Testimonial Templates

*Use these complete prompts to collect the customer’s own words. Do not draft a customer quote without their answer and approval.*

### Short Format (1-2 sentences)
*Draft for customer wording review; publication channel and attribution require approval.*

Ask: "What changed or stayed the same after you started using ${P}? Which part of that experience would you permit us to quote?"
${own.length ? `\nFact to check with the customer before quoting: ${endSentence(capFirst(clipEcho(own[0].shown, 220)))}\n` : ''}
${isGenericName(name) ? (role || 'Contact') : name}${isGenericName(name) || !role ? '' : `, ${role}`} at ${company}

---

### Medium Format (3-4 sentences)
*For: Case study pull quotes, sales deck*

Ask: "What was the work like before ${P}, what is it like now, and what worked or did not work for your team?" Record the answer without changing its meaning, then request approval of the exact excerpt.
${own.length ? `\nFacts to check with the customer before quoting:\n${own.slice(0, 3).map((p) => `- ${endSentence(capFirst(clipEcho(p.shown, 220)))}`).join('\n')}\n` : ''}
${isGenericName(name) ? (role || 'Contact') : name}${isGenericName(name) || !role ? '' : `, ${role}`} at ${company}

---

### Long Format (Full paragraph)
*For: Case studies, press releases, testimonial pages*

Ask the customer to describe the original problem, selection decision, ${w.rollout} and observed outcome. Include unchanged or adverse outcomes, the period and any measurement limits. Return the exact proposed paragraph for correction and permission.
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
- [ ] Identify observed outcomes and measurement limits, including unchanged or adverse results
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
function seenBlock(company, own) {
    if (!own.length)
        return '';
    return `\nWhat I have seen at ${company}:\n${own.slice(0, 3).map((p) => `- ${endSentence(capFirst(clipEcho(p.shown, 220)))}`).join('\n')}\n`;
}
function generateRequestEmail(greeting, company, own, type, useCase, incentive, P, model, role) {
    const reviewNote = model && model !== 'saas' && model !== 'hardware_software'
        ? `
*Note: review sites suit software products, where buyers read them before they buy. For this kind of business a named reference call or a case study is the more usual proof. Send this email only if your buyers do read a review site.*
`
        : '';
    const about = own.length ? `${seenBlock(company, own)}` : `\nI would like to hear how ${P} has worked for you and for your team${/^your company$/i.test(company) ? "" : ` at ${company}`}.\n`;
    const templates = {
        written_quote: `
**Subject:** Quick favor: share your experience with ${P}?

${greeting}

I'm writing to ask about your experience.
${about}
Would you be willing to share a brief quote about your experience? Just 2-3 sentences about what ${P} has meant for your team.

Here's what it involves:
- **Time:** 5 minutes to write (or I can draft it for you)
- **Approval:** You'll see and approve anything before it's used
${useCase ? `- **Usage:** ${useCase}\n` : ''}${incentive ? `- **Thank you:** ${incentive}` : ''}

I can even draft something based on what you've shared, and you just edit/approve. Would that work?

Thanks for considering,

`,
        video_interview: `
**Subject:** Invite: share your story in a quick video

${greeting}

I'm writing to ask about your experience.
${about}
The interview can cover what worked, what did not and what remains unmeasured.

Would you be open to a brief video interview? Here's what it looks like:

- **Time:** 20-30 minute video call at your convenience
- **Topics:** Your challenges before, experience with ${P}, results you've seen
- **Format:** Casual conversation, not scripted
${useCase ? `- **Usage:** ${useCase}\n` : ''}- **Your review:** You'll approve the final edit before anything goes live
${incentive ? `- **Thank you:** ${incentive}` : ''}

If you say yes, tell me whether you want us to handle the production so you only have to show up and share your story.

Would next week work for you?

Best,

`,
        case_study_interview: `
**Subject:** ${company === 'your company' ? 'Feature your company' : `Feature ${company}`} in our next case study?

${greeting}
${about}
I'd love to tell your story in a detailed case study. This would include:

- **Interview:** 30-45 minute call about your journey
- **Draft review:** You approve all content before publishing
- **Usage:** We would agree the publication channel, attribution and exact wording with you first
${incentive ? `- **Thank you:** ${incentive}` : ''}

Would you be open to a quick call to discuss the scope and permission before deciding whether to take part?

Best,

`,
        g2_review: `${reviewNote}
**Subject:** Quick favor: a short review of ${P}?

${greeting}

I'm writing to ask about your experience.
${about}
Your experience with ${P} would really help others make informed decisions.

Would you be willing to write a review? If so, I will confirm the review page and share its link.

It takes only a few minutes, and you can be as detailed or brief as you'd like.
${incentive ? `\nAs a thank you: ${incentive}` : ''}

Please describe your own experience, including what did not work or stayed the same. We would like to understand it regardless of whether the review is favourable.

Thanks for considering,

`,
        reference_call: `
**Subject:** Would you be a reference for ${P}?

${greeting}

I'm writing to ask about your experience.
${about}
Would you consider a reference call if we identify a relevant prospective buyer? Before any introduction, we would explain their situation and ask your permission to share your contact details.

A call would involve:

- **Time:** 15-20 minutes at your convenience
- **Topics:** Your experience with ${P} and results you've seen
- **When:** We'll coordinate with your availability
${incentive ? `- **Thank you:** ${incentive}` : ''}

You can decide whether the situation is relevant and decline any request. We would agree the participants, topics and timing with you before scheduling.

Would you be willing?

Thanks,

`
    };
    return templates[type] || templates.written_quote;
}
// Role families read from the customer's job title: each gets three questions in that role's own terms. The first family that matches wins,
// so a security operations role is read as security, not operations.
const ROLE_QUESTIONS = [
    [/security|ciso|\bsoc\b|risk|compliance|analyst/i, 'security', [
            'What did your team see in the first weeks that it had not seen before?',
            'How did the change affect the time your analysts spend on low-value work, and on alerts that turned out not to matter?',
            'What did your auditors or leadership ask for, and what did you show them?'
        ]],
    [/finance|controller|cfo|accounts|treasury|audit/i, 'finance', [
            'How did the month-end close, the approvals or the audit preparation change for your team?',
            'What did your own review or audit say before and after?',
            'Who in finance had to be convinced, and what convinced them?'
        ]],
    [/product|pricing|billing|packaging/i, 'product', [
            'How did the way you launch or change pricing and packaging change, and how long does a change take now?',
            'Which tasks did your finance and engineering teams still do by hand, and which changed?',
            'What would you tell another product leader about moving off the old setup?'
        ]],
    [/engineer|developer|\bqa\b|devops|platform/i, 'engineering', [
            'What did your developers notice first in their daily work?',
            'How did it fit into the pipeline and tools you already had?',
            'What would you tell another engineering lead about the effort to adopt it?'
        ]],
    [/\bIT\b|network|infrastructure|cio|cto|technology|systems/i, 'IT', [
            'What did you have to change in your own systems, and how long did the change take?',
            'How did the change affect your team\'s workload and incident handling?',
            'What did your security or architecture review need to see?'
        ]],
    [/support|customer (?:service|experience|success)|\bcx\b/i, 'support', [
            'What changed or stayed the same in your team\'s routine work, and which tasks still needed people?',
            'What did your agents think of it in the first month?',
            'Which kinds of cases do you still keep with people, and why?'
        ]],
    [/sales|marketing|revenue|growth|\bcro\b|distribution|national/i, 'revenue', [
            'What changed in the way your reps or campaigns work?',
            'Which numbers changed or stayed the same, over what period, and where were they recorded?',
            'How did you get your team to adopt it?'
        ]],
    [/operations|\bops\b|\bcoo\b|logistics|supply|transport|fleet|dispatch|last-mile|warehouse/i, 'operations', [
            'What did a normal day look like for your team before, and what is different now?',
            'Which parts of the daily work became easier, harder or stayed the same?',
            'How did your frontline team react in the first weeks?'
        ]],
    [/investment|portfolio|allocat|\bcio\b/i, 'investment', [
            'How did the way you form a view or build a portfolio change, and what did your investment committee ask to see?',
            'What did you need to understand about how the output is produced before you relied on it?',
            'What would you tell another allocator about the first months?'
        ]]
];
function roleBlock(role) {
    if (!role)
        return `### Questions for Their Role\n\n1. What was your own part in choosing and rolling it out?\n2. What did you have to explain to your own leadership, and what convinced them?\n3. What would you tell another leader in your position?\n`;
    const hit = ROLE_QUESTIONS.find(([re]) => re.test(role));
    const qs = hit ? hit[2] : [
        'What was your own part in choosing and rolling it out?',
        'What did you have to explain to your own leadership, and what convinced them?',
        'What would you tell another leader in your position?'
    ];
    return `### Questions for this role (${role})\n\n${qs.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n`;
}
function generateInterviewQuestions(type, P, company, role, v, model, w, own) {
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
10. Did you observe any results? If so, when, and what record supports them?

### Results
11. What changed, if anything?
12. What records show the starting point, current value and period? Keep unmeasured values unknown.
13. What changed or stayed the same in your team's daily work?
14. What stayed the same or became harder with ${P}?
${figures.map((f, i) => `${15 + i}. You told us: "${clipEcho(f.text, 160)}". What was the figure before, what is it now, over what period, and who measured it?`).join('\n')}

### Recommendation
${15 + figures.length}. What would you tell someone considering ${P}?
${16 + figures.length}. Who, if anyone, would ${P} suit, and who would it not suit?

${roleBlock(role)}
${v ? `### Questions on the Measures ${cap(v.name)} Buyers Look For

${v.metrics.slice(0, 3).map((m, i) => `${i + 1}. For ${m}, what did you measure before and after the ${w.rollout}, if anything? Give the period and source, or leave it unmeasured.`).join('\n')}

### Context Questions in the Language of ${cap(v.name)}
Ask these in the past tense, about the time before ${P}:

${v.discovery.filter((d) => !/\bwill\b/i.test(d)).slice(0, 3).map((d, i) => `${i + 1}. ${d}`).join('\n')}

*A strong proof point here: ${v.proofShape}*
*Terms this sector's buyers use, to listen for in the answers: ${v.vocabulary.slice(0, 6).join(', ')}.*
` : `### Questions on Measures

1. Which one measure did the customer's leadership watch before, and what is it now? Ask for the value before, the value after and the period, or leave it unmeasured.
2. What did the work cost them in time, money or risk before ${P}, and what does it cost now?
3. Which part of the result would the customer's own manager or committee stand behind in writing?
`}
### Approval and Sign-Off
- Who at ${company === 'your company' ? 'your company' : company} needs to approve a named quote or a logo (legal, communications, the customer's own manager)?
- Is there anything about ${company === 'your company' ? 'your company\'s' : `${company}'s`} use that must not be mentioned (customer data, security details, pricing)?
`;
    const n = 17 + figures.length;
    const typeSpecific = {
        video_interview: `

### Video-Specific Questions
${n}. When did you first have enough evidence to judge ${P}, and what did it show?
${n + 1}. If you could go back, what would you tell yourself about this decision?
${n + 2}. What surprised you most about working with us?`,
        case_study_interview: `

### Case Study Deep-Dive
${n}. Can you walk me through a specific scenario and explain what changed or stayed the same with ${P}?
${n + 1}. What metrics do you track? How have they changed?
${n + 2}. What does your team's workflow look like now vs. before?
${n + 3}. Were there unexpected benefits, costs or problems, or no change?`,
        reference_call: `

### Reference-Specific
${n}. What should prospects know about the ${w.rollout}?
${n + 1}. ${learning}
${n + 2}. How responsive is support?
${n + 3}. What would you do differently if starting over?`
    };
    return baseQuestions + (typeSpecific[type] || '');
}
function generateTypeSpecificGuidance(type, name, company, useCase, incentive, P, w, model) {
    const guidance = {
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
4. Check the exact words and their context with the customer
5. Ask who the product would and would not suit

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
- What you tried to do and whether the product helped
- Which features worked, did not work or were unused
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
//# sourceMappingURL=testimonial-capture.js.map