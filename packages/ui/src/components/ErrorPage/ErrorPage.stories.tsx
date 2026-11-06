import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Pages/ErrorPage', component: UI.ErrorPage };

function D() {
  const [c, setC] = React.useState(404);
  return (
    <div style={{ height: 420, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 6, padding: 12 }}>
        {[404, 500, 403].map((x) => {
          return (
            <UI.Button
              key={x}
              variant={x === c ? 'primary' : 'secondary'}
              onClick={() => {
                setC(x);
              }}
            >
              {String(x)}
            </UI.Button>
          );
        })}
      </div>
      <div style={{ flex: '1 1 auto' }}>
        <UI.ErrorPage code={c} onBack={() => {}} onHome={() => {}} />
      </div>
    </div>
  );
}
export const Default = { render: () => <D /> };
