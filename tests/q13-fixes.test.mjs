import test from 'node:test';
import assert from 'node:assert/strict';
import { softwareAdvice } from '../dist/software-policy.js';
import { aOrAn, lowerFirstIfCommon, analyzeContent } from '../dist/utils.js';
import { cleanClaims } from '../dist/content-repurposer.js';
import { generateContentImprover } from '../dist/content-improver.js';
import { splitList, splitObjections, parseProof } from '../dist/draft.js';
import { generateTestimonialCapture } from '../dist/testimonial-capture.js';
import { fact } from '../dist/reader-case.js';

test('RC-01 & RC-02: softwareAdvice blocks buyer tool selection and allows diagnostic payloads', () => {
  assert.ok(softwareAdvice({ topic: 'Recommend a marketing automation tool to buy for our team' }));
  assert.equal(softwareAdvice({ topic: 'Which sales motion should we use for mid-market SaaS?' }), null);
});

test('RC-09: KNOWN_NAMES preserves Indian and enterprise brand capitalization and splitList strips numbered prefixes', () => {
  assert.equal(lowerFirstIfCommon('Shiprocket integrations'), 'Shiprocket integrations');
  assert.equal(lowerFirstIfCommon('Chargebee billing'), 'Chargebee billing');
  const items = splitList('1) First topic\n2) Second topic');
  assert.deepEqual(items, ['First topic', 'Second topic']);
});

test('RC-14: craft_content_improver matches singular/plural audience roles and counts single CTA accurately', () => {
  const analysis = analyzeContent(
    'When a CFO and VP of Finance try to close the books in 5 days, manual reconciliation slows them down. Would you be open to a 15-minute call next Tuesday?',
    'sales_email',
    'Get meetings booked',
    { audience: 'Series B to D SaaS CFOs and VPs of Finance' }
  );
  assert.ok(!analysis.findings.some((f) => f.rule === 'audience'));
  const report = generateContentImprover({
    content: 'Subject: Faster month-end close\n\nHi Alex,\n\nWhen a CFO tries to close the books in 5 days, manual reconciliation slows the team down.\n\nWould you be open to a 15-minute call next Tuesday?\n\nBest,\nSam',
    content_type: 'sales_email',
    goal: 'Get meetings booked',
    audience: 'SaaS CFOs',
  });
  assert.match(report, /Yes: Single clear CTA \(1 ask found\)/);
});

test('RC-15: aOrAn and cleanClaims use "a usage" and fact replaces underscores in multi-item enums', () => {
  assert.equal(aOrAn('usage tier'), 'a');
  assert.equal(cleanClaims('Move to an usage tier today.').text, 'Move to a usage tier today.');
  assert.equal(fact({ target_formats: 'linkedin_post, twitter_thread' }, 'target_formats', 'fallback'), '“linkedin post, twitter thread”');
});

test('RC-22: negated objections and zero cancelled orders are not misclassified', () => {
  const objs = splitObjections('Price is not the issue; buyers worry about integration effort with SAP');
  assert.deepEqual(objs, ['buyers worry about integration effort with SAP']);
  const proof = parseProof('Cut delivery cost by 18% with zero cancelled orders during the Diwali peak');
  assert.notEqual(proof[0]?.kind, 'adverse');
  const kit = generateTestimonialCapture({
    customer_name: 'Rohan Sharma',
    customer_company: 'Shiprocket',
    success_story: 'Cut last-mile delivery cost per parcel by 18% with zero cancelled orders during peak season.',
    testimonial_type: 'written_quote',
  });
  assert.doesNotMatch(kit, /Testimonial request on hold/);
});
