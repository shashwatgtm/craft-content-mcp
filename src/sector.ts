// Run 19 R19-35 (owner decision D80): helpers shared by the eight tools for the problems of the real-world test.
// They read the sector and the business model from what the user typed (src/verticals.ts, the one data file), quote typed
// text instead of pasting it into fixed sentences, split typed lists, and pick whole sentences from a source text.
// Rule B82: nothing here adds a statistic, a benchmark or a named-company fact.

import { detectVertical, detectModel, explainSector, profileFor, VERTICALS, MODEL_NAME, SECTOR_MODEL, type Vertical, type BusinessModel, type ReaderInput } from './verticals.ts';

export type { Vertical, BusinessModel, ReaderInput };

// A list typed by the user: one item per line or per semicolon, or a comma list. A comma fragment that starts with a joining
// word ("not overnight", "which ...") stays with the item before it, so "Routes re-planned in under a minute, not overnight"
// is one item. A comma inside a number ("1,200") never splits.
const JOINER = /^(?:(?:not|but|and|or|so|which|that|because|while|with|without|including|plus|then|yet|rather)\b|i\.e\.|e\.g\.|vs\.|etc\.)/i;
// Run 20: a comma between digits that opens a group of two or three digits ("1,200", "80,000", "1,00,000") is part of a number, never a list break.
export const LIST_COMMA = /(?<!\d),|,(?!\d{2,3}(?!\d))/;
// Run 42B: a name that stands alone before its description ("Acme; a creative agency: ...", "Jo Smith; VP of Supply Chain at Acme: ...") is the
// start of one item, not an item (and never a result): it is welded to the description that follows it.
const NAME_PHRASE = /^[A-Z][\w&.'-]*(?:\s+(?:[A-Z][\w&.'-]*|and|of|the|&|de|van|von)){0,4}$/;
export function weldNames(parts: string[]): string[] {
  const out: string[] = [];
  for (const p of parts) {
    const prev = out[out.length - 1];
    const apposition = /^(?:an?|the)\s+[a-z]/.test(p);
    const title = /^[A-Za-z][^:;]{2,70}\b(?:at|of|for)\b[^:;]{1,60}:\s/.test(p) && p.split(':')[0].split(/\s+/).length >= 3;
    if (prev !== undefined && !/[.!?:]$/.test(prev) && !/\d/.test(prev) && NAME_PHRASE.test(prev.trim()) && prev.trim().split(/\s+/).length <= 5 && (apposition || title)) out[out.length - 1] = `${prev}, ${p}`;
    else out.push(p);
  }
  return out;
}
export function splitItems(s: unknown): string[] {
  if (typeof s !== 'string') return [];
  const lines = s.split(/\n|;/).map((x) => x.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
  const out: string[] = [];
  for (const line of lines) {
    const parts = line.split(LIST_COMMA).map((x) => x.trim()).filter(Boolean);
    parts.forEach((p, i) => {
      if (i > 0 && JOINER.test(p)) out[out.length - 1] += ', ' + p;
      else out.push(p);
    });
  }
  return weldNames(out);
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
// Run 20 (D92): one reader, src/verticals.ts (detectVertical, detectModel, explainSector). The seller's own words go first (what it
// sells, the category, the product description), then the free text about the deal, then job titles, then the buyer's industry.
// The reader decides alone; there is no second rule here.
// "security" in the sense of a financial instrument ("per security", "50,000 securities") is not the security sector: the reader
// is shown the text with those words changed to "instrument".
const FINANCE_ROLE = /\b(?:cfo|chief financial|finance|controller|treasur\w*|accounts? (?:payable|receivable)|fp&a)\b/i;
const IT_ROLE = /\b(?:gm[- ]it|cio|chief information|head of it|it head|it (?:manager|director|infrastructure|lead)|information technology)\b/i;
// Run 42B: the tools a product plugs into ("integrates with the observability stack IT already uses", "connectors to ...") are other products, not what the seller sells.
const OTHER_TOOLS = /\b(?:integrat(?:es|ed|ion|ions)?|connectors?|compatible|works?|plugs?|sits?)\s+(?:with|to|into|on top of)\s+(?:the\s+)?[^.;\n]{0,80}?(?:\bstack\b(?:\s+(?:IT|it|they|you|teams?)\s+(?:already\s+)?\w+)?|(?=[.;\n]|$))/gi;
function scrub(list: unknown[] | undefined): unknown[] | undefined {
  return list?.map((x) => typeof x === 'string' ? x.replace(/\b(?:per|each|every|single|individual)\s+securit(?:y|ies)\b/gi, 'instrument').replace(/\bsecurities\b/gi, 'instruments').replace(/\bSOC ?[123]\b/gi, 'audit report').replace(OTHER_TOOLS, ' ').replace(/\b([A-Z][A-Za-z0-9]+) Software\b/g, '$1') : x);
}
// Run 42: the seller's own category and product description outweigh words about the seller's customers' industries.
// (1) One ambiguous word in the seller's text ("warehouse" in "warehouse data activation", "security" in "cloud and security") does not
//     name a sector unless another text of the inputs reads as the same sector; alone, the sector stays unread and neither the
//     job titles nor the buyer's industry fill the gap (they say who the customers are, not what the seller sells).
// (2) A list of customer industries in the deal text ("across banking, manufacturing, retail and telecom") is not the seller's sector.
// (3) A seller text that is only a product name, read as no sector, is not made a sector by the buyer's industry or job titles alone.
// When the signals are weak or conflicting the answer uses neutral B2B wording (no sector read).
const AMBIGUOUS_WORD = new Set(['warehouse', 'warehousing', 'security', 'secure', 'shipping', 'shipment', 'shipments', 'delivery', 'fleet', 'freight', 'transport', 'payment', 'payments', 'network', 'networking', 'data', 'cloud', 'banking', 'platform', 'trading', 'lending', 'insurance', 'tracking', 'route', 'routing', 'inventory', 'compliance', 'risk', 'fraud', 'billing', 'logistics', 'hotel', 'hotels', 'retail', 'travel', 'carrier', 'carriers', 'stock', 'document', 'documents', 'document processing', 'invoice', 'invoices', 'invoicing', 'procure to pay', 'procure-to-pay', 'bill pay', 'accounts payable', 'agents', 'ai agents', 'workflow', 'workflows', 'automation', 'analytics', 'ocr']);
const INDUSTRY_WORD = /\b(?:banking|banks?|bfsi|financial services|insurance|insurers?|manufacturing|retail|e-?commerce|telecom\w*|hospitality|travel|logistics|energy|utilities|automotive|education|media|government|public sector|consumer goods|fmcg|airlines?|real estate|capital markets?)\b/gi;
// Words that name a feature inside a product (modules, documents, invoices, agents), not what the product is: a text read only through them does not corroborate a sector.
const FEATURE_WORD = new Set(['document', 'documents', 'document processing', 'invoice', 'invoices', 'invoicing', 'procure to pay', 'procure-to-pay', 'bill pay', 'accounts payable', 'agents', 'ai agents', 'workflow', 'workflows', 'automation', 'analytics', 'ocr', 'payment', 'payments', 'billing']);
function nonEmpty(list: unknown[] | undefined): string[] { return (list || []).filter((x): x is string => typeof x === 'string' && x.trim().length > 0); }

// Run 42 round 2: the seller's category and the core of its description decide the sector; a feature inside the product (payments, AI,
// documents, invoices) does not make the product that sector.
// (a) The category phrase (the words before the first colon, else the first sentence) is read alone with its AI labels removed
//     ("An AI execution platform for supply chain" is a platform for supply chain, not an AI agent product).
// (b) Services wording (people delivered, managed, outsourcing, BPO, delivery centres, a statement of work) means the services model.
// (c) Connectivity wording (connectivity, bandwidth, fibre, wavelength, Ethernet, IP transit, carrier network) means telecom, unless the
//     seller's words are about shipments and freight.
const AI_LABEL = /\b(?:(?:agentic|generative|gen) ?ai|ai)(?:[- ](?:powered|native|first|driven|enabled|led|execution|based))?\b/gi;
function categoryHead(t: string): string {
  const colon = t.indexOf(':');
  const head = (colon > 8 && colon < 200 ? t.slice(0, colon) : t.split(/(?<=[.!?])\s/)[0]).slice(0, 200);
  return head.replace(AI_LABEL, ' ').replace(/\s+/g, ' ').trim();
}
const SERVICES_SIGNS: RegExp[] = [
  /\bbpo\b|\boutsourc\w*|\bmanaged services?\b|\bbusiness process\b|\bshared services\b/i,
  /\bdelivery cent(?:er|re)s?\b|\bstatement of work\b|\bper[- ](?:fte|person|head)\b|\bfte\b|\bheadcount\b|\b\d[\d,;]*\+? (?:employees|people|professionals|associates)\b/i,
  /\b(?:operations|transformation|services|consulting) (?:and [a-z]+ )?(?:company|firm|provider)\b/i,
  /\b(?:finance and accounting|procurement|customer experience|research|analytics)\b[^.]{0,80}\bservices\b/i,
];
const TELECOM_SIGNS = /\b(?:connectivity|bandwidth|fib(?:re|er)|wavelengths?|ethernet|ip transit|sd-?wan|sip trunking|subsea|mpls|broadband|dedicated internet access|network as a service|carrier[- ]grade|carrier networks?|wholesale carriers?|cable landing|peering|peered)\b/gi;
const FREIGHT_WORDS = /\b(?:shipments?|freight|shippers?|supply chain|logistics|truck\w*|warehous\w*|detention|etas?|last[- ]mile|3pl)\b/i;
function distinct(re: RegExp, t: string): number { return new Set((t.match(re) || []).map((x) => x.toLowerCase())).size; }
function coreOverride(input: ReaderInput): { id: 'ites' | 'telecom' | null; seller?: string[]; vertical?: Vertical } {
  const sellerTexts = nonEmpty(input.seller);
  if (!sellerTexts.length) return { id: null };
  const whole = sellerTexts.join(' \n ');
  if (SERVICES_SIGNS.filter((re) => re.test(whole)).length >= 2 && !/\b(?:saas|subscription|per seat|per user|software platform)\b/i.test(whole)) return { id: 'ites' };
  if (distinct(TELECOM_SIGNS, whole) >= 2 && !FREIGHT_WORDS.test(whole)) return { id: 'telecom' };
  for (const t of sellerTexts) {
    if (!t.includes(':') && t.length > 200) continue;
    const head = categoryHead(t);
    if (head.length < 8) continue;
    const r = explainSector({ seller: [head] });
    if (r.vertical && !['ites', 'ai-native', 'saas'].includes(r.vertical.id) && r.strong.some((w) => !AMBIGUOUS_WORD.has(w.toLowerCase().trim())) && r.weak.length === 0) return { id: null, seller: [head], vertical: r.vertical };
  }
  return { id: null };
}
const NAME_ONLY = /^[A-Z][\w&.-]*(?: [A-Z][\w&.-]*){0,3} (?:Services|Technology|Technologies|Solutions|Systems|Group|Global|Consulting|Digital|Limited|Ltd|Inc|Corp|Corporation|Company|Partners)$/;
// A list of five or more capabilities (modules of one product) is not read twice: one of its items does not corroborate another.
function isFeatureList(t: string): boolean { return t.split(LIST_COMMA).length >= 5; }
function weighSignals(input: ReaderInput): ReaderInput {
  const out: ReaderInput = { ...input };
  const dropIndustryLists = (list: unknown[] | undefined) => list?.map((x) => {
    if (typeof x !== 'string') return x;
    const found = new Set((x.match(INDUSTRY_WORD) || []).map((w) => w.toLowerCase()));
    return found.size >= 3 ? x.replace(INDUSTRY_WORD, 'customer industry') : x;
  });
  out.context = dropIndustryLists(input.context);
  out.buyer = dropIndustryLists(input.buyer);
  const sellerTexts = nonEmpty(out.seller);
  if (!sellerTexts.length) return out;
  // A seller text that is only a company name ("Colt Technology Services") names no sector: "Services" or "Technology" in a name is not a category.
  const nameOnly = sellerTexts.every((t) => NAME_ONLY.test(t.trim()));
  const sr = nameOnly ? { vertical: null as Vertical | null, strong: [] as string[], weak: [] as string[] } : explainSector({ seller: out.seller });
  if (nameOnly) out.seller = [];
  if (sr.vertical) {
    const word = sr.strong.length === 1 ? sr.strong[0].toLowerCase().trim() : '';
    if (!word || sr.weak.length > 0 || !AMBIGUOUS_WORD.has(word)) return out;
    // the word is the product's own category when it sits next to a product noun ("warehouse management system", "software for warehouses")
    const w = word.replace(/[^a-z]+/g, '[ -]');
    const category = new RegExp(`\\b${w}\\w*(?: [a-z-]+){0,1} (?:system|software|platform|app|tool|solution|suite|service|provider|company|vendor)s?\\b|\\b(?:software|platform|system|app|tool|solution|service)s? (?:for|to|that|which) [^.;]{0,60}\\b${w}`, 'i');
    if (sellerTexts.some((t) => category.test(t))) return out;
    // another text corroborates only with words other than the lone one
    const lone = new RegExp(`\\b${w}\\w*`, 'gi');
    const same = (t: string) => { const r = explainSector({ seller: [t.replace(lone, ' ')] }); return r.vertical?.id === sr.vertical!.id && !r.strong.every((x) => FEATURE_WORD.has(x.toLowerCase().trim())); };
    if ([...nonEmpty(out.context), ...nonEmpty(out.role), ...nonEmpty(out.buyer), ...sellerTexts.filter((t) => !isFeatureList(t))].some(same)) return out;
    return { seller: [], context: FEATURE_WORD.has(word) ? out.context?.map((x) => typeof x === 'string' ? x.replace(lone, ' ') : x) : out.context, role: [], buyer: [] };
  }
  // The seller gave a product but its words name no sector: a sector read only from words naming customers' industries ("banking",
  // "payments", "retail", "travel") describes who the customers are, so it is not used.
  const CUSTOMER_WORD = new RegExp(`^(?:${INDUSTRY_WORD.source.replace(/^\\b\(\?:|\)\\b$/g, '')}|payments?|lending|lenders?|fintech|financial)$`, 'i');
  const onlyCustomerWords = (g: unknown[] | undefined, key: 'context' | 'buyer') => { const r = explainSector({ [key]: g }); return !!r.vertical && r.strong.every((x) => CUSTOMER_WORD.test(x.trim())); };
  if (onlyCustomerWords(out.context, 'context')) out.context = [];
  if (onlyCustomerWords(out.buyer, 'buyer') || !explainSector({ context: out.context }).vertical) out.buyer = [];
  return out;
}
// Run 42B: the seller's own industry, chosen by the user (the your_sector input). It decides the sector; no reading from text overrides it.
// "other" means neutral B2B wording. An unknown value is refused by the server before a tool runs; here it is treated as not given and never echoed.
export const YOUR_SECTORS = ['logistics_tech', 'fintech', 'saas', 'vertical_saas', 'ai_native', 'ites', 'telecom', 'software', 'cybersecurity', 'other'] as const;
const SECTOR_ID: Record<string, string | null> = { logistics_tech: 'logistics-tech', fintech: 'fintech', saas: 'saas', vertical_saas: 'vertical-saas', ai_native: 'ai-native', ites: 'ites', telecom: 'telecom', software: 'software', cybersecurity: 'cybersecurity', other: null };
export function givenSector(yourSector: unknown): { given: boolean; v: Vertical | null } {
  if (typeof yourSector !== 'string' || !Object.prototype.hasOwnProperty.call(SECTOR_ID, yourSector)) return { given: false, v: null };
  const id = SECTOR_ID[yourSector];
  return { given: true, v: id ? VERTICALS.find((x) => x.id === id) ?? null : null };
}
export function readContext(explicitModel: unknown, raw: ReaderInput, yourSector?: unknown): { v: Vertical | null; model: BusinessModel | null; how: string; line: string; source: string | null } {
  const scrubbed: ReaderInput = { seller: scrub(raw.seller), context: scrub(raw.context), role: scrub(raw.role), buyer: scrub(raw.buyer) };
  const gs = givenSector(yourSector);
  const ov = gs.given ? { id: null } as ReturnType<typeof coreOverride> : coreOverride(scrubbed);
  const input: ReaderInput = gs.given ? scrubbed : weighSignals(ov.seller ? { ...scrubbed, seller: ov.seller } : scrubbed);
  const forced = gs.given ? gs.v : ov.vertical ?? (ov.id ? VERTICALS.find((x) => x.id === ov.id) ?? null : null);
  let v = gs.given ? gs.v : forced ?? detectVertical(input);
  // With your_sector the model follows the sector unless the user's own words (business_model, or the seller's wording) state it.
  const given = gs.given && forced ? (() => { const r = detectModel(explicitModel, input); if (r.how === 'sector' && detectVertical(input)?.id === forced.id) return r; return r.how === 'input' || (r.how === 'read' && (r.model !== 'saas' || /(?:saas|subscriptions?|per seat|per user|licen[cs]es?)/i.test(nonEmpty(input.seller).join(' ')))) ? r : { model: SECTOR_MODEL[forced.id], how: 'sector' as const }; })() : null;
  const m = given ? given : gs.given ? detectModel(explicitModel, input) : ov.vertical ? detectModel(explicitModel, { seller: ov.seller }) : forced && !(typeof explicitModel === 'string' && explicitModel) ? { model: SECTOR_MODEL[forced.id], how: 'sector' as const } : detectModel(explicitModel, input);
  const source = v ? (forced ? 'seller' : explainSector(input).source) : null;
  const chosen = gs.given && !!v;
  // A seller that manages money gets the investment notes (profileFor), and an AI native seller of support automation the support notes.
  // When only the buyer's industry points to fintech and that buyer is an investor, the seller's product may be anything: no notes are shown.
  const allText = [input.seller, input.context, input.role, input.buyer].flatMap((g) => (Array.isArray(g) ? g : [])).filter((x): x is string => typeof x === 'string').join(' \n ');
  const investorBuyer = /\b(?:asset (?:allocators?|managers?)|pension (?:funds?|schemes?)|endowments?|wealth managers?|investment (?:managers?|banks?|strateg\w+)|hedge funds?|family offices?|sovereign|quant(?:itative)? (?:strateg\w+|investing))\b/i.test(allText)
    && !/\b(?:reconcil\w*|expenses?|month-end|close the books|payroll|invoic\w*|accounts (?:payable|receivable)|spend management|corporate cards?|prepaid cards?|reimburse\w*)\b/i.test(allText);
  // An investor buyer with no sector in the seller's own words: the seller's product may be anything, but the buyers are allocators, so the
  // investment notes (roles, measures, objections of an allocator) are the ones that fit what the buyer reads.
  const investorOnly = !gs.given && !!v && v.id === 'fintech' && m.model !== 'investment' && investorBuyer;
  const withheld = false;
  v = investorOnly ? profileFor(v, 'investment', input) : profileFor(v, m.model, input);
  // The persona's function decides the measures when the sector's own are another function's: a finance buyer of a billing product
  // reads finance measures, an IT buyer of a sales app reads integration and access measures. Existing words only; no figure.
  let lens = '';
  if (v && !withheld && v.id !== 'fintech' && m.model !== 'investment') {
    const roleText = (Array.isArray(input.role) ? input.role : []).filter((x): x is string => typeof x === 'string').join(' ');
    if (FINANCE_ROLE.test(roleText) && !/billing/i.test(v.name)) {
      const fin = VERTICALS.find((x) => x.id === 'fintech');
      if (fin) { v = { ...v, metrics: fin.metrics, buyerRoles: fin.buyerRoles, discovery: fin.discovery, vocabulary: [...v.vocabulary.filter((x) => !/activation|time to value|net revenue retention|onboarding|customer success/i.test(x)), ...fin.vocabulary], proofShape: fin.proofShape }; lens = 'finance'; }
    } else if (IT_ROLE.test(roleText) && ['vertical-saas', 'saas', 'logistics-tech'].includes(v.id)) {
      v = {
        ...v,
        metrics: ['integration effort with the systems already in place', 'security and access review outcome', 'time to go live', 'support effort after go-live'],
        buyerRoles: ['Head of IT', 'IT Manager', 'Security Lead', ...v.buyerRoles.slice(0, 1)],
        committee: `The business owner of the function signs; IT checks how it fits the systems already in place (${v.subtype === 'fmcg-retail-execution' ? 'ERP, DMS and the like' : 'ERP and the like'}), security and access, and who supports it after go-live.`,
        discovery: [...v.discovery.filter((d) => /system|erp|dms|tms|wms|integrat|data/i.test(d)), ...v.discovery.filter((d) => !/system|erp|dms|tms|wms|integrat|data/i.test(d))],
      };
      lens = 'IT';
    }
  }
  // The ITeS notes are written around a service desk; without a service desk word in the inputs those items are left out of the view.
  if (v && v.id === 'ites' && !/\b(?:service desk|help ?desk|tickets?|contact cent(?:re|er)s?|call cent(?:re|er)s?|bpo|support|first-contact)\b/i.test(allText)) {
    v = { ...v, metrics: v.metrics.filter((x) => !/resolve|first-contact|backlog|ticket/i.test(x)), vocabulary: v.vocabulary.filter((x) => !/ticket/i.test(x)) };
  }
  const from = source === 'role' ? ' (the job titles name it)' : source === 'buyer' ? ' (the buyer\'s industry names it; your own description names no sector)' : '';
  const lensNote = lens ? ` (measures and questions follow the ${lens} buyer)` : '';
  const sector = investorOnly ? `the buyers are investors, so the investment notes are shown (your own description names no sector; ${v ? v.name : 'investment management'})` : v ? `${chosen ? `set by your_sector as ${v.name}` : `read from your inputs as ${v.name}${from}${lensNote}`}` : gs.given ? 'not set: your_sector is other, so the wording is neutral B2B' : 'not clear from your inputs (name the industry for sector notes, or set your_sector)';
  const model = m.model
    ? `${MODEL_NAME[m.model]} (${m.how === 'input' ? 'from business_model' : m.how === 'sector' ? 'the usual model in this sector, assumed; set business_model to change it' : 'read from your inputs; set business_model to change it'})`
    : 'not clear from your inputs; set business_model (saas, services, connectivity, transactions, marketplace, hardware_software or investment) for advice that fits it';
  return { v, model: m.model, how: m.how, line: `*Sector: ${sector}. Business model: ${model}.*`, source };
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
  if (/integrat|migrat|cut-?over|disrupt|\bsetup\b|set-up|\bset up\b|implementation|rollout|transition|too long|long to|takes? too|onboarding|how long (?:does|will|would|do) it take/.test(t)) return 'implementation';
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
  security: /\bsoc\b|\bsoc ?\d|\biso\b|\biso ?\d|\bpci\b|cert-in|\bencrypt|\baudit|\bcertif|\bcompliance|\bresidency|\baccess control|\bprivacy|\bsecur/i,
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
// ("99.5%"), a grouped number ("1,200") and common abbreviations ("e.g.", "i.e.", "vs.", "Rs.", "Sr.", "Mr.", "Dr.", "Inc.", "Co.") do not end one. A line break also ends one.
const ABBREV = /(?<![A-Za-z])(?:e\.g|i\.e|vs|Mr|Mrs|Ms|Dr|Prof|Sr|Jr|Rs|St|Mt|Inc|Ltd|Pvt|Corp|Co|approx|etc|No)\.$/;
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

// Run 20: for each sentence that holds the indicator, the text from the indicator to the end of that sentence (a decimal or an
// abbreviation does not end it). Used to read the challenge, the solution and the results out of interview notes.
export function fromIndicator(text: string, indicator: RegExp): string[] {
  const out: string[] = [];
  for (const s of sentencesOf(text)) {
    const m = indicator.exec(s);
    if (m) out.push(s.slice(m.index));
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
