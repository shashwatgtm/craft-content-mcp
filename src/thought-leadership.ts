import { parseListItems, lowerCommonWords, lowerFirstIfCommon, cap, titleWords, SUGGESTION_FOOTER } from './utils.js';

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
  const yourTake = args.your_take;
  const targetReader = args.target_reader;
  // Run 12 (R12-20, B5): a role the user did not give is a bracket prompt, never invented.
  const authorBackground = args.author_background || '[your role]';
  const numArticles = args.num_articles || 3;
  // 3 articles is a default when num_articles was not supplied: label it as an example
  const countLabel = args.num_articles ? '' : ' (Example figure: replace with your own)';
  const articleType = args.article_type || 'contrarian';
  
  // Handle missing proof points - suggest what to gather
  let proofPoints: string[];
  let proofPointsNote = '';
  
  if (args.proof_points) {
    proofPoints = parseListItems(args.proof_points);
  } else {
    proofPoints = generateSuggestedProofPoints(topic, yourTake, articleType);
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
| **Articles** | ${numArticles} byline ${numArticles === 1 ? 'piece' : 'pieces'} (600-800 words each)${countLabel} |
| **Style** | ${articleType.replace(/_/g, ' ')} |
${proofPointsNote}
---

## ${args.proof_points ? 'Your' : 'Suggested'} Proof Points

${proofPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

---

`;

  // Generate full 600-800 word articles
  for (let i = 0; i < numArticles; i++) {
    const articleAngle = getArticleAngle(i, numArticles, articleType);
    output += generateFullArticle(
      topic,
      yourTake,
      proofPoints,
      targetReader,
      authorBackground,
      articleAngle,
      i + 1,
      numArticles,
      countLabel,
      !args.proof_points
    );
  }

  // Add promotional social posts
  output += `
---

## Promotional Posts (short drafts: expand each to 200-300 words)

Use these short posts to promote your byline articles on social media:

${generatePromotionalPosts(topic, yourTake, proofPoints, numArticles, !args.proof_points)}

---

## Publishing Strategy

| Week | Content | Platform |
|------|---------|----------|
${Array.from({ length: numArticles }, (_, i) => i + 1).map(n => `| Week ${n} | Article ${n} | LinkedIn Article / Medium / Company Blog |
| Week ${n} | ${n < numArticles || numArticles === 1 ? `Promo post for Article ${n}` : 'Series summary post'} | ${n < numArticles || numArticles === 1 ? 'LinkedIn feed, Twitter' : 'LinkedIn feed'} |`).join('\n')}
| Week ${numArticles + 1} | Pitch to industry publication | Forbes, Inc, industry trades |

## Where to Publish

**Tier 1: your owned channels**
- LinkedIn Articles (best for B2B thought leadership)
- Medium (broader reach, good SEO)
- Company blog (owned asset)

**Tier 2: industry publications**
- Industry-specific publications in your space
- Trade magazines and websites

**Tier 3: major outlets (pitch required)**
- Forbes Councils (paid membership)
- Entrepreneur, Inc (contributor programs)
- Harvard Business Review (highly competitive)

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

function getArticleAngle(index: number, total: number, articleType: string): { title: string; structure: string; hook: string } {
  const angles: Record<string, Array<{ title: string; structure: string; hook: string }>> = {
    contrarian: [
      {
        title: 'Why Everything You Know About [Topic] Is Wrong',
        structure: 'Challenge conventional wisdom → Show the evidence → Reveal the truth → New path forward',
        hook: 'controversy'
      },
      {
        title: 'The Uncomfortable Truth About [Topic]',
        structure: 'Share the hard truth → Why people avoid it → Cost of avoidance → How to face it',
        hook: 'revelation'
      },
      {
        title: 'Stop Doing [Common Practice]: What Actually Works',
        structure: 'Common mistake → Why it persists → Better alternative → How to switch',
        hook: 'direct_challenge'
      }
    ],
    how_to: [
      {
        title: 'The Complete Guide to [Topic] That Nobody Teaches',
        structure: 'Why this matters → Step-by-step framework → Common pitfalls → Advanced tips',
        hook: 'promise_of_value'
      },
      {
        title: 'How I [Achieved Result] With [Topic]: A Playbook',
        structure: 'The result → The journey → The method → How to replicate',
        hook: 'proof_of_results'
      },
      {
        title: '[Topic] Masterclass: From Struggling to Succeeding',
        structure: 'The struggle → The breakthrough → The framework → Implementation guide',
        hook: 'transformation'
      }
    ],
    lessons_learned: [
      {
        title: 'What [X Years] in [Field] Taught Me About [Topic]',
        structure: 'Career context → Key lessons → Stories behind each → Actionable advice',
        hook: 'experience_credibility'
      },
      {
        title: 'The Biggest Mistake I Made With [Topic] (And What It Taught Me)',
        structure: 'The mistake → The consequences → The learning → How to avoid it',
        hook: 'vulnerability'
      },
      {
        title: '[Number] Lessons From [Specific Experience] That Changed How I Think About [Topic]',
        structure: 'Context → Lesson 1 → Lesson 2 → Lesson 3 → Synthesis',
        hook: 'numbered_wisdom'
      }
    ],
    prediction: [
      {
        title: 'The Future of [Topic]: What\'s Coming in the Next 5 Years (Example figure: replace with your own)',
        structure: 'Current state → Driving forces → Predictions → How to prepare',
        hook: 'future_vision'
      },
      {
        title: 'Why [Topic] Will Look Completely Different by [Year]',
        structure: 'What\'s changing → Early signals → Implications → Action plan',
        hook: 'change_warning'
      },
      {
        title: '[Topic] Is at an Inflection Point: Here\'s What Comes Next',
        structure: 'The inflection → Historical parallel → New paradigm → Winners and losers',
        hook: 'urgency'
      }
    ],
    framework: [
      {
        title: 'The [Name] Framework: A New Way to Think About [Topic]',
        structure: 'Why existing approaches fail → Framework intro → Components → Application',
        hook: 'new_model'
      },
      {
        title: 'Introducing [Framework]: How Top Performers Approach [Topic]',
        structure: 'Pattern observation → Framework extraction → Detailed breakdown → Implementation',
        hook: 'best_practice'
      },
      {
        title: 'The Simple Model That Changed How I Think About [Topic]',
        structure: 'Before the model → Discovery → The model → Results since',
        hook: 'simplification'
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
  angle: { title: string; structure: string; hook: string },
  articleNum: number,
  totalArticles: number,
  countLabel: string,
  suggested: boolean
): string {
  const title = angle.title.replace(/\[Topic\]/g, titleWords(topic));
  // Run 12 (R12-20, B5): suggested proof and missing proof are printed as bracket prompts, never as the author's story.
  const proof1 = proofSlot(proofPoints[0], suggested, '[Your first example]');
  const proof2 = proofSlot(proofPoints[1], suggested, '[Your second example]');
  const proof3 = proofSlot(proofPoints[2], suggested, '[Your third example]');
  
  return `
---

## Article ${articleNum} of ${totalArticles}${countLabel}

**Headline:** ${title}
**Structure:** ${angle.structure}
**Word Count:** ~750 words

---

# ${title}

*By [Your Name], ${authorBackground}*

---

${generateHook(angle.hook, topic, yourTake, targetReader)}

---

## The Real Problem

Let me paint a picture you'll probably recognize.

This is for ${lowerFirstIfCommon(targetReader)}. [Only if true of your readers: what they have already tried on ${lowerFirstIfCommon(topic)}, for example books, webinars or consultants]

[Only if true of your readers: the gap they feel, for example "the results aren't matching the effort"]

[Your lesson, only if true: for example, "Here's what I've learned: it's usually the advice."]

[Only if true and provable: why the usual advice about ${lowerFirstIfCommon(topic)} falls short, for example "it assumes that what worked in one context will work in yours"]

${yourTake}. And that changes everything about how you should approach this.

---

## What I've Seen

Let me tell you about ${proof1}.

[**CUSTOMIZE:** Insert your specific story here. Be concrete: names, numbers, timeline, outcomes. The more specific, the more credible. This should be 2-3 paragraphs showing the reality of this proof point.]

Then there is ${proof2}. [Only if true and provable: why it shows the same pattern, so the first example was not an isolated incident]

[**CUSTOMIZE:** Second story or data point here. Different context, same underlying truth. This builds the case that your take isn't a fluke. It's a pattern. Another 2-3 paragraphs.]

[Only if true and provable: what these examples reveal that contradicts the conventional wisdom about ${lowerFirstIfCommon(topic)}.]

[Your reason for holding this view, in your own words]

---

## A Different Approach

Once you accept that ${lowerCommonWords(yourTake)}, a different path forward becomes clear.

**First**, you have to unlearn the habits that are working against you. This is harder than learning new ones. It means questioning assumptions you didn't even know you had.

**Second**, you need a new framework for thinking about ${lowerFirstIfCommon(topic)}. Not a rigid system, because those fail the moment reality deviates from the plan. But a set of principles that guide decision-making when the playbook doesn't apply.

**Third**, you have to be willing to look foolish in the short term: the right approach can look wrong to outside observers until the results come in. Your example: ${proof3}. [What it taught you, in one sentence]

Here's what this looks like in practice:

- Rather than following conventional wisdom, question every assumption
- Instead of optimizing for vanity metrics, optimize for real outcomes
- Stop asking "what's everyone else doing?" and start asking "what actually works?"

The specifics will vary based on your situation. But the underlying principle remains: ${lowerCommonWords(yourTake)}.

---

## The Path Forward

If you're among ${lowerFirstIfCommon(targetReader)}, you have a choice to make.

You can keep following the standard advice about ${lowerFirstIfCommon(topic)}. [Only if true: where that advice has fallen short for your readers]

Or you can accept an uncomfortable truth: ${lowerCommonWords(yourTake)}.

I know which path I'd choose. [Your proof: the results this path has produced for you or for others]

The question is whether you're ready to see ${lowerFirstIfCommon(topic)} differently.

**What's your experience been? I'd love to hear whether this resonates, or where you disagree. The best insights come from the conversation.**

---

*[Your Name] is ${authorBackground}. Connect on LinkedIn or reach out at [email].*

---

**Publishing Notes:**
- Backup headline: "What most ${lowerFirstIfCommon(targetReader)} get wrong about ${lowerFirstIfCommon(topic)}"
- Recommended image: Visual representing the contrast between conventional and alternative approach
- Best posting time: Tuesday-Thursday, 8-10am (Example figure: replace with your own)

---

`;
}

function generateHook(hookType: string, topic: string, yourTake: string, targetReader: string): string {
  const hooks: Record<string, string> = {
    controversy: `Here's something that might make you uncomfortable: ${lowerCommonWords(yourTake)}.

I know that goes against everything you've been told about ${lowerFirstIfCommon(topic)}. [Your experience: how long you have worked on this, and what changed your mind]

If you're among ${lowerFirstIfCommon(targetReader)}, this matters more than you think. Here's why.`,

    revelation: `Here's a view on ${lowerFirstIfCommon(topic)} for ${lowerFirstIfCommon(targetReader)}: ${lowerCommonWords(yourTake)}.

[Only if true: why the people who have figured this out do not talk about it publicly] [Your experience: how often you have seen this pattern]`,

    direct_challenge: `Stop. Before you read another article about ${lowerFirstIfCommon(topic)}, I need to tell you something.

[Only if true and provable: the common advice your readers follow, and how it makes things worse]

${yourTake}. [Your experience: how long you have worked with ${targetReader}, and what you saw]`,

    promise_of_value: `What if I told you that ${lowerFirstIfCommon(topic)} is simpler than everyone makes it out to be?

Not easy. Simple. There's a difference.

[Your experience: how you learned what works with ${lowerFirstIfCommon(topic)}]. Here it is, in a form you can start using today. Not theory. Not frameworks that look good in slideshows.`,

    proof_of_results: `Here's something worth sharing.

[Your story: when you first saw that ${lowerCommonWords(yourTake)}]. [Your proof: the results you have seen since, in your own work or with ${targetReader}]

This isn't about incremental improvement. This is about fundamentally rethinking ${lowerFirstIfCommon(topic)}.`,

    transformation: `[Your story: where you were with ${lowerFirstIfCommon(topic)} before, and what it was like]

Then something shifted. I realized that ${lowerCommonWords(yourTake)}. [What happened next, in one or two sentences]`,

    experience_credibility: `[Your experience: how long you have worked on ${lowerFirstIfCommon(topic)}, and the mistakes you made along the way]

One truth has emerged that I wish someone had told me from the start:

${yourTake}`,

    vulnerability: `[Your story: a mistake you made with ${lowerFirstIfCommon(topic)}, and what it cost you]

[What it taught you, and how it changed your approach to ${lowerFirstIfCommon(topic)}]

Here's what happened, and what it might mean for you.`,

    numbered_wisdom: `[Your experience: how long you have worked in this space]. Success with ${lowerFirstIfCommon(topic)} comes down to a handful of non-obvious insights.

Not tactics. Not hacks. Insights: the kind that change how you think about the problem entirely.

${yourTake} was the first one. Here are the others.`,

    future_vision: `[Your prediction: how the ${lowerFirstIfCommon(topic)} landscape will shift, and your evidence]

If you're among ${lowerFirstIfCommon(targetReader)}, [Only if true: the opportunity this shift creates for those who see it coming].

Here's what I'm seeing, and what you should do about it.`,

    change_warning: `[Only if true: what is changing in ${lowerFirstIfCommon(topic)} that most ${targetReader} haven't noticed yet]

[Your evidence: the signals you see, and where]

${yourTake}. Here's why that matters now more than ever.`,

    urgency: `[Only if true and provable: why ${lowerFirstIfCommon(topic)} is at an inflection point now, and your evidence]

If you're among ${lowerFirstIfCommon(targetReader)}, your choices in the next 12-18 months will determine which side of this shift you end up on. (Example figure: replace with your own)`,

    new_model: `The way we think about ${lowerFirstIfCommon(topic)} is fundamentally flawed.

[Only if true and provable: the mental model that holds ${targetReader} back, and your evidence]

Here's a different way to think about it.`,

    best_practice: `[Your research: whose approach to ${lowerFirstIfCommon(topic)} you have studied, and how]

[Only if your research shows it: what they do that differs from the standard advice]

Here's the pattern.`,

    simplification: `${cap(lowerFirstIfCommon(topic))} is overcomplicated.

[Only if true: why it is made to look complex, in your own words]

Here's the model.`
  };

  return hooks[hookType] || hooks.controversy;
}

function generatePromotionalPosts(topic: string, yourTake: string, proofPoints: string[], numArticles: number, suggested: boolean): string {
  let posts = '';
  
  for (let i = 0; i < numArticles; i++) {
    const proof = proofSlot(proofPoints[i % proofPoints.length], suggested, '[Your story]');
    posts += `
### Promo Post ${i + 1} (for Article ${i + 1})

---

${yourTake}

I know that's not what the experts say.

What convinced me: ${proof}.

Here's what I learned:

→ [Your first lesson, for example: the conventional wisdom about ${lowerFirstIfCommon(topic)} is backwards]
→ [Your second lesson, for example: what actually works looks nothing like the playbook]
→ [Your third lesson, for example: the people getting results are doing something different]

I just published a deep dive on this, sharing the evidence, what it means, and what to do about it.

Link in comments

What's your experience been?

---

**Target length:** ~200 words (this draft is shorter: add your own story)
**Hashtags:** #${topic.replace(/\s+/g, '')} #ThoughtLeadership #Insights

---

`;
  }
  
  return posts;
}

// Generate suggested proof points when user doesn't provide them
function generateSuggestedProofPoints(topic: string, yourTake: string, articleType: string): string[] {
  const baseProofs = [
    `A personal story where you learned this lesson about ${lowerFirstIfCommon(topic)} the hard way`,
    `A client/colleague example that demonstrates ${yourTake.substring(0, 50)}...`,
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
  
  return typeSpecificProofs[articleType] || baseProofs;
}

// Run 12 (R12-20, B5): a proof point the user gave is printed as given; a suggested one becomes a bracket prompt
// ("[Your story: evidence that the conventional wisdom fails (study, example, data)]"); a missing one gets the fallback prompt.
function proofSlot(point: string | undefined, suggested: boolean, fallback: string): string {
  if (!point) return fallback;
  return suggested ? `[Your story: ${point.charAt(0).toLowerCase()}${point.slice(1)}]` : point;
}
