import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { Dialog } from '@base-ui/react/dialog';
import { CodeText, type OnRef, type RefHref } from '../InlineCode/InlineCode';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx, useNarrow } from '../../internal/util';
import { FloatingPanel } from '../../internal/FloatingPanel';

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
  className?: string;
}

/** A word followed by a small question mark that opens its explanation: a floating card from 600 px, a sheet from the bottom on phones. */
export function Term({ children, title, text, content, code, action, refHref, onRef, isRef, className }: TermProps) {
  const [open, setOpen] = React.useState(false);
  const narrow = useNarrow();
  const ref = React.useRef<HTMLButtonElement>(null);
  // Inside a sentence (text beside it) the term keeps its line height; on its own it gets the 48 px touch area.
  const [inline, setInline] = React.useState(false);
  React.useLayoutEffect(() => {
    const par = ref.current?.parentNode;
    const txt = !!par && Array.from(par.childNodes).some((n) => n.nodeType === 3 && !!n.textContent?.trim());
    setInline(txt);
  }, [children]);
  const heading = title || (typeof children === 'string' ? children : '');
  const trigger = (
    <button type="button" ref={ref} className={cx('ui-term', inline && 'is-inline', open && 'is-open', className)}>
      {children}
      <Icon name="question" size={14} className="ui-term-q" />
      <span className="ui-visually-hidden">{tr('（說明）')}</span>
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
    <FloatingPanel open={open} onOpenChange={setOpen} sideOffset={8} className="ui-term-pop" trigger={trigger}>
      {body(Popover.Title, Popover.Close)}
    </FloatingPanel>
  );
}
