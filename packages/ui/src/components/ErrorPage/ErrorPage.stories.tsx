import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Pages/ErrorPage', component: UI.ErrorPage };

function D() {
  const [c, setC] = React.useState(404);
  return (
    <div style={{ height: 420, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 12 }}>
        <UI.SegmentedControl
          label="狀態碼"
          value={String(c)}
          onChange={(v) => setC(Number(v))}
          options={[
            { value: '404', label: '404' },
            { value: '500', label: '500' },
            { value: '403', label: '403' },
          ]}
        />
      </div>
      <div style={{ flex: '1 1 auto' }}>
        <UI.ErrorPage code={c} onBack={() => {}} onHome={() => {}} />
      </div>
    </div>
  );
}
export const Default = { render: () => <D /> };
