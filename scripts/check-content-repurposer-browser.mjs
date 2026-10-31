import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../dist/server.js';
const { chromium } = await import(process.env.HELIX_PLAYWRIGHT_MODULE || 'playwright-core');
const evidence=new URL('../docs/review-assets/content-repurposer-20261031/',import.meta.url);
fs.mkdirSync(evidence,{recursive:true});
const checks=[],external=[],errors=[];
const record=(name,fn)=>{fn();checks.push({name,status:'PASS'});console.log('PASS '+name);};
const client=new Client({name:'content-browser-simulated-host',version:'1.0.0'}),server=createServer();
const [ct,st]=InMemoryTransport.createLinkedPair();await server.connect(st);await client.connect(ct);
const browser=await chromium.launch({headless:true,executablePath:process.env.HELIX_CHROME_EXECUTABLE});
let failure;
try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}});
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{external.push(route.request().url());return route.abort();});
  await page.exposeFunction('callContent',args=>client.callTool({name:'content_repurposer',arguments:args}));
  // Established widget harness: inline parent and srcdoc iframe. No local server,
  // localhost navigation, file URL navigation or network dependency is used.
  await page.setContent('<style>body{margin:0}iframe{display:block;width:100%;border:0}</style><iframe id="widget" sandbox="allow-scripts allow-same-origin"></iframe>');
  await page.evaluate(html=>{
    window.messages=[];window.calls=0;window.delay=0;window.rejectNext=false;window.malformedNext=false;
    addEventListener('message',async event=>{
      if(event.source!==document.querySelector('iframe').contentWindow)return;
      const m=event.data;window.messages.push(m);
      if(m.method==='ui/initialize')event.source.postMessage({jsonrpc:'2.0',id:m.id,result:{}},'*');
      else if(m.method==='tools/call'){
        window.calls++;const delay=window.delay,reject=window.rejectNext,malformed=window.malformedNext;window.delay=0;window.rejectNext=false;window.malformedNext=false;
        const result=await window.callContent(m.params.arguments);
        if(malformed)result.structuredContent.result.pieces=null;
        setTimeout(()=>event.source.postMessage(reject?{jsonrpc:'2.0',id:m.id,error:{code:-32603,message:'synthetic host error'}}:{jsonrpc:'2.0',id:m.id,result},'*'),delay);
      }else if(m.method==='ui/notifications/size-changed')document.querySelector('iframe').style.height=m.params.height+'px';
    });
    document.querySelector('iframe').srcdoc=html;
  },fs.readFileSync(new URL('../ui/content-repurposer.html',import.meta.url),'utf8'));
  const frame=page.locator('iframe').contentFrame();
  await frame.locator('#mode').filter({hasText:'Connected.'}).waitFor();
  const init=await page.evaluate(()=>window.messages.find(m=>m.method==='ui/initialize'));
  record('inline initialization',()=>assert.deepEqual(init.params.appCapabilities.availableDisplayModes,['inline']));
  assert.equal(await frame.locator('#source_content').inputValue(),'');assert.equal(await frame.locator('#result').isVisible(),false);assert.equal(await page.evaluate(()=>window.calls),0);checks.push({name:'empty own-source start and no automatic tool call',status:'PASS'});
  const layout=async(name,width)=>{await page.setViewportSize({width,height:1000});await page.waitForTimeout(180);const dims=await frame.locator('body').evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));record(name+' layout '+width,()=>assert.ok(dims.scroll<=dims.width+1,JSON.stringify(dims)));await page.screenshot({path:fileURLToPath(new URL(name+'-'+width+'.png',evidence)),fullPage:true});};
  for(const width of [320,768,1280])await layout('empty',width);
  const source='Teams keep their source notes beside every draft. Reviewers check each claim before using it.\nThese statements are synthetic and unverified, for review only.\nProof: Review time fell by 20% (synthetic customer result)';
  const args={source_content:source,source_type:'blog_post',key_message:'Keep source notes beside the draft.'};
  const fromHost=await client.callTool({name:'content_repurposer',arguments:args});
  await page.evaluate(result=>document.querySelector('iframe').contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:result},'*'),fromHost);
  await frame.locator('#status').filter({hasText:'Drafts updated.'}).waitFor();assert.equal(await frame.locator('#source_content').inputValue(),source);assert.equal(await frame.locator('#piece option').count(),5);checks.push({name:'initial host result and component-only literal inputs render',status:'PASS'});
  await page.evaluate(()=>{const w=document.querySelector('iframe').contentWindow;w.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:{source_content:'A newer host source.',source_type:'presentation'}}},'*');w.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-cancelled',params:{}},'*');});await frame.locator('#status').filter({hasText:'host cancelled'}).waitFor();assert.equal(await frame.locator('#stale').isVisible(),true);assert.equal(await frame.locator('#copy').isDisabled(),true);assert.equal(await frame.locator('#source_content').inputValue(),'A newer host source.');checks.push({name:'new host input marks old draft stale even if the call is cancelled',status:'PASS'});
  await page.evaluate(result=>document.querySelector('iframe').contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:result},'*'),fromHost);await frame.locator('#status').filter({hasText:'Drafts updated.'}).waitFor();assert.equal(await frame.locator('#stale').isVisible(),false);
  await frame.locator('#clear').click();await frame.locator('#confirm-yes').click();assert.equal(await frame.locator('#source_content').inputValue(),'');assert.equal(await frame.locator('#result').isVisible(),false);
  // Initial host delivery precedes local ownership. A clicked Generate button,
  // even with missing inputs, intentionally prevents unsolicited later updates.
  await frame.locator('#generate').click();assert.equal(await page.evaluate(()=>window.calls),0);checks.push({name:'missing required source is refused without a call',status:'PASS'});
  await frame.locator('#source_content').fill(source);await frame.locator('#source_type').selectOption('blog_post');await frame.locator('#key_message').fill(args.key_message);
  const generate=async()=>{await frame.locator('#generate').click();if(await frame.locator('#confirmation').isVisible())await frame.locator('#confirm-yes').click();await frame.locator('#status').filter({hasText:'Drafts updated.'}).waitFor();};
  await generate();assert.equal(await frame.locator('#draft').inputValue(),fromHost.structuredContent.result.pieces[0].text);checks.push({name:'explicit button calls existing tool and shows exact server piece',status:'PASS'});
  assert.match(await frame.locator('[aria-labelledby="caveat-title"]').innerText(),/at most the first two recognized/);checks.push({name:'qualification detection limit is visible beside the draft',status:'PASS'});
  for(const width of [320,768,1280])await layout('populated',width);
  const left=await frame.locator('#source_content').boundingBox(),right=await frame.locator('#draft').boundingBox();record('desktop source and draft side by side',()=>assert.ok(right.x>left.x+left.width));
  const draft=await frame.locator('#draft').inputValue(),calls=await page.evaluate(()=>window.calls);
  await frame.locator('#draft').fill('A local edited draft without the source qualification.');assert.match(await frame.locator('#draft-state').innerText(),/Locally edited/);assert.equal(await frame.locator('#caveat-warning').isVisible(),true);await frame.locator('#generate').click();assert.equal(await frame.locator('#confirmation').isVisible(),true);await frame.locator('#confirm-no').click();assert.equal(await page.evaluate(()=>window.calls),calls);assert.equal(await frame.locator('#draft').inputValue(),'A local edited draft without the source qualification.');checks.push({name:'dirty regeneration requires confirmation and cancel keeps edits',status:'PASS'});
  await frame.locator('#copy').click();assert.match(await frame.locator('#confirm-message').innerText(),/missing or changed source qualifications/);await frame.locator('#confirm-no').click();checks.push({name:'copy warns before copying missing qualifications',status:'PASS'});
  await frame.locator('#restore').click();await frame.locator('#piece').selectOption('piece-2');assert.equal(await frame.locator('#confirmation').isVisible(),false);await frame.locator('#piece').selectOption('piece-1');assert.equal(await frame.locator('#draft').inputValue(),'A local edited draft without the source qualification.');checks.push({name:'changing channel dismisses a pending reset confirmation',status:'PASS'});
  await frame.locator('#restore').click();await frame.locator('#confirm-yes').click();assert.equal(await frame.locator('#draft').inputValue(),draft);assert.equal(await frame.locator('#caveat-warning').isVisible(),false);checks.push({name:'reset draft restores exact server text and qualifications',status:'PASS'});
  await frame.locator('#copy').click();await page.waitForTimeout(100);const copyStatus=await frame.locator('#status').innerText();assert.match(copyStatus,/Draft copied|draft is selected/);if(copyStatus.includes('selected')){const selected=await frame.locator('#draft').evaluate(el=>el.value.slice(el.selectionStart,el.selectionEnd));assert.equal(selected,draft);}checks.push({name:copyStatus.includes('selected')?'clipboard unavailable: exact draft selected for keyboard copy':'clipboard write succeeded',status:'PASS'});
  await frame.locator('#draft').fill(draft+'\nLocal note for the author.');await generate();assert.equal(await frame.locator('#draft').inputValue(),draft);checks.push({name:'confirmed regeneration replaces local edits after success',status:'PASS'});
  const literal='<img src=x onerror=alert(1)> & literal source. Teams review evidence before use.\nSynthetic demonstration only.';
  await frame.locator('#source_content').fill(literal);for(let i=0;i<3;i++){await generate();assert.equal(await frame.locator('#source_content').inputValue(),literal);}assert.equal(await frame.locator('img').count(),0);checks.push({name:'three literal round trips preserve text and keep markup inert',status:'PASS'});
  await frame.locator('#target_formats').fill('unsupported');await frame.locator('#generate').click();await frame.locator('#status').filter({hasText:'No supported format'}).waitFor();assert.equal(await frame.locator('#piece option').count(),0);assert.equal(await frame.locator('#copy').isDisabled(),true);checks.push({name:'unknown-only formats return no fabricated draft',status:'PASS'});
  await frame.locator('#target_formats').fill('email');await generate();const previous=await frame.locator('#draft').inputValue();
  await page.evaluate(()=>window.malformedNext=true);await frame.locator('#generate').click();await frame.locator('#status').filter({hasText:'No valid structured drafts'}).waitFor();assert.equal(await frame.locator('#draft').inputValue(),previous);checks.push({name:'malformed result preserves previous draft',status:'PASS'});
  await page.evaluate(()=>window.rejectNext=true);await frame.locator('#generate').click();await frame.locator('#status').filter({hasText:'host request failed'}).waitFor();assert.equal(await frame.locator('#draft').inputValue(),previous);checks.push({name:'tool error preserves previous draft',status:'PASS'});
  await page.evaluate(()=>window.delay=350);await frame.locator('#generate').click();await frame.locator('#key_message').fill('A newer local message.');await page.waitForTimeout(450);assert.equal(await frame.locator('#key_message').inputValue(),'A newer local message.');assert.equal(await frame.locator('#stale').isVisible(),true);assert.equal(await frame.locator('#copy').isDisabled(),true);checks.push({name:'delayed success cannot overwrite newer input',status:'PASS'});
  await page.evaluate(()=>{window.delay=350;window.rejectNext=true;});await frame.locator('#generate').click();await frame.locator('#draft').fill(previous+'\nA newer local edit.');await page.waitForTimeout(450);assert.doesNotMatch(await frame.locator('#status').innerText(),/request failed/);assert.match(await frame.locator('#draft').inputValue(),/A newer local edit/);checks.push({name:'delayed error cannot overwrite local draft state',status:'PASS'});
  await page.evaluate(result=>{const w=document.querySelector('iframe').contentWindow;for(const [method,params]of [['ui/notifications/tool-input',{arguments:{source_content:'unrelated'}}],['ui/notifications/tool-result',result],['ui/notifications/tool-cancelled',{}]])w.postMessage({jsonrpc:'2.0',method,params},'*');},fromHost);await page.waitForTimeout(100);assert.match(await frame.locator('#draft').inputValue(),/A newer local edit/);assert.equal(await frame.locator('#source_content').inputValue(),literal);checks.push({name:'uncorrelated result, input and cancellation preserve local ownership',status:'PASS'});
  await generate();await page.evaluate(()=>window.delay=350);await frame.locator('#generate').click();await frame.locator('#clear').click();await frame.locator('#confirm-yes').click();await page.waitForTimeout(450);assert.equal(await frame.locator('#result').isVisible(),false);assert.equal(await frame.locator('#source_content').inputValue(),'');checks.push({name:'reset invalidates pending response',status:'PASS'});
  await frame.locator('#source_content').fill(source);await frame.locator('#source_type').selectOption('presentation');await frame.locator('#generate').focus();await page.keyboard.press('Enter');await frame.locator('#status').filter({hasText:'Drafts updated.'}).waitFor();checks.push({name:'keyboard generation works in iframe without form submission',status:'PASS'});
  await frame.locator('body').evaluate(el=>el.style.zoom='2');await page.waitForTimeout(150);const zoom=await frame.locator('body').evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));record('200 percent CSS zoom remains within viewport (browser UI zoom not tested)',()=>assert.ok(zoom.scroll<=zoom.width+1));await frame.locator('body').evaluate(el=>el.style.zoom='');
  await page.waitForTimeout(180);const sizes=await page.evaluate(()=>window.messages.filter(m=>m.method==='ui/notifications/size-changed').map(m=>m.params.height));record('resize reports both growth and shrinkage',()=>{assert.ok(sizes.some((x,i)=>i&&x>sizes[i-1]));assert.ok(sizes.some((x,i)=>i&&x<sizes[i-1]));});
  record('no external requests',()=>assert.deepEqual(external,[]));record('no uncaught browser errors',()=>assert.deepEqual(errors,[]));
  console.log(JSON.stringify({pass:checks.length,fail:0,scope:'simulated host, real in-memory SDK'}));
}catch(error){failure=error;throw error;}
finally{await browser.close();await client.close();await server.close();fs.writeFileSync(new URL('browser-receipt.json',evidence),JSON.stringify({scope:'Windows Chrome, simulated MCP Apps parent with real in-memory SDK calls; not ChatGPT host or deployed transport',checks,external,errors,failure:failure?.stack||null},null,2));}
