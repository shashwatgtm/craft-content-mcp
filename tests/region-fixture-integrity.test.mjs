import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {NO_REGION_SUFFIX} from '../dist/region-reader.js';
const original={
  "case-study-complete-2.2.12.txt": "25259ec1711e1f32ff546dfd691fedca688a7d0a"
};
for(const [name,sha]of Object.entries(original))test('Saved output changes only by the exact region clarification: '+name,()=>{
 const current=readFileSync(new URL('./fixtures/'+name,import.meta.url),'utf8');
 assert.ok(current.endsWith(NO_REGION_SUFFIX));
 const before=Buffer.from(current.slice(0,-NO_REGION_SUFFIX.length));
 assert.equal(createHash('sha1').update('blob '+before.length+'\0').update(before).digest('hex'),sha);
});

