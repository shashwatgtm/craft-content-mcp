import test from 'node:test';
import assert from 'node:assert/strict';
import {generateSalesEnablement} from '../dist/sales-enablement.js';
const base={target_persona:'Operations lead',proof_points:'No measured result has been verified.',sales_stage:'discovery',common_objections:'Our credit policy and models are our edge; Can it explain a decline?'};
const handlers=out=>out.split('## Objection Handlers')[1].split('## Competitive Responses')[0];
test('M090 explicit coordinated denial prevents both capability offers',()=>{
 const out=handlers(generateSalesEnablement({...base,product:'We sell lending software in India. Our product cannot run customer risk models or explain credit declines.'}));
 assert.equal((out.match(/a capability limitation in the supplied description/g)||[]).length,2);
 assert.match(out,/cannot run customer risk models or explain credit declines/);
 assert.doesNotMatch(out,/Would it help to show that the product runs|I can show how/);
 assert.match(out,/I cannot offer that capability on this basis/);
});
test('M090 absent capability gets a check instead of a sector-template demo promise',()=>{
 const out=handlers(generateSalesEnablement({...base,product:'We sell lending software in India.'}));
 assert.match(out,/do not have a supplied capability or result/);
 assert.doesNotMatch(out,/Would it help to show that the product runs|I can show how/);
 assert.match(out,/Sector guidance to validate, not evidence/);
});
test('M090 supplied capability is retained with conditional demonstration scope',()=>{
 const out=handlers(generateSalesEnablement({...base,product:'We sell lending software in India. Our product runs customer risk models and shows a logged reason for a credit decline.'}));
 assert.match(out,/runs customer risk models/);assert.match(out,/logged reason/);
 assert.doesNotMatch(out,/a capability limitation in the supplied description/);
 assert.match(out,/only for the parts the product supports/);
});
for(const [product,common_objections] of [
 ['RouteBoard, dispatch planning software. It cannot track driver locations.','Can it track driver locations?'],
 ['CaseBoard, workflow software. Offline processing is not supported.','Can we process cases offline?'],
 ['SecureBoard, security software. It does not export audit records.','Can it export audit records?']
])test('M090 denial holds outside the original banking wording: '+product,()=>{
 const out=handlers(generateSalesEnablement({...base,product,common_objections}));
 assert.match(out,/capability limitation/);assert.match(out,/I cannot offer that capability/);
});
test('M090 a no-dependency statement is not called a denied capability',()=>{
 const out=handlers(generateSalesEnablement({...base,product:'RuleBoard, lending software. It does not require integration to run risk models.',common_objections:'Can it run risk models?'}));
 assert.doesNotMatch(out,/a capability limitation in the supplied description/);
});
test('M090 a named product stays in the scope question without a capability claim',()=>{
 const out=handlers(generateSalesEnablement({...base,product:'Acme, property management software',common_objections:'Owners want reports in their own format'}));
 assert.match(out,/does not establish how Acme handles that/);
 assert.doesNotMatch(out,/I can show how Acme/);
});
for(const product of [
 'RecordBoard exports dispatch exception records to the customer archive.',
 'Export of dispatch exception records to the customer archive is supported by RecordBoard.',
 'RecordBoard is workflow software.'
])test('M090 description sentences do not become product names: '+product,()=>{
 const out=handlers(generateSalesEnablement({...base,product,common_objections:'Can it export dispatch exception records?'}));
 assert.match(out,/how the product handles that/);
 assert.doesNotMatch(out,/how RecordBoard exports|how Export of|software\. handles|archive\.\./);
});
