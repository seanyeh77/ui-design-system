import type * as React from 'react';

export interface EmptyStateProps {
  /** What is empty, stated: 「還沒有專案」. */
  title: string;
  /** One sentence on what to do. */
  description?: string;
  /** Numbered first steps. */
  steps?: string[];
  /** Index of the current step. Default 0. */
  current?: number;
  /** The one button that starts the first step. */
  action?: React.ReactNode;
}

/** What a list or page shows when it has nothing yet: what is missing and the first step. */
export function EmptyState({ title, description, steps = [], current = 0, action }: EmptyStateProps) {
  return (
    <div className="ui-empty">
      <div className="ui-empty-title">{title}</div>
      {description ? <p className="ui-empty-desc">{description}</p> : null}
      {steps.length ? (
        <ol className="ui-steps">
          {steps.map((s, i) => (
            <li key={i} className={i === current ? 'is-current' : undefined}>
              <span className="ui-step-num">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {action ?? null}
    </div>
  );
}

