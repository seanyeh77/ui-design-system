import * as React from 'react';
import { CHECK } from '../icons/Icon';
import { cx } from './util';

/** A field's label above it, with the red asterisk when required. A <label> when it names one input, otherwise a <span>. */
export function FieldLabel({ htmlFor, id, required, children }: { htmlFor?: string; id?: string; required?: boolean; children: React.ReactNode }) {
  const Tag = htmlFor ? 'label' : 'span';
  return (
    <Tag htmlFor={htmlFor} id={id} className="ui-field-label">
      {children}
      {required ? (
        <span className="ui-req" aria-hidden="true">
          {' *'}
        </span>
      ) : null}
    </Tag>
  );
}

/** The mark inside a check box: a drawn check, a dash for 'mixed', or nothing. The check draws itself only when it
 *  turns on after mount, never when a list or menu opens with it already on. */
export function CheckMark({ v }: { v: boolean | 'mixed' }) {
  const [prev, setPrev] = React.useState(v);
  const [draw, setDraw] = React.useState(false);
  if (prev !== v) {
    setPrev(v);
    setDraw(v === true);
  }
  if (v === 'mixed') return <span className="ui-check-dash" />;
  if (!v) return null;
  return (
    <svg
      className={cx(draw && 'ui-draw')}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={CHECK} />
    </svg>
  );
}
