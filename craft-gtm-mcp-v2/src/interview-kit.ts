import { parseListItems } from './utils.js';

export function generateCustomerInterviewKit(args: {
  interview_type: string;
  product_context: string;
  industry?: string;
  product_complexity?: string;
  target_persona: string;
  key_hypotheses?: string;
}): string {
  const interviewType = args.interview_type;
  const industry = args.industry || 'saas';
  const complexity = args.product_complexity || 'moderate';
  const hypotheses = args.key_hypotheses ? parseListItems(args.key_hypotheses) : [];
  
  // Industry-specific terminology and context
  const industryContext: Record<string, { terms: string[]; painPoints: string[]; stakeholders: string[] }> = {
    saas: {
      terms: ['subscription', 'churn', 'onboarding', 'feature adoption', 'integrations'],
      painPoints: ['tool sprawl', 'integration issues', 'user adoption', 'ROI justification'],
      stakeholders: ['IT', 'Finance', 'End users', 'Procurement']
    },
    fintech: {
      terms: ['compliance', 'reconciliation', 'audit trail', 'security', 'regulations'],
      painPoints: ['regulatory burden', 'manual processes', 'fraud risk', 'reporting'],
      stakeholders: ['Compliance', 'Risk', 'Finance', 'Legal']
    },
    healthtech: {
      terms: ['HIPAA', 'EHR integration', 'patient outcomes', 'clinical workflow', 'interoperability'],
      painPoints: ['compliance burden', 'data silos', 'clinician burnout', 'patient engagement'],
      stakeholders: ['Clinicians', 'IT', 'Compliance', 'Administration']
    },
    ecommerce: {
      terms: ['conversion', 'cart abandonment', 'fulfillment', 'inventory', 'customer lifetime value'],
      painPoints: ['abandoned carts', 'returns', 'inventory management', 'shipping costs'],
      stakeholders: ['Operations', 'Marketing', 'Customer Service', 'Finance']
    },
    marketplace: {
      terms: ['supply', 'demand', 'liquidity', 'trust', 'matching'],
      painPoints: ['chicken-and-egg', 'quality control', 'fraud', 'pricing'],
      stakeholders: ['Suppliers/Sellers', 'Buyers', 'Operations', 'Trust & Safety']
    },
    enterprise_software: {
      terms: ['deployment', 'customization', 'training', 'support SLA', 'roadmap'],
      painPoints: ['long implementation', 'change management', 'vendor lock-in', 'TCO'],
      stakeholders: ['IT', 'Procurement', 'End Users', 'Executive Sponsor']
    },
    consumer: {
      terms: ['engagement', 'retention', 'virality', 'monetization', 'UX'],
      painPoints: ['attention span', 'switching costs', 'trust', 'value clarity'],
      stakeholders: ['End User', 'Household decision-maker', 'Influencers']
    },
    other: {
      terms: ['workflow', 'efficiency', 'ROI', 'implementation', 'support'],
      painPoints: ['time', 'cost', 'complexity', 'adoption'],
      stakeholders: ['Decision maker', 'End user', 'Influencer', 'Procurement']
    }
  };
  
  const ctx = industryContext[industry] || industryContext.other;
  
  // Complexity-based question depth
  const technicalQuestions: Record<string, string[]> = {
    simple: [
      'How did you first hear about solutions like this?',
      'What made you decide to try it?',
      'How easy was it to get started?'
    ],
    moderate: [
      'Walk me through your typical workflow with [product category].',
      'What integrations are most important to you?',
      'How do you measure success with tools like this?'
    ],
    complex: [
      'Can you describe your current technical architecture for this function?',
      'What security and compliance requirements affect your decisions?',
      'How does this fit into your broader technology strategy?'
    ],
    highly_technical: [
      'What APIs or data formats are you working with?',
      'Walk me through your deployment and infrastructure requirements.',
      'How do you handle scaling, failover, and disaster recovery?',
      'What are your latency/performance requirements?'
    ]
  };
  
  const techQuestions = technicalQuestions[complexity] || technicalQuestions.moderate;
  
  // Interview type-specific question sets
  const questionSets: Record<string, { opening: string[]; core: string[]; probing: string[]; closing: string[] }> = {
    discovery: {
      opening: [
        `Tell me about your role as ${args.target_persona}. What does a typical week look like?`,
        `What are your top 3 priorities this quarter?`,
        `How long have you been dealing with [problem area]?`
      ],
      core: [
        `Walk me through the last time you experienced [problem]. What happened?`,
        `What solutions have you tried? What worked and didn't work?`,
        `How are you solving this problem today?`,
        `What would "perfect" look like for you?`,
        `How does this problem impact your ${ctx.stakeholders.slice(0, 2).join(' and ')}?`
      ],
      probing: [
        `You mentioned [X]. Can you tell me more about that?`,
        `Why is that important to you specifically?`,
        `What happens if this problem isn't solved?`,
        `How much time/money does this cost you currently?`,
        `Who else is affected by this problem?`
      ],
      closing: [
        `If you could wave a magic wand, what would change?`,
        `What would make you excited to try a new solution?`,
        `Is there anything I should have asked but didn't?`
      ]
    },
    validation: {
      opening: [
        `Thanks for taking the time. I'd love to show you what we're building and get your honest reaction.`,
        `Before I show you anything, tell me: what's your current biggest challenge with ${ctx.terms[0]}?`
      ],
      core: [
        `[Show solution] What's your initial reaction?`,
        `On a scale of 1-10, how excited would you be to try this? Why that number?`,
        `What would need to change for that to be a 10?`,
        `How does this compare to what you're using today?`,
        `Would this solve the problem you mentioned earlier?`
      ],
      probing: [
        `You seemed [reaction] when I showed [feature]. Tell me more.`,
        `What concerns do you have?`,
        `Who else would need to approve using something like this?`,
        `What would stop you from trying this tomorrow?`,
        `How much would you expect to pay for something like this?`
      ],
      closing: [
        `Would you be willing to be a beta tester?`,
        `Who else should I talk to about this?`,
        `Can I follow up in [timeframe] with updates?`
      ]
    },
    feedback: {
      opening: [
        `Thanks for being a customer! How has your experience been overall?`,
        `What initially made you decide to use ${args.product_context}?`,
        `How long have you been using the product?`
      ],
      core: [
        `What's the #1 thing you love about the product?`,
        `What's the #1 thing that frustrates you?`,
        `What feature do you use most? Least?`,
        `Has the product delivered on what you expected?`,
        `How has it impacted your work on ${ctx.painPoints[0]}?`
      ],
      probing: [
        `You mentioned [feature]. What specifically about it works/doesn't work?`,
        `If you could add one feature, what would it be?`,
        `Have you recommended us to others? Why/why not?`,
        `What would make you a raving fan?`,
        `How does our support compare to other vendors?`
      ],
      closing: [
        `Would you be open to being a reference/case study?`,
        `On a scale of 0-10, how likely are you to recommend us? [NPS]`,
        `What advice would you give our product team?`
      ]
    },
    churn: {
      opening: [
        `I appreciate you taking the time despite deciding to leave. Your feedback is invaluable.`,
        `Can you tell me about your experience with us overall?`,
        `When did you first start thinking about leaving?`
      ],
      core: [
        `What was the primary reason you decided to cancel?`,
        `Were there any secondary reasons?`,
        `What did you switch to? What made that option better?`,
        `Was there anything we could have done to keep you?`,
        `Did you feel you got value from the product?`
      ],
      probing: [
        `You mentioned [reason]. When did that become a problem?`,
        `Did you reach out to support about this? What happened?`,
        `What would have needed to change for you to stay?`,
        `How did you make the final decision? Who was involved?`,
        `Looking back, what should we have done differently?`
      ],
      closing: [
        `Is there any scenario where you'd consider coming back?`,
        `What should we tell other customers who have similar concerns?`,
        `Is there anything else you want us to know?`
      ]
    },
    win_loss: {
      opening: [
        `Thank you for sharing your decision process with us.`,
        `Can you walk me through how you evaluated solutions?`,
        `Who was involved in the decision?`
      ],
      core: [
        `What were your top criteria when evaluating options?`,
        `Which vendors did you consider? [FOR WINS: Why did you choose us?] [FOR LOSSES: Why did you choose [competitor]?]`,
        `What was the deciding factor?`,
        `How did pricing factor into the decision?`,
        `What did you think of our sales process?`
      ],
      probing: [
        `You mentioned [criterion]. Why was that so important?`,
        `How did we compare on [specific area]?`,
        `What did [competitor] do well that we didn't?`,
        `What could our sales team have done better?`,
        `Were there any surprises during the evaluation?`
      ],
      closing: [
        `What advice would you give us for similar evaluations?`,
        `[FOR LOSSES: What would need to change for you to consider us in the future?]`,
        `Can I share this feedback with our team?`
      ]
    },
    persona_research: {
      opening: [
        `I'm trying to deeply understand the ${args.target_persona} role. Tell me about your day-to-day.`,
        `How did you end up in this role?`,
        `What does success look like in your position?`
      ],
      core: [
        `What are the biggest challenges you face?`,
        `What tools and resources do you rely on most?`,
        `How do you stay current in your field?`,
        `What metrics are you measured on?`,
        `Who do you collaborate with most?`
      ],
      probing: [
        `Walk me through a recent project you're proud of.`,
        `What skills separate great ${args.target_persona}s from good ones?`,
        `What do you wish you had known when you started?`,
        `What trends are you watching in your field?`,
        `What frustrates you most about your role?`
      ],
      closing: [
        `What advice would you give someone entering your field?`,
        `What's one thing you'd change about how your industry works?`,
        `Who else should I talk to to understand this role better?`
      ]
    }
  };
  
  const questions = questionSets[interviewType] || questionSets.discovery;
  
  // Build hypothesis validation questions
  let hypothesisSection = '';
  if (hypotheses.length > 0) {
    hypothesisSection = `
---

## 🔬 Hypothesis Validation Questions

${hypotheses.map((h, i) => `
### Hypothesis ${i + 1}: ${h}

| To Validate | Ask |
|-------------|-----|
| Confirm problem exists | "How often do you experience [problem from hypothesis]?" |
| Understand severity | "On a scale of 1-10, how painful is this?" |
| Test assumption | "You mentioned [related topic]. Is [hypothesis] true for you?" |
| Find counter-evidence | "What would make [hypothesis] NOT true?" |
`).join('')}
`;
  }

  return `# 🎙️ Customer Interview Kit
## ${interviewType.replace(/_/g, ' ').toUpperCase()} Interview

**Target Persona:** ${args.target_persona}
**Product Context:** ${args.product_context}
**Industry:** ${industry}
**Complexity Level:** ${complexity}

---

## 📋 Pre-Interview Checklist

- [ ] Reviewed persona's LinkedIn/background
- [ ] Tested recording equipment
- [ ] Prepared note-taking template
- [ ] Sent calendar invite with clear agenda
- [ ] Confirmed interview timing (45-60 min recommended)
- [ ] Prepared incentive (if applicable)

---

## 🎯 Interview Objectives

1. Understand ${args.target_persona}'s current reality and challenges
2. ${interviewType === 'discovery' ? 'Identify unmet needs and pain points' :
     interviewType === 'validation' ? 'Test solution assumptions and get honest reaction' :
     interviewType === 'feedback' ? 'Gather improvement ideas and satisfaction signals' :
     interviewType === 'churn' ? 'Understand true reasons for leaving' :
     interviewType === 'win_loss' ? 'Learn what drove the decision' :
     'Build deep persona understanding'}
3. Gather stories and quotes for internal use
${hypotheses.length > 0 ? `4. Validate/invalidate key hypotheses` : ''}

---

## 🎬 Opening (5 min)

*Build rapport before diving into questions*

${questions.opening.map(q => `- ${q}`).join('\n')}

**Industry-specific opener:** "I know in ${industry}, ${ctx.painPoints[0]} is a common challenge. Is that something you deal with?"

---

## 💡 Core Questions (25-30 min)

### Main Line of Inquiry

${questions.core.map((q, i) => `${i + 1}. ${q}`).join('\n')}

### ${complexity.charAt(0).toUpperCase() + complexity.slice(1)}-Level Technical Questions

${techQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

### Industry-Specific Questions (${industry})

1. How do you currently handle ${ctx.terms[0]}?
2. What's your process for ${ctx.terms[1]}?
3. How do ${ctx.stakeholders[0]} and ${ctx.stakeholders[1]} collaborate on this?
4. What ${ctx.terms[2]} challenges have you faced?

---

## 🔍 Probing Questions (Use as needed)

*Follow the energy - when they light up or seem frustrated, probe deeper*

${questions.probing.map(q => `- ${q}`).join('\n')}

**Silence technique:** After an answer, wait 3-5 seconds. They often add the most valuable insights in the silence.

---

## 🎬 Closing (5 min)

${questions.closing.map(q => `- ${q}`).join('\n')}

**Always end with:** "Is there anything I should have asked but didn't?"

${hypothesisSection}

---

## 📝 Note-Taking Template

\`\`\`
INTERVIEW: ${interviewType.toUpperCase()} | ${args.target_persona}
DATE: _______________
DURATION: _______________

CONTEXT:
- Company/Role: 
- Experience level:
- Current solution:

KEY QUOTES:
1. "_______________" (re: ___)
2. "_______________" (re: ___)
3. "_______________" (re: ___)

PAIN POINTS IDENTIFIED:
- [ ] _______________
- [ ] _______________
- [ ] _______________

NEEDS/WANTS:
- Must have:
- Nice to have:
- Unexpected:

${hypotheses.length > 0 ? `HYPOTHESIS VALIDATION:
${hypotheses.map((h, i) => `- H${i + 1}: ✅ Confirmed / ❌ Rejected / ⚠️ Unclear`).join('\n')}` : ''}

FOLLOW-UP ACTIONS:
- [ ] _______________
- [ ] _______________
\`\`\`

---

## 🧩 Synthesis Framework

After conducting multiple interviews, map findings to:

### ICP Signals
| Signal | Count | Implication |
|--------|-------|-------------|
| [Common pain point] | /10 | Include in messaging |
| [Common objection] | /10 | Address proactively |
| [Feature request] | /10 | Product input |

### Persona Insights
| Attribute | Pattern | Source Quotes |
|-----------|---------|---------------|
| Goals | | |
| Challenges | | |
| Decision criteria | | |
| Information sources | | |

---

*Interview kit generated for ${interviewType} interviews using CRAFT GTM Framework v2.0*
*Customized for ${industry} industry at ${complexity} complexity level*`;
}
