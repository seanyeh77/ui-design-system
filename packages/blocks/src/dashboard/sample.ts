import type { DashboardProps, ProjectRow } from './Dashboard';

const NAMES = ['網站改版', '叢集監控', '課程平台', '帳務整合', '資料備份', '權限管理', '告警通知', '成本報表'];
const OWNERS = ['王小明', '李小華', '陳大同', '林美玲'];
const STATUS: ProjectRow['status'][] = ['doing', 'review', 'done', 'fail', 'draft'];
const now = new Date(2026, 10, 4, 15, 0);

export const sample: DashboardProps = {
  kpis: [
    { label: '本月營收', value: 12840000, format: 'money', delta: 8.2, spark: [8, 9, 9.5, 10, 11, 12.8] },
    { label: '進行中專案', value: 18, unit: '個', delta: -5.3, good: false },
    { label: '準時完成率', value: 92.4, format: 'percent', unit: '%', delta: 1.8, deltaUnit: 'pt' },
    { label: '平均回應時間', value: 184, unit: 'ms', delta: -12.5, good: true },
  ],
  trend: { labels: ['第 1 週', '第 2 週', '第 3 週', '第 4 週', '第 5 週', '第 6 週'], series: [{ name: '完成', values: [12, 18, 15, 22, 26, 24] }] },
  rows: NAMES.map((name, i) => ({
    id: String(i + 1),
    name,
    owner: OWNERS[i % OWNERS.length],
    status: STATUS[i % STATUS.length],
    progress: [64, 88, 100, 40, 12, 72, 55, 100][i],
    budget: (i + 2) * 85000,
    updated: new Date(now.getTime() - (i + 1) * 5 * 3600 * 1000),
  })),
  notifications: [
    { id: 1, title: '叢集監控 部署失敗', body: 'node-3 超過 5 分鐘沒有回應', time: '10 分鐘前', group: '今天' },
    { id: 2, title: '李小華 提到了你', body: '「預算表請幫忙看一下」', time: '1 小時前', group: '今天', read: true },
  ],
};
