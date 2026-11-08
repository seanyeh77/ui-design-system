import * as React from 'react';
import { Icon } from '../icons/Icon';
import { tr } from '../i18n';
import { cx } from './util';

/** A box that may be wider than its container: whether it overflows, whether more is to the right, and whether the
 *  person has scrolled yet. Used by LayerGraph and DataTable for the right-edge fade and the 「左右滑動」 hint. */
export function useScrollHint<E extends HTMLElement = HTMLDivElement>() {
  const ref = React.useRef<E>(null);
  const [more, setMore] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [overflows, setOverflows] = React.useState(false);
  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const wide = el.scrollWidth > el.clientWidth + 1;
    setOverflows(wide);
    setMore(wide && el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [measure]);
  const onScroll = React.useCallback(() => {
    const el = ref.current;
    // Only a sideways scroll counts: a table also scrolls down.
    if (el && el.scrollLeft > 0) setScrolled(true);
    measure();
  }, [measure]);
  return { ref, more, overflows, scrolled, onScroll, measure };
}

/** 「→ 左右滑動」 under the box, right-aligned. Hidden after the first sideways scroll but keeps its line, so nothing below jumps. */
export function ScrollHint({ show, done }: { show: boolean; done: boolean }) {
  return show ? (
    <span className={cx('ui-scroll-hint', done && 'is-done')} aria-hidden="true">
      <Icon name="arrow-right" size={14} />
      {tr('左右滑動')}
    </span>
  ) : null;
}
