import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const alpha=JSON.parse(readFileSync(new URL('../package.json',import.meta.url))).name.includes('gtm-alpha');
const {default:handler}=await import(alpha?'../netlify/functions/mcp-sse.js':'../netlify/functions/mcp.mjs');
const base=JSON.parse(readFileSync(new URL('./fixtures/regions-baseline.json',import.meta.url)));
for(const seed of base.cases.filter(c=>['content_repurposer','thought_leadership_series','craft_content_improver','gtm_consultation','epic_audit'].includes(c.tool)))test('M080 vendor origin is distinct from London buyer: '+seed.tool,async()=>{
 const field={content_repurposer:'source_content',thought_leadership_series:'your_take',craft_content_improver:'content',gtm_consultation:'gtm_challenge',epic_audit:'challenge'}[seed.tool];
 const run=async(text)=>{const args={...seed.args,[field]:text};delete args.your_sector;const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:seed.tool,arguments:args}})}));const b=await response.json();assert.ok(!b.result.isError);return b.result;};
 const text='We are a Singapore vendor selling lending software to a London bank.',first=await run(text),notes=first.content.map(c=>c.text||'').join('\n').split('## Region and industry context')[1];
 assert.ok(notes);assert.match(notes,/### UK · United Kingdom/);assert.doesNotMatch(notes,/### Southeast Asia/);assert.deepEqual(await run(text),first);assert.deepEqual(await run(text),first);
 const quote=await run('A customer wrote "'+text+'".');assert.doesNotMatch(quote.content.map(c=>c.text||'').join('\n'),/## Region and industry context/);
});
