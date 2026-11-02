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

import {generateTestimonialCapture} from '../dist/testimonial-capture.js';
const quoteBase={customer_name:'Pilot contact',customer_company:'Anonymous services team',your_product:'Service handoff review',customer_role:'Service delivery head',testimonial_type:'written_quote',success_story:'Handoffs were easier to inspect according to the service delivery head, but no time saving was measured and written quote permission is still absent.'};
test('equivalent absent permission wording never becomes a measured customer result',()=>{
 const s=generateTestimonialCapture(quoteBase);
 assert.match(s,/an evidence or permission limit, not a customer result/);assert.doesNotMatch(s,/\*\(a result;/);
});
test('permission labels with unknown values or conflicting account evidence cannot approve publication',()=>{
 const scope='Approved channel: website; Approved attribution: anonymous; Approved wording: The queue is easier to inspect';
 for(const use_case of [scope,scope.replace('website','unknown'),scope.replace('anonymous','pending')]){
  const s=generateTestimonialCapture({...quoteBase,use_case});assert.match(s,/Use not approved/);assert.doesNotMatch(s,/Permission scope supplied/);
 }
 const approved=generateTestimonialCapture({...quoteBase,success_story:'The customer reports that the queue is easier to inspect.',use_case:scope});
 assert.match(approved,/Permission scope supplied/);
});
test('testimonial questions leave unmeasured results and poor fit open',()=>{
 const s=generateTestimonialCapture({...quoteBase,customer_role:'Support lead'});
 assert.match(s,/Did you observe any results/);assert.match(s,/or leave it unmeasured/);assert.match(s,/who would it not suit/);
 assert.doesNotMatch(s,/How long did it take to see first results|once the product took over|How did how often/);
});
