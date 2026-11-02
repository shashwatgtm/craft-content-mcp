import { fact, type ReaderCase } from './reader-case.js';
export function case_webinar_script(args: Record<string,unknown>): ReaderCase {
  const topic = fact(args, "topic", "the webinar topic", undefined, 110);
  const takeawayArgs = {...args, key_takeaways: String(args.key_takeaways || "").replace(/on the (?:home|about|product) page/gi, "in the supplied source")};
  const takeaways = fact(takeawayArgs, "key_takeaways", "the promised takeaways", undefined, 160);
  const audience = fact(args, "target_audience", "the intended participants");
  const product = fact(args, "your_product", "the offer");
  const discussion = ['panel_discussion','customer_story','ama'].includes(String(args.webinar_type));
  const delivery = discussion ? 'discussion' : 'exercise';
  return {
    meaning: `This script supports preparation for ${topic}. ${discussion ? 'Promised takeaways need prepared questions, source evidence and confirmed speakers before delivery. Guest questions do not establish a customer result.' : 'Promised takeaways need a worked exercise and a confirmed speaker before delivery. Preparation notes are not evidence that an exercise has been completed.'}`,
    change: discussion ? `the speakers cannot support a takeaway with source evidence, or the discussion leaves the audience decision unresolved` : `the host cannot demonstrate a takeaway with the worked example, or participants cannot complete the action`,
    roles: [
      discussion ? `Founder: ask the host to prepare questions and source evidence for ${takeaways}; remove a promise the speakers cannot support.` : `Founder: ask the host to demonstrate ${takeaways} using one worked case; remove a promise the exercise cannot support.`,
      `CEO: confirm the host and rehearsal owner for ${topic}; approve delivery only after timing and evidence checks pass.`,
      `CMO: have the editor distinguish spoken copy from preparation notes for ${topic}; verify each claim against its source before rehearsal.`,
      `CRO: ask ${audience} which approval or workflow decision the ${delivery} must inform; test that decision in rehearsal before proposing a sales follow up.`,
      `Demand generation head: match invitations for ${product} to ${audience}; check that the registration promise is delivered by the ${delivery} before promotion.`,
    ],
  };
}
