import * as React from 'react';
import { GraphLegend, type GraphLegendItem } from '../Graph/Graph';
import { tr } from '../../i18n';
import { cx, monoNums } from '../../internal/util';
import { ScrollHint, useScrollHint } from '../../internal/scrollHint';
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
  /** Used by most others: not drawn as a layer; shown as a small box under the diagram with how often it is used.
   *  Selectable like the other boxes (same selected and onSelect): the boxes that use it show 「使用 N 次」. */
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
  /** Names the edge for selectedEdge and onSelectEdge. Default `${from}->${to}`. */
  id?: string;
}

export interface LayerGraphProps {
  nodes: LayerGraphNode[];
  edges: LayerGraphEdge[];
  selected?: string | null;
  /** Selecting a box dims everything unrelated and turns its lines accent. Clears the selected edge. */
  onSelect?: (id: string | null) => void;
  /** The selected edge's id (controlled, like selected). */
  selectedEdge?: string | null;
  /** Makes edges selectable: a click on a line or its label, Enter or Space. null when it is clicked again, on a click on
   *  the empty diagram or on Escape. Clears the selected box. Without it, edges cannot be clicked. */
  onSelectEdge?: (id: string | null) => void;
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
  /** On a box that uses the selected shared item; {n} is how often. Default 「使用 {n} 次」. */
  useLabel?: string;
  /** Label of inferred edges without their own. Default 「推測」. */
  inferredLabel?: string;
  /** Explains inferred edges in the legend (a Term). */
  inferredText?: string;
  /** false hides the legend. By default it lists only the kinds of line the diagram has. */
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
  let W = PAD * 2 + cols * NW + (cols - 1) * COL;
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
  // A line to a higher layer (a data channel back up): it leaves the source's right side, runs up a lane along the
  // diagram's right edge and enters the target's right side. The diagram widens on the right for the lanes and labels.
  const isUp = (e: LayerGraphEdge) => !!pos[e.from] && !!pos[e.to] && layerIndex[e.to] < layerIndex[e.from];
  const outs: Record<string, LayerGraphEdge[]> = {};
  const ins: Record<string, LayerGraphEdge[]> = {};
  const upOut: Record<string, LayerGraphEdge[]> = {};
  const upIn: Record<string, LayerGraphEdge[]> = {};
  for (const e of edges) {
    if (!pos[e.from] || !pos[e.to]) continue;
    if (isUp(e)) {
      (upOut[e.from] ??= []).push(e);
      (upIn[e.to] ??= []).push(e);
      continue;
    }
    (outs[e.from] ??= []).push(e);
    (ins[e.to] ??= []).push(e);
  }
  const ups = edges.filter(isUp);
  const rowOf = (id: string) => byLayer.get(layers[layerIndex[id]]) ?? [];
  const rightmost = (id: string) => rowOf(id)[rowOf(id).length - 1]?.id === id;
  const leftmost = (id: string) => rowOf(id)[0]?.id === id;
  // The lane is on the side where the target is the outermost box, so the line can enter its side; the right one
  // when both or neither (then it enters from below).
  const onLeft = (e: LayerGraphEdge) => !rightmost(e.to) && leftmost(e.to);
  const upsL = ups.filter(onLeft);
  const upsR = ups.filter((e) => !onLeft(e));
  const LANE = 20;
  const LANE_STEP = 12;
  for (const k in outs) outs[k].sort((a, b) => pos[a.to].x - pos[b.to].x);
  for (const k in ins) ins[k].sort((a, b) => pos[a.from].x - pos[b.from].x);
  const edgeId = (e: LayerGraphEdge) => e.id ?? `${e.from}->${e.to}`;
  const pickEdge = p.onSelectEdge;
  const [hover, setHover] = React.useState<string | null>(null);
  // Wider than its box: a fade on the right while more is to the right, and a 「左右滑動」 hint until the first scroll.
  const { ref: scrollRef, more: scrollMore, overflows, scrolled, onScroll } = useScrollHint();
  const selEdge = (pickEdge && edges.find((e) => edgeId(e) === p.selectedEdge)) || null;
  // How often each box uses each shared item (edges into a shared item are not drawn).
  const uses: Record<string, Record<string, number>> = {};
  for (const e of p.edges) if (sharedIds.has(e.to) && !sharedIds.has(e.from)) (uses[e.to] ??= {})[e.from] = (uses[e.to]?.[e.from] ?? 0) + (e.count || 0);
  const selShared = !selEdge && sel != null && sharedIds.has(sel) ? sel : null;
  // A selected box highlights its edges; a selected edge highlights itself, and both of its boxes stay undimmed;
  // a selected shared item keeps the boxes that use it and dims every line.
  const related = (e: LayerGraphEdge) => (selEdge ? e === selEdge : !!sel && !selShared && (e.from === sel || e.to === sel));
  const focus = !!sel || !!selEdge;
  const near = (id: string) =>
    selEdge
      ? id === selEdge.from || id === selEdge.to
      : selShared
        ? id === selShared || id in (uses[selShared] ?? {})
        : !sel || id === sel || edges.some((e) => related(e) && (e.from === id || e.to === id));
  const pick = (id: string, on: boolean) => {
    if (!on && p.selectedEdge != null) pickEdge?.(null);
    p.onSelect?.(on ? null : id);
  };
  const nameOf = (id: string) => all.find((n) => n.id === id)?.name || id;
  const countText = (e: LayerGraphEdge) => (p.countLabel ?? tr('{n} 次')).replace('{n}', String(e.count ?? 0));
  // Room beside the boxes for the lanes and their labels (the longer of the label and 「N 次」, which shows when
  // selected): the left side shifts every box right, the right side widens the diagram.
  const upW = (list: LayerGraphEdge[]) =>
    Math.max(0, ...list.map((e) => Math.ceil(Math.max(labelWidth(e.inferred ? e.label || p.inferredLabel || tr('推測') : ''), labelWidth(countText(e))))));
  if (upsL.length) {
    const left0 = Math.min(...main.map((n) => pos[n.id].x));
    const shift = Math.max(0, PAD + upW(upsL) + 8 + (upsL.length - 1) * LANE_STEP + LANE - left0);
    for (const id in pos) pos[id] = { x: pos[id].x + shift, y: pos[id].y };
    W += shift;
  }
  const boxesLeft = Math.min(...main.map((n) => pos[n.id].x));
  const boxesRight = Math.max(0, ...main.map((n) => pos[n.id].x + NW));
  const laneX = (e: LayerGraphEdge) => (onLeft(e) ? boxesLeft - LANE - upsL.indexOf(e) * LANE_STEP : boxesRight + LANE + upsR.indexOf(e) * LANE_STEP);
  // Labels sit outside every lane on their side: x where a right label starts, or where a left label ends.
  const upLabelX = boxesRight + LANE + Math.max(0, upsR.length - 1) * LANE_STEP + 8;
  const upLabelEndL = boxesLeft - LANE - Math.max(0, upsL.length - 1) * LANE_STEP - 8;
  if (upsR.length) W = Math.max(W, upLabelX + upW(upsR) + PAD);
  const choose = (e: LayerGraphEdge) => {
    const id = edgeId(e);
    const next = p.selectedEdge === id ? null : id;
    if (next && sel != null) p.onSelect?.(null);
    pickEdge?.(next);
  };

  const paths: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  const marks: { idx: number; e: LayerGraphEdge; text: string; tx: number; ty: number; left: boolean; r: boolean; dim: boolean; up?: boolean }[] = [];
  // Lines that labels must not cover: the horizontal runs of the up lines, as [left, right, top, bottom].
  const runs: number[][] = [];
  const arrows: number[][] = [];
  const hitPaths: React.ReactNode[] = [];
  edges.forEach((e, idx) => {
    const a = pos[e.from];
    const b = pos[e.to];
    if (!a || !b) return;
    const r = related(e);
    const dim = focus && !r;
    const picked = e === selEdge;
    const hovered = !!pickEdge && hover === edgeId(e) && !r;
    const up = isUp(e);
    let pts: Pt[];
    let tx: number;
    let ty: number;
    let arrow: string;
    let inn = 1;
    if (up) {
      const lx = laneX(e);
      const L = onLeft(e);
      const si = upOut[e.from].indexOf(e);
      const sn = upOut[e.from].length;
      const ti = upIn[e.to].indexOf(e);
      const tn = upIn[e.to].length;
      const start: Pt[] = [];
      let y0: number;
      if (L ? leftmost(e.from) : rightmost(e.from)) {
        // From the right side, a little apart when several leave the same box.
        y0 = Math.round(a.y + NH / 2 + (si - (sn - 1) / 2) * 10);
        start.push([L ? a.x : a.x + NW, y0], [lx, y0]);
      } else {
        // A box to its right: leave from the top edge, just under the lines of the gap above.
        const px = L ? a.x + 20 + si * 10 : a.x + NW - 20 - si * 10;
        y0 = a.y - 12 - si * 6;
        start.push([px, a.y], [px, y0], [lx, y0]);
      }
      let y1: number;
      if (L || rightmost(e.to)) {
        // Into the side facing the lane, the arrow pointing at the box.
        y1 = Math.round(b.y + NH / 2 + (ti - (tn - 1) / 2) * 10);
        tx = L ? b.x : b.x + NW;
        ty = y1;
        const back = L ? tx - 9 : tx + 9;
        pts = [...start, [lx, y1], [back, y1]];
        arrow = `M${back} ${ty - 5} L${back} ${ty + 5} L${tx} ${ty} Z`;
        arrows.push([Math.min(tx, back), Math.max(tx, back), ty - 5, ty + 5]);
        runs.push([Math.min(tx, lx), Math.max(tx, lx), y1 - 3, y1 + 3]);
      } else {
        // A box to its right: come in from below, into the bottom edge.
        tx = b.x + NW - 20 - ti * 10;
        y1 = b.y + NH + 12 + ti * 6;
        ty = b.y + NH;
        pts = [...start, [lx, y1], [tx, y1], [tx, ty + 9]];
        arrow = `M${tx - 5} ${ty + 9} L${tx + 5} ${ty + 9} L${tx} ${ty} Z`;
        arrows.push([tx - 5, tx + 5, ty, ty + 9]);
        runs.push([tx, lx, y1 - 3, y1 + 3]);
      }
      const sx0 = start[start.length - 2][0];
      runs.push([Math.min(sx0, lx), Math.max(sx0, lx), y0 - 3, y0 + 3]);
      if (e.inferred || r) {
        const text = e.inferred ? e.label || p.inferredLabel || tr('推測') : countText(e);
        marks.push({ idx, e, text, tx: L ? upLabelEndL : upLabelX, ty: Math.round((y0 + y1) / 2), left: L, r, dim, up: true });
      }
    } else {
      const oi = outs[e.from].indexOf(e);
      const on = outs[e.from].length;
      const ii = ins[e.to].indexOf(e);
      inn = ins[e.to].length;
      const sx = Math.round(a.x + (NW * (oi + 1)) / (on + 1));
      const sy = a.y + NH;
      tx = Math.round(b.x + (NW * (ii + 1)) / (inn + 1));
      ty = b.y;
      const off = (oi - (on - 1) / 2) * 6;
      const y1 = sy + GAP / 2 + off;
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
      arrow = `M${tx - 5} ${ty - 9} L${tx + 5} ${ty - 9} L${tx} ${ty} Z`;
      arrows.push([tx - 5, tx + 5, ty - 9, ty]);
    }
    // Hover on a selectable line: darker and 2 px thicker.
    const w = (e.inferred ? 1.5 : 1.5 + 5.5 * ((e.count || 0) / maxCount)) + (picked ? 1.5 : 0) + (hovered ? 2 : 0);
    const d = route(clean(pts), 10);
    paths.push(
      <path
        key={'p' + idx}
        className={cx('ui-lg-edge', e.inferred && 'is-inferred', r && 'is-related', dim && 'is-dim', hovered && 'is-hover')}
        d={d}
        strokeWidth={w}
      />,
    );
    if (pickEdge) {
      // An invisible 12 px path over the line: the click and keyboard target.
      hitPaths.push(
        <path
          key={'h' + idx}
          className="ui-lg-hit"
          data-edge={edgeId(e)}
          d={d}
          role="button"
          tabIndex={0}
          aria-label={`${nameOf(e.from)} → ${nameOf(e.to)}，${(e.inferred ? e.label || p.inferredLabel || tr('推測') : countText(e)).replace(/`/g, '')}`}
          aria-pressed={picked}
          onClick={(ev) => {
            ev.stopPropagation();
            choose(e);
          }}
          onPointerEnter={() => setHover(edgeId(e))}
          onPointerLeave={() => setHover(null)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault();
              choose(e);
            } else if (ev.key === 'Escape' && picked) pickEdge(null);
          }}
        />,
      );
    }
    paths.push(<path key={'a' + idx} className={cx('ui-lg-arrow', r && 'is-related', dim && 'is-dim')} d={arrow} />);
    if (!up && (e.inferred || r)) {
      const text = e.inferred ? e.label || p.inferredLabel || tr('推測') : countText(e);
      // Several arrows into one box: an arrow in the left half puts its label on its left.
      marks.push({ idx, e, text, tx, ty, left: inn > 1 && tx < b.x + NW / 2, r, dim });
    }
  });
  // Labels sit beside their arrowheads, inside the diagram; one that would touch a placed label or an arrowhead moves up 18 px.
  // Obstacles are [left, right, top, bottom, gap].
  const placed = [...arrows, ...runs];
  const hits = (x0: number, x1: number, y0: number, y1: number) =>
    placed.some((q) => x0 < q[1] + (q[4] || 0) && q[0] < x1 + (q[4] || 0) && y0 < q[3] && q[2] < y1);
  const labelEl = (m: (typeof marks)[number], x0: number, top: number) => (
    // With onSelectEdge the label selects its edge too (a mouse and touch target; keyboard uses the line itself).
    <span
      key={'l' + m.idx}
      // The line's own button carries this text; read once, not again beside it.
      aria-hidden={pickEdge ? true : undefined}
      className={cx('ui-lg-label', pickEdge && 'is-clickable', pickEdge && hover === edgeId(m.e) && 'is-hover', m.r && 'is-related', m.dim && 'is-dim')}
      style={{ left: x0, top }}
      onClick={
        pickEdge
          ? (ev) => {
              ev.stopPropagation();
              choose(m.e);
            }
          : undefined
      }
      onPointerEnter={pickEdge ? () => setHover(edgeId(m.e)) : undefined}
      onPointerLeave={pickEdge ? () => setHover(null) : undefined}
    >
      {labelParts(m.text)}
    </span>
  );
  marks
    .sort((m, n) => m.ty - n.ty || m.tx - n.tx)
    .forEach((m) => {
      const w = Math.ceil(labelWidth(m.text));
      if (m.up) {
        // Beside the lanes, halfway up; moved up (then down) off anything placed, inside the diagram.
        const x0 = m.left ? m.tx - w : m.tx;
        let top = Math.max(10, Math.min(H - 10, m.ty));
        for (let k = 0; k < 8 && hits(x0, x0 + w, top - 8, top + 8) && top - 18 >= 10; k++) top -= 18;
        for (let k = 0; k < 16 && hits(x0, x0 + w, top - 8, top + 8) && top + 18 <= H - 10; k++) top += 18;
        placed.push([x0, x0 + w, top - 8, top + 8, 6]);
        labels.push(labelEl(m, x0, top));
        return;
      }
      let left = m.left;
      if (left && m.tx - 8 - w < 0) left = false;
      else if (!left && m.tx + 8 + w > W) left = m.tx - 8 - w >= 0;
      const x0 = left ? m.tx - 8 - w : Math.min(m.tx + 8, W - w);
      const x1 = x0 + w;
      let top = m.ty - 16;
      for (let k = 0; k < 8 && hits(x0, x1, top - 8, top + 8); k++) top -= 18;
      placed.push([x0, x1, top - 8, top + 8, 6]);
      labels.push(labelEl(m, x0, top));
    });
  const sizeText = p.sizeLabel ?? tr('{n} 個項目');
  const useText = p.useLabel ?? tr('使用 {n} 次');
  const nodes = main.map((n) => {
    const q = pos[n.id];
    const on = n.id === sel;
    const size = sizeOf(n);
    const used = selShared ? uses[selShared]?.[n.id] : undefined;
    return (
      <button
        key={n.id}
        type="button"
        className={cx('ui-lg-node', on && 'is-selected', !near(n.id) && 'is-dim')}
        style={{ left: q.x, top: q.y, width: NW, height: NH }}
        aria-pressed={p.onSelect ? on : undefined}
        onClick={p.onSelect ? () => pick(n.id, on) : undefined}
      >
        <span className="ui-lg-head">
          <span className="ui-lg-name">{n.name || n.id}</span>
          {used ? <span className="ui-lg-use">{monoNums(useText.replace('{n}', '\u0001'), [used])}</span> : null}
        </span>
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
  const sharedBoxes = shared.map((s) => {
    const by = uses[s.id] ?? {};
    const total = Object.values(by).reduce((a, b) => a + b, 0);
    const on = s.id === sel;
    // A selected box dims the shared items it does not use.
    const dim = !!selEdge || (sel != null && !on && (selShared != null || !(sel in by)));
    return (
      <button
        key={s.id}
        type="button"
        className={cx('ui-lg-node', 'ui-lg-chip', on && 'is-selected', dim && 'is-dim')}
        aria-pressed={p.onSelect ? on : undefined}
        onClick={p.onSelect ? () => pick(s.id, on) : undefined}
      >
        <span className="ui-lg-name">{s.name || s.id}</span>
        <span className="ui-lg-shared-meta">{monoNums(sharedMeta.replace('{a}', '\u0001').replace('{b}', '\u0002'), [Object.keys(by).length, total])}</span>
      </button>
    );
  });
  return (
    <div className={cx('ui-graph ui-lg', p.className)}>
      <div className={cx('ui-lg-scroller', scrollMore && 'has-more')}>
        <div className="ui-lg-scroll" ref={scrollRef} onScroll={onScroll}>
          <div
            className="ui-lg-canvas"
            style={{ width: W, height: H }}
            role="group"
            aria-label={p.label || tr('架構圖')}
            // A click on the empty diagram clears the selected edge.
            onClick={pickEdge && p.selectedEdge != null ? () => pickEdge(null) : undefined}
          >
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
              {paths}
            </svg>
            {nodes}
            {labels}
            {hitPaths.length ? (
              // A group, not the default image: screen readers would hide the line buttons inside an image.
              <svg className="ui-lg-hits" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label={tr('關係')}>
                {hitPaths}
              </svg>
            ) : null}
          </div>
        </div>
      </div>
      <ScrollHint show={overflows} done={scrolled} />
      {shared.length ? (
        <div className="ui-lg-shared">
          <div className="ui-lg-shared-title">{p.sharedLabel || tr('共用項目')}</div>
          <div className="ui-lg-chips">{sharedBoxes}</div>
        </div>
      ) : null}
      {p.legend === false || (!p.legendItems && !edges.some((e) => pos[e.from] && pos[e.to])) ? null : (
        <GraphLegend
          items={
            p.legendItems || [
              // Only kinds of line the diagram has: a diagram of inferred lines alone gets no 「次數越多線越粗」.
              ...(edges.some((e) => !e.inferred && pos[e.from] && pos[e.to]) ? [{ type: 'weight' as const, label: '次數越多線越粗' }] : []),
              ...(edges.some((e) => e.inferred && pos[e.from] && pos[e.to])
                ? [{ type: 'inferred' as const, label: p.inferredLabel || '推測的關係', text: p.inferredText }]
                : []),
            ]
          }
        />
      )}
    </div>
  );
}
