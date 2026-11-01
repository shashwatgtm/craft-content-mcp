import { Server } from "@modelcontextprotocol/sdk/server/index.js";
export declare const SERVER_NAME = "craft-content-mcp";
export declare const SERVER_VERSION = "2.2.23";
export declare const listedTools: {
    title: string;
    annotations: {
        title: string;
        readOnlyHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
    };
    inputSchema: {
        [x: string]: unknown;
        type: "object";
        properties?: {
            [x: string]: object;
        } | undefined;
        required?: string[] | undefined;
    };
    name: string;
    description?: string | undefined;
    outputSchema?: {
        [x: string]: unknown;
        type: "object";
        properties?: {
            [x: string]: object;
        } | undefined;
        required?: string[] | undefined;
    } | undefined;
    execution?: {
        taskSupport?: "optional" | "required" | "forbidden" | undefined;
    } | undefined;
    _meta?: {
        [x: string]: unknown;
    } | undefined;
    icons?: {
        src: string;
        mimeType?: string | undefined;
        sizes?: string[] | undefined;
        theme?: "light" | "dark" | undefined;
    }[] | undefined;
}[];
export declare function createServer(): Server;
/** Run 21c round 4: a heading or subject line cut inside a bracket note ends before the bracket (no unclosed bracket in a headline). */
export declare function closeDanglingBrackets(text: string): string;
//# sourceMappingURL=server.d.ts.map