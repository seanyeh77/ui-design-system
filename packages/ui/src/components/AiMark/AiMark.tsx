import { cx } from '../../internal/util';
import { tr } from '../../i18n';

export interface AiMarkProps {
  /** What screen readers say before the paragraph. Default 「AI 說明」. */
  label?: string;
  className?: string;
}

/** A small 「AI」 at the start of a paragraph, list item or table cell written by AI. Not a link and not a Tab stop;
 *  screen readers say 「AI 說明：」 instead of the letters. */
export function AiMark({ label, className }: AiMarkProps) {
  return (
    <>
      <span className={cx('ui-aimark', className)} aria-hidden="true">
        AI
      </span>
      <span className="ui-visually-hidden">{(label ?? tr('AI 說明')) + tr('：')}</span>
    </>
  );
}
