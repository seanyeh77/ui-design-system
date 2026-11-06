import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/ProgressBar', component: UI.ProgressBar };

function D() {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => {
      setV((x) => (x >= 100 ? 0 : x + 2));
    }, 80);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20, maxWidth: 420 }}>
      <UI.ProgressBar label="上傳 report.pdf" value={v} />
      <UI.ProgressBar label="匯入完成" value={100} />
    </div>
  );
}
export const Default = { render: () => <D /> };
