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
        ]}
      />
    </div>
  );
}
export const Default = { render: () => <D /> };
