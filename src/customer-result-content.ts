import { generateCaseStudy } from './case-study-generator.js';
import { generateContentRepurposer } from './content-repurposer.js';
import { generateNewsletter } from './newsletter-builder.js';
import { softwareAdvice } from './software-policy.js';
import { type Node, textField as t, validateChain, isoDate, httpsUrl, paragraphs } from './chain-inputs.js';

export const CUSTOMER_RESULT_TOOL = 'customer_result_to_content';
const ASSETS = ['case study', 'post', 'newsletter section', 'newsletter issue'] as const;
type Asset = typeof ASSETS[number];
const details: Record<string, Node> = Object.fromEntries([
  ['qualifier', 'The qualifier inside the locked sentence, or none stated.'],
  ['counted', 'What was counted.'], ['definition', 'What counts as the outcome.'],
  ['denominator', 'Out of how many eligible cases.'], ['period', 'The measurement period.'],
  ['before', 'The before figure.'], ['fell_out', 'How excluded or abandoned cases were counted.'],
  ['reporter', 'Who reported the result.'], ['review_by', 'Review date as year, month and day.'],
].map(([k, d]) => [k, t(d)]));
export const customerResultDefinition = {
  name: CUSTOMER_RESULT_TOOL,
  title: 'Turn this customer result into content',
  description: 'Turn this customer win into a case study, a post and a newsletter without changing the number. Needs the exact result sentence with its qualifier and source label, source and date, your role, approval, your own view and a reader action. Returns a proof card, first drafts and a sentence check. Optional proof details expose gaps. Written approval is required for your own customer; without it, returns the card and questions only. Chat collects the facts; the results view shows them. No form.',
  inputSchema: {
    type: 'object' as const, additionalProperties: false,
    properties: {
      exact_sentence: t('Copy the result exactly, keeping its qualifier and source label inside this sentence.'),
      source_url: t('Public source or approved evidence link, using https.'),
      source_date: t('Publication or evidence date as year, month and day, or not stated. Keep it separate from the measurement period.'),
      source_checked_date: t('The date you reopened the source, as year, month and day. This is not the publication date.'),
      source_kind: { type: 'string', enum: ['company_reported', 'second_hand', 'customer_record'], description: 'Who stands behind the result. A company report is not independent evidence.' } as Node,
      source_label: t('The source label already inside the exact sentence, for example company-reported.'),
      measured_result: { type: 'boolean', description: 'False for a story with no measured outcome. Never infer an improvement from exposure or scale counts.' } as Node,
      buyer_role: { type: 'string', enum: ['vendor', 'outside_writer'] } as Node,
      relationship: { type: 'string', enum: ['own_customer', 'public_example'] } as Node,
      approval: {
        type: 'object', additionalProperties: false, required: ['status'], properties: {
          status: { type: 'string', enum: ['written', 'public_page', 'none'] },
          approver: t('Who approved the uses, in writing.'), date: t('Approval date as year, month and day.'),
          uses: { type: 'array', minItems: 1, maxItems: 4, items: { type: 'string', enum: ASSETS }, description: 'Every use explicitly covered by the written approval.' },
        },
      } as Node,
      proof_details: { type: 'object', additionalProperties: false, properties: details } as Node,
      as_of_date: t('The date of this run as year, month and day. Supplied by chat so repeats stay identical.'),
      story_published: { type: 'boolean' } as Node,
      published_story: t('The already published story as plain text. Used as source without rebuilding it.', 16000),
      customer_name: t('Customer label, including an approved anonymous description.'),
      product: t('Your product or vendor name.'), challenge: t('The customer problem from the approved story.'),
      solution: t('What was done, from the approved story.'),
      buyer_view: { ...t('Your own view in whole sentences. The tool will not invent it.'), minLength: 0 },
      call_to_action: t('One action you want the reader to take.'),
      headline: t('Your own headline, if available.'),
    },
    required: ['exact_sentence', 'source_url', 'source_date', 'source_kind', 'source_label', 'measured_result', 'buyer_role', 'relationship', 'approval', 'as_of_date', 'story_published', 'customer_name', 'product', 'call_to_action'],
  },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
};
export type CustomerResultInput = {
  exact_sentence: string; source_url: string; source_date: string; source_checked_date?: string; source_kind: string; source_label: string;
  measured_result: boolean; buyer_role: 'vendor' | 'outside_writer'; relationship: 'own_customer' | 'public_example';
  approval: { status: 'written' | 'public_page' | 'none'; approver?: string; date?: string; uses?: Asset[] };
  proof_details?: Record<string, string>; as_of_date: string; story_published: boolean; published_story?: string;
  customer_name: string; product: string; challenge?: string; solution?: string; buyer_view?: string;
  call_to_action: string; headline?: string;
};
type Check = { status: 'pass' | 'fail'; sentence: boolean; missing_view: string[]; derived_numbers: string[]; date_issues: string[]; flags: string[] };
const metricTokens = (s: string) => s.match(/(?:[$£₹€]\s*)?\d[\d,]*(?:\.\d+)?\s*(?:%|percent|days?|weeks?|months?|years?|hours?|minutes?|seconds?|times|x\b)|[$£₹€]\s*\d[\d,]*(?:\.\d+)?/gi) ?? [];
const normalMetric = (s: string) => s.toLowerCase().replace(/\s+/g, '');
export function weekdayIssues(text: string): string[] {
  const issues: string[] = [];
  for (const m of text.matchAll(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(\d{4}-\d{2}-\d{2})\b/g)) {
    if (!isoDate(m[2]) || new Date(m[2]).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) !== m[1]) issues.push(`Check the weekday beside ${m[2]}.`);
  }
  for (const m of text.matchAll(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(\d{1,2}\s+[A-Z][a-z]+\s+\d{4}|[A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\b/g)) {
    const date = new Date(m[2] + ' UTC');
    if (Number.isNaN(date.getTime()) || date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) !== m[1]) issues.push(`Check the weekday beside ${m[2]}.`);
  }
  return issues;
}
export function checkResultAsset(text: string, input: CustomerResultInput, checkView = false): Check {
  const cardText = [input.exact_sentence, ...Object.values(input.proof_details ?? {})].join('\n');
  const allowed = new Set(metricTokens(cardText).map(normalMetric));
  const derived_numbers = [...new Set(metricTokens(text).filter(n => !allowed.has(normalMetric(n))))];
  const missing_view = checkView ? paragraphs(input.buyer_view ?? '').filter(sentence => !text.includes(sentence)) : [];
  const flags: string[] = [];
  if (/General note for|not from your inputs|## Sector [Nn]otes|What to check in your own operation/.test(text)) flags.push('Stock text: cut or rewrite from the card.');
  if (input.buyer_role === 'vendor' && /When a vendor shows you results like these/i.test(text)) flags.push('You are the vendor. Rewrite the line warning the reader about the sender.');
  if (text.includes(`${input.customer_name} and ${input.product}`)) flags.push('Generic headline: write your own.');
  const sentence = text.includes(input.exact_sentence), date_issues = weekdayIssues(text);
  return { status: sentence && !missing_view.length && !derived_numbers.length && !date_issues.length ? 'pass' : 'fail', sentence, missing_view, derived_numbers, date_issues, flags };
}
const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
function proofCard(a: CustomerResultInput) {
  const d = a.proof_details ?? {}, gaps: string[] = [];
  const fields: [string, string][] = [
    ['Exact sentence', a.exact_sentence], ['Source', a.source_url], ['Source date', a.source_date], ['Source checked', a.source_checked_date || 'not stated'],
    ['Source kind', a.source_kind === 'second_hand' ? 'Second hand report, not independent verification' : a.source_kind === 'company_reported' ? 'Company reported, not independent verification' : 'Customer record, not independently verified'],
    ['Measured result', a.measured_result ? 'Reported result, check its definition and scope' : 'No measured result'],
    ...Object.entries(details).map(([key, schema]): [string, string] => {
      const value = d[key] || 'not stated';
      if (!d[key] || /^(?:not stated|unknown|none stated|i do not know)$/i.test(value.trim())) gaps.push(`Ask the customer: ${schema.description}`);
      return [key.replace(/_/g, ' '), value];
    }),
    ['Approval', a.approval.status.replace(/_/g, ' ')], ['Approved uses', a.approval.uses?.join(', ') || 'not stated'],
    ['Approved by', a.approval.approver || 'not stated'], ['Approval date', a.approval.date || 'not stated'],
    ['Review rule', 'The result comes off if no answer by this date.'],
  ];
  if (a.source_date === 'not stated') gaps.push('Ask when this source was published. The retrieval date is not its publication date.');
  return { fields, gaps };
}
function formatPiece(kit: string, heading: string): string {
  const start = kit.indexOf(`### ${heading}\n`);
  if (start < 0) return '';
  return kit.slice(start + heading.length + 5).split(/\n### |\n## Source Notes/)[0].trim().replace(/^---\s*|\s*---$/g, '').trim();
}
export function runCustomerResult(input: unknown) {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    const a = input as Record<string, unknown>;
    const schema = customerResultDefinition.inputSchema;
    const blank = schema.required.filter(k => {
      const property = (schema.properties as Record<string, Node>)[k];
      return property.type === 'string' && !property.enum && (a[k] == null || typeof a[k] === 'string' && !(a[k] as string).trim());
    });
    if (blank.length) return { content: [{ type: 'text', text: `Missing required input for Turn this customer result into content: ${blank.map(k => k.replace(/_/g, ' ')).join(', ')}. Supply these facts in the conversation.` }], isError: true };
  }
  const errors = validateChain(input, customerResultDefinition.inputSchema as Node);
  if (errors.length) return { content: [{ type: 'text', text: errors.join('\n') }], isError: true };
  const a = input as CustomerResultInput;
  if (!(isoDate(a.source_date) || a.source_date === 'not stated') || !isoDate(a.as_of_date) || (a.source_checked_date && !isoDate(a.source_checked_date)) || !httpsUrl(a.source_url)) return { content: [{ type: 'text', text: 'Supply valid dates as year, month and day and an https source link. Use not stated for an unknown publication date.' }], isError: true };
  // GTM stack software goes to the booking; other technology gets the plain decline, as on every other tool (13 Nov 2026).
  const advice = softwareAdvice(a);
  if (advice) return { content: [{ type: 'text', text: advice }] };
  const { fields, gaps } = proofCard(a);
  const hold: string[] = [];
  if (!a.buyer_view?.trim() || /^(?:none|unknown|none yet|no view|i (?:do not|don.t) know|not (?:given|supplied|stated))\.?$/i.test(a.buyer_view.trim())) hold.push('Write your own view in whole sentences before drafting. The tool cannot supply it.');
  if (!a.exact_sentence.includes(a.source_label)) hold.push('Keep the source label inside the exact sentence.');
  const qualifier = a.proof_details?.qualifier;
  if (qualifier && !/^(?:none|not stated|none stated)$/i.test(qualifier) && !a.exact_sentence.includes(qualifier)) hold.push('Keep the qualifier inside the exact sentence.');
  if (isoDate(a.source_date) && a.source_date > a.as_of_date) hold.push('Check the source date. It is after the run date.');
  if (a.source_checked_date && a.source_checked_date > a.as_of_date) hold.push('Check the source retrieval date. It is after the run date.');
  if (/\bindependent(?:ly)?\b/i.test(a.source_label)) hold.push('A company report, customer record or second hand report cannot be labelled independent verification.');
  const own = a.relationship === 'own_customer' || a.buyer_role === 'vendor';
  const requiredUses = ASSETS.filter(use => !(a.story_published && use === 'case study'));
  if (own || a.approval.status === 'written') {
    if (a.approval.status !== 'written') hold.push('Written approval is required for your own customer. A public story does not approve new uses.');
    if (!a.approval.approver || /^(?:unknown|not stated|none|tbd|n\/?a|no approval|not approved)$/i.test(a.approval.approver.trim()) || !a.approval.date || !isoDate(a.approval.date) || a.approval.date > a.as_of_date) hold.push('Record who approved the uses and the valid written approval date.');
    for (const use of requiredUses) if (!a.approval.uses?.includes(use)) hold.push(`Get written approval for the ${use}.`);
    const review = a.proof_details?.review_by;
    if (!review || !isoDate(review)) hold.push('Set a valid review date before using your customer result.');
    else if (review <= a.as_of_date) hold.push('The review date has arrived. Take the result off until approval is renewed.');
  } else if (a.approval.status !== 'public_page') hold.push('Confirm the public page you are quoting or record written approval.');
  if (a.story_published && !a.published_story) hold.push('Paste the published story. It will be used as the source, without rebuilding it.');
  if (!a.story_published && (!a.challenge || !a.solution)) hold.push('Supply the approved challenge and solution before drafting an unpublished story.');
  const cardText = fields.map(([k, v]) => `| ${k} | ${cell(v)} |`).join('\n');
  const header = `# Turn this customer result into content\n\n## Answer card\n\n${hold.length ? 'Drafts held. Complete the proof card first.' : 'First drafts. The check below tests the sentence lock, not the meaning.'}\n\n## Check this first\n\n| Proof card field | Your evidence |\n|---|---|\n${cardText}\n\n${[...hold, ...gaps].map(g => `- ${g}`).join('\n')}\n`;
  if (hold.length) return { content: [{ type: 'text', text: header }], structuredContent: { tool: CUSTOMER_RESULT_TOOL, status: 'held', proof_card: fields, gaps: [...hold, ...gaps], assets: [], checks: [], steps: [], actions: [] } };

  const study = a.story_published ? a.published_story! : generateCaseStudy({ customer_name: a.customer_name, your_product: a.product, mode: 'full', challenge: a.challenge, solution: a.solution, results: a.exact_sentence });
  // The case study really reaches the repurposer. Its extraction can drop the view;
  // preserve the buyer's supplied sentences explicitly, then check the final draft.
  const repurposeSource = `${a.buyer_view}\n\nResults: ${a.exact_sentence}\n\nReader action: ${a.call_to_action}\nSource URL: ${a.source_url}\nSender: ${a.buyer_role === 'vendor' ? a.product : 'Outside writer'}\n\nCase study:\n${study}`;
  const kit = generateContentRepurposer({ source_content: repurposeSource, source_type: 'case_study', target_formats: 'linkedin_post, newsletter_section', brand_voice: 'professional', key_message: a.headline });
  const post = formatPiece(kit, 'LinkedIn Post'), section = formatPiece(kit, 'Newsletter Section');
  const withView = (draft: string) => `${paragraphs(a.buyer_view!).filter(s => !draft.includes(s)).join('\n\n')}${paragraphs(a.buyer_view!).every(s => draft.includes(s)) ? '' : '\n\n'}${draft}`.trim();
  const newsletter = generateNewsletter({ topic: a.headline || 'What this result does and does not show', key_points: `${a.buyer_view}\n${a.exact_sentence}`, cta_goal: a.call_to_action, newsletter_type: 'educational', tone: 'professional' });
  const assets: { name: Asset; text: string }[] = [
    ...(!a.story_published ? [{ name: 'case study' as Asset, text: study }] : []),
    { name: 'post', text: withView(post) }, { name: 'newsletter section', text: withView(section) },
    { name: 'newsletter issue', text: newsletter.split('\n## Subject Lines')[0].trim() },
  ];
  const checks = assets.map(asset => ({ asset: asset.name, ...checkResultAsset(asset.text, a, asset.name === 'post') }));
  const steps = [
    { tool: 'Proof card', passed: a.exact_sentence },
    { tool: a.story_published ? 'Published story kept, no rebuild' : 'Case study generator', passed: study },
    { tool: 'Content repurposer', passed: repurposeSource },
    { tool: 'Newsletter builder', passed: `${a.exact_sentence}\nCall to action: ${a.call_to_action}` },
    { tool: 'Sentence and view check', passed: 'Compare each final asset with the proof card. Read every factual sentence yourself.' },
  ];
  const actions = [{ label: 'Run the voice audit', prompt: 'Run the installed Handcrafted voice audit on the post in this result. If it is unavailable, say so and ask me to review the post.' }];
  const checkText = checks.map(c => `### ${c.asset}: ${c.status}\n\nWhole locked sentence: ${c.sentence ? 'pass' : 'fail'}.\n${c.missing_view.map(x => `Missing view sentence: ${x}`).join('\n')}\n${c.derived_numbers.map(x => `Number not on the card: ${x}. Cut it or add sourced evidence to the card.`).join('\n')}\n${[...c.date_issues, ...c.flags].join('\n')}`).join('\n\n');
  const restoration = paragraphs(a.buyer_view!).filter(s => !post.includes(s));
  const text = `${header}\n## Check report\n\n${checkText}\n\nThis is a word for word check. It does not prove meaning, causation or independent verification. Read every factual sentence against the card.\n${restoration.length ? '\nThe repurposer dropped some of your view. The chain restored those supplied sentences before the post and checked them again.\n' : ''}\n## Steps and handoffs\n\n${steps.map(s => `### ${s.tool}\n\n${s.passed}`).join('\n\n')}\n\n## Full results\n\n${assets.map(s => `### ${s.name}: first draft\n\n${s.text}`).join('\n\n')}\n\n## Your next action\n\nRun the voice audit on the post if that skill is installed. Resolve each flagged line and proof gap before seeking approval. For a second pair of eyes, book 45 minutes: https://calendly.com/shashwat-gtmhelix/45min`;
  return { content: [{ type: 'text', text }], structuredContent: { tool: CUSTOMER_RESULT_TOOL, status: checks.every(c => c.status === 'pass') ? 'pass' : 'fail', proof_card: fields, gaps, assets, checks, steps, actions } };
}
