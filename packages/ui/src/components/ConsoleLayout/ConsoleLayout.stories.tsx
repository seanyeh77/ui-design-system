import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Pages/ConsoleLayout', component: UI.ConsoleLayout, parameters: { layout: 'fullscreen' } };

const ZONES: UI.ZoneMapProps['zones'] = [
  { id: 'a', name: 'A 區', value: 23.1, unit: '°C', decimals: 1, detail: '進氣 21.8 °C' },
  { id: 'b', name: 'B 區', value: 28.4, unit: '°C', decimals: 1, tone: 'warning', state: '注意', detail: '進氣 26.1 °C' },
  { id: 'c', name: 'C 區', value: 24.6, unit: '°C', decimals: 1, detail: '進氣 22.9 °C' },
  { id: 'd', name: 'D 區', value: 25.8, unit: '°C', decimals: 1, forecast: true, detail: '下一回合' },
];
const T = Array.from({ length: 24 }, (_, k) => {
  const m = 13 * 60 + k * 10;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
});
const at = (h: number, m: number) => new Date(2026, 10, 20, h, m);

/** A monitoring screen: top bar with KPIs, zone map, side panel, chart; a card that shows on tall screens. */
export const Monitoring = {
  render: function Render() {
    const [replaying, setReplaying] = React.useState(false);
    return (
      <UI.ConsoleLayout
        title="機房監控"
        tags={<UI.Tag variant="demo">示範資料</UI.Tag>}
        status="AI 最佳化中"
        kpis={[
          <UI.KpiCard key="e" size="compact" label="預測誤差" value={0.4} decimals={1} unit="°C" target="目標 ≤ 0.5 °C" />,
          <UI.KpiCard key="p" size="compact" label="PUE" value={1.42} decimals={2} target="目標 ≤ 1.45" />,
        ]}
        clock={replaying ? '回放中' : '即時'}
        main={
          <UI.Card title="機房分區">
            <UI.ZoneMap label="機房分區" zones={ZONES} fill />
          </UI.Card>
        }
        side={[
          <UI.Card key="t">
            <UI.TimeControl
              time={replaying ? at(14, 10) : at(16, 24)}
              replaying={replaying}
              onReplayChange={setReplaying}
              onNow={() => setReplaying(false)}
              status={replaying ? '回放中：14:10 起的紀錄。' : '即時：每 10 秒更新一次。'}
            />
          </UI.Card>,
          <UI.Card key="e" title="事件">
            <UI.EventTimeline label="近 4 小時的事件" events={[{ time: at(16, 20), kind: 'alert', text: 'F 區進氣溫度超過上限 29 °C' }]} />
          </UI.Card>,
        ]}
        bottom={
          <UI.Card>
            <UI.LineChart
              label="進氣溫度"
              unit="°C"
              decimals={1}
              min={22}
              max={30}
              labels={T}
              labelEvery={4}
              series={[{ name: '實際', values: [24.2, 24.9, 25.6, 26.8, 27.1, 26.1, 25.4, 25.9] }]}
            />
          </UI.Card>
        }
        extras={[
          {
            id: 'm',
            minHeight: 1040,
            node: (
              <UI.Card title="各區進氣溫度">
                <UI.Meter label="B 區" value={28.4} min={20} max={32} warn={27} limit={29} unit="°C" decimals={1} />
              </UI.Card>
            ),
          },
        ]}
      />
    );
  },
};
