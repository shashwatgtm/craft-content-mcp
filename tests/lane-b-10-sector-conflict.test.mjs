import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/mcp.mjs';
const selections=['saas','ites','telecom'];
async function call(your_sector,your_product){
 const args={your_sector,your_product,customer_name:'Anonymous pilot team',mode:'discovery'};
 const r=await handler(new Request('https://local.invalid/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'case_study_generator',arguments:args}})}));const b=await r.json();assert.ok(b.result&&!b.result.isError,JSON.stringify(b));return b.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
}
for(const sector of selections)test(`${sector}: weak feature words do not imply a conflict, genuine seller trades do`,async()=>{
 for(const text of ['AI workflow for handoff approvals','Onboarding workflow with AI summaries']){
  const out=await call(sector,text);assert.doesNotMatch(out,/Sector conflict/);assert.equal(out,await call(sector,text));
 }
 for(const text of ['Cybersecurity vendor protecting systems for banks','Endpoint threat detection and incident response platform'])assert.match(await call(sector,text),/Sector conflict/);
 assert.match(await call(sector,`We are not a ${sector==='ites'?'ITeS':sector} vendor.`),/Sector conflict/);
 assert.doesNotMatch(await call(sector,`${sector==='ites'?'ITeS':sector} vendor`),/Sector conflict/);
});
