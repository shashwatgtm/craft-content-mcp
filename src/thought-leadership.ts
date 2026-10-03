import { cap, lowerFirstIfCommon, titleWords, SUGGESTION_FOOTER, clipEcho } from './utils.js';
import { q, readContext, isClause, clipWords, type Vertical } from './sector.ts';
import { parseProof, fixNumbers, endSentence, capFirst, shortenClauses, proseJoin, roleOf, makeHashtags, brandFrom, claimsToSource, headlineSubject, KIND_NOTE, type ProofItem } from './draft.ts';

export function generateThoughtLeadership(args: {
  topic: string;
  your_take: string;
  target_reader: string;
  proof_points?: string;
  author_background?: string;
  num_articles?: number;
  article_type?: string;
}): string {
  const topic = fixNumbers(args.topic.trim());
  const yourTake = fixNumbers(args.your_take.trim().replace(/^"|"$/g, ''));
  const targetReader = args.target_reader.trim();
  // Run 12 (R12-20, B5): a role the user did not give is said plainly, never invented.
  const authorBackground = args.author_background || 'author background not given (add author_background to name your role and why you are credible)';
  const bgShort = clipEcho(authorBackground, 200);
  const numArticles = args.num_articles || 3;
  // 3 articles is a default when num_articles was not supplied: label it as an example
  const countLabel = args.num_articles ? '' : ' (Example figure: replace with your own)';
  const articleType = args.article_type || 'contrarian';
  // Run 19 (D80, problems 4 and 8): the sector is read from every text the user gave.
  const ctx = readContext(undefined, { seller: [topic], context: [yourTake, args.proof_points, args.author_background], role: [targetReader] });
  const v = ctx.v;

  // Proof points: sorted by what they are. Customer results and quotes carry the argument; recognition and company-wide counts do not.
  const suggested = !args.proof_points;
  const items: ProofItem[] = args.proof_points ? parseProof(args.proof_points) : [];
  const evidence = items.filter((i) => i.kind === 'result' || i.kind === 'quote' || (i.kind === 'title' && i.figure));
  const others = items.filter((i) => !evidence.includes(i));
  const suggestedProofs = suggested ? generateSuggestedProofPoints(topic, articleType, v) : [];

  const takeParts = splitTake(yourTake).map((t) => clipEcho(t));
  const brand = brandFrom(yourTake, args.author_background || '', topic);
  const tags = makeHashtags(`${topic} ${yourTake} ${args.proof_points || ''}`, brand, v);
  const claims = claimsToSource([yourTake, ...items.map((i) => i.text)]);
  const reader = { full: targetReader, role: shortenClauses(targetReader.split(/;/)[0].trim(), 60) };

  let output = `# Thought Leadership Series: ${topic}

## Series Overview

| Element | Detail |
|---------|--------|
| **Topic** | ${topic} |
| **Your Take** | "${yourTake}" |
| **Target Reader** | ${targetReader} |
| **Author Credibility** | ${authorBackground} |
| **Articles** | ${numArticles} byline ${numArticles === 1 ? 'piece' : 'pieces'} (600 to 800 words each)${countLabel} |
| **Style** | ${articleType.replace(/_/g, ' ')} |

${ctx.line}
${suggested ? `
**NOTE:** You didn't provide proof points. The articles name the kind of proof each argument needs, with the sector's own proof shape first.
**To strengthen these articles, gather real proof for the suggested proof points below.**
` : ''}
---

## ${suggested ? 'Suggested' : 'Your'} Proof Points

${suggested ? suggestedProofs.map((p, i) => `${i + 1}. ${p}`).join('\n') : items.map((p, i) => `${i + 1}. ${endSentence(capFirst(p.shown))} *(${KIND_NOTE[p.kind]}${evidence.includes(p) ? '' : '; used as credibility, not as an example'})*`).join('\n')}

${suggested ? '' : evidence.length < numArticles
    ? `*${evidence.length === 0 ? 'None of your proof points is a customer result or quote' : `You gave ${evidence.length} customer ${evidence.length === 1 ? 'result' : 'results'} for ${numArticles} articles`}, so ${evidence.length === 0 ? 'each article marks where a result goes' : 'some articles reuse one in a different place'}. Recognition and company-wide counts are used as credibility lines, never as examples.*\n`
    : `*Each article leads with a different customer result. Recognition and company-wide counts are used as credibility lines, never as examples.*\n`}
${claims.length ? `**Claims to source before you publish:** your take or proof points use ${proseJoin(claims.map((c) => `"${c}"`))}. A claim of this kind needs a source a reader can check, or it should be reworded.\n` : ''}
---
${sectorBlock(v)}
`;

  // Generate the articles: each from its own angle, its own part of the take, its own proof point and its own objection
  for (let i = 0; i < numArticles; i++) {
    const articleAngle = getArticleAngle(i, numArticles, articleType, headlineSubject(topic));
    output += generateFullArticle({
      topic: headlineSubject(topic), take: yourTake, thesis: takeParts[i % takeParts.length], reader, authorBackground, angle: articleAngle, index: i, total: numArticles,
      parts: takeParts, countLabel, suggested, v, evidence, others, suggestedProofs, tags
    });
  }

  // Add promotional social posts
  output += `
---

## Promotional Posts (short drafts: expand each to 200-300 words)

Use these short posts to promote your byline articles on social media:

${generatePromotionalPosts(takeParts, evidence, suggestedProofs, numArticles, suggested, v, tags)}

---

## Publishing Strategy

| Week | Content | Platform |
|------|---------|----------|
${Array.from({ length: numArticles }, (_, i) => i + 1).map(n => `| Week ${n} | Article ${n} | LinkedIn Article / your company blog |
| Week ${n} | ${n < numArticles || numArticles === 1 ? `Promo post for Article ${n}` : 'Series summary post'} | LinkedIn feed |`).join('\n')}
| Week ${numArticles + 1} | Pitch to an industry publication | The trade publications your readers read |

## Where to Publish

**Tier 1: your owned channels**
- LinkedIn Articles
- Your company blog (an owned asset)

**Tier 2: industry publications**
- Publications and newsletters that ${lowerFirstIfCommon(targetReader)} read
- Trade magazines and websites in your space

**Tier 3: major business outlets (pitch required)**
- Read each outlet's contributor rules before you pitch, and pitch one piece at a time

---

## Pre-Publish Checklist

- [ ] Headline is compelling (not clickbait)
- [ ] First paragraph hooks immediately
- [ ] Personal story/example included
- [ ] Data or evidence supports claims
- [ ] Subheads break up content every 150-200 words
- [ ] Conclusion has clear takeaway
- [ ] Author bio establishes credibility
- [ ] Call to engage (not sell)

---

${SUGGESTION_FOOTER}
`;

  return output;
}

// The take, cut into the parts each article can lead with: sentences first, then the parts after a colon or a semicolon. A short
// take is one part. Each part is kept whole.
function splitTake(take: string): string[] {
  const sentences = take.split(/(?<=[.!?])\s+(?=[A-Z0-9"])/).map((x) => x.trim()).filter(Boolean);
  const parts: string[] = [];
  for (const s of sentences) {
    const pieces = s.split(/[:;]\s+/).map((x) => x.trim()).filter((x) => x.length >= 25);
    if (pieces.length > 1) parts.push(...pieces); else parts.push(s);
  }
  const real = parts.filter((p) => !/^[A-Z][\w&.-]*(?:\s[A-Z][\w&.-]*)?(?:'s|’s)\s+(?:view|take|position)\s+on\b/.test(p));
  const use = real.length ? real : parts;
  return use.length ? use.map((p) => p.replace(/[.!?]+$/, '')) : [take.replace(/[.!?]+$/, '')];
}

// What readers in the sector usually raise against a take, and what a proof point that lands looks like (no figures, rule B82).
function sectorBlock(v: Vertical | null): string {
  if (!v) return '';
  return `
## Sector Notes: ${cap(v.name)}

- **Counter-arguments your readers will raise:** ${v.objections.map((o) => o.objection.toLowerCase()).join('; ')}. Each article below answers one.
- **Measures your readers use:** ${v.metrics.slice(0, 5).join(', ')}. Cite the ones your proof points really move.
- **Terms your readers use:** ${v.vocabulary.slice(0, 6).join(', ')}.
- **Who decides:** ${v.committee}
- **A proof point that lands:** ${v.proofShape}

---
`;
}

type Angle = { title: string; structure: string[]; hook: string; closing: string };

// Run 19 (D80, problem 2): no headline holds an unfilled bracket. A topic that is a clause or a question ("how finance teams close
// the month") goes before a colon, where it reads correctly; a phrase goes inside the headline.
function getArticleAngle(index: number, total: number, articleType: string, topic: string): Angle {
  const T = titleWords(clipWords(topic, 120));
  const clause = isClause(topic);
  const angles: Record<string, Angle[]> = {
    contrarian: [
      {
        title: clause ? `${T}: Why Everything You Know Is Wrong` : `Why Everything You Know About ${T} Is Wrong`,
        structure: ['Challenge conventional wisdom', 'Show the evidence', 'Reveal the truth', 'A new path forward'],
        hook: 'controversy',
        closing: 'Close by asking where readers disagree: the best insights come from the conversation.'
      },
      {
        title: clause ? `${T}: The Uncomfortable Truth` : `The Uncomfortable Truth About ${T}`,
        structure: ['Share the hard truth', 'Why people avoid it', 'The cost of avoidance', 'How to face it'],
        hook: 'revelation',
        closing: 'Close with one action a reader can take on Monday.'
      },
      {
        title: clause ? `${T}: What to Stop Doing, and What Works` : `What to Stop Doing on ${T}, and What Works`,
        structure: ['The common mistake', 'Why it persists', 'A better alternative', 'How to switch'],
        hook: 'direct_challenge',
        closing: 'Close with the one habit a reader should drop this week.'
      }
    ],
    how_to: [
      {
        title: clause ? `${T}: The Guide Nobody Teaches` : `The Complete Guide to ${T} That Nobody Teaches`,
        structure: ['Why this matters', 'The step-by-step framework', 'Common pitfalls', 'Advanced tips'],
        hook: 'promise_of_value',
        closing: 'Close with a checklist the reader can copy.'
      },
      {
        title: clause ? `${T}: A Playbook` : `How I Approach ${T}: A Playbook`,
        structure: ['The result', 'The journey', 'The method', 'How to replicate it'],
        hook: 'proof_of_results',
        closing: 'Close with the first step to replicate it.'
      },
      {
        title: clause ? `${T}: From Struggling to Succeeding` : `${T}: From Struggling to Succeeding`,
        structure: ['The struggle', 'The breakthrough', 'The framework', 'The implementation guide'],
        hook: 'transformation',
        closing: 'Close by naming the first thing to change.'
      }
    ],
    lessons_learned: [
      {
        title: clause ? `${T}: What I Have Learned` : `What I Have Learned About ${T}`,
        structure: ['Career context', 'Key lessons', 'The stories behind each', 'Actionable advice'],
        hook: 'experience_credibility',
        closing: 'Close with the lesson you would repeat to your younger self.'
      },
      {
        title: clause ? `${T}: The Biggest Mistake I Made` : `The Biggest Mistake I Made With ${T} (And What It Taught Me)`,
        structure: ['The mistake', 'The consequences', 'The learning', 'How to avoid it'],
        hook: 'vulnerability',
        closing: 'Close with the warning sign you now watch for.'
      },
      {
        title: clause ? `${T}: Lessons That Changed My Mind` : `Lessons That Changed How I Think About ${T}`,
        structure: ['Context', 'The first lesson', 'The second lesson', 'The third lesson', 'Synthesis'],
        hook: 'numbered_wisdom',
        closing: 'Close by asking which lesson readers have learned the hard way.'
      }
    ],
    prediction: [
      {
        title: clause ? `${T}: What I Expect Next` : `The Future of ${T}: What I Expect Next`,
        structure: ['The current state', 'The driving forces', 'The predictions', 'How to prepare'],
        hook: 'future_vision',
        closing: 'Close with the one preparation step to take now.'
      },
      {
        title: clause ? `${T}: Why It Will Look Different` : `Why ${T} Will Look Different Soon`,
        structure: ['What is changing', 'The early signals', 'The implications', 'An action plan'],
        hook: 'change_warning',
        closing: 'Close with the signal readers should watch.'
      },
      {
        title: clause ? `${T}: Where It Goes Next` : `${T} Is at a Turning Point: Here's What Comes Next`,
        structure: ['The turning point', 'A historical parallel', 'The new approach', 'Winners and losers'],
        hook: 'urgency',
        closing: 'Close by asking readers where they see it going.'
      }
    ],
    framework: [
      {
        title: clause ? `${T}: A Framework` : `A New Way to Think About ${T}: A Framework`,
        structure: ['Why existing approaches fail', 'The framework', 'Its components', 'Applying it'],
        hook: 'new_model',
        closing: 'Close with one example of applying the framework this week.'
      },
      {
        title: clause ? `${T}: How Top Performers Approach It` : `How Top Performers Approach ${T}`,
        structure: ['The pattern you observed', 'The framework you extracted', 'A detailed breakdown', 'Implementation'],
        hook: 'best_practice',
        closing: 'Close by asking readers what pattern they see.'
      },
      {
        title: clause ? `${T}: The Simple Model` : `The Simple Model That Changed How I Think About ${T}`,
        structure: ['Before the model', 'The discovery', 'The model', 'The results since'],
        hook: 'simplification',
        closing: 'Close with the one-line version of the model.'
      }
    ]
  };

  const typeAngles = angles[articleType] || angles.contrarian;
  if (index >= typeAngles.length) {
    // articles 4 and 5 take their own angles, so no headline repeats
    const extra: Angle[] = [
      {
        title: clause ? `${T}: What to Ask Before You Decide` : `What to Ask Before You Decide on ${T}`,
        structure: ['The question to ask first', 'What the buying group checks', 'The objection and the answer', 'What to do next'],
        hook: 'sector_question',
        closing: 'Close with the one question a reader should take into their next meeting.'
      },
      {
        title: clause ? `${T}: What the Evidence Shows` : `What the Evidence Shows About ${T}`,
        structure: ['The result', 'What was done', 'What it cost and what it saved', 'How to replicate it'],
        hook: 'evidence_first',
        closing: 'Close with the first step a reader can replicate this month.'
      }
    ];
    return extra[(index - typeAngles.length) % extra.length];
  }
  return typeAngles[index % typeAngles.length];
}


interface Art {
  topic: string; take: string; thesis: string; reader: { full: string; role: string }; authorBackground: string; angle: Angle; index: number; total: number;
  parts: string[]; countLabel: string; suggested: boolean; v: Vertical | null; evidence: ProofItem[]; others: ProofItem[]; suggestedProofs: string[]; tags: string;
}

// The body of one section, written from the take, the proof point, the objection and the measures of this article. A section whose
// content only the author has says plainly what to add.
function sectionBody(step: string, a: Art, k: number, proof: ProofItem | undefined, objection: { objection: string; response: string } | null): string[] {
  const s = step.toLowerCase();
  const v = a.v;
  const lines: string[] = [];
  const evidenceLine = proof
    ? `Evidence for this section: ${endSentence(capFirst(clipEcho(proof.shown, 300)))} Say what was done, what changed and over what period.`
    : a.suggested
      ? `Evidence for this section: ${v ? `a proof point of this shape: ${lowerFirst(v.proofShape)}` : 'one result with its figure and period'} (none was given).`
      : 'Evidence for this section: none of your proof points is a customer result. Add one with its figure and period.';
  if (/cost|consequence|saved|what it cost/.test(s)) {
    lines.push(`Put a cost on it in the measures your readers watch${v ? `: ${proseJoin(v.metrics.slice(0, 3))}` : ''}. Use the reader's own figures, or yours from the proof below; this draft gives none.`);
    lines.push(evidenceLine);
  } else if (/evidence|proof|result|stories|signals|journey|parallel|show the/.test(s) && !/what was done/.test(s)) {
    lines.push(evidenceLine);
  } else if (/what was done|step|method|how to|implementation|replicate|action plan|prepare|switch|face it|guide|actionable|applying|advice|new path|better alternative|new approach|what to do next/.test(s)) {
    lines.push(`Turn the position into steps readers can follow, one sentence each, in order. The position, in your words: "${a.thesis}"`);
    if (proof) lines.push(`Use this as the worked example: ${endSentence(capFirst(clipEcho(proof.shown, 300)))}`);
  } else if (/objection|truth|reveal|pitfall|mistake|avoid|persists|why people|why existing|existing approaches fail|buying group|question to ask/.test(s) && objection) {
    lines.push(`The counter-argument readers will raise: "${objection.objection}". A good answer: ${lowerFirst(objection.response)}`);
  } else if (/components|breakdown/.test(s)) {
    lines.push(`Break the position into its parts and give each one a line:`);
    for (const t of a.parts) lines.push(`- ${endSentence(capFirst(clipEcho(t)))}`);
    if (v) lines.push(`Name the measures it moves: ${proseJoin(v.metrics.slice(0, 3))}.`);
  } else if (/framework|model|forces|predictions|lesson|learning|synthesis|discovery|breakthrough|simple/.test(s)) {
    lines.push(`Set the idea out as a short list a reader could copy, built from this position, in your words: "${a.thesis}"`);
    if (v) lines.push(`Name the measures it moves: ${proseJoin(v.metrics.slice(0, 3))}.`);
  } else if (/winners|implications/.test(s)) {
    lines.push(`Say who gains and who loses if the position holds, and what each should do now.${v ? ` The people who decide in ${v.name}: ${proseJoin(v.buyerRoles.slice(0, 3))}.` : ''}`);
  } else {
    lines.push(`The position of this piece, in your words: "${a.thesis}"`);
    if (objection) lines.push(`Say what readers believe or do today, then why that falls short: they often say "${objection.objection}".`);
  }
  return lines;
}
const lowerFirst = (s: string) => (/[A-Z0-9]/.test(s.slice(1, 3)) ? s : s.charAt(0).toLowerCase() + s.slice(1));

function generateFullArticle(a: Art): string {
  const { angle, index, total, v } = a;
  const title = angle.title;
  // Each article leads with a different customer result and walks through the others in turn.
  const pool = a.evidence;
  const proofAt = (k: number): ProofItem | undefined => pool.length ? pool[(index + k) % pool.length] : undefined;
  const objection = v ? v.objections[index % v.objections.length] : null;
  const leadProof = proofAt(0);
  const leadText = leadProof ? endSentence(capFirst(clipEcho(leadProof.shown, 300))) : a.suggested ? (a.suggestedProofs[0] ? `${a.suggestedProofs[0]} (suggested: gather it)` : 'none given') : 'none of your proof points is a customer result';

  const sections = angle.structure.map((step, k) => {
    const lines: string[] = [`## ${step}`, ''];
    const body = sectionBody(step, a, k, k === 0 ? undefined : proofAt(k - 1), k === Math.min(2, angle.structure.length - 1) ? objection : k === 0 ? objection : null);
    lines.push(...body);
    return lines.join('\n');
  }).join('\n\n');

  return `
---

## Article ${index + 1} of ${total}${index === 0 ? a.countLabel : ''}

**Headline:** ${title}
**Structure:** ${angle.structure.join(' → ')}
**Target length:** ${index === 0 ? '600 to 800 words (this draft is an outline: expand each section)' : 'as for article 1'}
**Lead proof point:** ${leadText}
**Counter-argument it answers:** ${objection ? `"${objection.objection}"` : 'none read (the sector is not clear from your inputs)'}

---

# ${title}

${index === 0 ? `*By ${/^author background not given/.test(a.authorBackground) ? 'the author' : clipEcho(a.authorBackground, 200)}*\n\n---\n\n` : ''}${generateHook(angle.hook, a, objection)}

---

${sections}

---

${angle.closing}

${index === total - 1 ? `*About the author: ${/^author background not given/.test(a.authorBackground) ? 'add the author\'s name and role here.' : clipEcho(a.authorBackground.replace(/[.!?]+\s*$/, ''), 200) + '.'}*

${a.others.filter((o) => o.kind === 'recognition')[0] ? `**Credibility line** (recognition from your list, for the byline or the footer): ${endSentence(capFirst(clipEcho(a.others.filter((o) => o.kind === 'recognition')[0].shown, 300)))}\n\n` : ''}---
` : ''}
`;
}

// Hooks. Run 19 (D80, problem 2): the user's take is quoted, never joined into a sentence of ours. Run 20 (round 1b): each article
// quotes its own part of the take, once, and the opening says what the article does with it.
function generateHook(hookType: string, a: Art, objection: { objection: string; response: string } | null): string {
  const take = `> "${a.thesis}"`;
  const t = q(a.topic);
  const them = objection ? `Name the answer readers usually give: "${objection.objection}".` : `Name the answer readers usually give.`;
  const hooks: Record<string, string> = {
    controversy: `Open with your position on ${t}, in your own words:\n\n${take}\n\n${them}`,
    revelation: `Open with the view you hold on ${t}:\n\n${take}\n\nThen say why it is rarely said aloud.`,
    direct_challenge: `Open by asking the reader to stop before the next article on ${t}:\n\n${take}\n\n${them}`,
    promise_of_value: `Open with the promise: ${t} is simpler than the usual advice makes it. Then give your position:\n\n${take}`,
    proof_of_results: `Open with a result, then give your position:\n\n${take}\n\n${a.evidence[0] ? `The result to open with: ${endSentence(capFirst(clipEcho(a.evidence[a.index % a.evidence.length].shown, 300)))}` : 'No customer result was given to open with.'}`,
    transformation: `Open with where the reader is now, then what shifts:\n\n${take}\n\n${them}`,
    experience_credibility: `Open with your experience on ${t}, then the one thing you wish someone had told you:\n\n${take}`,
    vulnerability: `Open with a mistake you made on ${t} (add it, since only you know it), then what it taught you:\n\n${take}`,
    numbered_wisdom: `Open by saying success on ${t} comes down to a few non-obvious insights. The first one:\n\n${take}`,
    future_vision: `Open with your prediction on ${t}:\n\n${take}\n\n${them}`,
    change_warning: `Open with what is changing:\n\n${take}\n\n${them}`,
    urgency: `Open with why now:\n\n${take}\n\n${them}`,
    new_model: `Open with what is wrong in the way most people think about ${t}:\n\n${take}\n\n${them}`,
    best_practice: `Open with the pattern you studied on ${t}:\n\n${take}`,
    simplification: `Open with how complicated ${t} has become, then the simpler view:\n\n${take}`,
    sector_question: `Open with the question to ask first:\n\n${a.v ? `> "${a.v.discovery[a.index % a.v.discovery.length]}"` : take}\n\nThen give your position:\n\n${take}`,
    evidence_first: `Open with the evidence, then your position:\n\n${a.evidence[0] ? endSentence(capFirst(clipEcho(a.evidence[a.index % a.evidence.length].shown, 300))) : 'No customer result was given to open with.'}\n\n${take}`
  };
  return hooks[hookType] || hooks.controversy;
}

function generatePromotionalPosts(takeParts: string[], evidence: ProofItem[], suggestedProofs: string[], numArticles: number, suggested: boolean, v: Vertical | null, tags: string): string {
  let posts = '';
  for (let i = 0; i < numArticles; i++) {
    const proof = evidence.length ? evidence[i % evidence.length] : undefined;
    posts += `
### Promo Post ${i + 1} (for Article ${i + 1})

---

> "${takeParts[i % takeParts.length]}"

${proof ? `The evidence: ${endSentence(capFirst(clipEcho(proof.shown, 300)))}` : suggested ? `The evidence to add: ${suggestedProofs[0] || 'one result with its figure'}.` : 'No customer result was given for this post.'}

${v ? `The question I would ask your team: "${v.discovery[i % v.discovery.length]}"` : 'What has your own experience been?'}

I just published a piece on this, with the evidence and what to do about it. Link in comments.

---

**Target length:** about 200 words (this draft is shorter: add your own story)
**Hashtags:** ${tags}

---

`;
  }
  return posts;
}

// Generate suggested proof points when user doesn't provide them
function generateSuggestedProofPoints(topic: string, articleType: string, v: Vertical | null): string[] {
  const baseProofs = [
    `A personal story where you learned this lesson about ${lowerFirstIfCommon(topic)} the hard way`,
    `A client or colleague example that shows your take in action`,
    `An industry statistic or data point that supports your position`,
    `A contrast example: someone who did it the "wrong" way and what happened`,
    `A recent observation or trend that validates your thinking`
  ];

  // Adjust based on article type
  const typeSpecificProofs: Record<string, string[]> = {
    contrarian: [
      `Evidence that the conventional wisdom fails (study, example, data)`,
      `A case where you tried the "standard" approach and it didn't work`,
      `Success story from doing the opposite of what experts recommend`,
      `Industry data that contradicts popular belief`,
      `Expert or authority who agrees with your contrarian view`
    ],
    how_to: [
      `Step-by-step example from your own experience`,
      `Before/after metrics from implementing this approach`,
      `Common mistakes you've seen others make (and how to avoid)`,
      `Tool, template, or framework you've developed`,
      `Quick win example that proves the method works`
    ],
    lessons_learned: [
      `The specific failure or mistake you made`,
      `What you tried that didn't work`,
      `The moment of realization / turning point`,
      `What you do differently now`,
      `Results since making the change`
    ],
    prediction: [
      `Early signals or data points you're seeing now`,
      `Historical parallel that supports your prediction`,
      `Expert or insider who shares this view`,
      `Technology or market shift driving the change`,
      `What you're doing now to prepare for this future`
    ],
    framework: [
      `Origin story of how you developed this framework`,
      `Example of framework in action with specific results`,
      `Comparison to alternative approaches and why yours is better`,
      `Edge case or limitation you've discovered`,
      `Testimonial or feedback from someone who used the framework`
    ]
  };

  const list = typeSpecificProofs[articleType] || baseProofs;
  // The sector's own proof shape comes first when the sector is known.
  return v ? [`Evidence in ${v.name}: ${v.proofShape.replace(/\.$/, '').replace(/^A /, 'a ')}`, ...list.slice(0, 4)] : list;
}

