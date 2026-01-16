export interface ParsedMetrics {
    mrr?: number;
    arr?: number;
    churn?: number;
    nps?: number;
    cac?: number;
    ltv?: number;
    ltvCacRatio?: number;
    retentionRate?: number;
    activationRate?: number;
    referralRate?: number;
    revenueGrowth?: number;
    dau?: number;
    mau?: number;
    dauMauRatio?: number;
    trialConversion?: number;
    expansionRevenue?: number;
    timeToValue?: number;
    raw: string;
}
export declare function parseMetrics(metricsText: string): ParsedMetrics;
export declare function scoreMetric(value: number | undefined, benchmarks: {
    low: number;
    medium: number;
    high: number;
}, higherIsBetter?: boolean): {
    score: number;
    label: string;
    analysis: string;
};
export declare function calculateDaysUntil(targetDate: string): number;
export declare function formatDate(date: Date): string;
export declare function addDays(date: Date, days: number): Date;
export declare function parseListItems(text: string): string[];
export interface CRAFTAnalysis {
    character: {
        found: string[];
        score: number;
        gaps: string[];
    };
    result: {
        found: string[];
        score: number;
        gaps: string[];
    };
    artifact: {
        found: string[];
        score: number;
        gaps: string[];
    };
    frame: {
        found: string[];
        score: number;
        gaps: string[];
    };
    timeline: {
        found: string[];
        score: number;
        gaps: string[];
    };
}
export declare function analyzeCRAFTDimensions(content: string): CRAFTAnalysis;
//# sourceMappingURL=utils.d.ts.map