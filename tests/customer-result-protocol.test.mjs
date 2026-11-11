import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {default as handler} from '../netlify/functions/mcp.mjs';import {CHAIN_RESULTS_HTML} from '../dist/chain-results-html.js';
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fixture=JSON.parse(readFileSync(new URL('./fixtures/chain-existing-baseline.json',import.meta.url)));
const known=JSON.parse(readFileSync(new URL('./fixtures/customer-result-known.json',import.meta.url)));
const rpc=async(method,params={})=>{const response=await handler(new Request('https://local.invalid/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}));const msg=await response.json();assert.ok(!msg.error,JSON.stringify(msg));return msg.result;};
test('draft inventory has nine tools; existing eight definitions and pinned example answers equal the base byte for byte',async()=>{
 const {tools}=await rpc('tools/list');assert.equal(tools.length,9);
 for(const f of fixture.tools)assert.equal(sha(tools.find(t=>t.name===f.name)),f.sha,f.name);
 for(const f of fixture.cases)assert.equal(sha(await rpc('tools/call',{name:f.name,arguments:f.args})),f.sha,f.name);
});
test('new chain uses the derived view; protocol output and full text stay identical in repeat and parallel calls',async()=>{
 const a=await rpc('tools/call',{name:'customer_result_to_content',arguments:known});assert.equal(a.structuredContent.status,'pass');
 assert.equal(a._meta.helixResults.text,a.content[0].text);assert.deepEqual(await rpc('tools/call',{name:'customer_result_to_content',arguments:known}),a);
 const parallel=await Promise.all(Array.from({length:3},()=>rpc('tools/call',{name:'customer_result_to_content',arguments:known})));parallel.forEach(b=>assert.deepEqual(b,a));
 const list=await rpc('resources/list');assert.equal(list.resources.filter(r=>r.uri==='ui://helix/results/v1.html').length,1);assert.equal(list.resources.filter(r=>r.uri==='ui://helix/results/chains/v1.html').length,1);
 assert.equal((await rpc('resources/read',{uri:'ui://helix/results/chains/v1.html'})).contents[0].text,CHAIN_RESULTS_HTML);
});
test('display only view has matching CSP hashes and no network, HTML interpolation or local storage',()=>{
 for(const tag of ['script','style']){const body=CHAIN_RESULTS_HTML.match(new RegExp('<'+tag+'>([\\s\\S]*?)</'+tag+'>'))[1];assert.ok(CHAIN_RESULTS_HTML.includes(tag+"-src 'sha256-"+createHash('sha256').update(body).digest('base64')+"'"));}
 assert.doesNotMatch(CHAIN_RESULTS_HTML,/innerHTML|eval\(|fetch\(|localStorage|sessionStorage|document\.cookie|tools\/call/);assert.match(CHAIN_RESULTS_HTML,/ui\/message/);
});
test('nested approval fields reject malformed data and markup without changing the locked sentence',async()=>{
 for(const args of [{...known,approval:{status:'written',uses:'post'}},{...known,proof_details:{reporter:'<img src=x>'}},{...known,buyer_view:'<script>steal</script>'}]){const a=await rpc('tools/call',{name:'customer_result_to_content',arguments:args});assert.equal(a.isError,true);assert.doesNotMatch(a.content[0].text,/<script>|<img/);}
});
test('a published story above the short text transport limit reaches the chain, while its own cap still holds',async()=>{
 const published_story=known.exact_sentence+' '+('The public story keeps its scope clear. '.repeat(120));
 assert.ok(published_story.length>4000&&published_story.length<16000);
 const good=await rpc('tools/call',{name:'customer_result_to_content',arguments:{...known,story_published:true,published_story}});assert.ok(!good.isError,good.content[0].text);assert.equal(good.structuredContent.assets.length,3);
 const bad=await rpc('tools/call',{name:'customer_result_to_content',arguments:{...known,story_published:true,published_story:'A'.repeat(16001)}});assert.equal(bad.isError,true);
});
test('compiled stdio exposes nine tools and returns the same new chain answer as hosted HTTP',async()=>{
 const {Client}=await import('@modelcontextprotocol/sdk/client/index.js');const {StdioClientTransport}=await import('@modelcontextprotocol/sdk/client/stdio.js');
 const transport=new StdioClientTransport({command:process.execPath,args:['dist/index.js'],cwd:new URL('..',import.meta.url).pathname,stderr:'pipe'});const client=new Client({name:'chain-stdio-test',version:'1.0'});
 try{await client.connect(transport);assert.equal((await client.listTools()).tools.length,9);const result=await client.callTool({name:'customer_result_to_content',arguments:known});assert.deepEqual(result,await rpc('tools/call',{name:'customer_result_to_content',arguments:known}));}finally{await client.close();}
});
