import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/mcp.mjs';
const cases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url),'utf8'));
for(const c of cases)test('Round 5 reader contract: '+c.tool,async()=>{
 const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:c.tool,arguments:c.args}})}));
 const r=(await response.json()).result;assert.ok(r&&!r.isError);
 const text=r.content.filter(x=>x.type==='text').map(x=>x.text).join('\n');
 assert.match(text,/## Reading the answer/);
 assert.match(text,/The conclusion needs review if|Change scope if/);
 for(const role of ['Founder','CEO','CMO','CRO','Demand generation head'])assert.match(text,new RegExp('(?:^|\\n)'+role+':'));
 assert.doesNotMatch(text,/_{3,}|icp firmographics\.(?:industries|company sizes|locations)|\[(?:Your name|Competitor A|YOUR WHITESPACE|target customer)\]/);
});

import {readingGuide} from '../dist/reader-actions.js';
test('General scoring explanation is not an actual publication hold',()=>{
 const explanation='## Overall Score: 7/10 (GOOD)\nAn unproved claim is labelled NOT PROVED YET, never GOOD.';
 assert.doesNotMatch(readingGuide('craft_content_improver',explanation),/Keep the stated hold/);
 assert.match(readingGuide('craft_content_improver',explanation.replace('7/10 (GOOD)','4/10 (NOT PROVED YET)')),/Keep the stated hold/);
});
