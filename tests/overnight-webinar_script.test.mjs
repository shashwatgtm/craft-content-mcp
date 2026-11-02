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

test('before and after wording in bare actions does not invent prepared teaching',async()=>{
 const r=await call('webinar_script',{topic:'Reduce invoice exceptions before the payment run',target_audience:'Accounts payable heads at regional insurers',webinar_type:'educational',key_takeaways:'Count exceptions; name an approval owner; compare cycle time before and after one batch.',your_product:'Invoice processing service'});
 const s=r.content.map(c=>c.text||'').join('\n');
 const block=s.split('### Main Content Block 1')[1].split('### Main Content Block 2')[0];
 assert.match(block,/HOST PREPARATION, NOT SPOKEN/);
 assert.match(s,/You will learn how to count exceptions/);
 assert.doesNotMatch(s,/brings: Count exceptions/);
 const spoken=[...s.matchAll(/\*\*SPEAKER:\*\*\n"([\s\S]*?)"\n/g)].map(m=>m[1]).join('\n');
 assert.doesNotMatch(spoken,/LAUNCH POLL|Poll options:/);
 assert.match(s,/\*\*LAUNCH POLL:/);
 const count=Number(s.match(/Timing check: (\d+) words/)[1]);
 assert.equal(count,[...s.matchAll(/\*\*SPEAKER:\*\*\n"([\s\S]*?)"\n/g)].reduce((n,m)=>n+m[1].trim().split(/\s+/).filter(Boolean).length,0));
 assert.match(s,/not a claim that this text fills that time/);
});
