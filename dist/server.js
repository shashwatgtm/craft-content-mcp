import { withReadingGuide } from './reader-actions.js';
import { softwareAdvice } from './software-policy.js';
import { BUILD_PROFILE } from './build-profile.js';
import { reserveTools, isReserveTool, callReserveTool } from './reserve-tools.js';
import { attachWidgets } from './widget-layer.js';
import { waveTools, isWaveTool, callWaveTool } from './wave2-checkers.js';
import { decisionInputs, decisionHelp, decisionLimit } from "./decision-limits.js";
import { readerLabel, readerIssue } from "./text-signals.js";
import { sectorChoiceNotice } from './text-signals.js';
import { explainSector } from './verticals.js';
// Shared MCP server definition, used by both entry points:
//   src/index.ts                 stdio (the npm package)
//   netlify/functions/mcp.mjs    Streamable HTTP (the hosted connector)
// The tool dispatch below is unchanged from the published version; this file adds
// tool titles and annotations, and a clear message when a required input is missing.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { tools } from "./tools.js";
import { neutraliseDeep } from "./echo-safe.js";
import { reshapeLists } from "./list-shape.js";
import { generateCaseStudy } from "./case-study-generator.js";
import { generateNewsletter } from "./newsletter-builder.js";
import { generateWebinarScript } from "./webinar-script.js";
import { generateContentRepurposer } from "./content-repurposer.js";
import { generateThoughtLeadership } from "./thought-leadership.js";
import { generateTestimonialCapture } from "./testimonial-capture.js";
import { generateSalesEnablement } from "./sales-enablement.js";
import { generateContentImprover } from "./content-improver.js";
export const SERVER_NAME = "craft-content-mcp";
export const SERVER_VERSION = "2.2.23";
// Every tool only builds text from its inputs: no storage, no network, no side effects.
const TOOL_TITLES = {
    "case_study_generator": "Case Study Generator",
    "newsletter_builder": "Newsletter Builder",
    "webinar_script": "Webinar Script",
    "content_repurposer": "Content Repurposer",
    "thought_leadership_series": "Thought Leadership Series",
    "testimonial_capture": "Testimonial Capture",
    "sales_enablement_content": "Sales Enablement Content",
    "craft_content_improver": "CRAFT Content Improver"
};
for (const tool of tools) {
    Object.assign(tool.inputSchema.properties || {}, decisionInputs(tool.name));
    tool.description = (tool.description || '') + decisionHelp(tool.name);
}
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
const NEGATIVE_AMOUNT = /\$\s*[-\u2212]\s*\d|(^|[\s(:=,;])[-\u2212](?:\$|usd|inr|eur|gbp|rs\.?|\u20b9|\u20ac|\u00a3)?\s?\d[\d,]*(?:\.\d+)?(?![\d,.]|\s*%)/i;
const NEGATIVE_MONEY = /[-−]\s?[$₹€£]\s*\d|[$₹€£]\s*[-−]\s*\d|\b(?:mrr|arr|cac|ltv|acv)\b[:\s]*[-−]\s*\d/i;
const AMOUNT_RANGE = /\d\s*[kmb]?\s*(?:-|\u2013|\u2014|to)\s*[$\u20b9\u20ac\u00a3]?\s*\d/i;
function checkValue(schema, holder, key, path, problems) {
    const box = holder;
    const value = box[key];
    if (value === undefined || value === null)
        return;
    if (schema.properties && typeof value === "object" && !Array.isArray(value)) {
        for (const [k, p] of Object.entries(schema.properties))
            checkValue(p, value, k, path ? `${path}.${k}` : k, problems);
        return;
    }
    if (schema.items && Array.isArray(value)) {
        value.forEach((_, i) => checkValue(schema.items, value, i, `${path}[${i}]`, problems));
        return;
    }
    if (Array.isArray(schema.enum) && typeof value === "string" && !schema.enum.includes(value)) {
        // Run 12 (R12-21 item 26 and the testimonial_capture fix): a plain hint for the two values people type most.
        const hint = ENUM_HINTS[`${path}=${value.trim().toLowerCase()}`];
        problems.push(`${path} must be one of: ${schema.enum.join(", ")}${hint ? `. ${hint}` : ""}`);
        return;
    }
    if (schema.type !== "number" && schema.type !== "integer")
        return;
    let v = value;
    if (typeof v === "string") {
        const n = v.trim() === "" ? NaN : Number(v.replace(/,/g, "").trim());
        if (!Number.isFinite(n)) {
            problems.push(`${path} must be a number, written with digits only (for example 220000)`);
            return;
        }
        box[key] = n;
        v = n;
    }
    if (typeof v !== "number" || !Number.isFinite(v)) {
        problems.push(`${path} must be a number`);
        return;
    }
    // Run 20 (A17-O25): an integer input is a whole number; 2.5 articles is refused, not rounded or printed as "2.5 pieces".
    if (schema.type === "integer" && !Number.isInteger(v)) {
        problems.push(`${path} must be a whole number`);
        return;
    }
    if (typeof schema.minimum === "number" && v < schema.minimum)
        problems.push(`${path} must be ${schema.minimum} or more`);
    if (typeof schema.exclusiveMinimum === "number" && v <= schema.exclusiveMinimum)
        problems.push(`${path} must be more than ${schema.exclusiveMinimum}`);
    if (typeof schema.maximum === "number" && v > schema.maximum)
        problems.push(`${path} must be ${schema.maximum} or less`);
}
const MONEY_TEXT = { sales_enablement_content: ["price_context"] };
// A value that is not in the list but has an obvious match gets a hint after the list of choices.
const ENUM_HINTS = {
    "content_type=linkedin_post": "For a LinkedIn post, use social_post",
    "content_type=linkedin": "For a LinkedIn post, use social_post",
    "testimonial_type=quote": "For a written quote, use written_quote",
};
const METRIC_TEXT = {};
const ONE_AMOUNT = {};
function checkRequiredInputs(name, args) {
    const tool = tools.find((t) => t.name === name);
    if (!tool) {
        return `Unknown tool: ${name}. Available tools: ${tools.map((t) => t.name).join(", ")}.`;
    }
    const required = (tool.inputSchema.required ?? []);
    // Run 16 R16-10 (rule B52): a required text (a string with no fixed list of choices) that is empty or only whitespace counts as missing.
    const props = (tool.inputSchema.properties ?? {});
    const blankText = (key) => typeof args?.[key] === "string" && args[key].trim() === "" && props[key]?.type === "string" && !Array.isArray(props[key]?.enum);
    const missing = required.filter((key) => args?.[key] === undefined || args?.[key] === null || blankText(key));
    if (missing.length > 0) {
        return `Missing required input for ${readerLabel(name)}: ${missing.map(readerLabel).join(", ")}. Provide ${missing.length === 1 ? "it" : "them"} and call the tool again.`;
    }
    // Decision N2 (run 6) and run 7: schema limits at any depth, choices, money text and single amounts.
    const problems = [];
    if (args) {
        for (const [k, p] of Object.entries(tool.inputSchema.properties ?? {}))
            checkValue(p, args, k, k, problems);
    }
    for (const key of MONEY_TEXT[name] ?? []) {
        const raw = args?.[key];
        if (typeof raw === "string" && NEGATIVE_AMOUNT.test(raw))
            problems.push(`${key} must not contain a negative amount`);
    }
    for (const key of METRIC_TEXT[name] ?? []) {
        const raw = args?.[key];
        if (typeof raw === "string" && NEGATIVE_MONEY.test(raw))
            problems.push(`${key} must not contain a negative amount of money`);
    }
    for (const key of ONE_AMOUNT[name] ?? []) {
        const raw = args?.[key];
        if (typeof raw === "string" && AMOUNT_RANGE.test(raw))
            problems.push(`${key} must be one amount, not a range (for example $75,000)`);
    }
    if (problems.length > 0) {
        return `Invalid input for ${readerLabel(name)}: ${problems.map(readerIssue).join("; ")}.`;
    }
    return null;
}
export function createServer() {
    const server = new Server({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    }, {
        capabilities: {
            tools: {},
        },
    });
    // List tools handler
    if (BUILD_PROFILE.profile !== "current")
        attachWidgets(server);
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return { tools: [...listedTools, ...(BUILD_PROFILE.profile === "wave" ? waveTools : []), ...(BUILD_PROFILE.profile === "wave" ? reserveTools() : [])] };
    });
    // Call tool handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        if (BUILD_PROFILE.profile === "wave" && isReserveTool(request.params.name))
            return callReserveTool(request.params.name, request.params.arguments);
        if (BUILD_PROFILE.profile === "wave" && isWaveTool(request.params.name))
            return callWaveTool(request.params.name, request.params.arguments);
        const { name } = request.params;
        // Run 20 (D086): the one place where a tools/call reaches a tool, on both the hosted path (netlify/functions/mcp.mjs and
        // api.mjs) and the stdio path (src/index.ts), because all use this server. Markup in what the user typed is made inert once,
        // here; the words stay (src/echo-safe.ts).
        const args = reshapeLists(neutraliseDeep(request.params.arguments));
        const problem = checkRequiredInputs(name, args);
        if (problem) {
            return { content: [{ type: "text", text: problem }], isError: true };
        }
        const advice = softwareAdvice(args);
        if (advice)
            return { content: [{ type: 'text', text: advice }] };
        try {
            const limit = decisionLimit(name, (args || {}));
            if (limit.stop)
                return { content: [{ type: 'text', text: limit.text }] };
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
            result = limit.text + sectorChoiceNotice(name, (args || {}), text => { const r = explainSector({ seller: [text] }); return { id: r.vertical?.id, name: r.vertical?.name, source: r.source }; }) + result;
            return {
                content: [
                    {
                        type: "text",
                        text: withReadingGuide(name, closeDanglingBrackets(result), args),
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
    return server;
}
/** Run 21c round 4: a heading or subject line cut inside a bracket note ends before the bracket (no unclosed bracket in a headline). */
export function closeDanglingBrackets(text) {
    return text.replace(/^((?:#{1,6} |\*\*Headline:\*\* |\*\*Subject:\*\* |Subject: )[^\n]*)$/gm, (line) => {
        const open = (line.match(/\(/g) || []).length;
        const close = (line.match(/\)/g) || []).length;
        if (open <= close)
            return line;
        const at = line.lastIndexOf('(');
        return line.slice(0, at).replace(/[\s,;:\-]+$/, '');
    });
}
//# sourceMappingURL=server.js.map