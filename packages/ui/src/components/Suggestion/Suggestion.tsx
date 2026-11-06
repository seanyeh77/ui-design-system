import * as React from 'react';
import { tr } from '../../i18n';
import { CHECK } from '../../icons/Icon';
import { copyText, cx } from '../../internal/util';
import { IconButton } from '../IconButton/IconButton';
import { CodeText, type OnRef, type RefHref } from '../InlineCode/InlineCode';

export interface SuggestionProps {
  /** Default 「建議修正」. */
  title?: string;
  /** The current line, shown with −. Text in `backticks` is code. */
  before?: string;
  /** The proposed line, shown with +. */
  after: string;
  /** What the copy button copies. Default: after. */
  copyText?: string;
  /** Default 「複製修正」. */
  copyLabel?: string;
  onCopy?: (text: string) => void;
  onCopyError?: () => void;
  refHref?: RefHref;
  onRef?: OnRef;
  isRef?: (span: string) => boolean;
  className?: string;
}

/** A proposed fix: the old line (−) above the new one (+), with a copy button at the top right. */
export function Suggestion({ title, before, after, copyText: copyValue, copyLabel, onCopy, onCopyError, refHref, onRef, isRef, className }: SuggestionProps) {
  const [copied, setCopied] = React.useState(false);
  const tm = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(tm.current), []);
  const copy = () => {
    const text = copyValue ?? after;
    copyText(text).then(
      () => {
        setCopied(true);
        clearTimeout(tm.current);
        tm.current = setTimeout(() => setCopied(false), 2000);
        onCopy?.(text);
      },
      () => onCopyError?.(),
    );
  };
  const line = (kind: 'del' | 'add', text: string) => (
    <div className={'ui-sug-line is-' + kind}>
      <span className="ui-sug-mark" aria-hidden="true">
        {kind === 'del' ? '−' : '+'}
      </span>
      <span className="ui-visually-hidden">{kind === 'del' ? tr('原本：') : tr('改成：')}</span>
      <CodeText className="ui-sug-text" text={text} refHref={refHref} onRef={onRef} isRef={isRef} />
    </div>
  );
  return (
    <div className={cx('ui-sug', className)}>
      <div className="ui-sug-head">
        <span className="ui-sug-title">{title || tr('建議修正')}</span>
        <IconButton className={cx('ui-sug-copy', copied && 'is-copied')} label={copied ? tr('已複製') : copyLabel || tr('複製修正')} icon={copied ? CHECK : 'copy'} onClick={copy} />
      </div>
      {before != null ? line('del', before) : null}
      {line('add', after)}
      <span className="ui-visually-hidden" aria-live="polite">
        {copied ? tr('已複製') : ''}
      </span>
    </div>
  );
}
