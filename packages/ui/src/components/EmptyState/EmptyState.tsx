import * as React from 'react';
import { codeText } from '../InlineCode/InlineCode';
import { cx, resizeObserver } from '../../internal/util';

export interface EmptyStateProps {
  /** What is empty, stated: 「還沒有專案」. */
  title: string;
  /** One sentence on what to do; `backticks` are code. */
  description?: string;
  /** Numbered first steps; `backticks` are code. */
  steps?: string[];
  /** Index of the current step. Default 0. */
  current?: number;
  /** The one button that starts the first step. */
  action?: React.ReactNode;
}

/** What a list or page shows when it has nothing yet: what is missing and the first step. */
export function EmptyState({ title, description, steps = [], current = 0, action }: EmptyStateProps) {
  // A description longer than 2 lines: on a phone the whole block reads from the left (CSS applies it under 600 px).
  const descRef = React.useRef<HTMLParagraphElement>(null);
  const [long, setLong] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const measure = () => {
      const line = parseFloat(getComputedStyle(el).lineHeight);
      const h = el.getBoundingClientRect().height;
      setLong(line > 0 && h > 0 && Math.round(h / line) > 2);
    };
    measure();
    const ro = resizeObserver(measure);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [description]);
  return (
    <div className={cx('ui-empty', long && 'is-long')}>
      <div className="ui-empty-title">{title}</div>
      {description ? (
        <p ref={descRef} className="ui-empty-desc">
          {codeText(description)}
        </p>
      ) : null}
      {steps.length ? (
        <ol className="ui-steps">
          {steps.map((s, i) => (
            <li key={i} className={i === current ? 'is-current' : undefined} aria-current={i === current ? 'step' : undefined}>
              <span className="ui-step-num">{i + 1}</span>
              <span>{codeText(s)}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {action ?? null}
    </div>
  );
}
