import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/Suggestion', component: UI.Suggestion };

export const Default = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <UI.Suggestion before="`flush_ring` 在 `ring.c:96` 把資料寫回檔案。" after="`flush_ring` 在 `ring.c:104` 把資料寫回檔案。" />
    </div>
  ),
};
