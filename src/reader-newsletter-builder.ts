import { fact, type ReaderCase } from './reader-case.js';
export function case_newsletter_builder(args: Record<string,unknown>): ReaderCase {
  const action = fact(args, "cta_goal", "the requested reader action");
  const points = fact(args, "key_points", "the supplied issue points");
  const topic = fact(args, "topic", "the issue topic");
  const product = fact(args, "your_product", "the offer");
  return {
    meaning: `This issue supports ${action}. It does not establish that ${points} will improve results. A proposed ownership rule still needs a reader test.`,
    change: `the source does not support a claim or readers cannot complete the action using their own records`,
    roles: [
      `Founder: ask the issue owner to show how ${action} informs a decision; remove promises of improvement that the supplied evidence does not measure.`,
      `CEO: confirm who owns the follow up to ${action}; check that someone can review the result before endorsing the issue.`,
      `CMO: verify sources and limits for ${points} with the editor; approve only claims the records support.`,
      `CRO: ask a buyer of ${product} to explain the ownership rule in ${points}; check who acts when the rule exposes an unresolved task.`,
      `Demand generation head: trial ${action} with one intended reader; check that they can produce the requested count or record before distribution.`,
    ],
  };
}
