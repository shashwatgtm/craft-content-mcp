#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { tools } from "./tools.js";
import { generatePMFScorecard } from "./pmf-scorecard.js";
import { generateLaunchCommander } from "./launch-commander.js";
import { generateCustomerInterviewKit } from "./interview-kit.js";
import { generateRetentionPlaybook } from "./retention-playbook.js";
import { generatePartnerArchitect } from "./partner-architect.js";
import { generateCrisisPlanner } from "./crisis-planner.js";
import { generateCompetitiveIntel } from "./competitive-intel.js";
import { generateCRAFTAnalyzer } from "./craft-analyzer.js";

// ============================================================================
// SERVER SETUP
// ============================================================================

const server = new Server(
  {
    name: "@shashwatgtm/craft-gtm-mcp",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      case "pmf_scorecard":
        result = generatePMFScorecard(args as Parameters<typeof generatePMFScorecard>[0]);
        break;
      case "launch_commander":
        result = generateLaunchCommander(args as Parameters<typeof generateLaunchCommander>[0]);
        break;
      case "customer_interview_kit":
        result = generateCustomerInterviewKit(args as Parameters<typeof generateCustomerInterviewKit>[0]);
        break;
      case "retention_playbook":
        result = generateRetentionPlaybook(args as Parameters<typeof generateRetentionPlaybook>[0]);
        break;
      case "partner_architect":
        result = generatePartnerArchitect(args as Parameters<typeof generatePartnerArchitect>[0]);
        break;
      case "crisis_planner":
        result = generateCrisisPlanner(args as Parameters<typeof generateCrisisPlanner>[0]);
        break;
      case "competitive_intel":
        result = generateCompetitiveIntel(args as Parameters<typeof generateCompetitiveIntel>[0]);
        break;
      case "craft_gtm_analyzer":
        result = generateCRAFTAnalyzer(args as Parameters<typeof generateCRAFTAnalyzer>[0]);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error executing ${name}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Main function
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CRAFT GTM MCP Server v2.0.0 running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
