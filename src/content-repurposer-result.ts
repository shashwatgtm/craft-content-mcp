import type { buildContentRepurposer } from './content-repurposer.js';

export const CONTENT_UI_URI = 'ui://helix/content-repurposer/v1.html';
export const CONTENT_UI_MIME = 'text/html;profile=mcp-app';
export const CONTENT_UI_META = { ui: { csp: { connectDomains: [], resourceDomains: [], frameDomains: [], baseUriDomains: [] } } };
export const CONTENT_INPUT_KEYS = ['source_content', 'source_type', 'target_formats', 'brand_voice', 'key_message', 'your_sector'] as const;

// Only original, public tool inputs round trip to the component. This is not
// model-visible content and is rendered as inert form values, never markup.
export function contentLiteralInputs(raw: unknown): Record<string, string> {
  const inputs: Record<string, string> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return inputs;
  for (const key of CONTENT_INPUT_KEYS) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === 'string') inputs[key] = value;
  }
  return inputs;
}

export function contentWidgetResult(
  kit: ReturnType<typeof buildContentRepurposer>,
  finish: (text: string) => string,
  literalInputs: unknown,
) {
  return {
    structuredContent: {
      schemaVersion: 1,
      tool: 'content_repurposer',
      provenance: 'Generated from caller supplied text by the existing deterministic writer. Proof labels are caller supplied and are not independently verified.',
      warnings: kit.warnings,
      result: { ...kit.result, pieces: kit.result.pieces.map(piece => ({ ...piece, text: finish(piece.text) })) },
    },
    _meta: { helixContentRepurposer: { inputsBase64: Buffer.from(JSON.stringify(contentLiteralInputs(literalInputs)), 'utf8').toString('base64') } },
  };
}
