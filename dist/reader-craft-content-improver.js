import { outcomePromises } from './utils.js';
import { fact } from './reader-case.js';
export function case_craft_content_improver(args) {
    const content = fact(args, "content", "the supplied content and its evidence limits");
    const goal = fact(args, "goal", "the editing goal");
    const audience = fact(args, "audience", "the intended audience");
    const type = fact(args, "content_type", "the content format");
    const raw = String(args.content || '');
    const explicitLimit = !outcomePromises(raw).length && /\b(?:do not promise|don't promise|cannot substantiate|can't substantiate|no such outcome should be claimed)\b/i.test(raw);
    return {
        meaning: `This review supports wording and evidence corrections for ${goal}. A score does not validate a claim in ${content}. Unmeasured guarantees remain held regardless of writing quality.`,
        change: `measured evidence supports a narrower claim, the source contradicts it or the intended audience cannot complete the revised action`,
        roles: [
            explicitLimit ? `Founder: ask the evidence owner to retain the stated outcome limit in ${content}; allow a stronger claim only after its source and scope are confirmed.` : `Founder: ask the evidence owner to substantiate the strongest outcome claim in ${content}; remove any guarantee the evidence cannot support.`,
            `CEO: confirm who can approve external use of ${type}; hold publication until the evidence owner signs off on scope and permission.`,
            explicitLimit ? `CMO: have the editor preserve the stated limit in ${content}; check that the revision does not turn a denied outcome into a benefit.` : `CMO: revise ${content} to separate measured facts from hypotheses; compare the revised claim with the original record before approval.`,
            `CRO: ask ${audience} what decision the copy helps them make; check that the next step fits that decision before sales use.`,
            `Demand generation head: test the revised reader action for ${goal} with ${audience}; verify the destination and keep unsupported claims out of distribution.`,
        ],
    };
}
//# sourceMappingURL=reader-craft-content-improver.js.map