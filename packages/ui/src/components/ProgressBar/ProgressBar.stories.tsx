import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/ProgressBar', component: UI.ProgressBar };

const S = React.useState,
  E = React.useEffect;
function D() {
  const v = S(0);
  E(() => {
    const t = setInterval(() => {
      v[1]((x) => {
        return x >= 100 ? 0 : x + 2;
      });
    }, 80);
    return function () {
      clearInterval(t);
    };
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20, maxWidth: 420 }}>
      <UI.ProgressBar label="上傳 report.pdf" value={v[0]} />
      <UI.ProgressBar label="匯入完成" value={100} />
    </div>
  );
}
export const Default = { render: () => <D /> };
