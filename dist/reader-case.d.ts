/** Case excerpts remain supplied statements, never verified evidence. */
export type ReaderCase = {
    meaning: string;
    change: string;
    roles: string[];
};
export declare function fact(args: Record<string, unknown>, key: string, fallback: string, match?: RegExp, max?: number): string;
export declare function renderCase(c: ReaderCase, held: boolean): string;
//# sourceMappingURL=reader-case.d.ts.map