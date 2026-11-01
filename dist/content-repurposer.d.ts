import { type Vertical } from './sector.ts';
export declare function cleanClaims(text: string): {
    text: string;
    removed: string[];
};
export declare function tagsFor(text: string, brand: string, v: Vertical | null): string;
export declare function generateContentRepurposer(args: {
    your_sector?: string;
    source_content: string;
    source_type: string;
    target_formats?: string;
    brand_voice?: string;
    key_message?: string;
}): string;
//# sourceMappingURL=content-repurposer.d.ts.map