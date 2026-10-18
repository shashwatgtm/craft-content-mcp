// Run 42B round S: a list typed with semicolons in place of the commas inside each item, and ", " plus a capital between items
// ("Teams juggle tools; docs; chat, A study cites 384% ROI; payback in six months (page claims), One platform; where AI sees tasks").
// Read as written, every short piece between semicolons became its own point, so drafts showed fragments ("ERPs", "Domain") and
// split quotes from their speakers. When the text shows that shape (short pieces between semicolons that are no clause, or a figure
// written "92;400"), it is read back as one item per line with its own commas. Words are never added, dropped or reordered.
const SMALL_PIECE = (p: string): boolean => {
  const w = p.trim().split(/\s+/).filter(Boolean);
  return w.length > 0 && w.length <= 3 && !/\b(?:is|are|was|were|has|have|had|can|will|does|do|did)\b/i.test(p);
};
const SPEAKER_SEMIS = /^[A-Z][^:;,]{1,40}(?:;\s+[^:;]{1,80}){1,4}:\s+\S/;
function splitItems(text: string): string[] {
  const out: string[] = []; let depth = 0; let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '(') depth++; else if (c === ')') depth = Math.max(0, depth - 1);
    else if (c === ',' && depth === 0 && /^\s+["“']?[A-Z0-9]/.test(text.slice(i + 1, i + 4))) { out.push(text.slice(start, i)); start = i + 1; }
  }
  out.push(text.slice(start));
  return out.map((x) => x.trim()).filter(Boolean);
}
export function semicolonCommaList(raw: unknown, sep = 'line'): unknown {
  if (typeof raw !== 'string') return raw;
  const t = raw.trim();
  if (!t || /\n/.test(t) || !/;\s/.test(t) || t.length > 4000) return raw;
  const items = splitItems(t);
  if (items.length < 2) return raw;
  const shaped = /\d;\d{3}(?!\d)/.test(t) || items.some((it) => SPEAKER_SEMIS.test(it)) || items.some((it) => { const ps = it.split(/;\s+/); return ps.length > 1 && ps.slice(1).some(SMALL_PIECE); });
  if (!shaped) return raw;
  if (sep !== 'line') {
    // proof items: only a quote whose speaker is typed with semicolons ("Name; Title; Company: words") gets its commas back, so the
    // quote stays whole with its speaker; every other item keeps its semicolons as typed, and items stay apart with "; "
    return items.map((it) => (SPEAKER_SEMIS.test(it) ? it.replace(/(\d);(\d{3})(?!\d)/g, '$1,$2').replace(/;\s+/g, ', ').replace(/[,;]\s*$/, '') : it.replace(/[,;]\s*$/, ''))).join('; ');
  }
  return items.map((it) => it.replace(/(\d);(\d{3})(?!\d)/g, '$1,$2').replace(/;\s+/g, ', ').replace(/[,;]\s*$/, '')).join('\n');
}
const LIST_FIELDS = ['key_points', 'key_takeaways', 'proof_points', 'value_props'];
export function reshapeLists<T>(args: T): T {
  if (!args || typeof args !== 'object') return args;
  const a = { ...(args as Record<string, unknown>) };
  for (const k of LIST_FIELDS) if (k in a) a[k] = semicolonCommaList(a[k], k === 'proof_points' ? 'semicolon' : 'line');  // proof items keep the "; " separator the proof reader splits on
  return a as T;
}
