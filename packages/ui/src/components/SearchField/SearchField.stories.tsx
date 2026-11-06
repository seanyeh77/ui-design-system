import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/SearchField', component: UI.SearchField };

function D() {
  const [v, setV] = React.useState('設計');
  return (
    <div style={{ padding: 20, maxWidth: 360 }}>
      <UI.SearchField value={v} onChange={setV} placeholder="搜尋專案" />
    </div>
  );
}
export const Default = { render: () => <D /> };
