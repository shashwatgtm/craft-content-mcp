// Run 20 round 1b (owner decision D92): helpers shared by the eight tools so that a draft is built from the user's inputs
// instead of pasting them into fixed sentence frames. Rule B82: nothing here adds a statistic, a quote or a named company; the
// helpers only split, sort and label what the user typed, and join it with plain sentences of our own.

import { LIST_COMMA } from './sector.ts';

// A comma typed inside a number ("2,000") that an upstream step turned into a semicolon ("2;000") is put back.
export function fixNumbers(s: string): string {
  return s.replace(/(\d);(?=\d{3}(?!\d))/g, '$1,');
}

export function endSentence(s: string): string {
  const t = s.trim().replace(/[;,:\s]+$/, '');
  return /[.!?]$/.test(t) ? t : `${t}.`;
}
export function capFirst(s: string): string {
  const t = s.trim();
  if (/^[a-z]+[A-Z]/.test(t.split(/\s+/)[0] || '')) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}
export function lowerFirstWord(s: string): string {
  const t = s.trim();
  const w = t.split(/\s+/)[0] || '';
  // keep acronyms, names with inner capitals and words with digits as typed
  if (/[A-Z0-9]/.test(w.slice(1)) || w === 'I') return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
}
// "a, b and c"
export function proseJoin(items: string[]): string {
  const l = items.filter(Boolean);
  if (l.length <= 1) return l[0] || '';
  return `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`;
}
export function plural(n: number, one: string, many?: string): string {
  return n === 1 ? one : (many || `${one}s`);
}

// Split text at a separator that is not inside parentheses.
function splitOutsideParens(text: string, sep: RegExp): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  const g = new RegExp(sep.source, sep.flags.includes('g') ? sep.flags : sep.flags + 'g');
  let m: RegExpExecArray | null;
  const depthAt: number[] = [];
  for (let i = 0, d = 0; i < text.length; i++) { if (text[i] === '(') d++; else if (text[i] === ')') d = Math.max(0, d - 1); depthAt[i] = d; }
  while ((m = g.exec(text))) {
    if (m[0].length === 0) { g.lastIndex++; continue; }
    depth = depthAt[m.index] || 0;
    if (depth === 0) { out.push(text.slice(start, m.index)); start = m.index + m[0].length; }
  }
  out.push(text.slice(start));
  return out.map((x) => x.trim()).filter(Boolean);
}

const JOINER = /^(?:(?:not|but|and|or|so|which|that|because|while|with|without|including|plus|then|yet|rather)\b|i\.e\.|e\.g\.|vs\.|etc\.)/i;

// A list typed by the user. Lines and semicolons separate items; a comma separates items only when the text has neither; a comma
// inside parentheses or a number never separates. A fragment that opens with a joining word continues the item before it, and a
// one or two word fragment ("fast", "transparent") is joined to the next item as part of a run of adjectives.
export function splitList(raw: unknown): string[] {
  if (typeof raw !== 'string') return [];
  const text = fixNumbers(raw);
  const lines = text.split(/\n/).map((x) => x.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
  const hasBreaks = lines.length > 1 || /;/.test(text);
  let parts: string[] = [];
  for (const line of lines) {
    const bySemi = splitOutsideParens(line, /;/);
    if (bySemi.length > 1 || hasBreaks) parts.push(...bySemi);
    else parts.push(...splitOutsideParens(line, LIST_COMMA));
  }
  const merged: string[] = [];
  for (const p of parts) {
    if (merged.length && JOINER.test(p)) merged[merged.length - 1] += ', ' + p;
    else merged.push(p);
  }
  // short fragments: "fast; transparent; compliant and error free travel" is one run of adjectives
  const out: string[] = [];
  for (let i = 0; i < merged.length; i++) {
    let cur = merged[i];
    while (i < merged.length - 1 && cur.split(/\s+/).length <= 2 && /^[a-z]/.test(cur) && !/\d/.test(cur)) { i++; cur += ', ' + merged[i]; }
    out.push(cur);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Proof, results and recognition: sorted by what they are, never presented as something they are not.
// ---------------------------------------------------------------------------------------------------------------------------
export type ProofKind = 'result' | 'quote' | 'recognition' | 'title' | 'scale' | 'claim';
export interface ProofItem {
  text: string;           // the item as typed, label removed
  label: string;         // the source label typed in brackets at the end ("customer quote", "page claim"), or ''
  kind: ProofKind;
  figure: boolean;       // the item holds a figure
  shown: string;         // text plus label, as typed
}

const LABEL_WORDS = '(?:customer quote|partner quote|page claim|case study title|case study|ebook title[^()]*|customer story title|success story title|story title|press release|analyst report|source|customer story|quote)';
const LABEL_CLOSE = new RegExp(`\\(\\s*${LABEL_WORDS}[^()]*\\)\\s*[;,]\\s+(?=[A-Z0-9"“])`, 'g');
const LABEL_END = new RegExp(`\\(\\s*(${LABEL_WORDS}[^()]*)\\)\\s*[.;]?\\s*$`, 'i');

// Splits a list of proof points or results. A bracketed source label at the end of an item ("(page claim)") marks where it ends,
// so a comma or a semicolon inside an item never splits it. Without labels, the general list rule applies.
export function splitProof(raw: unknown): string[] {
  if (typeof raw !== 'string') return [];
  const text = fixNumbers(raw).trim();
  if (!text) return [];
  const lines = text.split(/\n+/).map((x) => x.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
  const out: string[] = [];
  for (const line of lines) {
    const marks = [...line.matchAll(LABEL_CLOSE)];
    if (marks.length === 0) {
      // an item that opens with a known opener ("Customer quote:", "Recognition", "Named a") starts a new item after a comma or a semicolon
      const pieces = splitOutsideParens(line, /[,;]\s+(?=(?:Customer (?:quote|words)|Recognition|Named (?:a|as)|Featured in|Success story)\b)/);
      for (const piece of pieces) out.push(...(pieces.length > 1 ? [piece.replace(/[,;]\s*$/, '')] : splitList(piece)));
      continue;
    }
    let start = 0;
    for (const m of marks) {
      const end = (m.index as number) + m[0].lastIndexOf(')') + 1;
      out.push(line.slice(start, end).trim());
      start = (m.index as number) + m[0].length;
    }
    const rest = line.slice(start).trim();
    if (rest) out.push(rest);
  }
  // inside one chunk, "; Capital" outside brackets starts another item; "; 2,000+ man hours" continues the one before
  const items: string[] = [];
  for (const chunk of out) {
    const raw = splitOutsideParens(chunk, /;\s+(?=[A-Z"“])/);
    // a piece shorter than 60 characters is the start of the item that follows ("Success story: sensitive credentials exposed; Acme secured ...")
    const pieces: string[] = [];
    for (const piece of raw) {
      if (pieces.length && pieces[pieces.length - 1].length < 60) pieces[pieces.length - 1] += ', ' + piece;
      else pieces.push(piece);
    }
    for (const piece of pieces.length ? pieces : [chunk]) items.push(piece.replace(/;\s+(?=[\d a-z])/g, ', '));
  }
  return items.map((x) => x.replace(/[;,]\s*$/, '').trim()).filter(Boolean);
}

const RECOGNITION = /\b(?:recogni[sz]ed|recognition|named (?:a |an |as )?(?:leader|major contender|contender|challenger|visionary|enterprise innovator|top)|leader in|leaders? in|ranked|ranking|award(?:s|ed)?|winner|magic quadrant|gartner|forrester|\bg2\b|everest|hfs|frost radar|frost & sullivan|idc\b|cio choice|enterprise innovator|best (?:[A-Za-z&\-]+ ){1,6}(?:platform|solution|tool|provider|vendor|product)|top \d+)\b/i;
const SCALE = /\b(?:\d[\d,.]*\+?\s*(?:m|mn|million|k|thousand|lakh|crore)?\+?\s+(?:businesses|customers|teams|companies|users|brands|enterprises|organi[sz]ations|developers|clients|countries)\b|(?:more than|over|up to)\s+\d[\d,.]*\+?\s*(?:million|thousand|k|m)?\s+\w+\s+(?:use|trust|rely)|\d[\d,.]*\+?\s*(?:million|mn|m|thousand|k)?\+?\s+\w+\s+(?:trust|use)\b)/i;
const OUTCOME_VERB = /\b(?:reduc\w+|cut|cuts|saved?|saves|improv\w+|increas\w+|grew|grow|boost\w*|achiev\w+|automat\w+|consolidat\w+|digiti[sz]ed|expanded|scaled|deliver\w+|lower\w*|rais\w+|doubl\w+|halv\w+|faster|shorter|from \d[\d.,]*%? to|up from|down from|resulted in)\b/i;

export function parseProof(raw: unknown): ProofItem[] {
  return splitProof(raw).map((item) => {
    const m = LABEL_END.exec(item);
    const label = m ? m[1].trim() : '';
    const text = (m ? item.slice(0, m.index) : item).trim().replace(/[;,.\s]+$/, '');
    const l = label.toLowerCase();
    const figure = /\d/.test(text);
    let kind: ProofKind;
    if (RECOGNITION.test(text) && !/\bcustomer quote\b/.test(l)) kind = 'recognition';
    else if (/quote/.test(l)) kind = 'quote';
    else if (/title|story/.test(l) || /^(?:how|why)\b/i.test(text)) kind = 'title';
    else if (SCALE.test(text) && !OUTCOME_VERB.test(text)) kind = 'scale';
    else if (/page claim/.test(l) && !OUTCOME_VERB.test(text)) kind = 'claim';
    else kind = 'result';
    return { text, label, kind, figure, shown: label ? `${text} (${label})` : text };
  });
}

export const KIND_NOTE: Record<ProofKind, string> = {
  result: 'a result',
  quote: 'a customer quote',
  recognition: 'a recognition or ranking, not a customer outcome',
  title: 'a story title only, with no detail of the outcome',
  scale: 'a company-wide count, not one customer\'s result',
  claim: 'a claim from the vendor\'s own page'
};

// ---------------------------------------------------------------------------------------------------------------------------
// Topics: a long topic typed as "How <audience> can <verb> <problem>, from <company>" is read into its parts, and every repeat of the
// topic in a draft uses a short label instead of the whole sentence. A topic of up to 80 characters is its own label.
// ---------------------------------------------------------------------------------------------------------------------------
export interface TopicParts { audience: string; problem: string; company: string; label: string; short: boolean; }
const HOW_CAN = /^how\s+(.+?)\s+can\s+(?:tackle|address|solve|handle|fix|fight|reduce|manage|overcome|deal with|beat|stop|cut|improve)\s+(.+?)(?:,\s*(?:from|with|using|through|via)\s+([^,]+))?$/i;
export function unpackTopic(topic: string): TopicParts {
  const t = fixNumbers(topic.trim().replace(/\s+/g, ' '));
  const m = HOW_CAN.exec(t);
  let audience = '';
  let problem = '';
  let company = '';
  if (m) { audience = m[1].trim(); problem = m[2].trim(); company = (m[3] || '').trim(); }
  const source = problem || t;
  const short = t.length <= 80;
  let label = short ? t : '';
  if (!label) {
    const first = source.split(/[,;:]| \(| while | with /i)[0].trim();
    label = first.split(/\s+/).length >= 2 && first.length <= 90 ? first : clipAtWord(source, 80);
  }
  return { audience, problem, company, label: label.replace(/[.!?]+$/, ''), short };
}
export function clipAtWord(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return (at > 20 ? cut.slice(0, at) : cut).replace(/[,;:\s-]+$/, '');
}

// A person's role and employer typed as "CFO at Fintech" or "Head of IT, Acme": the role, then the rest.
export function roleOf(audience: string | undefined): { role: string; field: string } {
  const a = (audience || '').trim();
  const m = /^(.+?)\s+(?:at|in|of)\s+(.+)$/i.exec(a);
  if (m && m[1].split(/\s+/).length <= 5) return { role: m[1].trim(), field: m[2].trim() };
  return { role: a, field: '' };
}

// Words of the sector that a text already uses (for "your text already speaks to ...").
export function usesAny(text: string, words: string[]): string[] {
  const lower = text.toLowerCase();
  return words.filter((w) => w.split(/\s+/).filter((x) => x.length >= 5).some((x) => lower.includes(x.toLowerCase())));
}

// A long sentence shortened for a short format (a post, a tweet, a card) without cutting a phrase: it ends at a clause boundary
// (a semicolon, a colon or a comma), never in the middle of a word or an item. A sentence that fits is returned as it is. When even
// the first clause does not fit, the first clause is returned whole (the format may then run over its limit, and says so).
export function shortenClauses(sentence: string, max: number): string {
  const t = sentence.trim().replace(/[.!?]+$/, '');
  if (t.length <= max) return t;
  const parts = splitOutsideParens(t, /[;,]\s+|:\s+(?=[A-Za-z])/);
  // keep the separators: rebuild from the original text positions
  let end = 0;
  let best = 0;
  let pos = 0;
  for (let i = 0; i < parts.length; i++) {
    const at = t.indexOf(parts[i], pos);
    pos = at + parts[i].length;
    end = pos;
    if (end <= max) best = end; else break;
  }
  if (best === 0) best = (() => { const at = t.indexOf(parts[0]); return at + parts[0].length; })();
  // a first clause that is far too long is cut at a word boundary and marked with "..." (a pasted document without punctuation)
  if (best > max * 1.5) return clipAtWord(t, max) + '...';
  return t.slice(0, best).replace(/[,;:\s]+$/, '');
}

// ---------------------------------------------------------------------------------------------------------------------------
// Hashtags: the brand named in the text (never a random word), the sector's own terms that the text uses, then the sector's name.
// With none of them, no hashtag is invented and the line says what to add.
// ---------------------------------------------------------------------------------------------------------------------------
import type { Vertical } from './verticals.ts';
const camelTag = (t: string) => t.split(/[\s-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('').replace(/[^A-Za-z0-9]/g, '');
export function brandFrom(...texts: (string | undefined)[]): string {
  for (const raw of texts) {
    const t = (raw || '').trim();
    const m = /^([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)?)\s*:/.exec(t)
      || /^([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)?)(?:'s|’s) (?:view|take|position)\b/.exec(t)
      || /^([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)?)\s+(?:team|group|company)\b/.exec(t)
      || /\bAt ([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)?) we\b/.exec(t)
      || /\b(?:Head|Director|VP|Founder|CEO|CMO|Manager|Lead)[A-Za-z ]* (?:at|of) ([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)?)\b/.exec(t);
    if (m) return m[1];
  }
  return '';
}
export function makeHashtags(text: string, brand: string, v: Vertical | null, extra: string[] = []): string {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  if (brand) tags.push(camelTag(brand));
  if (v) for (const term of v.vocabulary) if (tags.length < 4 && lower.includes(term.toLowerCase())) tags.push(camelTag(term));
  if (v && tags.length < 4) tags.push(camelTag(v.name));
  for (const e of extra) if (tags.length < 4) tags.push(camelTag(e));
  const uniq = tags.filter((t, i) => t && tags.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i);
  return uniq.length ? uniq.map((t) => `#${t}`).join(' ') : 'Hashtags: none are suggested because the text names no brand and no sector term. Add the brand name and one term your readers search for.';
}

// Claims in a text that need a source before they are published: superlatives and "first and only" style claims.
const SUPERLATIVE_CLAIM = /\b(?:the first and only|first and only|the only|the first|world'?s first|world'?s largest|largest|#1|number one|best[- ]in[- ]class|world[- ]class|industry[- ]leading|market[- ]leading|leading provider|unrivall?ed|guaranteed|proven track record)\b/i;
export function claimsToSource(texts: string[]): string[] {
  const out: string[] = [];
  for (const t of texts) {
    const m = SUPERLATIVE_CLAIM.exec(t);
    if (m && !out.includes(m[0].toLowerCase())) out.push(m[0].toLowerCase());
  }
  return out;
}

// A short label for a long topic or headline subject: up to 90 characters as it is; otherwise cut before a trailing description
// (", described as", ", which", ", with") or at the first semicolon or colon outside brackets; never in the middle of a phrase.
export function headlineSubject(topic: string, max = 90): string {
  const t = fixNumbers(topic.trim().replace(/\s+/g, ' '));
  if (t.length <= max) return t;
  const cut = splitOutsideParens(t, /,\s+(?:described as|which|that|with|including|for|so|where)\b|[;:]\s+/)[0];
  if (cut && cut.split(/\s+/).length >= 3 && cut.length <= max) return cut;
  return shortenClauses(t, max);
}
