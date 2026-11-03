import test from 'node:test';
import assert from 'node:assert/strict';
import {generateContentImprover} from '../dist/content-improver.js';

for(const [content,goal] of [
 ['We sell lending software in India.','Explain the supplier review workflow'],
 ['Our office is open Monday to Friday.','Explain how to submit an appeal and who reviews it'],
 ['The supplier checklist is ready.','Explain how to submit the checklist and identify its approver'],
 ['The workflow, submit, appeal and approver are words in our glossary.','Explain how to submit an appeal and who reviews it']
])test('M089 missing purpose cannot pass on heuristic score: '+content,()=>{
 const out=generateContentImprover({content,goal,content_type:'product_description'});
 assert.match(out,/Semantic goal alignment remains unverified/);
 assert.match(out,/Goal Alignment \| .*rule checks only.*Unverified/);
 assert.doesNotMatch(out,/Goal Alignment \| [^\n]+\| Yes \||Yes: Aligns with stated goal/);
 assert.match(out,/Point to the exact passage/);
});
test('M089 supplied steps remain intact and still require a human task check',()=>{
 const content='Send the completed supplier checklist to the procurement mailbox. The procurement manager reviews it and records approval in the supplier register.';
 const out=generateContentImprover({content,goal:'Explain how to submit the checklist and identify its approver',content_type:'product_description'});
 assert.match(out,/procurement mailbox/);assert.match(out,/procurement manager reviews it/);
 assert.match(out,/Confirm alignment with the stated goal/);
 assert.doesNotMatch(out,/Yes: Aligns with stated goal/);
});
