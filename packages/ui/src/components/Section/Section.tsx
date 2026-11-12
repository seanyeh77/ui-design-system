import * as React from 'react';
import { Icon } from '../../icons/Icon';
import { tr } from '../../i18n';
import { cx } from '../../internal/util';
import { IconButton } from '../IconButton/IconButton';

/** What a SectionGroup shares with its sections: the last 「全部展開／全部收合」 and who is open. */
interface GroupCtx {
  /** Bumped on every 「全部展開／全部收合」, with the state it asked for. */
  all: { n: number; open: boolean };
  report: (key: string, open: boolean | null) => void;
  /** Some section is closed (or none reported yet): the toggle opens all; otherwise it closes all. */
  anyClosed: boolean;
  setAll: (open: boolean) => void;
}
const Group = React.createContext<GroupCtx | null>(null);

// SA: the open and close animation, the same as TreeList's children growing out of a folder.
const MOVE_MS = 260;

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function readStored(key: string | undefined): boolean | undefined {
  if (!key) return undefined;
  try {
    const v = localStorage.getItem('ui-section:' + key);
    return v === '1' ? true : v === '0' ? false : undefined;
  } catch {
    return undefined;
  }
}
function writeStored(key: string | undefined, open: boolean) {
  if (!key) return;
  try {
    localStorage.setItem('ui-section:' + key, open ? '1' : '0');
  } catch {
    // Storage blocked or full: works the same, it only does not remember.
  }
}

export interface SectionProps {
  /** The heading, 20 px bold (h4 size), above the 16 px content. */
  title: React.ReactNode;
  /** One line of key numbers right of the title, shown open or closed: 「29 個指令、4 個 namespace、3 個沒有逾時」.
   *  Muted, cut with 「…」 when it does not fit. Part of the button: no links or buttons in it. */
  summary?: React.ReactNode;
  /** Uncontrolled: open at first. Default false. A stored state (storageKey) wins. */
  defaultOpen?: boolean;
  /** Controlled: open or closed; pair with onOpenChange. */
  open?: boolean;
  /** Called with the new state when the title is clicked, the address jumps here, or 「全部展開／全部收合」. */
  onOpenChange?: (open: boolean) => void;
  /** Anchor. When the address hash (or a link in the page) points at this id, the section opens and scrolls to its title. */
  id?: string;
  /** Closed: the content is not rendered at all. Default false: it stays in the page hidden, and the browser's find
   *  (Ctrl+F) opens the section when it finds text in it. Set it on very long sections. */
  lazy?: boolean;
  /** Remembers open or closed in localStorage under this key. If storage fails it works the same, without remembering. */
  storageKey?: string;
  /** Controls right of the summary, such as a copy IconButton. Outside the title button: clicking them does not open
   *  or close the section. */
  actions?: React.ReactNode;
  /** Heading level of the title. Default 3. The size stays 20 px whatever the level. */
  level?: 2 | 3 | 4 | 5 | 6;
  children?: React.ReactNode;
  className?: string;
}

/** A part of a page that can be closed: the title and a one-line summary stay visible. A line between sections;
 *  the caret left of the title turns when it opens (260 ms, none with reduced motion). */
export function Section(p: SectionProps) {
  const group = React.useContext(Group);
  const uid = React.useId();
  const [own, setOwn] = React.useState(() => readStored(p.storageKey) ?? p.defaultOpen ?? false);
  const open = p.open ?? own;
  const set = React.useCallback(
    (v: boolean) => {
      if (p.open === undefined) setOwn(v);
      writeStored(p.storageKey, v);
      p.onOpenChange?.(v);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.open, p.storageKey, p.onOpenChange],
  );
  const setRef = React.useRef(set);
  const openRef = React.useRef(open);
  React.useLayoutEffect(() => {
    setRef.current = set;
    openRef.current = open;
  });

  // Lazy content stays mounted until the closing animation ends, so it has something to shrink.
  const [prevOpen, setPrevOpen] = React.useState(open);
  const [linger, setLinger] = React.useState(false);
  if (prevOpen !== open) {
    setPrevOpen(open);
    setLinger(!open);
  }
  React.useEffect(() => {
    if (!linger) return;
    const t = window.setTimeout(() => setLinger(false), reduced() ? 0 : MOVE_MS);
    return () => window.clearTimeout(t);
  }, [linger]);

  // Not lazy: closed content is hidden="until-found", so the browser's find still reaches it and opens the section.
  const inner = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = inner.current;
    if (!el || p.lazy) return;
    if (open) {
      el.removeAttribute('hidden');
      return;
    }
    const t = window.setTimeout(() => el.setAttribute('hidden', 'until-found'), reduced() ? 0 : MOVE_MS);
    const found = () => setRef.current(true);
    el.addEventListener('beforematch', found);
    return () => {
      window.clearTimeout(t);
      el.removeEventListener('beforematch', found);
    };
  }, [open, p.lazy]);

  // The address points here: open and scroll to the title.
  const head = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    if (!p.id) return;
    const check = () => {
      if (decodeURIComponent(location.hash.slice(1)) !== p.id) return;
      if (!openRef.current) setRef.current(true);
      requestAnimationFrame(() => head.current?.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }));
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, [p.id]);

  // 「全部展開／全部收合」 from the group, and this section's state reported back to it.
  const seen = React.useRef(group?.all.n ?? 0);
  React.useEffect(() => {
    if (!group || group.all.n === seen.current) return;
    seen.current = group.all.n;
    if (group.all.open !== openRef.current) setRef.current(group.all.open);
  }, [group, group?.all.n, group?.all.open]);
  const report = group?.report;
  React.useEffect(() => {
    report?.(uid, open);
  }, [report, uid, open]);
  React.useEffect(() => () => report?.(uid, null), [report, uid]);

  const H = `h${p.level ?? 3}` as 'h3';
  const body = uid + '-body';
  const showContent = !p.lazy || open || linger;
  return (
    <section id={p.id} className={cx('ui-sec', open && 'is-open', p.className)}>
      <div className="ui-sec-row">
        <H ref={head} className="ui-sec-h">
          <button type="button" className="ui-sec-btn" aria-expanded={open} aria-controls={body} onClick={() => set(!open)}>
            <Icon name="caret-right" size={18} className="ui-sec-caret" />
            <span className="ui-sec-title">{p.title}</span>
            {p.summary != null && p.summary !== false ? <span className="ui-sec-sum">{p.summary}</span> : null}
          </button>
        </H>
        {p.actions ? <div className="ui-sec-actions">{p.actions}</div> : null}
      </div>
      <div id={body} className="ui-sec-body">
        <div ref={inner} className="ui-sec-in">
          {showContent ? <div className="ui-sec-content">{p.children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export interface SectionGroupProps {
  /** Sections. One icon button above them on the right opens them all, or closes them all once all are open
   *  (「全部展開」「全部收合」 as its tooltip and name). */
  children?: React.ReactNode;
  /** More controls on the same row, left of the button. */
  actions?: React.ReactNode;
  /** false: no row above the sections; put <SectionGroupToggle /> where you want it, such as the card's title row next
   *  to its other icon buttons. It must be inside the SectionGroup. Default true. */
  bar?: boolean;
  className?: string;
}

/** A run of Sections with one 「全部展開／全部收合」 icon button. */
export function SectionGroup({ children, actions, bar = true, className }: SectionGroupProps) {
  const [all, setAllState] = React.useState({ n: 0, open: false });
  const [states, setStates] = React.useState<Record<string, boolean>>({});
  const report = React.useCallback((key: string, open: boolean | null) => {
    setStates((s) => {
      if (open === null) return key in s ? Object.fromEntries(Object.entries(s).filter(([id]) => id !== key)) : s;
      return s[key] === open ? s : { ...s, [key]: open };
    });
  }, []);
  const setAll = React.useCallback((open: boolean) => setAllState((a) => ({ n: a.n + 1, open })), []);
  const vals = Object.values(states);
  const anyClosed = vals.length === 0 || vals.some((v) => !v);
  const ctx = React.useMemo(() => ({ all, report, anyClosed, setAll }), [all, report, anyClosed, setAll]);
  return (
    <Group.Provider value={ctx}>
      <div className={cx('ui-sec-group', className)}>
        {bar ? (
          <div className="ui-sec-bar">
            {actions ?? null}
            <SectionGroupToggle />
          </div>
        ) : null}
        {children}
      </div>
    </Group.Provider>
  );
}

export interface SectionGroupToggleProps {
  className?: string;
}

/** GB: the 「全部展開／全部收合」 icon button of the SectionGroup around it, for a place of your own (with bar={false}).
 *  Opens every section while any is closed, else closes them all; its tooltip and name say which. */
export function SectionGroupToggle({ className }: SectionGroupToggleProps) {
  const g = React.useContext(Group);
  if (!g) return null;
  const open = g.anyClosed;
  return (
    <IconButton
      className={cx('ui-sec-toggle', className)}
      icon={open ? 'arrows-out-line-vertical' : 'arrows-in-line-vertical'}
      label={open ? tr('全部展開') : tr('全部收合')}
      onClick={() => g.setAll(open)}
    />
  );
}
