import * as React from 'react';
import { cx } from '../../internal/util';
import { codeSpans, hasCodeSpan } from '../../internal/codeSpans';

interface InlineCodeBase {
  /** The code, path or ID. */
  children?: React.ReactNode;
  /** Extra class on the root element. */
  className?: string;
}
type Target =
  | { /** Makes it a link. */ href: string; onClick?: (e: React.MouseEvent<HTMLElement>) => void }
  | { href?: undefined; onClick: (e: React.MouseEvent<HTMLElement>) => void };

export type InlineCodeProps = InlineCodeBase &
  (
    | {
        /** 'chip' (default): monospace on a light gray chip; with href or onClick an underlined accent link. */
        look?: 'chip';
        /** Makes it a link. */
        href?: string;
        /** Makes it a button-like link that runs this. */
        onClick?: (e: React.MouseEvent<HTMLElement>) => void;
      }
    | ({
        /** 'name': a function, class or variable that opens its definition. Accent monospace without a chip, underlined
         *  on hover and keyboard focus. 'location': a file and line (src/app.c:86), gray and one step smaller, accent
         *  and underlined on hover and focus. Both need href or onClick: text that points nowhere keeps the chip. */
        look: 'name' | 'location';
      } & Target)
  );

/** Code inside a sentence: monospace on a light gray chip. A span that points somewhere is a link; `look` turns a
 *  link into a name or a location. */
export function InlineCode({ children, href, onClick, className, look = 'chip' }: InlineCodeProps) {
  // Like Term: a link inside a sentence (text beside it) keeps its line height; on its own it gets the 48 px touch area.
  const [inline, setInline] = React.useState(false);
  const link = React.useCallback((el: HTMLElement | null) => {
    const par = el?.parentNode;
    setInline(!!par && Array.from(par.childNodes).some((n) => n.nodeType === 3 && !!n.textContent?.trim()));
  }, []);
  const isLink = !!(href || onClick);
  const cls = cx(
    'ui-code',
    isLink && 'is-link',
    isLink && inline && 'is-inline',
    isLink && look !== 'chip' && `is-${look}`,
    typeof children === 'string' && children.length <= 24 && 'is-short',
    className,
  );
  if (href)
    return (
      <a ref={link} className={cls} href={href} onClick={onClick}>
        {children}
      </a>
    );
  if (onClick)
    return (
      <button ref={link} type="button" className={cls} onClick={onClick}>
        {children}
      </button>
    );
  return <code className={cls}>{children}</code>;
}

/** Returns the link of a reference such as src/app.c:86, or undefined when it has no target. */
export type RefHref = (ref: string) => string | undefined | null;
/** Called on a plain click on a reference; the default navigation is prevented. */
export type OnRef = (ref: string, e: React.MouseEvent<HTMLElement>) => void;

/** A file and line, such as src/app.c:86 or main.py:12-20. */
const CODE_REF = /^[\w./-]+\.[A-Za-z0-9]+:\d+(-\d+)?$/;
export const isCodeRef = (span: string): boolean => CODE_REF.test(span);

export interface CodeTextProps {
  /** Text with `backtick` spans, as written in Markdown. */
  text: string;
  /** Spans that look like file.c:86 become links; return undefined when the reference has no target. */
  refHref?: RefHref;
  /** Called when a reference is pressed, for apps that open it themselves. */
  onRef?: OnRef;
  /** Which spans are references. Default: a file name with a line number. */
  isRef?: (span: string) => boolean;
  /** The element to render. Default span. */
  as?: 'span' | 'p' | 'div' | 'li';
  /** Extra class on the root element. */
  className?: string;
}

/** Text with `backtick` spans: renders them as InlineCode, never as raw backticks. */
export function CodeText({ text, refHref, onRef, isRef = isCodeRef, as: Tag = 'span', className }: CodeTextProps) {
  return (
    <Tag className={className}>
      {codeSpans(text).map(({ code, text: v }, i) => {
        if (!code) return v;
        const href = refHref && isRef(v) ? refHref(v) || undefined : undefined;
        const link = isRef(v) && (refHref ? !!href : !!onRef);
        if (!link) return <InlineCode key={i}>{v}</InlineCode>;
        // A reference that points somewhere is a location: gray, one step smaller.
        const click = onRef
          ? (e: React.MouseEvent<HTMLElement>) => {
              // A plain click goes to onRef; Ctrl, ⌘, Shift or the middle button still opens href in a new tab.
              if (href && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return;
              e.preventDefault();
              onRef(v, e);
            }
          : undefined;
        if (href)
          return (
            <InlineCode key={i} look="location" href={href} onClick={click}>
              {v}
            </InlineCode>
          );
        if (click)
          return (
            <InlineCode key={i} look="location" onClick={click}>
              {v}
            </InlineCode>
          );
        return <InlineCode key={i}>{v}</InlineCode>;
      })}
    </Tag>
  );
}

/** A sentence prop that takes a string: `backtick` spans become InlineCode, the backticks are not shown. Text without a
 *  pair of backticks comes back as it is, and anything that is not a string (an element) is left alone. */
export function codeText(text: React.ReactNode): React.ReactNode {
  if (typeof text !== 'string' || !hasCodeSpan(text)) return text;
  return codeSpans(text).map((s, i) => (s.code ? <InlineCode key={i}>{s.text}</InlineCode> : s.text));
}
