import {checkReader} from './overnight-reader-helper.mjs';
checkReader("case_study_generator", [{"index": 0, "key": "results", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "results", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "challenge", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "solution", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "your_product", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {call} from './overnight-reader-helper.mjs';
test('Overnight case story: closing action is written for the reader',async()=>{
 const r=await call('case_study_generator',{customer_name:'Anonymous fleet',your_product:'Dispatch planning software',challenge:'Route adjustments took four hours',solution:'One exception queue',results:'One pilot took three hours over ten days; no publication permission.'});
 const t=r.content.map(c=>c.text||'').join('\n');assert.match(t,/Before changing your process, record the starting point/);assert.doesNotMatch(t,/Close with one action for the reader|Write the reader.s next step/);
});
