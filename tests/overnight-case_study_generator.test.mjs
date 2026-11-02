import {checkReader} from './overnight-reader-helper.mjs';
checkReader("case_study_generator", [{"index": 0, "key": "results", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "results", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "challenge", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "solution", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "your_product", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {call} from './overnight-reader-helper.mjs';
test('Overnight case story: closing action is written for the reader',async()=>{
 const r=await call('case_study_generator',{customer_name:'Anonymous fleet',your_product:'Dispatch planning software',challenge:'Route adjustments took four hours',solution:'One exception queue',results:'One pilot took three hours over ten days; no publication permission.'});
 const t=r.content.map(c=>c.text||'').join('\n');assert.match(t,/Before changing your process, record the starting point/);assert.doesNotMatch(t,/Close with one action for the reader|Write the reader.s next step/);
});

test('Overnight case study: an anonymous single pilot keeps its word-number result and permission hold',async()=>{
 const r=await call('case_study_generator',{customer_name:'Anonymous regional fleet',your_product:'Dispatch planning software',challenge:'Daily route adjustments took four hours',solution:'Give each depot a shared exception queue',results:'October pilot: route adjustment time fell from four to three hours across ten dispatch days. Customer publication permission has not been granted.'});
 const s=r.content.map(c=>c.text||'').join('\n');assert.match(s,/Your results:\*\* they carry a figure/);assert.match(s,/Use not approved/);assert.match(s,/Distribution held/);assert.doesNotMatch(s,/Other Dispatch planning software customers|own figures are not given yet|### Social media version/);assert.match(s,/Keep the stated hold/);
});
