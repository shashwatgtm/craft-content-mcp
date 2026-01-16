#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
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
const server = new Server({
    name: "@shashwatgtm/craft-content-mcp",
    version: "2.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
});
// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        let result;
        switch (name) {
            case "case_study_generator":
                result = generateCaseStudy(args);
                break;
            case "newsletter_builder":
                result = generateNewsletter(args);
                break;
            case "webinar_script":
                result = generateWebinarScript(args);
                break;
            case "content_repurposer":
                result = generateContentRepurposer(args);
                break;
            case "thought_leadership_series":
                result = generateThoughtLeadership(args);
                break;
            case "testimonial_capture":
                result = generateTestimonialCapture(args);
                break;
            case "sales_enablement_content":
                result = generateSalesEnablement(args);
                break;
            case "craft_content_improver":
                result = generateContentImprover(args);
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
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map