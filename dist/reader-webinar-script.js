import { fact } from './reader-case.js';
export function case_webinar_script(args) {
    const topic = fact(args, "topic", "the webinar topic");
    const takeaways = fact(args, "key_takeaways", "the promised takeaways");
    const audience = fact(args, "target_audience", "the intended participants");
    const product = fact(args, "your_product", "the offer");
    return {
        meaning: `This script supports preparation for ${topic}. Promised takeaways need a worked exercise and a confirmed speaker before delivery. Preparation notes are not evidence that an exercise has been completed.`,
        change: `the host cannot demonstrate a takeaway with the worked example, or participants cannot complete the action`,
        roles: [
            `Founder: ask the host to demonstrate ${takeaways} using one worked case; remove a promise the exercise cannot support.`,
            `CEO: confirm the host and rehearsal owner for ${topic}; approve delivery only after timing and evidence checks pass.`,
            `CMO: have the editor distinguish spoken copy from preparation notes for ${topic}; verify each claim against its source before rehearsal.`,
            `CRO: ask ${audience} which approval or workflow decision the exercise must inform; test that decision in rehearsal before proposing a sales follow up.`,
            `Demand generation head: match invitations for ${product} to ${audience}; check that the registration promise is delivered by the exercise before promotion.`,
        ],
    };
}
//# sourceMappingURL=reader-webinar-script.js.map