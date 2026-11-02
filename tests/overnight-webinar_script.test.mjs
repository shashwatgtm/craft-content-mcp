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

test('scoped equivalent webinar tasks remain whole and need the same exercise evidence',async()=>{
 for(const your_sector of ['logistics_tech','fintech','saas','vertical_saas','ai_native','ites','telecom','software','cybersecurity']){
  const r=await call('webinar_script',{topic:'Review exceptions before changing the process',target_audience:'Operations head',webinar_type:'educational',your_sector,your_product:'Workflow support for exception review',key_takeaways:'For one batch, count exceptions, identify the approval owner and compare completion time before and after the change.'});
  const s=r.content.map(c=>c.text||'').join('\n');
  const takeaways=s.split('## Key Takeaways for Audience')[1].split('## Run of Show')[0];
  assert.match(takeaways,/for one batch, count exceptions, identify the approval owner and compare completion time before and after the change/i);
  assert.doesNotMatch(s,/Part one covers for one batch\.|1\. For one batch\n|Workflow support is workflow support|at Operations head/);
  for(let i=1;i<=3;i++){
   const block=s.split('### Main Content Block '+i)[1].split('### ')[0];
   assert.match(block,/HOST PREPARATION, NOT SPOKEN/);
   if(i===1) assert.doesNotMatch(block,/\*\*SPEAKER:\*\*/);
   else { assert.match(block,/\*\*SPEAKER:\*\*/); assert.match(block,i===2?/Leave a missing value unknown/:/keep the outcome claim on hold/); }
   assert.doesNotMatch(block,/we (?:completed|demonstrated)|you (?:completed|achieved)|results? (?:showed|proved)/i);
  }
 }
});
test('outcome limits survive webinar agenda, recap and follow-up without becoming product benefits',async()=>{
 for(const key_takeaways of ['Keep exceptions unchanged until the approval owner and starting records are confirmed. Do not promise a faster process.','Do not claim that exceptions became faster. No time comparison has been completed.']){
  const r=await call('webinar_script',{topic:'Review exceptions',target_audience:'Operations head',webinar_type:'educational',your_product:'Workflow support for exceptions',your_sector:'saas',key_takeaways});
  const s=r.content.map(c=>c.text||'').join('\n');
  for(const label of ['### Agenda & Learning Objectives','### Summary & Key Takeaways','### Email 1: Same day']){
   const part=s.split(label)[1].split('### ')[0];assert.match(part,/stated limit/);assert.match(part,/Do not promise|do not claim/i);
  }
  assert.doesNotMatch(s,/what Workflow support brings|concern we hear most|concern from the session|baseline to beat|number to beat/);
 }
});

 test('missing takeaways do not make sector defaults into a supplied teaching example', async()=>{
 const r=await call('webinar_script',{topic:'Review dispatch exceptions',target_audience:'Operations head',webinar_type:'educational',your_sector:'logistics_tech'});
 const s=r.content.map(c=>c.text||'').join('\n');
 const block=s.split('### Main Content Block 1')[1].split('### Main Content Block 2')[0];
 assert.match(block,/HOST PREPARATION, NOT SPOKEN/); assert.doesNotMatch(block,/\*\*SPEAKER:\*\*/);
 assert.match(s,/Possible buying group, to confirm/);assert.match(s,/Possible objections to check/);
 assert.doesNotMatch(s,/where you stand on on time/);
});
