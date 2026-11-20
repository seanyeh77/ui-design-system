import { cx } from '../../internal/util';
import { format } from '../../format';
import { tr } from '../../i18n';
import { Button } from '../Button/Button';

export interface TimeControlProps {
  /** The time on show: now when live, the replayed moment during a replay. */
  time: Date;
  /** Replaying past records instead of showing live data. */
  replaying: boolean;
  /** 「回放」 starts a replay, 「停止回放」 stops it. */
  onReplayChange: (replaying: boolean) => void;
  /** 「回到現在」: back to live data; cannot be pressed while live. */
  onNow: () => void;
  /** First line: what is on show, e.g. 「即時：每 10 秒更新一次。」 or 「回放中：14:10 起的紀錄。」. */
  status: string;
  /** Second line, smaller and gray: e.g. the range of the records or the last update. */
  detail?: string;
  className?: string;
}

/** The clock of a monitoring screen with replay: the time in 28 px Geist Mono, two lines on what is on show, and
 *  「回放」 (「停止回放」 while replaying) and 「回到現在」. Laid out as a column for a 400 px side panel. Moving within
 *  the replay is LineChart's playhead. */
export function TimeControl({ time, replaying, onReplayChange, onNow, status, detail, className }: TimeControlProps) {
  return (
    <section className={cx('ui-timecontrol', className)} aria-label={tr('時間控制')}>
      <time className="ui-timecontrol-clock" dateTime={time.toISOString()} aria-live="off">
        {format.time(time)}
      </time>
      <p className="ui-timecontrol-status" aria-live="polite">
        {status}
      </p>
      {detail ? <p className="ui-timecontrol-detail">{detail}</p> : null}
      <div className="ui-timecontrol-actions">
        <Button onClick={() => onReplayChange(!replaying)}>{replaying ? tr('停止回放') : tr('回放')}</Button>
        <Button onClick={onNow} disabled={!replaying}>
          {tr('回到現在')}
        </Button>
      </div>
    </section>
  );
}
