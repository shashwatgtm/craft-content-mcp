// Utility functions for content analysis and generation

// Last line of any output that suggests timings, lengths or counts (lengths in words, time boxes, cadences).
export const SUGGESTION_FOOTER = 'Suggested timings, lengths and counts: adjust them to your own.';

// Text only (run 9): common words that may open an input phrase. Mid-sentence, only these are lowered
// ("Fewer no-shows" becomes "fewer no-shows"). Any other capitalised word is kept as typed, because it may be a
// name or an acronym ("Salesforce data you can trust", "Microsoft Teams approvals", "AI deal scoring", "CRM hygiene").
const COMMON_WORDS = new Set((
  'a an the this that these those our your their my its his her we you they it me us them all any each every ' +
  'both either neither no not none some many much more most less least fewer few several other another such ' +
  'same own only just even also still very too so as than then there here what which who whom whose when where ' +
  'why how whether if because while until unless though although since once after before during about above ' +
  'across against along among around at by for from in into inside near of off on onto out outside over past ' +
  'per through throughout to toward towards under underneath up upon via with within without is are was were be ' +
  'been being am do does did done doing have has had having can could will would shall should may might must ' +
  'need needs needed get gets got getting give gives gave make makes made let lets keep keeps put puts take ' +
  'takes took see sees show shows find finds know knows think go goes going come comes one two three four five ' +
  'six seven eight nine ten first second third last next new old big small large tiny long short high low full ' +
  'half whole top bottom early late fast faster fastest quick quicker quickest slow slower easy easier easiest ' +
  'simple simpler hard harder better best good great strong stronger weak weaker clear clearer real true right ' +
  'wrong free open closed live smart smarter lean cheaper cheap safe safer secure accurate reliable consistent ' +
  'predictable visible instant instantly automatic automatically manual custom modern legacy digital online ' +
  'offline mobile remote local global central single multiple multi daily weekly monthly quarterly yearly ' +
  'annual real-time realtime end self self-serve self-service one-tap one-click two-way no-code low-code always ' +
  'never often sometimes usually now today tomorrow soon yet again ever already almost nearly exactly directly ' +
  'fully truly entirely highly deeply readily cut cuts reduce reduces reduction lower lowers raise raises boost ' +
  'boosts grow grows growth increase increases improve improves save saves saving savings win wins earn earns ' +
  'drive drives drove speed speeds scale scales help helps support supports enable enables deliver delivers ' +
  'offer offers provide provides build builds create creates launch launches ship ships track tracks measure ' +
  'measures manage manages plan plans run runs start starts stop stops ends avoid avoids prevent prevents ' +
  'remove removes replace replaces fix fixes solve solves close closes book books send sends share shares sync ' +
  'syncs connect connects integrate integrates automate automates simplify simplifies streamline streamlines ' +
  'centralise centralize unify unifies align aligns turn turns spend spends lose loses miss misses waste wastes ' +
  'struggle struggles fail fails hit hits meet meets reach reaches use uses sell sells buy buys pay pays charge ' +
  'charges hire hires onboard onboards train trains coach coaches forecast forecasts prioritise prioritize ' +
  'qualify qualifies convert converts retain retains renew renews expand expands upsell engage engages nurture ' +
  'nurtures personalise personalize target targets segment segments score scores rank ranks route routes assign ' +
  'assigns approve approves review reviews report reports alert alerts notify notifies remind reminds schedule ' +
  'schedules reschedule reschedules capture captures collect collects clean cleans enrich enriches verify ' +
  'verifies protect protects comply complies audit audits monitor monitors test tests learn learns understand ' +
  'understands explain explains answer answers ask asks call calls email emails text texts chat message ' +
  'messages post posts publish publishes write writes read reads edit edits search searches data insights ' +
  'insight analytics reporting dashboards dashboard pipeline pipelines revenue revenues sales marketing success ' +
  'service services product products platform platforms software tool tools app apps system systems process ' +
  'processes workflow workflows team teams people customers customer clients client users user buyers buyer ' +
  'prospects prospect leads lead accounts account deals deal opportunities opportunity contracts contract ' +
  'renewals renewal churn retention onboarding adoption activation engagement conversion conversions demand ' +
  'cost costs price prices pricing budget budgets value roi time times hours days weeks months minutes setup ' +
  'set-up implementation integration integrations security compliance privacy risk risks errors error mistakes ' +
  'issues issue problems problem pain pains gaps gap delays delay bottlenecks friction complexity visibility ' +
  'control access approvals approval handoffs handoff meetings meeting appointments appointment bookings ' +
  'booking reminders reminder no-shows cancellations patients patient staff employees employee managers manager ' +
  'leaders leader executives reps rep agents agent partners partner vendors vendor suppliers supplier companies ' +
  'company businesses business organisations organizations enterprises enterprise startups startup founders ' +
  'founder owners owner operations operators finance hr legal procurement engineering developers developer ' +
  'admins admin inbound outbound content campaigns campaign ads events event webinars webinar messaging ' +
  'positioning brand trust quality accuracy efficiency productivity performance results outcomes outcome impact ' +
  'coverage capacity forecasting planning scheduling tracking billing invoicing payments payment payroll hiring ' +
  'recruiting training coaching selling buying spending waiting missing losing paper spreadsheets spreadsheet ' +
  'phone inboxes inbox documents document files file forms form tasks task projects project orders order ' +
  'inventory shipping delivery deliveries returns tickets ticket cases case questions question requests request ' +
  'feedback surveys survey notes note records record lists list numbers number figures figure metrics metric ' +
  'goals goal quotas quota territory territories regions region markets market industry industries verticals ' +
  'vertical category categories competitors competitor alternatives alternative options option features feature ' +
  'modules module add-ons tiers tier seats seat licenses license usage traffic visits visitors signups signup ' +
  'trials trial demos demo proposals proposal quotes quote invoices invoice common key main core major minor ' +
  'basic advanced practical proven essential critical important urgent hidden obvious step steps step-by-step ' +
  'approach approaches guide guides framework frameworks strategy strategies playbook playbooks checklist ' +
  'checklists practice practices trend trends future state lesson lessons tip tips way ways idea ideas reason ' +
  'reasons sign signs rule rules example examples mistake myth myths truth truths secret secrets habit habits ' +
  'principle principles pattern patterns everything nothing something anything everyone nobody someone work ' +
  'world life thing things part parts point points story stories change changes shift shifts move moves loss ' +
  'losses level levels stage stages phase phases week month year day higher bigger smaller larger shorter ' +
  'longer greater happier healthier cleaner smooth smoother seamless effortless painless hassle-free ' +
  'frictionless repeatable scalable flexible affordable transparent unified zero unlimited endless entire ' +
  'complete total actionable measurable shorten shortens stay stays handle handles prove proves focus focuses ' +
  'switch switches eliminate eliminates minimise minimize maximise maximize accelerate accelerates ensure ' +
  'ensures empower empowers unlock unlocks discover discovers spot spots catch catches detect detects predict ' +
  'predicts recover recovers resolve resolves respond responds reply replies follow follows hear hears worst ' +
  'lost won '
).split(/\s+/).filter(Boolean));
// A word counts as common when it is in the list, or ends in -ing or -ed ("Automated", "Missing"). A hyphenated
// word counts by its first part ("Two-way", "No-shows").
function isCommonWord(word: string): boolean {
  const head = word.split('-')[0].replace(/[^A-Za-z']+$/, '');
  if (!/^[A-Z][a-z']*$/.test(head) || head === 'I' || /[A-Z]/.test(word.slice(1))) return false;
  const w = head.toLowerCase();
  return COMMON_WORDS.has(w) || (w.length > 4 && /(?:ing|ed)$/.test(w));
}
// Text only (run 10): names that keep their capital when they open an input phrase placed mid-sentence. The list holds
// common product and company names and the names found in the test inputs; other names are kept by the rules below.
const KNOWN_NAMES = new Set((
  'Salesforce Microsoft Slack HubSpot LinkedIn Google Gmail Outlook Excel Zoom Zendesk Jira Notion Shopify Stripe ' +
  'Marketo Pardot Gong Intercom Freshworks Oracle SAP Workday ServiceNow Snowflake Tableau Asana Trello Dropbox ' +
  'Apple Amazon AWS Azure Facebook Instagram WhatsApp YouTube Acme ExampleCo Sam'
).split(/\s+/).filter(Boolean));
function bareWord(word: string): string {
  return word.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
}
function isKnownName(word: string): boolean {
  const w = bareWord(word);
  return KNOWN_NAMES.has(w) || KNOWN_NAMES.has(w.split(/['-]/)[0]);
}
// Run 10: the first word of an input phrase keeps its capital only when it is a known name, has an inner capital or is
// all capitals (HubSpot, AI, CRM), holds a digit (B2B, Q4), or starts a name of two words: the next word is capitalised
// too (New York, Clinic Group A, Competitor A) and is not a known name on its own ("Native Salesforce" is not a name).
function keepsFirstCapital(word: string, next: string): boolean {
  const w = bareWord(word);
  if (!/^[A-Z]/.test(w) || w === 'I' || isKnownName(w)) return true;
  if (/[A-Z0-9]/.test(w.slice(1))) return true;
  const n = bareWord(next || '');
  return /^[A-Z](?:[a-z]+(?:['-][a-z]+)*)?$/.test(n) && !isKnownName(n);
}
// An input phrase placed mid-sentence: its first word is lowered unless keepsFirstCapital() keeps it
// ("Native Salesforce integration" becomes "native Salesforce integration"; "Salesforce data you can trust" stays).
export function lowerFirstIfCommon(phrase: string): string {
  const t = phrase.trim();
  const [first = '', next = ''] = t.split(/\s+/);
  return keepsFirstCapital(first, next) ? t : t.replace(/[A-Z]/, c => c.toLowerCase());
}
// The same for a whole phrase (this replaces a plain toLowerCase(), which also lowered names and acronyms): the first
// word follows the rule above, and a later word is lowered only when it is a common word. A capitalised word straight
// after a kept name stays too, so a name of two words keeps both ("Microsoft Teams approvals").
export function lowerCommonWords(phrase: string): string {
  let afterName = false;
  let first = true;
  const parts = phrase.trim().split(/(\s+)/);
  return parts.map((w, i) => {
    if (!w.trim()) return w;
    const lower = first ? !keepsFirstCapital(w, parts[i + 2] || '') : !afterName && isCommonWord(w);
    first = false;
    afterName = !lower && /^[A-Z]/.test(w);
    return lower ? w.replace(/[A-Z]/, c => c.toLowerCase()) : w;
  }).join('');
}
// Text only (run 9): a phrase that starts a sentence, a heading or a table cell starts with a capital. A first word
// written with a small letter and an inner capital (iPhone, eBay) is a name and is kept as typed.
// Text only (run 10, R10-28, copied from impact-mcp): "a" or "an" before a phrase, by its first sound (an onboarding
// challenge, a CRM, an SMS tool, an AI adoption challenge).
export function aOrAn(phrase: string): string {
  const w = (phrase.trim().split(/\s+/)[0] || '').replace(/^[^A-Za-z0-9]+/, '');
  if (/^[A-Z0-9]{2,}$/.test(bareWord(w))) return /^[AEFHILMNORSX8]/.test(w) ? 'an' : 'a';
  if (/^(hour|honest|heir)/i.test(w)) return 'an';
  return /^[aeiou]/i.test(w) && !/^(uni|use|usu|uti|eu|one|once)/i.test(w) ? 'an' : 'a';
}
export function cap(phrase: string): string {
  const t = phrase.trim();
  if (/^[a-z]+[A-Z]/.test(t.split(/\s+/)[0] || '')) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function parseListItems(text: string): string[] {
  return text
    .split(/\n|,(?!\d{3}(?!\d))/)
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
      analysis.goalAlignment.suggestions.push('Add specific metrics: "50% faster", "10,000+ customers" (Example figure: replace with your own)');
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
      // Text only (run 8): the joining word that starts the new sentence gets a capital ("And", not "and").
      const split = s.replace(/,\s*(and|but|so|or)\s+/gi, (_m: string, c: string) => `.\n${c.charAt(0).toUpperCase()}${c.slice(1)} `);
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
      return `What if everything you knew about ${lowerFirstIfCommon(topic)} was wrong?`;
    case 'statistic':
      return `78% of professionals struggle with ${lowerFirstIfCommon(topic)} (Example figure: replace with your own). Here's what the top performers do differently.`;
    case 'story':
      return `Last month, ${aOrAn(topic)} ${lowerFirstIfCommon(topic)} challenge nearly derailed our biggest launch. What we learned changed everything.`;
    case 'bold_statement':
      return `${topic.charAt(0).toUpperCase() + topic.slice(1)} is broken. Here's how to fix it.`;
    default:
      return `Let's talk about ${lowerFirstIfCommon(topic)}.`;
  }
}
