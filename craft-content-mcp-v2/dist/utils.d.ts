export declare function parseListItems(text: string): string[];
export declare function countWords(text: string): number;
export declare function countSentences(text: string): number;
export declare function avgWordsPerSentence(text: string): number;
export declare function calculateReadability(text: string): {
    score: number;
    grade: string;
    analysis: string;
};
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
}
export declare function analyzeContent(content: string, contentType: string, goal: string): ContentAnalysis;
export declare function generateImprovedVersion(content: string, analysis: ContentAnalysis): string;
export declare function extractKeyPoints(text: string): string[];
export declare function generateHook(topic: string, style: 'question' | 'statistic' | 'story' | 'bold_statement'): string;
//# sourceMappingURL=utils.d.ts.map