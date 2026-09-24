#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { tools } from "./tools.js";
import { generateCaseStudy } from "./case-study-generator.js";
import { generateNewsletter } from "./newsletter-builder.js";
import { generateWebinarScript } from "./webinar-script.js";
import { generateContentRepurposer } from "./content-repurposer.js";
import { generateThoughtLeadership } from "./thought-leadership.js";
import { generateTestimonialCapture } from "./testimonial-capture.js";
import { generateSalesEnablement } from "./sales-enablement.js";
import { generateContentImprover } from "./content-improver.js";

// ============================================================================
// SERVER SETUP
// ============================================================================

const server = new Server(
  {
    name: "@shashwatgtm/craft-content-mcp",
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
      case "case_study_generator":
        result = generateCaseStudy(args as Parameters<typeof generateCaseStudy>[0]);
        break;
      case "newsletter_builder":
        result = generateNewsletter(args as Parameters<typeof generateNewsletter>[0]);
        break;
      case "webinar_script":
        result = generateWebinarScript(args as Parameters<typeof generateWebinarScript>[0]);
        break;
      case "content_repurposer":
        result = generateContentRepurposer(args as Parameters<typeof generateContentRepurposer>[0]);
        break;
      case "thought_leadership_series":
        result = generateThoughtLeadership(args as Parameters<typeof generateThoughtLeadership>[0]);
        break;
      case "testimonial_capture":
        result = generateTestimonialCapture(args as Parameters<typeof generateTestimonialCapture>[0]);
        break;
      case "sales_enablement_content":
        result = generateSalesEnablement(args as Parameters<typeof generateSalesEnablement>[0]);
        break;
      case "craft_content_improver":
        result = generateContentImprover(args as Parameters<typeof generateContentImprover>[0]);
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
  console.error("CRAFT Content MCP Server v2.0.0 running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
