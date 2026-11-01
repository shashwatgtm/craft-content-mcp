// Shared reader action handling. Writer directions never become reader copy.
export function readerAction(input) {
    const text = input.trim().replace(/[.\s]+$/, '');
    if (/^(?:do not|don't|never|avoid)\s+(?:ask|asking|invite|inviting|encourage|encouraging)\b/i.test(text))
        return '';
    return text.replace(/^(?:ask|invite|encourage|request)\s+(?:the\s+)?(?:readers?|audience|recipients?)\s+to\s+/i, '').replace(/\btheir\b/g, 'your');
}
//# sourceMappingURL=reader-action.js.map