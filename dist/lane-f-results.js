import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { LANE_F_RESULTS_HTML } from "./lane-f-results-html.js";
export const names = { account_prioritization: 'Account Prioritization', pmf_scorecard: 'Product Market Fit Scorecard', content_repurposer: 'Content Repurposer' };
export const URI = 'ui://helix/lane-f/results/v1.html';
export const MIME = 'text/html;profile=mcp-app';
export function sectionsOf(text) {
    const parts = [];
    let part = { heading: 'Before you use this result', level: 0, text: '' }, fence = null;
    for (const line of text.split('\n')) {
        const mark = /^\s*(`{3,}|~{3,})/.exec(line);
        if (mark) {
            if (!fence)
                fence = mark[1][0];
            else if (fence === mark[1][0])
                fence = null;
        }
        const h = !fence && /^(#{1,3})\s+(.+)$/.exec(line);
        if (h) {
            if (part.text.trim() || part.level)
                parts.push(part);
            part = { heading: h[2], level: h[1].length, text: '' };
        }
        else
            part.text += (part.text ? '\n' : '') + line;
    }
    if (part.text.trim() || part.level)
        parts.push(part);
    return parts;
}
export function project(name, response) {
    if (!names[name] || response?.isError)
        return null;
    const text = response?.content?.filter(x => x.type === 'text').map(x => x.text).join('\n');
    if (typeof text !== 'string' || !text.trim())
        return null;
    const sections = sectionsOf(text), s = response.structuredContent;
    const result = { version: 1, tool: name, title: names[name], text, sections };
    // Account data is the original shared scoring result, never rebuilt from Markdown.
    if (name === 'account_prioritization' && s?.tool === name && Array.isArray(s.result?.accounts)) {
        result.accounts = s.result;
        result.warnings = s.warnings ?? [];
    }
    return result;
}
export function attachWidget(name, response) {
    const view = project(name, response);
    if (!view)
        return response;
    return { ...response, _meta: { ...response._meta, helixLaneF: view } };
}
export function resourceMetadata() { return { ui: { csp: { connectDomains: [], resourceDomains: [], frameDomains: [] } } }; }
export function toolMetadata(existing = {}) { return { ...existing, ui: { ...existing.ui, resourceUri: URI }, 'openai/outputTemplate': URI }; }
// Called once, last in createServer, after every tool, safety, reader and widget wrapper is registered, so the widget
// view is built from the final answer. SDK 1.x has no public handler getter; like resource-handlers.ts this reads the
// pinned internal registry and fails explicitly if it changes. Existing resources (the slice widget) are kept and
// answered first for their own addresses.
export function attachLaneFResults(server) {
    const handlers = server._requestHandlers;
    if (!(handlers instanceof Map))
        throw new Error("MCP handler registry changed; the result widget requires review.");
    const listTools = handlers.get("tools/list"), callTool = handlers.get("tools/call");
    if (!listTools || !callTool)
        throw new Error("Register tools before the result widget.");
    const listResources = handlers.get("resources/list"), readResource = handlers.get("resources/read");
    server.registerCapabilities({ resources: {} });
    handlers.set("tools/list", async (request, extra) => {
        const result = await listTools(request, extra);
        return { ...result, tools: result.tools.map((tool) => Object.prototype.hasOwnProperty.call(names, tool.name) ? { ...tool, _meta: toolMetadata(tool._meta) } : tool) };
    });
    handlers.set("tools/call", async (request, extra) => attachWidget(String(request?.params?.name), await callTool(request, extra)));
    const resource = { uri: URI, name: 'helix-lane-f-results', mimeType: MIME, _meta: resourceMetadata() };
    handlers.set("resources/list", async (request, extra) => {
        const result = listResources ? await listResources(request, extra) : { resources: [] };
        return { ...result, resources: [...(result.resources ?? []).filter((r) => r.uri !== URI), resource] };
    });
    handlers.set("resources/read", async (request, extra) => {
        if (request?.params?.uri === URI)
            return { contents: [{ uri: URI, mimeType: MIME, text: LANE_F_RESULTS_HTML, _meta: resourceMetadata() }] };
        if (readResource)
            return readResource(request, extra);
        throw new McpError(ErrorCode.InvalidParams, "Unknown result resource");
    });
}
//# sourceMappingURL=lane-f-results.js.map