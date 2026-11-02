import { fact, type ReaderCase } from './reader-case.js';
export function case_case_study_generator(args: Record<string,unknown>, adverse = false, discovery = false): ReaderCase {
  const result = fact(args, "results", "the supplied customer results");
  const challenge = fact(args, "challenge", "the original customer problem");
  const solution = fact(args, "solution", "the proposed intervention");
  const product = fact(args, "your_product", "the offer");
  if (discovery) return {
    meaning: 'This kit supports collecting a customer account and checking whether it contains usable evidence. It does not establish a result or supply an approved story.',
    change: 'the customer and source records establish the original problem, actual approach and observed outcome, with limits and permission for the proposed use',
    roles: [
      `Founder: have the evidence owner verify the baseline for ${challenge}; record unknowns before choosing a story angle.`,
      `CEO: have the publication owner obtain the customer's wording, attribution and channel permissions for ${product}; keep distribution held until the record is complete.`,
      `CMO: ask the interviewer to test ${challenge} against the customer's account; retain unchanged or adverse outcomes alongside any improvement.`,
      `CRO: have the account owner confirm what was actually implemented in ${solution}; compare that record with the customer's experience before requesting advocacy.`,
      `Demand generation head: hold a campaign about ${product}; ask the evidence owner for a dated result and the publication owner for written permission before preparing distribution.`,
    ],
  };
  if (adverse) return {
    meaning: `The supplied result ${result} supports an internal account review, not a success story. Keep promotional copy and endorsement requests on hold while the account owner verifies the decline.`,
    change: `the customer and original records establish a corrected result with its scope and approve the exact proposed use`,
    roles: [
      `Founder: ask the evidence owner to reconcile ${result} with the original baseline; do not endorse a benefit the recorded change does not show.`,
      `CEO: assign an account recovery owner for ${result}; check the investigation and agreed next step before reconsidering a story.`,
      `CMO: compare ${challenge} with ${result}; retain the adverse finding in the internal record and remove unsupported promotional claims.`,
      `CRO: have the account owner review ${solution} with the customer and agree the next recovery check before requesting advocacy.`,
      `Demand generation head: hold distribution for ${product}; verify corrected evidence and written permission before reusing this account in a campaign.`,
    ],
  };
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
