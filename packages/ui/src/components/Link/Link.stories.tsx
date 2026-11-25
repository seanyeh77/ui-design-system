import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Navigation/Link', component: UI.Link };

export const Default = {
  render: () => (
    <p style={{ margin: 0 }}>
      這筆訂單已出貨，<UI.Link href="#order">查看訂單</UI.Link>；退貨規定見
      <UI.Link href="https://example.com/help" external>
        使用說明
      </UI.Link>
      。
    </p>
  ),
};

export const RouterLink = {
  render: () => <UI.Link render={<a href="#orders" data-router="" />}>全部訂單</UI.Link>,
};
