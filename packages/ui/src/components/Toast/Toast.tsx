import * as React from 'react';
import { Toast as Base } from '@base-ui/react/toast';
import { Icon, type IconName } from '../../icons/Icon';
import { includeIcons } from '../../icons/store';
import phCheck from '../../icons/ph/check';
import phInfo from '../../icons/ph/info';
import phWarning from '../../icons/ph/warning';
import phWarningCircle from '../../icons/ph/warning-circle';
import phX from '../../icons/ph/x';
import { codeText } from '../InlineCode/InlineCode';
import { tr } from '../../i18n';
import { cx, IS_MAC } from '../../internal/util';

includeIcons(phCheck, phInfo, phWarning, phWarningCircle, phX);

/** The meaning of a toast: its icon and color. */
export type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONE_ICON: Record<ToastTone, IconName | null> = {
  neutral: null,
  info: 'info',
  success: 'check',
  warning: 'warning',
  danger: 'warning-circle',
};

/** How long a toast stays, in ms: a plain message 3 s; one with an action 10 s, paused while the pointer or focus is on
 *  the toasts (WCAG 2.2.1). */
export const TOAST_DURATION = { plain: 3000, action: 10000 } as const;

/** The one button of a toast. */
export interface ToastAction {
  /** A verb; usually 「復原」. */
  label: string;
  /** Runs once; the toast closes. */
  onAction: () => void;
  /** This action undoes what the toast reports: Ctrl Z (⌘Z on a Mac) runs it while the toast is shown, and the button
   *  shows that key. Not while typing in a field, where Ctrl Z undoes the typing. */
  undo?: boolean;
}

export interface ToastOptions {
  /** Default 'success' (a check): something was done. 'danger' is read at once (role="alert"). */
  tone?: ToastTone;
  /** One button, usually 復原. A toast with an action stays 10 s instead of 3 s. */
  action?: ToastAction;
  /** Shows the toast in place of the one with the same id, restarting its time (「已刪除 3 筆」 → 「已刪除 4 筆」). */
  id?: string;
}

interface ToastData {
  tone: ToastTone;
  action?: ToastAction;
}

const manager = Base.createToastManager<ToastData>();
type AddOptions = Parameters<typeof manager.add>[0];

// The manager only tells Toasters that are already listening. A toast() called before any Toaster is on the page (the
// first render, or an effect that runs before AppShell's Toaster has subscribed) waits here and shows once one is.
let liveViews = 0;
let pending: AddOptions[] = [];
const flushPending = () => {
  if (!liveViews || !pending.length) return;
  const list = pending;
  pending = [];
  for (const t of list) manager.add(t);
};

/** Shows a short message at the bottom right (bottom centre on phones, above the tab bar). Needs a Toaster on the
 *  page: AppShell has one; without AppShell, put one <Toaster /> on the page. Returns the toast's id for
 *  toast.close(id). */
export function toast(message: React.ReactNode, options: ToastOptions = {}): string {
  const tone = options.tone ?? 'success';
  const id = options.id ?? `ui-toast-${++toastSeq}`;
  const t: AddOptions = {
    id,
    title: message,
    timeout: options.action ? TOAST_DURATION.action : TOAST_DURATION.plain,
    priority: tone === 'danger' ? 'high' : 'low',
    data: { tone, action: options.action },
  };
  if (liveViews) return manager.add(t);
  pending = [...pending.filter((x) => x.id !== t.id), t];
  return id;
}
let toastSeq = 0;
/** Closes one toast, or every toast without an id. */
toast.close = (id?: string) => {
  pending = id === undefined ? [] : pending.filter((x) => x.id !== id);
  manager.close(id);
};

/** toast() and toast.close() from a component. */
export function useToast() {
  return React.useMemo(() => ({ toast, close: toast.close }), []);
}

const undoKey = IS_MAC ? '⌘Z' : 'Ctrl Z';

/** Typing in a field: Ctrl Z belongs to the field. */
const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || !!t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));

export interface ToasterProps {
  /** Name of the toast region for screen readers. Default 「通知」. */
  label?: string;
}

// Who shows the toasts: every <Toaster /> on the page, and the automatic ones (AppShell's). An automatic one renders
// only while no <Toaster /> is mounted and it is the first automatic one, so toasts never show twice.
let pageToasters = 0;
let autoToasters: object[] = [];
const toasterListeners = new Set<() => void>();
const emitToasters = () => toasterListeners.forEach((f) => f());
const subscribeToasters = (f: () => void) => {
  toasterListeners.add(f);
  return () => toasterListeners.delete(f);
};

/** Where toast() messages appear. AppShell renders one by itself, so a page inside AppShell needs none; put one on
 *  the page (or the app root) only without AppShell. Stacks the newest at the bottom; a persistent polite live region
 *  reads each one; F6 moves focus to the toasts. */
export function Toaster({ label }: ToasterProps) {
  React.useLayoutEffect(() => {
    pageToasters++;
    emitToasters();
    return () => {
      pageToasters--;
      emitToasters();
    };
  }, []);
  return <ToasterView label={label} />;
}

/** AppShell's Toaster: shown only when the page has no <Toaster /> of its own and no other automatic one is shown. */
export function AutoToaster() {
  const [me] = React.useState(() => ({}));
  React.useLayoutEffect(() => {
    autoToasters = [...autoToasters, me];
    emitToasters();
    return () => {
      autoToasters = autoToasters.filter((x) => x !== me);
      emitToasters();
    };
  }, [me]);
  const show = React.useSyncExternalStore(
    subscribeToasters,
    () => pageToasters === 0 && autoToasters[0] === me,
    () => false,
  );
  return show ? <ToasterView /> : null;
}

function ToasterView({ label }: ToasterProps) {
  return (
    <Base.Provider toastManager={manager}>
      <Base.Portal>
        <Base.Viewport className="ui-toaster" aria-label={label || tr('通知')}>
          <ToastList />
        </Base.Viewport>
      </Base.Portal>
    </Base.Provider>
  );
}

function ToastList() {
  const { toasts, close } = Base.useToastManager<ToastData>();
  // Counted while shown; waiting toasts are added after this commit, once the Provider above has subscribed.
  React.useEffect(() => {
    liveViews++;
    void Promise.resolve().then(flushPending);
    return () => {
      liveViews--;
    };
  }, []);
  // Ctrl Z (⌘Z) undoes through the newest toast that offers it.
  const live = React.useRef(toasts);
  React.useLayoutEffect(() => {
    live.current = toasts;
  });
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'z' || e.shiftKey || e.altKey || !(IS_MAC ? e.metaKey : e.ctrlKey)) return;
      if (typing(e.target)) return;
      const t = live.current.find((x) => x.transitionStatus !== 'ending' && x.data?.action?.undo);
      if (!t?.data?.action) return;
      e.preventDefault();
      t.data.action.onAction();
      close(t.id);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);
  return toasts.map((t) => {
    const tone = t.data?.tone ?? 'success';
    const action = t.data?.action;
    const icon = TONE_ICON[tone];
    return (
      <Base.Root key={t.id} toast={t} className={cx('ui-toast', 'is-' + tone)}>
        {icon ? <Icon name={icon} className="ui-toast-icon" /> : null}
        <Base.Title className="ui-toast-text">{codeText(t.title)}</Base.Title>
        {action ? (
          <Base.Action
            className="ui-toast-action"
            aria-keyshortcuts={action.undo ? (IS_MAC ? 'Meta+Z' : 'Control+Z') : undefined}
            onClick={() => {
              action.onAction();
              close(t.id);
            }}
          >
            {action.label}
            {action.undo ? <kbd className="ui-toast-kbd">{undoKey}</kbd> : null}
          </Base.Action>
        ) : null}
        <Base.Close className="ui-toast-close" aria-label={tr('關閉通知')}>
          <Icon name="x" size={16} />
        </Base.Close>
      </Base.Root>
    );
  });
}

export interface ToastProps {
  /** What happened, in the past tense: 「已刪除 3 筆」; in a string, `backticks` are code. */
  children?: React.ReactNode;
  /** Default 'success'. */
  tone?: ToastTone;
  /** Usually 「復原」. */
  actionLabel?: string;
  /** Runs on the action button. */
  onAction?: () => void;
  /** Extra class on the root element. */
  className?: string;
}

/** The toast card alone, for a custom place or a preview. Pages show messages with toast() and <Toaster />, which
 *  time, stack and announce them. */
export function Toast({ children, tone = 'success', actionLabel, onAction, className }: ToastProps) {
  const icon = TONE_ICON[tone];
  return (
    <div className={cx('ui-toast', 'is-' + tone, className)} role="status">
      {icon ? <Icon name={icon} className="ui-toast-icon" /> : null}
      <span className="ui-toast-text">{codeText(children)}</span>
      {actionLabel ? (
        <button type="button" className="ui-toast-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
