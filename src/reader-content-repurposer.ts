import { fact, type ReaderCase } from './reader-case.js';
export function case_content_repurposer(args: Record<string,unknown>): ReaderCase {
  const source = fact(args, "source_content", "the complete source passage and its qualifications");
  const format = fact(args, "source_type", "the original source format");
  const message = fact(args, "key_message", "the source's central message");
  return {
    meaning: `These drafts support reuse of ${source}. Changing format does not validate the result or permit a broader claim. Preserve the original sample, period and uncontrolled conditions in every destination.`,
    change: `the original record contradicts the result, permission changes or a channel version drops a qualification`,
    roles: [
      `Founder: ask the source owner to verify ${source} before endorsing derived claims; keep a one case observation within its original scope.`,
      `CEO: confirm the approver and permitted uses of ${format} with the content owner; do not infer permission from having the source text.`,
      `CMO: compare each draft with ${source}; check that the baseline, period and caveat survive editing before approval.`,
      `CRO: ask the buyer which decision ${message} supports; hold wider outcome promises until comparable evidence is available.`,
      `Demand generation head: test the requested action from ${source} in each destination; verify the link and that no channel implies stronger evidence than the source.`,
    ],
  };
}
