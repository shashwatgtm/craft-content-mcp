import { describeSchema, renderReport } from "./reserve-presentation.js";
import { escapeDeep } from "./escape-inputs.js";
export const text = { type: "string", maxLength: 8000 };
export const num = (minimum = 0, maximum = Number.MAX_VALUE) => ({
    type: "number",
    minimum,
    maximum,
});
export const bool = { type: "boolean" };
export const choice = (...values) => ({
    ...text,
    enum: values,
});
export const object = (properties, required = Object.keys(properties)) => ({
    type: "object",
    properties,
    required,
    additionalProperties: false,
});
export const array = (items, maxItems = 100, minItems = 0) => ({
    type: "array",
    items,
    minItems,
    maxItems,
});
export const iso = (s) => typeof s === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    Number.isFinite(+new Date(s + "T00:00:00Z")) &&
    new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;
export const days = (from, to) => Math.round((+new Date(to + "T00:00:00Z") - +new Date(from + "T00:00:00Z")) / 86400000);
export const plusDays = (date, n) => new Date(+new Date(date + "T00:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
export const round = (n) => Math.round(n * 10) / 10;
export const sum = (values) => {
    const n = values.reduce((a, b) => a + b, 0);
    if (!Number.isFinite(n))
        throw new Error("Calculated total exceeds the finite numeric range.");
    return n;
};
export function requireDate(date, label, asOf) {
    if (!iso(date))
        throw new Error(label + " must be a real YYYY-MM-DD date.");
    if (asOf && days(date, asOf) < 0)
        throw new Error(label + " cannot be after the assessment date.");
}
export function requireUnique(rows, key) {
    const ids = rows.map((r) => String(r[key]).trim().toLowerCase());
    if (new Set(ids).size !== ids.length)
        throw new Error("Duplicate " + key + " values are not allowed.");
}
export const esc = (value) => String(value ?? "Not supplied")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/[\u2013\u2014]/g, " - ")
    .replace(/\r?\n/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/[\\`*_{}\[\]()#+.!|>~\-]/g, (c) => "\\" + c);
const safeData = (v) => typeof v === "string"
    ? v
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, "")
        .replace(/[\u2013\u2014]/g, " - ")
    : Array.isArray(v)
        ? v.map(safeData)
        : v && typeof v === "object"
            ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, safeData(x)]))
            : v;
export function reportText(report) {
    return renderReport(report);
}
function validate(s, v, path = "$") {
    const issues = [];
    if (s.type === "object") {
        if (!v || typeof v !== "object" || Array.isArray(v))
            return [path + ": object required"];
        for (const k of s.required ?? [])
            if (!Object.prototype.hasOwnProperty.call(v, k) ||
                (typeof v[k] === "string" && !v[k].trim()))
                issues.push(path + "." + k + ": required");
        for (const [k, x] of Object.entries(v)) {
            if (!Object.prototype.hasOwnProperty.call(s.properties ?? {}, k))
                issues.push(path + ": unknown property");
            else
                issues.push(...validate(s.properties[k], x, path + "." + k));
        }
    }
    else if (s.type === "array") {
        if (!Array.isArray(v))
            return [path + ": array required"];
        if (v.length < (s.minItems ?? 0) || v.length > (s.maxItems ?? 100))
            return [path + ": row count outside bounds"];
        v.forEach((x, i) => issues.push(...validate(s.items, x, path + "[" + i + "]")));
    }
    else if (s.type === "string") {
        if (typeof v !== "string")
            return [path + ": text required"];
        if (v.length > (s.maxLength ?? 8000))
            issues.push(path + ": text too long");
        if (s.enum && !s.enum.includes(v))
            issues.push(path + ": unsupported choice");
    }
    else if (s.type === "number") {
        if (typeof v !== "number" ||
            !Number.isFinite(v) ||
            v < (s.minimum ?? -Infinity) ||
            v > (s.maximum ?? Infinity))
            issues.push(path + ": finite number in range required");
    }
    else if (s.type === "boolean" && typeof v !== "boolean")
        issues.push(path + ": boolean required");
    return issues;
}
const registry = {};
export function define(name, description, schema, run) {
    schema = describeSchema(schema, name);
    registry[name] = {
        tool: {
            name,
            description,
            inputSchema: schema,
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        run,
    };
}
export const reserveTools = () => Object.values(registry).map((x) => x.tool);
export const isReserveTool = (name) => Object.prototype.hasOwnProperty.call(registry, name);
export function callReserveTool(name, args) {
    if (!isReserveTool(name))
        return {
            isError: true,
            content: [{ type: "text", text: "Unknown reserve tool." }],
        };
    const entry = registry[name], schema = entry.tool.inputSchema;
    const input = args && typeof args === "object" ? args : {};
    const missing = (schema.required ?? []).find((k) => schema.properties?.[k].type === "string" &&
        !schema.properties[k].enum &&
        (input[k] == null || (typeof input[k] === "string" && !input[k].trim())));
    if (missing)
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: "Missing required input for " +
                        name +
                        ": " +
                        missing +
                        ". Please supply text for this field.",
                },
            ],
        };
    const issues = validate(schema, args);
    if (issues.length)
        return {
            isError: true,
            content: [{ type: "text", text: "Invalid input: " + issues.join("; ") }],
        };
    try {
        const report = entry.run(args);
        return {
            content: [{ type: "text", text: reportText(report) }],
            structuredContent: {
                report: escapeDeep(safeData(report)),
                reportStringEncoding: "Markdown backslash escapes; control characters removed and long dashes normalized. Display as inert text, not HTML.",
            },
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: "Invalid input: " +
                        esc(error instanceof Error ? error.message : "could not be assessed"),
                },
            ],
        };
    }
}
//# sourceMappingURL=reserve-common.js.map