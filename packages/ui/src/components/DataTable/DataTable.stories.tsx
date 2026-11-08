import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/DataTable', component: UI.DataTable };

const NAMES = [
  '叢集監控',
  '帳號整合',
  '資料備份',
  '成本報表',
  '日誌搜尋',
  '告警通知',
  '權限管理',
  '容器部署',
  '效能分析',
  '使用者回饋',
  'API 閘道',
  '排程系統',
  '檔案上傳',
  '計費模組',
  '行動版首頁',
  '搜尋最佳化',
  '設計系統',
  '資料匯入',
  '安全稽核',
  '文件網站',
  '模型推論',
  '儲存擴充',
  '網路拓樸',
  '測試平台',
];
const OWN = ['王小明', '李小華', '陳大同', '林美玲', '張志豪', '黃雅婷'],
  ST: UI.BadgeStatus[] = ['draft', 'doing', 'review', 'done', 'fail'];
const rows = NAMES.map((n, i) => {
  return {
    id: i + 1,
    name: n,
    owner: OWN[(i * 5 + 1) % 6],
    status: ST[(i * 7 + 2) % 5],
    progress: [12, 64, 88, 100, 40, 25, 72, 100, 55, 90, 33, 100, 8, 61, 100, 47, 79, 18, 100, 66, 52, 95, 30, 84][i],
    budget: (((i * 137) % 23) + 2) * 85000,
    // 2026/10/01 to 2026/11/04, one per row
    updated: '2026-' + (i < 10 ? '10-' + String(i * 3 + 1).padStart(2, '0') : '11-0' + ((i % 4) + 1)),
  };
});
const STL: Record<UI.BadgeStatus, string> = { draft: '草稿', doing: '進行中', review: '審核中', done: '完成', fail: '失敗' };
function D() {
  return (
    <div style={{ padding: 20 }}>
      <UI.DataTable
        caption="專案"
        rows={rows}
        selectable={true}
        search={{ placeholder: '搜尋名稱、負責人、狀態' }}
        filters={[
          {
            key: 'status',
            label: '狀態',
            options: ST.map((s) => {
              return { value: s, label: STL[s] };
            }),
          },
          { key: 'owner', label: '負責人' },
          { key: 'budget', label: '預算', type: 'range', scale: 10000, unitLabel: '單位：萬' },
        ]}
        totals={{ budget: 'sum', progress: 'avg' }}
        bulkActions={(ids, clear) => {
          return [
            <UI.Button key="e" variant="secondary" onClick={clear}>
              匯出
            </UI.Button>,
            <UI.Button key="d" variant="danger" confirm={{ title: '刪除選取的專案？' }} onClick={clear}>
              刪除
            </UI.Button>,
          ];
        }}
        rowActions={(r) => {
          return [<UI.IconButton key="e" label={'編輯 ' + r.name} icon={'pencil-simple'} />, <UI.IconButton key="d" label={'刪除 ' + r.name} icon={'trash'} />];
        }}
        columns={[
          {
            key: 'name',
            label: '名稱',
            width: 140,
            grow: 1.6,
            render(r) {
              return <strong>{r.name}</strong>;
            },
          },
          { key: 'owner', label: '負責人', width: 96 },
          {
            key: 'status',
            label: '狀態',
            width: 120,
            sortValue(r) {
              return ST.indexOf(r.status);
            },
            searchText(r) {
              return STL[r.status];
            },
            render(r) {
              return <UI.Badge status={r.status} />;
            },
          },
          { key: 'progress', label: '進度', format: 'percent', decimals: 0, unit: '%' },
          { key: 'budget', label: '預算', format: 'money', width: 132 },
          // Off at first: turn it on in 「欄位」.
          { key: 'updated', label: '更新日期', format: 'date', hidden: true, width: 150 },
        ]}
      />
    </div>
  );
}
export const Default = { render: () => <D /> };

// A results list on one page: the summary counts carry their unit, and the count above the table is the only count
// (no 「第 1–6 筆，共 6 筆」 below it).
const NOTES = [
  { id: 'n1', loc: 'src/ibmon/main.c:42', text: '找不到 child.c，完整路徑應為 src/ibmon/child.c:86', status: 'fail' },
  { id: 'n2', loc: 'src/libibtrace/shm.c:58', text: '環境變數 IBTRACE_SHM 由 child.c:141 設定，在這裡讀取', status: 'review' },
  { id: 'n3', loc: 'src/cli/args.c:17', text: '參數順序與說明文件一致', status: 'done' },
  { id: 'n4', loc: 'src/libibtrace/hooks/ops.c:74', text: 'ops 表格的第 3 項是 NULL，請在 ops.c:70 加上判斷', status: 'fail' },
  { id: 'n5', loc: 'include/ibtrace.h:12', text: '巨集名稱重複定義', status: 'review' },
  { id: 'n6', loc: 'src/ibmon/child.c:141', text: '設定 IBTRACE_SHM', status: 'done' },
];
const NOTE_STATUS: Record<UI.BadgeStatus, string> = { draft: '草稿', doing: '進行中', fail: '錯誤', review: '要確認', done: '通過' };
export const OnePageSummary = {
  render: () => (
    <div style={{ maxWidth: 960 }}>
      <UI.DataTable
        caption="檢查筆記"
        rows={NOTES}
        urlSync={false}
        summary={{
          key: 'status',
          unit: '則',
          items: [
            { value: 'fail', label: '錯誤' },
            { value: 'review', label: '要確認' },
          ],
        }}
        columns={[
          { key: 'loc', label: '位置', width: 220, render: (r) => <UI.InlineCode href={'#' + r.loc}>{r.loc}</UI.InlineCode>, searchText: (r) => r.loc },
          { key: 'text', label: '說明', long: true, grow: 2 },
          {
            key: 'status',
            label: '狀態',
            width: 120,
            mobile: 'status',
            render: (r) => <UI.Badge status={r.status as UI.BadgeStatus}>{NOTE_STATUS[r.status as UI.BadgeStatus]}</UI.Badge>,
            searchText: (r) => NOTE_STATUS[r.status as UI.BadgeStatus],
          },
        ]}
      />
    </div>
  ),
};

// A table beside a 440 px detail panel: about 530 px left for five columns. It scrolls, with a fade on the right and a
// 「左右滑動」 hint under it.
const CALLERS = [
  { id: 'c1', fn: 'ibtrace_init', file: 'src/libibtrace/init.c', n: 12, via: '直接呼叫', dist: 1 },
  { id: 'c2', fn: 'shm_open_ring', file: 'src/libibtrace/shm.c', n: 7, via: '函式指標', dist: 2 },
  { id: 'c3', fn: 'child_spawn', file: 'src/ibmon/child.c', n: 4, via: '直接呼叫', dist: 1 },
  { id: 'c4', fn: 'ucp_hook_progress', file: 'src/libibtrace/hooks/ops.c', n: 17, via: '攔截', dist: 3 },
];
export const BesidePanel = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start', maxWidth: 1000 }}>
      <div style={{ flex: '1 1 300px', minWidth: 0 }}>
        <UI.DataTable
          caption="呼叫者"
          rows={CALLERS}
          urlSync={false}
          search={false}
          columns={[
            { key: 'fn', label: '函式', width: 160 },
            { key: 'file', label: '檔案', width: 220, render: (r) => <UI.InlineCode href={'#' + r.file}>{r.file}</UI.InlineCode>, searchText: (r) => r.file },
            { key: 'n', label: '呼叫次數', numeric: true, unit: '次', width: 112 },
            { key: 'via', label: '經由', width: 120 },
            { key: 'dist', label: '距離', numeric: true, unit: '層', width: 96 },
          ]}
        />
      </div>
      <div
        style={{ flex: '0 1 440px', minWidth: 0, padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}
      >
        <UI.DetailList
          items={[
            { label: '函式', value: 'ibtrace_init' },
            { label: '檔案', value: 'src/libibtrace/init.c' },
          ]}
        />
      </div>
    </div>
  ),
};
