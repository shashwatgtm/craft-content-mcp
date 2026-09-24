import { parseListItems } from './utils.js';

// Generate likely objections based on product description and price context
function generateLikelyObjections(product: string, priceContext: string): string[] {
  const objections: string[] = [];
  const productLower = product.toLowerCase();
  
  // Price-related objection (always common)
  if (priceContext.toLowerCase().includes('premium') || priceContext.toLowerCase().includes('above')) {
    objections.push('It costs too much / over budget');
  } else {
    objections.push('What\'s the total cost of ownership?');
  }
  
  // Implementation/integration concerns
  objections.push('Implementation seems complex / takes too long');
  
  // Competitor objection
  objections.push('We\'re already using a competitor / happy with current solution');
  
  // Timing objection
  objections.push('Not the right time / other priorities');
  
  // Trust/risk objection
  if (productLower.includes('startup') || productLower.includes('new')) {
    objections.push('You\'re too new / not proven enough');
  } else {
    objections.push('Need to see more proof / case studies');
  }
  
  return objections;
}

export function generateSalesEnablement(args: {
  product: string;
  target_persona: string;
  proof_points: string;
  common_objections?: string;
  value_props?: string;
  competitor_objections?: string;
  price_context?: string;
  sales_stage?: string;
}): string {
  const product = args.product;
  const persona = args.target_persona;
  const proofPoints = parseListItems(args.proof_points);
  const priceContext = args.price_context || 'Market rate';
  const stage = args.sales_stage || 'demo';
  
  // HANDLE optional objections - generate if not provided
  let objections: string[];
  let objectionsNote = '';
  if (args.common_objections) {
    objections = parseListItems(args.common_objections);
  } else {
    objections = generateLikelyObjections(product, priceContext);
    objectionsNote = `\n⚠️ **NOTE:** You didn't provide objections. We've generated handlers for the most common objections. Update these with real objections you hear from prospects.\n`;
  }
  
  // DERIVE value props from proof points if not provided
  let valueProps: string[];
  if (args.value_props) {
    valueProps = parseListItems(args.value_props);
  } else {
    valueProps = proofPoints.map(pp => deriveValuePropFromProof(pp));
  }
  
  const competitorObjections = args.competitor_objections ? parseListItems(args.competitor_objections) : [];
  
  // Generate objection handlers with proof point mapping
  const objectionHandlers = objections.map(obj => generateObjectionHandler(obj, valueProps, proofPoints, priceContext));
  const competitorHandlers = competitorObjections.map(obj => generateCompetitorHandler(obj, valueProps, proofPoints));

  let output = `# 🎯 Sales Enablement Kit
## ${product} | ${persona}
${objectionsNote}
---

## Quick Reference Card

| Element | Detail |
|---------|--------|
| **Product** | ${product} |
| **Persona** | ${persona} |
| **Price Position** | ${priceContext} |
| **Sales Stage** | ${stage.replace(/_/g, ' ')} |
${!args.value_props ? `| **Note** | Value props derived from proof points |` : ''}
${!args.common_objections ? `| **Note** | Objections auto-generated - update with real ones |` : ''}

---

## 💎 Value Propositions

### Pitch Order (Lead with Strongest)

${valueProps.map((vp, i) => `
**${i + 1}. ${vp}**
- *Why it matters to ${persona}:* [Connect to their specific pain]
- *Proof:* ${proofPoints[i % proofPoints.length] || 'Customer evidence available'}
`).join('\n')}

---

## 📝 Pitch Script by Stage

### ${stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' ')} Stage

${generateStagePitch(stage, product, valueProps, persona, proofPoints)}

---

## 🛡️ Objection Handlers

${objectionHandlers.map((handler, i) => `
### Objection ${i + 1}: "${objections[i]}"

**Acknowledge:**
> ${handler.acknowledge}

**Reframe:**
> ${handler.reframe}

**Proof Point:**
> ${handler.proof}

**Bridge to Value:**
> ${handler.bridge}

**Full Response Script:**
> "${handler.fullScript}"

---
`).join('\n')}

## ⚔️ Competitive Responses

${competitorHandlers.length > 0 ? competitorHandlers.map((handler, i) => `
### "Why not ${competitorObjections[i]}?"

**When You'll Hear This:**
${handler.whenHeard}

**Response:**
> ${handler.response}

**Trap Question:**
> "${handler.trapQuestion}"

**Proof:**
> ${handler.proof}

---
`).join('\n') : `
*No competitor-specific objections provided. Add competitor_objections parameter for battle cards.*
`}

## 💰 Price Justification

### Position: ${priceContext}

**Value Framework:**

| Investment | Return |
|------------|--------|
| ${product} pricing | ${valueProps[0] || 'Key benefit 1'} |
| | ${valueProps[1] || 'Key benefit 2'} |
| | ${proofPoints[0] || 'Proven results'} |

**ROI Conversation:**

"Let me share what customers typically see:

${proofPoints.slice(0, 3).map(p => `- ${p}`).join('\n')}

Based on what you've shared about your situation, here's what that could mean for you: [Calculate specific ROI for prospect]"

**If Price Pushback:**

"I understand budget is a consideration. Let me ask: what's the cost of NOT solving this problem for another 6 months?

${valueProps[0] || 'Our solution'} typically [specific outcome]. For a company your size, that's roughly [X in savings/revenue].

The question isn't whether you can afford ${product}—it's whether you can afford not to."

---

## 🎣 Discovery Questions for ${persona}

### Opening Questions
1. "Tell me about your current approach to [problem area]."
2. "What's working well? What's not?"
3. "How is this affecting [relevant business metric]?"

### Pain Discovery
4. "What happens if you don't solve this in the next 6 months?"
5. "How much time/money does this currently cost you?"
6. "Who else is affected by this problem?"

### Solution Mapping
7. "What have you tried before? What happened?"
8. "What would success look like for you?"
9. "If you could wave a magic wand, what would be different?"

### Qualification
10. "What's your timeline for making a decision?"
11. "Who else needs to be involved in this evaluation?"
12. "What's your budget range for solving this?"

---

## 📧 Follow-Up Templates

### After Discovery Call

Subject: ${product} next steps + [specific thing mentioned]

Hi [Name],

Thanks for sharing about [specific challenge mentioned]. 

Based on what you described, here's what stands out:
- [Challenge 1] is costing you [impact]
- [Challenge 2] is blocking [goal]

${product} addresses this by ${valueProps[0]?.toLowerCase() || 'solving your core problem'}.

${proofPoints[0] ? `Relevant proof: ${proofPoints[0]}` : ''}

Next step: [Specific action]

When works for you?

---

### After Demo

Subject: ${product} demo follow-up + next steps

Hi [Name],

Great connecting today. Here's a quick recap:

**What we covered:**
${valueProps.slice(0, 3).map(v => `- ${v}`).join('\n')}

**What resonated:**
- [Note specific moment they engaged]

**Your questions:**
- [Answer questions raised]

**Next step:** [Specific action + date]

Resources:
- [Relevant case study]
- [One-pager]

Talk soon,

---

## ✅ Call Prep Checklist

Before every ${stage.replace(/_/g, ' ')} call:

- [ ] Research: Reviewed LinkedIn, recent news, annual report
- [ ] Context: Know their industry challenges
- [ ] Personalization: Have 2-3 specific observations
- [ ] Objection prep: Anticipate their top 2 concerns
- [ ] Proof ready: Have relevant case study queued
- [ ] Questions ready: Top 5 discovery questions
- [ ] CTA clear: Know exactly what next step to propose

---

## 📊 Quick Stats to Quote

${proofPoints.map(p => `- ${p}`).join('\n')}

---

*Generated for ${persona} at ${stage.replace(/_/g, ' ')} stage*
`;

  return output;
}

function generateObjectionHandler(
  objection: string,
  valueProps: string[],
  proofPoints: string[],
  priceContext: string
): { acknowledge: string; reframe: string; proof: string; bridge: string; fullScript: string } {
  const objLower = objection.toLowerCase();
  
  // Price objections
  if (objLower.includes('price') || objLower.includes('expensive') || objLower.includes('cost') || objLower.includes('budget')) {
    return {
      acknowledge: "I hear you—budget is always a consideration.",
      reframe: "Let me share what our customers found when they compared total cost of ownership...",
      proof: proofPoints[0] || "Customers typically see ROI within [X] months.",
      bridge: valueProps[0] || "The key value driver is...",
      fullScript: `I hear you—budget is always a consideration. Here's what I've found: companies that focus only on price often end up spending more in the long run on [hidden costs/lost opportunity]. ${proofPoints[0] || 'Our customers typically see ROI within the first quarter.'} The question isn't the price—it's the value. Would it help to walk through an ROI calculation based on your specific numbers?`
    };
  }
  
  // Timing objections
  if (objLower.includes('time') || objLower.includes('now') || objLower.includes('later') || objLower.includes('busy') || objLower.includes('next quarter')) {
    return {
      acknowledge: "Timing is definitely important to get right.",
      reframe: "I'm curious—what would need to change for the timing to feel right?",
      proof: proofPoints[0] || "Companies that waited reported [X] in additional costs.",
      bridge: valueProps[0] || "The cost of waiting is often...",
      fullScript: `Timing is definitely important. I'm curious—what would need to change for the timing to feel right? What I often see is that waiting adds [specific cost]. ${proofPoints[0] || 'One customer told us they wished they had started 6 months earlier.'} Even if the full rollout is later, starting discovery now means you're ready when the time is right. What would be the cost of waiting another quarter?`
    };
  }
  
  // Feature/capability objections
  if (objLower.includes('feature') || objLower.includes('can\'t') || objLower.includes('doesn\'t') || objLower.includes('missing') || objLower.includes('need')) {
    return {
      acknowledge: "That's a fair point—let me understand what you're trying to accomplish.",
      reframe: "What problem are you solving with that specific feature?",
      proof: proofPoints[0] || "Here's how other customers handle that use case...",
      bridge: valueProps[0] || "What we've found is that [core capability] addresses the underlying need.",
      fullScript: `That's a fair point. Help me understand—what's the underlying problem you're solving with that feature? [Listen] What I often find is that [alternative approach] actually achieves the same outcome. ${proofPoints[0] || 'Customers using our approach report...'} Plus, ${valueProps[0] || 'our core strength'} often makes that specific feature less critical. Would it help to see how others handle this?`
    };
  }
  
  // Trust/risk objections
  if (objLower.includes('risk') || objLower.includes('trust') || objLower.includes('proven') || objLower.includes('new') || objLower.includes('reference')) {
    return {
      acknowledge: "De-risking a decision like this is smart—you should validate before committing.",
      reframe: "What would make you feel confident in moving forward?",
      proof: proofPoints[0] || "We work with [similar companies] in your space.",
      bridge: "Let me connect you with a customer who had similar concerns.",
      fullScript: `De-risking this decision is smart—I'd want to validate too. What would make you feel confident? We work with ${proofPoints[0] || 'companies like yours'}, and I'd be happy to arrange a reference call. We also offer [pilot program/guarantee/sandbox] so you can validate before fully committing. What would be most helpful for you?`
    };
  }
  
  // Competitor objections
  if (objLower.includes('competitor') || objLower.includes('other') || objLower.includes('alternative') || objLower.includes('already')) {
    return {
      acknowledge: "Makes sense to evaluate options thoroughly.",
      reframe: "What's most important to you in making this decision?",
      proof: proofPoints[0] || "Here's what customers who've compared us found...",
      bridge: valueProps[0] || "What sets us apart is...",
      fullScript: `Makes sense to evaluate options thoroughly. What's most important to you in making this decision? [Listen] That's exactly where we differentiate. ${valueProps[0] || 'Our unique approach'} means [specific advantage]. ${proofPoints[0] || 'Customers who\'ve compared us found...'} What if I share a side-by-side comparison focused on what matters most to you?`
    };
  }
  
  // Generic handler
  return {
    acknowledge: `I understand your concern about "${objection}".`,
    reframe: "Help me understand what's driving that concern...",
    proof: proofPoints[0] || "Here's how we address that...",
    bridge: valueProps[0] || "The key benefit is...",
    fullScript: `I understand your concern. Help me understand what's driving that? [Listen] Here's how we address it: ${valueProps[0] || 'Our approach'}. ${proofPoints[0] || 'Customers find that...'} Does that address your concern?`
  };
}

function generateCompetitorHandler(
  objection: string,
  valueProps: string[],
  proofPoints: string[]
): { whenHeard: string; response: string; trapQuestion: string; proof: string } {
  const competitor = objection.replace(/^why not\s*/i, '').replace(/\?$/, '').trim();
  
  return {
    whenHeard: `Usually when prospects are comparing options or have existing relationship with ${competitor}`,
    response: `Great question about ${competitor}. Here's what customers tell us after evaluating both: ${valueProps[0] || 'Our differentiation'} is where we really shine. ${proofPoints[0] || 'One customer who switched from ' + competitor + ' saw...'} What's most important to you in this decision?`,
    trapQuestion: `When you evaluated ${competitor}, did they address [your key differentiator]? How did they handle [their known weakness]?`,
    proof: proofPoints[0] || `Customers who switched from ${competitor} report...`
  };
}

function generateStagePitch(
  stage: string,
  product: string,
  valueProps: string[],
  persona: string,
  proofPoints: string[]
): string {
  const pitches: Record<string, string> = {
    prospecting: `
**Cold Outreach Framework:**

"Hi [Name], I'm reaching out because ${persona}s at companies like yours often struggle with [primary pain point].

${valueProps[0] || 'We help with...'} — ${proofPoints[0] || 'with proven results.'} 

Worth a 15-minute conversation?

[Your name]"
`,
    discovery: `
**Discovery Call Structure:**

**Opening (2 min):**
"Thanks for taking the time. Before I tell you about ${product}, I'd love to understand your situation. Tell me about [their main challenge area]..."

**Questions (15 min):**
Focus on understanding their:
- Current state and pain
- Impact on business
- Previous solutions tried
- Decision process

**Bridge (3 min):**
"Based on what you've shared, here's how ${product} could help: ${valueProps.slice(0, 2).join(' and ')}."

**Next Step:**
"Would it be helpful to see a demo focused on [specific pain mentioned]?"
`,
    demo: `
**Demo Structure:**

**Agenda (1 min):**
"Here's what we'll cover: ${valueProps.slice(0, 3).join(', ')}. Sound good?"

**Demo (20 min):**
For each feature, frame as:
"You mentioned [their pain]. Here's how we solve that..."

**Social Proof (3 min):**
"${proofPoints[0] || 'Customers like you have seen...'}"

**Questions & Objections (10 min):**
Address using handlers above.

**Next Step (1 min):**
"Based on what you've seen, what would it take to move forward?"
`,
    negotiation: `
**Negotiation Framework:**

**Establish Value First:**
"Before we discuss terms, let's align on value. You mentioned ${product} would help you [outcome]. Based on your numbers, that's worth [ROI calculation]."

**Bundle, Don't Discount:**
If asked for discount: "Instead of reducing price, let me add value. What if we included [additional feature/service]?"

**Create Urgency:**
"This pricing is valid through [date] because [legitimate reason]."

**Decision Timeline:**
"What would it take to make a decision by [date]?"
`,
    closing: `
**Closing Framework:**

**Summary of Value:**
"Let me recap: you needed [problem 1, 2, 3]. ${product} delivers ${valueProps.slice(0, 3).join(', ')}. ${proofPoints[0] || 'Similar customers see ROI in X months.'}"

**The Ask:**
"Based on everything we've discussed, are you ready to move forward?"

**If Yes:** Move to paperwork.

**If Hesitation:** "What's holding you back? Let's address it now."

**If No:** "I respect that. What would need to change?"
`
  };
  
  return pitches[stage] || pitches.demo;
}

// Derive a value proposition from a proof point
function deriveValuePropFromProof(proof: string): string {
  const proofLower = proof.toLowerCase();
  
  // Look for percentage/number patterns
  if (proofLower.includes('%')) {
    const match = proof.match(/(\d+)%\s*(faster|reduction|increase|improvement|less|more|growth|savings)/i);
    if (match) {
      return `${match[1]}% ${match[2]} in key metrics`;
    }
  }
  
  // Time savings
  if (proofLower.includes('hour') || proofLower.includes('time') || proofLower.includes('day')) {
    return 'Saves significant time for your team';
  }
  
  // Cost/money
  if (proofLower.includes('$') || proofLower.includes('cost') || proofLower.includes('sav')) {
    return 'Delivers measurable cost savings';
  }
  
  // ROI
  if (proofLower.includes('roi') || proofLower.includes('return')) {
    return 'Proven ROI within months';
  }
  
  // Customer success
  if (proofLower.includes('customer') || proofLower.includes('company') || proofLower.includes('team')) {
    return 'Trusted by leading companies';
  }
  
  // Growth
  if (proofLower.includes('grow') || proofLower.includes('revenue') || proofLower.includes('pipeline')) {
    return 'Accelerates growth and revenue';
  }
  
  // If can't derive, use the proof point itself as value prop
  return proof.length > 50 ? proof.substring(0, 47) + '...' : proof;
}
