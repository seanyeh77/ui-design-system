import * as React from 'react';
import { GraphLegend, type GraphLegendItem } from '../Graph/Graph';
import { tr } from '../../i18n';
import { cx, monoNums } from '../../internal/util';
import { devWarn } from '../../internal/dev';

export interface LayerGraphNode {
  id: string;
  name?: string;
  /** 0 is the top layer. */
  layer?: number;
  /** How big it is (functions, files, endpoints): drawn as the size bar. */
  size?: number;
  /** @deprecated use size. */
  fns?: number;
  /** Used by most others: not drawn; listed under the diagram with how often it is used. */
  shared?: boolean;
}

export interface LayerGraphEdge {
  from: string;
  to: string;
  /** How often: sets the line width. */
  count?: number;
  /** Inferred by a rule rather than known: dashed and labelled. */
  inferred?: boolean;
  /** Label of an inferred edge; `backticks` and numbers are in Geist Mono. */
  label?: string;
}

export interface LayerGraphProps {
  nodes: LayerGraphNode[];
  edges: LayerGraphEdge[];
  selected?: string | null;
  /** Selecting a box dims everything unrelated and turns its lines accent. */
  onSelect?: (id: string | null) => void;
  /** px. Default 200. */
  nodeWidth?: number;
  /** Text under a box's size bar; {n} is the size. Default 「{n} 個項目」. */
  sizeLabel?: string;
  /** Label of a selected edge; {n} is its count. Default 「{n} 次」. */
  countLabel?: string;
  /** Heading of the shared list. Default 「共用項目」. */
  sharedLabel?: string;
  /** A shared item's line; {a} is how many items use it, {b} the total count. Default 「{a} 個項目使用，共 {b} 次」. */
  sharedMeta?: string;
  /** Label of inferred edges without their own. Default 「推測」. */
  inferredLabel?: string;
  /** Explains inferred edges in the legend (a Term). */
  inferredText?: string;
  /** false hides the legend. */
  legend?: boolean;
  legendItems?: GraphLegendItem[];
  /** Default 「架構圖」. */
  label?: string;
  className?: string;
}

// Label width before layout: text in the sans font, `code` and numbers in the mono font, as labelParts draws them.
let measure: CanvasRenderingContext2D | null | undefined;
const SPLIT = /(`[^`]+`|\d[\d,.]*)/;

function labelWidth(text: string): number {
  const parts = text.split(SPLIT).filter(Boolean);
  if (measure === undefined) measure = document.createElement('canvas').getContext('2d');
  const c = measure;
  if (!c) return text.length * 9;
  const cs = getComputedStyle(document.documentElement);
  const sans = cs.getPropertyValue('--font-sans') || 'sans-serif';
  const mono = cs.getPropertyValue('--font-mono') || 'monospace';
  return parts.reduce((w, t) => {
    const code = t[0] === '`' || /^\d/.test(t);
    c.font = '600 12px ' + (code ? mono : sans);
    return w + c.measureText(t[0] === '`' ? t.slice(1, -1) : t).width;
  }, 0);
}

function labelParts(text: string): React.ReactNode[] {
  return text
    .split(SPLIT)
    .filter(Boolean)
    .map((t, i) =>
      t[0] === '`' || /^\d/.test(t) ? (
        <span key={i} className="ui-lg-code">
          {t[0] === '`' ? t.slice(1, -1) : t}
        </span>
      ) : (
        t
      ),
    );
}

type Pt = [number, number];

/** Rounded orthogonal path through the points. */
function route(pts: Pt[], R: number): string {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const r = Math.min(R, Math.abs(b[0] - a[0] + b[1] - a[1]) / 2, Math.abs(c[0] - b[0] + c[1] - b[1]) / 2);
    const ux = Math.sign(b[0] - a[0]);
    const uy = Math.sign(b[1] - a[1]);
    const vx = Math.sign(c[0] - b[0]);
    const vy = Math.sign(c[1] - b[1]);
    d += ` L${b[0] - ux * r} ${b[1] - uy * r} Q${b[0]} ${b[1]} ${b[0] + vx * r} ${b[1] + vy * r}`;
  }
  const z = pts[pts.length - 1];
  return `${d} L${z[0]} ${z[1]}`;
}

/** Drops repeated points and points in the middle of a straight run. */
const clean = (pts: Pt[]): Pt[] =>
  pts
    .filter((q, i) => {
      const o = pts[i - 1];
      return !o || o[0] !== q[0] || o[1] !== q[1];
    })
    .filter((q, i, arr) => {
      const a = arr[i - 1];
      const c = arr[i + 1];
      return !a || !c || !((a[0] === q[0] && q[0] === c[0]) || (a[1] === q[1] && q[1] === c[1]));
    });

/** Architecture as layers of boxes with arrows. Line width shows how often; inferred relations are dashed and labelled;
 *  shared items are listed under the diagram instead of drawn. Wider than the screen: scrolls sideways. */
export function LayerGraph(p: LayerGraphProps) {
  const NW = p.nodeWidth || 200;
  const NH = 60;
  const GAP = 56;
  const COL = 40;
  const PAD = 16;
  const all = p.nodes;
  const sel = p.selected ?? null;
  devWarn(
    all.some((n) => n.fns != null),
    'LayerGraph',
    'fns is renamed size; pass size and, for the text under the bar, sizeLabel such as 「{n} 個函式」.',
  );
  const sizeOf = (n: LayerGraphNode) => n.size ?? n.fns;
  const sharedIds = new Set(all.filter((n) => n.shared).map((n) => n.id));
  const main = all.filter((n) => !n.shared);
  const shared = all.filter((n) => n.shared);
  const edges = p.edges.filter((e) => !sharedIds.has(e.from) && !sharedIds.has(e.to));
  const byLayer = new Map<number, LayerGraphNode[]>();
  for (const n of main) {
    const l = n.layer || 0;
    byLayer.set(l, [...(byLayer.get(l) ?? []), n]);
  }
  const layers = [...byLayer.keys()].sort((a, b) => a - b);
  const cols = Math.max(1, ...layers.map((l) => byLayer.get(l)?.length ?? 0));
  const W = PAD * 2 + cols * NW + (cols - 1) * COL;
  const H = PAD * 2 + layers.length * NH + Math.max(0, layers.length - 1) * GAP;
  const pos: Record<string, { x: number; y: number }> = {};
  const layerIndex: Record<string, number> = {};
  layers.forEach((l, k) => {
    const row = byLayer.get(l) ?? [];
    const off = (W - (row.length * NW + (row.length - 1) * COL)) / 2;
    row.forEach((n, i) => {
      pos[n.id] = { x: off + i * (NW + COL), y: PAD + k * (NH + GAP) };
      layerIndex[n.id] = k;
    });
  });
  const maxSize = Math.max(1, ...main.map((n) => sizeOf(n) || 0));
  const maxCount = Math.max(1, ...edges.map((e) => e.count || 0));
  const outs: Record<string, LayerGraphEdge[]> = {};
  const ins: Record<string, LayerGraphEdge[]> = {};
  for (const e of edges) {
    if (!pos[e.from] || !pos[e.to]) continue;
    (outs[e.from] ??= []).push(e);
    (ins[e.to] ??= []).push(e);
  }
  for (const k in outs) outs[k].sort((a, b) => pos[a.to].x - pos[b.to].x);
  for (const k in ins) ins[k].sort((a, b) => pos[a.from].x - pos[b.from].x);
  const related = (e: LayerGraphEdge) => !!sel && (e.from === sel || e.to === sel);
  const near = (id: string) => !sel || id === sel || edges.some((e) => related(e) && (e.from === id || e.to === id));

  const paths: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  const marks: { idx: number; text: string; tx: number; ty: number; left: boolean; r: boolean; dim: boolean }[] = [];
  const arrows: number[][] = [];
  edges.forEach((e, idx) => {
    const a = pos[e.from];
    const b = pos[e.to];
    if (!a || !b) return;
    const oi = outs[e.from].indexOf(e);
    const on = outs[e.from].length;
    const ii = ins[e.to].indexOf(e);
    const inn = ins[e.to].length;
    const sx = Math.round(a.x + (NW * (oi + 1)) / (on + 1));
    const sy = a.y + NH;
    const tx = Math.round(b.x + (NW * (ii + 1)) / (inn + 1));
    const ty = b.y;
    const off = (oi - (on - 1) / 2) * 6;
    const y1 = sy + GAP / 2 + off;
    let pts: Pt[];
    if (layerIndex[e.to] - layerIndex[e.from] > 1) {
      // Skipping a layer: go down a channel between the boxes of the next layer, the one nearest the middle.
      const next = (byLayer.get(layers[layerIndex[e.from] + 1]) ?? []).map((n) => pos[n.id]);
      const mid = (sx + tx) / 2;
      const chans = [next[0].x - COL / 2, ...next.map((q) => q.x + NW + COL / 2)].map((c) => Math.max(PAD / 2, Math.min(W - PAD / 2, c)));
      const chx = chans.reduce((best, c) => (Math.abs(c - mid) < Math.abs(best - mid) ? c : best), chans[0]) + off;
      const y2 = ty - GAP / 2 + off;
      pts = [
        [sx, sy],
        [sx, y1],
        [chx, y1],
        [chx, y2],
        [tx, y2],
        [tx, ty - 8],
      ];
    } else
      pts = [
        [sx, sy],
        [sx, y1],
        [tx, y1],
        [tx, ty - 8],
      ];
    const r = related(e);
    const dim = !!sel && !r;
    const w = e.inferred ? 1.5 : 1.5 + 5.5 * ((e.count || 0) / maxCount);
    paths.push(
      <path
        key={'p' + idx}
        className={cx('ui-lg-edge', e.inferred && 'is-inferred', r && 'is-related', dim && 'is-dim')}
        d={route(clean(pts), 10)}
        strokeWidth={w}
      />,
    );
    arrows.push([tx - 5, tx + 5, ty - 9, ty]);
    paths.push(
      <path key={'a' + idx} className={cx('ui-lg-arrow', r && 'is-related', dim && 'is-dim')} d={`M${tx - 5} ${ty - 9} L${tx + 5} ${ty - 9} L${tx} ${ty} Z`} />,
    );
    if (e.inferred || r) {
      const text = e.inferred ? e.label || p.inferredLabel || tr('推測') : (p.countLabel ?? tr('{n} 次')).replace('{n}', String(e.count ?? 0));
      // Several arrows into one box: an arrow in the left half puts its label on its left.
      marks.push({ idx, text, tx, ty, left: inn > 1 && tx < b.x + NW / 2, r, dim });
    }
  });
  // Labels sit beside their arrowheads, inside the diagram; one that would touch a placed label or an arrowhead moves up 18 px.
  // Obstacles are [left, right, top, bottom, gap].
  const placed = [...arrows];
  const hits = (x0: number, x1: number, y0: number, y1: number) =>
    placed.some((q) => x0 < q[1] + (q[4] || 0) && q[0] < x1 + (q[4] || 0) && y0 < q[3] && q[2] < y1);
  marks
    .sort((m, n) => m.ty - n.ty || m.tx - n.tx)
    .forEach((m) => {
      const w = Math.ceil(labelWidth(m.text));
      let left = m.left;
      if (left && m.tx - 8 - w < 0) left = false;
      else if (!left && m.tx + 8 + w > W) left = m.tx - 8 - w >= 0;
      const x0 = left ? m.tx - 8 - w : Math.min(m.tx + 8, W - w);
      const x1 = x0 + w;
      let top = m.ty - 16;
      for (let k = 0; k < 8 && hits(x0, x1, top - 8, top + 8); k++) top -= 18;
      placed.push([x0, x1, top - 8, top + 8, 6]);
      labels.push(
        <span key={'l' + m.idx} className={cx('ui-lg-label', m.r && 'is-related', m.dim && 'is-dim')} style={{ left: x0, top }}>
          {labelParts(m.text)}
        </span>,
      );
    });
  const sizeText = p.sizeLabel ?? tr('{n} 個項目');
  const nodes = main.map((n) => {
    const q = pos[n.id];
    const on = n.id === sel;
    const size = sizeOf(n);
    return (
      <button
        key={n.id}
        type="button"
        className={cx('ui-lg-node', on && 'is-selected', !near(n.id) && 'is-dim')}
        style={{ left: q.x, top: q.y, width: NW, height: NH }}
        aria-pressed={p.onSelect ? on : undefined}
        onClick={p.onSelect ? () => p.onSelect?.(on ? null : n.id) : undefined}
      >
        <span className="ui-lg-name">{n.name || n.id}</span>
        {size != null ? (
          <span className="ui-lg-size">
            <span className="ui-lg-track" aria-hidden="true">
              <span style={{ width: Math.round((size / maxSize) * 100) + '%' }} />
            </span>
            <span className="ui-lg-count">{monoNums(sizeText.replace('{n}', '\u0001'), [size])}</span>
          </span>
        ) : null}
      </button>
    );
  });
  const sharedMeta = p.sharedMeta ?? tr('{a} 個項目使用，共 {b} 次');
  const sharedRows = shared.map((s) => {
    const callers = new Set<string>();
    let total = 0;
    for (const e of p.edges)
      if (e.to === s.id && !sharedIds.has(e.from)) {
        callers.add(e.from);
        total += e.count || 0;
      }
    return (
      <div key={s.id} className="ui-lg-shared-row">
        <span className="ui-lg-name">{s.name || s.id}</span>
        <span className="ui-lg-shared-meta">{monoNums(sharedMeta.replace('{a}', '\u0001').replace('{b}', '\u0002'), [callers.size, total])}</span>
      </div>
    );
  });
  return (
    <div className={cx('ui-graph ui-lg', p.className)}>
      <div className="ui-lg-scroll">
        <div className="ui-lg-canvas" style={{ width: W, height: H }} role="group" aria-label={p.label || tr('架構圖')}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            {paths}
          </svg>
          {nodes}
          {labels}
        </div>
      </div>
      {shared.length ? (
        <div className="ui-lg-shared">
          <div className="ui-lg-shared-title">{p.sharedLabel || tr('共用項目')}</div>
          {sharedRows}
        </div>
      ) : null}
      {p.legend === false ? null : (
        <GraphLegend
          items={
            p.legendItems || [
              { type: 'weight', label: '次數越多線越粗' },
              { type: 'inferred', label: p.inferredLabel || '推測的關係', text: p.inferredText },
            ]
          }
        />
      )}
    </div>
  );
}
