import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Foundations/Format' };

const LOCS = [
  ['zh-TW', '繁體中文（台灣）', 'TWD'],
  ['en-US', 'English (US)', 'USD'],
  ['ja-JP', '日本語', 'JPY'],
];
const NOW = new Date(2026, 10, 4, 15, 57);
function D() {
  const [l, setL] = React.useState('zh-TW'),
    loc = l;
  const cur = LOCS.filter((x) => {
    return x[0] === loc;
  })[0];
  UI.setLocale(loc, { currency: cur[2] });
  const F = UI.format;
  const rows = [
    ['日期', F.date(NOW)],
    ['時間', F.time(NOW)],
    ['2 小時前', F.relative(new Date(2026, 10, 4, 13, 40), NOW)],
    ['昨天', F.relative(new Date(2026, 10, 3, 9, 0), NOW)],
    ['超過一週', F.relative(new Date(2026, 9, 1, 9, 0), NOW)],
    ['數字', F.number(1284000)],
    ['KPI 縮寫', F.compact(12840000)],
    ['金額', F.money(486000)],
    ['負數金額', F.money(-1280)],
    ['百分比', F.percent(64.23)],
    ['容量', F.number(3480.25, 'size') + ' GB'],
  ];
  const res = (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div role="radiogroup" aria-label="語系" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {LOCS.map((x) => {
          return (
            <UI.Button
              key={x[0]}
              variant={x[0] === loc ? 'primary' : 'secondary'}
              onClick={() => {
                setL(x[0]);
              }}
            >
              {x[1]}
            </UI.Button>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 16px', fontSize: 14 }}>
        {rows.map((r) => {
          return [
            <span key={r[0] + 'k'} style={{ color: 'var(--ink-muted)' }}>
              {r[0]}
            </span>,
            <span key={r[0] + 'v'} style={{ fontFamily: 'var(--font-mono)' }}>
              {r[1]}
            </span>,
          ];
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <UI.Badge status="review" />
        <UI.Badge status="done" />
        <UI.Button variant="secondary">{UI.t('清除')}</UI.Button>
        <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{UI.t('已選 {n} 筆', { n: 3 })}</span>
      </div>
    </div>
  );
  return res;
}
export const Default = { render: () => <D /> };
