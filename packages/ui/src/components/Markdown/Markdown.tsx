import * as React from 'react';
import { Alert, type AlertTone } from '../Alert/Alert';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { CodeView } from '../CodeView/CodeView';
import { languageOf } from '../CodeView/tokens';
import { InlineCode, type OnRef, type RefHref } from '../InlineCode/InlineCode';

/* A small Markdown reader for project documents and code comments. It builds React elements only: no HTML from the
   source is ever run. HTML tags are dropped and their text kept (MX). */

type Block =
  | { t: 'h'; level: number; text: string }
  | { t: 'p'; text: string }
  | { t: 'code'; lang: string; code: string }
  | { t: 'quote'; blocks: Block[] }
  | { t: 'list'; ordered: boolean; start: number; items: Block[][] }
  | { t: 'table'; head: string[]; align: ('left' | 'right' | 'center' | null)[]; rows: string[][] }
  | { t: 'hr' }
  | { t: 'details'; summary: string; blocks: Block[] }
  | { t: 'alert'; tone: AlertTone; blocks: Block[] };

// DA: <details> and <summary> are the only HTML let through, without attributes; they make a closed block.
const DETAILS_OPEN = /^\s*<details\b[^>]*>/i;
const DETAILS_TAG = /<(\/?)details\b[^>]*>/gi;
const SUMMARY = /<summary\b[^>]*>([\s\S]*?)<\/summary>/i;
// NB: GitHub's alerts, > [!NOTE] and the like, shown as the system's Alert.
const ALERT = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i;
const ALERT_TONE: Record<string, AlertTone> = { NOTE: 'info', TIP: 'success', IMPORTANT: 'info', WARNING: 'warning', CAUTION: 'danger' };

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([\w+#.-]*)/;
const HEADING = /^ {0,3}(#{1,6})(?:\s+(.*?))?\s*#*\s*$/;
const HR = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const ITEM = /^( {0,3})([-*+]|\d{1,9}[.)])(\s+|$)(.*)$/;
const QUOTE = /^ {0,3}> ?(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/;

function cells(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const out: string[] = [];
  let cur = '';
  let code = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && s[i + 1] === '|') {
      cur += '|';
      i++;
    } else if (c === '`') {
      code = !code;
      cur += c;
    } else if (c === '|' && !code) {
      out.push(cur.trim());
      cur = '';
    } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

const blank = (l: string) => !l.trim();
const startsBlock = (l: string) => FENCE.test(l) || HEADING.test(l) || HR.test(l) || QUOTE.test(l) || ITEM.test(l);

function parse(lines: string[]): Block[] {
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (blank(line)) {
      i++;
      continue;
    }
    if (DETAILS_OPEN.test(line)) {
      // The matching </details>, counting nested ones; what follows it on the line goes on as more Markdown.
      const rest = lines.slice(i).join('\n');
      DETAILS_TAG.lastIndex = 0;
      let depth = 0;
      let open = -1;
      let close = rest.length;
      let after = rest.length;
      for (let m = DETAILS_TAG.exec(rest); m; m = DETAILS_TAG.exec(rest)) {
        if (!m[1]) {
          if (depth++ === 0) open = m.index + m[0].length;
        } else if (--depth === 0) {
          close = m.index;
          after = m.index + m[0].length;
          break;
        }
      }
      let inner = rest.slice(open, close);
      const sum = SUMMARY.exec(inner);
      if (sum) inner = inner.slice(0, sum.index) + inner.slice(sum.index + sum[0].length);
      out.push({ t: 'details', summary: (sum?.[1] ?? '').trim(), blocks: parse(inner.split('\n')) });
      return out.concat(parse(rest.slice(after).split('\n')));
    }
    const fence = FENCE.exec(line);
    if (fence) {
      const mark = fence[1];
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(mark)) body.push(lines[i++]);
      i++;
      out.push({ t: 'code', lang: fence[2].toLowerCase(), code: body.join('\n') });
      continue;
    }
    const h = HEADING.exec(line);
    if (h) {
      out.push({ t: 'h', level: h[1].length, text: h[2] ?? '' });
      i++;
      continue;
    }
    if (HR.test(line)) {
      out.push({ t: 'hr' });
      i++;
      continue;
    }
    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && !blank(lines[i]) && (QUOTE.test(lines[i]) || !startsBlock(lines[i]))) {
        body.push(QUOTE.exec(lines[i])?.[1] ?? lines[i]);
        i++;
      }
      const alert = body.length > 0 ? ALERT.exec(body[0]) : null;
      if (alert) out.push({ t: 'alert', tone: ALERT_TONE[alert[1].toUpperCase()], blocks: parse(body.slice(1)) });
      else out.push({ t: 'quote', blocks: parse(body) });
      continue;
    }
    const item = ITEM.exec(line);
    if (item) {
      const ordered = /\d/.test(item[2]);
      const start = ordered ? parseInt(item[2], 10) : 1;
      const items: Block[][] = [];
      while (i < lines.length) {
        const m = ITEM.exec(lines[i]);
        if (!m || /\d/.test(m[2]) !== ordered) break;
        const indent = m[1].length + m[2].length + Math.max(1, Math.min(m[3].length, 4));
        const body = [m[4]];
        i++;
        // The item's own lines: indented continuation (nested lists too), and lazy text right after it.
        while (i < lines.length) {
          const l = lines[i];
          if (blank(l)) {
            const next = lines[i + 1];
            if (next !== undefined && /^\s+/.test(next) && next.search(/\S/) >= indent) {
              body.push('');
              i++;
              continue;
            }
            break;
          }
          const lead = l.search(/\S/);
          if (lead >= indent || (lead >= 2 && ITEM.test(l.trimStart()))) body.push(l.slice(Math.min(lead, indent)));
          else if (!startsBlock(l) && !ITEM.test(l)) body.push(l);
          else break;
          i++;
        }
        items.push(parse(body));
        if (i < lines.length && blank(lines[i])) {
          const next = lines[i + 1];
          if (next !== undefined && ITEM.test(next) && /\d/.test(ITEM.exec(next)?.[2] ?? '') === ordered) {
            i++;
            continue;
          }
          break;
        }
      }
      out.push({ t: 'list', ordered, start, items });
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      const head = cells(line);
      const align = cells(lines[i + 1]).map((c) =>
        c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : c.startsWith(':') ? 'left' : null,
      );
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && !blank(lines[i]) && lines[i].includes('|')) rows.push(cells(lines[i++]));
      out.push({ t: 'table', head, align, rows });
      continue;
    }
    // A paragraph: lines until a blank line or another block.
    const body = [line];
    i++;
    while (i < lines.length && !blank(lines[i]) && !startsBlock(lines[i])) body.push(lines[i++]);
    out.push({ t: 'p', text: body.join('\n') });
  }
  return out;
}

/** Only http, https, mailto and relative addresses are kept; anything else (javascript:, data:) is not a link. */
export function safeHref(href: string): string | undefined {
  const h = href.trim();
  if (!h) return undefined;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(h);
  if (!scheme) return h;
  return ['http', 'https', 'mailto'].includes(scheme[1].toLowerCase()) ? h : undefined;
}

// A path in inline code: folders and a file with an extension, or a file and line (src/app.c:86, docs/a.md).
const PATH = /^(?:\.{1,2}\/)?(?:[\w.-]+\/)*[\w.-]+\.[A-Za-z0-9]+(?::\d+(?:-\d+)?)?$/;
const isPath = (s: string) => PATH.test(s) && (s.includes('/') || /:\d/.test(s));

// Never links, even when listed in schemes.
const BLOCKED = ['javascript', 'data', 'vbscript'];

interface Ctx {
  /** Extra schemes (fn, file) handed to linkHref and onLink as they are. */
  schemes?: string[];
  /** The next key: counted from 0 on every render, so the same source gives the same keys. */
  k: () => string;
  linkHref?: (href: string) => string | undefined | null;
  onLink?: (href: string, e: React.MouseEvent<HTMLElement>) => void;
  refHref?: RefHref;
  onRef?: OnRef;
}

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\u3000-\u303f\uff00-\uffef]/u;

/** Inline Markdown: code spans, links, autolinks, bold, italic, hard breaks; HTML tags dropped, their text kept. */
function inline(src: string, c: Ctx): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let text = '';
  const flush = () => {
    if (text) out.push(text);
    text = '';
  };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\' && i + 1 < src.length && /[\\`*_{}[\]()#+\-.!|<>~]/.test(src[i + 1])) {
      text += src[i + 1];
      i += 2;
      continue;
    }
    if (ch === '\\' && src[i + 1] === '\n') {
      flush();
      out.push(<br key={c.k()} />);
      i += 2;
      continue;
    }
    if (ch === '\n') {
      // Two spaces before a line break make a break; otherwise it is a space.
      if (/ {2,}$/.test(text)) {
        text = text.replace(/ +$/, '');
        flush();
        out.push(<br key={c.k()} />);
      } else {
        // Lines joined: a space between words, none next to Chinese text or full-width punctuation.
        text = text.replace(/ +$/, '');
        const before = text.at(-1) ?? (typeof out.at(-1) === 'string' ? String(out.at(-1)).at(-1) : '');
        const after = src.slice(i + 1).trimStart()[0] ?? '';
        if (!CJK.test(before ?? '') && !CJK.test(after)) text += ' ';
        while (src[i + 1] === ' ') i++;
      }
      i++;
      continue;
    }
    if (ch === '`') {
      const run = /^`+/.exec(src.slice(i))?.[0] ?? '`';
      const end = src.indexOf(run, i + run.length);
      if (end > 0) {
        flush();
        let v = src.slice(i + run.length, end).replace(/\n/g, ' ');
        if (/^ .* $/.test(v)) v = v.slice(1, -1);
        out.push(code(v, c));
        i = end + run.length;
        continue;
      }
    }
    if (ch === '<') {
      const auto = /^<((?:https?:|mailto:)[^\s<>]+)>/i.exec(src.slice(i));
      if (auto) {
        flush();
        out.push(link(auto[1], [auto[1].replace(/^mailto:/i, '')], c));
        i += auto[0].length;
        continue;
      }
      const tag = /^<!--[\s\S]*?-->|^<\/?[A-Za-z][\w-]*(?:\s[^<>]*)?\/?>/.exec(src.slice(i));
      if (tag) {
        // MX: an HTML tag (or comment) is dropped; the text between tags stays.
        i += tag[0].length;
        continue;
      }
    }
    if (ch === '!' && src[i + 1] === '[') {
      // An image shows its alt text; nothing is loaded.
      const m = /^!\[([^\]]*)\]\([^)]*\)/.exec(src.slice(i));
      if (m) {
        text += m[1];
        i += m[0].length;
        continue;
      }
    }
    if (ch === '[') {
      const m = matchLink(src, i);
      if (m) {
        flush();
        out.push(link(m.href, inline(m.text, c), c));
        i = m.end;
        continue;
      }
    }
    if (ch === '*' || ch === '_') {
      const run = src[i + 1] === ch ? ch + ch : ch;
      // _ inside a word (snake_case) is not emphasis.
      const prev = src[i - 1];
      const intraword = ch === '_' && prev !== undefined && /\w/.test(prev);
      const next = src[i + run.length];
      if (!intraword && next && !/\s/.test(next)) {
        const end = findClose(src, i + run.length, run);
        if (end > 0) {
          flush();
          const inner = inline(src.slice(i + run.length, end), c);
          out.push(run.length === 2 ? <strong key={c.k()}>{inner}</strong> : <em key={c.k()}>{inner}</em>);
          i = end + run.length;
          continue;
        }
      }
    }
    text += ch;
    i++;
  }
  flush();
  return out;

  function code(v: string, ctx: Ctx): React.ReactNode {
    const onRef = ctx.onRef;
    if (isPath(v)) {
      const href = ctx.refHref?.(v) || undefined;
      if (href || onRef)
        return (
          <InlineCode
            key={ctx.k()}
            href={href}
            onClick={
              onRef
                ? (e) => {
                    if (href && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return;
                    e.preventDefault();
                    onRef(v, e);
                  }
                : undefined
            }
          >
            {v}
          </InlineCode>
        );
    }
    return <InlineCode key={ctx.k()}>{v}</InlineCode>;
  }
}

function matchLink(src: string, i: number): { text: string; href: string; end: number } | null {
  let depth = 0;
  let j = i;
  for (; j < src.length; j++) {
    if (src[j] === '\\') {
      j++;
      continue;
    }
    if (src[j] === '[') depth++;
    else if (src[j] === ']' && --depth === 0) break;
  }
  if (j >= src.length || src[j + 1] !== '(') return null;
  // The address may hold balanced parentheses (javascript:alert(1), wiki/Foo_(bar)); an optional "title" follows.
  let at = j + 2;
  while (src[at] === ' ') at++;
  let depth2 = 0;
  let href = '';
  for (; at < src.length; at++) {
    const ch = src[at];
    if (/\s/.test(ch)) break;
    if (ch === '(') depth2++;
    else if (ch === ')') {
      if (depth2 === 0) break;
      depth2--;
    }
    href += ch;
  }
  const rest = /^(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/.exec(src.slice(at));
  if (!rest) return null;
  return { text: src.slice(i + 1, j), href: href.replace(/^<(.*)>$/, '$1'), end: at + rest[0].length };
}

function findClose(src: string, from: number, run: string): number {
  let j = from;
  while ((j = src.indexOf(run, j)) > 0) {
    const before = src[j - 1];
    const after = src[j + run.length];
    if (before && !/\s/.test(before) && !(run[0] === '_' && after && /\w/.test(after)) && !(run.length === 1 && after === run)) return j;
    j += run.length;
  }
  return -1;
}

function link(raw: string, children: React.ReactNode, c: Ctx): React.ReactNode {
  // A scheme listed in schemes (fn:, file:) is up to linkHref and onLink: no address of its own.
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(raw.trim())?.[1].toLowerCase();
  const own = !!scheme && !BLOCKED.includes(scheme) && !!c.schemes?.some((x) => x.toLowerCase() === scheme);
  const safe = own ? raw.trim() : safeHref(raw);
  if (safe === undefined) return <React.Fragment key={c.k()}>{children}</React.Fragment>;
  const href = c.linkHref ? c.linkHref(safe) || undefined : own ? undefined : safe;
  if (!href && !c.onLink) return <React.Fragment key={c.k()}>{children}</React.Fragment>;
  const outside = !!href && /^https?:/i.test(href);
  const onLink = c.onLink;
  const click = onLink
    ? (e: React.MouseEvent<HTMLElement>) => {
        if (href && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return;
        e.preventDefault();
        onLink(safe, e);
      }
    : undefined;
  if (!href)
    return (
      <button key={c.k()} type="button" className="ui-md-link" onClick={click}>
        {children}
      </button>
    );
  return (
    <a key={c.k()} className="ui-md-link" href={href} onClick={click} {...(outside && !c.onLink ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  );
}

// A fence's language name as CodeView knows it: ```python is py, ```bash is sh; file extensions work too (```ts).
const FENCE_LANG: Record<string, string> = {
  python: 'py',
  javascript: 'js',
  typescript: 'js',
  jsx: 'js',
  tsx: 'js',
  bash: 'sh',
  shell: 'sh',
  zsh: 'sh',
  console: 'sh',
  'c++': 'c',
};
const fenceLang = (l: string) => FENCE_LANG[l] ?? (languageOf('x.' + l) !== 'plain' ? languageOf('x.' + l) : l || 'plain');

const NUM = /^[-+]?(?:NT\$\s?)?[\d,]+(?:\.\d+)?\s?(?:%|[A-Za-z]{1,3}|\p{Script=Han}{1,2})?$/u;

export interface MarkdownProps {
  /** The Markdown text. */
  children: string;
  /** Only inline syntax (code, links, bold, italic), no paragraphs: for a one-line summary such as a README's first
   *  sentence. Line breaks become spaces. */
  inline?: boolean;
  /** small: 13 px, for notes. Default: the same 16 px as the text around it. */
  size?: 'body' | 'small';
  /** The heading level `#` becomes. Default 4: # is an h4 (20 px), ## an h5, ### and deeper h6 (both 16 px bold). */
  topLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Link schemes of your own, such as ['fn', 'file']: [_sync_as](fn:harness/controller.py:VirtualRouter._sync_as)
   *  goes to linkHref and onLink as written, which decide what it opens. javascript:, data: and vbscript: never link. */
  schemes?: string[];
  /** The address of a link (after the http, https, mailto or relative check); return undefined for no link. */
  linkHref?: (href: string) => string | undefined | null;
  /** A plain click on a link (the default navigation is prevented; Ctrl, ⌘ or Shift still open linkHref). */
  onLink?: (href: string, e: React.MouseEvent<HTMLElement>) => void;
  /** Inline code that is a path (harness/routing.py:108, docs/a.md) and paths in code blocks: their link. Same as
   *  CodeView's refHref. */
  refHref?: RefHref;
  /** A plain click on such a path. Same as CodeView's onRef. */
  onRef?: OnRef;
  className?: string;
}

/** Markdown from project documents and code comments, in the system's own type, code and table styles. Never runs HTML:
 *  tags are dropped and their text kept; links only to http, https, mailto and relative addresses. */
export function Markdown(p: MarkdownProps) {
  // Keys count from 0 on every render, so the same source gives the same keys and nothing remounts.
  let n = 0;
  const c: Ctx = { k: () => 'm' + n++, schemes: p.schemes, linkHref: p.linkHref, onLink: p.onLink, refHref: p.refHref, onRef: p.onRef };
  const src = String(p.children ?? '').replace(/\r\n?/g, '\n');
  const cls = cx('ui-md', p.size === 'small' && 'is-small', p.className);
  if (p.inline) return <span className={cx(cls, 'is-inline')}>{inline(src.trim().replace(/\n\s*\n/g, '\n'), c)}</span>;
  const top = p.topLevel ?? 4;
  const render = (blocks: Block[]): React.ReactNode[] =>
    blocks.map((b) => {
      switch (b.t) {
        case 'h': {
          const H = `h${Math.min(6, top + b.level - 1)}` as 'h4';
          return (
            <H key={c.k()} className="ui-md-h">
              {inline(b.text, c)}
            </H>
          );
        }
        case 'p':
          return <p key={c.k()}>{inline(b.text, c)}</p>;
        case 'hr':
          return <hr key={c.k()} />;
        case 'details':
          return (
            <MdDetails key={c.k()} summary={inline(b.summary, c)}>
              {render(b.blocks)}
            </MdDetails>
          );
        case 'alert':
          return (
            <Alert key={c.k()} tone={b.tone} className="ui-md-alert">
              {render(b.blocks)}
            </Alert>
          );
        case 'quote':
          return <blockquote key={c.k()}>{render(b.blocks)}</blockquote>;
        case 'list': {
          const items = b.items.map((it) => <li key={c.k()}>{it.length === 1 && it[0].t === 'p' ? inline(it[0].text, c) : render(it)}</li>);
          return b.ordered ? (
            <ol key={c.k()} start={b.start === 1 ? undefined : b.start}>
              {items}
            </ol>
          ) : (
            <ul key={c.k()}>{items}</ul>
          );
        }
        case 'code':
          return (
            <CodeView
              key={c.k()}
              className="ui-md-code"
              code={b.code}
              language={fenceLang(b.lang)}
              languageLabel={b.lang ? undefined : false}
              copy
              lineNumbers={false}
              refHref={p.refHref}
              onRef={p.onRef}
            />
          );
        case 'table': {
          // Numbers right-aligned: a column whose cells are all numbers, unless the source sets its alignment.
          const n = b.head.length;
          const numeric = b.head.map((_, j) => b.rows.length > 0 && b.rows.every((r) => !r[j] || NUM.test(r[j])));
          const align = (j: number): React.CSSProperties | undefined => {
            const a = b.align[j] ?? (numeric[j] ? 'right' : null);
            return a ? { textAlign: a } : undefined;
          };
          return (
            <div key={c.k()} className="ui-md-table-wrap" tabIndex={0} role="region" aria-label={b.head.join('、')}>
              <table className="ui-md-table">
                <thead>
                  <tr>
                    {b.head.map((h, j) => (
                      <th key={j} style={align(j)}>
                        {inline(h, c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((r, ri) => (
                    <tr key={ri}>
                      {Array.from({ length: n }, (_, j) => (
                        <td key={j} className={numeric[j] ? 'is-num' : undefined} style={align(j)} data-label={plain(b.head[j] ?? '')}>
                          {inline(r[j] ?? '', c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      }
    });
  return <div className={cls}>{render(parse(src.split('\n')))}</div>;
}

/** A header cell as plain text, for the label above each value when a narrow table turns into cards. */
const plain = (md: string) =>
  md
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .trim();

/** DA: a <details> block: a button with the summary, closed at first. The closed content stays in the page
 *  (hidden="until-found"), so the browser's find opens it, as in Section. */
function MdDetails({ summary, children }: { summary: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  const body = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    if (open) {
      el.removeAttribute('hidden');
      return;
    }
    el.setAttribute('hidden', 'until-found');
    const found = () => setOpen(true);
    el.addEventListener('beforematch', found);
    return () => el.removeEventListener('beforematch', found);
  }, [open]);
  return (
    <div className={cx('ui-md-details', open && 'is-open')}>
      <button type="button" className="ui-md-summary" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <Icon name="caret-right" size={16} className="ui-md-caret" />
        <span>{summary}</span>
      </button>
      <div id={id} ref={body} className="ui-md-details-body">
        {children}
      </div>
    </div>
  );
}
