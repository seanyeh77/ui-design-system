import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/LayerGraph', component: UI.LayerGraph };

const nodes = [
  { id: 'cli', name: 'src/cli', code: true, layer: 0, size: 34 },
  { id: 'server', name: 'src/server', code: true, layer: 0, size: 88 },
  { id: 'parser', name: 'src/parser', code: true, layer: 1, size: 61 },
  { id: 'net', name: 'src/net', code: true, layer: 1, size: 47 },
  { id: 'storage', name: 'src/storage', code: true, layer: 2, size: 52 },
  { id: 'metrics', name: 'src/metrics', code: true, layer: 2, size: 19 },
  { id: 'util', name: 'src/util', code: true, shared: true },
  { id: 'inc', name: 'include/common', code: true, shared: true },
];
const edges = [
  { from: 'cli', to: 'parser', count: 12 },
  { from: 'cli', to: 'net', count: 3 },
  { from: 'server', to: 'parser', count: 5 },
  { from: 'server', to: 'net', count: 18 },
  { from: 'parser', to: 'storage', count: 9 },
  { from: 'net', to: 'storage', count: 6 },
  { from: 'net', to: 'metrics', inferred: true, label: '經由 `on_packet` 回呼' },
  { from: 'parser', to: 'metrics', count: 2 },
  { from: 'server', to: 'metrics', count: 4 },
  { from: 'cli', to: 'util', count: 8 },
  { from: 'server', to: 'util', count: 20 },
  { from: 'net', to: 'util', count: 13 },
  { from: 'server', to: 'inc', count: 9 },
  { from: 'parser', to: 'inc', count: 8 },
];
// two labelled lines into one box: labels split left and right
const nodes2 = [
  { id: 'src/worker', name: 'src/worker', code: true, layer: 0, size: 91 },
  { id: 'src/ucx_ib_test', name: 'src/ucx_ib_test', code: true, layer: 0, size: 22 },
  { id: 'src/server', name: 'src/server', code: true, layer: 1, size: 114 },
  { id: 'src/common', name: 'src/common', code: true, shared: true },
];
const edges2 = [
  { from: 'src/worker', to: 'src/server', inferred: true, label: '環境變數 `APP_SHM`' },
  { from: 'src/ucx_ib_test', to: 'src/server', inferred: true, label: '攔截 17 個 `ucp` 呼叫' },
  { from: 'src/worker', to: 'src/common', count: 6 },
];
// two labelled lines on the left half of one box: the second label moves up a line
const nodes3 = [
  { id: 'a', name: 'src/loader', code: true, layer: 0, size: 12 },
  { id: 'b', name: 'src/hooks', code: true, layer: 0, size: 40 },
  { id: 'c', name: 'src/cli', code: true, layer: 0, size: 18 },
  { id: 'd', name: 'src/tools', code: true, layer: 0, size: 9 },
  { id: 't', name: 'src/runtime', code: true, layer: 1, size: 75 },
];
const edges3 = [
  { from: 'a', to: 't', inferred: true, label: '經由 `dlsym` 取得' },
  { from: 'b', to: 't', inferred: true, label: '函式指標表 `ops`' },
  { from: 'c', to: 't', count: 7 },
  { from: 'd', to: 't', count: 2 },
];
const card = { maxWidth: 640, padding: 16, marginBottom: 16, borderRadius: 'var(--radius-lg)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' };
function Demo() {
  const [s, setS] = React.useState<string | null>('net');
  return (
    <div>
      <div style={card}>
        <UI.LayerGraph labels={{ inferredText: '由規則推得，編譯器無法確認。' }} nodes={nodes} edges={edges} value={s} onChange={setS} />
      </div>
      <div style={card}>
        <UI.LayerGraph nodes={nodes2} edges={edges2} legend={false} />
      </div>
      <div style={card}>
        <UI.LayerGraph nodes={nodes3} edges={edges3} legend={false} />
      </div>
    </div>
  );
}
export const Default = { render: () => <Demo /> };

// Click a line (or its label) and the app shows its details beside the diagram. One inferred line and one plain call.
const nodes4 = [
  { id: 'worker', name: 'src/worker', code: true, layer: 0, size: 91 },
  { id: 'cli', name: 'src/cli', code: true, layer: 0, size: 18 },
  { id: 'lib', name: 'src/server', code: true, layer: 1, size: 114 },
];
const edges4 = [
  { id: 'shm', from: 'worker', to: 'lib', inferred: true, label: '環境變數 `APP_SHM`' },
  { from: 'cli', to: 'lib', count: 7 },
];
const DETAILS: Record<string, { label: string; value: React.ReactNode }[]> = {
  shm: [
    { label: '關係', value: '環境變數 APP_SHM' },
    { label: '設定', value: <UI.InlineCode href="#child.c:141">child.c:141</UI.InlineCode> },
    { label: '讀取', value: <UI.InlineCode href="#shm.c:58">shm.c:58</UI.InlineCode> },
  ],
  'cli->lib': [
    { label: '關係', value: '函式呼叫' },
    { label: '次數', value: '7 次' },
  ],
};
function SelectEdge() {
  const [box, setBox] = React.useState<string | null>(null);
  const [edge, setEdge] = React.useState<string | null>('shm');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ ...card, flex: '1 1 460px', minWidth: 0, marginBottom: 0 }}>
        <UI.LayerGraph nodes={nodes4} edges={edges4} value={box} onChange={setBox} selectedEdge={edge} onSelectEdge={setEdge} legend={false} />
      </div>
      <div style={{ ...card, flex: '1 1 260px', marginBottom: 0 }}>
        {edge ? <UI.DetailList items={DETAILS[edge]} /> : <span style={{ color: 'var(--ink-muted)' }}>選一條線查看細節。</span>}
      </div>
    </div>
  );
}
export const SelectEdges = { render: () => <SelectEdge /> };

// Only inferred lines, as in a diagram built from rules: the legend lists 「推測的關係」 alone.
const edges5 = [
  { from: 'worker', to: 'lib', inferred: true, label: '環境變數 `APP_SHM`' },
  { from: 'cli', to: 'lib', inferred: true, label: '攔截 17 個 `ucp` 呼叫' },
];
export const InferredOnly = {
  render: () => (
    <div style={card}>
      <UI.LayerGraph labels={{ size: '{n} 個函式', inferredText: '由規則推得，編譯器無法確認。' }} nodes={nodes4} edges={edges5} />
    </div>
  ),
};

// TAW: short tags beside the names; in a 680 px card three boxes in a row cut the names first, never the tags.
const tagged = [
  { id: 'ctrl', name: 'controller.py', code: true, layer: 0, size: 88, tag: '可修改' },
  { id: 'route', name: 'routing.py', code: true, layer: 0, size: 64, tag: '受保護', tagTone: 'warning' as const },
  { id: 'topo', name: 'topology_builder.py', code: true, layer: 0, size: 41, tag: '可修改' },
  { id: 'oracle', name: 'harness/oracle.py', code: true, layer: 1, size: 120, tag: '受保護', tagTone: 'warning' as const },
  { id: 'runner', name: 'experiment_runner.py', code: true, layer: 1, size: 23 },
  { id: 'grader', name: 'grader.py', code: true, layer: 1, size: 18, tag: '受保護', tagTone: 'warning' as const },
];
export const Tags = {
  render: () => (
    <div style={{ ...card, maxWidth: 680 }}>
      <UI.LayerGraph
        labels={{ size: '{n} 個函式' }}
        nodes={tagged}
        edges={[
          { from: 'ctrl', to: 'oracle', count: 14 },
          { from: 'route', to: 'oracle', count: 6 },
          { from: 'topo', to: 'runner', count: 3 },
        ]}
      />
    </div>
  ),
};

// A phone-width box: the diagram scrolls, with the fade on the right and the hint under it, clear of the boxes.
export const Narrow = {
  render: () => (
    <div style={{ ...card, maxWidth: 326 }}>
      <UI.LayerGraph labels={{ size: '{n} 個函式' }} nodes={nodes4} edges={edges4} />
    </div>
  ),
};

// Shared items are boxes under the diagram, selected like the others: the boxes that use it say how often.
const nodes6 = [...nodes4, { id: 'common', name: 'src/common', code: true, shared: true }, { id: 'inc', name: 'include/app.h', code: true, shared: true }];
const edges6 = [
  ...edges4,
  { from: 'worker', to: 'common', count: 6 },
  { from: 'lib', to: 'common', count: 3 },
  { from: 'worker', to: 'inc', count: 2 },
  { from: 'cli', to: 'inc', count: 1 },
  { from: 'lib', to: 'inc', count: 9 },
];
function SharedSelect() {
  const [s, setS] = React.useState<string | null>('common');
  return (
    <div style={card}>
      <UI.LayerGraph
        labels={{ size: '{n} 個函式', shared: '共用元件', sharedMeta: '{a} 個元件使用，共 {b} 次' }}
        nodes={nodes6}
        edges={edges6}
        value={s}
        onChange={setS}
      />
    </div>
  );
}
export const SharedItems = { render: () => <SharedSelect /> };

// A data channel back up: src/server hands events to src/worker through src/common's ring. The line leaves the
// source's side, runs up a lane beside the boxes and enters the target's side; the diagram widens for it.
const nodes7 = [
  { id: 'worker', name: 'src/worker', code: true, layer: 0, size: 91 },
  { id: 'cli', name: 'src/cli', code: true, layer: 0, size: 18 },
  { id: 'ucx', name: 'src/ucx_ib_test', code: true, layer: 0, size: 22 },
  { id: 'lib', name: 'src/server', code: true, layer: 1, size: 114 },
];
const upLine = { id: 'ring', from: 'lib', to: 'worker', inferred: true, label: '經由 `src/common` 傳資料（ring）' };
function UpLine() {
  const [edge, setEdge] = React.useState<string | null>(null);
  return (
    <div style={{ ...card, maxWidth: 900 }}>
      <UI.LayerGraph
        labels={{ size: '{n} 個函式' }}
        nodes={nodes7}
        edges={[{ from: 'cli', to: 'lib', count: 7 }, { from: 'ucx', to: 'lib', count: 3 }, upLine]}
        selectedEdge={edge}
        onSelectEdge={setEdge}
      />
    </div>
  );
}
export const UpwardInferred = { render: () => <UpLine /> };

// The same pair both ways: the environment variable down, the data channel back up.
function BothWays() {
  const [box, setBox] = React.useState<string | null>(null);
  const [edge, setEdge] = React.useState<string | null>('ring');
  return (
    <div style={{ ...card, maxWidth: 900 }}>
      <UI.LayerGraph
        labels={{ size: '{n} 個函式' }}
        nodes={nodes4}
        edges={[...edges4, upLine]}
        value={box}
        onChange={setBox}
        selectedEdge={edge}
        onSelectEdge={setEdge}
      />
    </div>
  );
}
export const BothDirections = { render: () => <BothWays /> };

// The same pair both ways in a phone-width box: the label of the line up stays off the line down. It goes on one line
// when a spot is clear, else on 2 to 4 lines, else the gap between the layers grows.
const nodes8 = [
  { id: 'worker', name: 'src/worker', code: true, layer: 0, size: 91 },
  { id: 'ucx', name: 'src/ucx_ib_test', code: true, layer: 0, size: 22 },
  { id: 'lib', name: 'src/server', code: true, layer: 1, size: 114 },
  { id: 'common', name: 'src/common', code: true, shared: true },
];
const edges8 = [
  { id: 'env', from: 'worker', to: 'lib', inferred: true, label: '環境變數 `APP_SHM`' },
  { id: 'hook', from: 'ucx', to: 'lib', inferred: true, label: '攔截 17 個 `ucp` 呼叫' },
  { from: 'worker', to: 'common', count: 6 },
  upLine,
];
function BothWaysNarrow() {
  const [edge, setEdge] = React.useState<string | null>(null);
  return (
    <div style={{ ...card, maxWidth: 358 }}>
      <UI.LayerGraph labels={{ size: '{n} 個函式' }} nodes={nodes8} edges={edges8} selectedEdge={edge} onSelectEdge={setEdge} />
    </div>
  );
}
export const BothDirectionsNarrow = { render: () => <BothWaysNarrow /> };

// A box outside the repository (external): above every layer, dashed, 「repo 外」 under the name, no size bar. Its lines
// work like any other; here three intercepted calls into the library, and the library's line back up to the program.
const nodes9 = [
  { id: 'app', name: '被追蹤的程式', external: true },
  { id: 'worker', name: 'src/worker', code: true, layer: 0, size: 91 },
  { id: 'lib', name: 'src/server', code: true, layer: 1, size: 114 },
  { id: 'common', name: 'src/common', code: true, shared: true },
];
const edges9 = [
  { id: 'verbs', from: 'app', to: 'lib', inferred: true, label: '攔截 `verbs`' },
  { id: 'ucp', from: 'app', to: 'lib', inferred: true, label: '攔截 `ucp`' },
  { id: 'uct', from: 'app', to: 'lib', inferred: true, label: '攔截 `uct`' },
  { id: 'env', from: 'worker', to: 'lib', inferred: true, label: '環境變數 `APP_SHM`' },
  { from: 'worker', to: 'common', count: 6 },
  { from: 'lib', to: 'common', count: 7 },
];
function External() {
  const [sel, setSel] = React.useState<string | null>(null);
  const [edge, setEdge] = React.useState<string | null>(null);
  return (
    <div style={card}>
      <UI.LayerGraph labels={{ size: '{n} 個函式' }} nodes={nodes9} edges={edges9} value={sel} onChange={setSel} selectedEdge={edge} onSelectEdge={setEdge} />
    </div>
  );
}
export const ExternalBox = { render: () => <External /> };
function HoverLabels() {
  const [edge, setEdge] = React.useState<string | null>(null);
  return (
    <div style={card}>
      <UI.LayerGraph
        labels={{ size: '{n} 個函式' }}
        nodes={nodes9}
        edges={edges9}
        selectedEdge={edge}
        onSelectEdge={setEdge}
        edgeLabels="hover"
        storageKey="labels-on-hover"
      />
    </div>
  );
}
/** edgeLabels="hover": line labels appear while a line is hovered, focused or selected. */
export const LabelsOnHover = { render: () => <HoverLabels /> };
