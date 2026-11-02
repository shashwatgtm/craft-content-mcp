import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readingGuide} from '../dist/reader-actions.js';
import handler from '../netlify/functions/mcp.mjs';
const cases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url)));
const roles=['Founder','CEO','CMO','CRO','Demand generation head'];
export async function call(name,args){const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})}));return (await r.json()).result;}
export function checkReader(name,mutations){
 const base=cases.find(c=>c.tool===name).args;
 for(const m of mutations)test(`Overnight ${name}: ${roles[m.index]} changes with case evidence`,()=>{
  const a=readingGuide(name,'Case report',{...base,[m.key]:m.a});
  const b=readingGuide(name,'Case report',{...base,[m.key]:m.b});
  const line=s=>s.split('\n').find(l=>l.startsWith(roles[m.index]+':'));
  assert.notEqual(line(a),line(b));assert.match(line(a),/six delayed approvals/);assert.match(line(b),/nine delayed approvals/);
 });
 test(`Overnight ${name}: all five owners and change condition reach the hosted response`,async()=>{
  const out=await call(name,base);assert.ok(!out.isError);const text=out.content.map(c=>c.text||'').join('\n');
  assert.match(text,/## Reading the answer/);assert.match(text,/The conclusion needs review if/);
  for(const role of roles)assert.match(text,new RegExp('\\n'+role+':'));
 });
 test(`Overnight ${name}: holds and denial survive the reader`,()=>{
  const key=mutations[0].key;const out=readingGuide(name,'# Publication held',{...base,[key]:'No measured improvement was observed. Permission has not been granted.'});
  assert.match(out,/Keep the stated hold/);assert.doesNotMatch(out,/Permission has been granted/);
 });
 test(`Overnight ${name}: missing evidence and long qualifications are not invented or clipped`,()=>{
  const args={...base};for(const m of mutations)delete args[m.key];const out=readingGuide(name,'Case report',args);
  assert.doesNotMatch(out,/undefined|NaN|\[object Object\]/);
  const long='A reported improvement in one case '+ 'requires review '.repeat(30)+'but no measurement or permission exists.';
  const res=readingGuide(name,'Case report',{...base,[mutations[0].key]:long});
  assert.doesNotMatch(res,/“A reported improvement/);
 });
}
