// Red team round 1, 14 Nov 2026, finding 7: "<metric> down/up/cut/fell/rose <N>%" ("Ticket backlog down 40% in six weeks") is a
// customer outcome, for a named and an anonymised customer alike, in all nine verticals. A rise in a cost-type measure or a fall in a
// revenue-type measure is an adverse result, never a success story; a missing figure stays evidence to gather.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCaseStudy } from '../dist/case-study-generator.js';
import { parseProof } from '../dist/draft.js';

const VERTICALS = [
  ['logistics_tech', 'third-party logistics', 'DockFlow yard and dock scheduling software', 'Detention charges cut 38% in one quarter'],
  ['fintech', 'mid-size lenders', 'LedgerGuard dispute management software', 'Chargebacks down 25% in three months'],
  ['saas', 'B2B software companies', 'TrialPath onboarding software', 'Trial-to-paid conversion up 18% in two quarters'],
  ['vertical_saas', 'dental clinic groups', 'ChairBook clinic scheduling software', 'No-shows down 30% in eight weeks'],
  ['ai_native', 'consumer apps', 'an AI support agent for consumer apps', 'Self-serve resolution rate rose 45% in 60 days'],
  ['ites', 'IT services firms', 'a service desk automation platform', 'Average handle time down 22% in a quarter'],
  ['telecom', 'regional telecom operators', 'a network operations platform', 'Network incident tickets down 35% in five months'],
  ['software', 'enterprise software teams', 'a release management tool', 'Release lead time down 50% in two quarters'],
  ['cybersecurity', 'mid-size banks', 'a managed detection and response service', 'Mean time to respond down 60% in 90 days'],
];
const NAMES = ['Northgate Freight', 'Customer A (name withheld)'];
const base = (sector, industry, product, results, customer_name) => ({
  your_sector: sector, customer_name, customer_industry: industry, your_product: product,
  challenge: 'The team could not keep up with the work and the backlog kept growing every week.',
  solution: `The customer rolled out ${product} across the team.`,
  results,
});
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('exact: "Ticket backlog down 40% in six weeks" is a customer outcome, named and anonymised, in all nine verticals', () => {
  for (const [sector, industry, product] of VERTICALS) for (const name of NAMES) {
    const out = generateCaseStudy(base(sector, industry, product, 'Ticket backlog down 40% in six weeks', name));
    assert.doesNotMatch(out, /No customer outcome was given|These items supply no customer outcome/, `${sector} ${name}`);
    assert.match(out, /\| \*\*Lead result\*\* \| Ticket backlog down 40% in six weeks/, `${sector} ${name}`);
  }
});

test('same meaning: each vertical\'s own "<metric> down/up/cut <N>%" result is an outcome, named and anonymised', () => {
  for (const [sector, industry, product, result] of VERTICALS) for (const name of NAMES) {
    const out = generateCaseStudy(base(sector, industry, product, result, name));
    assert.doesNotMatch(out, /No customer outcome was given|These items supply no customer outcome/, `${sector} ${name}: ${result}`);
    assert.match(out, new RegExp('\\| \\*\\*Lead result\\*\\* \\| ' + esc(result)), `${sector} ${name}: ${result}`);
  }
  for (const text of ['Ticket backlog down 40% in six weeks', 'Detention charges down 38 percent', 'Pipeline up 3x in a year', 'Churn cut by 12% in a quarter', 'Win rate up 9 points'])
    assert.equal(parseProof(text)[0].kind, 'result', text);
});

test('opposite: a worse cost-type or revenue-type figure is adverse, and a missing figure is still evidence to gather', () => {
  for (const text of ['Ticket backlog up 40% in six weeks', 'Revenue down 40% in six weeks', 'Renewals dropped 15% this year', 'Support costs higher 20% after launch'])
    assert.equal(parseProof(text)[0].kind, 'adverse', text);
  for (const [sector, industry, product] of VERTICALS) for (const name of NAMES) {
    const out = generateCaseStudy(base(sector, industry, product, 'Ticket backlog up 40% in six weeks', name));
    assert.doesNotMatch(out, /\| \*\*Lead result\*\* \| Ticket backlog up 40%/, `${sector} ${name}`);
    const missing = generateCaseStudy(base(sector, industry, product, 'No backlog figures measured yet', name));
    assert.match(missing, /No customer outcome was given|These items supply no customer outcome/, `${sector} ${name}`);
  }
});

test('an anonymised customer gives the same case study as a named one for a "down N%" result', () => {
  for (const [sector, industry, product, result] of VERTICALS) {
    const anon = generateCaseStudy(base(sector, industry, product, result, 'Customer A (name withheld)'));
    const named = generateCaseStudy(base(sector, industry, product, result, 'Northgate Freight')).split('Northgate Freight').join('Customer A (name withheld)');
    assert.equal(anon, named, sector);
  }
});
