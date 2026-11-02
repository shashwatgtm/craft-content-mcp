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
