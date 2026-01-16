export function generateTestimonialCapture(args) {
    const name = args.customer_name;
    const company = args.customer_company;
    const role = args.customer_role || 'Customer';
    const context = args.relationship_context || 'valued customer';
    const story = args.success_story;
    const type = args.testimonial_type;
    const useCase = args.use_case || 'marketing materials';
    const incentive = args.incentive || '';
    let output = `# 🌟 Testimonial Capture Kit
## ${name} at ${company}

---

## Customer Profile

| Detail | Information |
|--------|-------------|
| **Name** | ${name} |
| **Company** | ${company} |
| **Role** | ${role} |
| **Relationship** | ${context} |
| **Testimonial Type** | ${type.replace(/_/g, ' ')} |
| **Use Case** | ${useCase} |

---

## Success Story Summary

${story}

---

## 📧 Request Email

`;
    // Generate type-specific request email
    output += generateRequestEmail(name, company, role, context, story, type, useCase, incentive);
    // Generate interview questions based on type
    output += `

---

## 🎙️ Interview Questions

${generateInterviewQuestions(type, story)}

---

## 📝 Testimonial Templates

### Short Format (1-2 sentences)
*For: Website hero section, social proof snippets*

"[Product] helped ${company} ${getOutcome(story)}. ${getImpact(story)}."

— ${name}, ${role} at ${company}

---

### Medium Format (3-4 sentences)
*For: Case study pull quotes, sales deck*

"Before [Product], we struggled with ${getChallenge(story)}. Since implementing [Product], we've ${getOutcome(story)}. ${getImpact(story)}. I'd recommend it to anyone facing similar challenges."

— ${name}, ${role} at ${company}

---

### Long Format (Full paragraph)
*For: Case studies, press releases, testimonial pages*

"When I joined ${company} as ${role}, ${getChallenge(story)} was a major obstacle. We evaluated several options but [Product] stood out because of [key differentiator]. The implementation was [experience], and within [timeframe], we saw ${getOutcome(story)}. ${getImpact(story)}. The support team has been incredible, and I'd recommend [Product] to any ${role} looking to ${getGoal(story)}."

— ${name}, ${role} at ${company}

---

`;
    // Add type-specific guidance
    output += generateTypeSpecificGuidance(type, name, company, useCase, incentive);
    output += `
---

## ✅ Process Checklist

### Before Request
- [ ] Confirm customer satisfaction (NPS/CSAT check)
- [ ] Review account health and relationship history
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

## 📊 Testimonial Usage Matrix

| Channel | Format | Status |
|---------|--------|--------|
| Website homepage | Short quote | ⬜ Pending |
| Case study page | Full story | ⬜ Pending |
| Sales deck | Medium quote | ⬜ Pending |
| Social media | Short + photo | ⬜ Pending |
| Press release | Full paragraph | ⬜ Pending |
| G2/Review site | Review post | ⬜ Pending |

`;
    return output;
}
function generateRequestEmail(name, company, role, context, story, type, useCase, incentive) {
    const templates = {
        written_quote: `
**Subject:** Quick favor - share your success story?

Hi ${name},

I hope this finds you well!

I've loved seeing ${company}'s success with [Product] — ${story.split('.')[0].toLowerCase()}.

Would you be willing to share a brief quote about your experience? Just 2-3 sentences about what [Product] has meant for your team.

Here's what it involves:
- **Time:** 5 minutes to write (or I can draft based on our conversations)
- **Approval:** You'll see and approve anything before it's used
- **Usage:** ${useCase}
${incentive ? `- **Thank you:** ${incentive}` : ''}

I can even draft something based on what you've shared, and you just edit/approve. Would that work?

Thanks for considering,
[Your name]
`,
        video_interview: `
**Subject:** Invite: Share ${company}'s story in a quick video

Hi ${name},

I hope you're doing well!

${company}'s success with [Product] — ${story.split('.')[0].toLowerCase()} — is exactly the kind of story that helps others facing similar challenges.

Would you be open to a brief video interview? Here's what it looks like:

- **Time:** 20-30 minute video call at your convenience
- **Topics:** Your challenges before, experience with [Product], results you've seen
- **Format:** Casual conversation, not scripted
- **Usage:** ${useCase}
- **Your review:** You'll approve the final edit before anything goes live
${incentive ? `- **Thank you:** ${incentive}` : ''}

We handle all production — you just show up and share your story.

Would [next week] work for you?

Best,
[Your name]
`,
        case_study_interview: `
**Subject:** Feature ${company} in our next case study?

Hi ${name},

Your team's results with [Product] have been impressive — ${story.split('.')[0].toLowerCase()}.

I'd love to tell ${company}'s story in a detailed case study. This would include:

- **Interview:** 30-45 minute call about your journey
- **Draft review:** You approve all content before publishing
- **Exposure:** Featured on our website, shared with our newsletter of 50K+ subscribers
- **Backlinks:** Links to ${company} throughout
${incentive ? `- **Thank you:** ${incentive}` : ''}

Would you be open to a quick call to discuss? I can share examples of past case studies we've done.

Best,
[Your name]
`,
        g2_review: `
**Subject:** Quick favor - 5-minute G2 review?

Hi ${name},

I hope you're well!

We're building our presence on G2, and your experience with [Product] would really help others make informed decisions.

Would you be willing to leave a quick review? Here's the link: [G2 Review Link]

Takes about 5 minutes, and you can be as detailed or brief as you'd like.
${incentive ? `\nAs a thank you: ${incentive}` : ''}

Your honest feedback helps others like you find solutions that work. (And selfishly, helps us understand what we're doing right!)

Thanks for considering,
[Your name]
`,
        reference_call: `
**Subject:** Would you be a reference for [Product]?

Hi ${name},

I hope you're doing well!

We have a prospect who's evaluating [Product] and facing similar challenges to what ${company} had. They'd love to hear directly from someone who's been through the journey.

Would you be open to a brief reference call? Here's what it involves:

- **Time:** 15-20 minutes at your convenience
- **Topics:** Your experience implementing [Product] and results you've seen
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
function generateInterviewQuestions(type, story) {
    const baseQuestions = `
### Warm-Up
1. Tell me about your role at the company.
2. How long have you been using [Product]?

### Before [Product]
3. What was happening before you found [Product]?
4. What specific challenges were you trying to solve?
5. What was the impact of those challenges on your team/business?
6. What had you tried before?

### Decision & Implementation
7. How did you first hear about [Product]?
8. What made you choose [Product] over alternatives?
9. What was the implementation experience like?
10. How long did it take to see value?

### Results
11. What specific results have you seen?
12. Can you put numbers on that? (%, $, time saved)
13. How has this impacted your team's day-to-day?
14. What's the biggest win you've had with [Product]?

### Recommendation
15. What would you tell someone considering [Product]?
16. Who would you recommend [Product] to?
`;
    const typeSpecific = {
        video_interview: `

### Video-Specific Questions
17. What was your "aha moment" with [Product]?
18. If you could go back, what would you tell yourself about this decision?
19. What surprised you most about working with us?`,
        case_study_interview: `

### Case Study Deep-Dive
17. Can you walk me through a specific scenario where [Product] made a difference?
18. What metrics do you track? How have they changed?
19. What does your team's workflow look like now vs. before?
20. Any unexpected benefits?`,
        reference_call: `

### Reference-Specific
17. What should prospects know about implementation?
18. What's the learning curve like?
19. How responsive is support?
20. What would you do differently if starting over?`
    };
    return baseQuestions + (typeSpecific[type] || '');
}
function generateTypeSpecificGuidance(type, name, company, useCase, incentive) {
    const guidance = {
        video_interview: `
## 🎬 Video Interview Tips

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
- Edit down to 2-3 minute highlight
- Create 30-second clips for social
- Transcribe for written testimonials
- Get approval before publishing
`,
        case_study_interview: `
## 📄 Case Study Interview Tips

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
4. **The Solution** (why [Product], implementation)
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
## ⭐ G2 Review Tips

### What Makes a Great Review
- Specific use case and role
- Pros AND cons (balanced = credible)
- Real metrics or outcomes
- Implementation experience
- Support quality

### Gentle Prompts to Include
If they ask what to write:
- Your role and how you use [Product]
- What problem it solves for you
- Your favorite feature
- Any areas for improvement
- Who you'd recommend it to

### Follow-Up
- Thank them personally
- Share when review is live
- Recognize them internally
`,
        reference_call: `
## 📞 Reference Call Tips

### Before the Call
- Brief ${name} on the prospect's situation
- Share likely questions in advance
- Confirm availability and contact info
- Thank them for their time

### Call Logistics
- Three-way intro or direct connection
- 15-20 minutes typical
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
// Helper functions
function getOutcome(story) {
    const outcomeIndicators = ['achieved', 'improved', 'increased', 'reduced', 'saved', 'grew'];
    for (const indicator of outcomeIndicators) {
        if (story.toLowerCase().includes(indicator)) {
            const start = story.toLowerCase().indexOf(indicator);
            const end = story.indexOf('.', start);
            return story.slice(start, end > start ? end : undefined).toLowerCase();
        }
    }
    return 'achieve significant results';
}
function getImpact(story) {
    const impactIndicators = ['now', 'today', 'result', 'impact', 'because'];
    for (const indicator of impactIndicators) {
        if (story.toLowerCase().includes(indicator)) {
            return 'It\'s made a real difference for our team.';
        }
    }
    return 'The impact has been significant.';
}
function getChallenge(story) {
    const challengeIndicators = ['struggled', 'challenge', 'problem', 'issue', 'difficult'];
    for (const indicator of challengeIndicators) {
        if (story.toLowerCase().includes(indicator)) {
            return 'significant operational challenges';
        }
    }
    return 'finding the right solution';
}
function getGoal(story) {
    return 'improve their operations and achieve better results';
}
//# sourceMappingURL=testimonial-capture.js.map