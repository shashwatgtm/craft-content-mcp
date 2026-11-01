export declare const SUGGESTION_FOOTER = "Suggested timings, lengths and counts: adjust them to your own.";
export declare function isCommonWord(word: string): boolean;
export declare function topicWords(text: string, n: number): string[];
export declare function lowerFirstIfCommon(phrase: string): string;
export declare function lowerCommonWords(phrase: string): string;
export declare function aOrAn(phrase: string): string;
export declare function cap(phrase: string): string;
export declare function titleWords(phrase: string): string;
export declare function parseListItems(text: string): string[];
export declare function countWords(text: string): number;
export declare function countSentences(text: string): number;
export declare function avgWordsPerSentence(text: string): number;
export declare function calculateReadability(text: string): {
    score: number;
    grade: string;
    analysis: string;
};
export interface Finding {
    dimension: 'clarity' | 'structure' | 'engagement' | 'goalAlignment';
    rule: string;
    penalty: number;
    text: string;
    suggestion: string;
    hard: boolean;
}
export interface ContentAnalysis {
    clarity: {
        score: number;
        issues: string[];
        suggestions: string[];
    };
    structure: {
        score: number;
        issues: string[];
        suggestions: string[];
    };
    engagement: {
        score: number;
        issues: string[];
        suggestions: string[];
    };
    goalAlignment: {
        score: number;
        issues: string[];
        suggestions: string[];
    };
    overall: {
        score: number;
        rating: string;
    };
    findings: Finding[];
}
export declare const BUZZ: RegExp;
export declare const SUPERLATIVE: RegExp;
export declare const ASK: RegExp;
export declare function bodyOf(content: string): string;
export declare function analyzeContent(content: string, contentType: string, goal: string, opts?: {
    audience?: string;
}): ContentAnalysis;
export declare function annotateText(content: string): string;
export declare function toneCheck(content: string, tone: string | undefined): {
    notes: string[];
    used: boolean;
};
export declare function editSentence(s: string): string;
export declare function generateImprovedVersion(content: string, _analysis?: ContentAnalysis): {
    text: string;
    edits: {
        before: string;
        after: string;
    }[];
};
export declare const MAX_ECHO = 280;
export declare function clipEcho(text: string, max?: number): string;
export declare function extractKeyPoints(text: string): string[];
export declare function generateHook(topic: string, style: 'question' | 'statistic' | 'story' | 'bold_statement'): string;
//# sourceMappingURL=utils.d.ts.map