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
export const SERVER_VERSION = "2.2.2";

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

// Decision N2 (run 6) and the run 7 fixes (T2, T3, T5, T6): every input is checked against its schema before a tool runs,
// at any depth. A number sent as text is read the way the web form reads it (commas allowed) or refused; minimum,
// exclusiveMinimum and maximum hold; a choice must be one of the listed values; a text field that holds money
// (MONEY_TEXT) cannot hold a negative amount (a negative percentage such as "-12% growth" is fine); a metrics text
// (METRIC_TEXT) cannot hold negative money but may hold a negative NPS or growth rate; a field that must
// hold one amount (ONE_AMOUNT) cannot hold a range.
type SchemaNode = { type?: string; minimum?: number; exclusiveMinimum?: number; maximum?: number; enum?: unknown[]; properties?: Record<string, SchemaNode>; items?: SchemaNode };
const NEGATIVE_AMOUNT = /\$\s*[-\u2212]\s*\d|(^|[\s(:=,;])[-\u2212](?:\$|usd|inr|eur|gbp|rs\.?|\u20b9|\u20ac|\u00a3)?\s?\d[\d,]*(?:\.\d+)?(?![\d,.]|\s*%)/i;
const NEGATIVE_MONEY = /[-−]\s?[$₹€£]\s*\d|[$₹€£]\s*[-−]\s*\d|\b(?:mrr|arr|cac|ltv|acv)\b[:\s]*[-−]\s*\d/i;
const AMOUNT_RANGE = /\d\s*[kmb]?\s*(?:-|\u2013|\u2014|to)\s*[$\u20b9\u20ac\u00a3]?\s*\d/i;
function checkValue(schema: SchemaNode, holder: Record<string, unknown> | unknown[], key: string | number, path: string, problems: string[]): void {
  const box = holder as Record<string | number, unknown>;
  const value = box[key];
  if (value === undefined || value === null) return;
  if (schema.properties && typeof value === "object" && !Array.isArray(value)) {
    for (const [k, p] of Object.entries(schema.properties)) checkValue(p, value as Record<string, unknown>, k, path ? `${path}.${k}` : k, problems);
    return;
  }
  if (schema.items && Array.isArray(value)) {
    value.forEach((_, i) => checkValue(schema.items as SchemaNode, value, i, `${path}[${i}]`, problems));
    return;
  }
  if (Array.isArray(schema.enum) && typeof value === "string" && !schema.enum.includes(value)) {
    problems.push(`${path} must be one of: ${schema.enum.join(", ")}`);
    return;
  }
  if (schema.type !== "number" && schema.type !== "integer") return;
  let v = value;
  if (typeof v === "string") {
    const n = v.trim() === "" ? NaN : Number(v.replace(/,/g, "").trim());
    if (!Number.isFinite(n)) { problems.push(`${path} must be a number, written with digits only (for example 220000)`); return; }
    box[key] = n;
    v = n;
  }
  if (typeof v !== "number" || !Number.isFinite(v)) { problems.push(`${path} must be a number`); return; }
  if (typeof schema.minimum === "number" && v < schema.minimum) problems.push(`${path} must be ${schema.minimum} or more`);
  if (typeof schema.exclusiveMinimum === "number" && v <= schema.exclusiveMinimum) problems.push(`${path} must be more than ${schema.exclusiveMinimum}`);
  if (typeof schema.maximum === "number" && v > schema.maximum) problems.push(`${path} must be ${schema.maximum} or less`);
}

const MONEY_TEXT: Record<string, string[]> = { sales_enablement_content: ["price_context"] };
const METRIC_TEXT: Record<string, string[]> = {};
const ONE_AMOUNT: Record<string, string[]> = {};

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
  // Decision N2 (run 6) and run 7: schema limits at any depth, choices, money text and single amounts.
  const problems: string[] = [];
  if (args) {
    for (const [k, p] of Object.entries((tool.inputSchema as unknown as SchemaNode).properties ?? {})) checkValue(p, args, k, k, problems);
  }
  for (const key of MONEY_TEXT[name] ?? []) {
    const raw = args?.[key];
    if (typeof raw === "string" && NEGATIVE_AMOUNT.test(raw)) problems.push(`${key} must not contain a negative amount`);
  }
  for (const key of METRIC_TEXT[name] ?? []) {
    const raw = args?.[key];
    if (typeof raw === "string" && NEGATIVE_MONEY.test(raw)) problems.push(`${key} must not contain a negative amount of money`);
  }
  for (const key of ONE_AMOUNT[name] ?? []) {
    const raw = args?.[key];
    if (typeof raw === "string" && AMOUNT_RANGE.test(raw)) problems.push(`${key} must be one amount, not a range (for example $75,000)`);
  }
  if (problems.length > 0) {
    return `Invalid input for ${name}: ${problems.join("; ")}.`;
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
