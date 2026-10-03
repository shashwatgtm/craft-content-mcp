// Utility functions for content analysis and generation
import { pickKeyPoints, sentencesOf, LIST_COMMA } from './sector.ts';

// Last line of any output that suggests timings, lengths or counts (lengths in words, time boxes, cadences).
export const SUGGESTION_FOOTER = 'Suggested timings, lengths and counts: adjust them to your own.';

// Text only (run 9): common words that may open an input phrase. Mid-sentence, only these are lowered
// ("Fewer missed handoffs" becomes "fewer missed handoffs"). Any other capitalised word is kept as typed, because it may be a
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
  'control access approvals approval handoffs handoff meetings meeting bookings ' +
  'booking reminders reminder cancellations staff employees employee managers manager ' +
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
// word counts by its first part ("Two-way", "No-code").
function isCommonWord(word: string): boolean {
  const head = word.split('-')[0].replace(/[^A-Za-z']+$/, '');
  if (!/^[A-Z][a-z']*$/.test(head) || head === 'I' || /[A-Z]/.test(word.slice(1))) return false;
  const w = head.toLowerCase();
  return COMMON_WORDS.has(w) || (w.length > 4 && /(?:ing|ed)$/.test(w));
}
// Run 12 (R12-20): the longest words of a sentence that are not joining words (letters only, 5 to 30 letters), in
// order of length, for hashtags ("Most onboarding fails ... first success moment" gives onboarding, customers, success).
const HASHTAG_SKIP = new Set(('about above after again against among around because before being below between both ' +
  'could during either every first their there these those through under until where which while would should never ' +
  'always other another reach still really thing things something everything nothing within without whether across').split(' '));
export function topicWords(text: string, n: number): string[] {
  const seen = new Set<string>();
  const words = text.split(/\s+/).map((w) => w.replace(/[^A-Za-z]/g, '')).filter((w) => {
    const l = w.toLowerCase();
    if (w.length < 5 || w.length > 30 || HASHTAG_SKIP.has(l) || seen.has(l)) return false;
    seen.add(l);
    return true;
  });
  return words.map((w, i) => ({ w: w.toLowerCase(), i })).sort((a, b) => b.w.length - a.w.length || a.i - b.i).slice(0, n).map((x) => x.w);
}

// Text only (run 10): names that keep their capital when they open an input phrase placed mid-sentence. The list holds
// common product and company names and the names found in the test inputs; other names are kept by the rules below.
const KNOWN_NAMES = new Set((
  'Salesforce Microsoft Slack HubSpot LinkedIn Google Gmail Outlook Excel Zoom Zendesk Jira Notion Shopify Stripe ' +
  'Marketo Pardot Gong Intercom Freshworks Oracle SAP Workday ServiceNow Snowflake Tableau Asana Trello Dropbox ' +
  'Apple Amazon AWS Azure Facebook Instagram WhatsApp YouTube Sam ' +
  // Run 11: the company and competitor names in the test inputs and the page examples. Run 19: the dummy names are gone.
  'Bengaluru Clari Northwind Metricly'
).split(/\s+/).filter(Boolean));
function bareWord(word: string): string {
  return word.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
}
function isKnownName(word: string): boolean {
  const w = bareWord(word);
  return KNOWN_NAMES.has(w) || KNOWN_NAMES.has(w.split(/['-]/)[0]);
}
// Run 11: a known name typed in lower case gets its capitals back ("bengaluru teams" becomes "Bengaluru teams"). Names
// that are also ordinary words (Slack, Zoom, Notion, Gong, Sam ...) are kept when typed with a capital, never raised.
const PLAIN_WORDS = new Set('slack zoom notion excel oracle stripe apple amazon gong sam outlook workday snowflake asana tableau intercom sap azure'.split(' '));
const NAME_BY_LOWER = new Map([...KNOWN_NAMES].filter(n => !PLAIN_WORDS.has(n.toLowerCase())).map(n => [n.toLowerCase(), n] as [string, string]));
function fixNames(phrase: string): string {
  return phrase.replace(/[A-Za-z]+/g, w => (w === w.toLowerCase() && NAME_BY_LOWER.get(w)) || w);
}
// Run 11: a job title in running text is all lower case ("head of marketing", "operations director"); names and
// acronyms in it keep their capitals ("VP of sales", "director of Salesforce operations").
const JOB_WORD = /^(?:head|directors?|managers?|chief|officers?|president|coordinators?|supervisors?|specialists?|administrators?)$/i;
function isJobTitle(phrase: string): boolean {
  const w = phrase.trim().split(/\s+/).map(bareWord);
  return w.length <= 6 && w.some((x, i) => JOB_WORD.test(x) && (x.toLowerCase() !== 'head' || (w[i + 1] || '').toLowerCase() === 'of'));
}
function lowerJobTitle(phrase: string): string {
  return phrase.trim().split(/(\s+)/).map(w => (/^[A-Z][a-z'-]+\W*$/.test(w) && !isKnownName(w) ? w.charAt(0).toLowerCase() + w.slice(1) : w)).join('');
}
// Run 10: the first word of an input phrase keeps its capital only when it is a known name, has an inner capital or is
// all capitals (HubSpot, AI, CRM), holds a digit (B2B, Q4), or starts a name of two words: the next word is capitalised
// too (New York, Group A, Competitor A) and is not a known name on its own ("Native Salesforce" is not a name).
// Run 11: a one-letter word keeps its capital (I, X), and a common first word never makes the next word a name ("For
// Northwind contract review" becomes "for Northwind contract review"), unless the next word is a one-letter label after
// a noun (Competitor A) or the phrase opens with three capitalised words (Example Logistics Group).
function keepsFirstCapital(word: string, next: string, third = ''): boolean {
  const w = bareWord(word);
  if (!/^[A-Z]/.test(w) || (w.length === 1 && !(w === 'A' && next)) || isKnownName(w)) return true; // the article A is not a one-letter name
  if (/[A-Z0-9]/.test(w.slice(1))) return true;
  const n = bareWord(next || '');
  if (!/^[A-Z](?:[a-z]+(?:['-][a-z]+)*)?$/.test(n) || isKnownName(n)) return false;
  if (!isCommonWord(w) || w === 'New') return true; // New York, New Delhi
  if (n.length === 1) return !/^(?:for|with|from|to|of|in|on|at|by|and|or|the|a|an|into|about|why|how|what|when|where|who|your|our|their|my|this|that)$/i.test(w);
  return /^[A-Z][a-z]/.test(bareWord(third || ''));
}
// An input phrase placed mid-sentence: its first word is lowered unless keepsFirstCapital() keeps it
// ("Native Salesforce integration" becomes "native Salesforce integration"; "Salesforce data you can trust" stays).
export function lowerFirstIfCommon(phrase: string): string {
  const t = fixNames(phrase.trim());
  if (isJobTitle(t)) return lowerJobTitle(t);
  const parts = t.split(/(\s+)/);
  if (keepsFirstCapital(parts[0] || '', parts[2] || '', parts[4] || '')) return t;
  parts[0] = parts[0].replace(/[A-Z]/, c => c.toLowerCase());
  // Run 11: after a lowered first word, a capitalised common second word is lowered too ("why forecasting matters now").
  if (parts[2] && isCommonWord(parts[2])) parts[2] = parts[2].charAt(0).toLowerCase() + parts[2].slice(1);
  return parts.join('');
}
// The same for a whole phrase (this replaces a plain toLowerCase(), which also lowered names and acronyms): the first
// word follows the rule above, and a later word is lowered only when it is a common word. A capitalised word straight
// after a kept name stays too, so a name of two words keeps both ("Microsoft Teams approvals").
export function lowerCommonWords(phrase: string): string {
  let afterName = false;
  let first = true;
  const t = fixNames(phrase.trim());
  if (isJobTitle(t)) return lowerJobTitle(t);
  const parts = t.split(/(\s+)/);
  return parts.map((w, i) => {
    if (!w.trim()) return w;
    const lower = first ? !keepsFirstCapital(w, parts[i + 2] || '', parts[i + 4] || '') : !afterName && isCommonWord(w);
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
  const t = fixNames(phrase.trim());
  if (/^[a-z]+[A-Z]/.test(t.split(/\s+/)[0] || '')) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Run 11 addendum 1 (R11-A1-1): a phrase inside a headline written in title case ("Why Everything You Know About [Topic]
// Is Wrong"): each word starts with a capital, except short joining words after the first; names, acronyms and words with
// an inner capital stay as typed ("head of Marketing" becomes "Head of Marketing").
const TITLE_SMALL = /^(a|an|the|and|or|but|nor|of|for|to|in|on|at|by|with|from|as|vs\.?)$/i;
export function titleWords(phrase: string): string {
  return fixNames(phrase.trim()).split(/(\s+)/).map((w, i) => {
    if (!w.trim() || /[A-Z0-9]/.test(w.slice(1)) || /^[^A-Za-z]/.test(w)) return w;
    if (i > 0 && TITLE_SMALL.test(w)) return w.toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join('');
}
export function parseListItems(text: string): string[] {
  return text
    .split(/\n/).flatMap((l) => l.split(LIST_COMMA))
    .map(item => item.replace(/^[-•*]\s*/, '').trim())
    .filter(item => item.length > 0);
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

export function countSentences(text: string): number {
  return sentencesOf(text.replace(/\s*\n+\s*/g, ' ')).length;
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

// ----------------------------------------------------------------------------------------------------------------------------
// Run 19 R19-35 (owner decision D80, problem 5): honest scores. Every point taken off comes from a counted, listed finding that
// quotes the text; a text with no finding scores 10; the rating cannot be EXCELLENT while a hard finding (buzzword, unsupported
// superlative, fragment, unfilled merge field, claim about the reader) is open; the overall score is the average of the four
// scores and the lowest one, so one weak area cannot hide behind three strong ones. The checks do not judge whether a claim is true.
// ----------------------------------------------------------------------------------------------------------------------------
export interface Finding {
  dimension: 'clarity' | 'structure' | 'engagement' | 'goalAlignment';
  rule: string;
  penalty: number;
  text: string;
  suggestion: string;
  hard: boolean;
}
export interface ContentAnalysis {
  clarity: { score: number; issues: string[]; suggestions: string[] };
  structure: { score: number; issues: string[]; suggestions: string[] };
  engagement: { score: number; issues: string[]; suggestions: string[] };
  goalAlignment: { score: number; issues: string[]; suggestions: string[] };
  overall: { score: number; rating: string };
  findings: Finding[];
}

// Buzzwords (whole words and their forms): each distinct one found takes 1 clarity point, at most 4.
export const BUZZ = /\b(?:leverag(?:e|es|ed|ing)|utili[sz](?:e|es|ed|ing)|synerg(?:y|ies)|paradigms?|optimi[sz](?:e|es|ed|ing)|facilitat(?:e|es|ed|ing)|methodolog(?:y|ies)|empower(?:s|ed|ing)?|streamlin(?:e|es|ed|ing)|unlock(?:s|ed|ing)?|delight(?:s|ed|ing)?|cutting-edge|innovative|seamless(?:ly)?|robust|holistic|state-of-the-art|game-chang(?:ing|er)|revolutionary|next-generation|best-of-breed|turnkey|mission-critical)\b/gi;
// Superlatives and promises that need proof: each distinct one takes 1 engagement point, at most 3.
export const SUPERLATIVE = /\b(?:best[- ]in[- ]class|world[- ]class|industry[- ]leading|market[- ]leading|category[- ]leading|number one|unrivall?ed|unmatched|unparalleled|guaranteed|proven track record|the only)\b|(?:^|\s)#1\b/gi;
// A claim about the reader that the writer may not be able to support (sales emails and emails): 2 engagement points.
const READER_CLAIM = /\bI (?:noticed|saw|read|came across|heard|see)\b[^.!?\n]*\b(?:your|you|you're)\b[^.!?\n]*/i;
// An unfilled merge field or placeholder: 2 structure points.
const MERGE_FIELD = /\{\{?[^{}\n]{1,40}\}\}?|\[(?!x\])[A-Za-z][^\]\n]{0,40}\](?!\()/g;
// An ask (a call to action) in the text.
export const ASK = /\b(?:sign up|sign-up|register|download|learn more|get started|contact (?:us|me)|subscribe|try|book|schedule|click|reply|call (?:us|me)|talk to|speak (?:to|with)|get in touch|join|request|start (?:your|a)|apply|buy|order|see (?:it|how|if)|would you (?:like|be open|be willing|be interested)|are you open|open to|could we|can we|shall we|let's|do you have (?:\d+ |a few )?minutes|worth a)\b/i;
// A goal that needs an ask in the text.
const NEEDS_ASK = /\b(?:convert|sign ?-?up|leads?|book(?:ed|ing)?|meetings?|demos?|calls?|trial|register|registrations?|download|subscribe|buy|purchas\w*|inquir\w*|enquir\w*|reply|replies|respon\w*|apply|clicks?)\b/i;
const VERBISH = /^(?:is|are|was|were|be|been|being|has|have|had|do|does|did|will|can|could|would|should|may|might|must|get|gets|got|make|makes|made|help|helps|cut|cuts|fell|rose|grew|grow|grows|save|saves|resolve|resolves|run|runs|ran|go|goes|went|take|takes|took|see|sees|saw|need|needs|want|wants|rises|falls|drops|dropped|beat|beats|won|win|wins)$/i;
const TRANSITIONS = ['however', 'therefore', 'additionally', 'furthermore', 'consequently', 'moreover', 'first', 'second', 'finally'];
const AUDIENCE_STOP = new Set(['general', 'audience', 'people', 'companies', 'company', 'business', 'businesses', 'teams', 'team', 'customers', 'their', 'which', 'those', 'these', 'large', 'small', 'medium', 'mid-size', 'midsize', 'with', 'from', 'that']);

function distinct(text: string, re: RegExp): string[] {
  const seen = new Map<string, string>();
  for (const m of text.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) || []) {
    const k = m.trim().toLowerCase();
    if (!seen.has(k)) seen.set(k, m.trim());
  }
  return [...seen.values()];
}
function sentenceWith(content: string, needle: string): string {
  const s = sentencesOf(content).find((x) => x.toLowerCase().includes(needle.toLowerCase()));
  return clipEcho((s || needle).trim(), 160);
}
// The body of an email or a post without its Subject line and greeting, for the opening-sentence check.
export function bodyOf(content: string): string {
  return content.split(/\n/).filter((l) => !/^\s*(?:subject:|(?:hi|hello|dear|hey)\b[^.!?]*,\s*$)/i.test(l)).join('\n').trim() || content;
}

export function analyzeContent(content: string, contentType: string, goal: string, opts: { audience?: string } = {}): ContentAnalysis {
  const analysis: ContentAnalysis = {
    clarity: { score: 0, issues: [], suggestions: [] },
    structure: { score: 0, issues: [], suggestions: [] },
    engagement: { score: 0, issues: [], suggestions: [] },
    goalAlignment: { score: 0, issues: [], suggestions: [] },
    overall: { score: 0, rating: '' },
    findings: []
  };
  const note = (dimension: Finding['dimension'], rule: string, penalty: number, text: string, suggestion: string, hard = false) => {
    analysis.findings.push({ dimension, rule, penalty, text, suggestion, hard });
    analysis[dimension].issues.push(text);
    if (suggestion && !analysis[dimension].suggestions.includes(suggestion)) analysis[dimension].suggestions.push(suggestion);
    scores[dimension] -= penalty;
  };
  const scores = { clarity: 10, structure: 10, engagement: 10, goalAlignment: 10 };

  const words = countWords(content);
  const sentences = countSentences(content);
  const avgWords = avgWordsPerSentence(content);
  const sentenceList = sentencesOf(content);
  const emailLike = contentType === 'sales_email' || contentType === 'email';

  // CLARITY: sentence length, passive voice, buzzwords, fragments
  const longest = sentenceList.reduce((a, b) => (countWords(b) > countWords(a) ? b : a), '');
  const longestNote = countWords(longest) >= 40 ? `; the longest runs ${countWords(longest)} words: "${clipEcho(longest.replace(/\s+/g, ' ').trim(), 150)}"` : '';
  if (avgWords > 25) {
    note('clarity', 'sentence-length', 3, `Sentences too long (avg ${avgWords} words)${longestNote}`, 'Break sentences at natural pauses. Target 15 to 20 words per sentence. Where a sentence is a list of products or proof, keep the one or two items that matter to this reader and move the rest to a link.');
  } else if (avgWords > 20) {
    note('clarity', 'sentence-length', 1, `Sentences slightly long (avg ${avgWords} words)${longestNote}`, 'Consider shortening some sentences for easier scanning.');
  }
  const passiveMatches = content.match(/\b(was|were|been|being|is|are|am)\s+\w+ed\b/gi) || [];
  if (passiveMatches.length > sentences * 0.3) {
    note('clarity', 'passive', 2, `High passive voice usage (${passiveMatches.length} instances)`, 'Convert to active voice: "X did Y" instead of "Y was done by X"');
  }
  const buzz = distinct(content, BUZZ);
  if (buzz.length > 0) {
    const shown = buzz.slice(0, 4).map((b) => `"${b}" in "${sentenceWith(content, b)}"`).join('; ');
    note('clarity', 'buzzwords', Math.min(4, buzz.length), `Buzzwords (${buzz.length}): ${shown}${buzz.length > 4 ? `; and ${buzz.length - 4} more: ${buzz.slice(4).join(', ')}` : ''}`, 'Say what the product does in plain words: "use" instead of "leverage" or "utilize", "help" instead of "empower", "improve" instead of "optimize".', true);
  }
  const fragments = sentenceList.filter((s) => /^[\d$₹€£]/.test(s) && s.split(/\s+/).length >= 3 && !s.split(/\s+/).some((w) => VERBISH.test(w.replace(/[^A-Za-z]/g, '')) || (w.length > 4 && /(?:ed|ing)$/i.test(w.replace(/[^A-Za-z]/g, '')))));
  if (fragments.length > 0) {
    note('clarity', 'fragment', Math.min(4, 2 * fragments.length), `Sentence fragment (a figure with no verb): "${clipEcho(fragments[0], 160)}"${fragments.length > 1 ? ` and ${fragments.length - 1} more` : ''}`, 'Turn each figure into a sentence that says who got it and what changed, for example "At <customer>, <result>."', true);
  }

  // Run 20 (round 1b), wrong results found by the judges, each a listed finding that quotes the text: a very hard to read text was
  // ticked as clear, a sentence of 40 words or more was not named, a subject line that is a paragraph was not named, and a long cold
  // email was not named. Before and after scores are in the round 1b report.
  const flesch = calculateReadability(content).score;
  if (words >= 40 && flesch < 40) {
    // listed, but it takes no points: the sentence-length finding already counts the same weakness
    note('clarity', 'readability', 0, `Hard to read: Flesch ${flesch}/100 (${flesch < 30 ? 'very difficult' : 'difficult'})`, 'Use the plain word where one exists, and keep sentences to 15 to 20 words.');
  }
  const veryLong = sentenceList.filter((s) => countWords(s) >= 40);
  if (veryLong.length > 0 && avgWords <= 20) {
    note('clarity', 'run-on', 1, `${veryLong.length === 1 ? 'A sentence runs' : `${veryLong.length} sentences run`} to 40 words or more (${veryLong.map((s) => countWords(s)).join(', ')} words): "${clipEcho(veryLong[0].replace(/\s+/g, ' ').trim(), 150)}"`, 'Keep the one or two items in the list that matter to this reader and move the rest to a link or an attachment.');
  }
  const subjectLine = content.split('\n').map((l) => l.trim()).find((l) => /^subject:/i.test(l));
  if (emailLike && subjectLine) {
    const subject = subjectLine.replace(/^subject:\s*/i, '');
    if (countWords(subject) > 12 || subject.length > 70) {
      note('engagement', 'subject-length', 1, `The subject line is ${countWords(subject)} words (${subject.length} characters), long enough to be cut off in an inbox: "${clipEcho(subject, 120)}"`, 'Cut the subject line to about 6 to 9 words that name the one thing the reader gets.');
    }
  }
  if (emailLike && words > 150) {
    note('structure', 'email-length', words > 200 ? 2 : 1, `The email is ${words} words; a cold email is read in about a minute`, 'Cut it to about 100 to 150 words: one problem, one proof point, one ask.');
  }

  // STRUCTURE: headers, paragraph length, transitions, unfilled merge fields
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const hasHeaders = /^#{1,3}\s|^\*\*[^*]+\*\*$|^[A-Z][^a-z]+$/m.test(content);
  // Headers suit a long document; a cold email or a social post has none, so it is not told to add them (run 20, round 1b).
  if (!hasHeaders && words > 200 && !emailLike && contentType !== 'social_post') {
    note('structure', 'headers', 3, 'No clear section headers', 'Add headers to break up content and aid scanning');
  }
  const longParagraphs = paragraphs.filter((p) => countWords(p) > 100);
  if (longParagraphs.length > 0) {
    note('structure', 'long-paragraph', 2, `${longParagraphs.length} paragraph${longParagraphs.length === 1 ? '' : 's'} over 100 words`, 'Break long paragraphs at topic shifts. Aim for 50 to 75 words per paragraph.');
  }
  // Run 19: whole words only ("secondary" is not "second"; B16-10).
  const lowerContent = content.toLowerCase();
  const foundTransitions = TRANSITIONS.filter((t) => new RegExp('\\b' + t + '\\b').test(lowerContent));
  if (foundTransitions.length < 2 && paragraphs.length > 3) {
    note('structure', 'transitions', 2, 'Few transition words: may feel disjointed', 'Add transitions: "However...", "As a result...", "First... Second..."');
  }
  const merge = distinct(content, MERGE_FIELD);
  if (merge.length > 0) {
    note('structure', 'merge-field', 2, `Unfilled merge field or placeholder: ${merge.slice(0, 4).join(', ')}`, 'Fill every merge field and placeholder before sending, or check that your email tool fills it.', true);
  }

  const recog = distinct(content, /\b(?:Best [A-Za-z&\- ]{3,40}(?:platform|solution|tool)|Leader in [A-Za-z&\- ]{3,50}|Named a [A-Za-z ]{3,30}|Gartner[A-Za-z ]{0,30}|Forrester[A-Za-z ]{0,30}|award(?:ed)? [A-Za-z ]{3,30})/g);
  if (recog.length > 0 && !/\((?:[^()]*(?:report|source|analyst)[^()]*)\)/i.test(content)) {
    note('engagement', 'recognition-claim', 1, `A ranking or award is stated without a source a reader can check: "${clipEcho(recog[0], 100)}"${recog.length > 1 ? ` and ${recog.length - 1} more` : ''}`, 'Name the report and the year, or take the line out.', true);
  }

  // ENGAGEMENT: question, "you" language, a figure, superlatives, claims about the reader, the opening sentence
  const questionCount = (content.match(/\?/g) || []).length;
  if (questionCount === 0 && contentType !== 'press_release') {
    note('engagement', 'question', 2, 'No questions to engage reader', 'Add a rhetorical question to draw readers in');
  }
  const youCount = (content.match(/\byou\b|\byour\b/gi) || []).length;
  if (youCount < 3 && contentType !== 'press_release') {
    note('engagement', 'you-language', 2, 'Limited "you" language: feels impersonal', 'Reframe benefits in terms of "you": "You\'ll save time" vs "It saves time"');
  }
  if (words >= 20 && !/\d/.test(content)) {
    note('engagement', 'no-figure', 2, 'No specific figure in the text', 'Add one result you can prove, with its number and timeframe, or a named example.');
  }
  const supers = distinct(content, SUPERLATIVE);
  if (supers.length > 0) {
    note('engagement', 'superlative', Math.min(3, supers.length), `Claims that need proof (${supers.length}): ${supers.slice(0, 4).map((s) => `"${s}" in "${sentenceWith(content, s)}"`).join('; ')}`, 'Remove the claim or back it with a result you can show.', true);
  }
  if (emailLike) {
    const claim = content.match(READER_CLAIM);
    if (claim) {
      note('engagement', 'reader-claim', 2, `Claim about the reader that you may not be able to support: "${clipEcho(claim[0].trim(), 160)}"`, 'Only say what you saw if you can name the source (their post, their job ad, their site); otherwise open with the problem.', true);
    }
  }
  const body = bodyOf(content);
  const firstSentence = (sentencesOf(body)[0] || '').replace(/[.!?]+$/, '');
  if (countWords(firstSentence) > 20) {
    note('engagement', 'hook', 2, `Opening sentence too long (${countWords(firstSentence)} words): may lose readers`, 'Start with a hook of 15 words or fewer');
  }

  // GOAL ALIGNMENT: an ask where the goal needs one, evidence for trust goals, and whether the text speaks to the audience
  const goalLower = goal.toLowerCase();
  const hasCTA = ASK.test(content);
  if (NEEDS_ASK.test(goalLower) && !hasCTA) {
    note('goalAlignment', 'ask', 4, 'The goal needs the reader to do something, but no ask was found', 'Add one clear ask: what the reader should do next, and how.');
  }
  if ((goalLower.includes('educate') || goalLower.includes('inform')) && words < 300) {
    note('goalAlignment', 'educate-length', 2, 'Educational content may be too brief', 'Expand with examples, data, or how-to steps');
  }
  if (goalLower.includes('awareness') || goalLower.includes('brand')) {
    const brandMentions = (content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || []).length;
    if (brandMentions < 2) {
      note('goalAlignment', 'brand', 2, 'Brand/product mentions may be insufficient for awareness', 'Ensure brand is mentioned prominently');
    }
  }
  if (goalLower.includes('trust') || goalLower.includes('credibility')) {
    if (!/\d+%|\$\d+|\d+x|\d+\s*(customer|client|user)/i.test(content)) {
      note('goalAlignment', 'trust-evidence', 3, 'No data or proof points for credibility', 'Add figures you can prove: a result, a count of customers, a time saved.');
    }
  }
  if (opts.audience && opts.audience.trim()) {
    const terms = [...new Set((opts.audience.toLowerCase().match(/[a-z][a-z-]{4,}/g) || []).filter((w) => !AUDIENCE_STOP.has(w)))];
    if (terms.length > 0 && !terms.some((t) => new RegExp('\\b' + t.replace(/[-]/g, '[- ]'), 'i').test(content))) {
      note('goalAlignment', 'audience', 1, `The text never mentions your audience (${opts.audience.trim()}): none of ${terms.slice(0, 4).join(', ')} appears`, 'Name who this is for, or use their own words for the problem.');
    }
  }

  for (const d of ['clarity', 'structure', 'engagement', 'goalAlignment'] as const) analysis[d].score = Math.max(0, scores[d]);
  const all = [analysis.clarity.score, analysis.structure.score, analysis.engagement.score, analysis.goalAlignment.score];
  const average = all.reduce((a, b) => a + b, 0) / 4;
  analysis.overall.score = Math.round(((average + Math.min(...all)) / 2) * 10) / 10;
  if (analysis.overall.score >= 8) analysis.overall.rating = 'EXCELLENT';
  else if (analysis.overall.score >= 6) analysis.overall.rating = 'GOOD';
  else if (analysis.overall.score >= 4) analysis.overall.rating = 'NEEDS WORK';
  else analysis.overall.rating = 'MAJOR REVISION NEEDED';
  if (analysis.overall.rating === 'EXCELLENT' && analysis.findings.some((f) => f.hard)) analysis.overall.rating = 'GOOD';
  return analysis;
}

// Your text with each flagged sentence marked, so every finding can be found in the text. Shows at most the first 4,000 characters.
export function annotateText(content: string): string {
  const shown = content.length > 4000 ? content.slice(0, 4000) : content;
  const lines = shown.split('\n').map((line) => {
    if (!line.trim()) return '';
    return sentencesOf(line).map((s) => {
      const flags: string[] = [];
      if (new RegExp(BUZZ.source, 'i').test(s)) flags.push('buzzword');
      if (new RegExp(SUPERLATIVE.source, 'i').test(s)) flags.push('claim needs proof');
      if (/^[\d$\u20b9\u20ac\u00a3]/.test(s) && s.split(/\s+/).length >= 3 && !s.split(/\s+/).some((w) => VERBISH.test(w.replace(/[^A-Za-z]/g, '')) || (w.length > 4 && /(?:ed|ing)$/i.test(w.replace(/[^A-Za-z]/g, ''))))) flags.push('fragment');
      if (new RegExp(MERGE_FIELD.source).test(s)) flags.push('unfilled merge field');
      if (READER_CLAIM.test(s)) flags.push('claim about the reader');
      if (countWords(s) > 30) flags.push(`long sentence, ${countWords(s)} words`);
      return flags.length ? `${s} **[${flags.join('; ')}]**` : s;
    }).join(' ');
  });
  return lines.map((l) => (l ? `> ${l}` : '>')).join('\n') + (content.length > 4000 ? '\n\n*(Only the first 4,000 characters are shown.)*' : '');
}

// Tone: only the two tones that can be checked in the text are checked; any other is named as not used.
export function toneCheck(content: string, tone: string | undefined): { notes: string[]; used: boolean } {
  if (!tone || tone === 'keep_same') return { notes: [], used: false };
  if (tone === 'more_formal') {
    const c = distinct(content, /\b\w+n't\b|\b(?:we|you|they|I|who|that|there|here|it|let|what)'(?:re|ve|ll|d|m|s)\b/gi);
    return { used: true, notes: [c.length ? `Contractions found, which read as informal: ${c.slice(0, 6).join(', ')}. Write them out in full for a more formal tone.` : 'No contractions found: nothing to change for a more formal tone.'] };
  }
  if (tone === 'more_casual') {
    const f = distinct(content, /\b(?:furthermore|moreover|hereby|therefore|consequently|pursuant|kindly|thus)\b/gi);
    return { used: true, notes: [f.length ? `Formal joining words found: ${f.join(', ')}. Plainer words ("so", "also", "and") read as more casual.` : 'No formal joining words found: nothing to change for a more casual tone.'] };
  }
  return { used: false, notes: [`tone_preference ${tone.replace(/^more_/, 'more_')} was not used: this tool checks tone only for more_formal and more_casual.`] };
}

// ---- the improved version: real edits, each one listed; or none, said plainly ----
const HYPE_ADJ = '(?:cutting-edge|best-in-class|world-class|state-of-the-art|innovative|robust|seamless|holistic|game-changing|revolutionary|industry-leading|market-leading|next-generation)';
const VERB_EDITS: [RegExp, [string, string, string, string]][] = [
  [/\bleverag(e|es|ed|ing)\b/gi, ['use', 'uses', 'used', 'using']],
  [/\butili[sz](e|es|ed|ing)\b/gi, ['use', 'uses', 'used', 'using']],
  [/\bfacilitat(e|es|ed|ing)\b/gi, ['help', 'helps', 'helped', 'helping']],
  [/\boptimi[sz](e|es|ed|ing)\b/gi, ['improve', 'improves', 'improved', 'improving']],
  [/\bempower(s|ed|ing)?\b/gi, ['help', 'helps', 'helped', 'helping']],
  [/\bstreamlin(e|es|ed|ing)\b/gi, ['simplify', 'simplifies', 'simplified', 'simplifying']],
  [/\bunlock(s|ed|ing)?\b/gi, ['get', 'gets', 'got', 'getting']],
];
const NOUN_EDITS: [RegExp, string, string][] = [
  [/\bmethodolog(y|ies)\b/gi, 'method', 'methods'],
  [/\bsynerg(y|ies)\b/gi, 'collaboration', 'collaboration'],
  [/\bparadigms?\b/gi, 'approach', 'approaches'],
];
const ALT: Record<string, [string, string, string, string]> = { simplify: ['ease', 'eases', 'eased', 'easing'], improve: ['raise', 'raises', 'raised', 'raising'], use: ['apply', 'applies', 'applied', 'applying'] };
function keepCase(from: string, to: string): string {
  return from[0] === from[0].toUpperCase() && from[0] !== from[0].toLowerCase() ? to.charAt(0).toUpperCase() + to.slice(1) : to;
}
export function editSentence(s: string): string {
  let t = s;
  t = t.replace(new RegExp(`(^|[.!?]\\s+)${HYPE_ADJ}\\s+(\\w)`, 'gi'), (_m, pre: string, ch: string) => pre + ch.toUpperCase());
  t = t.replace(new RegExp(`\\b${HYPE_ADJ}\\s+`, 'gi'), '');
  for (const [re, forms] of VERB_EDITS) {
    let used = 0;
    t = t.replace(re, (m: string, suffix: string | undefined) => {
      // a plain word is never used twice in one sentence for two different buzzwords: the second one gets the alternative verb
      let f = suffix === 'ing' ? forms[3] : suffix === 'ed' ? forms[2] : suffix === 's' || suffix === 'es' ? forms[1] : forms[0];
      if (new RegExp('\\b' + f + '\\b', 'i').test(t.replace(m, '')) && ALT[forms[0]]) { const alt = ALT[forms[0]]; f = suffix === 'ing' ? alt[3] : suffix === 'ed' ? alt[2] : suffix === 's' || suffix === 'es' ? alt[1] : alt[0]; }
      used++;
      return keepCase(m, f);
    });
  }
  for (const [re, one, many] of NOUN_EDITS) t = t.replace(re, (m: string, suffix: string | undefined) => keepCase(m, suffix === 'ies' ? many : one));
  if (countWords(t) > 30) {
    // Run 20 (round 1b): a long sentence is split only at ", but" or ", so" followed by its own subject (a pronoun, "the", "our" ...) with
    // eight or more words on each side, and the joining word is kept. A list ("A, B, C and D") is never split, and a fragment is never made.
    const m = /^(.{40,}?),\s+(but|so)\s+((?:we|you|they|it|this|that|these|those|our|your|their|the|I)\s.{25,})$/i.exec(t);
    if (m && countWords(m[1]) >= 8 && countWords(m[3]) >= 8) t = `${m[1]}.\n${m[2].charAt(0).toUpperCase()}${m[2].slice(1)} ${m[3]}`;
  }
  return t;
}
export function generateImprovedVersion(content: string, _analysis?: ContentAnalysis): { text: string; edits: { before: string; after: string }[] } {
  const edits: { before: string; after: string }[] = [];
  const text = content.split('\n').map((line) => {
    if (!line.trim() || /^\s*subject:/i.test(line)) return line;
    return sentencesOf(line).map((sentence) => {
      const after = /\((?:[^()]*\btitle|customer quote|page claim|case study)[^()]*\)/i.test(sentence) ? sentence : editSentence(sentence);
      if (after !== sentence) edits.push({ before: sentence.trim(), after: after.trim() });
      return after;
    }).join(' ');
  }).join('\n');
  return edits.length === 0 ? { text: content, edits } : { text, edits };
}

// Run 12 (R12-11b, A5-3): output bound. A point, title or quoted sentence taken from a pasted document is
// clipped to 280 characters, ending in "...", so a long document cannot make the answer many times its size.
// Normal inputs have no sentence this long, so their answers do not change.
export const MAX_ECHO = 280;
export function clipEcho(text: string, max: number = MAX_ECHO): string {
  return text.length > max ? text.slice(0, max - 3).trimEnd() + '...' : text;
}


// Key points of a pasted text: whole sentences chosen by the rule in sector.ts (pickKeyPoints), at most five, in the source's order.
export function extractKeyPoints(text: string): string[] {
  return pickKeyPoints(text).map((p) => clipEcho(p));
}

// Hooks for a newsletter. Run 19: the topic is placed only where any topic reads correctly (a phrase, a clause or a question),
// the statistic is a prompt (no invented figure), and the story is a prompt that quotes the topic.
export function generateHook(topic: string, style: 'question' | 'statistic' | 'story' | 'bold_statement'): string {
  const t = lowerFirstIfCommon(topic);
  switch (style) {
    case 'question':
      return `What if everything you knew about ${t} was wrong?`;
    case 'statistic':
      return `[Add one statistic about "${topic}" with its source. Without a source, leave this hook out.]`;
    case 'story':
      return `[Add a short story: a moment when "${topic}" mattered to you or to a customer]`;
    case 'bold_statement':
      return `Here is what most teams get wrong about ${t}, and what to do instead.`;
    default:
      return `Let's talk about ${t}.`;
  }
}
