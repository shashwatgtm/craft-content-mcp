import { fact } from './reader-case.js';
export function case_case_study_generator(args) {
    const result = fact(args, "results", "the supplied customer results");
    const challenge = fact(args, "challenge", "the original customer problem");
    const solution = fact(args, "solution", "the proposed intervention");
    const product = fact(args, "your_product", "the offer");
    return {
        meaning: `This story supports a draft account of ${result}. Source verification and written permission for the exact wording remain separate checks. A single pilot is not proof of general or causal improvement.`,
        change: `the original records alter the baseline, measurement period or sample, or the customer declines the proposed wording or use`,
        roles: [
            `Founder: ask the evidence owner to distinguish observation from attribution in ${result}; endorse only the supported scope.`,
            `CEO: ask the publication owner for written customer approval of ${result} and the intended channels; keep distribution on hold until it is recorded.`,
            `CMO: compare ${challenge} and ${result} with the original records; retain sample and period in the final story before requesting approval.`,
            `CRO: ask the account owner whether ${solution} explains the buyer's next decision; do not promise another account the same outcome.`,
            `Demand generation head: test a reader action to measure the starting point for ${product}; check the destination and permission before distributing the story.`,
        ],
    };
}
//# sourceMappingURL=reader-case-study-generator.js.map