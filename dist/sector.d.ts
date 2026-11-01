import { type Vertical, type BusinessModel, type ReaderInput } from './verticals.ts';
export type { Vertical, BusinessModel, ReaderInput };
export declare const LIST_COMMA: RegExp;
export declare function weldNames(parts: string[]): string[];
export declare function isQuoteItem(line: string): boolean;
export declare function splitItems(s: unknown): string[];
export declare function q(s: string): string;
export declare function qs(s: string): string;
export declare const YOUR_SECTORS: readonly ["logistics_tech", "fintech", "saas", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity", "other"];
export declare function givenSector(yourSector: unknown): {
    given: boolean;
    v: Vertical | null;
};
export declare function subIndustryFor(sellerTexts: unknown[], st: {
    name: string;
    match: RegExp;
} | null | undefined): boolean;
export declare const AI_TASK_METRICS: string[];
export declare function servedIndustry(input: ReaderInput, own?: unknown[]): {
    served: string;
    role: string;
};
export declare function servedNotes(v: Vertical, input: ReaderInput, own?: unknown[]): Vertical;
export declare function readContext(explicitModel: unknown, raw: ReaderInput, yourSector?: unknown, ownWords?: unknown[]): {
    v: Vertical | null;
    model: BusinessModel | null;
    how: string;
    line: string;
    source: string | null;
};
export declare function sectorNotes(v: Vertical | null, what?: 'committee' | 'metrics' | 'objections' | 'all', model?: BusinessModel | null): string;
export declare function answerFor(text: string, v: Vertical | null): string;
export type ObjectionKind = 'price' | 'existing' | 'adoption' | 'implementation' | 'security' | 'bundle' | 'timing' | 'accuracy' | 'proof' | 'other';
export declare function objectionKind(text: string): ObjectionKind;
export declare function proofFor(kind: ObjectionKind, proofs: string[], used?: Set<string>): string | undefined;
export declare function startWords(model: BusinessModel | null): {
    rollout: string;
    value: string;
    reach: string;
    unit: string;
};
export declare function sentencesOf(text: string): string[];
export declare function fromIndicator(text: string, indicator: RegExp): string[];
export declare function pickKeyPoints(source: string, keyMessage?: string, title?: string, max?: number): string[];
export declare function firstSentence(text: string): string;
export declare function clipWords(text: string, max: number): string;
export declare function isClause(topic: string): boolean;
export declare function audienceLine(v: Vertical | null): string;
export declare function forModel(lines: string[], model: BusinessModel | null): string[];
//# sourceMappingURL=sector.d.ts.map