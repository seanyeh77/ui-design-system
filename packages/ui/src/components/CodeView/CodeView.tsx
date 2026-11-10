import * as React from 'react';
import { InlineCode, type OnRef, type RefHref } from '../InlineCode/InlineCode';
import { tr } from '../../i18n';
import { cx, monoNums, useNarrow } from '../../internal/util';
import { LANGUAGE_NAMES, languageOf, tokenize as builtIn, type Tokenizer } from './tokens';

/** A line's indentation, said after its number: a screen reader drops leading spaces, and in Python or YAML
 * the indentation is the structure (which `if` a line belongs to). Tabs and spaces are said apart. */
function indentText(line: string): string {
  const lead = /^[ \t]*/.exec(line)?.[0] ?? '';
  if (!lead || lead.length === line.length) return '';
  const tabs = lead.split('\t').length - 1;
  const spaces = lead.length - tabs;
  return (
    tr('，') +
    (tabs && spaces ? tr('縮排 {a} 個 tab、{b} 格', { a: tabs, b: spaces }) : tabs ? tr('縮排 {n} 個 tab', { n: tabs }) : tr('縮排 {n} 格', { n: spaces }))
  );
}

export interface CodeViewProps {
  /** The source text. */
  code: string;
  /** Number of the first line. Default 1. */
  start?: number;
  /** A line or [from, to] to mark. On phones only these lines and `context` lines either side show at first. */
  target?: number | [number, number];
  /** Lines shown either side of the target on phones. Default 2. */
  context?: number;
  /** Path in the header; its extension picks the language. */
  file?: string;
  fileHref?: string;
  onFile?: (e: React.MouseEvent<HTMLElement>) => void;
  /** Header text when there is no file. */
  title?: string;
  /** 'c' | 'js' | 'py' | 'sh' | 'plain', or any language your tokenizer knows. Default: from the file extension. */
  language?: string;
  /** The language, as plain muted text at the right of the header (C is 「C 語言」); false hides it. */
  languageLabel?: string | false;
  /** false: no syntax colors. */
  highlight?: boolean;
  /** Replaces the built-in highlighter, e.g. one built on Shiki that returns the same token classes. */
  tokenizer?: Tokenizer;
  /** Paths in comments and strings (docs/design/ring.md, src/app.c:86) become links: the link of a path, or undefined
   *  for none. Same as CodeText's refHref. */
  refHref?: RefHref;
  /** A plain click on a path in the code (the default navigation is prevented); with refHref, Ctrl, ⌘ or Shift still
   *  opens the link. */
  onRef?: OnRef;
  /** Scrolls inside the box and keeps the target in view, e.g. '420px'. */
  maxHeight?: string;
  className?: string;
  /** focusTarget() moves keyboard and screen-reader focus to the target line. */
  ref?: React.Ref<CodeViewHandle>;
}

export interface CodeViewHandle {
  /** Focuses the first target line (scrolled into view); nothing happens without a target. */
  focusTarget: () => void;
}

// Where a long line may wrap: after these, never inside them. Multi-character operators stay whole.
const OPS = /(->|::|==|!=|<=|>=|&&|\|\||\+\+|--|<<|>>|=>|\+=|-=|\*=|\/=)/;
const AFTER = /([,.([{;])/;

/** A piece of code with soft break points after commas, dots and opening brackets, and operators kept together. */
// A path in a comment or a string: folders and a file with an extension (docs/design/ring.md), or a file and line
// (app.c:86, src/app.c:86-90). A bare word with a dot (printf.h, v1.2) is not one.
const PATH_IN_CODE = /(?<![\w./-])((?:\.{1,2}\/)?(?:[\w.-]+\/)+[\w.-]+\.[A-Za-z0-9]+(?::\d+(?:-\d+)?)?|[\w.-]+\.[A-Za-z0-9]+:\d+(?:-\d+)?)(?![\w/])/g;

/** The paths in a comment or string as links (refHref, onRef); the rest stays text. */
function withPaths(text: string, refHref: RefHref | undefined, onRef: OnRef | undefined): React.ReactNode {
  const out: React.ReactNode[] = [];
  let at = 0;
  for (const m of text.matchAll(PATH_IN_CODE)) {
    const v = m[1];
    const href = refHref ? refHref(v) || undefined : undefined;
    if (refHref ? !href : !onRef) continue;
    if (m.index > at) out.push(breakable(text.slice(at, m.index)));
    const click = onRef
      ? (e: React.MouseEvent<HTMLElement>) => {
          if (href && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return;
          e.preventDefault();
          onRef(v, e);
        }
      : undefined;
    // A link when it has an address; else a button, so the keyboard reaches it too.
    out.push(
      href ? (
        <a key={m.index} className="ui-cv-ref" href={href} onClick={click}>
          {v}
        </a>
      ) : (
        <button key={m.index} type="button" className="ui-cv-ref" onClick={click}>
          {v}
        </button>
      ),
    );
    at = m.index + v.length;
  }
  if (!out.length) return breakable(text);
  if (at < text.length) out.push(breakable(text.slice(at)));
  return out;
}

function breakable(text: string): React.ReactNode {
  if (!OPS.test(text) && !AFTER.test(text)) return text;
  const out: React.ReactNode[] = [];
  text.split(OPS).forEach((part, i) => {
    if (!part) return;
    if (i % 2) {
      out.push(
        <span key={i} className="ui-cv-op">
          {part}
        </span>,
        <wbr key={i + 'w'} />,
      );
      return;
    }
    part.split(AFTER).forEach((bit, k) => {
      if (!bit) return;
      out.push(bit);
      if (k % 2) out.push(<wbr key={i + '.' + k} />);
    });
  });
  return out;
}

/** Source with line numbers and an optional target line: soft accent background, long lines wrap, light syntax colors. */
export function CodeView({
  code,
  start = 1,
  target,
  context = 2,
  file,
  fileHref,
  onFile,
  title,
  language,
  languageLabel,
  highlight = true,
  tokenizer = builtIn,
  refHref,
  onRef,
  maxHeight,
  className,
  ref,
}: CodeViewProps) {
  const lines = React.useMemo(
    () =>
      String(code || '')
        .replace(/\n$/, '')
        .split('\n'),
    [code],
  );
  const lang = language || languageOf(file);
  const toks = React.useMemo(() => (highlight ? tokenizer(lines, lang) : lines.map((l) => [['', l] as const])), [lines, lang, highlight, tokenizer]);
  const [ta, tb] = target == null ? [null, null] : Array.isArray(target) ? target : [target, target];
  const narrow = useNarrow();
  const [all, setAll] = React.useState(false);
  const [shownFor, setShownFor] = React.useState({ code, ta, tb });
  if (shownFor.code !== code || shownFor.ta !== ta || shownFor.tb !== tb) {
    setShownFor({ code, ta, tb });
    setAll(false);
  }
  const canWindow = ta != null && tb != null && lines.length > tb - ta + 1 + context * 2;
  const windowed = narrow && canWindow && !all;
  const from = windowed ? Math.max(0, ta - start - context) : 0;
  const to = windowed ? Math.min(lines.length, tb - start + context + 1) : lines.length;
  const body = React.useRef<HTMLPreElement>(null);
  React.useImperativeHandle(ref, () => ({
    focusTarget: () => body.current?.querySelector<HTMLElement>('.is-target')?.focus(),
  }));
  React.useEffect(() => {
    const b = body.current;
    const el = b?.querySelector<HTMLElement>('.is-target');
    if (b && el && b.scrollHeight > b.clientHeight)
      b.scrollTop += el.getBoundingClientRect().top - b.getBoundingClientRect().top - b.clientHeight / 2 + el.offsetHeight / 2;
  }, [ta, code]);
  const digits = String(start + lines.length - 1).length;
  const rows: React.ReactNode[] = [];
  for (let i = from; i < to; i++) {
    const n = start + i;
    const on = ta != null && tb != null && n >= ta && n <= tb;
    rows.push(
      // One list item per line, so a screen reader moves line by line; 「第 62 行」 is said, not shown or copied.
      <div
        key={i}
        role="listitem"
        className={cx('ui-cv-line', on && 'is-target')}
        aria-current={on && n === ta ? 'location' : undefined}
        tabIndex={on && n === ta ? -1 : undefined}
      >
        <span className="ui-cv-num" style={{ width: digits + 2 + 'ch' }} aria-hidden="true">
          {n}
        </span>
        <span className="ui-cv-text">
          <span className="ui-visually-hidden ui-cv-sr">{tr('第 {n} 行', { n }) + indentText(lines[i]) + tr('：')}</span>
          {toks[i].map(([cls, text], j) =>
            cls ? (
              <span key={j} className={cls}>
                {(refHref || onRef) && (cls === 'is-comment' || cls === 'is-string') ? withPaths(text, refHref, onRef) : breakable(text)}
              </span>
            ) : (
              <React.Fragment key={j}>{breakable(text)}</React.Fragment>
            ),
          )}
        </span>
      </div>,
    );
  }
  const head =
    file || title ? (
      <div className="ui-cv-head">
        {file ? (
          fileHref || onFile ? (
            <InlineCode href={fileHref} onClick={onFile} className="ui-cv-file">
              {file}
            </InlineCode>
          ) : (
            <span className="ui-cv-file">{file}</span>
          )
        ) : (
          <span className="ui-cv-title">{title}</span>
        )}
        {languageLabel !== false && lang !== 'plain' ? (
          // Plain text, not a control: the screen reader hears 「程式語言：C 語言」.
          <span className="ui-cv-lang">
            <span className="ui-visually-hidden">{tr('程式語言') + tr('：')}</span>
            {tr(languageLabel || LANGUAGE_NAMES[lang] || lang)}
          </span>
        ) : null}
      </div>
    ) : null;
  return (
    <div className={cx('ui-cv', className)} role="region" aria-label={file || title || tr('原始碼')}>
      {head}
      <pre ref={body} className="ui-cv-body" style={maxHeight ? { maxHeight } : undefined} tabIndex={0} aria-label={tr('程式碼')}>
        <code role="list">{rows}</code>
      </pre>
      {narrow && canWindow ? (
        <button type="button" className="ui-link-btn ui-cv-more" onClick={() => setAll(!all)}>
          <span>{all ? tr('只顯示第 {n} 行前後', { n: ta }) : monoNums(tr('顯示全部 {n} 行', { n: '\u0001' }), [lines.length])}</span>
        </button>
      ) : null}
    </div>
  );
}
