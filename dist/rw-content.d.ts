import { endSentence, capFirst, proseJoin } from './draft.ts';
import { cap } from './utils.js';
export declare const isDisclaimer: (s: string) => boolean;
export declare function stripDisclaimers(text: string): string;
export declare function stripGuardQuotes(s: string, keepIfInstruction?: boolean): string;
export declare function splitQuoteRuns(s: string): string;
export declare function tidy(s: string): string;
export declare const isInstruction: (s: string) => boolean;
export declare function instructionNote(lines: string[]): string;
export declare function splitLabel(s: string): {
    text: string;
    label: string;
};
export type Role = 'problem' | 'result' | 'quote' | 'recognition' | 'scale' | 'story' | 'outcome' | 'capability' | 'instruction';
export interface Pt {
    text: string;
    label: string;
    role: Role;
    clause: boolean;
    figure: boolean;
}
export declare const startsImperative: (t: string) => boolean;
export declare const isImperative: (text: string) => boolean;
export declare function looksClause(text: string): boolean;
export declare const PARTICIPLE_START: RegExp;
export declare const JOIN_START: RegExp;
export declare const nk: (x: string) => string;
export declare function readPoints(raw: string | undefined, known?: {
    problem?: string;
}): Pt[];
export declare const withLabel: (p: Pt) => string;
export declare function lowerFirstSafe(s: string): string;
export declare function sentenceOf(p: Pt, who: string, variant?: number): string;
export declare function renderGroup(points: Pt[], who: string, lead: string, variant?: number): string;
export declare function groupPhrases(points: Pt[]): Pt[];
export declare function shorten(text: string, max: number, strict?: boolean): string;
export declare function shortReaders(audience: string, max?: number): string;
export declare function audienceShort(audience: string, max?: number): string;
export declare function companyFrom(topic: string): string;
export declare function readersFit(readers: string, v: {
    buyerRoles: string[];
    vocabulary: string[];
    committee: string;
    name: string;
}): boolean;
export declare const isStatistic: (t: string) => boolean;
export type Shape = 'clause' | 'imperative' | 'participle' | 'adjective' | 'gerund' | 'example' | 'phrase';
export declare function shapeOf(p: Pt): Shape;
export declare function toReader(s: string): string;
export declare function settleBare(response: string): string;
export declare function waysToSettle(response: string): string;
export declare function sharpenLine(missing: {
    field: string;
    change: string;
}[]): string;
export declare const cleanSectorLine: (line: string) => string;
export declare const quotedEnd: (text: string) => string;
export { cap, proseJoin, capFirst, endSentence };
//# sourceMappingURL=rw-content.d.ts.map