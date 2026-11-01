import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { escapeText } from "./escape-inputs.js";
import {
  type Row,
  type Schema,
  text,
  num,
  choice,
  object,
  array,
  count,
  iso,
  day,
  safeUrl,
  validate,
  evidence,
  evidenceIssues,
  unique,
  report,
  claimTokens,
  missingClaims,
  normalizeQuote,
  canonicalUrl,
  hasDash,
  superlative,
  placeholder,
  parseEmails,
  parseNewsletter,
  readerText,
} from "./checker-common.js";
const registry: Record<string, { tool: Tool; run: (a: Row) => Row }> = {};
function define(
  name: string,
  description: string,
  schema: Schema,
  run: (a: Row) => Row,
) {
  registry[name] = {
    tool: {
      name,
      description,
      inputSchema: schema as Tool["inputSchema"],
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
define(
  "launch_copy_check",
  "Checks pasted draft lines or launch assets from your supplied text and evidence. Returns counts and findings for superlatives, number and unit evidence, date and weekday mismatches, past dates and speaker approvals. Optional review date enables past-date checks; source records and approvals must come from the user. No source opening or publication occurs.",
  object(
    {
      pasted_text: text,
      as_of: text,
      assets: array(
        object({ label: text, text: text, character_limit: num }, [
          "label",
          "text",
        ]),
        1,
      ),
      claims: array(evidence),
      dates: array(object({ date: text, weekday: text })),
      quotes: array(
        object({
          text: text,
          approval: choice(
            "approved_by_speaker",
            "draft_for_approval",
            "unknown",
          ),
          source: text,
        }),
      ),
    },
    ["assets", "claims", "dates", "quotes"],
  ),
  (a) => {
    const issues = evidenceIssues(a.claims, a.as_of),
      excerpts = a.claims.map((c: Row) => c.excerpt).join("\n");
    const counts = a.assets.map((x: Row, i: number) => {
      const label = "Asset " + (i + 1) + ": ",
        characters = [...x.text].length;
      if (x.character_limit !== undefined && characters > x.character_limit)
        issues.push(label + "over supplied character limit");
      if (hasDash(x.text)) issues.push(label + "contains a dash");
      if (superlative(x.text))
        issues.push(
          label + "superlative or first claim needs source and scope review",
        );
      if (missingClaims(x.text, excerpts).length)
        issues.push(
          label +
            "numeric claim has no matching number and unit in claim excerpts",
        );
      return {
        label: x.label,
        characters,
        words: count(x.text),
        limit: x.character_limit ?? "not supplied",
      };
    });
    const dates = a.dates.map((d: Row, i: number) => {
      const actual = day(d.date);
      if (
        actual === "invalid" ||
        actual.toLowerCase() !== d.weekday.toLowerCase()
      )
        issues.push("Date " + (i + 1) + ": invalid date or weekday mismatch");
      if (!a.as_of || !iso(a.as_of))
        issues.push(
          "Review date missing or invalid; past launch date cannot be checked.",
        );
      else if (iso(d.date) && d.date < a.as_of)
        issues.push(
          "Date " +
            (i + 1) +
            ": launch date is in the past relative to the supplied review date",
        );
      return { ...d, actual };
    });
    a.quotes.forEach((q: Row, i: number) => {
      if (q.approval !== "approved_by_speaker")
        issues.push("Quote " + (i + 1) + ": speaker approval unresolved");
    });
    const thin = a.assets.every((x: Row) => count(x.text) < 4);
    if (thin)
      issues.unshift("Too little launch text to check substantive claims.");
    return report(
      issues,
      {
        counts,
        dates,
        quoteStatuses: a.quotes.map((q: Row) => q.approval),
        claimCount: a.claims.length,
        inputMode: a.pasted_text ? "pasted text" : "asset rows",
      },
      [
        "Counts and token matches do not verify meaning, scope, source truth or permission to publish.",
      ],
      thin,
    );
  },
);
define(
  "newsletter_source_check",
  "Checks story records or pasted issue text from your supplied sources, using ### item headings for a paste. Returns findings for duplicate URLs, quotations, missing sources, dates, editorial takes, recency gaps and caller-reported source status. Optional cutoff and issue date set the review window. No fetch, send or independent verification occurs.",
  object(
    {
      pasted_text: text,
      cutoff: text,
      issue_date: text,
      items: array(
        object(
          {
            title: text,
            url: text,
            date: text,
            excerpt: text,
            quote: text,
            take: text,
            why_it_matters: text,
            status: choice(
              "verified_opened",
              "as_pasted",
              "user_supplied",
              "unverified",
              "conflicting",
            ),
          },
          ["title", "excerpt"],
        ),
        1,
      ),
      lead_index: num,
    },
    ["cutoff", "issue_date", "items", "lead_index"],
  ),
  (a) => {
    const issues: string[] = [];
    if (!iso(a.cutoff) || !iso(a.issue_date) || a.cutoff > a.issue_date)
      issues.push("Recency window is missing or invalid");
    if (!Number.isInteger(a.lead_index) || a.lead_index >= a.items.length)
      issues.push("Lead index must identify an entered item, starting at zero");
    const seen = new Set<string>();
    const rows = a.items.map((x: Row, i: number) => {
      const label = "Item " + (i + 1) + ": ",
        key = canonicalUrl(x.url ?? "");
      if (!key) issues.push(label + "source URL invalid");
      else if (seen.has(key)) issues.push(label + "duplicate source URL");
      seen.add(key);
      if (!iso(x.date ?? "") || x.date < a.cutoff || x.date > a.issue_date)
        issues.push(label + "outside recency window or invalid date");
      const matches =
        !x.quote || normalizeQuote(x.excerpt).includes(normalizeQuote(x.quote));
      if (!matches)
        issues.push(
          label +
            "quote not present verbatim in supplied excerpt after quote/whitespace normalization",
        );
      if (placeholder(x.take ?? ""))
        issues.push(label + "editorial take missing or placeholder");
      if (placeholder(x.why_it_matters ?? ""))
        issues.push(label + "why it matters is missing or placeholder");
      if (x.status !== "verified_opened")
        issues.push(label + "as pasted, not independently checked");
      return {
        index: i,
        title: x.title,
        date: x.date ?? "",
        url: x.url ?? "",
        quoteMatches: matches,
        status:
          x.status === "verified_opened"
            ? "source opened, reported by caller"
            : "as pasted, not independently checked",
      };
    });
    const thin = a.items.every((x: Row) => count(x.excerpt) < 4);
    if (thin) issues.unshift("Too little source text to check the newsletter.");
    return report(
      issues,
      {
        items: rows,
        leadIndex: a.lead_index,
        inputMode: a.pasted_text ? "pasted text" : "story rows",
      },
      [
        "Source quality, relevance and overgeneralization require editorial review. Original URLs and titles are preserved in structured data.",
      ],
      thin,
    );
  },
);
// The published schema describes either a paste or rows; validation retains all
// row requirements after the deterministic paste adapter has run.
const validationSchemas = new Map(
  Object.entries(registry).map(([name, entry]) => [
    name,
    entry.tool.inputSchema as Schema,
  ]),
);
for (const [name, rows, required] of [
  ["sales_sequence_check", "emails", ["type", "start", "anchor"]],
  ["launch_copy_check", "assets", []],
  ["newsletter_source_check", "items", []],
] as [string, string, string[]][]) {
  const entry = registry[name];
  if (entry)
    entry.tool.inputSchema = {
      ...entry.tool.inputSchema,
      required,
      anyOf: [
        { required: ["pasted_text"] },
        { required: validationSchemas.get(name)!.required },
      ],
    };
}
// Held definitions stay in source for review but cannot be listed or called.
const held = new Set(["prompt_structure_check", "proposal_structure_check"]);
export const waveTools: Tool[] = Object.values(registry)
  .map((x) => x.tool)
  .filter((t) => !held.has(t.name));
export const isWaveTool = (name: string) =>
  !held.has(name) && Object.prototype.hasOwnProperty.call(registry, name);
export function callWaveTool(name: string, args: unknown): CallToolResult {
  if (!isWaveTool(name))
    return {
      isError: true,
      content: [{ type: "text", text: "Unknown or held wave tool." }],
    };
  const entry = registry[name],
    schema = validationSchemas.get(name)!;
  let record = args as Row;
  let effective = schema;
  const provided = validate({ ...schema, required: [] }, args);
  if (provided.length)
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { status: "INVALID_INPUT", issues: provided },
            null,
            2,
          ),
        },
      ],
    };
  if (record?.pasted_text) {
    record = { ...record };
    const pasted = record.pasted_text as string;
    if (name === "sales_sequence_check") {
      if (record.emails)
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "INVALID_INPUT: supply pasted text or email rows, not both.",
            },
          ],
        };
      record.emails = parseEmails(pasted);
      record.evidence ??= [];
    }
    if (name === "launch_copy_check") {
      if (record.assets)
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "INVALID_INPUT: supply pasted text or assets, not both.",
            },
          ],
        };
      record.assets = pasted
        .split(/\r?\n/)
        .filter((s) => s.trim())
        .map((text, i) => ({ label: "Line " + (i + 1), text }));
      record.claims ??= [];
      record.dates ??= [];
      record.quotes ??= [];
    }
    if (name === "newsletter_source_check") {
      if (record.items)
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "INVALID_INPUT: supply pasted text or story rows, not both.",
            },
          ],
        };
      record.items = parseNewsletter(pasted);
      record.cutoff ??= "";
      record.issue_date ??= "";
      record.lead_index ??= 0;
      effective = { ...schema, required: ["items"] };
    }
  }
  const problems = validate(effective, record);
  if (problems.length)
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { status: "INVALID_INPUT", issues: problems },
            null,
            2,
          ),
        },
      ],
    };
  try {
    const result = entry.run(record);
    return {
      content: [{ type: "text", text: readerText(result, escapeText) }],
      structuredContent: result,
    };
  } catch {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: "Input could not be checked. No external action occurred.",
        },
      ],
    };
  }
}
