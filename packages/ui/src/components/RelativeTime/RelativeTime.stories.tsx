import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/RelativeTime', component: UI.RelativeTime };

const MIN = 60_000;

function Times() {
  // Fixed offsets from when the story opens: each text moves on by itself once a minute.
  const [now] = React.useState(() => Date.now());
  const rows: [string, number][] = [
    ['剛才', 20_000],
    ['分鐘', 5 * MIN],
    ['小時', 3 * 60 * MIN],
    ['昨天', 26 * 60 * MIN],
    ['幾天前', 3 * 24 * 60 * MIN],
    ['超過一週', 9 * 24 * 60 * MIN],
  ];
  return (
    <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 24px', margin: 0 }}>
      {rows.map(([label, ago]) => (
        <React.Fragment key={label}>
          <dt style={{ color: 'var(--ink-muted)' }}>{label}</dt>
          <dd style={{ margin: 0 }}>
            <UI.RelativeTime value={now - ago} />
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

export const Default = { render: () => <Times /> };
