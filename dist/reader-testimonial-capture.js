import { signal } from './text-signals.js';
import { fact } from './reader-case.js';
export function case_testimonial_capture(args) {
    const story = fact(args, "success_story", "the customer's reported experience");
    const person = fact(args, "customer_role", "the customer's role");
    const product = fact(args, "your_product", "the offer");
    const type = fact(args, "testimonial_type", "the requested testimonial format");
    const cancellation = signal([args.success_story, args.relationship_context].filter(Boolean).join('; '), 'cancelled');
    const adverse = signal(String(args.success_story || ''), 'adverse_result');
    const cancelled = args.customer_status ? args.customer_status === 'cancelled' : cancellation.state === 'affirmed';
    if (cancelled || adverse.state === 'affirmed')
        return {
            meaning: `The account evidence in ${story} supports a recovery conversation, not a testimonial request. Keep the request on hold until the customer confirms the current position.`,
            change: 'the complaint is resolved and the customer independently confirms a supported experience and permission',
            roles: [
                `Founder: ask the account owner to verify the adverse experience involving ${product}; review what failed before endorsing an outcome claim.`,
                `CEO: assign a recovery owner for ${story}; check the agreed remedy before reconsidering any testimonial request.`,
                `CMO: remove pending testimonial copy based on ${story} from approval queues; verify corrected evidence before drafting again.`,
                `CRO: have the account owner agree the next recovery action with ${person}; confirm completion with the customer before asking for advocacy.`,
                `Demand generation head: hold distribution of ${type}; check with the publication owner before reusing any existing asset from this account.`,
            ],
        };
    return {
        meaning: `This kit supports asking about ${story}. It is not a customer endorsement. Subjective experience is not measured improvement, and permission must cover the exact words and use.`,
        change: `the customer corrects the wording, the measurement record changes or permission is declined or withdrawn`,
        roles: [
            `Founder: ask the evidence owner to separate opinion from measured outcome in ${story}; do not turn easier use into a time saving claim.`,
            `CEO: have the publication owner obtain written approval for ${type}; check wording, channels and withdrawal terms before external use.`,
            `CMO: read ${story} back to ${person}; let the customer correct the words before seeking permission.`,
            `CRO: ask ${person} for a recent example involving ${product}; record the baseline and limits without coaching a favourable result.`,
            `Demand generation head: verify the approval record for ${type} with the publication owner before reuse; remove the asset if approval is withdrawn.`,
        ],
    };
}
//# sourceMappingURL=reader-testimonial-capture.js.map