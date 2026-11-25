import * as React from 'react';
import { cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { format, sameDay } from '../../format';
import { tr } from '../../i18n';
import { IconOf, type IconSource } from '../../icons/Icon';
import { includeIcons } from '../../icons/store';
import phArrowsLeftRight from '../../icons/ph/arrows-left-right';
import phSparkle from '../../icons/ph/sparkle';
import phUser from '../../icons/ph/user';
import phWarning from '../../icons/ph/warning';
import { codeText } from '../InlineCode/InlineCode';

includeIcons(phArrowsLeftRight, phSparkle, phUser, phWarning);

/** The built-in kinds of a monitoring timeline. */
export type EventKind = 'alert' | 'switch' | 'ai' | 'manual';

/** How a kind of event looks: its icon, the name read aloud, and the icon's colour. */
export interface TimelineKind {
  icon: IconSource;
  /** Read aloud for the icon: 「付款」. */
  label: string;
  /** Colour of the icon. Default 'neutral' (ink-muted); colour only what needs attention. */
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

export interface TimelineEvent {
  id?: string;
  time: Date;
  /** A key of `kinds`, or a built-in one: alert 告警, switch 切換, ai AI, manual 人工. */
  kind: EventKind | (string & {});
  /** What happened, one short sentence: 「F 區進氣溫度超過上限 29 °C」; `backticks` are code. */
  text: string;
  /** Who did it, after the sentence: 「王小明」. */
  actor?: string;
}

export interface EventTimelineProps {
  /** The events, newest first. */
  events: TimelineEvent[];
  /** What the list is, for screen readers, e.g. 「近 4 小時的事件」. */
  label: string;
  /** Shown when there are no events, e.g. 「近 4 小時沒有事件」. Default 「沒有事件」. */
  empty?: string;
  /** Your own kinds (an order's 建立, 付款, 出貨…), added to the built-in four. */
  kinds?: Record<string, TimelineKind>;
  /** Extra class on the root element. */
  className?: string;
}

const BUILT_IN: Record<EventKind, TimelineKind> = {
  alert: { icon: 'warning', label: '告警', tone: 'warning' },
  switch: { icon: 'arrows-left-right', label: '切換', tone: 'info' },
  ai: { icon: 'sparkle', label: 'AI' },
  manual: { icon: 'user', label: '人工' },
};

/** Events newest first, one row each: the time (Geist Mono), an icon for the kind, what happened and who did it. When
 *  the events span several days, a date heads each day. */
export function EventTimeline({ events, label, empty, kinds, className }: EventTimelineProps) {
  const list = [...events].sort((a, b) => b.time.getTime() - a.time.getTime());
  const all: Record<string, TimelineKind> = { ...BUILT_IN, ...kinds };
  const unknown = list.find((e) => !all[e.kind]);
  devWarn(unknown, 'EventTimeline', `kind "${String(unknown?.kind)}" is not defined. Add it to \`kinds\`: { ${String(unknown?.kind)}: { icon, label } }.`);
  if (!list.length) return <p className={cx('ui-events-empty', className)}>{empty ?? tr('沒有事件')}</p>;
  const row = (e: TimelineEvent, i: number) => {
    const k: TimelineKind = all[e.kind] ?? { icon: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z', label: e.kind };
    return (
      <li key={e.id ?? i} className={cx('is-' + e.kind, k.tone && k.tone !== 'neutral' && 'is-tone-' + k.tone)}>
        <time className="ui-events-time" dateTime={e.time.toISOString()}>
          {format.time(e.time)}
        </time>
        <span className="ui-events-kind" role="img" aria-label={tr(k.label)}>
          <IconOf icon={k.icon} size={20} />
        </span>
        <span className="ui-events-text">
          {codeText(e.text)}
          {e.actor ? <span className="ui-events-actor">{e.actor}</span> : null}
        </span>
      </li>
    );
  };
  const days: TimelineEvent[][] = [];
  for (const e of list) {
    const last = days[days.length - 1];
    if (last && sameDay(last[0].time, e.time)) last.push(e);
    else days.push([e]);
  }
  if (days.length === 1)
    return (
      <ol className={cx('ui-events', className)} aria-label={label}>
        {list.map(row)}
      </ol>
    );
  return (
    <div className={cx('ui-events', 'is-days', className)} role="group" aria-label={label}>
      {days.map((day) => {
        const date = format.date(day[0].time);
        return (
          <React.Fragment key={date}>
            <div className="ui-events-date">{date}</div>
            <ol className="ui-events-day" aria-label={date}>
              {day.map(row)}
            </ol>
          </React.Fragment>
        );
      })}
    </div>
  );
}
