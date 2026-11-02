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
test('Overnight repurposer: complete subjects, one result and the supplied reader action survive conversion',()=>{
 const out=generateContentRepurposer({source_content:source+' Ask readers to measure one dispatch shift before changing their process.',source_type:'blog_post'});
 const email=out.split('### Email Version')[1].split('### Blog Summary')[0];
 const subject=email.match(/^Subject: (.+)$/m)[1];assert.doesNotMatch(subject,/from four$|\.\.\.$/);assert.match(email,/Measure one dispatch shift before changing your process/);assert.doesNotMatch(email,/Confirm the reader action/);
 const linkedin=out.split('### LinkedIn Post')[1].split('### Twitter')[0];assert.equal((linkedin.match(/A regional fleet pilot reduced route adjustment time/g)||[]).length,1);assert.doesNotMatch(linkedin,/Ask readers to/);
 const cards=out.split('### Quote Cards')[1].split('## Source Notes')[0].split(/\*\*(?:Quote|Stat) Card \d+:\*\*/).slice(1);
 assert.ok(cards.length);for(const card of cards)assert.match(card,/uncontrolled pilot/);
});

test('a separate key message does not duplicate an already displayed proof point',()=>{
 const s=generateContentRepurposer({source_content:source,source_type:'blog_post',key_message:'Review a dispatch handoff before changing the process'});
 for(const [start,end] of [['### LinkedIn Post','### Twitter'],['### Twitter','### Email'],['### Email','### Blog']]){
  const section=s.split(start)[1].split(end)[0].split('Other subject lines to test:')[0];
  assert.equal((section.match(/A regional fleet pilot reduced route adjustment time/g)||[]).length,1);
  assert.match(section,/uncontrolled pilot/);
 }
});

test('alternate email subjects do not repeat the same source clause under two labels',()=>{
 const s=generateContentRepurposer({source_content:source,source_type:'blog_post',key_message:'Review a dispatch handoff before changing the process'});
 const alts=s.match(/Other subject lines to test: (.+)/)?.[1] || '';
 assert.ok((alts.match(/A regional fleet pilot reduced route adjustment time/g)||[]).length <= 1);
});

test('equivalent word-number source comparison is evidence without changing its meaning',()=>{
 const source_content="Across ten reviewed days in October, one customer's handling of dispatch exceptions took three hours instead of four. The pilot was uncontrolled and gives no promise for another team.";
 const s=generateContentRepurposer({source_content,source_type:'blog_post'});
 assert.match(s,/Proof Items Found\*\* \| 1/);assert.doesNotMatch(s,/Not given: a proof line/);assert.match(s,/took three hours instead of four/);
 const cards=s.split('### Quote Cards')[1].split('## Source Notes')[0];assert.equal((cards.match(/took three hours instead of four/g)||[]).length,1);
 for(const qualifier of ['A hypothetical customer pilot took three hours instead of four.','A customer pilot did not take three hours instead of four.','A customer pilot could take three hours instead of four.']){
  const t=generateContentRepurposer({source_content:qualifier,source_type:'blog_post'});
  assert.match(t,/Proof Items Found\*\* \| 0/);
 }
});
test('each standalone card retains unmeasured and no-improvement limitations',()=>{
 const s=generateContentRepurposer({source_content:'One customer pilot did not reduce dispatch exceptions from four to three hours. The result is unmeasured. No numerical improvement may be claimed.',source_type:'blog_post'});
 const cards=s.split('### Quote Cards')[1].split('## Source Notes')[0].split(/\*\*(?:Quote|Stat) Card \d+:\*\*/).slice(1);
 assert.ok(cards.length);for(const card of cards){assert.match(card,/result is unmeasured/);assert.match(card,/No numerical improvement may be claimed/);}
});
test('email copy separates missing metadata from the complete draft body',()=>{
 const s=generateContentRepurposer({source_content:source,source_type:'blog_post',target_formats:'email,newsletter_section'});
 const email=s.split('### Email Version')[1].split('### Newsletter Section')[0];
 assert.match(email,/Email held for completion/);assert.match(email,/reader action, source link and sender/);
 const body=email.split('---')[1];assert.doesNotMatch(body,/Confirm the reader action|Source link: unknown|Sender: unknown|confirm before sending/);
 const ready=generateContentRepurposer({source_content:source+'\nReader action: Measure one shift before changing the process.\nSource URL: https://example.com/pilot\nSender: Editorial team',source_type:'blog_post',target_formats:'email'});
 assert.doesNotMatch(ready,/Email held for completion/);assert.match(ready,/Measure one shift before changing the process/);assert.match(ready,/Read the full blog post: https:\/\/example.com\/pilot/);assert.match(ready,/Editorial team/);
});
