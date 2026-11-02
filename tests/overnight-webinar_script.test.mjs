import {checkReader} from './overnight-reader-helper.mjs';
checkReader("webinar_script", [{"index": 0, "key": "key_takeaways", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "topic", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "topic", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "target_audience", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "your_product", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {call} from './overnight-reader-helper.mjs';
test('Overnight webinar: a missing exercise stays outside spoken copy',async()=>{
 const r=await call('webinar_script',{topic:'Invoice approvals',target_audience:'Accounts payable heads',webinar_type:'educational',key_takeaways:'Count exceptions; name the approval owner.'});
 const t=r.content.map(c=>c.text||'').join('\n');
 const block=t.split('### Main Content Block 1')[1].split('### Main Content Block 2')[0];
 assert.match(block,/HOST PREPARATION, NOT SPOKEN/);assert.doesNotMatch(block,/\*\*SPEAKER:\*\*/);
});
