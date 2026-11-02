import {checkReader} from './overnight-reader-helper.mjs';
checkReader("content_repurposer", [{"index": 0, "key": "source_content", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "source_type", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "source_content", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "key_message", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "source_content", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {generateContentRepurposer} from '../dist/content-repurposer.js';
const source='A regional fleet pilot reduced route adjustment time from four to three hours across ten dispatch days in October. This is one uncontrolled pilot, not a promise for other fleets.';
test('Overnight repurposer: ordinary observed before and after prose becomes a scoped result',()=>{
 const out=generateContentRepurposer({source_content:source,source_type:'blog_post'});
 assert.doesNotMatch(out,/Not given: a proof line/);
 assert.match(out,/Proof Items Found\*\* \| 1/);
 for(const section of out.split(/### /).filter(s=>/^(LinkedIn|Twitter|Email|Blog|Newsletter)/.test(s))) assert.match(section,/uncontrolled pilot/);
});
for(const line of ['No pilot reduced route adjustment time from four to three hours.','A customer pilot could reduce route adjustment time from four to three hours.']) test('Overnight repurposer: denial and prediction do not become observed proof '+line,()=>{
 const out=generateContentRepurposer({source_content:line,source_type:'blog_post'});assert.match(out,/Proof Items Found\*\* \| 0/);
});
