import test from 'node:test';import assert from 'node:assert/strict';
const {answerFor}=await import((process.env.WAVE4_TEST_HOME||process.cwd())+'/dist/sector.js');
for(const v of ['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'])test('C12 '+v+' objection helper reads price and contrast',()=>{
 for(const text of ['Price is too high','It is more money than we planned'])assert.match(answerFor(v+': '+text,null),/cost of the problem|numbers|price/i);
 assert.doesNotMatch(answerFor(v+': Price is not an issue',null),/trade any concession|cost of the problem/);
 assert.match(answerFor(v+': Price is not an issue, but security is a concern',null),/security|compliance/);
});
