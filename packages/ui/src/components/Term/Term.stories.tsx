import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/Term', component: UI.Term };

export const Default = {
  render: () => (
    <div style={{ maxWidth: 560, fontSize: 15 }}>
      <p style={{ marginTop: 0 }}>
        {'起點經過 2 個 '}
        <UI.Term text="一個 `.c` 檔加上它 include 的標頭檔，編譯器一次處理的單位。">translation unit</UI.Term>
        {'，其中原本的 post_send 是 '}
        <UI.Term text="程式啟動時先載入 ibtrace，以同名函式取代原本函式庫的版本。">LD_PRELOAD 攔截</UI.Term>
        {' 來的。'}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 500 }}>原本的 post_send</span>
        <UI.Tag>
          <UI.Term
            title="推測（規則）"
            text="經由 `h->post_send` 呼叫，由規則推得，編譯器無法確認。"
            code=" 74 │ ret = h->post_send(qp, wr, bad_wr);"
            action={{ label: '看這一行' }}
          >
            推測（規則）
          </UI.Term>
        </UI.Tag>
      </div>
    </div>
  ),
};
