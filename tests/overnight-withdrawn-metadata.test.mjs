import test from 'node:test';
import assert from 'node:assert/strict';
import {generateContentRepurposer} from '../dist/content-repurposer.js';
const base='We sell lending software in India.\nReader action: Read the checklist.\n';
const valid='Source URL: https://example.org/review\nSender: Example editor';
const render=notes=>generateContentRepurposer({source_type:'blog_post',target_formats:'email',source_content:base+notes});
for(const notes of [
 valid+'\nThe sender attribution is incorrect. Do not use it.',
 'The sender attribution below is incorrect. Do not use it.\n'+valid,
 valid+'\nThe named sender has withdrawn permission to use their name.',
 'Source URL: https://example.org/review\nSender: incorrect, do not use'
])test('M102 withdrawn sender holds the proposed signature: '+notes,()=>{
 const out=render(notes);assert.match(out,/Email held for completion/);assert.match(out,/confirm the sender name/);
 assert.doesNotMatch(out,/Best regards,?\nExample editor|Best regards,?\nincorrect|Source link and sender supplied/);
});
for(const notes of [
 valid+'\nThe source URL above has been withdrawn. Do not link to it.',
 'The URL below is incorrect. No approved replacement is available.\n'+valid,
 valid+'\nThe URL above is incorrect. No approved replacement is available.'
])test('M102 withdrawn URL holds the proposed source action: '+notes,()=>{
 const out=render(notes);assert.match(out,/Email held for completion/);assert.match(out,/confirm the source URL/);
 assert.doesNotMatch(out,/Read the full blog post: https|Source link and sender supplied/);
});
for(const notes of [valid,valid+'\nThe source URL and sender attribution have been approved.',valid+'\nOur product cannot run customer risk models.',valid+'\nThe source URL is not incorrect. The sender attribution has not been withdrawn.'])test('M102 positive metadata survives unrelated or negated denials: '+notes,()=>{
 const out=render(notes);assert.doesNotMatch(out,/Email held for completion/);assert.match(out,/Source link and sender supplied/);
 assert.match(out,/Read the full blog post: https/);assert.match(out,/Example editor/);
});
