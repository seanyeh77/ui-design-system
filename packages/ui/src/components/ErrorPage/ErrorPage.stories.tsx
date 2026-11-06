import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Pages/ErrorPage', component: UI.ErrorPage };

function D() {
  const c = React.useState(404);
  return (
    <div style={{ height: 420, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 6, padding: 12 }}>
        {[404, 500, 403].map((x) => {
          return (
            <UI.Button
              key={x}
              variant={x === c[0] ? 'primary' : 'secondary'}
              onClick={function () {
                c[1](x);
              }}
            >
              {String(x)}
            </UI.Button>
          );
        })}
      </div>
      <div style={{ flex: '1 1 auto' }}>
        <UI.ErrorPage code={c[0]} onBack={function () {}} onHome={function () {}} />
      </div>
    </div>
  );
}
export const Default = { render: () => <D /> };
