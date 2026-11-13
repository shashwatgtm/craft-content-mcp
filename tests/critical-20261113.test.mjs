// 13 Nov 2026 six-question red team, two critical faults.
// 1. craft_content_improver: an unsourced numeric or outcome claim is NOT PROVED YET, listed as a defect, never GOOD or EXCELLENT;
//    a claim with its source is not flagged.
// 2. case_study_generator: an anonymised or placeholder customer name behaves exactly like a named customer, label kept.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateContentImprover } from '../dist/content-improver.js';
import { generateCaseStudy } from '../dist/case-study-generator.js';

const RED_TEAM_POST = "Support teams are drowning in repeat tickets. Our AI agent now resolves 60% of tickets without a human. One Series B customer cut first response time from 9 hours to 4 minutes. If your queue keeps growing faster than your team, what would you do with the hours back? Book a 20 minute walkthrough and see how it works on your own tickets.";

const rating = (out) => /## Overall Score: [\d.]+\/10 \(([^)]+)\)/.exec(out)[1];
const run = (content, your_sector) => generateContentImprover({ content, content_type: 'social_post', your_sector, audience: 'heads of operations' });

test('red team post: unsourced 60% claim is NOT PROVED YET and listed as a defect', () => {
  const out = run(RED_TEAM_POST, 'ai_native');
  assert.equal(rating(out), 'NOT PROVED YET');
  assert.doesNotMatch(out, /No defects found|No fixes needed|\(EXCELLENT\)|\(GOOD\)/);
  assert.match(out, /Defect \(unsourced-claim\)\*\*: NOT PROVED YET: add the source or soften the claim: "Our AI agent now resolves 60% of tickets without a human\."/);
  assert.match(out, /cut first response time from 9 hours to 4 minutes/);
});

// exact (a percentage claim), same meaning (a multiple, a money figure, a before-and-after customer result), opposite (the same claim
// with its source, or softened with no number): one set per vertical
const CASES = {
  logistics_tech: {
    exact: 'Our yard platform cuts detention charges by 38% for every 3PL.',
    same: ['Carriers get docked 3x faster with our scheduling.', 'One 3PL customer cut gate-to-dock wait from 2.5 hours to 50 minutes.'],
    opposite: ['According to our Q3 2026 yard audit of 41,000 truck visits, detention charges fell 38%.', 'Our scheduling helps carriers get docked sooner.']
  },
  fintech: {
    exact: 'Finance teams close the books 40% faster with our reconciliation engine.',
    same: ['Our customers saved $2.4 million in late payment fees last year.', 'One lender cut loan approval time from 5 days to 9 hours.'],
    opposite: ['Close time fell 40% across 120 finance teams (source: https://example.com/close-benchmark-2026).', 'Our reconciliation engine helps finance teams close the books with less manual work.']
  },
  saas: {
    exact: 'Teams using our onboarding flows see 25% higher trial conversion.',
    same: ['Our playbooks double activation in the first week.', 'One Series A customer grew net revenue retention from 98% to 121%.'],
    opposite: ['Trial conversion rose 25% in our 2026 benchmark report of 300 SaaS teams.', 'Our onboarding flows help teams turn more trials into paying customers.']
  },
  vertical_saas: {
    exact: '85% of clinics book more appointments after switching to our scheduler.',
    same: ['Clinics on our scheduler fill 2x more same-day slots.', 'One dental group raised monthly bookings from 900 to 1,400.'],
    opposite: ['85% of clinics booked more appointments, according to the 2026 Clinic Operations Survey.', 'Clinics on our scheduler fill more same-day slots.']
  },
  ai_native: {
    exact: 'Our AI agent now resolves 60% of tickets without a human.',
    same: ['Our copilot answers support questions 10x faster than a human agent.', 'One Series B customer cut first response time from 9 hours to 4 minutes.'],
    opposite: ['Our AI agent resolved 60% of tickets in the Q3 2026 support audit [1].', 'Our AI agent now handles many routine tickets without a human.']
  },
  ites: {
    exact: 'Our managed service desk reduces ticket backlog by 45% in the first quarter.',
    same: ['Clients save ₹3 crore a year on staffing with our delivery model.', 'One insurer cut claims processing time from 12 days to 4 days.'],
    opposite: ['Backlog fell 45% in the first quarter, as reported by the client in its 2026 annual filing.', 'Our managed service desk helps clients clear their ticket backlog.']
  },
  telecom: {
    exact: 'Operators using our network analytics cut dropped calls by 30%.',
    same: ['Our private 5G rollouts go live 4x faster than a standard build.', 'One operator lowered mean time to repair from 6 hours to 90 minutes.'],
    opposite: ['Dropped calls fell 30%, according to the operator\'s published network report.', 'Our network analytics help operators find the cause of dropped calls.']
  },
  software: {
    exact: 'Our CI pipeline makes builds 70% faster.',
    same: ['Teams ship releases 3x more often with our pipeline.', 'One platform team cut build time from 40 minutes to 12 minutes.'],
    opposite: ['Build time fell 70% in the 2026 DevOps benchmark study.', 'Our CI pipeline makes builds faster for most teams.']
  },
  cybersecurity: {
    exact: 'Our SOC platform cuts alert triage time by 50%.',
    same: ['Security teams investigate incidents 5x faster on our platform.', 'One bank reduced phishing click rates from 14% to 3%.'],
    opposite: ['Alert triage time fell 50% (Forrester Total Economic Impact study, 2026).', 'Our SOC platform helps analysts triage alerts sooner.']
  }
};

for (const [sector, c] of Object.entries(CASES)) {
  test(`${sector}: exact and same-meaning unsourced claims are NOT PROVED YET; sourced or softened claims are not flagged`, () => {
    for (const claim of [c.exact, ...c.same]) {
      const out = run(`${claim} Want to see how it works for your team? Reply and I will send you the details.`, sector);
      assert.equal(rating(out), 'NOT PROVED YET', `${sector}: ${claim}`);
      assert.match(out, /Defect \(unsourced-claim\)\*\*: NOT PROVED YET: add the source or soften the claim/, `${sector}: ${claim}`);
      assert.doesNotMatch(out, /No defects found|\(EXCELLENT\)|\(GOOD\)/, `${sector}: ${claim}`);
    }
    for (const claim of c.opposite) {
      const out = run(`${claim} Want to see how it works for your team? Reply and I will send you the details.`, sector);
      assert.doesNotMatch(out, /unsourced-claim/, `${sector}: ${claim}`);
      assert.notEqual(rating(out), 'NOT PROVED YET', `${sector}: ${claim}`);
    }
  });
}

test('a source on the next line or a Sources line covers the claim; questions and "if" sentences are not claims', () => {
  for (const content of [
    'Our AI agent now resolves 60% of tickets without a human.\nSource: Q3 support audit, 41,000 tickets, published at https://example.com/audit.',
    'Our AI agent now resolves 60% of tickets without a human. One customer cut response time from 9 hours to 4 minutes.\n\nSources: https://example.com/audit; customer interview, 2026.',
    'What would you do if 60% of your tickets resolved themselves? Reply and I will show you how teams think about it.',
    'If you cut first response time from 9 hours to 4 minutes, what changes for your team? Reply and tell me.',
    'Join our webinar on 12 March 2026 at 3 pm. Bring your questions and your team.'
  ]) assert.doesNotMatch(run(content, 'ai_native'), /unsourced-claim/, content);
});

// ---------- case_study_generator ----------
const CASE_BASE = {
  customer_industry: 'third-party logistics',
  your_product: 'DockFlow yard and dock scheduling software',
  challenge: 'Trucks queued at the gate for hours because dock slots were booked by phone and spreadsheet, and detention charges kept rising.',
  solution: 'DockFlow replaced phone booking with carrier self-scheduling and live dock status for the yard team.',
  results: 'Average gate-to-dock wait fell from 2.5 hours to 50 minutes between March and August 2026; detention charges down 38 percent over the same period; customer approval for publication unknown'
};

test('red team input: anonymised customer keeps its supplied results and its label', () => {
  const name = 'Customer A (a 3PL, name pending approval)';
  const out = generateCaseStudy({ ...CASE_BASE, customer_name: name });
  assert.doesNotMatch(out, /own figures are not given|pick one customer from the list|what customers report/);
  assert.match(out, /\| \*\*Lead result\*\* \| Average gate-to-dock wait fell from 2\.5 hours to 50 minutes/);
  assert.match(out, /\*\*The result\.\*\* Average gate-to-dock wait fell from 2\.5 hours to 50 minutes/);
  assert.match(out, /# Case Study: Customer A \(a 3PL, name pending approval\)/);
});

test('anonymised and placeholder names give the same case study as a company-style name', () => {
  for (const name of ['Customer A (a 3PL, name pending approval)', 'Client X', 'Customer 1', 'Customer B, a mid-size 3PL', '[Customer]', 'Logistics customer (name withheld)', 'Company Z (anonymised)', 'An anonymised 3PL customer']) {
    const anon = generateCaseStudy({ ...CASE_BASE, customer_name: name });
    const named = generateCaseStudy({ ...CASE_BASE, customer_name: 'Northgate Freight' }).split('Northgate Freight').join(name);
    assert.equal(anon, named, name);
  }
});

test('opposite: a plural, unnamed set of customers still keeps other companies\' results apart', () => {
  const out = generateCaseStudy({ ...CASE_BASE, customer_name: 'One of our 3PL customers', results: 'Northgate Freight: gate-to-dock wait fell from 2.5 hours to 50 minutes; Harbourline: detention charges down 38 percent' });
  assert.match(out, /own figures are not given/);
});
