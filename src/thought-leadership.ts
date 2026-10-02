import { cap, lowerFirstIfCommon, titleWords, topicWords, SUGGESTION_FOOTER, clipEcho } from './utils.js';
import { splitItems, q, readContext, isClause, clipWords, type Vertical } from './sector.ts';

export function generateThoughtLeadership(args: {
  topic: string;
  your_take: string;
  target_reader: string;
  proof_points?: string;
  author_background?: string;
  num_articles?: number;
  article_type?: string;
}): string {
  const topic = args.topic;
  const yourTake = args.your_take.trim().replace(/^"|"$/g, '');
  const targetReader = args.target_reader;
  // Run 12 (R12-20, B5): a role the user did not give is a bracket prompt, never invented.
  const authorBackground = args.author_background || '[Add your role and why you are credible]';
  const numArticles = args.num_articles || 3;
  // 3 articles is a default when num_articles was not supplied: label it as an example
  const countLabel = args.num_articles ? '' : ' (Example figure: replace with your own)';
  const articleType = args.article_type || 'contrarian';
  // Run 19 (D80, problems 4 and 8): the sector is read from every text the user gave.
  const ctx = readContext(undefined, [topic, yourTake, args.proof_points, args.author_background], [targetReader]);

  // Handle missing proof points - suggest what to gather
  let proofPoints: string[];
  let proofFull: string[] = [];
  let proofPointsNote = '';

  if (args.proof_points) {
    proofFull = splitItems(args.proof_points);
    proofPoints = proofFull.map((p) => clipEcho(p));
  } else {
    proofPoints = generateSuggestedProofPoints(topic, articleType, ctx.v);
    proofFull = proofPoints;
    proofPointsNote = `

**NOTE:** You didn't provide proof points. The articles show a bracket prompt where each piece of proof goes.
**To strengthen these articles, gather real proof for the suggested proof points below.**

`;
  }

  let output = `# Thought Leadership Series: ${topic}

## Series Overview

| Element | Detail |
|---------|--------|
| **Topic** | ${topic} |
| **Your Take** | ${yourTake} |
| **Target Reader** | ${targetReader} |
| **Author Credibility** | ${authorBackground} |
| **Articles** | ${numArticles} byline ${numArticles === 1 ? 'piece' : 'pieces'} (600 to 800 words each)${countLabel} |
| **Style** | ${articleType.replace(/_/g, ' ')} |

${ctx.line}
${proofPointsNote}
---

## ${args.proof_points ? 'Your' : 'Suggested'} Proof Points

${proofFull.map((p, i) => `${i + 1}. ${p}`).join('\n')}

${proofPoints.length < numArticles ? `*You gave ${proofPoints.length} proof point${proofPoints.length === 1 ? '' : 's'} for ${numArticles} articles, so each article leads with a different one and some are used twice. Gather more to keep the articles apart.*\n` : `*Each article leads with a different proof point; every proof point is used.*\n`}
---
${sectorBlock(ctx.v)}
`;

  // Generate the articles: each from its own angle and its own order of proof points
  for (let i = 0; i < numArticles; i++) {
    const articleAngle = getArticleAngle(i, numArticles, articleType, topic);
    output += generateFullArticle(
      clipEcho(topic, 200),
      clipEcho(yourTake),
      proofPoints,
      clipEcho(targetReader, 200),
      authorBackground,
      articleAngle,
      i,
      numArticles,
      countLabel,
      !args.proof_points,
      ctx.v
    );
  }

  // Add promotional social posts
  output += `
---

## Promotional Posts (short drafts: expand each to 200-300 words)

Use these short posts to promote your byline articles on social media:

${generatePromotionalPosts(clipEcho(topic, 200), clipEcho(yourTake), proofPoints, numArticles, !args.proof_points)}

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

// What readers in the sector usually raise against a take, and what a proof point that lands looks like (no figures, rule B82).
function sectorBlock(v: Vertical | null): string {
  if (!v) return '';
  return `
## Sector Notes: ${cap(v.name)}

- **Counter-arguments your readers will raise:** ${v.objections.map((o) => o.objection.toLowerCase()).join('; ')}. Each article below answers one.
- **Measures your readers use:** ${v.metrics.slice(0, 5).join(', ')}. Cite the ones your proof points really move.
- **Terms your readers use:** ${v.vocabulary.slice(0, 6).join(', ')}.
- **A proof point that lands:** ${v.proofShape}

---
`;
}

type Angle = { title: string; structure: string[]; hook: string; closing: string };

// What to write in each part of an article, by what the part is for. The part's name is in the line, so no two articles share it.
const STEP_GUIDES: [RegExp, (t: string, reader: string, v: Vertical | null) => string][] = [
  [/cost|consequence/, (_t, _r, v) => `put a cost on it with measures your readers use${v ? ` (${v.metrics.slice(0, 3).join(', ')})` : ''}, using your own figures`],
  [/avoid|persists|why people/, () => 'explain why capable people keep doing it: habit, incentives, or fear of the alternative'],
  [/pitfall|mistake/, () => 'list the two or three mistakes you see most, and what each one costs'],
  [/winners|implications/, () => 'say who gains and who loses if you are right, and what each should do now'],
  [/step|method|how to|implementation|replicate|action plan|prepare|switch|face it|guide|actionable|applying|advice|new path|better alternative|new approach/, () => 'give the steps in order, one sentence each, with one example from the proof point'],
  [/framework|model|components|breakdown|forces|predictions|lesson|learning|synthesis|discovery|breakthrough/, () => 'set the idea out in a few lines, as a list a reader could copy'],
  [/evidence|proof|result|stories|signals|journey|parallel|struggle/, () => 'tell it as a short story: the situation, what was done, what changed, with the figure from the proof point'],
  [/.*/, (t, reader) => `say what readers believe or do today about ${q(t)}, then your position, once and plainly, for ${reader}`]
];
function stepGuide(step: string, topic: string, reader: string, v: Vertical | null): string {
  const s = step.toLowerCase();
  const hit = STEP_GUIDES.find(([re]) => re.test(s)) as [RegExp, (t: string, reader: string, v: Vertical | null) => string];
  return `${step.toLowerCase()}: ${hit[1](topic, lowerFirstIfCommon(reader), v)}`;
}

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
  return typeAngles[index % typeAngles.length];
}

function generateFullArticle(
  topic: string,
  yourTake: string,
  proofPoints: string[],
  targetReader: string,
  authorBackground: string,
  angle: Angle,
  index: number,
  totalArticles: number,
  countLabel: string,
  suggested: boolean,
  v: Vertical | null
): string {
  const title = angle.title;
  const n = proofPoints.length || 1;
  // Each article starts from a different proof point and walks through the others in turn, so no two articles lean on the same example in the same place.
  const proofAt = (k: number) => proofSlot(proofPoints[(index + k) % n], suggested, '[Add your example]');
  const objection = v ? v.objections[index % v.objections.length] : null;

  const sections = angle.structure.map((step, k) => {
    const lines: string[] = [`## ${step}`, ''];
    lines.push(`[Write this part: ${stepGuide(step, topic, targetReader, v)}]`);
    // With one proof point, it is printed once per article (at the evidence step) instead of under every heading.
    if (n > 1 || k === Math.min(1, angle.structure.length - 1)) lines.push('', `Proof point for "${step}": ${proofAt(k)}`);
    if (k === 0 && index === 0 && authorBackground && !authorBackground.startsWith('[')) lines.push('', `[Draw on your background: ${authorBackground}]`);
    if (objection && k === Math.min(2, angle.structure.length - 1)) lines.push('', `[Answer the objection your readers raise: "${objection.objection}". ${objection.response}]`);
    return lines.join('\n');
  }).join('\n\n');

  return `
---

## Article ${index + 1} of ${totalArticles}${index === 0 ? countLabel : ''}

**Headline:** ${title}
**Structure:** ${angle.structure.join(' → ')}
**Target length:** 600 to 800 words (this draft is an outline: expand each section)
**Written for:** ${targetReader}
**Lead proof point:** ${proofAt(0)}

---

# ${title}

*By [Your name], ${authorBackground}*

---

${generateHook(angle.hook, clipEcho(topic, 200), clipEcho(yourTake))}

---

${sections}

---

${angle.closing}

*[Your name] is ${authorBackground}. Connect on LinkedIn or reach out at [Add your email].*

---

**Publishing Notes:**
- Second headline to test: [Add a second headline written for ${lowerFirstIfCommon(targetReader)}]

---

`;
}

// Hooks. Run 19 (D80, problem 2): the user's take is quoted once, in a block of its own; it is never joined into a sentence of ours.
function generateHook(hookType: string, topic: string, yourTake: string): string {
  const take = `> "${yourTake}"`;
  const t = q(topic);
  const hooks: Record<string, string> = {
    controversy: `Open with your position, in your own words:

${take}

[Add how long you have worked on ${t} and what changed your mind]`,

    revelation: `Open with the view you hold on ${t}:

${take}

[Only if true: why the people who have figured this out do not talk about it publicly]`,

    direct_challenge: `Open by asking the reader to stop for a moment before the next article on ${t}:

${take}

[Only if true and provable: the common advice your readers follow, and how it makes things worse]`,

    promise_of_value: `Open with the promise: ${t} is simpler than the usual advice makes it. Then give your position:

${take}

[Add how you learned what works, in a few words]`,

    proof_of_results: `Open with a result, then give your position:

${take}

[Add when you first saw this, and the results you have seen since]`,

    transformation: `Open with where you were before, then what shifted:

[Add where you were with ${t} before, and what it was like]

${take}`,

    experience_credibility: `Open with your experience on ${t}:

[Add how long you have worked on it, and the mistakes you made along the way]

The one thing you wish someone had told you:

${take}`,

    vulnerability: `Open with the mistake:

[Add a mistake you made with ${t}, and what it cost you]

What it taught you:

${take}`,

    numbered_wisdom: `Open by saying success on ${t} comes down to a handful of non-obvious insights. The first one:

${take}

[Add the others, in a line each]`,

    future_vision: `Open with your prediction on ${t}:

[Add how the landscape will shift, and your evidence]

${take}`,

    change_warning: `Open with what is changing:

[Only if true: what is changing in ${t} that most readers have not noticed yet, and your evidence]

${take}`,

    urgency: `Open with why now:

[Only if true and provable: why ${t} is at a turning point now, and your evidence]

${take}`,

    new_model: `Open with what is wrong in the way most people think about ${t}:

${take}

[Only if true and provable: the mental model that holds readers back, and your evidence]`,

    best_practice: `Open with the pattern you studied:

[Add whose approach to ${t} you have studied, and how]

${take}`,

    simplification: `Open with how complicated ${t} has become:

[Only if true: why it is made to look complex, in your own words]

${take}`
  };

  return hooks[hookType] || hooks.controversy;
}

function generatePromotionalPosts(topic: string, yourTake: string, proofPoints: string[], numArticles: number, suggested: boolean): string {
  let posts = '';
  const tags = topicWords(topic, 2).map((w) => `#${w.charAt(0).toUpperCase()}${w.slice(1)}`).join(' ');

  for (let i = 0; i < numArticles; i++) {
    const proof = proofSlot(proofPoints[i % proofPoints.length], suggested, '[Add your story]');
    posts += `
### Promo Post ${i + 1} (for Article ${i + 1})

---

> "${yourTake}"

Proof point: ${proof}

Here's what I learned:

→ [Add your first lesson]
→ [Add your second lesson]
→ [Add your third lesson]

I just published a deep dive on this, sharing the evidence, what it means, and what to do about it.

Link in comments

What's your experience been?

---

**Target length:** about 200 words (this draft is shorter: add your own story)
**Hashtags:** ${tags ? tags + ' ' : ''}#ThoughtLeadership

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

// Run 12 (R12-20, B5): a proof point the user gave is printed as given; a suggested one becomes a bracket prompt
// ("[Add your story: evidence that the conventional wisdom fails (study, example, data)]"); a missing one gets the fallback prompt.
function proofSlot(point: string | undefined, suggested: boolean, fallback: string): string {
  if (!point) return fallback;
  return suggested ? `[Add your story: ${point.charAt(0).toLowerCase()}${point.slice(1)}]` : point;
}
