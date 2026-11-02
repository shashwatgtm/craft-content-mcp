import { escapePiece, dropLoneBackslash } from './escape-inputs.js';
export function fact(args, key, fallback, match) {
    const raw = args[key];
    if (typeof raw !== 'string' || !raw.trim() || /^(?:unknown|not supplied|not given|none)$/i.test(raw.trim()))
        return fallback;
    const clean = raw.replace(/[\r\n\t]+/g, ' ').replace(/[–—]/g, ', ').replace(/\\!/g, '.').replace(/!/g, '.').replace(/\s+/g, ' ').trim();
    if (/\b(?:ignore|disregard|override)\b.{0,80}\binstructions?\b|\b(?:print|reveal|show)\b.{0,30}\bsystem prompt\b/i.test(clean))
        return fallback;
    const quote = (value) => escapePiece(dropLoneBackslash(value.replace(/[“”]/g, '"').replace(/[.;]+$/, '')));
    const parts = clean.split(/(?<=[.;])\s+(?=[A-Z])/);
    const selected = match ? parts.find(p => match.test(p)) : clean;
    // Never clip a qualification or a negation to make a short quote.
    if (!selected)
        return fallback;
    if (selected.length > 240) {
        const first = selected.split(/(?<=[.!?])\s+(?=[A-Z])/)[0];
        if (first.length > 180 || first === selected)
            return fallback;
        return `the supplied excerpt “${quote(first)}” (read with the complete source and its limits)`;
    }
    return `“${quote(/^[a-z0-9_]+$/.test(selected) ? selected.replace(/_/g, ' ') : selected)}”`;
}
export function renderCase(c, held) {
    return `\n\n## Reading the answer\n\n${c.meaning}${held ? ' Keep the stated hold in place; this guidance does not override it.' : ''} The conclusion needs review if ${c.change}.\n\n## Decisions by role\n\nProposed owners. Confirm the named person before acting. Supplied statements below are inputs to check, not verified facts.\n\n${c.roles.join('\n\n')}\n`;
}
//# sourceMappingURL=reader-case.js.map