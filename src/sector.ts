// Run 19 R19-35 (owner decision D80): helpers shared by the eight tools for the problems of the real-world test.
// They read the sector and the business model from what the user typed (src/verticals.ts, the one data file), quote typed
// text instead of pasting it into fixed sentences, split typed lists, and pick whole sentences from a source text.
// Rule B82: nothing here adds a statistic, a benchmark or a named-company fact.

import { detectVertical, detectModel, MODEL_NAME, VERTICALS, type Vertical, type BusinessModel } from './verticals.ts';

export type { Vertical, BusinessModel };

// A list typed by the user: one item per line or per semicolon, or a comma list. A comma fragment that starts with a joining
// word ("not overnight", "which ...") stays with the item before it, so "Routes re-planned in under a minute, not overnight"
// is one item. A comma inside a number ("1,200") never splits.
const JOINER = /^(?:not|but|and|or|so|which|that|because|while|with|without|including|plus|then|yet|rather)\b/i;
export function splitItems(s: unknown): string[] {
  if (typeof s !== 'string') return [];
  const lines = s.split(/\n|;/).map((x) => x.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
  const out: string[] = [];
  for (const line of lines) {
    const parts = line.split(/,(?!\d{3}(?!\d))/).map((x) => x.trim()).filter(Boolean);
    parts.forEach((p, i) => {
      if (i > 0 && JOINER.test(p)) out[out.length - 1] += ', ' + p;
      else out.push(p);
    });
  }
  return out;
}

// Text typed by the user, in quotes, when it is placed inside one of the tool's own sentences.
export function q(s: string): string {
  return `"${s.trim().replace(/^"|"$/g, '').replace(/[.]$/, '')}"`;
}
// The same in single quotes, for a quotation placed inside a line that is already in double quotes (a script to read out).
export function qs(s: string): string {
  return `'${s.trim().replace(/^["']|["']$/g, '').replace(/[.]$/, '')}'`;
}

// The sector and the business model read from the inputs, with one line saying how they were read.
// Run 19: `primary` holds the texts that describe the seller's own domain (the product, the problem, the proof, the topic); `secondary`
// holds the texts that name the buyer or the customer (their industry, their role, the audience). A customer's industry is not the
// seller's sector, so they are used only to confirm a sector that one word in the primary texts already points to. They never choose a
// sector on their own: with no sector word in the primary texts, the answer says the sector is not clear.
export function readContext(explicitModel: unknown, primary: unknown[], secondary: unknown[] = []): { v: Vertical | null; model: BusinessModel | null; how: string; line: string } {
  const joined = primary.filter((x) => typeof x === 'string' && x.trim()).join(' \n ');
  const pointed = joined ? VERTICALS.filter((x) => new RegExp(x.match.source, 'i').test(joined)).map((x) => x.id) : [];
  let v = detectVertical(...primary);
  let texts: unknown[] = primary;
  if (!v) {
    const wide = detectVertical(...primary, ...secondary);
    if (wide && pointed.includes(wide.id)) { v = wide; texts = [...primary, ...secondary]; }
  }
  const m = detectModel(explicitModel, ...texts);
  // The fintech notes in src/verticals.ts cover finance operations (the close, reconciliation, spend). They do not fit an investment
  // business, so for that business they are not shown (a wrong-sector note is worse than none). Reported to the lead.
  const investmentFintech = !!v && v.id === 'fintech' && m.model === 'investment';
  if (investmentFintech) v = null;
  const sector = investmentFintech ? 'read from your inputs as fintech, and the business as investment management. The built-in fintech notes cover finance operations, not investment, so none are shown' : v ? `read from your inputs as ${v.name}` : 'not clear from your inputs (name the industry for sector notes)';
  const model = m.model
    ? `${MODEL_NAME[m.model]} (${m.how === 'input' ? 'from business_model' : m.how === 'sector' ? 'the usual model in this sector, assumed; set business_model to change it' : 'read from your inputs; set business_model to change it'})`
    : 'not clear from your inputs; set business_model (saas, services, connectivity, transactions, marketplace, hardware_software or investment) for advice that fits it';
  return { v, model: m.model, how: m.how, line: `*Sector: ${sector}. Business model: ${model}.*` };
}

// Sector notes: the buying committee, what the sector measures and its usual objections (no figures, rule B82).
export function sectorNotes(v: Vertical | null, what: 'committee' | 'metrics' | 'objections' | 'all' = 'all', model: BusinessModel | null = 'saas'): string {
  if (!v) return '';
  const out = [`### Sector notes: ${v.name}`];
  if (what === 'committee' || what === 'all') out.push(`- **Who usually decides:** ${v.committee}`);
  if (what === 'metrics' || what === 'all') out.push(`- **What this sector measures:** ${v.metrics.join(', ')}.`);
  if (what === 'all') out.push(`- **Terms this sector's buyers use:** ${v.vocabulary.join(', ')}.`);
  if (what === 'objections' || what === 'all') out.push(`- **Objections this sector often raises:** ${v.objections.map((o) => o.objection.toLowerCase()).join('; ')}.`);
  out.push(`- **A proof point that lands:** ${v.proofShape}`);
  return forModel(out, model).join('\n');
}

// The answer pattern for one objection typed by the user: the sector's pattern when it matches, else a pattern by kind.
export function answerFor(text: string, v: Vertical | null): string {
  const t = text.toLowerCase();
  if (v) {
    for (const o of v.objections) {
      const keys = o.objection.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && !['our', 'the', 'and', 'are', 'not', 'too', 'for', 'already', 'have', 'has', 'does', 'this', 'will', 'than', 'with', 'from', 'your', 'ourselves', 'we', 'can', 'use', 'new', 'own'].includes(w));
      if (keys.filter((k) => t.includes(k)).length >= Math.min(2, keys.length)) return o.response;
    }
  }
  return kindAnswer(objectionKind(text));
}

export type ObjectionKind = 'price' | 'existing' | 'adoption' | 'implementation' | 'security' | 'bundle' | 'timing' | 'accuracy' | 'proof' | 'other';
// What kind of objection a typed objection is (whole-word and stem matches on what the user typed).
export function objectionKind(text: string): ObjectionKind {
  const t = text.toLowerCase();
  if (/\bprice|\bpricing|\bcost|\bbudget|expensive|cheaper|discount|margin|\brates?\b/.test(t)) return 'price';
  if (/already have|already has|already does|already use|existing|incumbent|current (?:vendor|tool|system|provider|operator)|in-house|built|free .*app|\bopen[- ]source\b/.test(t)) return 'existing';
  if (/adopt|use a new|will not use|won't use|wont use|resist|change management|training|another app|new app/.test(t)) return 'adoption';
  if (/integrat|migrat|cut-?over|disrupt|\bsetup\b|set-up|implementation|rollout|transition|too long|long to|takes? too|onboarding/.test(t)) return 'implementation';
  if (/security|privacy|compliance|audit|regulat|legal|\brisk\b|data residency/.test(t)) return 'security';
  if (/bundle|one vendor|single vendor|suite/.test(t)) return 'bundle';
  if (/timing|not now|next year|\blater\b|priority|priorities|right time/.test(t)) return 'timing';
  if (/black box|explain|wrong|mistake|accura|hallucinat|\berrors?\b|track record/.test(t)) return 'accuracy';
  if (/\bproof\b|evidence|references?|case stud|unproven|too new/.test(t)) return 'proof';
  return 'other';
}
function kindAnswer(kind: ObjectionKind): string {
  switch (kind) {
    case 'price': return 'Agree the cost of the problem in the buyer\'s own numbers first, then compare the price with it; trade any concession for something of equal value.';
    case 'existing': return 'Ask what the current setup does not do today and what that costs; position alongside it where you can, and replace only where the buyer sees the gap.';
    case 'adoption': return 'Agree a small pilot with the people who will use it, and decide up front how adoption is measured.';
    case 'implementation': return 'Name the systems and people involved, and offer a staged plan with a rollback point for each stage.';
    case 'security': return 'Bring the security and compliance answers before they are asked, and map each requirement to the control that meets it.';
    case 'bundle': return 'Compare the outcome the buyer needs from each option, not the size of the bundle; show what the bundled tool leaves to manual work.';
    case 'timing': return 'Find the event that makes this urgent (a renewal, an audit, a season, a target) and plan back from it.';
    case 'accuracy': return 'Offer evidence the buyer can check: an evaluation on their own data, a person approving the risky steps, and references they can call.';
    case 'proof': return 'Ask which proof would settle it (a reference call, a case study or a pilot) and offer the one you can really provide.';
    default: return 'Ask what lies behind it and what would change their mind, then answer with evidence from a similar customer only if you have it.';
  }
}
// Words in a proof point or value proposition that show it answers a kind of objection.
const KIND_PROOF: Record<ObjectionKind, RegExp> = {
  price: /\$|\bcost|\bsav(?:e|ed|ing|ings)\b|\broi\b|\bpayback|%|\bprice|\bcheaper|\bmargin/i,
  existing: /\balongside|\bintegrat|\bcompar|\bswitch|\breplac|\bmigrat|\bmissed|\bunlike/i,
  adoption: /\badopt|\busage|\bused by|\breps?\b|\bdrivers?\b|\busers?\b|\boffline|\bsimple|\beasy|\bweekly/i,
  implementation: /\blive in|\bgo-live|\bin \w+ (?:days|weeks|months)|\bdays\b|\bweeks\b|\bsetup|\bset-up|\bonboard|\bmigrat|\bcut-?over|\bwave|\brollout|\bminutes\b|\bintegrat/i,
  security: /\bsoc\b|\biso\b|\bencrypt|\baudit|\bcertif|\bcompliance|\bresidency|\baccess control|\bprivacy|\bsecur/i,
  bundle: /\bone system|\bsingle|\bunified|\ball in one|\bintegrat|\bbundle/i,
  timing: /\bin \w+ (?:days|weeks|months)|\bquarter|\bfast|\bquick|\bwithin|\blive in|\bdays\b|\bweeks\b/i,
  accuracy: /\bapprov|\breview|\baudit|\bevaluat|\baccura|\bcheck|\btrail|\bhuman[- ]in|\bguardrail|\bverif/i,
  proof: /\bcustomers?\b|\bat [A-Z]|%|\d/i,
  other: /./,
};
// The proof point (or value proposition) that best answers an objection of this kind, or undefined when none of them does.
// The first of several equal matches wins; a proof point already used for another objection is skipped when another fits.
export function proofFor(kind: ObjectionKind, proofs: string[], used: Set<string> = new Set()): string | undefined {
  const fits = proofs.filter((p) => KIND_PROOF[kind].test(p) && kind !== 'other');
  const fresh = fits.find((p) => !used.has(p));
  return fresh ?? fits[0];
}

// Words that name how a business starts a customer, by business model (so no answer says "implementation" or "time to value" to a network or a service desk).
export function startWords(model: BusinessModel | null): { rollout: string; value: string; reach: string; unit: string } {
  switch (model) {
    case 'services': return { rollout: 'transition', value: 'time to a steady state', reach: 'reach a steady state', unit: 'service' };
    case 'connectivity': return { rollout: 'migration and cut-over', value: 'time to a stable site', reach: 'get a site stable', unit: 'site' };
    case 'investment': return { rollout: 'onboarding of the mandate', value: 'time to the first report', reach: 'receive the first report', unit: 'mandate' };
    case 'transactions': return { rollout: 'integration', value: 'time to the first live transaction', reach: 'process the first live transaction', unit: 'integration' };
    case 'marketplace': return { rollout: 'onboarding', value: 'time to the first transaction', reach: 'make the first transaction', unit: 'listing' };
    case 'hardware_software': return { rollout: 'installation and rollout', value: 'time to go-live', reach: 'go live', unit: 'site' };
    case 'saas': return { rollout: 'implementation', value: 'time to value', reach: 'see value', unit: 'account' };
    default: return { rollout: 'rollout', value: 'time to first results', reach: 'see first results', unit: 'customer' };
  }
}

// Sentences of a text, in order. A sentence ends at . ! or ? followed by a space and a capital, a digit or a quote; a decimal
// ("1.5%") and common abbreviations ("e.g.", "Co.") do not end one. A line break also ends one.
const ABBREV = /\b(?:e\.g|i\.e|vs|Mr|Mrs|Ms|Dr|Inc|Ltd|Co|approx|etc|No)\.$/;
export function sentencesOf(text: string): string[] {
  const out: string[] = [];
  for (const line of text.replace(/\r/g, '').split(/\n+/)) {
    const parts = line.trim().split(/(?<=[.!?])\s+(?=[A-Z0-9"'(\[])/).map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      if (out.length > 0 && ABBREV.test(out[out.length - 1]) && !/\n/.test(p)) out[out.length - 1] += ' ' + p;
      else out.push(p);
    }
  }
  return out;
}

const ORDINAL = /^(?:first|second|third|fourth|fifth|finally|lastly|next)\b/i;
const VENDOR_VERB = /\bwe (?:built|build|make|made|offer|help|provide|sell|launched|ship|designed|created|solve)\b|\bour (?:product|platform|tool|software|app|service)\b/i;
const RESULT_WORDS = /\b(?:result|achiev\w*|outcome|benefit|key|important|main|critical|essential|value|improv\w*|reduc\w*|increas\w*|cut|saved?)\b/i;
const NOT_NAMES = new Set(['The', 'And', 'But', 'If', 'When', 'This', 'That', 'These', 'Those', 'They', 'We', 'You', 'Our', 'Your', 'Most', 'Many', 'Some', 'One', 'Two', 'Three']);
function hasName(sentence: string): boolean {
  return sentence.split(/\s+/).slice(1).some((t) => /^[A-Z][a-z][A-Za-z]+[,.;:!?]?$/.test(t) && !NOT_NAMES.has(t.replace(/[^A-Za-z0-9]/g, '')));
}
// The rule that chooses key points: whole sentences, at most five, kept in the source's order. A sentence scores 4 for an
// ordinal opener (First, Second, Finally), 2 for a name in the middle of it, 3 for a vendor sentence ("we built", "our platform"),
// 2 for a digit, 1 for a result word, 1 for sharing two or more long words with the key message; -1 under 40 characters, -2 over 300;
// under 25 characters it is skipped. The title (the source's heading or first short line) is left out. Equal scores keep the earlier sentence.
export function pickKeyPoints(source: string, keyMessage = '', title = '', max = 5): string[] {
  const norm = (s: string) => s.trim().replace(/[.!?]+$/, '').toLowerCase();
  const kmWords = new Set((keyMessage.toLowerCase().match(/[a-z]{5,}/g) || []));
  const cands = sentencesOf(source.replace(/^#+\s+/gm, '')).map((s, i) => ({ s, i })).filter(({ s }) => s.length >= 25 && norm(s) !== norm(title));
  const scored = cands.map(({ s, i }) => {
    let n = 0;
    if (ORDINAL.test(s)) n += 4;
    if (hasName(s)) n += 2;
    if (VENDOR_VERB.test(s)) n += 3;
    if (/\d/.test(s)) n += 2;
    if (RESULT_WORDS.test(s)) n += 1;
    if (kmWords.size && (s.toLowerCase().match(/[a-z]{5,}/g) || []).filter((w) => kmWords.has(w)).length >= 2) n += 1;
    if (s.length < 40) n -= 1;
    if (s.length > 300) n -= 2;
    return { s, i, n };
  });
  const chosen = scored.length <= max ? scored : [...scored].sort((a, b) => b.n - a.n || a.i - b.i).slice(0, max);
  return chosen.sort((a, b) => a.i - b.i).map((c) => c.s.replace(/[.!?]+$/, ''));
}

// A short phrase for the first sentence of a text (whole sentence, no cut).
export function firstSentence(text: string): string {
  return (sentencesOf(text)[0] || text).replace(/[.!?]+$/, '');
}

// Cut a text at a word boundary, never inside a word, adding "..." only when something was removed.
export function clipWords(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return (at > 20 ? cut.slice(0, at) : cut).replace(/[,;:\s-]+$/, '') + '...';
}

// A topic that is a clause or a question ("how finance teams close the month") cannot take "Why X is broken" or "Mastering X".
export function isClause(topic: string): boolean {
  return /^(?:how|why|what|when|where|who|which|whether|if|can|should|do|does|is|are)\b/i.test(topic.trim());
}

// A pitch of the audience read from the sector, one line, for notes that say who the reader usually is.
export function audienceLine(v: Vertical | null): string {
  if (!v) return '';
  return `Readers in ${v.name} are usually ${v.buyerRoles.slice(0, 3).join(', ')}. They watch ${v.metrics.slice(0, 4).join(', ')}.`;
}

// The sector's own wording is only printed when the reader's business model allows it: a line with a software-subscription word is dropped otherwise.
const SAAS_WORD = /\b(MRR|free trial|freemium|self-serve sign-?up|per seat|seats?|aha moment)\b/i;
export function forModel(lines: string[], model: BusinessModel | null): string[] {
  return model === 'saas' ? lines : lines.filter((l) => !SAAS_WORD.test(l));
}
