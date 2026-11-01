export declare function fixNumbers(s: string): string;
export declare function endSentence(s: string): string;
export declare function capFirst(s: string): string;
export declare function lowerFirstWord(s: string): string;
export declare function proseJoin(items: string[]): string;
export declare function plural(n: number, one: string, many?: string): string;
export declare function splitList(raw: unknown): string[];
export declare const FIGURE: RegExp;
export type ProofKind = 'result' | 'quote' | 'recognition' | 'title' | 'scale' | 'claim';
export interface ProofItem {
    text: string;
    label: string;
    kind: ProofKind;
    figure: boolean;
    shown: string;
}
export declare function maskQuoted(t: string): string;
export declare function unmaskQuoted(t: string): string;
export declare function isAttributed(x: string): boolean;
export declare function splitProof(raw: unknown): string[];
export declare const RECOGNITION: RegExp;
export declare const SCALE: RegExp;
export declare function parseProof(raw: unknown): ProofItem[];
export declare const KIND_NOTE: Record<ProofKind, string>;
export interface TopicParts {
    audience: string;
    problem: string;
    company: string;
    label: string;
    short: boolean;
}
export declare function unpackTopic(topic: string): TopicParts;
export declare function clipAtWord(s: string, max: number): string;
export declare function dropTail(s: string): string;
export declare function roleOf(audience: string | undefined): {
    role: string;
    field: string;
};
export declare function usesAny(text: string, words: string[]): string[];
export declare function shortenClauses(sentence: string, max: number): string;
import type { Vertical } from './verticals.ts';
export declare function brandFrom(...texts: (string | undefined)[]): string;
export declare function makeHashtags(text: string, brand: string, v: Vertical | null, extra?: string[]): string;
export declare function claimsToSource(texts: string[]): string[];
export declare function headlineSubject(topic: string, max?: number): string;
export declare function isGenericName(name: string): boolean;
export declare function splitObjections(raw: unknown): string[];
export declare function productParts(product: string): {
    name: string;
    facts: string[];
    description: string;
};
export declare function tidyPoint(p: string): string;
export declare function asAnswer(response: string): string;
export declare function softenClaims(text: string): {
    text: string;
    removed: string[];
};
export declare function bestQuestion(point: string, questions: string[], used: Set<string>): string;
export declare function toYou(s: string): string;
export declare function publishable(s: string): string;
export declare const STAT: RegExp;
//# sourceMappingURL=draft.d.ts.map