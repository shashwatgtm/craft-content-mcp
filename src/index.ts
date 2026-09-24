#!/usr/bin/env node

// stdio entry point (the npm package). The hosted connector uses the same
// createServer() from server.ts through netlify/functions/mcp.mjs.

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, SERVER_VERSION } from "./server.js";

// Main function
async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`CRAFT Content MCP Server v${SERVER_VERSION} running on stdio`);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
