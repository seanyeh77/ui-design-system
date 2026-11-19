import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/CodeView', component: UI.CodeView };

const code = [
  'int trace_post_send(struct ibv_qp *qp, struct ibv_send_wr *wr, struct ibv_send_wr **bad_wr)',
  '{',
  '    struct ibt_hook_context *h = ibt_hook_context_get(qp->context, IBT_HOOK_POST_SEND, __func__);',
  '    int ret;',
  '    ibt_span_begin(ctx, OP_POST_SEND);',
  '    ret = h->post_send(qp, wr, bad_wr); /* original */',
  '    ibt_span_end_args(ctx, OP_POST_SEND, wr->num_sge, ret);',
  '    return ret;',
  '}',
].join('\n');
export const Default = {
  render: () => (
    <div style={{ maxWidth: 620 }}>
      <UI.CodeView file="src/libibtrace/hooks/ops.c" fileHref="#" code={code} start={70} target={75} />
    </div>
  ),
};

// A narrow column: long lines wrap; the continuation has a bar in its indent and never splits an operator.
const ring = [
  'static struct ibt_ring_entry *ring_next(struct ibt_ring_desc *rd)',
  '{',
  '    return &rd->ring->entries[(rd->ring->head + 1) % rd->ring->capacity];',
  '}',
].join('\n');
export const NarrowWrap = {
  render: () => (
    <div style={{ maxWidth: 300 }}>
      <UI.CodeView file="src/libibtrace/ring.c" fileHref="#" code={ring} start={40} target={42} />
    </div>
  ),
};

// Names in the code that are links: hold Ctrl or ⌘ and click, or Tab into the code and use ← → and Enter.
const lab3 = [
  'def main(argv=None):',
  '    args = parse_args(argv)',
  '    topo = Topology.build(args.topology)',
  '    # Deployment steps: harness/runtime.py:591',
  '    emit(runtime.deploy(args.plane))',
  '    return topo.wait()',
].join('\n');
const defs: Record<string, [string, string]> = {
  parse_args: ['harness/cli.py:12', 'Parse the lab3 command-line arguments.'],
  'Topology.build': ['harness/lab3_topo.py:58', 'Build the Mininet topology for one plane.'],
  emit: ['harness/report.py:15', 'Write one result record to stdout as JSON.'],
  'runtime.deploy': ['harness/runtime.py:591', 'Deploy the routers of a plane and return their handles.'],
};
const calls = [
  { line: 51, col: 12, text: 'parse_args' },
  { line: 52, text: 'Topology.build' },
  { line: 54, col: 5, text: 'emit' },
  { line: 54, text: 'runtime.deploy' },
].map((c) => ({ ...c, href: '#/fn/' + c.text, label: `${c.text}，定義在 ${defs[c.text][0]}`, def: defs[c.text][0], doc: defs[c.text][1] }));
export const NameLinks = {
  render: function Render() {
    const [opened, setOpened] = React.useState('');
    return (
      <div style={{ maxWidth: 620, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <UI.CodeView
          file="harness/lab3.py"
          code={lab3}
          start={50}
          target={54}
          links={calls}
          refHref={(p) => '#/file/' + p}
          onLink={(l) => setOpened(l.def)}
          preview={(l) => (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{l.text}</div>
              <div>
                定義在 <UI.InlineCode href={'#/file/' + l.def}>{l.def}</UI.InlineCode>
              </div>
              <div style={{ color: 'var(--ink-muted)' }}>{l.doc}</div>
            </div>
          )}
        />
        {opened ? <span>開啟：{opened}</span> : null}
      </div>
    );
  },
};

/** terms: words in comments and strings get an explanation; ← → stop on them, Enter opens the card. */
export const Terms = {
  render: () => (
    <div style={{ maxWidth: 620 }}>
      <UI.CodeView
        file="server/session.py"
        code={['# Read the cookie that keeps the session.', 'cookie = req.cookies.get("sid")', 'if not cookie:', '    raise Login("no session cookie")'].join(
          '\n',
        )}
        terms={[
          { term: 'cookie', text: '瀏覽器替網站保存的一小段文字，之後每次請求都會帶上。' },
          { term: 'session', title: '工作階段', text: '伺服器記住同一位使用者的一段期間。' },
        ]}
      />
    </div>
  ),
};

/** onLine reports the line the reader clicked or moved to; peek marks a line from outside, apart from target. */
export const LineAndPeek = {
  render: function Render() {
    const [line, setLine] = React.useState(2);
    const [peek, setPeek] = React.useState<number | { from: number; to: number } | null>(null);
    const code = ['int fd = open(path, O_RDONLY);', 'if (fd < 0)', '    return -1;', 'read(fd, buf, n);', 'close(fd);'].join('\n');
    return (
      <div style={{ maxWidth: 620, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 4, 5].map((n) => (
            <UI.Button key={n} onMouseEnter={() => setPeek(n)} onMouseLeave={() => setPeek(null)} onClick={() => setLine(n)}>
              {`看第 ${n} 行`}
            </UI.Button>
          ))}
          <UI.Button onMouseEnter={() => setPeek({ from: 2, to: 3 })} onMouseLeave={() => setPeek(null)}>
            看錯誤處理
          </UI.Button>
        </div>
        <UI.CodeView file="io.c" code={code} target={line} peek={peek} onLine={(n) => setLine(n)} />
      </div>
    );
  },
};
