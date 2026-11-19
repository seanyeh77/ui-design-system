import * as React from 'react';
import { Term } from '../components/Term/Term';

/** A word that gets an explanation wherever it appears (CodeView and Markdown `terms`). */
export interface TermDef {
  /** The word as written, matched whole and case-sensitive: `cookie` does not match `cookies` or `Cookie`. */
  term: string;
  /** Heading of the card. Default: the word. */
  title?: string;
  /** The explanation, at most 2 short sentences; `backticks` are code. */
  text: string;
  /** One link-style action at the bottom of the card, e.g. 「看它出現的地方」. */
  action?: { label: string; onClick: () => void };
}

/** `first` (default): only the first time each word appears in a block (a paragraph, list item or table cell; in
 *  CodeView, the file). `all`: every time. */
export type TermsMark = 'first' | 'all';

export interface TermHit {
  from: number;
  to: number;
  /** Index in terms. */
  i: number;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A Latin letter, digit or _ next to the word makes it part of a longer one; Chinese characters beside it do not.
const WORDY = /^[\p{Script=Latin}\p{N}_]$/u;

/** One pattern for all the words, longest first, so 「cookie jar」 wins over 「cookie」. */
export function termPattern(terms: readonly TermDef[] | undefined): RegExp | null {
  const list = (terms ?? []).filter((t) => t.term);
  if (!list.length) return null;
  const alts = [...list]
    .sort((a, b) => b.term.length - a.term.length)
    .map((t) => {
      const w = [...t.term];
      const pre = WORDY.test(w[0]) ? '(?<![\\p{Script=Latin}\\p{N}_])' : '';
      const post = WORDY.test(w[w.length - 1]) ? '(?![\\p{Script=Latin}\\p{N}_])' : '';
      return pre + esc(t.term) + post;
    });
  return new RegExp(alts.join('|'), 'gu');
}

/** The words in a piece of text. `seen` holds the words already marked in this block; with `first` they are skipped
 *  and the new ones added. */
export function findTerms(text: string, terms: readonly TermDef[], re: RegExp, mark: TermsMark, seen: Set<string>): TermHit[] {
  const out: TermHit[] = [];
  for (const m of text.matchAll(re)) {
    const i = terms.findIndex((t) => t.term === m[0]);
    if (i < 0) continue;
    if (mark === 'first') {
      if (seen.has(m[0])) continue;
      seen.add(m[0]);
    }
    out.push({ from: m.index, to: m.index + m[0].length, i });
  }
  return out;
}

/** The word as an inline Term. */
export function termNode(t: TermDef, key: React.Key, children?: React.ReactNode, extra?: { className?: string; tabIndex?: number; openOnFocus?: boolean }) {
  return (
    <Term key={key} variant="inline" title={t.title} text={t.text} action={t.action} {...extra}>
      {children ?? t.term}
    </Term>
  );
}

/** Text with its words as inline Terms; `rest` renders the text between them. */
export function withTerms(
  text: string,
  hits: readonly TermHit[],
  terms: readonly TermDef[],
  key: () => string,
  rest: (s: string) => React.ReactNode = (s) => s,
  extra?: { className?: string; tabIndex?: number; openOnFocus?: boolean },
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let at = 0;
  for (const h of hits) {
    if (h.from > at) out.push(<React.Fragment key={key()}>{rest(text.slice(at, h.from))}</React.Fragment>);
    out.push(termNode(terms[h.i], key(), text.slice(h.from, h.to), extra));
    at = h.to;
  }
  if (at < text.length) out.push(<React.Fragment key={key()}>{rest(text.slice(at))}</React.Fragment>);
  return out;
}
