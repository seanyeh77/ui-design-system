import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Overlays/Menu', component: UI.Menu };

const I = { edit: 'pencil', copy: 'copy', arch: 'archive', del: 'trash-2' } as const;
function D() {
  const n = React.useState('');
  const items: UI.MenuItem[] = [
    {
      label: '編輯',
      icon: I.edit,
      shortcut: 'E',
      onSelect() {
        n[1]('編輯');
      },
    },
    {
      label: '刪除',
      icon: I.del,
      shortcut: '⌫',
      danger: true,
      confirm: { title: '刪除叢集監控？', body: '這個專案的設定和紀錄會一起刪除，無法復原。' },
      onSelect() {
        n[1]('刪除（先跳確認對話框）');
      },
    },
    {
      label: '複製',
      icon: I.copy,
      shortcut: 'D',
      onSelect() {
        n[1]('複製');
      },
    },
    {
      label: '封存',
      icon: I.arch,
      shortcut: 'A',
      onSelect() {
        n[1]('封存');
      },
    },
  ];
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, minHeight: 240 }}>
      <UI.Menu label="叢集監控 的更多操作" items={items} />
      <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{n[0] ? '選了：' + n[0] : '左邊的選單會改成左緣對齊，右邊的維持右緣對齊'}</span>
      <UI.Menu label="帳號整合 的更多操作" items={items} />
    </div>
  );
}
export const Default = { render: () => <D /> };
