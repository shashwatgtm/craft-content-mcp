import { analyzeContent, generateImprovedVersion, countWords, avgWordsPerSentence, calculateReadability, ContentAnalysis, SUGGESTION_FOOTER } from './utils.js';

// Default goals by content type
const DEFAULT_GOALS: Record<string, string> = {
  blog_post: 'Engage readers and drive shares/comments',
  email: 'Get opens, clicks, and responses',
  landing_page: 'Convert visitors to signups/purchases',
  social_post: 'Drive engagement and shares',
  sales_email: 'Get meetings booked',
  product_description: 'Clearly explain value and drive purchases',
  press_release: 'Get media coverage',
  case_study: 'Build credibility and drive inquiries'
};

export function generateContentImprover(args: {
  content: string;
  content_type: string;
  goal?: string;
  audience?: string;
  tone_preference?: string;
}): string {
  const content = args.content;
  const contentType = args.content_type || 'blog_post';
  const goal = args.goal || DEFAULT_GOALS[contentType] || 'Improve clarity and engagement';
  const audience = args.audience || 'general audience';
  const tonePreference = args.tone_preference || 'keep_same';
  
  // Note if goal was auto-assigned
  const goalNote = args.goal ? '' : ` *(auto-assigned based on content type)*`;
  
  // Perform actual analysis
  const analysis = analyzeContent(content, contentType, goal);
  const readability = calculateReadability(content);
  const wordCount = countWords(content);
  const avgSentenceLength = avgWordsPerSentence(content);
  
  // Generate improved version
  const improvedContent = generateImprovedVersion(content, analysis);
  
  // Create specific recommendations based on analysis
  const priorityFixes: string[] = [];
  
  // Sort by lowest scores first
  const dimensions = [
    { name: 'Clarity', ...analysis.clarity },
    { name: 'Structure', ...analysis.structure },
    { name: 'Engagement', ...analysis.engagement },
    { name: 'Goal Alignment', ...analysis.goalAlignment }
  ].sort((a, b) => a.score - b.score);
  
  for (const dim of dimensions) {
    if (dim.score < 7 && dim.suggestions.length > 0) {
      priorityFixes.push(`**${dim.name}** (${dim.score}/10): ${dim.suggestions[0]}`);
    }
  }

  let output = `# 📝 Content Analysis & Improvement Report

## Content Overview
- **Type:** ${contentType.replace(/_/g, ' ')}
- **Goal:** ${goal}${goalNote}
- **Audience:** ${audience}
- **Word Count:** ${wordCount}
- **Avg Sentence Length:** ${avgSentenceLength} words

---

## 📊 Overall Score: ${analysis.overall.score}/10 (${analysis.overall.rating})

| Dimension | Score | Status |
|-----------|-------|--------|
| Clarity | ${analysis.clarity.score}/10 | ${analysis.clarity.score >= 7 ? '✅' : analysis.clarity.score >= 5 ? '⚠️' : '❌'} |
| Structure | ${analysis.structure.score}/10 | ${analysis.structure.score >= 7 ? '✅' : analysis.structure.score >= 5 ? '⚠️' : '❌'} |
| Engagement | ${analysis.engagement.score}/10 | ${analysis.engagement.score >= 7 ? '✅' : analysis.engagement.score >= 5 ? '⚠️' : '❌'} |
| Goal Alignment | ${analysis.goalAlignment.score}/10 | ${analysis.goalAlignment.score >= 7 ? '✅' : analysis.goalAlignment.score >= 5 ? '⚠️' : '❌'} |

---

## 📖 Readability Analysis

**Flesch Score:** ${readability.score}/100 (${readability.grade})

${readability.analysis}

---

## 🔍 Detailed Analysis

### Clarity Issues Found
${analysis.clarity.issues.length > 0 
  ? analysis.clarity.issues.map(i => `- ⚠️ ${i}`).join('\n')
  : '- ✅ No major clarity issues'}

### Structure Issues Found
${analysis.structure.issues.length > 0 
  ? analysis.structure.issues.map(i => `- ⚠️ ${i}`).join('\n')
  : '- ✅ Well-structured content'}

### Engagement Issues Found
${analysis.engagement.issues.length > 0 
  ? analysis.engagement.issues.map(i => `- ⚠️ ${i}`).join('\n')
  : '- ✅ Engaging content'}

### Goal Alignment Issues Found
${analysis.goalAlignment.issues.length > 0 
  ? analysis.goalAlignment.issues.map(i => `- ⚠️ ${i}`).join('\n')
  : '- ✅ Well-aligned with goals'}

---

## 🎯 Priority Fixes (Do These First)

${priorityFixes.length > 0 
  ? priorityFixes.map((fix, i) => `${i + 1}. ${fix}`).join('\n\n')
  : '✅ No critical fixes needed - your content is in good shape!'}

---

## ✨ Improved Version

Below is an auto-improved version addressing common issues:

---

${improvedContent}

---

## 📋 Before/After Comparison

### Original First Sentence:
> ${content.split(/[.!?]/)[0]?.trim() || 'N/A'}

### Suggested Opening:
> ${generateBetterHook(content, contentType, goal)}

---

## 💡 ${contentType.replace(/_/g, ' ').toUpperCase()}-Specific Tips

${getContentTypeTips(contentType, goal)}

---

## ✅ Quick Checklist

${generateChecklist(contentType, goal, analysis)}

---

${SUGGESTION_FOOTER}
`;

  return output;
}

function generateBetterHook(content: string, contentType: string, goal: string): string {
  const goalLower = goal.toLowerCase();
  
  if (goalLower.includes('convert') || goalLower.includes('sign up')) {
    return `Struggling with [problem]? Here's the solution that [benefit] in just [timeframe].`;
  }
  
  if (goalLower.includes('educate') || goalLower.includes('inform')) {
    return `Everything you need to know about [topic], explained simply.`;
  }
  
  if (goalLower.includes('engage') || contentType === 'social_post') {
    return `Unpopular opinion: [contrarian take on topic]. Here's why...`;
  }
  
  if (contentType === 'sales_email') {
    return `[Name], I noticed [specific observation about their company]. Quick question: [relevant question]?`;
  }
  
  if (contentType === 'landing_page') {
    return `[Primary benefit] without [primary pain point]. Get started in [timeframe].`;
  }
  
  return `[Hook that addresses reader's main pain point or desire]`;
}

function getContentTypeTips(contentType: string, goal: string): string {
  const tips: Record<string, string> = {
    blog_post: `
- **Ideal length:** 1,500-2,500 words for SEO (Example figure: replace with your own)
- **Subheadings:** Every 300-400 words
- **Include:** At least one image, list, or quote
- **CTA placement:** Middle and end of post
- **Meta description:** 150-160 characters summarizing value`,
    
    email: `
- **Subject line:** 6-10 words, personalized if possible
- **Preview text:** Complement (don't repeat) subject line
- **Length:** 50-125 words for highest engagement (Example figure: replace with your own)
- **CTA:** One clear, specific action
- **P.S. line:** Second CTA or urgency element`,
    
    landing_page: `
- **Headline:** Clear benefit in 10 words or less
- **Subheadline:** Expand on how you deliver the benefit
- **Social proof:** Above the fold
- **CTA:** Visible without scrolling, repeated 3x (Example figure: replace with your own)
- **Form fields:** Minimize - each field reduces conversion`,
    
    social_post: `
- **Hook:** First line must stop the scroll
- **Format:** Short paragraphs, line breaks, emojis sparingly
- **Engagement:** Ask a question or opinion
- **Hashtags:** 3-5 relevant tags (Example figure: replace with your own)
- **CTA:** What action do you want?`,
    
    sales_email: `
- **Subject:** Personalized, curiosity-driven
- **Opening:** About THEM, not you
- **Value prop:** One clear benefit
- **Proof:** Brief case study or metric
- **CTA:** Specific, low-commitment ask
- **Length:** Under 150 words`,
    
    product_description: `
- **Lead with benefits:** What problem it solves
- **Features as proof:** How it delivers benefits
- **Social proof:** Reviews, testimonials, ratings
- **Sensory language:** Help them visualize using it
- **Urgency:** Stock levels, time-limited offers`,
    
    press_release: `
- **Headline:** Newsworthy angle, not promotional
- **Lead paragraph:** Who, what, when, where, why
- **Quotes:** From executives and/or customers
- **Boilerplate:** Company description at end
- **Contact:** Clear media contact info`,
    
    case_study: `
- **Structure:** Challenge → Solution → Results
- **Specifics:** Named customer, real numbers
- **Quotes:** Direct customer testimonials
- **Visuals:** Screenshots, graphs, before/after
- **CTA:** "See how you can achieve similar results"`
  };
  
  return tips[contentType] || `
- Focus on your primary goal: ${goal}
- Match tone to audience expectations
- Include a clear call to action
- Use specific examples and data`;
}

function generateChecklist(contentType: string, goal: string, analysis: ContentAnalysis): string {
  const checks: string[] = [];
  
  // Universal checks
  // The mark is chosen first, then the text is added, so a passed check keeps its text.
  checks.push((analysis.clarity.score >= 7 ? '✅' : '⬜') + ' Clear, jargon-free language');
  checks.push((analysis.structure.score >= 7 ? '✅' : '⬜') + ' Logical structure with headers');
  checks.push((analysis.engagement.score >= 7 ? '✅' : '⬜') + ' Engaging opening hook');
  checks.push((analysis.goalAlignment.score >= 7 ? '✅' : '⬜') + ' Aligns with stated goal');
  
  // Content-type specific
  if (contentType === 'email' || contentType === 'sales_email') {
    checks.push('⬜ Subject line optimized');
    checks.push('⬜ Single clear CTA');
    checks.push('⬜ Mobile-friendly format');
  }
  
  if (contentType === 'landing_page') {
    checks.push('⬜ Benefit-driven headline');
    checks.push('⬜ Social proof included');
    checks.push('⬜ CTA above the fold');
  }
  
  if (contentType === 'blog_post') {
    checks.push('⬜ SEO-optimized title');
    checks.push('⬜ Meta description written');
    checks.push('⬜ Internal/external links added');
  }
  
  return checks.join('\n');
}
