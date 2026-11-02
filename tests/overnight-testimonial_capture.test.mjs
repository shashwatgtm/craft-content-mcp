import {checkReader} from './overnight-reader-helper.mjs';
checkReader("testimonial_capture", [{"index": 0, "key": "success_story", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "testimonial_type", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "success_story", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "customer_role", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "testimonial_type", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {call} from './overnight-reader-helper.mjs';
test('Overnight testimonial: cancelled account keeps the quote request on hold',async()=>{
 const r=await call('testimonial_capture',{customer_name:'Customer contact',customer_company:'Regional fleet',your_product:'Dispatch planning service',success_story:'Customer cancelled the contract and requested a refund.',testimonial_type:'written_quote'});
 const t=r.content.map(c=>c.text||'').join('\n');assert.match(t,/Do not ask for a quote/);assert.match(t,/Keep the stated hold/);assert.match(t,/supports a recovery conversation, not a testimonial request/);assert.doesNotMatch(t,/## Request Email/);
});

test('Overnight testimonial: evidence limits are not vendor claims and questions allow an adverse answer',async()=>{
 const r=await call('testimonial_capture',{customer_name:'Pilot contact',customer_company:'Anonymous regional insurer',success_story:'The AP head said the queue was easier to inspect; no measured time saving. Written approval for a quote has not been received.',testimonial_type:'written_quote',your_product:'Invoice processing service'});
 const s=r.content.map(c=>c.text||'').join('\n');assert.match(s,/an evidence or permission limit, not a customer result/);assert.match(s,/reported experience, not measured proof/);assert.match(s,/What stayed the same or became harder/);assert.doesNotMatch(s,/finds you well!|doing well!|biggest win|claim from the vendor.s own page/);
});
