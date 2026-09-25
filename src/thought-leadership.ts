import { parseListItems, SUGGESTION_FOOTER } from './utils.js';

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
  const authorBackground = args.author_background || 'Industry practitioner';
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

⚠️ **NOTE:** You didn't provide proof points. We've generated articles using suggested evidence below.
**To strengthen these articles, gather real proof for:**
${proofPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

`;
  }
  
  let output = `# 💡 Thought Leadership Series: ${topic}

## Series Overview

| Element | Detail |
|---------|--------|
| **Topic** | ${topic} |
| **Your Take** | ${yourTake} |
| **Target Reader** | ${targetReader} |
| **Author Credibility** | ${authorBackground} |
| **Articles** | ${numArticles} byline pieces (600-800 words each)${countLabel} |
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
      countLabel
    );
  }

  // Add promotional social posts
  output += `
---

## 📱 Promotional Posts (short drafts: expand each to 200-300 words)

Use these short posts to promote your byline articles on social media:

${generatePromotionalPosts(topic, yourTake, proofPoints, numArticles)}

---

## 📅 Publishing Strategy

| Week | Content | Platform |
|------|---------|----------|
| Week 1 | Article 1 | LinkedIn Article / Medium / Company Blog |
| Week 1 | Promo post for Article 1 | LinkedIn feed, Twitter |
| Week 2 | Article 2 | LinkedIn Article / Medium / Company Blog |
| Week 2 | Promo post for Article 2 | LinkedIn feed, Twitter |
| Week 3 | Article 3 | LinkedIn Article / Medium / Company Blog |
| Week 3 | Series summary post | LinkedIn feed |
| Week 4 | Pitch to industry publication | Forbes, Inc, industry trades |

## 🎯 Where to Publish

**Tier 1 - Your owned channels:**
- LinkedIn Articles (best for B2B thought leadership)
- Medium (broader reach, good SEO)
- Company blog (owned asset)

**Tier 2 - Industry publications:**
- Industry-specific publications in your space
- Trade magazines and websites

**Tier 3 - Major outlets (pitch required):**
- Forbes Councils (paid membership)
- Entrepreneur, Inc (contributor programs)
- Harvard Business Review (highly competitive)

---

## ✅ Pre-Publish Checklist

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
  countLabel: string
): string {
  const title = angle.title.replace(/\[Topic\]/g, topic);
  const proof1 = proofPoints[0] || 'my experience with this';
  const proof2 = proofPoints[1] || 'what I\'ve observed across the industry';
  const proof3 = proofPoints[2] || 'the patterns that keep emerging';
  
  return `
---

## 📄 Article ${articleNum} of ${totalArticles}${countLabel}

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

You're ${targetReader}. You've read the books, attended the webinars, maybe even hired consultants. When it comes to ${topic}, you've done your homework.

And yet something's not clicking.

The results aren't matching the effort. The advice that worked for others seems to fall flat for you. You're left wondering if you're doing something wrong—or if the advice itself is the problem.

Here's what I've learned: **it's usually the advice.**

Not because the people giving it are wrong or dishonest. But because most advice about ${topic} is based on a flawed assumption: that what worked in one context will work in yours. That best practices are universal. That following the playbook is the path to success.

${yourTake}. And that changes everything about how you should approach this.

---

## What I've Seen

Let me tell you about ${proof1}.

[**CUSTOMIZE:** Insert your specific story here. Be concrete—names, numbers, timeline, outcomes. The more specific, the more credible. This should be 2-3 paragraphs showing the reality of this proof point.]

This wasn't an isolated incident. When I look at ${proof2}, the same pattern emerges.

[**CUSTOMIZE:** Second story or data point here. Different context, same underlying truth. This builds the case that your take isn't a fluke—it's a pattern. Another 2-3 paragraphs.]

What these examples reveal is something that contradicts the conventional wisdom about ${topic}. We've been told that the standard approach works. But the evidence suggests otherwise.

This isn't about being contrarian for its own sake. It's about following the truth where it leads, even when it conflicts with what we've been taught.

---

## A Different Approach

Once you accept that ${yourTake.toLowerCase()}, a different path forward becomes clear.

**First**, you have to unlearn the habits that are working against you. This is harder than learning new ones. It means questioning assumptions you didn't even know you had.

**Second**, you need a new framework for thinking about ${topic}. Not a rigid system—those fail the moment reality deviates from the plan. But a set of principles that guide decision-making when the playbook doesn't apply.

**Third**, you have to be willing to look foolish in the short term. ${proof3} taught me that the right approach often looks wrong to outside observers—until the results speak for themselves.

Here's what this looks like in practice:

- Rather than following conventional wisdom, question every assumption
- Instead of optimizing for vanity metrics, optimize for real outcomes
- Stop asking "what's everyone else doing?" and start asking "what actually works?"

The specifics will vary based on your situation. But the underlying principle remains: ${yourTake.toLowerCase()}.

---

## The Path Forward

If you're ${targetReader}, you have a choice to make.

You can keep following the standard advice about ${topic}—the playbooks, the best practices, the "proven" approaches that somehow never quite work as advertised.

Or you can accept an uncomfortable truth: ${yourTake.toLowerCase()}.

I know which path I'd choose. I know which path has produced results for me and for others who've made this shift.

The question is whether you're ready to see ${topic} differently.

**What's your experience been? I'd love to hear whether this resonates—or where you disagree. The best insights come from the conversation.**

---

*[Your Name] is ${authorBackground}. Connect on LinkedIn or reach out at [email].*

---

**Publishing Notes:**
- Backup headline: "What Most ${targetReader} Get Wrong About ${topic}"
- Recommended image: Visual representing the contrast between conventional and alternative approach
- Best posting time: Tuesday-Thursday, 8-10am (Example figure: replace with your own)

---

`;
}

function generateHook(hookType: string, topic: string, yourTake: string, targetReader: string): string {
  const hooks: Record<string, string> = {
    controversy: `Here's something that might make you uncomfortable: ${yourTake.toLowerCase()}.

I know that goes against everything you've been told about ${topic}. I used to believe the conventional wisdom too. Then I spent years in the trenches, and I discovered that almost everything the experts teach about ${topic} is not just incomplete—it's actively harmful.

If you're ${targetReader}, this matters more than you think. Here's why.`,

    revelation: `There's a conversation happening behind closed doors that most ${targetReader} never hear.

It's about ${topic}—specifically, about ${yourTake.toLowerCase()}.

The people who've figured this out aren't talking about it publicly. Not because it's a secret, but because admitting it means acknowledging that the standard playbook is broken. After seeing this pattern play out dozens of times, I can't stay quiet anymore.`,

    direct_challenge: `Stop. Before you read another article about ${topic}, I need to tell you something.

That advice you've been following? The "best practices" everyone swears by? They're probably making things worse.

${yourTake}. I didn't want to believe it either. But after working with ${targetReader} for years, the evidence is overwhelming.`,

    promise_of_value: `What if I told you that ${topic} is simpler than everyone makes it out to be?

Not easy—simple. There's a difference.

After years of watching ${targetReader} struggle with ${topic}, I've distilled what actually works into something you can start using today. Not theory. Not frameworks that look good in slideshows. Real approaches that produce real results.`,

    proof_of_results: `Here's something I wasn't supposed to share.

When I first discovered that ${yourTake.toLowerCase()}, I didn't believe it either. Now, having seen the results—in my own work and with dozens of ${targetReader}—I can't ignore it anymore.

This isn't about incremental improvement. This is about fundamentally rethinking ${topic}.`,

    transformation: `Two years ago, I was where you probably are now with ${topic}.

Frustrated. Trying everything the experts recommended. Getting mediocre results despite putting in maximum effort.

Then something shifted. I realized that ${yourTake.toLowerCase()}. What happened next changed everything.`,

    experience_credibility: `In my years of working on ${topic}, I've made every mistake possible.

I've followed the playbooks. I've ignored the playbooks. I've invented my own playbooks only to throw them out. Through all of it, one truth has emerged that I wish someone had told me from the start:

${yourTake}`,

    vulnerability: `I need to tell you about a mistake I made with ${topic}.

It cost me time, money, and credibility. But more importantly, it taught me something that changed how I approach ${topic} entirely.

Here's what happened, and what it might mean for you.`,

    numbered_wisdom: `After years in this space, I've learned that success with ${topic} comes down to a handful of non-obvious insights.

Not tactics. Not hacks. Insights—the kind that change how you think about the problem entirely.

${yourTake} was the first one. Here are the others.`,

    future_vision: `The ${topic} landscape is about to shift dramatically.

If you're ${targetReader}, the changes coming in the next few years will create massive opportunities—for those who see them coming. Everyone else will be left wondering what happened.

Here's what I'm seeing, and what you should do about it.`,

    change_warning: `Something is happening in ${topic} that most ${targetReader} haven't noticed yet.

The signals are subtle, but they're everywhere if you know where to look. And if you're not paying attention, you risk being blindsided by changes that will reshape the entire landscape.

${yourTake}. Here's why that matters now more than ever.`,

    urgency: `We're at an inflection point with ${topic}.

The old rules are breaking down. The new rules aren't fully formed yet. That means right now is when the future is being decided.

If you're ${targetReader}, your choices in the next 12-18 months will determine which side of this shift you end up on. (Example figure: replace with your own)`,

    new_model: `The way we think about ${topic} is fundamentally flawed.

I'm not talking about small errors or missing nuances. I'm talking about a mental model that's actively preventing ${targetReader} from achieving what they're capable of.

Here's a different way to think about it.`,

    best_practice: `I've studied how the best in the world approach ${topic}.

Not the famous names who talk about it on podcasts. The quiet operators who consistently produce results that seem almost unfair.

What they do looks nothing like the standard advice. Here's the pattern I've extracted.`,

    simplification: `${topic} is overcomplicated.

Not because it's inherently complex, but because complexity serves people selling solutions. The truth is simpler—and more actionable—than you've been led to believe.

Here's the model I now use for everything.`
  };

  return hooks[hookType] || hooks.controversy;
}

function generatePromotionalPosts(topic: string, yourTake: string, proofPoints: string[], numArticles: number): string {
  let posts = '';
  
  for (let i = 0; i < numArticles; i++) {
    const proof = proofPoints[i % proofPoints.length] || 'my experience';
    posts += `
### Promo Post ${i + 1} (for Article ${i + 1})

---

${yourTake}

I know that's not what the experts say. I used to follow their advice too.

Then I experienced ${proof}.

Here's what I learned:

→ The conventional wisdom about ${topic} is backwards
→ What actually works looks nothing like the playbook
→ The people getting results are doing something different

I just published a deep dive on this—sharing the evidence, what it means, and what to do about it.

Link in comments 👇

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
    `A personal story where you learned this lesson about ${topic} the hard way`,
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
