import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/InlineCode', component: UI.InlineCode };

const rows: { id: number; loc: string; st: 'done' | 'review' | 'fail'; note: string; expl: string }[] = [
  { id: 3, loc: 'notes.md:3', st: 'done', note: '`worker_spawn` 在 `child.c:86` 設定 `APP_SHM`', expl: '行號存在，該行提到 `APP_SHM`。' },
  {
    id: 4,
    loc: 'notes.md:4',
    st: 'review',
    note: '`app_attach` 是 constructor，在 `trace.c:321-322`',
    expl: '行號存在，但該行沒有 constructor 屬性。請確認是否指 `trace.c:318`。',
  },
  { id: 7, loc: 'notes.md:7', st: 'fail', note: '`ring_push` 在 `ring.c:140` 寫入共享記憶體', expl: '`ring.c` 只有 128 行，行號超出檔案。' },
  { id: 9, loc: 'notes.md:9', st: 'done', note: '`APP_SHM` 由 `env.c:22` 讀取', expl: '行號存在，該行讀取 `APP_SHM`。' },
  {
    id: 12,
    loc: 'notes.md:12',
    st: 'fail',
    note: '`flush_ring` 在 `ring.c:96` 把資料寫回檔案，並在結束前呼叫 `msync` 確保資料寫到磁碟',
    expl: '該行找不到 `flush_ring`；最接近的定義在 `ring.c:104`。',
  },
];
const L = { done: '正確', review: '要確認', fail: '錯誤' } as const;
function Demo() {
  const [note, setNote] = React.useState('');
  const open = (ref: string) => {
    setNote('開啟 ' + ref);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0 }}>
        <UI.CodeText text="`worker_spawn` 在 `child.c:86` 設定 `APP_SHM`，由 `env.c:22` 讀取。" onRef={open} />
      </p>
      <UI.DataTable
        label="檢查結果"
        rows={rows}
        search={false}
        columnMenu={false}
        urlSync={false}
        summary={{
          key: 'st',
          items: [
            { value: 'fail', label: '錯誤' },
            { value: 'review', label: '要確認' },
            { value: 'done', label: '正確' },
          ],
        }}
        columns={[
          {
            key: 'loc',
            label: '位置',
            width: 120,
            mobile: 'title',
            render(r) {
              return (
                <UI.InlineCode
                  onClick={() => {
                    open(r.loc);
                  }}
                >
                  {r.loc}
                </UI.InlineCode>
              );
            },
          },
          {
            key: 'note',
            label: '筆記內容',
            width: 240,
            grow: 2,
            long: true,
            render(r) {
              return <UI.CodeText text={r.note} onRef={open} />;
            },
          },
          {
            key: 'st',
            label: '結果',
            width: 110,
            mobile: 'status',
            render(r) {
              return <UI.Badge status={r.st}>{L[r.st]}</UI.Badge>;
            },
          },
          {
            key: 'expl',
            label: '說明',
            width: 240,
            grow: 2,
            long: true,
            render(r) {
              return <UI.CodeText text={r.expl} onRef={open} />;
            },
          },
        ]}
      />
      <div style={{ minHeight: 20, fontSize: 13, color: 'var(--ink-muted)' }}>{note}</div>
    </div>
  );
}
export const Default = { render: () => <Demo /> };

export const NameAndLocation = {
  render: () => (
    <p style={{ margin: 0, maxWidth: 640 }}>
      <UI.InlineCode look="name" href="#fn/_sync_as">
        VirtualRouter._sync_as
      </UI.InlineCode>{' '}
      <UI.InlineCode look="location" href="#harness/controller.py:540">
        harness/controller.py:540
      </UI.InlineCode>{' '}
      每 5 秒同步一次路由；環境變數 <UI.InlineCode>APP_SHM</UI.InlineCode> 決定共用記憶體的名稱。
    </p>
  ),
};
