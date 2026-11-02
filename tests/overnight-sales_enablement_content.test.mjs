import {checkReader} from './overnight-reader-helper.mjs';
checkReader("sales_enablement_content", [{"index": 0, "key": "proof_points", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "product", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "proof_points", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "target_persona", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "common_objections", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {generateSalesEnablement} from '../dist/sales-enablement.js';
const salesBase={product:'Network incident automation',target_persona:'NOC director',proof_points:'No measured customer result supplied.',common_objections:'Our NOC already has an incident tool. We cannot risk automatic changes on the live network.',your_sector:'telecom'};
test('compound incumbent objection preserves live operational risk and approval gate',()=>{
 const s=generateSalesEnablement(salesBase);
 const h=s.split('## Objection Handlers')[1].split('## Competitive Responses')[0];
 assert.match(h,/operational risk objection/);
 assert.match(h,/non-production simulation/);
 assert.match(h,/named approver, agreed stop conditions and a tested rollback/);
 assert.match(h,/No supplied result establishes safe changes/);
 const opposite=generateSalesEnablement({...salesBase,common_objections:'Our NOC already has an incident tool. We see no risk from automatic changes on the live network.'});
 assert.doesNotMatch(opposite,/operational risk objection/);
});
test('follow-up emails ask for confirmation without invented call notes or writing prompts',()=>{
 const s=generateSalesEnablement(salesBase);
 const emails=s.split('## Follow-Up Templates')[1].split('## Call Prep Checklist')[0];
 assert.match(emails,/could you confirm the workflow/);
 assert.match(emails,/Which part, if any, fits/);
 assert.doesNotMatch(emails,/fill these in|the moment they|specific action and date|addresses this|What we covered|relevant case study and/);
 for(const sales_stage of ['prospecting','demo','negotiation','closing']) {
  const stage=generateSalesEnablement({...salesBase,sales_stage}).split('## Pitch Script by Stage')[1].split('## Objection Handlers')[0];
  assert.doesNotMatch(stage,/You mentioned this pain|You told us|often tell us|recap what you told us|Add what similar customers|Share a result from a customer/);
 }
});
test('competitive response does not rotate unrelated proof into the comparison',()=>{
 const s=generateSalesEnablement({...salesBase,proof_points:'One retailer reduced invoice processing time by 25%.',competitor_objections:'Why not our incumbent network operator?'});
 const comparison=s.split('## Competitive Responses')[1].split('## Price Justification')[0];
 assert.doesNotMatch(comparison,/reduced invoice processing/);
 assert.match(comparison,/None of your proof points compares the two/);
});

test('ROI introduction distinguishes explicitly attributed customer outcomes from a bare pilot',()=>{
 const attributed=generateSalesEnablement({...salesBase,proof_points:'Not a hypothetical example: the customer measured a 30% cost reduction over six months and approved the result.'});
 assert.match(attributed,/Let me share what customers have seen:/);
 const pilot=generateSalesEnablement({...salesBase,proof_points:'One October pilot reduced median recovery time from 80 to 50 minutes across 12 incidents; not controlled.'});
 assert.doesNotMatch(pilot,/Let me share what customers have seen:/);
 assert.match(pilot,/supplied result, with its scope and limitations/);
});

test('denying operational concern does not select a live-risk objection script',()=>{
 for(const common_objections of ['We are not worried about automatic actions. Our concern is price.','We are not concerned about automatic actions in production. We already have a provider.','The automatic process is not unsafe. We need to compare the cost.']){
  const s=generateSalesEnablement({...salesBase,common_objections});
  assert.doesNotMatch(s,/an operational risk objection|Would a read-only review or a non-production simulation/);
 }
 const s=generateSalesEnablement({...salesBase,common_objections:'We are worried about automatic actions in production.'});
 assert.match(s,/an operational risk objection/);assert.match(s,/tested rollback/);
});

const reviewedArgs={product:'Workflow for hotel booking exceptions used by the hotel operations head',target_persona:'hotel operations head',your_sector:'vertical_saas',common_objections:'We already have a workflow for hotel booking exceptions. We cannot interrupt live work.'};
test('equivalent observed sales comparisons keep period, sample and uncontrolled scope',()=>{
 for(const proof_points of ['One October pilot reduced time spent handling hotel booking exceptions from 80 to 50 minutes across 12 cases. The pilot was not controlled.','Across 12 cases in October, one uncontrolled pilot recorded 50 minutes for handling hotel booking exceptions instead of 80.']){
 const s=generateSalesEnablement({...reviewedArgs,proof_points});
 const social=s.split('**Social Proof (3 min):**')[1].split('**Questions')[0];
 assert.match(social,/October/);assert.match(social,/12 cases/);assert.match(social,/80/);assert.match(social,/50/);assert.match(social,/not controlled|uncontrolled/);
 assert.doesNotMatch(social,/No supported success evidence/);
 assert.doesNotMatch(s,/it speaks to adoption|Subject: Workflow for hotel booking\b/);
 }
});
test('adverse time comparisons stay out of the sales pitch and remain in source notes',()=>{
 for(const proof_points of ['One October pilot increased time spent handling hotel booking exceptions from 50 to 80 minutes across 12 cases. The pilot was not controlled.','Across 12 cases in October, one uncontrolled pilot recorded 80 minutes for handling hotel booking exceptions instead of 50.']){
 const s=generateSalesEnablement({...reviewedArgs,proof_points});
 assert.match(s,/Proof held out of sales copy/);
 const social=s.split('**Social Proof (3 min):**')[1].split('**Questions')[0];
 assert.match(social,/No supported success evidence/);assert.doesNotMatch(social,/80 minutes|from 50/);
 assert.match(s.split('## Quick Stats to Quote')[1],/October/);assert.match(s,/adverse/i);
 }
});
test('generic live-work constraints get an operating hold before the incumbent-tool pitch',()=>{
 for(const common_objections of ['We already have a workflow. We cannot interrupt live work.','We already have a provider. No downtime is acceptable.','Production must remain running during any evaluation.']){
 const s=generateSalesEnablement({...reviewedArgs,common_objections,proof_points:'No measured outcome supplied.'});
 const response=s.split('**Full Response Script:**')[1].split('## Competitive')[0];
 assert.match(response,/read-only review|non-production simulation/);assert.match(response,/named approver/);assert.match(response,/stop conditions/);assert.match(response,/tested rollback/);
 assert.doesNotMatch(response,/where we would replace it/);
 }
});
test('hypothetical and denied comparison sentences cannot become social proof',()=>{
 for(const proof_points of ['One October pilot could record 50 minutes for handling exceptions instead of 80.','One October pilot did not reduce handling time from 80 to 50 minutes.','One October pilot reduced handling time from 80 to 50 minutes (hypothetical figure).']){
 const s=generateSalesEnablement({...reviewedArgs,proof_points});
 const social=s.split('**Social Proof (3 min):**')[1].split('**Questions')[0];assert.match(social,/No supported success evidence/);
 }
});

test('a vendor capability without a customer result stays out of the social proof slot',()=>{
 const s=generateSalesEnablement({...reviewedArgs,proof_points:'Workflow support includes approval routing and a shared review record (vendor claim).'});
 const social=s.split('**Social Proof (3 min):**')[1].split('**Questions')[0];
 assert.match(social,/No supported success evidence/);assert.doesNotMatch(social,/includes approval routing/);
});


test('a finite-verb capability has a grammatical discovery follow-up',async()=>{
 const s=generateSalesEnablement({product:'CloudSEK, predictive threat intelligence',target_persona:'Security operations head',value_props:'Ties each finding to an asset and a named owner',sales_stage:'discovery',your_sector:'cybersecurity'});
 assert.match(s,/One supplied capability to evaluate: Ties each finding to an asset and a named owner\./);
 assert.doesNotMatch(s,/capability to evaluate is ties/i);
});
