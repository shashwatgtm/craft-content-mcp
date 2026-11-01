export declare function generateContentImprover(args: {
    your_sector?: string;
    content: string;
    content_type: string;
    goal?: string;
    audience?: string;
    tone_preference?: string;
}): string;
type Slip = {
    before: string;
    after: string | null;
    note: string;
};
export declare function fixSlips(content: string): {
    text: string;
    slips: Slip[];
};
export declare function cutSubject(full: string): string | null;
export {};
//# sourceMappingURL=content-improver.d.ts.map