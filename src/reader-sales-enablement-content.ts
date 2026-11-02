import { fact, type ReaderCase } from './reader-case.js';
export function case_sales_enablement_content(args: Record<string,unknown>): ReaderCase {
  const proof = fact(args, "proof_points", "the supplied outcome evidence");
  const objection = fact(args, "common_objections", "the buyer objections");
  const persona = fact(args, "target_persona", "the intended buyer");
  const product = fact(args, "product", "the proposed offer");
  return {
    meaning: `This material supports a sales conversation about ${product}. ${proof} does not establish causal improvement or a safe rollout beyond its measured scope.`,
    change: `a comparable buyer test changes the outcome, attribution or acceptance conditions, or the buyer confirms a different objection`,
    roles: [
      `Founder: ask the evidence owner to explain the baseline, sample and attribution limits in ${proof}; hold a general performance promise without wider evidence.`,
      `CEO: ask the delivery owner to define a reversible acceptance test for ${product}; approve no rollout beyond the buyer agreed scope.`,
      `CMO: verify ${proof} against the original records; keep the pilot period and uncontrolled conditions in every sales asset.`,
      `CRO: ask ${persona} to test ${objection} against the current workflow; agree pass conditions and the approver before advancing the deal.`,
      `Demand generation head: have sales review whether ${objection} recurs in the next account sample; check buyer fit before reusing ${product} claims in campaigns.`,
    ],
  };
}
