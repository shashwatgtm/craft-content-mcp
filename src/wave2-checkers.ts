import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
type Row=Record<string,any>;
type Schema={type:string;properties?:Record<string,Schema>;items?:Schema;required?:string[];enum?:string[];minItems?:number;maxItems?:number;maxLength?:number;minimum?:number;additionalProperties?:boolean};
const text:Schema={type:'string',maxLength:20000};
const num:Schema={type:'number',minimum:0};
const choice=(...values:string[]):Schema=>({...text,enum:values});
const object=(properties:Record<string,Schema>,required=Object.keys(properties)):Schema=>({type:'object',properties,required,additionalProperties:false});
const array=(items:Schema,minItems=0):Schema=>({type:'array',items,minItems,maxItems:200});
const count=(s:string)=>s.trim().split(/\s+/).filter(Boolean).length;
const tokens=(s:string)=>s.match(/\b\d[\d,]*(?:\.\d+)?%?/g)??[];
const iso=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(+new Date(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const day=(s:string)=>iso(s)?new Date(s+'T00:00:00Z').toLocaleDateString('en-US',{weekday:'long',timeZone:'UTC'}):'invalid';
const safeUrl=(s:string)=>{try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u:null;}catch{return null;}};
const escaped=(s:string)=>s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,'').replace(/[&<>"'|`\[\]]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','|':'&#124;','`':'&#96;','[':'&#91;',']':'&#93;'}[c]!));
const escapeDeep=(v:any):any=>typeof v==='string'?escaped(v):Array.isArray(v)?v.map(escapeDeep):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[escaped(k),escapeDeep(x)])):v;
function validate(s:Schema,v:any,path='$'):string[]{
 const issues:string[]=[];
 if(s.type==='object'){
  if(!v||typeof v!=='object'||Array.isArray(v))return [`${path}: object required`];
  for(const k of s.required??[])if(!Object.prototype.hasOwnProperty.call(v,k)||(typeof v[k]==='string'&&!v[k].trim()))issues.push(`${path}.${k}: required`);
  for(const [k,x]of Object.entries(v)){if(!Object.prototype.hasOwnProperty.call(s.properties??{},k))issues.push(`${path}: unknown property`);else issues.push(...validate(s.properties![k],x,`${path}.${k}`));}
 }else if(s.type==='array'){
  if(!Array.isArray(v))return [`${path}: array required`];if(v.length<(s.minItems??0)||v.length>(s.maxItems??200))return [`${path}: row count outside allowed bounds`];v.forEach((x,i)=>issues.push(...validate(s.items!,x,`${path}[${i+1}]`)));
 }else if(s.type==='string'){if(typeof v!=='string')return [`${path}: text required`];if(v.length>(s.maxLength??20000))issues.push(`${path}: text too long`);if(s.enum&&!s.enum.includes(v))issues.push(`${path}: unsupported choice`);
 }else if(s.type==='number'){if(typeof v!=='number'||!Number.isFinite(v)||(s.minimum!==undefined&&v<s.minimum))issues.push(`${path}: finite number in range required`);}
 return issues;
}
const registry:Record<string,{tool:Tool,run:(a:Row)=>Row}>={};
function define(name:string,description:string,schema:Schema,run:(a:Row)=>Row){registry[name]={tool:{name,description,inputSchema:schema as Tool['inputSchema'],annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}},run};}
const evidence=object({id:text,claim:text,source:text,source_date:text,excerpt:text,status:choice('user_supplied','unverified','conflicting')},['id','claim','source','source_date','excerpt','status']);
const evidenceIssues=(rows:Row[])=>rows.flatMap((r,i)=>{const out:string[]=[];if(!safeUrl(r.source))out.push(`Evidence ${i+1}: source must be an HTTP(S) URL`);if(!iso(r.source_date))out.push(`Evidence ${i+1}: source date invalid`);if(r.status!=='user_supplied')out.push(`Evidence ${i+1}: ${r.status}`);if(!r.excerpt.trim())out.push(`Evidence ${i+1}: excerpt missing`);return out;});
const unique=(rows:Row[],key:string)=>{const seen=new Set<string>();return rows.flatMap((r,i)=>{const k=String(r[key]).trim().toLowerCase();if(seen.has(k))return [`Row ${i+1}: duplicate ${key}`];seen.add(k);return [];});};
const report=(issues:string[],data:Row,limitations:string[])=>({status:issues.length?'CHECKS_FOUND':'NO_MECHANICAL_ISSUES',issues,...data,limitations:['Only supplied data was checked. No page was fetched, model called, message sent or truth independently verified.',...limitations]});

define('launch_copy_check','Checks launch assets from supplied text, claim records, speaker approval states and calendar dates. Returns character and word counts, mismatched weekdays, unresolved approvals and evidence findings. Optional character limits use the caller standard. No publication, delivery or external verification occurs.',object({assets:array(object({label:text,text:text,character_limit:num},['label','text']),1),claims:array(evidence),dates:array(object({date:text,weekday:text})),quotes:array(object({text:text,approval:choice('approved_by_speaker','draft_for_approval','unknown'),source:text}))}),a=>{
 const issues=evidenceIssues(a.claims);const counts=a.assets.map((x:Row,i:number)=>{const characters=[...x.text].length;if(x.character_limit!==undefined&&characters>x.character_limit)issues.push(`Asset ${i+1}: over supplied character limit`);if(/[\u2013\u2014]/u.test(x.text))issues.push(`Asset ${i+1}: contains a long dash`);return {label:x.label,characters,words:count(x.text),limit:x.character_limit??'not supplied'};});const dates=a.dates.map((d:Row,i:number)=>{const actual=day(d.date);if(actual==='invalid'||actual!==d.weekday)issues.push(`Date ${i+1}: invalid date or weekday mismatch`);return {...d,actual};});a.quotes.forEach((q:Row,i:number)=>{if(q.approval!=='approved_by_speaker')issues.push(`Quote ${i+1}: speaker approval unresolved`);});
 return report(issues,{counts,dates,quoteStatuses:a.quotes.map((q:Row)=>q.approval),claimCount:a.claims.length},['Limit values are supplied by the caller. Approval is reported by the caller, not independently confirmed. Distribution, source opening and publication are outside this checker.']);
});

define('newsletter_source_check','Checks a newsletter running order from supplied story records, source dates, excerpts, editorial takes and a recency window. Returns duplicate sources, out-of-window dates and quotation mismatches while preserving the selected lead. Optional quoted passages are checked verbatim against supplied excerpts. No fetching, sending or independent source verification occurs.',object({cutoff:text,issue_date:text,items:array(object({title:text,url:text,date:text,excerpt:text,quote:text,take:text,why_it_matters:text},['title','url','date','excerpt','take','why_it_matters']),1),lead_index:num}),a=>{
 const issues:string[]=[];if(!iso(a.cutoff)||!iso(a.issue_date)||a.cutoff>a.issue_date)issues.push('Recency window is invalid');if(!Number.isInteger(a.lead_index)||a.lead_index>=a.items.length)issues.push('Lead index must identify an entered item, starting at zero');const seen=new Set<string>();const rows=a.items.map((x:Row,i:number)=>{const u=safeUrl(x.url);const key=u?(u.hash='',u.href):'';if(!u)issues.push(`Item ${i+1}: source URL invalid`);else if(seen.has(key))issues.push(`Item ${i+1}: duplicate source URL`);seen.add(key);if(!iso(x.date)||x.date<a.cutoff||x.date>a.issue_date)issues.push(`Item ${i+1}: outside recency window or invalid date`);if(x.quote&&!x.excerpt.includes(x.quote))issues.push(`Item ${i+1}: quote not present verbatim in supplied excerpt`);return {index:i,title:x.title,date:x.date,url:x.url,quoteMatches:!x.quote||x.excerpt.includes(x.quote),status:'as pasted, not independently checked'};});
 return report(issues,{items:rows,leadIndex:a.lead_index},['Source quality, relevance and whether a claim overgeneralizes require editorial review. No item is silently substituted.']);
});

export const waveTools:Tool[]=Object.values(registry).map(x=>x.tool);
export const isWaveTool=(name:string)=>Object.prototype.hasOwnProperty.call(registry,name);
export function callWaveTool(name:string,args:unknown):CallToolResult{
 if(!isWaveTool(name))return {isError:true,content:[{type:'text',text:'Unknown wave tool.'}]};
 const entry=registry[name];const schema=entry.tool.inputSchema as Schema;const record=args as Row|undefined;const missing=(schema.required??[]).filter(k=>schema.properties?.[k].type==='string'&&!schema.properties[k].enum&&(!record||typeof record[k]!=='string'||!record[k].trim()));if(missing.length)return {isError:true,content:[{type:'text',text:`Missing required input for ${name}: ${missing.join(', ')}. INVALID_INPUT: provide the missing text fields.`}]};const problems=validate(schema,args);
 if(problems.length)return {isError:true,content:[{type:'text',text:JSON.stringify({status:'INVALID_INPUT',issues:problems},null,2)}]};
 try{const result=escapeDeep(entry.run(args as Row));return {content:[{type:'text',text:JSON.stringify(result,null,2)}],structuredContent:result};}catch{return {isError:true,content:[{type:'text',text:'Input could not be checked. No external action occurred.'}]};}
}
