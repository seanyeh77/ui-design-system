import * as React from 'react';
import { PreviewCard } from '@base-ui/react/preview-card';
import { InlineCode, type OnRef, type RefHref } from '../InlineCode/InlineCode';
import { announce } from '../../announce';
import { tr } from '../../i18n';
import { copyText, cx, monoNums, useNarrow } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { CHECK } from '../../icons/Icon';
import { IconButton } from '../IconButton/IconButton';
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

/** A name in the code that is a link, e.g. a call to a function defined elsewhere. */
export interface CodeLink {
  /** Line number, counted from `start` like `target`. */
  line: number;
  /** The name exactly as it is in the code, e.g. `runtime.deploy`: the whole dotted name, never only its last part. */
  text: string;
  /** Column where `text` starts, from 1, in characters (Unicode code points). Without it, the first whole `text` on the
   *  line. Convert byte or UTF-16 offsets before passing them. */
  col?: number;
  /** Where the link goes. Ctrl or ⌘ + click (or Enter) follows it when there is no `onLink`; Shift + click and the
   *  middle button open it in a new tab or window. */
  href?: string;
  /** Read by screen readers instead of the name, and the native tooltip when there is no `preview`, e.g.
   *  「runtime.deploy，定義在 harness/runtime.py:591」. */
  label?: string;
}

export interface CodeViewProps<L extends CodeLink = CodeLink> {
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
  /** Names in the code that are links. Dotted underline; Ctrl or ⌘ + click opens one (a plain click only selects
   *  text; on touch screens a tap opens it). With links the code is one Tab stop: ↑ ↓ move by line, ← → between
   *  links, Enter opens, Esc goes back to the line. A link that does not match the code is left out, with a
   *  warning in development. */
  links?: readonly L[];
  /** Opening a link (Ctrl or ⌘ + click, a tap, or Enter), with the same object you passed in `links`. The default
   *  navigation is prevented. */
  onLink?: (link: L, e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void;
  /** A small card under a link after the pointer or the keyboard focus rests on it for 500 ms, e.g. the name, where it
   *  is defined and the first line of its doc comment. */
  preview?: (link: L) => React.ReactNode;
  /** Scrolls inside the box and keeps the target in view, e.g. '420px'. */
  maxHeight?: string;
  /** Where sections start, e.g. each function: [ and ] jump to the previous and next one (CB), and the section's
   *  name is read out with its line. Lines count from start, like target. */
  sections?: { line: number; label: string }[];
  /** false: no line numbers, for short snippets nobody refers to by line (Markdown code blocks). Screen readers still
   *  hear 「第 n 行」. Default true. */
  lineNumbers?: boolean;
  /** A small copy icon at the right of the header: copies the whole code and turns into a check for 2 s. Shows the
   *  header even without file or title. Default false. */
  copy?: boolean;
  /** Called after copying, with the text. */
  onCopy?: (text: string) => void;
  /** Copying failed (the browser does not allow the clipboard): say so, for example in a Toast. */
  onCopyError?: () => void;
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
function withPaths(text: string, refHref: RefHref | undefined, onRef: OnRef | undefined, tab?: number): React.ReactNode {
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
        <a key={m.index} className="ui-cv-ref" href={href} onClick={click} tabIndex={tab}>
          {v}
        </a>
      ) : (
        <button key={m.index} type="button" className="ui-cv-ref" onClick={click} tabIndex={tab}>
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

interface Hit {
  from: number;
  to: number;
  /** Index in links. */
  i: number;
}

const NAME_CHAR = /[\p{L}\p{N}_$]/u;

/** UTF-16 index of a 1-based column counted in code points; -1 past the end. */
function colIndex(s: string, col: number): number {
  let i = 0;
  for (let c = 1; c < col; c++) {
    if (i >= s.length) return -1;
    i += (s.codePointAt(i) ?? 0) > 0xffff ? 2 : 1;
  }
  return i;
}

/** The first whole `text` on the line: not inside a longer name, and not the tail of a dotted one (x.runtime.deploy). */
function findName(s: string, text: string): number {
  for (let i = s.indexOf(text); i >= 0; i = s.indexOf(text, i + 1)) {
    const before = s[i - 1] ?? '';
    const after = s[i + text.length] ?? '';
    if (!NAME_CHAR.test(before) && before !== '.' && !NAME_CHAR.test(after)) return i;
  }
  return -1;
}

/** Each line's links, sorted, without overlaps; what does not match is left out with a development warning. */
function matchLinks(lines: string[], start: number, links: readonly CodeLink[] | undefined): Map<number, Hit[]> {
  const out = new Map<number, Hit[]>();
  links?.forEach((l, i) => {
    const s = lines[l.line - start];
    if (s == null) {
      devWarn(true, 'CodeView', `第 ${l.line} 行不在程式碼裡，連結「${l.text}」沒有加上。line 和 target 一樣從 start（${start}）算起。`);
      return;
    }
    let from = -1;
    if (l.col != null) {
      const at = colIndex(s, l.col);
      if (at >= 0 && s.startsWith(l.text, at)) from = at;
      else devWarn(true, 'CodeView', `第 ${l.line} 行第 ${l.col} 欄不是「${l.text}」，連結沒有加上。col 從 1 開始、以字元計；位元組或 UTF-16 位置要先換算。`);
    } else {
      from = findName(s, l.text);
      devWarn(from < 0, 'CodeView', `第 ${l.line} 行找不到完整的「${l.text}」，連結沒有加上。text 要和程式碼一字不差（整個帶點的名稱），或給 col。`);
    }
    if (from < 0) return;
    const hit = { from, to: from + l.text.length, i };
    const list = out.get(l.line) ?? [];
    if (list.some((h) => h.from < hit.to && hit.from < h.to)) {
      devWarn(true, 'CodeView', `第 ${l.line} 行的「${l.text}」和另一個連結重疊，沒有加上。同一行出現兩次的名稱，第二個要給 col。`);
      return;
    }
    list.push(hit);
    out.set(l.line, list);
  });
  for (const list of out.values()) list.sort((a, b) => a.from - b.from);
  return out;
}

/** Source with line numbers and an optional target line: soft accent background, long lines wrap, light syntax colors. */
export function CodeView<L extends CodeLink = CodeLink>({
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
  links,
  onLink,
  preview,
  maxHeight,
  sections,
  copy,
  lineNumbers = true,
  onCopy,
  onCopyError,
  className,
  ref,
}: CodeViewProps<L>) {
  const lines = React.useMemo(
    () =>
      String(code || '')
        .replace(/\n$/, '')
        .split('\n'),
    [code],
  );
  const lang = language || languageOf(file);
  const toks = React.useMemo(() => (highlight ? tokenizer(lines, lang) : lines.map((l) => [['', l] as const])), [lines, lang, highlight, tokenizer]);
  const hits = React.useMemo(() => matchLinks(lines, start, links), [lines, start, links]);
  const nav = hits.size > 0;
  const [armed, setArmed] = React.useState(false);
  const inside = React.useRef(false);
  // Ctrl or ⌘ held while the pointer is over the code: the names turn into clickable links (A2).
  React.useEffect(() => {
    if (!nav) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setArmed(e.type === 'keydown' && inside.current);
    };
    const off = () => setArmed(false);
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', key);
    window.addEventListener('blur', off);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('keyup', key);
      window.removeEventListener('blur', off);
    };
  }, [nav]);
  const [pv, setPv] = React.useState<{ i: number; el: HTMLElement } | null>(null);
  const pvId = React.useId();
  const showTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(
    () => () => {
      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
    },
    [],
  );
  const pvSoon = (el: HTMLElement) => {
    if (!preview) return;
    clearTimeout(hideTimer.current);
    clearTimeout(showTimer.current);
    if (pv?.el === el) return;
    showTimer.current = setTimeout(() => setPv({ i: Number(el.dataset.link), el }), 500);
  };
  const pvLater = () => {
    clearTimeout(showTimer.current);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setPv(null), 200);
  };
  const pvKeep = () => clearTimeout(hideTimer.current);
  const linkEl = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>('.ui-cv-name') : null);
  const open = (el: HTMLElement, e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
    const link = links?.[Number(el.dataset.link)];
    if (!link) return;
    clearTimeout(showTimer.current);
    setPv(null);
    if (onLink) onLink(link, e);
    else if (link.href) window.location.assign(link.href);
  };
  const onLinkClick = (e: React.MouseEvent<HTMLPreElement>) => {
    const el = linkEl(e.target);
    if (!el) return;
    const href = links?.[Number(el.dataset.link)]?.href;
    if (e.shiftKey && href) return; // the browser opens it in a new window
    e.preventDefault();
    const type = (e.nativeEvent as PointerEvent).pointerType;
    // Enter (detail 0), a tap, or Ctrl / ⌘ + click opens; a plain click only selects text.
    if (e.detail === 0 || type === 'touch' || type === 'pen' || e.ctrlKey || e.metaKey) open(el, e);
  };
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
  const piece = (cls: string, text: string, key: string, inLink: boolean) =>
    cls ? (
      <span key={key} className={cls}>
        {!inLink && (refHref || onRef) && (cls === 'is-comment' || cls === 'is-string')
          ? withPaths(text, refHref, onRef, nav ? -1 : undefined)
          : breakable(text)}
      </span>
    ) : (
      <React.Fragment key={key}>{breakable(text)}</React.Fragment>
    );
  const nameLink = (hit: Hit, kids: React.ReactNode[]) => {
    const link = links?.[hit.i];
    if (!link) return null;
    return (
      <a
        key={'n' + hit.i}
        className="ui-cv-name"
        href={link.href}
        role={link.href ? undefined : 'link'}
        tabIndex={-1}
        draggable={false}
        data-link={hit.i}
        aria-label={link.label}
        aria-describedby={pv?.i === hit.i ? pvId : undefined}
        title={preview ? undefined : link.label}
      >
        {kids}
      </a>
    );
  };
  // A line's tokens, cut where links start and end; the pieces inside a link go into its <a>.
  const lineContent = (line: readonly (readonly [string, string])[], lineHits: Hit[] | undefined) => {
    if (!lineHits) return line.map(([cls, text], j) => piece(cls, text, String(j), false));
    const out: React.ReactNode[] = [];
    let group: React.ReactNode[] = [];
    let open: Hit | null = null;
    const flush = () => {
      if (open) out.push(nameLink(open, group));
      open = null;
      group = [];
    };
    let pos = 0;
    let h = 0;
    line.forEach(([cls, text], j) => {
      let k = 0;
      while (k < text.length) {
        const at = pos + k;
        while (h < lineHits.length && lineHits[h].to <= at) h++;
        const next = lineHits[h];
        const hit = next && next.from <= at ? next : null;
        const end = Math.min(pos + text.length, hit ? hit.to : next ? next.from : Infinity);
        const key = j + '.' + k;
        if (hit) {
          if (open !== hit) {
            flush();
            open = hit;
          }
          group.push(piece(cls, text.slice(k, end - pos), key, true));
        } else {
          flush();
          out.push(piece(cls, text.slice(k, end - pos), key, false));
        }
        k = end - pos;
      }
      pos += text.length;
    });
    flush();
    return out;
  };
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
        data-n={n}
        aria-current={on && n === ta ? 'location' : undefined}
        tabIndex={on && n === ta ? -1 : undefined}
      >
        {lineNumbers ? (
          // VA: 12 px before the number, 16 px between it and the code.
          <span className="ui-cv-num" style={{ width: `calc(${digits}ch + 28px)` }} aria-hidden="true">
            {n}
          </span>
        ) : null}
        <span className="ui-cv-text">
          <span className="ui-visually-hidden ui-cv-sr">{tr('第 {n} 行', { n }) + indentText(lines[i]) + tr('：')}</span>
          {lineContent(toks[i], hits.get(n))}
        </span>
      </div>,
    );
  }
  // CA: Home, End, PageUp, PageDown move the focus by line inside the code; CB: [ and ] by section. The focused line
  // is read out (第 62 行 and its text); a section adds its name.
  const keys = [
    ...(nav
      ? [
          { k: 'ArrowUp ArrowDown', label: '↑↓', what: tr('上一行／下一行') },
          { k: 'ArrowLeft ArrowRight', label: '←→', what: tr('上一個／下一個連結') },
          { k: 'Enter', label: 'Enter', what: tr('開啟') },
          { k: 'Escape', label: 'Esc', what: tr('回到這一行') },
        ]
      : []),
    { k: 'Home', label: 'Home', what: tr('第一行') },
    { k: 'End', label: 'End', what: tr('最後一行') },
    { k: 'PageUp', label: 'PgUp', what: tr('上 20 行') },
    { k: 'PageDown', label: 'PgDn', what: tr('下 20 行') },
    ...(sections?.length
      ? [
          { k: '[', label: '[', what: tr('上一段') },
          { k: ']', label: ']', what: tr('下一段') },
        ]
      : []),
  ];
  const onMove = (e: React.KeyboardEvent<HTMLPreElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const pre = e.currentTarget;
    const items = [...pre.querySelectorAll<HTMLElement>('[role="listitem"]')];
    if (!items.length) return;
    const nOf = (el: HTMLElement) => Number(el.dataset.n);
    const act = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const curLine = act && act !== pre ? act.closest<HTMLElement>('[role="listitem"]') : null;
    const at = curLine ? items.indexOf(curLine) : -1;
    const now = at < 0 ? -1 : at;
    const focusLine = (el: HTMLElement | undefined) => {
      if (!el) return;
      el.tabIndex = -1;
      el.focus();
    };
    if (nav) {
      const stops = [...pre.querySelectorAll<HTMLElement>('.ui-cv-name, .ui-cv-ref')];
      const onStop = act ? stops.indexOf(act) : -1;
      if (e.key === 'Escape') {
        if (pv) setPv(null);
        else if (onStop >= 0) focusLine(curLine ?? undefined);
        else if (curLine) pre.focus();
        else return;
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter' && act && onStop >= 0 && act.classList.contains('ui-cv-name') && !act.hasAttribute('href')) {
        e.preventDefault();
        open(act, e);
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (now < 0) focusLine(items.find((el) => el.classList.contains('is-target')) ?? items[0]);
        else focusLine(items[Math.max(0, Math.min(items.length - 1, now + (e.key === 'ArrowDown' ? 1 : -1)))]);
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const fwd = e.key === 'ArrowRight';
        let to: HTMLElement | undefined;
        if (onStop >= 0) to = stops[onStop + (fwd ? 1 : -1)];
        else {
          const n = curLine ? nOf(curLine) : (ta ?? nOf(items[0]));
          const lineOf = (el: HTMLElement) => Number(el.closest<HTMLElement>('[role="listitem"]')?.dataset.n);
          to = fwd ? stops.find((el) => lineOf(el) >= n) : stops.filter((el) => lineOf(el) <= n).pop();
        }
        to?.focus();
        return;
      }
    }
    let to = -1;
    let said = '';
    if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = items.length - 1;
    else if (e.key === 'PageDown') to = Math.min(items.length - 1, Math.max(0, now) + 20);
    else if (e.key === 'PageUp') to = Math.max(0, now - 20);
    else if ((e.key === '[' || e.key === ']') && sections?.length) {
      const cur = now < 0 ? (e.key === ']' ? -Infinity : Infinity) : nOf(items[now]);
      const sorted = [...sections].sort((a, b) => a.line - b.line);
      const s = e.key === ']' ? sorted.find((x) => x.line > cur) : [...sorted].reverse().find((x) => x.line < cur);
      if (s) {
        to = items.findIndex((el) => nOf(el) >= s.line);
        said = s.label;
      }
    } else return;
    e.preventDefault();
    const el = items[to];
    if (!el) return;
    el.tabIndex = -1;
    el.focus();
    if (said) announce(tr('{name}，第 {n} 行', { name: said, n: nOf(el) }));
  };
  const [copied, setCopied] = React.useState(false);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(copyTimer.current), []);
  const doCopy = () => {
    copyText(code).then(
      () => {
        setCopied(true);
        announce(tr('已複製'));
        clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopied(false), 2000);
        onCopy?.(code);
      },
      () => onCopyError?.(),
    );
  };
  const head =
    file || title || copy ? (
      <div className="ui-cv-head">
        {file ? (
          fileHref || onFile ? (
            <InlineCode href={fileHref} onClick={onFile} className="ui-cv-file">
              {file}
            </InlineCode>
          ) : (
            <span className="ui-cv-file">{file}</span>
          )
        ) : title ? (
          <span className="ui-cv-title">{title}</span>
        ) : null}
        {languageLabel !== false && lang !== 'plain' ? (
          // Plain text, not a control: the screen reader hears 「程式語言：C 語言」.
          <span className="ui-cv-lang">
            <span className="ui-visually-hidden">{tr('程式語言') + tr('：')}</span>
            {tr(languageLabel || LANGUAGE_NAMES[lang] || lang)}
          </span>
        ) : null}
        {copy ? (
          <IconButton
            className={cx('ui-cv-copy', copied && 'is-copied')}
            label={copied ? tr('已複製') : tr('複製程式碼')}
            icon={copied ? CHECK : 'copy'}
            onClick={doCopy}
          />
        ) : null}
      </div>
    ) : null;
  return (
    <div className={cx('ui-cv', !lineNumbers && 'no-nums', className)} role="region" aria-label={file || title || tr('原始碼')}>
      {head}
      <pre
        ref={body}
        style={maxHeight ? { maxHeight } : undefined}
        tabIndex={0}
        aria-label={tr('程式碼')}
        aria-keyshortcuts={keys.map((k) => k.k).join(' ')}
        onKeyDown={onMove}
        {...(nav
          ? {
              onClick: onLinkClick,
              onPointerEnter: () => (inside.current = true),
              onPointerLeave: () => {
                inside.current = false;
                setArmed(false);
              },
              onPointerMove: (e: React.PointerEvent) => {
                const held = e.ctrlKey || e.metaKey;
                if (held !== armed) setArmed(held);
              },
              onPointerOver: (e: React.PointerEvent) => {
                const el = linkEl(e.target);
                if (el && e.pointerType === 'mouse') pvSoon(el);
              },
              onPointerOut: (e: React.PointerEvent) => {
                const el = linkEl(e.target);
                if (el && !el.contains(e.relatedTarget as Node | null)) pvLater();
              },
              onFocus: (e: React.FocusEvent) => {
                const el = linkEl(e.target);
                if (el && el.matches(':focus-visible')) pvSoon(el);
              },
              onBlur: (e: React.FocusEvent) => {
                if (linkEl(e.target)) pvLater();
              },
            }
          : null)}
        className={cx('ui-cv-body', armed && 'is-armed')}
      >
        <code role="list">{rows}</code>
      </pre>
      {preview && pv && links?.[pv.i] ? (
        <PreviewCard.Root open onOpenChange={(o) => (o ? undefined : setPv(null))}>
          <PreviewCard.Portal>
            <PreviewCard.Positioner anchor={pv.el} side="bottom" align="start" sideOffset={6} className="ui-float">
              <PreviewCard.Popup id={pvId} className="ui-popover ui-cv-preview" onPointerEnter={pvKeep} onPointerLeave={pvLater}>
                {preview(links[pv.i])}
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>
      ) : null}
      {/* What the keys do, while the code has focus; a screen reader gets them from aria-keyshortcuts. */}
      <div className="ui-cv-keys" aria-hidden="true">
        {keys.map((k) => (
          <span key={k.k}>
            <kbd>{k.label}</kbd>
            {k.what}
          </span>
        ))}
      </div>
      {narrow && canWindow ? (
        <button type="button" className="ui-link-btn ui-cv-more" onClick={() => setAll(!all)}>
          <span>{all ? tr('只顯示第 {n} 行前後', { n: ta }) : monoNums(tr('顯示全部 {n} 行', { n: '\u0001' }), [lines.length])}</span>
        </button>
      ) : null}
    </div>
  );
}
