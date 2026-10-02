import { lowerFirstIfCommon, cap, SUGGESTION_FOOTER, clipEcho } from './utils.js';
import { splitItems, q, qs, readContext, answerFor, objectionKind, proofFor, sectorNotes, startWords, type ObjectionKind, type Vertical } from './sector.ts';

// Text only (run 8): an input phrase used as a whole sentence inside a script ends with a full stop.
function asSentence(text: string | undefined): string {
  if (!text) return '';
  const t = text.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}
// Text only (run 8, run 9): an input phrase placed mid-sentence starts in lower case only when its first word is a
// common word; names and acronyms keep their capitals ("Salesforce data you can trust" stays as typed).
function midSentence(text: string): string {
  return lowerFirstIfCommon(text);
}

// Generate likely objections when the user gave none. Run 19 (D80, problem 8): the sector's own objections first when the sector is known.
function generateLikelyObjections(product: string, priceContext: string, v: Vertical | null): string[] {
  if (v) return v.objections.map((o) => o.objection);
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

const KIND_LABEL: Record<ObjectionKind, string> = {
  price: 'a price objection', existing: 'an objection about a tool or provider they already have', adoption: 'an adoption objection (will people use it)',
  implementation: 'a setup and switching objection', security: 'a security, compliance or risk objection', bundle: 'an objection about buying one bundle instead',
  timing: 'a timing objection', accuracy: 'an accuracy and trust objection', proof: 'a request for proof', other: 'an objection that needs a question first'
};

export function generateSalesEnablement(args: {
  product: string;
  target_persona: string;
  proof_points: string;
  common_objections?: string;
  value_props?: string;
  competitor_objections?: string;
  price_context?: string;
  sales_stage?: string;
  business_model?: string;
}): string {
  // Run 19 (B15-L1): the heading and the Quick Reference table print the product and the persona as typed; every other echo of them is cut at 280 characters.
  const product = clipEcho(args.product);
  const persona = clipEcho(args.target_persona);
  const proofFull = splitItems(args.proof_points);
  const proofPoints = proofFull.map((p) => clipEcho(p));
  const priceContext = args.price_context || 'Market rate';
  // Run 12 (R12-20): a default is shown as assumed.
  const priceShown = args.price_context || 'Market rate (assumed, not supplied)';
  const stage = args.sales_stage || 'demo';
  // Run 19 (D80, problems 4 and 8): the sector and the business model are read from every text the user gave.
  const ctx = readContext(args.business_model, [product, args.proof_points, args.common_objections, args.value_props, args.competitor_objections, args.price_context], [persona]);
  const w = startWords(ctx.model);
  const walk = ctx.model === 'services' || ctx.model === 'connectivity' || ctx.model === 'investment' ? 'walkthrough' : 'demo';

  // HANDLE optional objections - generate if not provided
  let objections: string[];
  let objectionsNote = '';
  if (args.common_objections) {
    objections = splitItems(args.common_objections);
  } else {
    objections = generateLikelyObjections(product, priceContext, ctx.v);
    objectionsNote = `\n**NOTE:** You didn't provide objections. We've generated handlers for ${ctx.v ? `the objections ${ctx.v.name} buyers raise most` : 'the most common objections'}. Update these with real objections you hear from prospects.\n`;
  }

  // DERIVE value props from proof points if not provided
  let valueProps: string[];
  if (args.value_props) {
    valueProps = splitItems(args.value_props).map((p) => clipEcho(p));
  } else {
    valueProps = proofPoints.map(pp => deriveValuePropFromProof(pp));
  }

  const competitorObjections = args.competitor_objections ? splitItems(args.competitor_objections) : [];

  // Generate objection handlers: each objection is read on its own, answered with the sector's pattern and the proof point that fits it.
  const usedProof = new Set<string>();
  const usedValue = new Set<string>();
  const objectionHandlers = objections.map(obj => generateObjectionHandler(obj, valueProps, proofPoints, priceContext, ctx.v, usedProof, usedValue));
  const competitorHandlers = competitorObjections.map((obj, i) => generateCompetitorHandler(obj, proofPoints, i));

  const valueRows = valueProps.map((vp, i) => `| ${vp} | ${proofPoints[i % Math.max(1, proofPoints.length)] && proofPoints[i % proofPoints.length] !== vp ? proofPoints[i % proofPoints.length] : '[Add the proof you can cite for this]'} |`);

  let output = `# Sales Enablement Kit
## ${args.product} | ${args.target_persona}
${objectionsNote}
${ctx.line}

---

## Quick Reference Card

| Element | Detail |
|---------|--------|
| **Product** | ${args.product} |
| **Persona** | ${args.target_persona} |
| **Price Position** | ${priceShown} |
| **Sales Stage** | ${stage.replace(/_/g, ' ')}${args.sales_stage ? '' : ' (default)'} |${!args.value_props ? `
| **Note** | Value props taken from your proof points |` : ''}${!args.common_objections ? `
| **Note** | Objections suggested: replace them with the ones you hear |` : ''}

---

## Value Propositions

### Pitch Order (Lead with Strongest)

${valueProps.map((vp, i) => `
**${i + 1}. ${vp}**
- *Why it matters to ${midSentence(persona)}:* [Add their specific pain]${(proofPoints[i % proofPoints.length] || '') === vp ? '' : `
- *Proof:* ${proofPoints[i % proofPoints.length] || '[Add your proof point]'}`}
`).join('\n')}

---
${ctx.v ? `\n${sectorNotes(ctx.v, 'all', ctx.model)}\n\n---\n` : ''}
## Pitch Script by Stage

### ${stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' ')} Stage

${generateStagePitch(stage, product, valueProps, persona, proofPoints, walk)}

---

## Objection Handlers

${objectionHandlers.map((handler, i) => `
### Objection ${i + 1}: "${objections[i]}"

**What this is:** ${handler.label}

**Acknowledge:**
> ${handler.acknowledge}

**Reframe:**
> ${handler.reframe}

**Proof Point:**
> ${handler.proof}

**Your answer pattern (advice for you, not a line to read out):**
> ${handler.pattern}
${handler.bridge ? `
**Bridge to Value:**
> ${handler.bridge}
` : ''}
**Full Response Script:**
> "${handler.fullScript}"

---
`).join('\n')}

## Competitive Responses

${competitorHandlers.length > 0 ? competitorHandlers.map((handler, i) => `
### Objection: "${competitorObjections[i]}"

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

## Price Justification

### Position: ${priceShown}

**Value Framework:**

| Value | Proof you can cite |
|-------|--------------------|
${valueRows.join('\n') || '| [Add your key benefit] | [Add the proof you can cite] |'}

**Investment:** ${product} is positioned at ${priceShown}.

**ROI Conversation:**

"Let me share what customers have seen:

${proofPoints.slice(0, 3).map(p => `- ${p}`).join('\n')}

Based on what you've shared about your situation, here's what that could mean for you: [Add the specific ROI for this prospect, from their own figures]"

**If Price Pushback:**

"I understand budget is a consideration. Let me ask: what does it cost you each month to leave this problem as it is?

${valueProps[0] || '[Add your key value]'}: [Add the outcome you can prove]. For a company your size, that's roughly [Add the saving or revenue, from their own figures]."

---

## Discovery Questions for ${midSentence(persona)}
${ctx.v ? `
### In the Language of ${cap(ctx.v.name)}
${ctx.v.discovery.map((d, i) => `${i + 1}. "${d}"`).join('\n')}
` : ''}
### Opening Questions
1. "Tell me about your current approach to [Add the problem area]."
2. "What's working well? What's not?"
3. "How is this affecting [Add the business measure that matters to them]?"

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

## Follow-Up Templates

### After Discovery Call

Subject: ${product} next steps + [Add the specific thing mentioned]

Hi [Name],

Thanks for sharing about [Add the specific challenge mentioned].

Based on what you described, here's what stands out:
- [Add challenge 1] is costing you [Add the impact]
- [Add challenge 2] is blocking [Add the goal]

${product} addresses this${valueProps[0] ? `: ${midSentence(valueProps[0])}` : ' by solving your core problem'}.

${proofPoints[0] && proofPoints[0] !== valueProps[0] ? `Relevant proof: ${proofPoints[0]}` : ''}

Next step: [Add the specific action]

When works for you?

---

### After ${cap(walk)}

Subject: ${product} ${walk} follow-up + next steps

Hi [Name],

Great connecting today. Here's a quick recap:

**What we covered:**
${valueProps.slice(0, 3).map(v => `- ${v}`).join('\n')}

**What resonated:**
- [Add the specific moment they engaged]

**Your questions:**
- [Add the answers to questions raised]

**Next step:** [Add the specific action and date]

Resources:
- [Add the relevant case study]
- [Add the one-pager]

Talk soon,

---

## Call Prep Checklist

Before every ${stage.replace(/_/g, ' ')} call:

- [ ] Research: Reviewed LinkedIn, recent news, annual report
- [ ] Context: Know their industry challenges
- [ ] Personalization: Have a few specific observations
- [ ] Objection prep: Anticipate their top 2 concerns
- [ ] Proof ready: Have relevant case study queued
- [ ] Questions ready: Top 5 discovery questions
- [ ] CTA clear: Know exactly what next step to propose
- [ ] Start plan ready: Know what the ${w.rollout} would involve and how you will say it

---

## Quick Stats to Quote

${proofFull.map(p => `- ${p}`).join('\n')}

---

*Generated for ${midSentence(persona)} at ${stage.replace(/_/g, ' ')} stage*

${SUGGESTION_FOOTER}
`;

  return output;
}

// One handler per objection. Run 19 (D80, problem 3): the objection is read for what it is, the sector's pattern and the proof point
// that fits it are used, and the script quotes the objection, so three objections never get one reply.
function generateObjectionHandler(
  objection: string,
  valueProps: string[],
  proofPoints: string[],
  priceContext: string,
  v: Vertical | null,
  usedProof: Set<string>,
  usedValue: Set<string>
): { label: string; acknowledge: string; reframe: string; proof: string; pattern: string; bridge: string; fullScript: string } {
  const kind = objectionKind(objection);
  const proof = proofFor(kind, proofPoints, usedProof);
  if (proof) usedProof.add(proof);
  const valueMatch = proofFor(kind, valueProps, usedValue);
  if (valueMatch && valueMatch !== proof) usedValue.add(valueMatch);
  const quoted = q(objection);
  const proofSentence = proof ? asSentence(proof) : '';
  const missingProof = '[Add a proof point that answers this objection; none of the proof points you gave does]';
  const pattern = answerFor(objection, v);

  const kinds: Record<ObjectionKind, { ack: string; reframe: string; close: string }> = {
    price: {
      ack: /premium|above/i.test(priceContext) ? 'Our price sits above the alternatives, so it has to earn its place.' : 'Budget is always a consideration.',
      reframe: 'What does the problem cost you today, in your own numbers?',
      close: 'Would it help to put your numbers next to the price before we talk about discounts?'
    },
    existing: {
      ack: 'Makes sense: you already have something in place and it should be respected.',
      reframe: 'What does it not do for you today, and what does that cost?',
      close: 'Would it help to see where we work alongside it and where we would replace it?'
    },
    adoption: {
      ack: 'That is a fair worry: a tool nobody uses is worse than none.',
      reframe: 'Who would use it every day, and what would make them keep using it?',
      close: 'Would a small pilot with those people, with an agreed way to measure use, settle it?'
    },
    implementation: {
      ack: 'Setup is a real concern, and you should ask about it early.',
      reframe: 'Which systems and people would the change touch?',
      close: 'Would it help to walk through the plan step by step, with a rollback point for each step?'
    },
    security: {
      ack: 'You should ask this before anything else.',
      reframe: 'Which requirement matters most to your security or compliance team?',
      close: 'Would it help if we answered your security questions in writing before the next call?'
    },
    bundle: {
      ack: 'One vendor is simpler to manage, and that counts.',
      reframe: 'What outcome do you need from this part of the bundle?',
      close: 'Would it help to compare the outcome you need from each option, not the size of the bundle?'
    },
    timing: {
      ack: 'Timing matters, and there is a lot on your plate.',
      reframe: 'What would need to change for the timing to feel right, and what date is driving that?',
      close: 'Would it help to plan back from that date, so the start is small and on time?'
    },
    accuracy: {
      ack: 'You are right to ask: you should not trust it until you have checked it.',
      reframe: 'What would you need to see before you trusted it with a real case?',
      close: 'Would it help to test it on your own history, with a person approving anything risky?'
    },
    proof: {
      ack: 'Wanting proof before deciding is fair.',
      reframe: 'Which proof would settle it for you: a reference call, a case study or a pilot?',
      close: 'I can set up whichever of these we can offer.'
    },
    other: {
      ack: 'Thank you for saying so directly.',
      reframe: 'Help me understand what is behind that, and what would change your mind?',
      close: 'What would be most helpful to show you next?'
    }
  };
  const k = kinds[kind];
  const fullScript = `I hear you: ${qs(objection)}. ${k.ack} ${k.reframe} ${proofSentence || '[Add a proof point that answers this objection]'} ${k.close}`.replace(/\s+/g, ' ').trim();
  return {
    label: KIND_LABEL[kind],
    acknowledge: k.ack,
    reframe: k.reframe,
    proof: proof || missingProof,
    pattern,
    bridge: valueMatch && valueMatch !== proof ? valueMatch : '',
    fullScript
  };
}

function generateCompetitorHandler(
  objection: string,
  proofPoints: string[],
  index: number
): { whenHeard: string; response: string; trapQuestion: string; proof: string } {
  // Run 12 (R12-20): the objection is quoted as said in the heading; it is never placed in a name slot.
  // Run 19 (D80, problem 3): each competitor objection gets its own response, built on its own words and the next proof point in turn.
  const quoted = q(objection);
  // "Why not X" names the alternative: ask about X itself. Any other wording is quoted whole.
  const named = objection.trim().match(/^why not (?:the )?(.+?)\??$/i);
  const subject = named ? named[1] : quoted;
  const proof = proofPoints.length ? proofPoints[index % proofPoints.length] : '';
  return {
    whenHeard: `When a prospect says ${quoted}, they are weighing you against something they already know.`,
    response: `Here's what we can show: ${asSentence(proof) || '[Add proof from a customer who compared both]'} Then ask: what would ${subject} still leave your team to do by hand?`,
    trapQuestion: `When you looked at ${named ? named[1] : qs(objection)}, how did it handle [Add the capability that matters most to this buyer]? What did it leave out?`,
    proof: proof || `[Add proof from a customer who compared both]`
  };
}

function generateStagePitch(
  stage: string,
  product: string,
  valueProps: string[],
  persona: string,
  proofPoints: string[],
  walk: string
): string {
  const pitches: Record<string, string> = {
    prospecting: `
**Cold Outreach Framework:**

"Hi [Name], I'm reaching out because [Add the pain point you have seen at companies like theirs; persona: ${midSentence(persona)}].

${valueProps[0] || '[Add what you help with]'}: ${proofPoints[0] || '[Add your proof]'}

Worth a short conversation?

[Your name]"
`,
    discovery: `
**Discovery Call Structure:**

**Opening (2 min):**
"Thanks for taking the time. Before I tell you about ${product}, I'd love to understand your situation. Tell me about [Add their main challenge area]..."

**Questions (15 min):**
Focus on understanding their:
- Current state and pain
- Impact on business
- Previous solutions tried
- Decision process

**Bridge (3 min):**
"Based on what you've shared, here's how ${product} could help: ${valueProps.slice(0, 2).map(midSentence).join(' and ')}."

**Next Step:**
"Would it be helpful to see a ${walk} focused on [Add the specific pain mentioned]?"
`,
    demo: `
**${cap(walk)} Structure:**

**Agenda (1 min):**
"Here's what we'll cover: ${valueProps.slice(0, 3).join(', ')}. Sound good?"

**${cap(walk)} (20 min):**
For each part, frame it as:
"You mentioned [Add their pain]. Here's how we solve that..."

**Social Proof (3 min):**
"${proofPoints[0] || '[Add what customers like them have seen]'}"

**Questions & Objections (10 min):**
Address them with the objection handlers in this kit.

**Next Step (1 min):**
"Based on what you've seen, what would it take to move forward?"
`,
    negotiation: `
**Negotiation Framework:**

**Establish Value First:**
"Before we discuss terms, let's align on value. You mentioned ${product} would help you [Add the outcome]. Based on your numbers, that's worth [Add the ROI calculation]."

**Bundle, Don't Discount:**
If asked for discount: "Instead of reducing price, let me add value. What if we included [Add the additional feature or service]?"

**Create Urgency:**
"This pricing is valid through [Add the date] because [Add the legitimate reason]."

**Decision Timeline:**
"What would it take to make a decision by [Add the date]?"
`,
    closing: `
**Closing Framework:**

**Summary of Value:**
"Let me recap: you needed [Add problems 1, 2, 3]. ${product} delivers ${valueProps.slice(0, 3).join(', ')}. ${proofPoints[0] || '[Only if true and provable: what similar customers have seen.]'}"

**The Ask:**
"Based on everything we've discussed, are you ready to move forward?"

**If Yes:** Move to paperwork.

**If Hesitation:** "What's holding you back? Let's address it now."

**If No:** "I respect that. What would need to change?"
`
  };

  return pitches[stage] || pitches.demo;
}

// Run 12 (R12-20, B5): without value_props, each value proposition is the proof point as given. The earlier wording
// ("Trusted by leading companies", "Proven ROI within months") stated claims the input did not give.
function deriveValuePropFromProof(proof: string): string {
  return proof;
}

