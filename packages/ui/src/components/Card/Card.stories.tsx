import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Layout/Card', component: UI.Card };

const items = [
  {
    id: 'f',
    name: 'ibt_uct_real',
    path: 'src/libibtrace/uct_table.h:109',
    children: [
      { id: 'a', name: 'trace_am_short', path: 'src/libibtrace/hooks/uct.c:181' },
      { id: 'b', name: 'trace_am_bcopy', path: 'src/libibtrace/hooks/uct.c:210' },
      { id: 'c', name: 'trace_put_short', path: 'src/libibtrace/hooks/uct.c:246' },
    ],
  },
];
export const Default = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <UI.Card title="流程" actions={React.createElement(UI.Button, null, '換起點函式')}>
        <UI.TreeList kind="plain" items={items} defaultOpen={['f']} />
      </UI.Card>
    </div>
  ),
};
