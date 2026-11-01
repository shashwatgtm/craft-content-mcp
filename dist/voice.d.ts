import { type Row } from "./reserve-common.js";
export declare function voiceScan(input: string, skipQuotes?: boolean, allowed?: string[]): {
    stats: {
        characters: number;
        words: number;
        sentences: number;
        approx_reading_grade: number | null;
        approx_band: string;
        banned_flags: number;
        review_flags: number;
    };
    flags: Row[];
};
export declare function voiceAudit(a: Row): {
    before: {
        stats: {
            characters: number;
            words: number;
            sentences: number;
            approx_reading_grade: number | null;
            approx_band: string;
            banned_flags: number;
            review_flags: number;
        };
        flags: Row[];
    };
    audience: any;
    gradeStatus: string;
    shortTextCaution: boolean;
    instructions: any;
    proposal: Row | null;
    keptWords: any;
    languageScope: string;
    noAuthorshipClaim: boolean;
};
//# sourceMappingURL=voice.d.ts.map