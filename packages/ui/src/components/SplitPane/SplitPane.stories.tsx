import * as UI from '../../index';

export default { title: 'Pages/SplitPane', component: UI.SplitPane, parameters: { layout: 'fullscreen' } };

// A code panel beside the diagram: long comments fit on one line once the panel is wider. Drag the divider, use ← →,
// Home and End, or double-click it to go back to 420 px. Under 960 px the panel moves below.
const CODE = `/* Ring buffer shared with ibmon through IBTRACE_SHM. When the ring is full the new record is dropped and -EAGAIN is returned; callers count the drop instead of retrying. */
int ring_push(struct ring *r, const struct rec *x)
{
    if (ring_full(r))
        return -EAGAIN; /* ibmon reads slower than the hooks write: keep the old records, drop this one */
    r->buf[r->head++ & r->mask] = *x;
    return 0;
}`;
export const Default = {
  render: () => (
    <div style={{ padding: 24 }}>
      <UI.SplitPane
        a={
          <UI.Card title="架構">
            <p style={{ margin: 0 }}>選一個函式，右邊的面板顯示它的程式碼。</p>
          </UI.Card>
        }
        b={<UI.CodeView file="src/libibtrace/ring.c" start={40} target={45} language="c" code={CODE} />}
        defaultB={420}
        minA={360}
        minB={280}
        storageKey="storybook-split"
      />
    </div>
  ),
};
