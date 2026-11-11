import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CUSTOMER_RESULT_TOOL, customerResultDefinition, runCustomerResult } from './customer-result-content.js';

export function attachCustomerResult(server: Server): void {
  const handlers = (server as any)._requestHandlers as Map<string, (r: any, e: any) => Promise<any>>;
  const list = handlers.get('tools/list')!, call = handlers.get('tools/call')!;
  handlers.set('tools/list', async (r, e) => { const result = await list(r, e); return { ...result, tools: [...result.tools, customerResultDefinition] }; });
  handlers.set('tools/call', async (r, e) => r.params?.name === CUSTOMER_RESULT_TOOL ? runCustomerResult(r.params.arguments) : call(r, e));
}
