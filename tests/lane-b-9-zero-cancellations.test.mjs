import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateCaseStudy} from '../dist/case-study-generator.js';
const facts=JSON.parse(readFileSync(new URL('./fixtures/release-field-facts.json',import.meta.url)));
for(const f of facts.filter(f=>['saas','ites','telecom'].includes(f.id))){
 const base={customer_name:'Anonymous pilot team',your_product:f.product,challenge:f.pain,solution:f.capability};
 test(`${f.id}: zero cancelled orders is a count to verify, not an adverse result`,()=>{
  for(const results of ['The October pilot recorded zero cancelled orders across ten operating days.','The October pilot recorded 0 canceled orders across ten operating days.','The October pilot recorded no cancelled orders across ten operating days.']){
   const out=generateCaseStudy({...base,results});assert.doesNotMatch(out,/Publication held: adverse customer result/);assert.match(out,/starting value|baseline/i);assert.match(out,/timeframe|measurement period/i);assert.match(out,/permission|approv/i);
   assert.equal(out,generateCaseStudy({...base,results}));
  }
  for(const results of ['Cancelled orders rose 40% during the October pilot.','The October pilot recorded zero cancelled orders but costs rose 40%.']){
   assert.match(generateCaseStudy({...base,results}),/Publication held: adverse customer result/);
  }
  const missing=generateCaseStudy({...base,results:'No measured results. Zero cancelled orders is an illustrative target only.'});
  assert.doesNotMatch(missing,/\*\*Lead result\*\* \| .*Zero cancelled/);
 });
}
