import {checkReader} from './overnight-reader-helper.mjs';
checkReader("craft_content_improver", [{"index": 0, "key": "content", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "content_type", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "content", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "audience", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "goal", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {call} from './overnight-reader-helper.mjs';
test('Overnight improver: a cosmetic edit cannot produce copy-ready unsupported guarantees',async()=>{
 const r=await call('craft_content_improver',{content:'Our revolutionary AI guarantees 50% faster claim resolution for every insurer. We have not measured resolution time.',content_type:'landing_page'});
 const text=r.content.map(c=>c.text||'').join('\n');const improved=text.split('## Improved Version')[1].split('## Before/After Comparison')[0];
 assert.match(improved,/Publication held/);assert.doesNotMatch(improved,/Our AI guarantees/);assert.match(text,/NOT PROVED YET/);
});

test('active and passive outcome promises keep the same publication hold across sectors',async()=>{
 for(const your_sector of ['logistics_tech','fintech','saas','vertical_saas','ai_native','ites','telecom','software','cybersecurity']) {
  for(const content of ['We guarantee a 50% reduction in review exceptions for every customer. No outcome study supports this claim.','Every customer is promised half as much review work. There is no outcome study supporting that promise.']){
   const r=await call('craft_content_improver',{content,content_type:'landing_page',goal:'Publish a defensible service page',your_sector});
   const s=r.content.map(x=>x.text||'').join('\n');
   assert.match(s,/NOT PROVED YET/);assert.match(s,/Publication held/);assert.match(s,/claim needs proof/);
   assert.doesNotMatch(s,/Yes: No unproven claims|You.ll save time|each field reduces conversion/);
   assert.doesNotMatch(s.split('## Improved Version')[1].split('## Before/After')[0],/> Every customer is promised|> We guarantee/);
  }
 }
});
test('a denied promise is retained as a limit rather than an asserted benefit',async()=>{
 for(const content of ['We do not promise a reduction in review exceptions. Measure one batch before deciding whether to change the process.','We cannot substantiate a 50% reduction in review exceptions. No such outcome should be claimed.']){
  const r=await call('craft_content_improver',{content,content_type:'landing_page',goal:'Publish a defensible service page'});
  const s=r.content.map(x=>x.text||'').join('\n');
  assert.doesNotMatch(s,/Evidence missing:|claim needs proof/);
  assert.match(s,/retain the stated outcome limit/);assert.match(s,/does not turn a denied outcome into a benefit/);
 }
});
