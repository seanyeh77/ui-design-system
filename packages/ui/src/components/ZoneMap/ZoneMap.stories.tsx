import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/ZoneMap', component: UI.ZoneMap };

const ZONES: UI.Zone[] = [
  { id: 'a', name: 'A 區', value: 23.1, unit: '°C', detail: '進氣 21.8 °C' },
  { id: 'b', name: 'B 區', value: 28.4, unit: '°C', tone: 'warning', state: '注意', detail: '進氣 26.1 °C' },
  { id: 'd', name: 'D 區', value: 25.8, unit: '°C', forecast: true, detail: '下一回合' },
  { id: 'f', name: 'F 區', value: 29.6, unit: '°C', tone: 'danger', state: '超過上限', detail: '進氣 27.9 °C' },
  { id: 'h', name: 'H 區', value: null },
];

/** Normal, warning, forecast, danger and no data; click or Tab and Enter to select. */
export const Zones = {
  render: function Render() {
    const [sel, setSel] = React.useState('b');
    return <UI.ZoneMap label="設施分區" columns={5} zones={ZONES} min={20} max={30} value={sel} onChange={setSel} />;
  },
};
