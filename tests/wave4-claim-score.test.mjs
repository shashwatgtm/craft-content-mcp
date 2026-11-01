import test from 'node:test';import assert from 'node:assert/strict';
const home=process.env.WAVE4_TEST_HOME||process.cwd();const {analyzeContent}=await import(home+'/dist/utils.js');
for(const v of ['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'])test('C12 '+v+' claims require affirmation',()=>{
 const claims=t=>analyzeContent(t,'social_post','inform').findings.filter(f=>f.rule==='superlative');
 for(const t of ['Our product is the only option.','Our product is one of a kind.'])assert.ok(claims(v+': '+t).length>0,t);
 assert.equal(claims(v+': We are not the only option.').length,0);
 assert.equal(claims(v+': We might be the only option.').length,0);
});

for(const v of ['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'])test('C12 '+v+' rejected wording is not a positive finding',()=>{
 const r=analyzeContent(v+': We avoid words like leverage, robust and streamline. No placeholders such as {{first_name}} remain in this note.','sales_email','teach buyers how this works');
 assert.ok(!r.findings.some(f=>['buzzwords','merge-field'].includes(f.rule)),JSON.stringify(r.findings));
 const g=analyzeContent(v+': How can your teams review your costs with your own records?','sales_email','teach sales heads at consumer goods brands how this works');assert.ok(!g.findings.some(f=>f.rule==='brand'));
});
