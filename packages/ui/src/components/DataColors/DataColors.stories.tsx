import * as UI from '../../index';

export default { title: 'Foundations/DataColors' };

const cell = (token: string, label: string) => (
  <div
    key={token}
    style={{
      background: `var(--${token})`,
      color: UI.textOn(token),
      height: 56,
      borderRadius: 6,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      fontWeight: 600,
    }}
  >
    <span>{label}</span>
    <span style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{token}</span>
  </div>
);

/** Heat, diverging and chart colors; text on each picked by textOn(). */
export const Scales = {
  render: () => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => cell('heat-' + n, (20 + ((n - 1) * 10) / 6).toFixed(1) + ' °C'))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
        {(
          [
            ['diverge-neg-strong', '−3 °C'],
            ['diverge-neg', '−1.5 °C'],
            ['diverge-zero', '0 °C'],
            ['diverge-pos', '+1.5 °C'],
            ['diverge-pos-strong', '+3 °C'],
          ] as const
        ).map(([t, l]) => cell(t, l))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {['實際', '預測', '基準', '人工'].map((l, i) => cell('chart-' + (i + 1), l))}
      </div>
    </div>
  ),
};
