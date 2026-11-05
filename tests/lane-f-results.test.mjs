// Lane F result widget: additive metadata only. The tool contract and the answer text stay as they were.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const TOOL = 'content_repurposer';
const URI = 'ui://helix/lane-f/results/v1.html';
const ARGS = {"source_content":"How a spend management platform for mid market finance teams cut weekly manual work. Teams that adopted the workflow reported fewer handoffs and faster review cycles. The approach has three steps: map the current process, remove duplicate approvals, and measure cycle time every week. A sample team saw review time fall from five days to two days over one quarter, based on its own internal tracking. The lesson is simple: fix the process first, then automate the steps that remain.","source_type":"webinar_transcript","target_formats":"linkedin_post, email, quote_cards","brand_voice":"friendly","key_message":"Fix the process first, then automate","your_sector":"fintech"};
const BAD = {"source_content":"Short sample text","source_type":"not_a_type"};
const fixture = JSON.parse(readFileSync(new URL('./fixtures/release-production-tools.json', import.meta.url), 'utf8'));
const { default: handler } = await import(new URL('../netlify/functions/mcp.mjs', import.meta.url));
let id = 0;
async function rpc(method, params = {}) {
  const response = await handler(new Request('https://local.invalid/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }) }));
  const message = await response.json();
  assert.ok(!message.error, JSON.stringify(message.error));
  return message.result;
}
const text = (result) => result.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');

test('tool names, descriptions and input schemas equal the pinned production contract; only the widget tool gains _meta', async () => {
  const { tools } = await rpc('tools/list');
  assert.deepEqual(tools.map((t) => [t.name, t.description, t.inputSchema]), fixture.tools_list.tools.map((t) => [t.name, t.description, t.inputSchema]));
  for (const tool of tools) {
    if (tool.name === TOOL) assert.deepEqual(tool._meta, { ...(fixture.tools_list.tools.find((t) => t.name === TOOL)._meta ?? {}), ui: { resourceUri: URI }, 'openai/outputTemplate': URI });
    else assert.notEqual(tool._meta?.ui?.resourceUri, URI);
  }
});

test('the widget resource is listed once and read back with a strict CSP whose hashes match the inline code', async () => {
  const { resources } = await rpc('resources/list');
  assert.equal(resources.filter((r) => r.uri === URI).length, 1);
  const { contents } = await rpc('resources/read', { uri: URI });
  assert.equal(contents.length, 1);
  assert.equal(contents[0].mimeType, 'text/html;profile=mcp-app');
  assert.deepEqual(contents[0]._meta, { ui: { csp: { connectDomains: [], resourceDomains: [], frameDomains: [] } } });
  const html = contents[0].text;
  assert.equal(createHash('sha256').update(html, 'utf8').digest('hex'), 'a8492c128f5bbff68cdbd2c824d46335aec70b4379ad787c2ad35f30dc581a02');
  const hash = (s) => createHash('sha256').update(s, 'utf8').digest('base64');
  const script = /<script>([\s\S]*)<\/script>/.exec(html)[1], style = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
  assert.match(html, new RegExp(`default-src 'none'; script-src 'sha256-${hash(script).replace(/[+/]/g, '\\$&')}'; style-src 'sha256-${hash(style).replace(/[+/]/g, '\\$&')}'`));
});

test('a successful answer keeps its text and gains a deterministic widget view built from that same text', async () => {
  const first = await rpc('tools/call', { name: TOOL, arguments: ARGS });
  const second = await rpc('tools/call', { name: TOOL, arguments: ARGS });
  assert.ok(!first.isError);
  assert.equal(first._meta.helixLaneF.text, text(first));
  assert.equal(first._meta.helixLaneF.tool, TOOL);
  assert.ok(first._meta.helixLaneF.sections.length > 1);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test('an input error answer carries no widget view', async () => {
  const result = await rpc('tools/call', { name: TOOL, arguments: BAD });
  assert.equal(result.isError, true);
  assert.equal(result._meta?.helixLaneF, undefined);
});
