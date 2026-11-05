import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const alpha=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).name.includes('gtm-alpha');
const {regionalInputs}=await import(alpha?'../netlify/lib/region-adapter.js':'../dist/region-adapter.js');
const {readRegionContext,regionNotes}=await import(alpha?'../netlify/lib/region-reader.js':'../dist/region-reader.js');
for(const field of ['source_content','your_take','content','gtm_challenge','challenge'])for(const [text,want] of [
 ['We stopped selling lending software in India. We now sell in Singapore.',['SG']],
 ['We used to sell lending software in India but now only sell in Singapore.',['SG']],
 ['We ceased selling lending software in Singapore. We now sell in India.',['IN']],
 ['We used to sell lending software in Singapore but now only sell in India.',['IN']],
 ['We stopped selling lending software in India.',[]],
 ['We used to sell lending software in India.',[]],
 ['We now sell lending software in India.',['IN']],
 ['A customer said "We now sell lending software in India."',[]]
])test(field+': '+text,()=>{
 const args=regionalInputs({[field]:text});let previous;
 for(let i=0;i<3;i++){
  assert.deepEqual(readRegionContext(args).regions.flatMap(r=>r.countries),want);
  const output=regionNotes(args);if(i)assert.equal(output,previous);previous=output;
 }
});
