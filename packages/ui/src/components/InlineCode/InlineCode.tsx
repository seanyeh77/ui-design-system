import * as React from 'react';
import { cx } from '../../internal/util';

export interface InlineCodeProps {
  children?: React.ReactNode;
  /** Makes it a link. */
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  className?: string;
}

/** Code inside a sentence: monospace on a light gray chip. A span that points somewhere is a link. */
export function InlineCode({ children, href, onClick, className }: InlineCodeProps) {
  // Like Term: a link inside a sentence (text beside it) keeps its line height; on its own it gets the 48 px touch area.
  const [inline, setInline] = React.useState(false);
  const link = React.useCallback((el: HTMLElement | null) => {
    const par = el?.parentNode;
    setInline(!!par && Array.from(par.childNodes).some((n) => n.nodeType === 3 && !!n.textContent?.trim()));
  }, []);
  const cls = cx(
    'ui-code',
    (href || onClick) && 'is-link',
    (href || onClick) && inline && 'is-inline',
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
  onRef?: OnRef;
  /** Which spans are references. Default: a file name with a line number. */
  isRef?: (span: string) => boolean;
  as?: 'span' | 'p' | 'div' | 'li';
  className?: string;
}

/** Text with `backtick` spans: renders them as InlineCode, never as raw backticks. */
export function CodeText({ text, refHref, onRef, isRef = isCodeRef, as: Tag = 'span', className }: CodeTextProps) {
  const parts = String(text || '').split(/(`[^`]+`)/);
  return (
    <Tag className={className}>
      {parts.map((t, i) => {
        if (!t) return null;
        if (t[0] !== '`' || t.length < 2) return t;
        const v = t.slice(1, -1);
        const href = refHref && isRef(v) ? refHref(v) || undefined : undefined;
        const link = isRef(v) && (refHref ? !!href : !!onRef);
        if (!link) return <InlineCode key={i}>{v}</InlineCode>;
        return (
          <InlineCode
            key={i}
            href={href}
            onClick={
              onRef
                ? (e) => {
                    // A plain click goes to onRef; Ctrl, ⌘, Shift or the middle button still opens href in a new tab.
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
      })}
    </Tag>
  );
}
