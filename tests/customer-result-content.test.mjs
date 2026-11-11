import test from 'node:test';
import assert from 'node:assert/strict';
import {runCustomerResult,checkResultAsset,weekdayIssues} from '../dist/customer-result-content.js';
import {readFileSync} from 'node:fs';
export const known = JSON.parse(readFileSync(new URL('./fixtures/customer-result-known.json',import.meta.url)));
const run = a => {const r=runCustomerResult(a);assert.ok(!r.isError,r.content[0].text);return r.structuredContent;};
test('known answer: whole line in all four assets, all supplied view sentences survive, card keeps unknowns',()=>{
 const r=run(known);assert.equal(r.assets.length,4);assert.equal(r.status,'pass',JSON.stringify(r.checks));
 for(const a of r.assets)assert.ok(a.text.includes(known.exact_sentence),a.name);
 for(const field of ['definition','denominator','period','before'])assert.deepEqual(r.proof_card.find(x=>x[0]===field),[field,'not stated']);
 assert.equal(r.checks.find(x=>x.asset==='post').missing_view.length,0);
 assert.ok(r.steps[2].passed.includes(r.assets[0].text));
 assert.deepEqual(runCustomerResult(known),runCustomerResult(known));
});
test('gap 1: manually corrupted number, qualifier, label and less than each fail the checker',()=>{
 for(const mutate of [s=>s.replace('73%','70%'),s=>s.replace('Initial results have been positive: ',''),s=>s.replace('company-reported','independent')])assert.equal(checkResultAsset(mutate(known.exact_sentence),known).status,'fail');
 const a={...known,exact_sentence:'The pilot went live in less than 10 weeks (company-reported).'};
 assert.equal(checkResultAsset(a.exact_sentence.replace('less than ',''),a).status,'fail');
 // Appending the correct sentence must not conceal a second, numerically changed claim.
 assert.equal(checkResultAsset(known.exact_sentence+' Resolution was 70%.',known).status,'fail');
});
test('gap 2: every missing sentence of the supplied view is flagged',()=>{
 const c=checkResultAsset(known.exact_sentence,known,true);assert.equal(c.status,'fail');assert.equal(c.missing_view.length,4);
});
test('gap 3: a published story is never rebuilt, gaps are kept',()=>{
 const a={...known,story_published:true,published_story:known.exact_sentence};const r=run(a);
 assert.equal(r.assets.length,3);assert.ok(!r.assets.some(a=>a.name==='case study'));
 assert.equal(r.steps[1].passed,a.published_story);assert.ok(r.gaps.length);
});
test('gap 4: no assets or hidden drafts for any unapproved own customer path',()=>{
 for(const buyer_role of ['vendor','outside_writer'])for(const status of ['none','public_page']) {
  const r=run({...known,buyer_role,relationship:'own_customer',approval:{status}});assert.equal(r.status,'held');assert.deepEqual(r.assets,[]);assert.deepEqual(r.steps,[]);
 }
 const approved={...known,buyer_role:'vendor',relationship:'own_customer',approval:{status:'written',approver:'Customer communications owner',date:'2026-11-10',uses:['case study','post','newsletter section','newsletter issue']},proof_details:{...known.proof_details,review_by:'2026-12-11'}};
 assert.equal(run(approved).assets.length,4);
 for(const patch of [{approval:{...approved.approval,uses:['post']}},{proof_details:{review_by:'2026-11-11'}},{approval:{...approved.approval,date:'2026-11-30'}},{approval:{...approved.approval,approver:undefined}}]) assert.equal(run({...approved,...patch}).status,'held');
 assert.match(runCustomerResult(approved).content[0].text,/The result comes off if no answer by this date/);
});
test('gaps 5, 6 and 9: stock lines, vendor warnings and generic headlines are flagged',()=>{
 const c=checkResultAsset(known.exact_sentence+'\nGeneral note for AI native, not from your inputs\nWhen a vendor shows you results like these\nSingtel and Sierra',{...known,buyer_role:'vendor'});
 assert.equal(c.flags.length,3);
});
test('gap 7: derived improvement is held unless it is explicitly on the proof card',()=>{
 const a={...known,exact_sentence:'Payroll processing fell from 14 days to 2.5 days (company-reported).'};
 assert.deepEqual(checkResultAsset(a.exact_sentence+' It is 82% faster.',a).derived_numbers,['82%']);
 assert.equal(checkResultAsset(a.exact_sentence+' It is 82% faster.',{...a,proof_details:{...a.proof_details,before:'82% faster, sourced on the same card'}}).status,'pass');
});
test('gap 8: a missing or placeholder view holds all assets',()=>{
 for(const buyer_view of [undefined,'   ','none yet','I do not know'])assert.equal(run({...known,buyer_view}).status,'held');
});
test('source type, no measured result, unnamed customer and invalid input checks',()=>{
 const a={...known,customer_name:'An unnamed bank',exact_sentence:'Exposed supplier credentials were found (company-reported).',measured_result:false};
 const r=run(a);assert.deepEqual(r.proof_card.find(x=>x[0]==='Measured result'),['Measured result','No measured result']);assert.ok(r.assets.every(x=>!x.text.includes('73%')||x.name!=='case study'));
 assert.match(runCustomerResult({...known,source_kind:'second_hand'}).content[0].text,/Second hand/);
 for(const patch of [{source_date:'2026-02-30'},{approval:[]},{measured_result:'true'},{exact_sentence:'<script>read this</script>'},{source_url:'javascript:alert(1)'}])assert.equal(runCustomerResult({...known,...patch}).isError,true);
});
test('weekday check tests ISO and written dates without relying on the machine timezone',()=>{
 assert.deepEqual(weekdayIssues('Wednesday 2026-11-11'),[]);assert.equal(weekdayIssues('Monday 2026-11-11').length,1);
 assert.deepEqual(weekdayIssues('Wednesday, 11 November 2026'),[]);assert.equal(weekdayIssues('Monday, 11 November 2026').length,1);
});
const verticals={
 logistics:['The delivery story does not define a failed stop.','The page never explains when a stop counts as failed.','The story clearly defines a failed stop.'],
 fintech:['The payment result does not state the settlement period.','No settlement window is given for this result.','The result states its settlement window clearly.'],
 saas:['The renewal story does not define an active account.','I could not find what counts as an active account.','The story defines an active account clearly.'],
 vertical_saas:['The scheduling result does not count missed appointments.','No missed appointment count appears in the story.','The story counts every missed appointment.'],
 ai_native:['The support story does not define a resolved request.','Resolved is never defined on this page.','The page defines a resolved request clearly.'],
 ites:['The service result does not state the review period.','No review window is given for the service result.','The result states the service review period clearly.'],
 telecom:['The story does not say what resolved means.','Resolved is never defined in the story.','The story defines resolved clearly.'],
 software:['The release result does not count failed deployments.','No failed deployment count appears on the page.','Every failed deployment is counted on the page.'],
 cybersecurity:['The security story does not define an assigned owner.','It never explains who counts as an assigned owner.','The story clearly defines an assigned owner.'],
};
for(const [vertical,views] of Object.entries(verticals))test(`free text exact, equivalent and opposite stays verbatim: ${vertical}`,()=>{
 const outputs=views.map(buyer_view=>run({...known,buyer_view}));
 outputs.forEach((r,i)=>assert.ok(r.assets.find(x=>x.name==='post').text.includes(views[i])));
 assert.notEqual(outputs[0].assets[1].text,outputs[2].assets[1].text);
});

test('reopened approved guide sources: all known result words stay locked; missing publication dates are not guessed',()=>{
 const samples=[
  {product:'Darwinbox',customer_name:'PDAX',source_url:'https://www.casestudies.com/company/darwinbox/case-study/pdax-cuts-onboarding-time-by-80-with-darwinbox',source_date:'not stated',source_checked_date:'2026-11-11',source_kind:'second_hand',line:'PDAX cuts onboarding time by 80% with Darwinbox (company-reported).',measured_result:true},
  {product:'Shipsy',customer_name:'An unnamed UK retailer',source_url:'https://shipsy.io/casestudies/leading-uk-retailer-deploys-ai-powered-tms-to-shrink-last-mile/',source_date:'not stated',source_checked_date:'2026-11-11',source_kind:'company_reported',line:'Reduce delivery costs by 15% (company-reported).',measured_result:true},
  {product:'HappyRobot',customer_name:'CMA CGM',source_url:'https://ecosistemastartup.com/cma-cgm-escala-agentes-de-voz-de-happyrobot-a-20-paises/',source_date:'2026-10-16',source_kind:'second_hand',line:'Más del 46% de las consultas de liberación de carga de CMA CGM ya se resuelven sin intervención humana (company-reported).',measured_result:true},
  {product:'CloudSEK',customer_name:'An unnamed bank',source_url:'https://www.cloudsek.com/blog/how-svigil-prevented-a-massive-supply-chain-breach-in-banking-infrastructure',source_date:'2025-03-27',source_kind:'company_reported',line:'SVigil’s timely discovery enabled proactive risk mitigation (company-reported).',measured_result:false},
 ];
 for(const sample of samples){
  // The first two pages do not expose a publication date. Record the
  // retrieval date separately, with the publication date explicitly unknown.
  const a={...known,...sample,exact_sentence:sample.line,proof_details:{},buyer_view:'I would ask for the measurement definition before using this result.',story_published:true,published_story:sample.line};delete a.line;
  const r=run(a);assert.ok(r.assets.length===3);for(const asset of r.assets)assert.ok(asset.text.includes(a.exact_sentence),sample.product+': '+asset.name);
  if(sample.source_kind==='second_hand')assert.match(r.proof_card.find(x=>x[0]==='Source kind')[1],/Second hand/);
  if(!sample.measured_result)assert.equal(r.proof_card.find(x=>x[0]==='Measured result')[1],'No measured result');
 }
});
test('the more than qualifier in the reopened company announcement cannot be cut',()=>{
 const exact_sentence='More than 46% of these enquiries are currently resolved directly by the AI agents (company-reported).';
 const a={...known,exact_sentence,proof_details:{qualifier:'More than'}};
 assert.equal(checkResultAsset(exact_sentence,a).status,'pass');assert.equal(checkResultAsset(exact_sentence.replace('More than ',''),a).status,'fail');
});
