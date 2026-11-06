import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Feedback/EmptyState', component: UI.EmptyState };

export const Default = {
  render: () => (
    <UI.EmptyState
      title="三步驟開始使用"
      description="建立第一個專案後，成員、任務與進度都會顯示在這裡。"
      steps={['建立專案', '邀請成員', '新增第一個任務']}
      current={0}
      action={React.createElement(UI.Button, null, '新增')}
    />
  ),
};
