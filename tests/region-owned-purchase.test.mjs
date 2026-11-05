import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const alpha=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).name.includes('gtm-alpha');
const {regionalInputs}=await import(alpha?'../netlify/lib/region-adapter.js':'../dist/region-adapter.js');
const {readRegionContext}=await import(alpha?'../netlify/lib/region-reader.js':'../dist/region-reader.js');
for(const field of ['source_content','your_take','content','gtm_challenge','challenge'])test('Owned purchase market in '+field,()=>{
 const args={[field]:'A London bank is buying our lending software from our Singapore office.'};
 assert.deepEqual(readRegionContext(regionalInputs(args)).regions.flatMap(r=>r.countries),['GB']);
});
for(const text of [
 'A London bank is not buying our lending software from our Singapore office.',
 'A London bank might be buying our lending software from our Singapore office.',
 'A London bank is buying our competitor lending software from a Singapore office.',
 'A customer said "A London bank is buying our lending software from our Singapore office."'
])test('Unestablished or quoted purchase does not establish market: '+text,()=>{
 assert.deepEqual(readRegionContext(regionalInputs({source_content:text})).regions,[]);
});
