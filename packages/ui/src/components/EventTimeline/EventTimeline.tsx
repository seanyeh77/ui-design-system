import { cx } from '../../internal/util';
import { format } from '../../format';
import { tr } from '../../i18n';
import { Icon, type IconName } from '../../icons/Icon';

export type EventKind = 'alert' | 'switch' | 'ai' | 'manual';

export interface TimelineEvent {
  id?: string;
  time: Date;
  /** alert 告警, switch 切換, ai AI, manual 人工: an icon in front, read aloud as the kind's name. */
  kind: EventKind;
  /** What happened, one short sentence: 「F 區進氣溫度超過上限 29 °C」. */
  text: string;
}

export interface EventTimelineProps {
  events: TimelineEvent[];
  /** What the list is, for screen readers, e.g. 「近 4 小時的事件」. */
  label: string;
  /** Shown when there are no events, e.g. 「近 4 小時沒有事件」. Default 「沒有事件」. */
  empty?: string;
  className?: string;
}

const KIND: Record<EventKind, { icon: IconName; name: string }> = {
  alert: { icon: 'warning', name: '告警' },
  switch: { icon: 'arrows-left-right', name: '切換' },
  ai: { icon: 'sparkle', name: 'AI' },
  manual: { icon: 'user', name: '人工' },
};

/** Events newest first, one row each: the time (Geist Mono), an icon for the kind, and what happened. */
export function EventTimeline({ events, label, empty, className }: EventTimelineProps) {
  const list = [...events].sort((a, b) => b.time.getTime() - a.time.getTime());
  if (!list.length) return <p className={cx('ui-events-empty', className)}>{empty ?? tr('沒有事件')}</p>;
  return (
    <ol className={cx('ui-events', className)} aria-label={label}>
      {list.map((e, i) => (
        <li key={e.id ?? i} className={'is-' + e.kind}>
          <time className="ui-events-time" dateTime={e.time.toISOString()}>
            {format.time(e.time)}
          </time>
          <span className="ui-events-kind" role="img" aria-label={tr(KIND[e.kind].name)}>
            <Icon name={KIND[e.kind].icon} size={20} />
          </span>
          <span className="ui-events-text">{e.text}</span>
        </li>
      ))}
    </ol>
  );
}
