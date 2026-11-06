import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/SearchField', component: UI.SearchField };

const S = React.useState;
function D() {
  const v = S('設計');
  return (
    <div style={{ padding: 20, maxWidth: 360 }}>
      <UI.SearchField value={v[0]} onChange={v[1]} placeholder="搜尋專案" />
    </div>
  );
}
export const Default = { render: () => <D /> };
