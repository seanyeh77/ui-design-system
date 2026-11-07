import * as React from 'react';
import {
  AppShell,
  Badge,
  Card,
  DataTable,
  Grid,
  KpiCard,
  LineChart,
  NotificationBell,
  Page,
  type DataTableColumn,
  type KpiCardProps,
  type NavSection,
  type NotificationItem,
} from '@seanyeh77/ui';

/* Dashboard: KPI cards, one trend chart and the table of records, inside the app frame.
   Replace the sample data with yours; keep the order (figures, trend, records). */

export interface ProjectRow {
  id: string;
  name: string;
  owner: string;
  status: 'draft' | 'doing' | 'review' | 'done' | 'fail';
  progress: number;
  budget: number;
  updated: Date;
}

export interface DashboardProps {
  kpis: KpiCardProps[];
  trend: { labels: string[]; series: { name: string; values: number[] }[] };
  rows: ProjectRow[];
  notifications: NotificationItem[];
}

const NAV: NavSection[] = [
  {
    items: [
      { id: 'overview', label: '總覽', icon: 'house' },
      { id: 'projects', label: '專案', icon: 'folder' },
      { id: 'reports', label: '報表', icon: 'chart-bar' },
    ],
  },
  { items: [{ id: 'settings', label: '設定', icon: 'gear' }] },
];

const COLUMNS: DataTableColumn<ProjectRow>[] = [
  { key: 'name', label: '名稱', width: 180 },
  { key: 'owner', label: '負責人' },
  { key: 'status', label: '狀態', render: (r) => <Badge status={r.status} />, mobile: 'status' },
  { key: 'progress', label: '進度', numeric: true, unit: '%' },
  { key: 'budget', label: '預算', format: 'money' },
  { key: 'updated', label: '更新', format: 'relative' },
];

export function Dashboard({ kpis, trend, rows, notifications }: DashboardProps) {
  const [page, setPage] = React.useState('overview');
  return (
    <AppShell nav={NAV} value={page} onNavigate={setPage} brand="專案中心" title="總覽" actions={<NotificationBell items={notifications} />}>
      <Page>
        <Grid columns={4}>
          {kpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </Grid>
        <Card title="每週完成的任務">
          <LineChart label="每週完成的任務" labels={trend.labels} series={trend.series} unit="個" />
        </Card>
        <Card title="專案" padding={false}>
          <DataTable
            columns={COLUMNS}
            rows={rows}
            summary={{
              key: 'status',
              items: [
                { value: 'fail', label: '失敗' },
                { value: 'review', label: '審核中' },
                { value: 'doing', label: '進行中' },
                { value: 'done', label: '完成' },
              ],
            }}
            urlKey="projects"
          />
        </Card>
      </Page>
    </AppShell>
  );
}
