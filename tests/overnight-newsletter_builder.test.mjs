import {checkReader} from './overnight-reader-helper.mjs';
checkReader("newsletter_builder", [{"index": 0, "key": "cta_goal", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "cta_goal", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "key_points", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "your_product", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "cta_goal", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {generateNewsletter} from '../dist/newsletter-builder.js';
import {case_newsletter_builder} from '../dist/reader-newsletter-builder.js';
const newsletterArgs={topic:'Why SOC teams still carry an alert backlog after adding automation',cta_goal:'Ask readers to count unowned urgent alerts in one shift',key_points:'Name one owner per urgent alert. Separate false positives from delayed responses. Do not claim a measured improvement yet.',your_product:'Alert triage software'};
test('count action produces a scoped baseline check and grammatical reader copy',()=>{
 const s=generateNewsletter(newsletterArgs);const draft=s.split('## Subject Lines')[0];
 assert.match(draft,/Count unowned urgent alerts in one shift/);
 assert.match(draft,/total eligible items/);assert.match(draft,/workflow owner to check a sample/);
 assert.match(draft,/leave any rate uncalculated/);
 assert.match(draft,/baseline, not an improvement caused by the product/);
 assert.match(draft,/you can count unowned/);
 assert.doesNotMatch(draft,/next step is count|Do not claim|Which one number/);
 const c=case_newsletter_builder(newsletterArgs);
 assert.doesNotMatch(JSON.stringify(c),/Ask readers to/);
 assert.match(c.meaning,/count unowned urgent alerts/);
});
test('denied count direction is not promoted to a reader action',()=>{
 const s=generateNewsletter({...newsletterArgs,cta_goal:'Do not ask readers to count unowned alerts'});
 assert.doesNotMatch(s,/Button: Count|Make the count traceable/);
 assert.match(s,/Confirm the reader action before sending/);
});

test('literal count actions and instruction points remain grammatical without an invented product name',()=>{
 const s=generateNewsletter({topic:'How teams review hotel booking exceptions',cta_goal:'Count unresolved hotel booking exceptions in one batch with the hotel operations head',key_points:'Assign responsibility for hotel booking exceptions and record the unresolved task count in one batch. Improvement has not been measured.',your_product:'Workflow for hotel booking exceptions used by the hotel operations head',your_sector:'vertical_saas'});
 const draft=s.split('## Subject Lines')[0];
 assert.match(draft,/you can count unresolved/);assert.match(draft,/Assign responsibility for hotel booking exceptions/);
 assert.doesNotMatch(s,/Workflow for hotel booking is workflow|What Workflow for hotel booking brings|at hotel booking exceptions used/);
 assert.doesNotMatch(s,/give: your product|your product was not given/);
});

test('a workflow object is not the industry served, while an explicit buyer industry remains usable',async()=>{
 const {servedIndustry}=await import('../dist/sector.js');
 assert.equal(servedIndustry({seller:['Workflow for hotel booking exceptions used by the hotel operations head']}).served,'');
 assert.equal(servedIndustry({seller:['Scheduling software for universities']}).served,'universities');
});
