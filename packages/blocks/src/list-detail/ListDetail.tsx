import * as React from 'react';
import {
  AppShell,
  Badge,
  Button,
  Card,
  DataTable,
  Drawer,
  FormGrid,
  IconButton,
  Page,
  Select,
  TextArea,
  TextField,
  toast,
  type DataTableColumn,
  type NavSection,
} from '@seanyeh77/ui';

/* A list page: the title once (top bar), the list in one Card, the page's one primary action (新增) at the end of the
   summary row (DataTable's action), the count in the table's toolbar. Hover a row (or tab to it) and click its pencil to
   edit it in a drawer; closing with unsaved changes asks first. Replace Item and the fields with yours. */

export interface Item {
  id: string;
  name: string;
  owner: string;
  status: 'draft' | 'doing' | 'review' | 'done' | 'fail';
  note: string;
  /** Last change; shown as relative time within a week. */
  updated: Date;
}

export interface ListDetailProps {
  items: Item[];
  owners: string[];
  /** A new item has id ''; give it an id when you store it. */
  onSave: (item: Item) => void;
}

const NAV: NavSection[] = [
  {
    items: [
      { id: 'items', label: '項目', icon: 'list-bullets' },
      { id: 'settings', label: '設定', icon: 'gear' },
    ],
  },
];
const STATUS_OPTIONS: { value: Item['status']; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'doing', label: '進行中' },
  { value: 'review', label: '審核中' },
  { value: 'done', label: '完成' },
  { value: 'fail', label: '失敗' },
];

// The summary: 「全部」, then the state that needs attention, then the rest.
const statusLabel = (s: Item['status']) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
const SUMMARY = (['fail', 'review', 'doing', 'done', 'draft'] as const).map((v) => ({ value: v, label: statusLabel(v) }));

export function ListDetail({ items, owners, onSave }: ListDetailProps) {
  const [editing, setEditing] = React.useState<Item | null>(null);
  const [draft, setDraft] = React.useState<Item | null>(null);
  // The name's error shows once the field is left (blur), not on every key, as the form rules say.
  const [nameLeft, setNameLeft] = React.useState(false);
  const dirty = !!editing && JSON.stringify(editing) !== JSON.stringify(draft);
  const open = (it: Item) => {
    setEditing(it);
    setDraft(it);
  };
  const close = () => {
    setEditing(null);
    setDraft(null);
    setNameLeft(false);
  };
  const create = () => open({ id: '', name: '', owner: owners[0] ?? '', status: 'draft', note: '', updated: new Date() });
  const set = <K extends keyof Item>(k: K, v: Item[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const columns: DataTableColumn<Item>[] = [
    { key: 'name', label: '名稱' },
    { key: 'owner', label: '負責人' },
    { key: 'status', label: '狀態', render: (r) => <Badge status={r.status} />, searchText: (r) => statusLabel(r.status), mobile: 'status' },
    { key: 'note', label: '備註', long: true },
    { key: 'updated', label: '更新', format: 'relative' },
  ];
  return (
    <AppShell nav={NAV} value="items" onNavigate={() => {}} brand="專案中心" title="項目">
      <Page>
        <Card padding={false}>
          <DataTable
            label="項目"
            columns={columns}
            rows={items}
            summary={{ key: 'status', items: SUMMARY }}
            action={
              <Button variant="primary" icon="plus" onClick={create}>
                新增
              </Button>
            }
            rowActions={(r) => <IconButton variant="quiet" icon="pencil-simple" label={`編輯 ${r.name}`} onClick={() => open(r)} />}
            urlKey="items"
          />
        </Card>
      </Page>
      <Drawer
        open={!!editing}
        onOpenChange={(o) => !o && close()}
        dirty={dirty}
        title={!editing ? '' : editing.id ? `編輯 ${editing.name}` : '新增項目'}
        actions={(requestClose) => (
          <>
            <Button onClick={requestClose}>取消</Button>
            <Button
              variant="primary"
              disabled={!dirty || !draft?.name.trim()}
              onClick={() => {
                if (draft) onSave({ ...draft, updated: new Date() });
                close();
                // AppShell shows the toast; no Toaster of its own is needed.
                toast(draft?.id ? '已儲存' : '已新增');
              }}
            >
              儲存
            </Button>
          </>
        )}
      >
        {draft ? (
          <FormGrid>
            <TextField
              label="名稱"
              required
              value={draft.name}
              onChange={(v) => set('name', v)}
              onBlur={() => setNameLeft(true)}
              error={nameLeft && !draft.name.trim() ? '名稱不能空白，請輸入專案名稱。' : undefined}
            />
            <Select label="負責人" value={draft.owner} options={owners.map((o) => ({ value: o, label: o }))} onChange={(v) => set('owner', v)} />
            <Select label="狀態" value={draft.status} options={STATUS_OPTIONS} onChange={(v) => set('status', v)} />
            <TextArea label="備註" value={draft.note} onChange={(v) => set('note', v)} />
          </FormGrid>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
