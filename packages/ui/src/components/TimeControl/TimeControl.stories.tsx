import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/TimeControl', component: UI.TimeControl };

/** Live, and replay after 「回放」. */
export const LiveAndReplay = {
  render: function Render() {
    const [replaying, setReplaying] = React.useState(false);
    return (
      <div style={{ maxWidth: 400 }}>
        <UI.TimeControl
          time={replaying ? new Date(2026, 10, 20, 14, 10) : new Date(2026, 10, 20, 16, 24)}
          replaying={replaying}
          onReplayChange={setReplaying}
          onNow={() => setReplaying(false)}
          status={replaying ? '回放中：14:10 起的紀錄，每 2 秒前進 10 分鐘。' : '即時：每 10 秒更新一次。'}
          detail={replaying ? '紀錄範圍 2026/11/20（五）12:00 到 16:24' : '最後更新 16:24:10'}
        />
      </div>
    );
  },
};
