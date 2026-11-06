import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/Graph' };

const NODES = [
  { id: 'main', x: 240, y: 16, w: 160 },
  { id: 'ibmon_reader_open', x: 20, y: 120, w: 180 },
  { id: 'trace_post_send', x: 230, y: 120, w: 180 },
  { id: 'ibmon_stats_create', x: 440, y: 120, w: 180 },
  { id: 'ibt_span_begin', x: 120, y: 236, w: 170 },
  { id: 'post_send', x: 350, y: 236, w: 170, ext: true },
];
const EDGES: [string, string, number, string][] = [
  ['main', 'ibmon_reader_open', 0, ''],
  ['main', 'trace_post_send', 1, 'LD_PRELOAD'],
  ['main', 'ibmon_stats_create', 0, ''],
  ['trace_post_send', 'ibt_span_begin', 0, 'ops.c:73'],
  ['trace_post_send', 'post_send', 1, 'ops.c:74'],
];
const BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));
function node(id: string): (typeof NODES)[number] {
  return BY_ID[id];
}
function Demo() {
  const [sel, setSel] = React.useState<string | null>('trace_post_send');
  function related(e: (typeof EDGES)[number]) {
    return !sel || e[0] === sel || e[1] === sel;
  }
  function near(id: string) {
    return (
      !sel ||
      id === sel ||
      EDGES.some((e) => {
        return (e[0] === sel || e[1] === sel) && (e[0] === id || e[1] === id);
      })
    );
  }
  return (
    <div
      className="ui-graph"
      style={{ maxWidth: 672, overflowX: 'auto', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}
    >
      <svg viewBox="0 0 640 300" width={640} height={300} role="img" aria-label="架構圖">
        <UI.GraphDefs />
        {EDGES.map((e, i) => {
          const a = node(e[0]),
            b = node(e[1]),
            sx = a.x + a.w / 2,
            sy = a.y + 40,
            tx = b.x + b.w / 2,
            ty = b.y - 2,
            my = sy + 24,
            on = sel && related(e);
          return (
            <g key={i} className={related(e) ? '' : 'is-dim'}>
              <path
                d={'M' + sx + ' ' + sy + ' V' + my + ' H' + tx + ' V' + ty}
                className={'ui-graph-edge' + (e[2] ? ' is-inferred' : '') + (on ? ' is-related' : '')}
                markerEnd={on ? 'url(#ui-arrow-accent)' : 'url(#ui-arrow)'}
              />
              {e[3] ? (
                <text x={tx + 8} y={(my + ty) / 2 + 2} dominantBaseline="central" className={'ui-graph-label' + (on ? ' is-related' : '')}>
                  <tspan className="ui-graph-code">{e[3]}</tspan>
                </text>
              ) : null}
            </g>
          );
        })}
        {NODES.map((n) => {
          return (
            <g
              key={n.id}
              className={near(n.id) ? '' : 'is-dim'}
              style={{ cursor: 'pointer' }}
              onClick={function () {
                setSel(sel === n.id ? null : n.id);
              }}
            >
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={40}
                rx={10}
                className={'ui-graph-node' + (n.ext ? ' is-external' : '') + (n.id === sel ? ' is-selected' : '')}
              />
              <text x={n.x + n.w / 2} y={n.y + 20} textAnchor="middle" dominantBaseline="central" className="ui-graph-name">
                {n.id}
              </text>
            </g>
          );
        })}
      </svg>
      <UI.GraphLegend
        items={[
          { type: 'edge', label: '編譯器確認' },
          { type: 'inferred', label: '推測（規則）', text: '由規則推得，編譯器無法確認。' },
          { type: 'external', label: '外部函式' },
        ]}
      />
    </div>
  );
}
export const Default = { render: () => <Demo /> };
