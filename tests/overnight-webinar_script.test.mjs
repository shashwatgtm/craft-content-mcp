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


test('how-to guide takeaways need an example and pending guests stay out of spoken copy',async()=>{
 const args={topic:'What to inventory before AI agents call your APIs',target_audience:'Security leaders and AI platform owners',webinar_type:'educational',your_sector:'cybersecurity',key_takeaways:'How to find every AI agent and MCP server already calling your APIs\nHow to decide which agent actions need a person to approve them\nHow to test an agent for prompt injection before it reaches production',speakers:'Host, Head of Product Marketing; Speaker, Head of Security Research; Guest, a security leader from a customer (approval pending)',product_mention_level:'none'};
 const r=await call('webinar_script',args);const s=r.content.map(c=>c.text||'').join('\n');
 const block=s.split('### Main Content Block 1')[1].split('### Main Content Block 2')[0];
 assert.match(block,/HOST PREPARATION, NOT SPOKEN/);assert.doesNotMatch(block,/\*\*SPEAKER:\*\*/);
 const spoken=[...s.matchAll(/\*\*SPEAKER:\*\*\n"([\s\S]*?)"\n/g)].map(m=>m[1]).join('\n');
 assert.doesNotMatch(spoken,/approval pending|a security leader from a customer|how to how to/);
 assert.match(spoken,/Head of Security Research/);assert.match(s,/Speaker approval still needed/);
 assert.match(s,/You will learn how to find every AI agent/);
 assert.doesNotMatch(s,/accuracy on the buyer's own data/);
 const approved=await call('webinar_script',{...args,speakers:'Guest, a security leader from a customer (approved)'});
 assert.match(approved.content.map(c=>c.text||'').join('\n'),/With us today: Guest, a security leader from a customer \(approved\)/);
});
test('a customer-story guest awaiting approval holds guest-dependent spoken sections',async()=>{
 const r=await call('webinar_script',{topic:'Reviewing approvals',target_audience:'Operations heads',webinar_type:'customer_story',speakers:'Host, Marketing lead; Guest, Customer operations head (not yet confirmed)',key_takeaways:'Compare the starting records and current records'});
 const s=r.content.map(c=>c.text||'').join('\n');const script=s.split('## Full Script')[1].split('## Q&A')[0];
 assert.match(script,/Customer participation awaits approval/);assert.doesNotMatch(script,/\*\*SPEAKER:\*\*/);
 assert.match(s,/not yet confirmed/);
});

test('workshop exercises and debriefs require a supplied case and produce a defined record',async()=>{
 const args={topic:'Review invoice exceptions',target_audience:'Accounts payable heads',webinar_type:'workshop',key_takeaways:'Count exceptions in one batch; identify the approval owner; compare completion time before and after the change.',your_sector:'fintech'};
 for(const ready of [false,true]){
  const r=await call('webinar_script',{...args,key_takeaways:args.key_takeaways+(ready?'\nExample: Six invoices lacked an approval owner in one reviewed batch. No time saving was measured.':'')});
  const s=r.content.map(c=>c.text||'').join('\n');
  for(const name of ['Exercise 1','Debrief 1','Exercise 2','Debrief 2']){
   const section=s.split('### '+name+' (')[1].split('### ')[0];
   assert.match(section,ready?/\*\*SPEAKER:\*\*/:/HOST PREPARATION, NOT SPOKEN/);
   if(!ready)assert.doesNotMatch(section,/\*\*SPEAKER:\*\*/);
  }
  if(ready){assert.match(s,/Here is the supplied case: Six invoices/);assert.match(s,/Your output is one decision record/);assert.match(s,/comparison decision with its limits/);assert.match(s,/No time saving was measured/);}
  assert.doesNotMatch(s,/how to Count|week, Count|incident count/);
 }
});
test('product demos hold unprepared screens and preserve a supplied case as a rehearsal draft',async()=>{
 const args={topic:'Review exceptions',target_audience:'Operations heads',webinar_type:'product_demo',key_takeaways:'Count exceptions; identify the owner; compare the records'};
 const missing=(await call('webinar_script',args)).content.map(c=>c.text||'').join('\n');
 for(const i of [1,2,3]){const section=missing.split('### Feature Demo '+i+' (')[1].split('### ')[0];assert.match(section,/HOST PREPARATION, NOT SPOKEN/);assert.match(section,/these lines explain review criteria only/);assert.doesNotMatch(section,/I will show it live|Here is the supplied case/);}
 assert.doesNotMatch(missing,/I will show it live/);
 const ready=(await call('webinar_script',{...args,key_takeaways:args.key_takeaways+'\nExample: Six records lack an owner. No improvement was measured.'})).content.map(c=>c.text||'').join('\n');
 assert.match(ready,/Here is the supplied case: Six records lack an owner/);assert.match(ready,/Rehearse the decision and owner check in the approved environment/);assert.match(ready,/No improvement was measured/);
});
test('customer-story introductions select the guest rather than a labelled host',async()=>{
 const r=await call('webinar_script',{topic:'Approval review',target_audience:'Operations heads',webinar_type:'customer_story',speakers:'Mira, Host; Arun, Customer operations head'});const s=r.content.map(c=>c.text||'').join('\n');
 assert.match(s,/Our guest is Arun, Customer operations head/);assert.doesNotMatch(s,/Our guest is Mira|Mira, please tell us/);
 assert.match(s,/Guest questions do not establish a customer result/);assert.match(s,/decision the discussion must inform/);
});
