// Shared MCP server definition, used by both entry points:
//   src/index.ts                 stdio (the npm package)
//   netlify/functions/mcp.mjs    Streamable HTTP (the hosted connector)
// The tool dispatch below is unchanged from the published version; this file adds
// tool titles and annotations, and a clear message when a required input is missing.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
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

export const SERVER_NAME = "craft-content-mcp";
export const SERVER_VERSION = "2.2.0";

// Every tool only builds text from its inputs: no storage, no network, no side effects.
const TOOL_TITLES: Record<string, string> = {
  "case_study_generator": "Case Study Generator",
  "newsletter_builder": "Newsletter Builder",
  "webinar_script": "Webinar Script",
  "content_repurposer": "Content Repurposer",
  "thought_leadership_series": "Thought Leadership Series",
  "testimonial_capture": "Testimonial Capture",
  "sales_enablement_content": "Sales Enablement Content",
  "craft_content_improver": "CRAFT Content Improver"
};

export const listedTools = tools.map((tool) => {
  const title = TOOL_TITLES[tool.name] ?? tool.name;
  return {
    ...tool,
    title,
    annotations: {
      title,
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  };
});

function checkRequiredInputs(
  name: string,
  args: Record<string, unknown> | undefined
): string | null {
  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    return `Unknown tool: ${name}. Available tools: ${tools.map((t) => t.name).join(", ")}.`;
  }
  const required = ((tool.inputSchema as { required?: string[] }).required ?? []) as string[];
  const missing = required.filter((key) => args?.[key] === undefined || args?.[key] === null);
  if (missing.length > 0) {
    return `Missing required input for ${name}: ${missing.join(", ")}. Provide ${missing.length === 1 ? "it" : "them"} and call the tool again.`;
  }
  // Decision N2 (run 6): amounts, counts and durations cannot be negative; the schema says which (minimum).
  const props = ((tool.inputSchema as { properties?: Record<string, { minimum?: number }> }).properties ?? {});
  const below = Object.entries(props)
    .filter(([key, p]) => {
      const raw = args?.[key];
      const v = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
      return typeof p.minimum === "number" && typeof v === "number" && Number.isFinite(v) && v < p.minimum;
    })
    .map(([key, p]) => `${key} must be ${p.minimum} or more`);
  if (below.length > 0) {
    return `Invalid input for ${name}: ${below.join("; ")}.`;
  }
  return null;
}

export function createServer(): Server {
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: listedTools };
  });

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const problem = checkRequiredInputs(name, args as Record<string, unknown> | undefined);
    if (problem) {
      return { content: [{ type: "text", text: problem }], isError: true };
    }

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

  return server;
}
