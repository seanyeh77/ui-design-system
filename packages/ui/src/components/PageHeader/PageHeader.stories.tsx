import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Layout/PageHeader', component: UI.PageHeader };

export const Default = {
  render: () => (
    <UI.Page>
      <UI.Breadcrumb items={[{ label: '訂單', href: '#orders' }, { label: '#1024' }]} />
      <UI.PageHeader
        title="訂單 #1024"
        status={<UI.Badge status="doing">出貨中</UI.Badge>}
        meta="建立於 2026/11/04（三）· 負責人 王小明"
        primary={{ label: '出貨', onClick: () => {} }}
        actions={[
          { label: '編輯', icon: 'pencil-simple', onClick: () => {} },
          { label: '列印', icon: 'printer', onClick: () => {} },
        ]}
        more={[{ label: '刪除', icon: 'trash', danger: true, confirm: { title: '刪除訂單 #1024？' }, onSelect: () => {} }]}
      />
    </UI.Page>
  ),
};

export const WithoutTitle = {
  render: () => <UI.PageHeader status={<UI.Badge status="done" />} meta="上次部署 2026/11/24（二）18:02" primary={{ label: '重新部署', onClick: () => {} }} />,
};
