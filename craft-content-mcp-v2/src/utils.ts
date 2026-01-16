// Utility functions for content analysis and generation

export function parseListItems(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map(item => item.replace(/^[-•*]\s*/, '').trim())
    .filter(item => item.length > 0);
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

export function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

export function avgWordsPerSentence(text: string): number {
  const sentences = countSentences(text);
  if (sentences === 0) return 0;
  return Math.round(countWords(text) / sentences * 10) / 10;
}

export function calculateReadability(text: string): { score: number; grade: string; analysis: string } {
  const words = countWords(text);
  const sentences = countSentences(text);
  const syllables = countSyllables(text);
  
  if (sentences === 0 || words === 0) {
    return { score: 0, grade: 'N/A', analysis: 'Not enough content to analyze' };
  }
  
  // Flesch Reading Ease formula
  const fleschScore = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
  const normalizedScore = Math.max(0, Math.min(100, fleschScore));
  
  let grade = '';
  let analysis = '';
  
  if (normalizedScore >= 80) {
    grade = 'Very Easy';
    analysis = 'Accessible to everyone. Good for broad audiences.';
  } else if (normalizedScore >= 60) {
    grade = 'Standard';
    analysis = 'Appropriate for most business content.';
  } else if (normalizedScore >= 40) {
    grade = 'Fairly Difficult';
    analysis = 'Best for technical or expert audiences.';
  } else if (normalizedScore >= 20) {
    grade = 'Difficult';
    analysis = 'Academic level. May be too complex for general audience.';
  } else {
    grade = 'Very Difficult';
    analysis = 'Consider simplifying for better engagement.';
  }
  
  return { score: Math.round(normalizedScore), grade, analysis };
}

function countSyllables(text: string): number {
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  let total = 0;
  
  for (const word of words) {
    let count = 0;
    const vowels = 'aeiouy';
    let prevWasVowel = false;
    
    for (const char of word) {
      const isVowel = vowels.includes(char);
      if (isVowel && !prevWasVowel) count++;
      prevWasVowel = isVowel;
    }
    
    // Adjust for silent e
    if (word.endsWith('e') && count > 1) count--;
    // Every word has at least one syllable
    total += Math.max(1, count);
  }
  
  return total;
}

export interface ContentAnalysis {
  clarity: { score: number; issues: string[]; suggestions: string[] };
  structure: { score: number; issues: string[]; suggestions: string[] };
  engagement: { score: number; issues: string[]; suggestions: string[] };
  goalAlignment: { score: number; issues: string[]; suggestions: string[] };
  overall: { score: number; rating: string };
}

export function analyzeContent(content: string, contentType: string, goal: string): ContentAnalysis {
  const analysis: ContentAnalysis = {
    clarity: { score: 0, issues: [], suggestions: [] },
    structure: { score: 0, issues: [], suggestions: [] },
    engagement: { score: 0, issues: [], suggestions: [] },
    goalAlignment: { score: 0, issues: [], suggestions: [] },
    overall: { score: 0, rating: '' }
  };
  
  const words = countWords(content);
  const sentences = countSentences(content);
  const avgWords = avgWordsPerSentence(content);
  const readability = calculateReadability(content);
  
  // CLARITY ANALYSIS
  let clarityScore = 10;
  
  // Check sentence length
  if (avgWords > 25) {
    clarityScore -= 3;
    analysis.clarity.issues.push(`Sentences too long (avg ${avgWords} words)`);
    analysis.clarity.suggestions.push('Break sentences at natural pauses. Target 15-20 words per sentence.');
  } else if (avgWords > 20) {
    clarityScore -= 1;
    analysis.clarity.issues.push(`Sentences slightly long (avg ${avgWords} words)`);
    analysis.clarity.suggestions.push('Consider shortening some sentences for easier scanning.');
  }
  
  // Check for passive voice indicators
  const passivePatterns = /\b(was|were|been|being|is|are|am)\s+\w+ed\b/gi;
  const passiveMatches = content.match(passivePatterns) || [];
  if (passiveMatches.length > sentences * 0.3) {
    clarityScore -= 2;
    analysis.clarity.issues.push(`High passive voice usage (${passiveMatches.length} instances)`);
    analysis.clarity.suggestions.push('Convert to active voice: "X did Y" instead of "Y was done by X"');
  }
  
  // Check for jargon/complexity
  const jargonWords = ['utilize', 'leverage', 'synergy', 'paradigm', 'optimize', 'facilitate', 'implement', 'methodology'];
  const foundJargon = jargonWords.filter(j => content.toLowerCase().includes(j));
  if (foundJargon.length > 2) {
    clarityScore -= 1;
    analysis.clarity.issues.push(`Business jargon detected: ${foundJargon.join(', ')}`);
    analysis.clarity.suggestions.push('Replace with simpler words: "use" instead of "utilize", "improve" instead of "optimize"');
  }
  
  analysis.clarity.score = Math.max(0, clarityScore);
  
  // STRUCTURE ANALYSIS
  let structureScore = 10;
  
  // Check for headers/sections
  const hasHeaders = /^#{1,3}\s|^\*\*[^*]+\*\*$|^[A-Z][^a-z]+$/gm.test(content);
  if (!hasHeaders && words > 200) {
    structureScore -= 3;
    analysis.structure.issues.push('No clear section headers');
    analysis.structure.suggestions.push('Add headers to break up content and aid scanning');
  }
  
  // Check paragraph length
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  const longParagraphs = paragraphs.filter(p => countWords(p) > 100);
  if (longParagraphs.length > 0) {
    structureScore -= 2;
    analysis.structure.issues.push(`${longParagraphs.length} paragraphs over 100 words`);
    analysis.structure.suggestions.push('Break long paragraphs at topic shifts. Aim for 50-75 words per paragraph.');
  }
  
  // Check for logical flow indicators
  const transitionWords = ['however', 'therefore', 'additionally', 'furthermore', 'consequently', 'moreover', 'first', 'second', 'finally'];
  const foundTransitions = transitionWords.filter(t => content.toLowerCase().includes(t));
  if (foundTransitions.length < 2 && paragraphs.length > 3) {
    structureScore -= 2;
    analysis.structure.issues.push('Few transition words - may feel disjointed');
    analysis.structure.suggestions.push('Add transitions: "However...", "As a result...", "First... Second..."');
  }
  
  analysis.structure.score = Math.max(0, structureScore);
  
  // ENGAGEMENT ANALYSIS
  let engagementScore = 10;
  
  // Check for questions
  const questionCount = (content.match(/\?/g) || []).length;
  if (questionCount === 0 && contentType !== 'press_release') {
    engagementScore -= 2;
    analysis.engagement.issues.push('No questions to engage reader');
    analysis.engagement.suggestions.push('Add a rhetorical question to draw readers in');
  }
  
  // Check for "you" language
  const youCount = (content.match(/\byou\b|\byour\b/gi) || []).length;
  if (youCount < 3 && contentType !== 'press_release') {
    engagementScore -= 2;
    analysis.engagement.issues.push('Limited "you" language - feels impersonal');
    analysis.engagement.suggestions.push('Reframe benefits in terms of "you": "You\'ll save time" vs "It saves time"');
  }
  
  // Check for power words
  const powerWords = ['free', 'new', 'proven', 'easy', 'guaranteed', 'save', 'results', 'discover', 'secret', 'exclusive'];
  const foundPowerWords = powerWords.filter(p => content.toLowerCase().includes(p));
  if (foundPowerWords.length === 0) {
    engagementScore -= 1;
    analysis.engagement.issues.push('No power words for emotional impact');
    analysis.engagement.suggestions.push('Add: proven, results, discover, exclusive, free');
  }
  
  // Check hook (first sentence)
  const firstSentence = content.split(/[.!?]/)[0] || '';
  if (countWords(firstSentence) > 20) {
    engagementScore -= 2;
    analysis.engagement.issues.push('Opening sentence too long - may lose readers');
    analysis.engagement.suggestions.push('Start with a punchy hook under 15 words');
  }
  
  analysis.engagement.score = Math.max(0, engagementScore);
  
  // GOAL ALIGNMENT ANALYSIS
  let goalScore = 10;
  const goalLower = goal.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Check if CTA exists
  const ctaPatterns = /\b(sign up|register|download|learn more|get started|contact|subscribe|try|book|schedule|click)\b/gi;
  const hasCTA = ctaPatterns.test(content);
  
  if (goalLower.includes('convert') || goalLower.includes('sign up') || goalLower.includes('lead')) {
    if (!hasCTA) {
      goalScore -= 4;
      analysis.goalAlignment.issues.push('Goal requires conversion but no CTA found');
      analysis.goalAlignment.suggestions.push('Add clear CTA: "Sign up now", "Get started today"');
    }
  }
  
  if (goalLower.includes('educate') || goalLower.includes('inform')) {
    if (words < 300) {
      goalScore -= 2;
      analysis.goalAlignment.issues.push('Educational content may be too brief');
      analysis.goalAlignment.suggestions.push('Expand with examples, data, or how-to steps');
    }
  }
  
  if (goalLower.includes('awareness') || goalLower.includes('brand')) {
    const brandMentions = (content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || []).length;
    if (brandMentions < 2) {
      goalScore -= 2;
      analysis.goalAlignment.issues.push('Brand/product mentions may be insufficient for awareness');
      analysis.goalAlignment.suggestions.push('Ensure brand is mentioned prominently');
    }
  }
  
  if (goalLower.includes('trust') || goalLower.includes('credibility')) {
    const hasNumbers = /\d+%|\$\d+|\d+x|\d+\s*(customer|client|user)/i.test(content);
    if (!hasNumbers) {
      goalScore -= 3;
      analysis.goalAlignment.issues.push('No data/proof points for credibility');
      analysis.goalAlignment.suggestions.push('Add specific metrics: "50% faster", "10,000+ customers"');
    }
  }
  
  analysis.goalAlignment.score = Math.max(0, goalScore);
  
  // Calculate overall
  const totalScore = analysis.clarity.score + analysis.structure.score + 
                     analysis.engagement.score + analysis.goalAlignment.score;
  analysis.overall.score = Math.round(totalScore / 4 * 10) / 10;
  
  if (analysis.overall.score >= 8) analysis.overall.rating = 'EXCELLENT';
  else if (analysis.overall.score >= 6) analysis.overall.rating = 'GOOD';
  else if (analysis.overall.score >= 4) analysis.overall.rating = 'NEEDS WORK';
  else analysis.overall.rating = 'MAJOR REVISION NEEDED';
  
  return analysis;
}

export function generateImprovedVersion(content: string, analysis: ContentAnalysis): string {
  let improved = content;
  
  // Apply common improvements
  
  // Shorten very long sentences
  const sentences = improved.split(/(?<=[.!?])\s+/);
  const improvedSentences = sentences.map(s => {
    if (countWords(s) > 30) {
      // Try to split at conjunctions
      const split = s.replace(/,\s*(and|but|so|or)\s+/gi, '.\n$1 ');
      return split.charAt(0).toUpperCase() + split.slice(1);
    }
    return s;
  });
  improved = improvedSentences.join(' ');
  
  // Replace common jargon
  const jargonReplacements: Record<string, string> = {
    'utilize': 'use',
    'leverage': 'use',
    'facilitate': 'help',
    'implement': 'start',
    'methodology': 'method',
    'optimize': 'improve',
    'synergy': 'collaboration',
    'paradigm': 'approach'
  };
  
  for (const [jargon, replacement] of Object.entries(jargonReplacements)) {
    const regex = new RegExp(`\\b${jargon}\\b`, 'gi');
    improved = improved.replace(regex, replacement);
  }
  
  return improved;
}

export function extractKeyPoints(text: string): string[] {
  const points: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Look for sentences with key indicators
  const keyIndicators = ['key', 'important', 'main', 'critical', 'essential', 'result', 'achieve', 'outcome', 'benefit', 'value'];
  
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (keyIndicators.some(k => lower.includes(k))) {
      points.push(sentence.trim());
    }
  }
  
  // If no key points found, take first few sentences
  if (points.length === 0 && sentences.length > 0) {
    points.push(...sentences.slice(0, 3).map(s => s.trim()));
  }
  
  return points.slice(0, 5);
}

export function generateHook(topic: string, style: 'question' | 'statistic' | 'story' | 'bold_statement'): string {
  switch (style) {
    case 'question':
      return `What if everything you knew about ${topic} was wrong?`;
    case 'statistic':
      return `78% of professionals struggle with ${topic}. Here's what the top performers do differently.`;
    case 'story':
      return `Last month, a ${topic} challenge nearly derailed our biggest launch. What we learned changed everything.`;
    case 'bold_statement':
      return `${topic.charAt(0).toUpperCase() + topic.slice(1)} is broken. Here's how to fix it.`;
    default:
      return `Let's talk about ${topic}.`;
  }
}
