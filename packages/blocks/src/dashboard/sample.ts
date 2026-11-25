import type { DashboardProps, ProjectRow } from './Dashboard';

const NAMES = ['網站改版', '叢集監控', '課程平台', '帳務整合', '資料備份', '權限管理', '告警通知', '成本報表'];
const OWNERS = ['王小明', '李小華', '陳大同', '林美玲'];
const STATUS: ProjectRow['status'][] = ['doing', 'review', 'done', 'fail', 'draft'];
// Relative to today, so the figures cover the dashboard's default period (the last 30 days, today included).
const now = new Date();
const DAYS = Array.from({ length: 30 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29 + i));
const DONE = [3, 2, 4, 3, 5, 1, 2, 4, 3, 4, 6, 2, 1, 3, 5, 4, 3, 5, 2, 2, 4, 6, 5, 3, 4, 5, 3, 2, 4, 6];

export const sample: DashboardProps = {
  kpis: [
    { label: '營收', value: 12840000, format: 'money', delta: 8.2, spark: [8, 9, 9.5, 10, 11, 12.8] },
    { label: '預算使用率', value: 74.5, format: 'percent', unit: '%', delta: 3.1, deltaUnit: 'pt', direction: 'down', spark: [58, 61, 63, 66, 71.4, 74.5] },
    { label: '準時完成率', value: 92.4, format: 'percent', unit: '%', delta: 1.8, deltaUnit: 'pt', spark: [88, 89.5, 90.1, 89.8, 90.6, 92.4] },
    { label: '平均回應時間', value: 184, unit: 'ms', delta: -12.5, direction: 'down', spark: [230, 221, 214, 206, 210, 184] },
  ],
  trend: { labels: DAYS.map((d) => `${d.getMonth() + 1}/${d.getDate()}`), series: [{ name: '完成', values: DONE }] },
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
