import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/TextArea', component: UI.TextArea };

function D() {
  const [v, setV] = React.useState('這段文字會隨內容自動長高。');
  return (
    <div style={{ padding: 20, maxWidth: 480 }}>
      <UI.TextArea label="備註" hint="寫給審核者看的說明" value={v} onChange={setV} />
    </div>
  );
}
export const Default = { render: () => <D /> };
