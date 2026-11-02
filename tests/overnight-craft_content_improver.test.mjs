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
