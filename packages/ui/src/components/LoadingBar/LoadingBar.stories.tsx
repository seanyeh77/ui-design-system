import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/LoadingBar', component: UI.LoadingBar };

function D() {
  return (
    <div style={{ padding: 20, maxWidth: 420 }}>
      <div className="ui-field-label" style={{ marginBottom: 8 }}>
        載入資料中
      </div>
      <UI.LoadingBar />
    </div>
  );
}
export const Default = { render: () => <D /> };
