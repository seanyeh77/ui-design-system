/** One piece of a text with `backtick` spans: plain text, or the code between a pair of backticks (without them). */
export interface CodeSpan {
  code: boolean;
  text: string;
}

const PAIR = /(`[^`]+`)/;

/** Cuts a text written as in Markdown into plain and code pieces. Only a pair of backticks around at least one character
 *  is code; a lone backtick stays in the text. Shared by CodeText, the sentence props that take a string and LayerGraph
 *  labels, so every component reads backticks the same way. */
export function codeSpans(text: string | null | undefined): CodeSpan[] {
  // split with a capture group: the pieces at odd indexes are the matched pairs.
  return String(text ?? '')
    .split(PAIR)
    .map((t, i) => (i % 2 ? { code: true, text: t.slice(1, -1) } : { code: false, text: t }))
    .filter((s) => s.text !== '');
}

/** True when the text has at least one `code` span. */
export const hasCodeSpan = (text: string | null | undefined): boolean => !!text && PAIR.test(text);
