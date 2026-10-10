// Run 22 (content rewrite): shared writing helpers for newsletter_builder, thought_leadership_series and webinar_script.
// They read what the user typed into points (a problem, a result with its source label, a quote, a capability), say each point in a
// whole sentence of ours, and write the closing line that names what was not given. Rule B82: nothing here adds a figure, a quote, a
// customer or a named company; the words come from the user's text and from the one sector file (src/verticals.ts).

import { splitList, fixNumbers, endSentence, capFirst, proseJoin, clipAtWord, dropTail, tidyPoint, STAT, FIGURE, RECOGNITION, SCALE } from './draft.ts';
import { cap, lowerFirstIfCommon, isCommonWord } from './utils.js';
import { neutraliseText } from './echo-safe.ts';

// ---- the text as typed -------------------------------------------------------------------------------------------------------

// The entry safeguard quotes a whole field in curly quotes when a part of it looks like an instruction. The quotes are not the user's, so they are taken off
// for fields that are split into points (each instruction-like point is quoted again later). With keepIfInstruction a field that is built into a sentence
// as it stands (a byline, "written for ...", a speaker line) keeps the safeguard's quotes when it is instruction-like (run 22 close: the final hostile probe
// found the instruction text woven into those lines without them); quotes the user typed round a plain field are unwrapped either way.
export function stripGuardQuotes(s: string, keepIfInstruction = false): string {
  const t = s.trim();
  if (!(/^[“"][\s\S]*[”"]$/.test(t) && !/[“”]/.test(t.slice(1, -1)) && t.length > 2 && /^“/.test(t))) return t;
  const inner = t.slice(1, -1).trim();
  return keepIfInstruction && /^“[\s\S]*”$/.test(neutraliseText(inner)) ? t : inner;
}
// Numbers typed with grouping commas that were turned into semicolons ("80;000", "5;00;000") are put back.
export function splitQuoteRuns(s: string): string {
  // a quote that ends and a source label that closes, each followed by a comma and a capital, end a point
  return s.replace(/([.!?]['"”’])\s*,\s+(?=[A-Z0-9])/g, '$1; ').replace(/(\([^()]*\))\s*,\s+(?=[A-Z0-9])/g, (m, g1: string) => (LABEL_WORD.test(g1) ? `${g1}; ` : m));
}
export function tidy(s: string): string {
  return splitQuoteRuns(fixNumbers(s)).replace(/(\d);(\d{2})(?=;\d{2,3}(?!\d))/g, '$1,$2').replace(/(\d);(\d{3})(?!\d)/g, '$1,$2').replace(/[ \t]+/g, ' ').trim();
}
// Text that tries to give the writing tool an order. It is kept in quotes, as the user's own words, and never followed or built into the draft.
const INSTRUCTION = /\b(?:ignore|disregard|forget|override|bypass)\b.{0,60}\b(?:instructions?|prompts?|rules?|guidelines?|above|previous|prior)\b|\bsystem prompt\b|\bnew instructions?\b|\byou are now\b|\bpretend (?:to be|you)\b|\breveal\b.{0,40}\b(?:prompt|secret|password|key)\b|\bact as (?:an? )?(?:ai|assistant|model|dan)\b/i;
export const isInstruction = (s: string): boolean => INSTRUCTION.test(s);
export function instructionNote(lines: string[]): string {
  if (!lines.length) return '';
  return `${lines.length === 1 ? 'One line you typed reads like an order to the writing tool' : 'Some lines you typed read like orders to the writing tool'}, so ${lines.length === 1 ? 'it is' : 'they are'} kept as written and not built into the draft: ${lines.map((l) => `"${l.replace(/"/g, "'").replace(/[.;\s]+$/, '')}"`).join(' ')}`;
}

// The source label typed in brackets at the end of a point ("(page claim)", "(customer quote)", "(hypothetical figure)").
const LABEL_WORD = /\b(?:claims?|quotes?|words|headline|title|story|stories|figures?|case study|hypothetical|example|press release|analyst|recogni\w+|report|source|testimonial|review|video)\b/i;
export function splitLabel(s: string): { text: string; label: string } {
  const t = s.trim();
  const m = t.match(/\s*\(([^()]*)\)\s*[.;]?\s*$/);
  if (m && (m.index as number) > 0 && LABEL_WORD.test(m[1])) return { text: t.slice(0, m.index as number).trim(), label: m[1].trim() };
  return { text: t, label: '' };
}

// ---- reading a point ---------------------------------------------------------------------------------------------------------
export type Role = 'problem' | 'result' | 'quote' | 'recognition' | 'scale' | 'story' | 'outcome' | 'capability' | 'instruction';
export interface Pt {
  text: string;        // the point as typed, label removed, no closing full stop
  label: string;       // "page claim", "customer quote", ... or ''
  role: Role;
  clause: boolean;     // reads as a whole statement with its own subject and verb
  figure: boolean;
}
const AUX = new Set(['is', 'are', 'was', 'were', 'has', 'have', 'had', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'must', 'should', 'may', 'might', 'cannot', "can't", "don't", "doesn't", "isn't", "aren't", "won't"]);
const VERB = new Set(('capture track tell give connect run make help turn let keep build deliver automate simplify show post send see read log tie push reach arrive get take find lose lost break fail miss skip hide gather lock stay cost save cut grow rise fall drop jump move work ship pay bill charge reduce increase improve achieve say says said ' +
  'bought sold went came saw ran grew rose fell kept built left held paid met led found began became chose drew sent spent stood took told thought understood showed shown ' +
  'need needs want wants use uses used believe believes expect expects start starts end ends open opens close closes sit sits happen happens depend depends require requires ' +
  'add adds lack lacks force forces leave leaves cause causes slow slows hurt hurts block blocks limit limits waste wastes create creates handle handles offer offers include includes cover covers power powers store stores sync syncs match matches check checks route routes plan plans book books settle settles approve approves').split(' '));
const IRREG = /^(?:bought|sold|went|came|saw|ran|grew|rose|fell|kept|built|left|held|paid|met|led|found|began|became|chose|sent|spent|stood|took|told|lost|got|made|gave|won|cut|put|set|hit|read)$/;
const NOT_MAIN = /^(?:that|which|who|whose|where|when|while|if|because)$/;
// A point that opens on a plain action verb is an instruction ("Show planned and visited outlets side by side"); it stands as a sentence.
const IMPERATIVE = /^(?:show|let|log|tie|send|post|push|see|get|keep|make|use|put|move|start|stop|build|add|pick|choose|ask|agree|compare|measure|find|read|write|tell|give|take|bring|connect|define|turn|drive|reduce|increase|improve|automate|simplify|replace|remove|align|avoid|reclaim|shrink|raise|free|resolve|expand|launch|pay|act|train|prepare|stay|cut|speed|stitch|unify|deliver|protect|detect|prevent|consolidate|streamline|standardi[sz]e|migrate|onboard|enable|ensure|validate|verify|block|collect|optimi[sz]e|accelerate|boost|grow|retain|convert|recover|deploy|integrate|centrali[sz]e|scale|analy[sz]e|save|link|win|earn|spend|hit|settle|reconcile|ship|approve|forecast|escalate|submit|respond|authori[sz]e)\b/i;
const IMPERATIVE_WITH_OBJECT = /^(?:run|check|review|track|share|reach|plan|map|set|test|release|close|open|route|book|name|list|count)\s+(?:a|an|the|every|each|all|one|your|its|their|any|only)\b/i;
export const startsImperative = (t: string): boolean => IMPERATIVE.test(t.trim());
export const isImperative = (text: string): boolean => text.trim().split(/\s+/).length >= 3 && (IMPERATIVE.test(text.trim()) || IMPERATIVE_WITH_OBJECT.test(text.trim()));
const FUNCTION_WORD = /^(?:a|an|the|of|in|on|at|by|to|from|with|as|into|across|over|and|or|for|its|their|our|your|per|each|every|all|any|no|new|more|most|fewer|less|measurable|significant|single|unified)$/;
export function looksClause(text: string): boolean {
  const raw = text.replace(/\([^)]*\)/g, ' ').split(/\s+/).filter(Boolean);
  const tokens = raw.map((x) => x.toLowerCase());
  if (tokens.length < 3) return false;
  if (isImperative(text)) return true;
  for (let i = 1; i < Math.min(tokens.length, 10); i++) {
    const w = tokens[i].replace(/[^a-z'-]/g, '');
    if (NOT_MAIN.test(w)) return false;
    if (/^(?:led|built|held|driven|based)$/.test(w) && /^[A-Z]{2,}$/.test((raw[i - 1] || '').replace(/[^A-Za-z]/g, ''))) continue;   // "API led", "AI driven": a compound adjective
    if (AUX.has(w)) return true;
    if (/ed$/.test(w) && /^(?:by|in|to|from|on|with|for|under|within|through|across|over)$/.test((tokens[i + 1] || '').replace(/[^a-z]/g, '')) && !AUX.has(tokens[i - 1].replace(/[^a-z'-]/g, ''))) continue;   // "transcripts delivered in under 300 milliseconds": a participle, not a main verb
    if (IRREG.test(w) && !(/^(?:led|built|held|driven)$/.test(w) && /^[A-Z]{2,}$/.test((raw[i - 1] || '').replace(/[^A-Za-z]/g, '')))) return true;
    const prev = tokens[i - 1].replace(/[^a-z'-]/g, '');
    if (FUNCTION_WORD.test(prev)) continue;
    const stem = w.replace(/(?:ies)$/, 'y').replace(/(?:es|s|ed|d)$/, '');
    if (VERB.has(w)) return true;
    if (VERB.has(stem)) {
      // a 3rd person verb after a noun or name; a past form only after a plural noun, a pronoun or a name
      if (/s$/.test(w) && !/(?:ed|ss)$/.test(w)) return true;
      if (/ed$/.test(w) && (/[^s]s$/.test(prev) || /^(?:it|they|we|he|she|who)$/.test(prev) || /^[A-Z]/.test(raw[i - 1] || ''))) return true;
    }
  }
  return false;
}
// A plain phrase: starts with a small letter, has no verb of its own, carries no label or figure.
const fragment0 = (t: string): boolean => /^[a-z]/.test(t) && !looksClause(t) && !PARTICIPLE_START.test(t) && !/\d/.test(t);
// A point that opens on a past participle ("built from the ground up for ...") or a joining word continues a sentence; it is never one.
export const PARTICIPLE_START = /^(?:(?:built|designed|made|powered|backed|trusted|operated|delivered|offered|priced|billed|written|hosted|managed|used)\s+(?:by|for|from|on|in|with|to|around|as|across)|available\s+(?:in|on|for|as|across))\b/i;
export const JOIN_START = /^(?:with|without|including|plus|and|but|or|so|which|that|because|while|instead|rather|not|then|yet)\b/i;
const OUTCOMEISH = /^(?:measurable |significant |up to |about |over |more than |much |clear |faster |lower )?(?:gains?|reductions?|faster|fewer|less|lower|higher|more|increases?|improvements?|savings?|growth|drops?|launch|keep|see|pay only|expand|release)\b/i;

function roleOf(p: { text: string; label: string; clause: boolean; figure: boolean }, problemLike: boolean, known = false): Role {
  const l = p.label.toLowerCase();
  if (isInstruction(p.text)) return 'instruction';
  if (known) return 'problem';
  if (/quote|testimonial/.test(l) || /^(?:customer|partner) (?:quote|words)\b/i.test(p.text) || /^["“]/.test(p.text)) return 'quote';
  if (RECOGNITION.test(p.text) && !/customer/.test(l)) return 'recognition';
  if (/title|headline|story/.test(l) && !p.figure) return 'story';
  if (SCALE.test(p.text) && !p.clause) return 'scale';
  if (p.figure && (p.label || p.clause || OUTCOMEISH.test(p.text))) return 'result';
  if (problemLike) return 'problem';
  if (OUTCOMEISH.test(p.text)) return 'outcome';
  return 'capability';
}
const PROBLEM_WORD = /\b(?:(?:do|does|did|is|are|was|were|can|could|will|would)\s+not|never|without|fail\w*|break\w*|broken|lose|lost|loses|late|slow\w*|manual\w*|hard|harder|difficult|stall\w*|stuck|drift\w*|gaps?|leak\w*|miss\w*|wast\w*|delay\w*|errors?|risks?|fragment\w*|disconnected|isolated|scattered|siloed|can't|cannot|don't|doesn't|ignore\w*|struggl\w*|pain|costly|expensive|skip\w*|never shows)\b/i;
export const nk = (x: string): string => x.toLowerCase().replace(/[^a-z0-9]+/g, '');

// Split off the first top-level pieces that spell out `known` (the problem the topic names), whatever commas or semicolons separate them.
// The topic's problem may run on into a description of the seller (a bracket note, a list of services), so a point that spells out the
// start of it is recognised too: the covered part is the problem, the rest of that piece stays a point.
function takeKnown(pieces: string[], known: string): { first: string | null; rest: string[] } {
  const target = nk(known);
  if (target.length < 20) return { first: null, rest: pieces };
  let acc = ''; let k = 0;
  while (k < pieces.length && target.startsWith(acc + nk(pieces[k])) && nk(pieces[k]).length > 0) { acc += nk(pieces[k]); k++; if (acc.length === target.length) break; }
  if (acc.length === target.length) return { first: known, rest: pieces.slice(k) };
  // the covered part ends inside the next piece, or the next piece runs on past the problem
  const next = pieces[k];
  let covered = acc.length;
  let restOfNext = '';
  if (next !== undefined) {
    const want = target.slice(acc.length); const have = nk(next);
    let L = 0; while (L < want.length && L < have.length && want[L] === have[L]) L++;
    if (L === want.length && have.length > L) {
      // the piece runs on past the end of the problem: cut it after the problem's last character
      let idx = 0; let n = 0;
      while (idx < next.length && n < L) { if (/[a-z0-9]/i.test(next[idx])) n++; idx++; }
      while (idx < next.length && /[)\]"”'’.]/.test(next[idx])) idx++;
      covered += L; restOfNext = next.slice(idx).replace(/^[\s,;:.\-]+/, '').trim();
      k++;
    } else if (L >= 15 && L < have.length) {
      // the problem text goes on in the topic but the piece goes its own way: cut at the last whole word that agrees
      let idx = 0; let n = 0;
      while (idx < next.length && n < L) { if (/[a-z0-9]/i.test(next[idx])) n++; idx++; }
      while (idx < next.length && /[a-z0-9]/i.test(next[idx])) idx--;
      if (idx > 0) {
        const kept = nk(next.slice(0, idx)).length;
        covered += kept; restOfNext = next.slice(idx).replace(/^[\s,;:.\-]+/, '').trim(); k++;
      }
    }
  }
  if (covered < 40 && covered < 0.6 * target.length) return { first: null, rest: pieces };
  // the covered part of the topic's own spelling of the problem
  let cut = 0; let n2 = 0;
  while (cut < known.length && n2 < covered) { if (/[a-z0-9]/i.test(known[cut])) n2++; cut++; }
  while (cut < known.length && /[)\]"”'’]/.test(known[cut])) cut++;
  const first = known.slice(0, cut).replace(/[\s,;:.\-]+$/, '');
  let rest = restOfNext ? [restOfNext, ...pieces.slice(k)] : pieces.slice(k);
  // one or two stray words ("faster") belong to the point that follows
  if (restOfNext && restOfNext.split(/\s+/).length <= 2 && rest.length > 1) rest = [`${rest[0]}, ${rest[1]}`, ...rest.slice(2)];
  return { first, rest };
}
// A source label followed by a comma and more text ("... in 6 days (page claim), built from the ground up") ends the point.
function splitAfterLabels(piece: string): string[] {
  const out: string[] = []; let start = 0;
  for (const m of piece.matchAll(/\(([^()]*)\)\s*[,;]\s+(?=\S)/g)) {
    if (LABEL_WORD.test(m[1])) { out.push(piece.slice(start, (m.index as number) + m[0].indexOf(')') + 1)); start = (m.index as number) + m[0].length; }
  }
  out.push(piece.slice(start));
  return out.map((x) => x.trim()).filter(Boolean);
}

function splitSemi(text: string): string[] {
  const out: string[] = []; let depth = 0; let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '(') depth++; else if (c === ')') depth = Math.max(0, depth - 1);
    else if (c === ';' && depth === 0) { out.push(text.slice(start, i)); start = i + 1; }
  }
  out.push(text.slice(start));
  return out.map((x) => x.trim()).filter(Boolean);
}
// Lines and semicolons are the user's own separators and are kept as points; a comma separates points only in a text that has neither.
function pieces(text: string): string[] {
  if (/[\n;]/.test(text)) return text.split(/\n/).map((l) => l.trim().replace(/^[-*•]\s*/, '')).filter(Boolean).flatMap(splitSemi);
  return splitList(text);
}

export function readPoints(raw: string | undefined, known: { problem?: string } = {}): Pt[] {
  if (!raw || !raw.trim()) return [];
  const text = tidy(stripGuardQuotes(raw));
  let list = pieces(text).flatMap(splitAfterLabels);
  const items: { text: string; label: string; problem: boolean }[] = [];
  if (known.problem) {
    const t = takeKnown(list, tidy(known.problem));
    if (t.first) { items.push({ text: t.first.replace(/[.\s]+$/, ''), label: '', problem: true }); list = t.rest.flatMap(splitAfterLabels); }
  }
  // A list broken at both commas and semicolons shows it by a piece that opens on a joining word; then a short piece that starts with a
  // small letter continues the piece before it (up to 420 characters), so no point is a stump.
  if (list.slice(1).some((x) => /^(?:not|but|and|or|so|which|that|because|while|with|without|including|plus|then|yet|rather)\b/i.test(x))) {
    const welded: string[] = [];
    for (const cur of list) {
      const prev = welded[welded.length - 1];
      if (prev !== undefined && /^[a-z]/.test(cur) && cur.split(/\s+/).length < 8 && !/[.!?]$/.test(prev) && prev.length + cur.length < 420 && !splitLabel(prev).label && !splitLabel(cur).label && !/\d/.test(cur)) welded[welded.length - 1] = `${prev}, ${cur}`;
      else welded.push(cur);
    }
    list = welded;
  }
  for (const p of list) { const s = splitLabel(tidyPoint(p.replace(/^[-*•]\s*/, '').replace(/^(?:and|but|or|then)\s+/i, ''))); const tx = s.text.replace(/[.;,\s]+$/, ''); if (tx) items.push({ text: tx, label: s.label, problem: false }); }
  // a fragment that begins on a joining word continues the point before it; a short fragment without a verb continues a list
  const merged: typeof items = [];
  let inList = false;
  let carry = '';
  for (const it0 of items) {
    const it = carry && !it0.problem ? { ...it0, text: `${carry}, ${it0.text}` } : it0;
    carry = '';
    const prev = merged[merged.length - 1];
    const words = it.text.split(/\s+/).length;
    const joins = /^(?:with|without|including|plus|which|that|because|instead|not|so|combined|such as|for example|e\.g\.|at|than|under|per|within|via|using|through)\b/i.test(it.text);
    // a name or a short run of names after a piece that ends on a name ("partnerships with Google; WhatsApp; Meta") continues that list
    const nameList = !!prev && !prev.label && prev.text.split(/\s+/).length >= 2 && /[A-Z][A-Za-z0-9.+-]*$/.test(prev.text) && /^[A-Z0-9]/.test(it.text) && it.text.split(/\s+/).length <= 5 && !looksClause(it.text) && !it.label && !isImperative(it.text);
    // a piece that ends on a joining word ("partnerships with") runs on into the next one
    const dangling = !!prev && !prev.label && /\b(?:with|including|such as|and|or|of|from|by|to|for|across)$/i.test(prev.text);
    // a list-taking verb with no object yet ("that adapts simulations, coaching") takes the plain phrases that follow
    const verbList = !!prev && !prev.label && /\b(?:adapts|covers|includes|connects|combines|supports|handles|offers|provides|unifies|spans|tracks|monitors|automates)\s+[^;]{0,70}$/i.test(prev.text) && fragment0(it.text) && it.text.split(/\s+/).length <= 24;
    const fragment = /^[a-z]/.test(it.text) && !looksClause(it.text) && !PARTICIPLE_START.test(it.text) && !it.label && !/\d/.test(it.text);
    if (fragment && words <= 3 && /^(?:an?|the|its|their|our|one)\b/i.test(it.text) && !it.problem) { carry = it.text; continue; }
    if (prev && !it.problem && !prev.label && ((joins && !/^(?:with|without|including|plus|combined|at|than|under|per|within|via|using|through)\b/i.test(it.text)) || !prev.problem && (joins || nameList || dangling || verbList || (fragment && (words <= 3 || inList))))) {
      prev.text += `, ${it.text}`;
      if (it.label && !prev.label) prev.label = it.label;
      inList = fragment && words <= 3 ? true : inList && fragment;
    } else {
      merged.push({ ...it });
      inList = /^[a-z]/.test(it.text) && it.text.split(/\s+/).length <= 3 && !it.problem;
      merged[merged.length - 1].text = it.text.replace(/^(?:with|including|plus)\s+/i, '');
    }
  }
  if (carry) merged.push({ text: carry, label: '', problem: false });
  // a plural label at the end of a run of figures ("... (page claims)") covers the figures before it that carry none
  for (let i = merged.length - 1; i > 0; i--) {
    const fig = (t: string) => STAT.test(t) || FIGURE.test(t) || /\bper cent\b/i.test(t);
    if (/\b(?:claims|figures|words|quotes|stories)\b/i.test(merged[i].label)) {
      for (let j = i - 1; j >= 0 && !merged[j].label && fig(merged[j].text) && !merged[j].problem; j--) merged[j].label = merged[i].label;
    }
  }
  return merged.map((it) => {
    const figure = (STAT.test(it.text) || FIGURE.test(it.text) || /\bper cent\b/i.test(it.text)) && /\d/.test(it.text);
    const clause = looksClause(it.text) && !PARTICIPLE_START.test(it.text) && !JOIN_START.test(it.text);
    const base = { text: it.text, label: it.label, clause, figure };
    const problemLike = it.problem || (clause && PROBLEM_WORD.test(it.text) && !figure && !isImperative(it.text) && !/^(?:it|we|our|its|this|these)\b/i.test(it.text));
    return { ...base, role: roleOf(base, problemLike, it.problem) };
  });
}

// ---- saying a point ----------------------------------------------------------------------------------------------------------
export const withLabel = (p: Pt): string => (p.label ? `${p.text} (${p.label})` : p.text);
// A sentence placed after a lead-in of ours: its first letter is lowered only when the first word is a common word, so a name keeps its capital.
export function lowerFirstSafe(s: string): string {
  const t = s.trim();
  const w = t.split(/\s+/)[0] || '';
  if (/[A-Z0-9]/.test(w.slice(1)) || w === 'I' || !isCommonWord(w.replace(/[^A-Za-z]/g, ''))) return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
}
const lowerStart = (s: string): string => lowerFirstSafe(s);
// One point as a whole sentence. `who` is the product or company the points are about ("" when none is known).
export function sentenceOf(p: Pt, who: string, variant = 0): string {
  const t = withLabel(p);
  const tIn = t.replace(/:\s+/, ', namely ');   // a text that has a colon of its own does not follow a lead-in that has one
  if (p.clause) return endSentence(capFirst(t));
  if (PARTICIPLE_START.test(p.text) && who) return endSentence(`${who} is ${lowerStart(t)}`);
  switch (p.role) {
    case 'result': return endSentence(`${['The result on record', 'One result to hold on to', 'A figure worth knowing'][variant % 3]}: ${lowerStart(tIn)}`);
    case 'outcome': return endSentence(`${['The change on offer', 'What readers can expect', 'The difference it makes'][variant % 3]}: ${lowerStart(tIn)}`);
    case 'recognition': return endSentence(`${who ? `${who} is on record as` : 'On record'}: ${lowerStart(tIn)}`);
    case 'quote': return endSentence(`A customer puts it this way: "${p.text.replace(/^["“]|["”]$/g, '').replace(/"/g, "'")}"${p.label ? ` (${p.label})` : ''}`);
    case 'scale': return endSentence(`The scale: ${lowerStart(t)}`);
    case 'story': return endSentence(`One customer story is titled: ${p.text.replace(/"/g, "'")}${p.label ? ` (${p.label})` : ''}; its title carries no result of its own`);
    case 'problem': return endSentence(`The problem: ${lowerStart(t)}`);
    default: return endSentence(`${variant % 2 === 0 ? (who ? `How ${who} does it` : 'How it works') : (who ? `What ${who} brings` : 'What it brings')}: ${lowerStart(tIn)}`);
  }
}
// A group of points in one paragraph: statements as sentences; phrases (which cannot stand as a sentence) under one lead-in as a short list.
export function renderGroup(points: Pt[], who: string, lead: string, variant = 0): string {
  const whole = points.filter((p) => p.clause || (PARTICIPLE_START.test(p.text) && who));
  const phrases = points.filter((p) => !whole.includes(p));
  const out: string[] = [];
  // the order the user gave is kept inside each kind
  if (whole.length) out.push(whole.map((p, i) => sentenceOf(p, who, variant + i)).join(' '));
  if (phrases.length === 1) out.push(sentenceOf(phrases[0], who, variant));
  else if (phrases.length > 1) out.push(`${lead}\n\n${phrases.map((p) => `- ${capFirst(withLabel(p))}`).join('\n')}`);
  return out.join('\n\n');
}
// Capability phrases that follow each other are one list: "a, b, with c".
export function groupPhrases(points: Pt[]): Pt[] {
  return points.map((p) => ({ ...p }));   // each phrase stays a point of its own; the renderers put phrases in a short list
}

// ---- short forms -------------------------------------------------------------------------------------------------------------
// A short form of a long statement for a subject line or a heading: the whole text when it fits; the part after "but do not" (the gap
// the statement names); the first clause; else the first words, cut at a word and never on a joining word. No "..." is ever added.
export function shorten(text: string, max: number, strict = false): string {
  const t = text.replace(/\s+/g, ' ').trim().replace(/[.!?:;,]+$/, '');
  if (t.length <= max) return capFirst(t);
  const gap = t.match(/\b(?:but|yet|while)\s+(?:do|does|did|are|is)\s+not\s+(.+)$/i) || t.match(/\b(?:but|yet|while)\s+(?:cannot|can't|never|rarely)\s+(.+)$/i);
  if (gap && gap[1].length >= 18 && gap[1].length <= max) return capFirst(gap[1].replace(/[.,;]+$/, ''));
  const clauses = t.split(/;\s+|\s+(?:but|because|so that|while|which|instead of)\s+|:\s+|\s+\(/);
  for (const c of clauses) { const cc = c.trim(); if (cc.split(/\s+/).length >= 4 && cc.length <= max) return capFirst(cc.replace(/[.,;:]+$/, '')); }
  // a long first part that stands as a phrase of its own ("when processes take people away from the project, things slow down ...")
  const comma = t.split(/,\s+/)[0].trim();
  if (comma.split(/\s+/).length >= 6 && comma.length <= max) return capFirst(comma);
  if (strict) return '';
  return capFirst(dropTail(clipAtWord(t, max)));
}
// The readers of a topic typed as "How <readers> can ...", or an audience typed in full: without a bracket note, a source note or a trailing
// description. A long list of readers is cut to its first items, whole ("online retailers and social sellers").
export function shortReaders(audience: string, max = 80): string {
  let a = audience.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();
  const cut = a.split(/\s+(?:that|who|which|where|whose|at|including)\s+|;\s+/)[0].trim();
  if (cut.length >= 4 && (cut.split(/\s+/).length >= 2 || a.length > max || /;/.test(a))) a = cut.replace(/[,\s]+$/, '');
  if (a.length <= max) return a;
  // keep the first items of a comma list while they fit
  const items = a.split(/,\s+/).map((x) => x.split(/\s+and\s+(?=large|other|more)/)[0].trim()).filter(Boolean);
  const kept: string[] = [];
  for (const it of items) { if (proseJoin([...kept, it]).length > max || it.split(/\s+/).length > 6) break; kept.push(it); }
  return kept.length ? proseJoin(kept) : '';
}
// The audience of a webinar for a spoken line: bracket notes and source notes taken out, cut at a semicolon, whole words only.
export function audienceShort(audience: string, max = 90): string {
  const a = audience.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();
  const first = a.split(/;\s+/)[0].trim().replace(/[,\s]+$/, '');
  if (first.length <= max) return first;
  const kept = shortReaders(first, max);
  return kept || dropTail(clipAtWord(first, max));
}
// The company named at the end of a topic typed as "How ... can ..., with <Company> <description with commas>": the capitalised words after the last ", with" or ", from".
export function companyFrom(topic: string): string {
  const all = [...topic.matchAll(/,\s*(?:with|from)\s+([A-Z][\w.-]*(?:\s+[A-Z][\w.-]*){0,2})/g)];
  return all.length ? all[all.length - 1][1].trim() : '';
}
// Do the readers the user named share a word with the readers the sector file expects? When they do not, the user's readers win.
export function readersFit(readers: string, v: { buyerRoles: string[]; vocabulary: string[]; committee: string; name: string }): boolean {
  const stems = (t: string) => new Set((t.toLowerCase().match(/[a-z]{5,}/g) || []).map((w) => w.replace(/(?:ing|ed|es|s)$/, '').slice(0, 6)));
  const mine = stems(readers);
  if (!mine.size) return true;
  const theirs = stems(`${v.buyerRoles.join(' ')} ${v.vocabulary.join(' ')}`);
  return [...mine].some((w) => theirs.has(w));
}
// A figure that is a statistic: a percentage, an amount of money, a multiple, or a count of something (not 24/7, 3PL or 4G).
export const isStatistic = (t: string): boolean => STAT.test(t) || /\b\d[\d,.]*\+?\s*(?:x|times|days?|weeks?|months?|years?|hours?|minutes?|seconds?|milliseconds|users|customers|businesses|companies|enterprises|brands|languages|countries|devices|networks|trucks|sites|points?)\b/i.test(t);
// The shape of a point that is not a whole statement, for the word that has to lead it.
const ADJ_LEAD = /^(?:accurate|fast|faster|slow|slower|secure|safer|reliable|scalable|compliant|flexible|simple|simpler|easy|easier|open|ready|available|transparent|predictable|cheaper|lower|higher|better|smarter|fully|highly)\s+(?:in|at|with|for|to|than|on|across|under|from|by)\b/i;
export type Shape = 'clause' | 'imperative' | 'participle' | 'adjective' | 'gerund' | 'example' | 'phrase';
export function shapeOf(p: Pt): Shape {
  if (/^(?:such as|for example|e\.g\.)\s/i.test(p.text)) return 'example';
  if (isImperative(p.text)) return 'imperative';
  if (p.clause) return 'clause';
  if (PARTICIPLE_START.test(p.text)) return 'participle';
  if (ADJ_LEAD.test(p.text)) return 'adjective';
  if (/^[A-Za-z-]+ing\b/i.test(p.text) && !/^(?:ongoing|building|housing|planning|engineering|marketing|banking|billing|routing|shipping|pricing|testing|reporting|learning)\b/i.test(p.text)) return 'gerund';
  return 'phrase';
}

// ---- the sector's answers, said to the reader --------------------------------------------------------------------------------
// The sector file writes an answer pattern for the seller ("Offer a pilot at one site"). To a reader it reads as a way to test the claim.
const TO_READER: [RegExp, string][] = [
  [/^show\b/i, 'ask to see'], [/^ask\b/i, 'ask'], [/^offer\b/i, 'ask for'], [/^propose\b/i, 'ask for'], [/^give\b/i, 'ask for'], [/^compare\b/i, 'compare'],
  [/^name\b/i, 'ask the vendor to name'], [/^state\b/i, 'ask the vendor to state'], [/^bring\b/i, 'ask the vendor to bring'], [/^explain\b/i, 'ask the vendor to explain'], [/^walk\b/i, 'ask the vendor to walk'],
  [/^position it\b/i, 'treat it'], [/^plan\b/i, 'plan'], [/^map\b/i, 'map'], [/^tie\b/i, 'tie'], [/^prepare\b/i, 'prepare'], [/^align\b/i, 'align'], [/^start\b/i, 'start'], [/^agree\b/i, 'agree'], [/^use\b/i, 'use'],
  [/^pilot\b/i, 'ask for a pilot'], [/^measure\b/i, 'measure'], [/^model\b/i, 'model'], [/^describe\b/i, 'ask the vendor to describe'], [/^time\b/i, 'time'], [/^take\b/i, 'take'], [/^share\b/i, 'ask to be shown'], [/^project\b/i, 'project'],
  [/^say\b/i, 'ask the vendor to say'], [/^count\b/i, 'count'], [/^find\b/i, 'find'], [/^list\b/i, 'list'], [/^set\b/i, 'set'], [/^run\b/i, 'run'], [/^test\b/i, 'test'],
];
// Template wording written for the author, said to the reader: "the buyer side" is "your side", "the buyer" is "you".
export function toReader(s: string): string {
  const AGREE: Record<string, string> = { gets: 'get', has: 'have', is: 'are', uses: 'use', sees: 'see', needs: 'need', wants: 'want', pays: 'pay', buys: 'buy', does: 'do', runs: 'run', knows: 'know', takes: 'take', makes: 'make', owns: 'own', signs: 'sign', reads: 'read', checks: 'check', chooses: 'choose', gains: 'gain', receives: 'receive', measures: 'measure' };
  const base = (v: string): string => (v.toLowerCase() === 'has' ? 'have' : v.toLowerCase() === 'is' ? 'are' : v.toLowerCase() === 'does' ? 'do' : /(?:ies)$/i.test(v) ? v.replace(/ies$/i, 'y') : /(?:ches|shes|sses|xes|zes)$/i.test(v) ? v.replace(/es$/i, '') : /oes$/i.test(v) ? v.replace(/es$/i, '') : /[^s]s$/i.test(v) ? v.replace(/s$/i, '') : v);
  s = s.replace(/\bthe buyer (\w+)\b/gi, (m, v: string) => (/[^s]s$/i.test(v) || /^(?:has|is|does)$/i.test(v) ? `you ${base(v)}` : m));
  return s.replace(/\bon the buyer(?:'s)? side\b/gi, 'on your side').replace(/\bthe buyer(?:'s)? side\b/gi, 'your side').replace(/\bthe buyer'?s own\b/gi, 'your own').replace(/\bthe buyer uses\b/gi, 'you use').replace(/\bthe buyer'?s\b/gi, 'your').replace(/\bthe (?:value|result|outcome) the buyer (\w+)\b/gi, (m, v) => m.replace(/the buyer \w+/i, `you ${AGREE[v.toLowerCase()] || v}`)).replace(/\bthe buyer\b/gi, 'you').replace(/\byou (gets|has|is|uses|sees|needs|wants|pays|buys|does|runs|knows|takes|makes|owns|signs|reads|checks|chooses|gains|receives|measures)\b/gi, (m, v) => `you ${AGREE[v.toLowerCase()]}`);
}
// The way to settle an objection as a phrase ("ask to see ..."), '' when the pattern holds nothing a reader can do.
export function settleBare(response: string): string {
  let r = response.trim().replace(/\.$/, '');
  if (/\b(?:position the product|trade any concession|your own (?:price|product)|our (?:price|product))\b/i.test(r)) r = r.replace(/\s+and\s+(?:position|trade)\b.*$/i, '').replace(/;\s+(?:trade|position)\b.*$/i, '');
  r = r.replace(/^position the product[^,]*,\s*/i, '');
  r = r.charAt(0).toUpperCase() + r.slice(1);
  const hit = TO_READER.find(([re]) => re.test(r));
  if (!hit) return '';
  const body = toReader(`${hit[1]}${r.replace(hit[0], '')}`).replace(/\bthe product\b/gi, 'the vendor');
  return body.charAt(0).toLowerCase() + body.slice(1);
}
// A way for the reader to settle the objection, in one sentence; '' when the pattern holds nothing a reader can do.
export function waysToSettle(response: string): string {
  const b = settleBare(response);
  return b ? `A fair way to settle it is to ${b}.` : '';
}

// ---- the closing line --------------------------------------------------------------------------------------------------------
// What was not given, named once: 'To sharpen this, give: X (it would change Y); Z (it would change W).'
export function sharpenLine(missing: { field: string; change: string }[]): string {
  if (!missing.length) return '';
  return `To sharpen this, give: ${missing.map((m) => `${m.field} (it would change ${m.change})`).join('; ')}.`;
}

// The sector line without the request to the user: what could be given belongs in the closing line, where it is asked for once.
export const cleanSectorLine = (line: string): string => line.replace(/; set business_model to change it/g, '').replace(/; set business_model \([^)]*\) for advice that fits it/g, '');

// A typed objection in quotes inside a sentence of ours: the full stop goes after the closing quote only when the objection has no mark of its own.
export const quotedEnd = (text: string): string => `"${text.trim().replace(/"/g, "'")}"${/[?!.]$/.test(text.trim()) ? '' : '.'}`;

export { cap, proseJoin, capFirst, endSentence };
