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
  type DataTableColumn,
  type NavSection,
} from '@seanyeh77/ui';

/* A list of records with an edit drawer: click a row's pencil to edit it in place; closing with
   unsaved changes asks first. Replace Item and the fields with yours. */

export interface Item {
  id: string;
  name: string;
  owner: string;
  status: 'draft' | 'doing' | 'review' | 'done' | 'fail';
  note: string;
}

export interface ListDetailProps {
  items: Item[];
  owners: string[];
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

export function ListDetail({ items, owners, onSave }: ListDetailProps) {
  const [editing, setEditing] = React.useState<Item | null>(null);
  const [draft, setDraft] = React.useState<Item | null>(null);
  const dirty = !!editing && JSON.stringify(editing) !== JSON.stringify(draft);
  const open = (it: Item) => {
    setEditing(it);
    setDraft(it);
  };
  const close = () => {
    setEditing(null);
    setDraft(null);
  };
  const set = <K extends keyof Item>(k: K, v: Item[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const columns: DataTableColumn<Item>[] = [
    { key: 'name', label: '名稱', width: 200 },
    { key: 'owner', label: '負責人' },
    { key: 'status', label: '狀態', render: (r) => <Badge status={r.status} />, mobile: 'status' },
    { key: 'note', label: '備註', long: true, grow: 2 },
  ];
  return (
    <AppShell nav={NAV} value="items" onNavigate={() => {}} brand="專案中心" title="項目">
      <Page>
        <Card padding={false}>
          <DataTable
            columns={columns}
            rows={items}
            rowActions={(r) => <IconButton icon="pencil-simple" label={`編輯 ${r.name}`} onClick={() => open(r)} />}
            urlKey="items"
          />
        </Card>
      </Page>
      <Drawer
        open={!!editing}
        onClose={close}
        dirty={dirty}
        title={editing ? `編輯 ${editing.name}` : ''}
        actions={(requestClose) => (
          <>
            <Button onClick={requestClose}>取消</Button>
            <Button
              variant="primary"
              disabled={!dirty || !draft?.name.trim()}
              onClick={() => {
                if (draft) onSave(draft);
                close();
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
              onChange={(e) => set('name', e.target.value)}
              error={draft.name.trim() ? undefined : '名稱不能空白，請輸入專案名稱。'}
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
