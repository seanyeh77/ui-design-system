import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Navigation/ProjectSwitcher', component: UI.ProjectSwitcher };

function Demo() {
  const [s, setS] = React.useState('web-build');
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px' }}>
      <strong style={{ fontSize: 17 }}>流程</strong>
      <UI.ProjectSwitcher
        project="web-app"
        status="live"
        value={s}
        onChange={setS}
        options={[
          { id: 'web-build', label: 'web-app', detail: 'build 環境' },
          { id: 'web-rt', label: 'web-app', detail: 'runtime 環境' },
          { id: 'api', label: 'api-server', detail: 'build 環境' },
        ]}
        footer={React.createElement('a', { href: '#', style: { color: 'var(--accent-text)' } }, '所有資料來源設定')}
      />
    </div>
  );
}
export const Default = { render: () => <Demo /> };
