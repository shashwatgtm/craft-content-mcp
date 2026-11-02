import { fact, type ReaderCase } from './reader-case.js';
export function case_thought_leadership_series(args: Record<string,unknown>): ReaderCase {
  const take = fact(args, "your_take", "the proposed argument", undefined, 120);
  const proof = fact(args, "proof_points", "the supplied evidence");
  const reader = fact(args, "target_reader", "the intended reader");
  const topic = fact(args, "topic", "the article topic");
  return {
    meaning: `This series supports an argument around ${take}. ${proof} remains supplied evidence with its original limits. Interview observations are not a measured effect.`,
    change: `a counterexample weakens the argument, an attributable source changes the evidence, or the intended reader cannot apply the proposed action`,
    roles: [
      `Founder: ask the author to seek a counterexample to ${take}; retain the argument only within the scope that survives it.`,
      `CEO: confirm the evidence owner for ${proof}; approve no company outcome claim beyond the recorded scope.`,
      `CMO: have the editor compare every article with ${proof}; keep unmeasured effects and interview observations visibly distinct.`,
      `CRO: ask ${reader} whether the argument addresses a live decision; record a concrete objection before using it in sales.`,
      `Demand generation head: test one article about ${topic} with ${reader}; check whether they can name the next action before distributing the series.`,
    ],
  };
}
