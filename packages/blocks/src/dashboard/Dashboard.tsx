import * as React from 'react';
import {
  AppShell,
  Badge,
  Card,
  DataTable,
  DateRangePicker,
  Grid,
  KpiCard,
  LineChart,
  NotificationBell,
  Page,
  Tag,
  type DataTableColumn,
  type KpiCardProps,
  type NavSection,
  type NotificationItem,
} from '@seanyeh77/ui';

/* Dashboard: KPI cards, one trend chart and the table of records, inside the app frame.
   Replace the sample data with yours and drop the 「示範資料」 tag once the figures are real; keep the order (period,
   figures, trend, records). KPIs show only
   figures the table cannot: its summary already counts the projects per status. Give every KPI a sparkline (spark)
   or none, so the cards line up. */

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

const STATUS_LABEL: Record<ProjectRow['status'], string> = { draft: '草稿', doing: '進行中', review: '審核中', done: '完成', fail: '失敗' };

const COLUMNS: DataTableColumn<ProjectRow>[] = [
  { key: 'name', label: '名稱' },
  { key: 'owner', label: '負責人' },
  { key: 'status', label: '狀態', render: (r) => <Badge status={r.status} />, searchText: (r) => STATUS_LABEL[r.status], mobile: 'status' },
  { key: 'progress', label: '進度', numeric: true, unit: '%' },
  { key: 'budget', label: '預算', format: 'money' },
  { key: 'updated', label: '更新', format: 'relative' },
];

// The last 30 days, today included.
function last30(): [Date, Date] {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  return [new Date(end.getFullYear(), end.getMonth(), end.getDate() - 29), end];
}

export function Dashboard({ kpis, trend, rows, notifications }: DashboardProps) {
  const [page, setPage] = React.useState('overview');
  // The period every figure below covers: at the top of the content, before the first row of cards.
  const [range, setRange] = React.useState<[Date | null, Date | null]>(last30);
  return (
    <AppShell
      nav={NAV}
      value={page}
      onNavigate={setPage}
      brand="專案中心"
      title="總覽"
      tags={<Tag icon="info">示範資料</Tag>}
      actions={<NotificationBell items={notifications} />}
    >
      <Page>
        <DateRangePicker label="期間" hideLabel value={range} onChange={setRange} />
        <Grid columns={4}>
          {kpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </Grid>
        <Card title="每週完成的任務">
          <LineChart label="每週完成的任務" labels={trend.labels} series={trend.series} unit="個" />
        </Card>
        {/* A short table on an overview: the summary tabs only, no search, filter or sort row (headings still sort). */}
        <Card title="專案" padding={false}>
          <DataTable
            label="專案"
            toolbar={false}
            columns={COLUMNS}
            rows={rows}
            summary={{
              key: 'status',
              items: [
                { value: 'fail', label: '失敗' },
                { value: 'review', label: '審核中' },
                { value: 'doing', label: '進行中' },
                { value: 'done', label: '完成' },
                { value: 'draft', label: '草稿' },
              ],
              unit: '個',
            }}
            urlKey="projects"
          />
        </Card>
      </Page>
    </AppShell>
  );
}
