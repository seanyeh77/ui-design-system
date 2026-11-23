import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { Dialog } from '@base-ui/react/dialog';
import { CodeText, type OnRef, type RefHref } from '../InlineCode/InlineCode';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx, useNarrow } from '../../internal/util';
import { FloatingPanel } from '../../internal/FloatingPanel';
import { includeIcons } from '../../icons/store';
import phQuestion from '../../icons/ph/question';
import phX from '../../icons/ph/x';

includeIcons(phQuestion, phX);

export interface TermProps {
  /** The word or label that needs explaining. */
  children?: React.ReactNode;
  /** Heading of the explanation. Default: children when it is text. */
  title?: string;
  /** The explanation, at most 2 short sentences; `backticks` are code. */
  text?: string;
  /** Other content instead of text. */
  content?: React.ReactNode;
  /** An evidence line, shown as a code block. */
  code?: string;
  /** One link-style action at the bottom. */
  action?: { label: string; onClick?: () => void };
  refHref?: RefHref;
  onRef?: OnRef;
  isRef?: (span: string) => boolean;
  /** `icon` (default): the word with a small question mark, opened by a press. `inline`: a dashed underline inside a
   *  sentence; the card opens after resting on the word for 500 ms, at once on keyboard focus, and as a sheet on phones. */
  variant?: 'icon' | 'inline';
  /** inline only: keyboard focus opens the card at once. Default true; false where arrow keys move between words and
   *  Enter opens (CodeView). */
  openOnFocus?: boolean;
  /** -1 inside a widget that moves focus with its own keys (CodeView). */
  tabIndex?: number;
  className?: string;
}

/** Hover delay of `Term variant="inline"`, in ms. */
export const TERM_HOVER_DELAY = 500;

/** A word that opens its explanation: a floating card from 600 px, a sheet from the bottom on phones. `icon` adds a small
 *  question mark; `inline` marks the word with a dashed underline and opens on hover or keyboard focus. */
export function Term({
  children,
  title,
  text,
  content,
  code,
  action,
  refHref,
  onRef,
  isRef,
  variant = 'icon',
  openOnFocus = true,
  tabIndex,
  className,
}: TermProps) {
  const [open, setOpen] = React.useState(false);
  const narrow = useNarrow();
  const inlineV = variant === 'inline';
  const cardId = React.useId();
  const ref = React.useRef<HTMLButtonElement>(null);
  // Inside a sentence (text beside it) the term keeps its line height; on its own it gets the 48 px touch area.
  const [inline, setInline] = React.useState(false);
  React.useLayoutEffect(() => {
    const par = ref.current?.parentNode;
    const txt = !!par && Array.from(par.childNodes).some((n) => n.nodeType === 3 && !!n.textContent?.trim());
    setInline(txt);
  }, [children]);
  // The block the term sits in (a card, a side panel, the main area): the explanation stays inside it, shifted
  // sideways or narrower, so it does not cover the panel beside it. A block narrower than 240 px: the window instead.
  const block = React.useRef<Element | null>(null);
  const toggle = (next: boolean) => {
    if (next) {
      const el = ref.current?.closest('.ui-card, .ui-split-a, .ui-split-b, .ui-shell-main, main') ?? null;
      block.current = el && el.getBoundingClientRect().width >= 240 ? el : null;
    }
    setOpen(next);
  };
  const heading = title || (typeof children === 'string' ? children : '');
  // Inline: keyboard focus opens the card at once; it closes when focus leaves both the word and the card.
  const onFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    if (openOnFocus && !narrow && e.currentTarget.matches(':focus-visible')) toggle(true);
  };
  const onBlur = (e: React.FocusEvent<HTMLElement>) => {
    const to = e.relatedTarget as Node | null;
    if (to && (ref.current?.contains(to) || document.getElementById(cardId)?.contains(to))) return;
    if (!narrow) setOpen(false);
  };
  const trigger = inlineV ? (
    <button
      type="button"
      ref={ref}
      className={cx('ui-term', 'is-word', open && 'is-open', className)}
      tabIndex={tabIndex}
      aria-describedby={open && !narrow ? cardId : undefined}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {children}
      {/* Read as 「cookie，有說明」: the word, then that it has an explanation. */}
      <span className="ui-visually-hidden">{tr('，有說明')}</span>
    </button>
  ) : (
    <button type="button" ref={ref} className={cx('ui-term', inline && 'is-inline', open && 'is-open', className)}>
      {/* Read as 「說明 caller」: what the button does, then the word. */}
      <span className="ui-visually-hidden">{tr('說明') + ' '}</span>
      {children}
      <Icon name="question" size={14} className="ui-term-q" />
    </button>
  );
  const body = (Title: typeof Popover.Title | typeof Dialog.Title, Close: typeof Popover.Close | typeof Dialog.Close) => (
    <>
      <div className="ui-term-head">
        <Title className="ui-term-title">{heading}</Title>
        <Close className="ui-dialog-close ui-term-close" aria-label={tr('關閉說明')}>
          <Icon name="x" />
        </Close>
      </div>
      {text ? <CodeText as="div" className="ui-term-body" text={text} refHref={refHref} onRef={onRef} isRef={isRef} /> : null}
      {content ? <div className="ui-term-body">{content}</div> : null}
      {code ? <pre className="ui-term-code">{code}</pre> : null}
      {action ? (
        <button
          type="button"
          className="ui-link-btn ui-term-action"
          onClick={() => {
            setOpen(false);
            action.onClick?.();
          }}
        >
          {action.label}
        </button>
      ) : null}
    </>
  );
  if (narrow)
    return (
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger render={trigger} />
        <Dialog.Portal>
          <Dialog.Backdrop className="ui-term-backdrop" />
          <Dialog.Popup className="ui-term-sheet">{body(Dialog.Title, Dialog.Close)}</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    );
  return (
    <FloatingPanel
      open={open}
      onOpenChange={toggle}
      sideOffset={8}
      className="ui-term-pop"
      trigger={trigger}
      boundary={block}
      {...(inlineV ? { openOnHover: true, delay: TERM_HOVER_DELAY, id: cardId, focusOnOpen: false } : {})}
    >
      {inlineV ? <div onBlur={onBlur}>{body(Popover.Title, Popover.Close)}</div> : body(Popover.Title, Popover.Close)}
    </FloatingPanel>
  );
}
