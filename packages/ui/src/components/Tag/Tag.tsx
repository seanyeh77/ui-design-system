import type * as React from 'react';
import { IconOf, type IconSource } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { includeIcons } from '../../icons/store';
import phInfo from '../../icons/ph/info';
import phTrendUp from '../../icons/ph/trend-up';

includeIcons(phInfo, phTrendUp);

/** Text colour of a Tag. Categories stay 'neutral'; a colour only for a mark that says where values come from. */
export type TagTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface TagProps {
  children?: React.ReactNode;
  /** An icon before the words: the tag then takes the size of the text beside it, e.g. 'trend-up' with 「預測」, 'info'
   *  with 「示範資料」 beside the brand. */
  icon?: IconSource;
  /** Without an icon the text is ink-muted; with an icon it keeps the colour of the text beside it. 'info' is accent
   *  text, e.g. for forecast values. */
  tone?: TagTone;
  /** @deprecated Use icon and tone: 'forecast' is icon="trend-up" tone="info", 'demo' is icon="info". */
  variant?: 'plain' | 'forecast' | 'demo';
  className?: string;
}

const LEGACY = { forecast: { icon: 'trend-up', tone: 'info' }, demo: { icon: 'info', tone: undefined } } as const;

/** What kind of thing an item is (「外部」「範本」): small gray text. Status uses Badge instead. With an icon it marks where
 *  values come from (預測, 示範資料), at the size of the text beside it. */
export function Tag({ children, icon, tone, variant, className }: TagProps) {
  devWarn(
    variant !== undefined && variant !== 'plain',
    'Tag',
    `variant="${String(variant)}" is deprecated. Use icon and tone: forecast is icon="trend-up" tone="info", demo is icon="info".`,
  );
  const legacy = variant && variant !== 'plain' ? LEGACY[variant] : undefined;
  const ic = icon ?? legacy?.icon;
  const t = tone ?? legacy?.tone;
  return (
    <span className={cx('ui-tag', ic && 'has-icon', t && 'is-' + t, className)}>
      {ic ? <IconOf icon={ic} size={16} /> : null}
      {children}
    </span>
  );
}
