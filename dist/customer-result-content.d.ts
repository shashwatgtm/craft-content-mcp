import { type Node } from './chain-inputs.js';
export declare const CUSTOMER_RESULT_TOOL = "customer_result_to_content";
declare const ASSETS: readonly ["case study", "post", "newsletter section", "newsletter issue"];
type Asset = typeof ASSETS[number];
export declare const customerResultDefinition: {
    name: string;
    title: string;
    description: string;
    inputSchema: {
        type: "object";
        additionalProperties: boolean;
        properties: {
            exact_sentence: Node;
            source_url: Node;
            source_date: Node;
            source_checked_date: Node;
            source_kind: Node;
            source_label: Node;
            measured_result: Node;
            buyer_role: Node;
            relationship: Node;
            approval: Node;
            proof_details: Node;
            as_of_date: Node;
            story_published: Node;
            published_story: Node;
            customer_name: Node;
            product: Node;
            challenge: Node;
            solution: Node;
            buyer_view: {
                minLength: number;
                type: string;
                properties?: Record<string, Node>;
                required?: string[];
                enum?: readonly unknown[];
                items?: Node;
                minItems?: number;
                maxItems?: number;
                maxLength?: number;
                additionalProperties?: boolean;
                description?: string;
            };
            call_to_action: Node;
            headline: Node;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
    };
};
export type CustomerResultInput = {
    exact_sentence: string;
    source_url: string;
    source_date: string;
    source_checked_date?: string;
    source_kind: string;
    source_label: string;
    measured_result: boolean;
    buyer_role: 'vendor' | 'outside_writer';
    relationship: 'own_customer' | 'public_example';
    approval: {
        status: 'written' | 'public_page' | 'none';
        approver?: string;
        date?: string;
        uses?: Asset[];
    };
    proof_details?: Record<string, string>;
    as_of_date: string;
    story_published: boolean;
    published_story?: string;
    customer_name: string;
    product: string;
    challenge?: string;
    solution?: string;
    buyer_view?: string;
    call_to_action: string;
    headline?: string;
};
type Check = {
    status: 'pass' | 'fail';
    sentence: boolean;
    missing_view: string[];
    derived_numbers: string[];
    date_issues: string[];
    flags: string[];
};
export declare function weekdayIssues(text: string): string[];
export declare function checkResultAsset(text: string, input: CustomerResultInput, checkView?: boolean): Check;
export declare function runCustomerResult(input: unknown): {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
    structuredContent?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
    structuredContent?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    structuredContent: {
        tool: string;
        status: string;
        proof_card: [string, string][];
        gaps: string[];
        assets: {
            name: Asset;
            text: string;
        }[];
        checks: {
            status: "pass" | "fail";
            sentence: boolean;
            missing_view: string[];
            derived_numbers: string[];
            date_issues: string[];
            flags: string[];
            asset: "case study" | "post" | "newsletter section" | "newsletter issue";
        }[];
        steps: {
            tool: string;
            passed: string;
        }[];
        actions: {
            label: string;
            prompt: string;
        }[];
    };
    isError?: undefined;
};
export {};
//# sourceMappingURL=customer-result-content.d.ts.map