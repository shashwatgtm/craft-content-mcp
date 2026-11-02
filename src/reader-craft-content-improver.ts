import { fact, type ReaderCase } from './reader-case.js';
export function case_craft_content_improver(args: Record<string,unknown>): ReaderCase {
  const content = fact(args, "content", "the supplied content and its evidence limits");
  const goal = fact(args, "goal", "the editing goal");
  const audience = fact(args, "audience", "the intended audience");
  const type = fact(args, "content_type", "the content format");
  return {
    meaning: `This review supports wording and evidence corrections for ${goal}. A score does not validate a claim in ${content}. Unmeasured guarantees remain held regardless of writing quality.`,
    change: `measured evidence supports a narrower claim, the source contradicts it or the intended audience cannot complete the revised action`,
    roles: [
      `Founder: ask the evidence owner to substantiate the strongest outcome claim in ${content}; remove any guarantee the evidence cannot support.`,
      `CEO: confirm who can approve external use of ${type}; hold publication until the evidence owner signs off on scope and permission.`,
      `CMO: revise ${content} to separate measured facts from hypotheses; compare the revised claim with the original record before approval.`,
      `CRO: ask ${audience} what decision the copy helps them make; check that the next step fits that decision before sales use.`,
      `Demand generation head: test the revised reader action for ${goal} with ${audience}; verify the destination and keep unsupported claims out of distribution.`,
    ],
  };
}
