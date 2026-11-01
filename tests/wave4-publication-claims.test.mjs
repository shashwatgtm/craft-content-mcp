import test from 'node:test';import assert from 'node:assert/strict';
const {claimsToSource}=await import((process.env.WAVE4_TEST_HOME||process.cwd())+'/dist/draft.js');
for(const v of ['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'])test('C12 '+v+' publication claims',()=>{
 for(const phrase of ['We are the first and only platform','No other platform covers this work'])assert.ok(claimsToSource([v+': '+phrase]).length>0);
 assert.equal(claimsToSource([v+': We are not the first and only platform']).length,0);
});
