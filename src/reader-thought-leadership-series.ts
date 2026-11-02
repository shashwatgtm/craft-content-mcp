import { readSignal } from './text-signals.js';
import { fact, type ReaderCase } from './reader-case.js';
export function case_thought_leadership_series(args: Record<string,unknown>): ReaderCase {
  const take = fact(args, "your_take", "the proposed argument", undefined, 120);
  const proof = fact(args, "proof_points", "the supplied evidence");
  const reader = fact(args, "target_reader", "the intended reader");
  const topic = fact(args, "topic", "the article topic");
  const hasProof = !!String(args.proof_points || "").trim();
  const interview = readSignal(String(args.proof_points || ''), /\binterviews?\b/i).state === 'affirmed';
  return {
    meaning: hasProof ? `This series supports an argument around ${take}. ${proof} remains supplied evidence with its original limits. ${interview ? 'Interview observations are not a measured effect.' : 'A supplied observation does not establish causation or prove the proposed approach.'}` : `This series develops the proposed argument around ${take}. No proof points were supplied, so it cannot establish an outcome or substantiate the position. Its proposed tests still need sources and an accountable reviewer.`,
    change: `a counterexample weakens the argument, an attributable source changes the evidence, or the intended reader cannot apply the proposed action`,
    roles: [
      `Founder: ask the author to seek a counterexample to ${take}; retain the argument only within the scope that survives it.`,
      hasProof ? `CEO: confirm the evidence owner for ${proof}; approve no company outcome claim beyond the recorded scope.` : `CEO: name the person who will gather a source for ${take}; keep company outcome claims on hold until the source and scope are confirmed.`,
      hasProof ? `CMO: have the editor compare every article with ${proof}; ${interview ? 'keep unmeasured effects and interview observations visibly distinct' : 'retain the source, comparison scope and causal limits'}.` : `CMO: have the editor mark the series as an untested position; check that each factual claim has a source before approving publication.`,
      `CRO: ask ${reader} whether the argument addresses a live decision; record a concrete objection before using it in sales.`,
      `Demand generation head: test one article about ${topic} with ${reader}; check whether they can name the next action before distributing the series.`,
    ],
  };
}
