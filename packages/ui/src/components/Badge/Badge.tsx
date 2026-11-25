import type * as React from 'react';
import { tr } from '../../i18n';
import { cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';

/** The meaning of a status: its colour, and its mark's shape when no preset gives one. */
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** The five work states: draft, doing, review, done and fail. */
export type BadgeStatus = 'draft' | 'doing' | 'review' | 'done' | 'fail';
/** Every preset: the work states, closed for a state that ended without a result (已取消, 已停用), and online and
 *  offline for monitoring. */
export type BadgePreset = BadgeStatus | 'closed' | 'online' | 'offline';

type Mark = 'ring' | 'half' | 'quarter' | 'full' | 'bang' | 'cross' | 'dash' | 'slash';

const STATUS: Record<BadgePreset, { label: string; tone: BadgeTone; mark: Mark }> = {
  draft: { label: '草稿', tone: 'neutral', mark: 'ring' },
  doing: { label: '進行中', tone: 'info', mark: 'half' },
  review: { label: '審核中', tone: 'warning', mark: 'quarter' },
  done: { label: '完成', tone: 'success', mark: 'full' },
  fail: { label: '失敗', tone: 'danger', mark: 'cross' },
  closed: { label: '已關閉', tone: 'neutral', mark: 'dash' },
  online: { label: '在線', tone: 'success', mark: 'full' },
  offline: { label: '離線', tone: 'neutral', mark: 'slash' },
};

/** The mark of a tone without a preset: the shape tells the meaning too, never colour alone. */
const TONE_MARK: Record<BadgeTone, Mark> = { neutral: 'ring', info: 'half', success: 'full', warning: 'bang', danger: 'cross' };

/** Inside the 24 px ring (r 8): filled paths, then stroked ones. */
const FILL: Partial<Record<Mark, string>> = {
  half: 'M12 4a8 8 0 0 1 0 16z',
  quarter: 'M12 4a8 8 0 0 1 8 8h-8z',
  full: 'M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16z',
};
const STROKE: Partial<Record<Mark, string>> = {
  bang: 'M12 7.5v5.5M12 16.4v.2',
  cross: 'M9 9l6 6M15 9l-6 6',
  dash: 'M8.5 12h7',
  slash: 'M6.5 17.5l11-11',
};

interface BadgeBase {
  /** Colour of the mark (and of the text for warning and danger). Default: the preset's, or 'neutral'. */
  tone?: BadgeTone;
  /** @deprecated Every Badge is now a mark and text without a chip; remove the prop. */
  variant?: 'chip' | 'dot';
  className?: string;
}

export type BadgeProps = BadgeBase &
  (
    | {
        /** A preset: its name, tone and mark. */
        status: BadgePreset;
        /** Default: the preset's name (草稿, 進行中, 審核中, 完成, 失敗, 已關閉, 在線, 離線). */
        children?: React.ReactNode;
      }
    | {
        status?: undefined;
        /** The text; required without a preset. */
        children: React.ReactNode;
      }
  );

/** The status of an item: a mark and text, no chip. The mark's shape carries the meaning too, never colour alone. */
export function Badge({ status, tone, variant, children, className }: BadgeProps) {
  devWarn(variant !== undefined, 'Badge', '`variant` is deprecated: every Badge is now a mark and text without a chip. Remove the prop.');
  const preset = status ? (STATUS[status] ?? STATUS.draft) : undefined;
  devWarn(
    !!status && !STATUS[status],
    'Badge',
    `unknown status "${String(status)}"; it shows as 草稿. Use one of ${Object.keys(STATUS).join(', ')}, or give \`tone\` and text.`,
  );
  const t: BadgeTone = tone ?? preset?.tone ?? 'neutral';
  const mark: Mark = preset?.mark ?? TONE_MARK[t] ?? 'ring';
  devWarn(!preset && !children, 'Badge', 'a Badge without `status` has no text. Give it text as children, e.g. <Badge tone="success">已付款</Badge>.');
  const key = status && STATUS[status] ? status : preset ? 'draft' : undefined;
  return (
    <span className={cx('ui-badge', 'is-' + t, key && 'ui-badge-' + key, className)}>
      <svg className="ui-badge-mark" width={15} height={15} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx={12} cy={12} r={8} fill="none" stroke="currentColor" strokeWidth={2.5} />
        {FILL[mark] ? <path d={FILL[mark]} fill="currentColor" /> : null}
        {STROKE[mark] ? <path d={STROKE[mark]} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" /> : null}
      </svg>
      <span className="ui-badge-text">{children || (preset ? tr(preset.label) : null)}</span>
    </span>
  );
}
