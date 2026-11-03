import test from 'node:test';
import assert from 'node:assert/strict';
import {generateContentRepurposer} from '../dist/content-repurposer.js';

const base={source_content:'We sell lending software in India.',source_type:'blog_post'};
for(const target_formats of ['blog_summary','linkedin_post','quote_cards','infographic_outline','podcast_talking_points','slide_deck_outline']) {
 test('M088 optional metadata is not invented for '+target_formats,()=>{
  for(const metadata of ['', '\nSource URL: https://example.org/review','\nSender: Editor','\nSource URL: not-a-url\nSender: Editor']){
   const out=generateContentRepurposer({...base,target_formats,source_content:base.source_content+metadata});
   assert.doesNotMatch(out,/Source link and sender supplied/);
   assert.match(out,/Review the wording and publication permission/);
  }
  const out=generateContentRepurposer({...base,target_formats,source_content:base.source_content+'\nSource URL: https://example.org/review\nSender: Editor'});
  assert.match(out,/Source link and sender supplied/);
 });
}
test('M088 required email metadata retains the completion hold',()=>{
 const out=generateContentRepurposer({...base,target_formats:'email'});
 assert.match(out,/confirm the source URL/);assert.match(out,/confirm the sender name/);
 assert.match(out,/Email held for completion/);assert.doesNotMatch(out,/Source link and sender supplied/);
});
