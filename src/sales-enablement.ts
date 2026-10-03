import { lowerFirstIfCommon, cap, SUGGESTION_FOOTER, clipEcho } from './utils.js';
import { q, qs, readContext, answerFor, objectionKind, proofFor, sectorNotes, startWords, type ObjectionKind, type Vertical } from './sector.ts';
import { splitList, splitObjections, parseProof, productParts, fixNumbers, endSentence, capFirst, proseJoin, roleOf, shortenClauses, KIND_NOTE, type ProofItem } from './draft.ts';

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

const KIND_LABEL: Record<ObjectionKind, string> = {
  price: 'a price objection', existing: 'an objection about a tool or provider they already have', adoption: 'an adoption objection (will people use it)',
  implementation: 'a setup and switching objection', security: 'a security, compliance or risk objection', bundle: 'an objection about buying one bundle instead',
  timing: 'a timing objection', accuracy: 'an accuracy and trust objection', proof: 'a request for proof', other: 'an objection that needs a question first'
};
// The proof that would settle an objection of this kind, said when none of the proof points given answers it.
const PROOF_THAT_WOULD: Record<ObjectionKind, string> = {
  price: 'a cost or a saving, in a similar customer\'s own figures',
  existing: 'a customer that kept the existing tool alongside, or replaced it, and what changed',
  adoption: 'a usage or adoption figure from a similar customer, with the period',
  implementation: 'a customer\'s real time to go live, with the date it started and the date it was live',
  security: 'the certification, audit report or control that meets the requirement, and a customer review that passed',
  bundle: 'a customer that chose this over the bundle, and why',
  timing: 'a customer that started small, with the date it started and what it showed by when',
  accuracy: 'a result on the buyer\'s own data, or an evaluation a customer ran, with a person approving the risky steps',
  proof: 'a reference call, a case study or a pilot you can really offer',
  other: 'a result from a similar customer, stated with its figure and period'
};

const GENERIC = new Set(['platform', 'management', 'system', 'systems', 'solution', 'solutions', 'services', 'service', 'software', 'business', 'digital', 'enterprise', 'enterprises', 'tools', 'based', 'using', 'across', 'their', 'which', 'where', 'these', 'those', 'about', 'customer', 'customers', 'companies', 'company', 'teams', 'product', 'would', 'should', 'could', 'other', 'there', 'support']);
const stem = (w: string) => w.replace(/(?:ing|ed|es|s)$/, '');
function wordSet(s: string): Set<string> {
  return new Set((s.toLowerCase().match(/[a-z0-9]{5,}/g) || []).filter((w) => !GENERIC.has(w)).map(stem));
}
// The candidates that share at least one distinctive word with the objection, best first.
function relevant(objection: string, candidates: string[]): string[] {
  const a = wordSet(objection);
  return candidates
    .map((c) => ({ c, n: [...wordSet(c)].filter((w) => a.has(w)).length }))
    .filter((x) => x.n > 0)
    .sort((x, y) => y.n - x.n)
    .map((x) => x.c);
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
  business_model?: string;
}): string {
  // Run 19 (B15-L1): the heading and the Quick Reference table print the product and the persona as typed; every other mention uses the
  // product's short name. Run 20 (round 1b): "Name, a description: feature, feature" is read into the name and the features it lists.
  const productFull = fixNumbers(args.product.trim());
  const pp = productParts(productFull);
  const product = pp.name;
  const persona = args.target_persona.trim();
  const { role, field } = roleOf(persona);
  const roleShown = role || persona;
  const items: ProofItem[] = parseProof(args.proof_points);
  // Customer results, quotes and the vendor's own claims can answer an objection; recognition and company-wide counts are credibility only.
  const usable = items.filter((i) => i.kind !== 'recognition' && i.kind !== 'scale');
  const credibility = items.filter((i) => !usable.includes(i));
  const usableTexts = usable.map((i) => clipEcho(i.shown, 300));
  const priceContext = args.price_context || 'Market rate';
  // Run 12 (R12-20): a default is shown as assumed.
  const priceShown = args.price_context || 'Market rate (assumed, not supplied)';
  const stage = args.sales_stage || 'demo';
  // Run 19 (D80, problems 4 and 8): the sector and the business model are read from every text the user gave.
  const ctx = readContext(args.business_model, { seller: [args.product, args.value_props], context: [args.proof_points, args.common_objections, args.competitor_objections, args.price_context], role: [args.target_persona] });
  const v = ctx.v;
  const w = startWords(ctx.model);
  const walk = ctx.model === 'services' || ctx.model === 'connectivity' || ctx.model === 'investment' ? 'walkthrough' : 'demo';

  // HANDLE optional objections: the sector's own objections when none were given and the sector is known; never generic invented ones.
  let objections: string[];
  let objectionsNote = '';
  if (args.common_objections) {
    objections = splitObjections(args.common_objections);
  } else if (v) {
    objections = v.objections.map((o) => o.objection);
    objectionsNote = `\n**NOTE:** You didn't provide objections. We've generated handlers for the objections ${v.name} buyers raise most. Update these with real objections you hear from prospects.\n`;
  } else {
    objections = [];
    objectionsNote = `\n**NOTE:** You didn't provide objections and no sector could be read from your inputs, so no objection handlers are written (a generic list would be invented). Add common_objections, or name the industry, to get them.\n`;
  }

  const valueProps = args.value_props ? splitList(args.value_props).map((p) => clipEcho(p)) : [];
  const competitorObjections = args.competitor_objections ? splitObjections(args.competitor_objections) : [];

  // Generate objection handlers: each objection is read on its own, answered with the sector's pattern and the proof point that fits it.
  const usedProof = new Set<string>();
  const usedValue = new Set<string>();
  const objectionHandlers = objections.map((obj) => generateObjectionHandler(obj, valueProps, usableTexts, pp.facts, priceContext, v, usedProof, usedValue));
  const competitorHandlers = competitorObjections.map((obj, i) => generateCompetitorHandler(obj, usableTexts, pp.facts, v, i));

  // A value proposition with the proof that bears on it (by shared words, then by kind) and the sector measure it ties to.
  const valueRows = valueProps.map((vp) => {
    const proof = relevant(vp, usableTexts)[0];
    const metric = v ? v.metrics.find((m) => [...wordSet(m)].some((x) => wordSet(vp).has(x))) : undefined;
    const obj = v ? v.objections.find((o) => relevant(vp, [o.objection]).length > 0) : undefined;
    const why = metric ? `it ties to ${metric}, a measure ${v!.name} buyers track` : obj ? `it answers an objection this sector raises: "${obj.objection}"` : '';
    return { vp, proof, why };
  });
  const lead = usable.filter((i) => i.figure).slice(0, 3);

  let output = `# Sales Enablement Kit
## ${productFull} | ${persona}
${objectionsNote}
${ctx.line}

---

## Quick Reference Card

| Element | Detail |
|---------|--------|
| **Product** | ${productFull} |
| **Persona** | ${persona} |
| **Price Position** | ${priceShown} |
| **Sales Stage** | ${stage.replace(/_/g, ' ')}${args.sales_stage ? '' : ' (default)'} |${!args.value_props ? `
| **Note** | No value_props given: the pitch order below leads with your proof points |` : ''}${!args.common_objections ? `
| **Note** | Objections suggested: replace them with the ones you hear |` : ''}

---

## Value Propositions

### Pitch Order (Lead with Strongest)

${valueRows.length ? valueRows.map((r, i) => `
**${i + 1}. ${r.vp}**
${r.why ? `- *Why it matters to ${midSentence(roleShown)}${field ? ` in ${field}` : ''}:* ${r.why}\n` : ''}- *Proof:* ${r.proof || 'none of your proof points bears on this one'}
`).join('\n') : (lead.length ? lead : usable.slice(0, 3)).map((p, i) => `
**${i + 1}. ${endSentence(capFirst(clipEcho(p.shown, 300)))}**
- *Why it matters to ${midSentence(roleShown)}${field ? ` in ${field}` : ''}:* ${v ? `it speaks to ${proseJoin(v.metrics.slice(0, 2))}, measures ${v.name} buyers track` : 'tie it to a measure this buyer owns'}
`).join('\n') || '\n*No value propositions or customer proof points were given, so there is no pitch order. Add value_props or proof_points.*\n'}

---
${v ? `\n${sectorNotes(v, 'all', ctx.model)}\n\n---\n` : ''}
## Pitch Script by Stage

### ${stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' ')} Stage

${generateStagePitch(stage, product, valueProps, roleShown, usableTexts, walk, v)}

---

## Objection Handlers

${objectionHandlers.length ? objectionHandlers.map((handler, i) => `
### Objection ${i + 1}: "${objections[i]}"

**What this is:** ${handler.label}

**Acknowledge:**
> ${handler.acknowledge}

**Reframe:**
> ${handler.reframe}

**Proof Point:**
> ${handler.proof}
${handler.facts ? `
**From your product description, the facts that bear on this:**
> ${handler.facts}
` : ''}
**Your answer pattern (advice for you, not a line to read out):**
> ${handler.pattern}
${handler.bridge ? `
**Bridge to Value:**
> ${handler.bridge}
` : ''}
**Full Response Script:**
> "${handler.fullScript}"

---
`).join('\n') : '*No objection handlers: see the note at the top.*\n'}

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
${valueRows.map((r) => `| ${r.vp} | ${r.proof || 'none of your proof points bears on this one'} |`).join('\n') || `| ${usable[0] ? clipEcho(usable[0].shown, 200) : 'No value proposition given'} | ${usable[0] ? 'the same item' : 'add value_props'} |`}

**Investment:** ${product} is positioned at ${priceShown}.

**ROI Conversation:**

${lead.length || usable.length ? `"Let me share what customers have seen:

${(lead.length ? lead : usable).slice(0, 3).map((p) => `- ${clipEcho(p.shown, 300)}`).join('\n')}

Based on what you've shared about your situation, here's what that could mean for you:" then work it out from the prospect's own figures, which this kit does not have.` : '*No proof points with a result were given, so there is nothing to quote here. Add proof_points.*'}

**If Price Pushback:**

"I understand budget is a consideration. Let me ask: what does it cost you each month to leave this problem as it is?

${valueProps[0] ? `${valueProps[0]}: ${v ? `put it in terms of ${v.metrics[0]}` : 'put it in the prospect\'s own numbers'}.` : 'Put the value in the prospect\'s own numbers.'} For a company your size, work out the saving from their figures, not from ours."

---

## Discovery Questions for ${midSentence(roleShown)}
${v ? `
### In the Language of ${cap(v.name)}
${v.discovery.map((d, i) => `${i + 1}. "${d}"`).join('\n')}
` : ''}
### Opening Questions
1. "Tell me how your team handles this today."
2. "What's working well? What's not?"
3. "How is this affecting the measures you are judged on${v ? `, such as ${v.metrics[0]}` : ''}?"

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
11. "Who else needs to be involved in this evaluation?${v ? ` (In ${v.name}: ${v.buyerRoles.slice(0, 3).join(', ')}.)` : ''}"
12. "What's your budget range for solving this?"

---

## Follow-Up Templates

### After Discovery Call

Subject: ${product} next steps

Hi,

Thanks for sharing how your team handles this today.

Based on what you described, here's what stands out (fill these in from your call notes):
- the first challenge they named, and what it costs them
- the second challenge, and the goal it blocks

${product} addresses this${valueProps[0] ? `: ${midSentence(valueProps[0])}` : ''}.

${usable[0] ? `Relevant proof: ${clipEcho(usable[0].shown, 300)}` : ''}

Next step: name the specific action and the date.

When works for you?

---

### After ${cap(walk)}

Subject: ${product} ${walk} follow-up + next steps

Hi,

Great connecting today. Here's a quick recap:

**What we covered:**
${(valueProps.length ? valueProps : usable.map((p) => p.text)).slice(0, 3).map((x) => `- ${clipEcho(x, 200)}`).join('\n') || '- the points you covered'}

**What resonated:** the moment they engaged (from your notes).

**Your questions:** the answers to the questions they raised.

**Next step:** the specific action and date.

Resources: the relevant case study and the one-pager.

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

${items.length ? items.map((p) => `- ${clipEcho(p.shown, 400)}${p.kind === 'result' || p.kind === 'quote' ? '' : ` *(${KIND_NOTE[p.kind]})*`}`).join('\n') : '- No proof points were given.'}
${credibility.length ? `\n*Recognition and company-wide counts are credibility lines for the opening of a call or the footer of an email. They do not answer an objection, so the handlers above do not use them.*\n` : ''}
---

*Generated for ${midSentence(persona)} at ${stage.replace(/_/g, ' ')} stage*

${SUGGESTION_FOOTER}
`;

  return output;
}

// One handler per objection. Run 19 (D80, problem 3): the objection is read for what it is, the sector's pattern and the proof point
// that fits it are used, and the script quotes the objection, so three objections never get one reply. Run 20 (round 1b): the product
// facts and the value proposition that bear on the objection are shown, a question is answered before it is turned round, and an
// objection that none of the proof answers says so and names the proof that would.
function generateObjectionHandler(
  objection: string,
  valueProps: string[],
  proofTexts: string[],
  facts: string[],
  priceContext: string,
  v: Vertical | null,
  usedProof: Set<string>,
  usedValue: Set<string>
): { label: string; acknowledge: string; reframe: string; proof: string; facts: string; pattern: string; bridge: string; fullScript: string } {
  const kind = objectionKind(objection);
  const isQuestion = /\?\s*$/.test(objection.trim()) || /^(?:how|what|does|do|is|are|can|will|why|which|who|when)\b/i.test(objection.trim());
  const byKind = proofFor(kind, proofTexts, usedProof);
  const byWords = relevant(objection, proofTexts).find((p) => !usedProof.has(p)) || relevant(objection, proofTexts)[0];
  const proof = byKind || byWords;
  if (proof) usedProof.add(proof);
  const valueMatch = relevant(objection, valueProps)[0] || proofFor(kind, valueProps, usedValue);
  if (valueMatch && valueMatch !== proof) usedValue.add(valueMatch);
  const proofSentence = proof ? asSentence(proof) : '';
  const factText = relevant(objection, facts).slice(0, 3);
  const pattern = kind === 'other' && isQuestion && !(v && v.objections.some((o) => relevant(objection, [o.objection]).length > 0))
    ? 'Answer the question directly in one or two sentences, using the facts from your product description above; then ask what is behind it for this buyer.'
    : answerFor(objection, v);

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
      ack: isQuestion ? 'Good question.' : 'Thank you for saying so directly.',
      reframe: isQuestion ? 'Let me answer it first, and then ask what is behind it for you.' : 'Help me understand what is behind that, and what would change your mind?',
      close: isQuestion ? 'Does that answer it, or is there a part that matters more to you?' : 'What would be most helpful to show you next?'
    }
  };
  const k = kinds[kind];
  const factSentence = factText.length ? `From what we offer: ${factText.join('; ')}.` : '';
  const valueSentence = valueMatch && valueMatch !== proof ? asSentence(valueMatch) : '';
  const fullScript = `I hear you: ${qs(objection)}. ${k.ack} ${k.reframe} ${factSentence} ${valueSentence} ${proofSentence} ${k.close}`.replace(/\s+/g, ' ').trim();
  return {
    label: KIND_LABEL[kind],
    acknowledge: k.ack,
    reframe: k.reframe,
    proof: proof || `None of your proof points answers this objection. The proof that would: ${PROOF_THAT_WOULD[kind]}.`,
    facts: factText.join('; '),
    pattern,
    bridge: valueMatch && valueMatch !== proof ? valueMatch : '',
    fullScript
  };
}

function generateCompetitorHandler(
  objection: string,
  proofTexts: string[],
  facts: string[],
  v: Vertical | null,
  index: number
): { whenHeard: string; response: string; trapQuestion: string; proof: string } {
  // Run 12 (R12-20): the objection is quoted as said in the heading; it is never placed in a name slot.
  // Run 19 (D80, problem 3): each competitor objection gets its own response, built on its own words and the next proof point in turn.
  const quoted = q(objection);
  // "Why not X" names the alternative: ask about X itself. Any other wording is quoted whole.
  const named = objection.trim().match(/^why not (?:the )?(.+?)\??$/i);
  const subject = named ? named[1] : quoted;
  const proof = relevant(objection, proofTexts)[0] || (proofTexts.length ? proofTexts[index % proofTexts.length] : '');
  const fact = relevant(objection, facts)[0];
  const measure = v ? v.metrics[index % v.metrics.length] : '';
  return {
    whenHeard: `When a prospect says ${quoted}, they are weighing you against something they already know.`,
    response: `${proof ? `Here's what we can show: ${asSentence(proof)} ` : 'None of your proof points compares the two, so ask for a customer that did. '}${fact ? `On our side: ${fact}. ` : ''}Then ask: what would ${subject} still leave your team to do by hand?`,
    trapQuestion: `When you looked at ${named ? named[1] : qs(objection)}, how did it do on ${measure || 'the thing that matters most to you'}? What did it leave out?`,
    proof: proof || 'None of your proof points compares the two. The proof that would: a customer that compared both, with its figure and period.'
  };
}

function generateStagePitch(
  stage: string,
  product: string,
  valueProps: string[],
  persona: string,
  proofTexts: string[],
  walk: string,
  v: Vertical | null
): string {
  const lead = valueProps[0] || (proofTexts[0] ? shortenClauses(proofTexts[0], 160) : '');
  const pitches: Record<string, string> = {
    prospecting: `
**Cold Outreach Framework:**

"Hi, I'm reaching out because ${v ? `${midSentence(persona)} in ${v.name} often tell us about ${v.objections[0].objection.toLowerCase()}` : `people in your role often tell us about the same problem`}.

${lead ? `${lead}${proofTexts[0] && valueProps[0] ? `: ${proofTexts[0]}` : ''}` : `${product} helps with this.`}

Worth a short conversation?"
`,
    discovery: `
**Discovery Call Structure:**

**Opening (2 min):**
"Thanks for taking the time. Before I tell you about ${product}, I'd love to understand your situation. Tell me how your team handles this today..."

**Questions (15 min):**
Focus on understanding their:
- Current state and pain
- Impact on business
- Previous solutions tried
- Decision process
${v ? `\nStart with: "${v.discovery[0]}"\n` : ''}
**Bridge (3 min):**
"Based on what you've shared, here's how ${product} could help: ${valueProps.slice(0, 2).map(midSentence).join(' and ') || 'the points on your pitch order above'}."

**Next Step:**
"Would it be helpful to see a ${walk} focused on the pain you described?"
`,
    demo: `
**${cap(walk)} Structure:**

**Agenda (1 min):**
"Here's what we'll cover: ${valueProps.slice(0, 3).join('; ') || 'the points on your pitch order'}. Sound good?"

**${cap(walk)} (20 min):**
For each part, frame it as:
"You mentioned this pain. Here's how we solve that..."

**Social Proof (3 min):**
"${proofTexts[0] || 'Share a result from a customer like them, with its figure and period.'}"

**Questions & Objections (10 min):**
Address them with the objection handlers in this kit.

**Next Step (1 min):**
"Based on what you've seen, what would it take to move forward?"
`,
    negotiation: `
**Negotiation Framework:**

**Establish Value First:**
"Before we discuss terms, let's align on value. You told us ${product} would help you reach an outcome. Based on your numbers, work out what that is worth."

**Bundle, Don't Discount:**
If asked for a discount: "Instead of reducing price, let me add value. What if we included something of equal value to you?"

**Create Urgency:**
Give a deadline only if there is a legitimate reason for it, and say the reason.

**Decision Timeline:**
"What would it take to make a decision by the date you named?"
`,
    closing: `
**Closing Framework:**

**Summary of Value:**
"Let me recap what you told us you needed. ${product} delivers ${valueProps.slice(0, 3).join('; ') || 'the points on your pitch order'}. ${proofTexts[0] ? proofTexts[0] : 'Add what similar customers have seen, only if you can prove it.'}"

**The Ask:**
"Based on everything we've discussed, are you ready to move forward?"

**If Yes:** Move to paperwork.

**If Hesitation:** "What's holding you back? Let's address it now."

**If No:** "I respect that. What would need to change?"
`
  };

  return pitches[stage] || pitches.demo;
}
