import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer, closeDanglingBrackets } from '../dist/server.js';
import { createServer as createBaselineServer } from './fixtures/content-repurposer-server-base.mjs';
import { generateContentRepurposer as legacyWriter } from './fixtures/content-repurposer-base.mjs';
import { buildContentRepurposer, generateContentRepurposer } from '../dist/content-repurposer.js';
import { contentWidgetResult, contentLiteralInputs, CONTENT_UI_URI, CONTENT_UI_MIME } from '../dist/content-repurposer-result.js';
import { neutraliseDeep } from '../dist/echo-safe.js';
import { reshapeLists } from '../dist/list-shape.js';

const formats=['linkedin_post','twitter_thread','email','blog_summary','quote_cards','infographic_outline','video_script','podcast_talking_points','slide_deck_outline','newsletter_section'];
const source='A clearer review process\nTeams review changes in one shared queue. Owners check the source before approving a claim. A small weekly review helps the team identify unanswered questions.\nThese statements are synthetic and unverified, for review only.\nProof: Review time fell by 20% (synthetic customer result).';
const base={source_content:source,source_type:'blog_post',key_message:'Review claims against their source before use.'};
const cases=[
  ['defaults',base],
  ...formats.map(format=>[format,{...base,target_formats:format}]),
  ['unknown only',{...base,target_formats:'carrier_pigeon'}],
  ['unknown mixed',{...base,target_formats:'email, other_format, blog_summary'}],
  ['duplicate formats',{...base,target_formats:'email,email,blog_summary'}],
  ['no proof',{source_content:'Teams write down the decision and check the evidence before using a claim.',source_type:'presentation'}],
  ['no points',{source_content:'Short.',source_type:'presentation',target_formats:'blog_summary'}],
  ['partner statement',{...base,source_content:'Teams need a clear review process before sharing a result.\nProof: We have worked together for years (partner quote)'}],
  ['unrecognized partner wording',{...base,source_content:'Teams need a clear review process before sharing a result.\nProof: We have worked together for years (partner words).'}],
  ['quoted customer and result',{...base,source_content:'Teams review source material before publishing a draft.\nSynthetic demonstration statements only.\nProof: Customer quote: "We reduced review work and kept our source notes" (customer quote); Review time fell by 20% (customer result).'}],
  ['removed superlative',{...base,source_content:"The world's first review process helps teams check every claim before use.\nThis is hypothetical and not verified."}],
  ['inert markup',{...base,source_content:'<img src=x onerror=alert(1)> Teams review source material carefully. [read](javascript:alert(1)) & more.\nSynthetic demonstration only.',key_message:'<b>Check the source (draft note'}],
  ['long thread',{...base,target_formats:'twitter_thread',source_content:'A review process helps teams check evidence before use. '+('Reviewers keep source notes and explanations alongside a decision, '.repeat(18))+'every time.\nSynthetic data only.'}],
  ['duplicate sentences',{...base,source_content:'Teams review source evidence before using a claim. Teams review source evidence before using a claim.\nHypothetical, not verified.'}],
  ['source order',{...base,source_content:'First the team records the original source. Next the team reads every qualification carefully. Finally the team asks the author about missing evidence.'}],
  ...['casual','authoritative','friendly','bold'].map(voice=>[voice,{...base,brand_voice:voice}]),
  ['sector override',{...base,your_sector:'professional_services'}],
];

for(const [label,args]of cases)test('writer byte parity: '+label,()=>{
  const safe=reshapeLists(neutraliseDeep(args));
  const kit=buildContentRepurposer(safe);
  assert.equal(kit.text,legacyWriter(safe));
  assert.equal(generateContentRepurposer(safe),kit.text);
  const final=closeDanglingBrackets(kit.text);
  const widget=contentWidgetResult(kit,closeDanglingBrackets,args);
  for(const piece of widget.structuredContent.result.pieces)assert.ok(final.includes(piece.text),'finished piece must occur byte-for-byte in final legacy text');
  assert.equal(new Set(kit.result.pieces.map(p=>p.id)).size,kit.result.pieces.length);
});

async function connected(factory){const server=factory(),client=new Client({name:'content-widget-test',version:'1.0.0'});const [ct,st]=InMemoryTransport.createLinkedPair();await server.connect(st);await client.connect(ct);return{client,close:()=>Promise.all([client.close(),server.close()])};}
test('real SDK differential: unchanged text, schema, errors and other tool metadata',async t=>{
  const baseline=await connected(createBaselineServer),candidate=await connected(createServer);
  try{
    const oldTools=await baseline.client.listTools(),newTools=await candidate.client.listTools();
    assert.equal(newTools.tools.length,8);
    assert.deepEqual(newTools.tools.map(tool=>{const copy={...tool};if(copy.name==='content_repurposer')delete copy._meta;return copy;}),oldTools.tools);
    assert.equal(newTools.tools.find(tool=>tool.name==='content_repurposer')._meta.ui.resourceUri,CONTENT_UI_URI);
    for(const [label,args]of [...cases,['missing source',{}],['blank source',{source_content:' ',source_type:'blog_post'}],['invalid source type',{...base,source_type:'unknown'}],['invalid voice',{...base,brand_voice:'unknown'}]])await t.test(label,async()=>{
      const oldResult=await baseline.client.callTool({name:'content_repurposer',arguments:args});
      const newResult=await candidate.client.callTool({name:'content_repurposer',arguments:args});
      assert.deepEqual(newResult.content,oldResult.content);
      assert.equal(newResult.isError,oldResult.isError);
      if(!newResult.isError){assert.equal(newResult.structuredContent.schemaVersion,1);assert.equal(newResult.structuredContent.tool,'content_repurposer');const literal=JSON.parse(Buffer.from(newResult._meta.helixContentRepurposer.inputsBase64,'base64').toString('utf8'));assert.deepEqual(literal,contentLiteralInputs(args));for(const piece of newResult.structuredContent.result.pieces)assert.ok(newResult.content[0].text.includes(piece.text));}
    });
    const resources=await candidate.client.listResources();assert.equal(resources.resources.length,1);assert.equal(resources.resources[0].uri,CONTENT_UI_URI);
    const resource=await candidate.client.readResource({uri:CONTENT_UI_URI});assert.equal(resource.contents[0].mimeType,CONTENT_UI_MIME);assert.deepEqual(resource.contents[0]._meta.ui.csp,{connectDomains:[],resourceDomains:[],frameDomains:[],baseUriDomains:[]});assert.match(resource.contents[0].text,/Helix GTM Consulting/);
    await assert.rejects(candidate.client.readResource({uri:'ui://unknown'}));
    for(const name of ['unknown_tool','newsletter_builder','case_study_generator'])assert.deepEqual((await candidate.client.callTool({name,arguments:{}})).content,(await baseline.client.callTool({name,arguments:{}})).content);
  }finally{await baseline.close();await candidate.close();}
});

test('provenance covers missing, unsupported, partner and removed claims',()=>{
  const noProof=buildContentRepurposer({source_content:'Teams check evidence before they approve a draft.',source_type:'presentation'});
  assert.equal(noProof.result.proof.length,0);assert.ok(noProof.result.missingInputs.some(x=>x.includes('proof line')));
  const unknown=buildContentRepurposer({...base,target_formats:'unsupported'});assert.equal(unknown.result.pieces.length,0);assert.deepEqual(unknown.result.unknownFormats,['unsupported']);
  const partner=buildContentRepurposer(cases.find(([name])=>name==='partner statement')[1]);assert.ok(partner.result.proof.length);assert.ok(partner.result.proof.every(p=>!p.eligibleAsResult&&!p.selectedForResult));
  const ambiguous=buildContentRepurposer(cases.find(([name])=>name==='unrecognized partner wording')[1]);assert.ok(ambiguous.warnings.some(w=>w.code==='PROOF_LABEL_REVIEW'));
  const claims=buildContentRepurposer(cases.find(([name])=>name==='removed superlative')[1]);assert.ok(claims.result.claimsToSource.length);assert.ok(claims.warnings.some(w=>w.code==='CLAIMS_NEED_SOURCE'));
  for(const format of formats){const k=buildContentRepurposer({...base,target_formats:format});assert.ok(k.result.caveats.length);assert.match(k.result.pieces[0].text,/synthetic|unverified/i);}
});
test('literal allowlist and repeated safe round trips',()=>{
  const literal={...base,source_content:'<b>Raw & literal</b> source text for review.\nSynthetic only.',unknown_secret:'never return'};
  const once=contentLiteralInputs(literal);assert.equal(once.unknown_secret,undefined);
  let original=literal,first;
  for(let i=0;i<3;i++){const kit=buildContentRepurposer(reshapeLists(neutraliseDeep(original)));const result=contentWidgetResult(kit,closeDanglingBrackets,original);const text=closeDanglingBrackets(kit.text);if(i)assert.equal(text,first);else first=text;original=JSON.parse(Buffer.from(result._meta.helixContentRepurposer.inputsBase64,'base64').toString('utf8'));assert.equal(original.source_content,literal.source_content);assert.doesNotMatch(text,/<b>/);}
});
test('UI bundle is exact, inert and contains no storage or external calls',()=>{
  const html=fs.readFileSync(new URL('../ui/content-repurposer.html',import.meta.url),'utf8');const generated=fs.readFileSync(new URL('../src/content-repurposer-ui.ts',import.meta.url),'utf8');assert.equal(generated,'// Generated by node scripts/build-content-repurposer-ui.mjs.\nexport const contentRepurposerHtml = '+JSON.stringify(html)+';\n');
  assert.doesNotMatch(html,/innerHTML|localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|https?:\/\//);assert.match(html,/availableDisplayModes:\['inline'\]/);assert.match(html,/event.source!==parent/);assert.match(html,/rev!==revision/);assert.match(html,/type="button"/);assert.equal((html.match(/@font-face/g)||[]).length,2);
});
