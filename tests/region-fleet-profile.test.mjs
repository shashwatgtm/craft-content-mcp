import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/mcp.mjs';
import {readContext} from '../dist/sector.js';
const product='Fleet management software with vehicle telematics, driver behaviour reports and maintenance scheduling';
test('Fleet profile can intentionally contain no freight objections',()=>{
 const ctx=readContext(undefined,{seller:[product]});
 assert.equal(ctx.v?.subtype,'transport-management');
 assert.deepEqual(ctx.v?.objections,[]);
});
const cases=[
 ['case_study_generator',{customer_name:'Example fleet',your_product:product}],
 ['newsletter_builder',{topic:'Fleet maintenance planning',cta_goal:'Review the maintenance workflow',your_product:product}],
 ['sales_enablement_content',{product,target_persona:'Fleet manager',proof_points:'No measured result supplied'}],
 ['webinar_script',{topic:'Fleet maintenance planning',target_audience:'Fleet managers',webinar_type:'educational',your_product:product}]
];
for(const [name,seed]of cases)for(const country of ['India','Germany'])test(name+' handles empty objections in '+country,async()=>{
 const args={...seed};const key=name==='sales_enablement_content'?'product':'your_product';args[key]='We sell '+product+' in '+country+'.';
 const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})}));
 const result=(await response.json()).result;assert.ok(!result.isError,JSON.stringify(result));
 const text=result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
 assert.match(text,/## Region and industry context/);assert.ok(text.includes(country));
 assert.doesNotMatch(text,/Cannot read properties|undefined|Our ERP already has a transport module|The freight saving must be proven/);
});
