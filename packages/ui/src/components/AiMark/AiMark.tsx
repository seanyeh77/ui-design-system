import { cx } from '../../internal/util';
import { tr } from '../../i18n';

export interface AiMarkProps {
  /** The words shown. Default 「AI 撰寫」; another source mark in the same style, e.g. 「推測」. */
  text?: string;
  /** What screen readers say, when it should differ from text. Default: text in parentheses, 「（AI 撰寫）」. */
  label?: string;
  className?: string;
}

/** A small gray 「AI 撰寫」 at the end of a sentence, paragraph, list item or cell written by AI. Not a link and not a
 *  Tab stop; screen readers hear it in parentheses after the sentence. */
export function AiMark({ text, label, className }: AiMarkProps) {
  const words = text ?? tr('AI 撰寫');
  return (
    <>
      <span className={cx('ui-aimark', className)} aria-hidden="true">
        {words}
      </span>
      <span className="ui-visually-hidden">{label ?? tr('（{v}）', { v: words })}</span>
    </>
  );
}
