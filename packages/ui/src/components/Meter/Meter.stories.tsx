import * as UI from '../../index';

export default { title: 'Data/Meter', component: UI.Meter };

/** Normal, watch and over the limit; the states and values line up. */
export const Levels = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <UI.Meter label="A 區進氣溫度" value={24.6} min={20} max={32} warn={27} limit={29} unit="°C" decimals={1} />
      <UI.Meter label="B 區進氣溫度" value={28.1} min={20} max={32} warn={27} limit={29} unit="°C" decimals={1} />
      <UI.Meter label="UPS 負載" value={92} min={0} max={100} warn={80} limit={90} unit="%" />
    </div>
  ),
};
