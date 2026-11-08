import * as React from 'react';
import { GraphLegend, type GraphLegendItem } from '../Graph/Graph';
import { Tabs } from '../Tabs/Tabs';
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
  /** Outside the repository (a traced program, a library): drawn above every layer with a dashed outline and
   *  「repo 外」 (externalLabel) under the name. Not in any layer and no size bar; its lines, selection and list entry
   *  work like any box's. */
  external?: boolean;
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
  /** Under the name of an external box, and after it in the list. Default 「repo 外」. */
  externalLabel?: string;
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
  /** The 「圖／清單」 switch above the diagram; the list shows every box and line as text, also for screen readers.
   *  false hides the switch. */
  listView?: boolean;
  /** Headings of the list: { nodes, edges }. Default 「項目」 and 「關係」. */
  listLabels?: { nodes?: string; edges?: string };
  /** Remembers the sideways scroll under this name when the diagram unmounts and comes back (another block, another
   *  tab). Default: the box ids. */
  scrollKey?: string;
  className?: string;
}

// Sideways scroll of each diagram, kept while the page lives.
const scrollMemory = new Map<string, number>();

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

// A label of a line up that does not fit on one line: taller gaps, GROW px at a time, up to GROW_MAX px more.
const GROW = 24;
const GROW_MAX = 144;

/** The label on 1 line, then wrapped onto 2, 3 and 4 lines as evenly as it goes. Breaks between Chinese characters
 *  and at spaces; never inside `code`, a word or a number, between a number and the word after it, before a closing
 *  mark or after an opening one. */
function wraps(text: string): string[][] {
  const atoms: string[] = [];
  for (const t of text.match(/`[^`]+`|[A-Za-z0-9_./:#@-]+|\s+|[\s\S]/gu) ?? []) {
    const prev = atoms[atoms.length - 1];
    // A number keeps the word after it (「3 次」).
    const unit = /\d\s*$/.test(prev ?? '') && !/^[A-Za-z0-9_]/.test(t);
    if (prev != null && (unit || /^[）」』、，。：；！？)\]]/.test(t) || /[（「『([]$/.test(prev))) atoms[atoms.length - 1] = prev + t;
    else atoms.push(t);
  }
  const fill = (max: number) => {
    const lines: string[] = [];
    let cur = '';
    for (const a of atoms) {
      if (/^\s+$/.test(a)) {
        if (cur) cur += a;
        continue;
      }
      if (cur && labelWidth(cur.trimEnd() + a) > max) {
        lines.push(cur.trimEnd());
        cur = a;
      } else cur += a;
    }
    if (cur.trim()) lines.push(cur.trimEnd());
    return lines;
  };
  const full = labelWidth(text);
  const out: string[][] = [[text]];
  for (let n = 2; n <= 4; n++) {
    // The narrowest width that still needs no more than n lines.
    let lo = Math.max(...atoms.filter((a) => a.trim()).map(labelWidth)) - 1;
    let hi = full;
    while (hi - lo > 1) {
      const mid = (lo + hi) / 2;
      if (fill(mid).length <= n) hi = mid;
      else lo = mid;
    }
    const lines = fill(hi);
    if (lines.length > out[out.length - 1].length) out.push(lines);
  }
  return out;
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
  devWarn(
    all.some((n) => n.external && n.shared),
    'LayerGraph',
    'a node is both external and shared; it is drawn as shared. Keep one of the two.',
  );
  // External boxes have no size: they are not part of the code being measured.
  const sizeOf = (n: LayerGraphNode) => (n.external && !n.shared ? undefined : (n.size ?? n.fns));
  const sharedIds = new Set(all.filter((n) => n.shared).map((n) => n.id));
  const main = all.filter((n) => !n.shared);
  const shared = all.filter((n) => n.shared);
  const edges = p.edges.filter((e) => !sharedIds.has(e.from) && !sharedIds.has(e.to));
  const byLayer = new Map<number, LayerGraphNode[]>();
  // External boxes form a row of their own above every layer; their lines then route like any other.
  const EXTERNAL = Number.NEGATIVE_INFINITY;
  for (const n of main) {
    const l = n.external ? EXTERNAL : n.layer || 0;
    byLayer.set(l, [...(byLayer.get(l) ?? []), n]);
  }
  const layers = [...byLayer.keys()].sort((a, b) => a - b);
  const cols = Math.max(1, ...layers.map((l) => byLayer.get(l)?.length ?? 0));
  let W = PAD * 2 + cols * NW + (cols - 1) * COL;
  // The gap under each layer: GAP, or more where the label of a line up needs the room (see the placement below).
  const gaps = layers.map(() => GAP);
  let H = 0;
  const pos: Record<string, { x: number; y: number }> = {};
  const layerIndex: Record<string, number> = {};
  layers.forEach((l, k) => {
    const row = byLayer.get(l) ?? [];
    const off = (W - (row.length * NW + (row.length - 1) * COL)) / 2;
    row.forEach((n, i) => {
      pos[n.id] = { x: off + i * (NW + COL), y: 0 };
      layerIndex[n.id] = k;
    });
  });
  const rowTop = (k: number) => PAD + k * NH + gaps.slice(0, k).reduce((a, b) => a + b, 0);
  const placeRows = () => {
    for (const id in pos) pos[id].y = rowTop(layerIndex[id]);
    H = rowTop(layers.length - 1) + NH + PAD;
  };
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
  const uid = React.useId().replace(/:/g, '');
  const [view, setView] = React.useState<'graph' | 'list'>('graph');
  const memKey = p.scrollKey ?? all.map((n) => n.id).join('|');
  // Back to the same diagram: where it was scrolled to (FB).
  React.useLayoutEffect(() => {
    const el = scrollRef.current;
    const x = scrollMemory.get(memKey);
    if (el && x) el.scrollLeft = x;
  }, [memKey, view, scrollRef]);
  const onScrollKeep = () => {
    const el = scrollRef.current;
    if (el) scrollMemory.set(memKey, el.scrollLeft);
    onScroll();
  };
  const selEdge = (pickEdge && edges.find((e) => edgeId(e) === p.selectedEdge)) || null;
  const nodeIdsAll = new Set(all.map((n) => n.id));
  // How often each item uses each shared item (edges into a shared item are not drawn). Other shared items count too,
  // so the shared item's line and the list (which shows every edge) give the same numbers.
  const uses: Record<string, Record<string, number>> = {};
  for (const e of p.edges)
    if (sharedIds.has(e.to) && e.from !== e.to && nodeIdsAll.has(e.from)) (uses[e.to] ??= {})[e.from] = (uses[e.to]?.[e.from] ?? 0) + (e.count || 0);
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
  // Room beside the boxes for the lanes only: the labels sit beside the lane, between the layers (PB), so they do not
  // widen the diagram. The left side shifts every box right, the right side widens it.
  if (upsL.length) {
    const left0 = Math.min(...main.map((n) => pos[n.id].x));
    const shift = Math.max(0, PAD + (upsL.length - 1) * LANE_STEP + LANE - left0);
    for (const id in pos) pos[id] = { x: pos[id].x + shift, y: pos[id].y };
    W += shift;
  }
  const boxesLeft = Math.min(...main.map((n) => pos[n.id].x));
  const boxesRight = Math.max(0, ...main.map((n) => pos[n.id].x + NW));
  const laneX = (e: LayerGraphEdge) => (onLeft(e) ? boxesLeft - LANE - upsL.indexOf(e) * LANE_STEP : boxesRight + LANE + upsR.indexOf(e) * LANE_STEP);
  // A label starts just inside the innermost lane on the left, or ends just inside it on the right.
  const upLabelX = boxesLeft - LANE + 8;
  const upLabelEndL = boxesRight + LANE - 8;
  if (upsR.length) W = Math.max(W, boxesRight + LANE + (upsR.length - 1) * LANE_STEP + PAD);
  const choose = (e: LayerGraphEdge) => {
    const id = edgeId(e);
    const next = p.selectedEdge === id ? null : id;
    if (next && sel != null) p.onSelect?.(null);
    pickEdge?.(next);
  };

  // Draws every line and places every label. A label of a line up that finds no spot clear of every line, even
  // wrapped, asks for a taller gap; the diagram is then drawn again with it.
  const draw = () => {
    const paths: React.ReactNode[] = [];
    const labels: React.ReactNode[] = [];
    const need = new Set<number>();
    // Gaps where a label found no spot even covering a line (it would sit on a box or another label).
    const crowd = new Set<number>();
    const marks: { idx: number; e: LayerGraphEdge; text: string; tx: number; ty: number; left: boolean; r: boolean; dim: boolean; up?: boolean }[] = [];
    // Lines that labels must not cover: the horizontal runs of the up lines, as [left, right, top, bottom].
    const runs: number[][] = [];
    // Every straight piece of every line, for the labels of up lines.
    const segs: { idx: number; box: number[] }[] = [];
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
          marks.push({ idx, e, text, tx: L ? upLabelX : upLabelEndL, ty: Math.round((y0 + y1) / 2), left: !L, r, dim, up: true });
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
        const y1 = sy + gaps[layerIndex[e.from]] / 2 + off;
        if (layerIndex[e.to] - layerIndex[e.from] > 1) {
          // Skipping a layer: go down a channel between the boxes of the next layer, the one nearest the middle.
          const next = (byLayer.get(layers[layerIndex[e.from] + 1]) ?? []).map((n) => pos[n.id]);
          const mid = (sx + tx) / 2;
          const chans = [next[0].x - COL / 2, ...next.map((q) => q.x + NW + COL / 2)].map((c) => Math.max(PAD / 2, Math.min(W - PAD / 2, c)));
          const chx = chans.reduce((best, c) => (Math.abs(c - mid) < Math.abs(best - mid) ? c : best), chans[0]) + off;
          const y2 = ty - gaps[layerIndex[e.to] - 1] / 2 + off;
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
      const cpts = clean(pts);
      for (let k = 1; k < cpts.length; k++) {
        const [ax, ay] = cpts[k - 1];
        const [bx, by] = cpts[k];
        segs.push({ idx, box: [Math.min(ax, bx) - 3, Math.max(ax, bx) + 3, Math.min(ay, by) - 3, Math.max(ay, by) + 3] });
      }
      const d = route(cpts, 10);
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
            aria-label={tr('{from} → {to}，{what}', {
              from: nameOf(e.from),
              to: nameOf(e.to),
              what: (e.inferred ? e.label || p.inferredLabel || tr('推測') : countText(e)).replace(/`/g, ''),
            })}
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
    // Boxes, which the labels of up lines (placed in the gaps beside the lanes) must not cover.
    const boxRects = main.map((n) => [pos[n.id].x, pos[n.id].x + NW, pos[n.id].y, pos[n.id].y + NH]);
    const hits = (x0: number, x1: number, y0: number, y1: number) =>
      placed.some((q) => x0 < q[1] + (q[4] || 0) && q[0] < x1 + (q[4] || 0) && y0 < q[3] && q[2] < y1);
    // On its own line: the line itself, not the room around it, since the label sits beside its own arrowhead and lane.
    const cross = (q: number[], x0: number, lw: number, y0: number, y1: number) => x0 < q[1] - 1 && q[0] + 1 < x0 + lw && y0 < q[3] - 1 && q[2] + 1 < y1;
    const labelEl = (m: (typeof marks)[number], x0: number, top: number, lines: string[] = [m.text]) => (
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
        {lines.map((t, i) => (
          <React.Fragment key={i}>
            {i ? <br /> : null}
            {labelParts(t)}
          </React.Fragment>
        ))}
      </span>
    );
    marks
      // Labels beside arrowheads first: their spot is fixed; the labels of lines up then look for room around them.
      .sort((m, n) => Number(!!m.up) - Number(!!n.up) || m.ty - n.ty || m.tx - n.tx)
      .forEach((m) => {
        const w = Math.ceil(labelWidth(m.text));
        if (m.up) {
          // Beside its lane, halfway between the two ends (the gap between layers); moved up, then down, off boxes,
          // lines and labels already placed, and kept inside the diagram. On one line when a spot is clear of every
          // line; else wrapped onto 2 to 4 lines, narrower so it fits between the lane and the next line; else the gap
          // grows and it is tried again. Only when the gap cannot grow further may it cover a line, on its white ground.
          const x0Of = (lw: number) => Math.max(PAD / 2, Math.min(W - PAD / 2 - lw, m.left ? m.tx - lw : m.tx));
          const start0 = Math.max(10, Math.min(H - 10, m.ty));
          const find = (x0: number, lw: number, lh: number, withLines: boolean) => {
            const over = (q: number[], y0: number, y1: number) => x0 < q[1] + 4 && q[0] < x0 + lw + 4 && y0 < q[3] + 4 && q[2] < y1 + 4;
            const bad = (y0: number, y1: number) =>
              hits(x0, x0 + lw, y0 - 4, y1 + 4) ||
              boxRects.some((q) => over(q, y0, y1)) ||
              (withLines && segs.some((g) => (g.idx === m.idx ? cross(g.box, x0, lw, y0, y1) : over(g.box, y0, y1))));
            for (let k = 0; k <= 16; k++)
              for (const dir of k ? [-1, 1] : [0]) {
                const t = start0 + dir * k * 18;
                if (t - lh / 2 >= 2 && t + lh / 2 <= H - 2 && !bad(t - lh / 2, t + lh / 2)) return t;
              }
            return null;
          };
          let spot: { x0: number; top: number; lw: number; lh: number; lines: string[] } | null = null;
          for (const lines of wraps(m.text)) {
            const lw = Math.ceil(Math.max(...lines.map(labelWidth)));
            const lh = lines.length * 16;
            const x0 = x0Of(lw);
            const top = find(x0, lw, lh, true);
            if (top != null) {
              spot = { x0, top, lw, lh, lines };
              break;
            }
          }
          if (!spot) {
            // The gap the label sits in: the one around its middle, else the one just above the line's source.
            const g = Math.max(
              0,
              Math.min(
                layers.length - 2,
                layers.findIndex((_, k) => k < layers.length - 1 && m.ty < rowTop(k + 1)),
              ),
            );
            need.add(g);
            const x0 = x0Of(w);
            const top = find(x0, w, 16, false);
            if (top == null) crowd.add(g);
            spot = { x0, top: top ?? start0, lw: w, lh: 16, lines: [m.text] };
          }
          // 4 px above and below too, so a label placed later does not sit flush against it.
          placed.push([spot.x0, spot.x0 + spot.lw, spot.top - spot.lh / 2 - 4, spot.top + spot.lh / 2 + 4, 6]);
          labels.push(labelEl(m, spot.x0, spot.top, spot.lines));
          return;
        }
        // Beside its arrowhead, on its side (see left), moved up 18 px at a time off labels and arrowheads. Clear of
        // every other line and every box too: else on the other side of the arrowhead, then wrapped onto 2 to 4 lines,
        // then the gap above the arrowhead grows and the diagram is drawn again.
        const g = layerIndex[m.e.to] - 1;
        // It stays in the gap right above its arrowhead: moved past the boxes above, it would sit beside other lines.
        const gapTop = g >= 0 ? rowTop(g) + NH : 0;
        const sideOf = (lw: number) => {
          let left = m.left;
          if (left && m.tx - 8 - lw < 0) left = false;
          else if (!left && m.tx + 8 + lw > W) left = m.tx - 8 - lw >= 0;
          return left;
        };
        const at = (left: boolean, lw: number) => (left ? m.tx - 8 - lw : Math.min(m.tx + 8, W - lw));
        const clear = (x0: number, lw: number, y0: number, y1: number) => {
          const over = (q: number[]) => x0 < q[1] + 2 && q[0] < x0 + lw + 2 && y0 < q[3] + 2 && q[2] < y1 + 2;
          return !hits(x0, x0 + lw, y0, y1) && !boxRects.some(over) && !segs.some((sg) => (sg.idx === m.idx ? cross(sg.box, x0, lw, y0, y1) : over(sg.box)));
        };
        let spot: { x0: number; top: number; lw: number; lh: number; lines: string[] } | null = null;
        for (const lines of wraps(m.text)) {
          const lw = Math.ceil(Math.max(...lines.map(labelWidth)));
          const lh = lines.length * 16;
          const pref = sideOf(lw);
          for (const left of [pref, !pref]) {
            const x0 = at(left, lw);
            if (x0 < 0 || x0 + lw > W) continue;
            for (let k = 0; k < 8 && !spot; k++) {
              const top = m.ty - 8 - lh / 2 - k * 18;
              if (top - lh / 2 < Math.max(2, gapTop + 2)) break;
              if (clear(x0, lw, top - lh / 2, top + lh / 2)) spot = { x0, top, lw, lh, lines };
            }
            if (spot) break;
          }
          if (spot) break;
        }
        if (!spot) {
          // No spot clear of every line: the gap grows while it can. Meanwhile, and once it cannot, the same search lets
          // the label cover a line (on its white ground), never a box or another label; as a last resort, as before
          // this rule: on its side, moved up off labels only.
          if (g >= 0) need.add(g);
          const offBoxes = (x0: number, lw: number, y0: number, y1: number) =>
            !hits(x0, x0 + lw, y0, y1) && !boxRects.some((q) => x0 < q[1] + 2 && q[0] < x0 + lw + 2 && y0 < q[3] + 2 && q[2] < y1 + 2);
          for (const lines of wraps(m.text)) {
            const lw = Math.ceil(Math.max(...lines.map(labelWidth)));
            const lh = lines.length * 16;
            const pref = sideOf(lw);
            for (const left of [pref, !pref]) {
              const x0 = at(left, lw);
              if (x0 < 0 || x0 + lw > W) continue;
              for (let k = 0; k < 8 && !spot; k++) {
                const top = m.ty - 8 - lh / 2 - k * 18;
                if (top - lh / 2 < Math.max(2, gapTop + 2)) break;
                if (offBoxes(x0, lw, top - lh / 2, top + lh / 2)) spot = { x0, top, lw, lh, lines };
              }
              if (spot) break;
            }
            if (spot) break;
          }
          if (!spot) {
            if (g >= 0) crowd.add(g);
            const x0 = at(sideOf(w), w);
            let top = m.ty - 16;
            for (let k = 0; k < 8 && hits(x0, x0 + w, top - 8, top + 8); k++) top -= 18;
            spot = { x0, top, lw: w, lh: 16, lines: [m.text] };
          }
        }
        placed.push([spot.x0, spot.x0 + spot.lw, spot.top - spot.lh / 2, spot.top + spot.lh / 2, 6]);
        labels.push(labelEl(m, spot.x0, spot.top, spot.lines));
      });
    return { paths, labels, hitPaths, need, crowd };
  };
  placeRows();
  let drawn = draw();
  // At most GROW_MAX / GROW redraws: each one widens every gap that a label asked for.
  const grows = () => [...drawn.need].filter((g) => gaps[g] < GAP + GROW_MAX);
  for (let k = 0; k < GROW_MAX / GROW && grows().length; k++) {
    for (const g of grows()) gaps[g] = Math.min(GAP + GROW_MAX, gaps[g] + GROW);
    placeRows();
    drawn = draw();
  }
  // A gap that grew to the most and still did not help goes back to GAP: the room bought nothing.
  const stuck = [...drawn.need].filter((g) => gaps[g] >= GAP + GROW_MAX);
  if (stuck.length) {
    for (const g of stuck) gaps[g] = GAP;
    placeRows();
    drawn = draw();
    // Then only as much room as the labels need to cover a line rather than a box or each other (several labelled
    // lines into one box, too close together for any label to miss the others' lines).
    const crowded = () => [...drawn.crowd].filter((g) => stuck.includes(g) && gaps[g] < GAP + GROW_MAX);
    for (let k = 0; k < GROW_MAX / GROW && crowded().length; k++) {
      for (const g of crowded()) gaps[g] = Math.min(GAP + GROW_MAX, gaps[g] + GROW);
      placeRows();
      drawn = draw();
    }
  }
  const { paths, labels, hitPaths } = drawn;
  const sizeText = p.sizeLabel ?? tr('{n} 個項目');
  const externalText = p.externalLabel ?? tr('repo 外');
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
        className={cx('ui-lg-node', n.external && 'is-external', on && 'is-selected', !near(n.id) && 'is-dim')}
        style={{ left: q.x, top: q.y, width: NW, height: NH }}
        aria-pressed={p.onSelect ? on : undefined}
        onClick={p.onSelect ? () => pick(n.id, on) : undefined}
      >
        <span className="ui-lg-head">
          <span className="ui-lg-name">{n.name || n.id}</span>
          {used ? <span className="ui-lg-use">{monoNums(useText.replace('{n}', '\u0001'), [used])}</span> : null}
        </span>
        {n.external ? <span className="ui-lg-ext">{externalText}</span> : null}
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
    // A selected box dims the shared items it does not use; a selected shared item keeps the shared items it uses or
    // that use it.
    const dim = !!selEdge || (sel != null && !on && (selShared != null ? !(s.id in (uses[selShared] ?? {})) && !(selShared in by) : !(sel in by)));
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
  // The list: every box (name, size) and every line (「A → B：label」), selectable like the diagram (XC).
  const edgeText = (e: LayerGraphEdge) =>
    e.inferred
      ? e.label
        ? tr('{label}（{inferred}）', { label: e.label, inferred: p.inferredLabel || tr('推測') })
        : p.inferredLabel || tr('推測')
      : countText(e);
  const listItem = (key: string, on: boolean, dim: boolean, onClick: (() => void) | undefined, head: React.ReactNode, rest: React.ReactNode) => (
    <li key={key} className={cx('ui-lg-li', dim && 'is-dim')}>
      {onClick ? (
        <button type="button" className={cx('ui-lg-libtn', on && 'is-selected')} aria-pressed={on} onClick={onClick}>
          {head}
        </button>
      ) : (
        <span className="ui-lg-lihead">{head}</span>
      )}
      {rest}
    </li>
  );
  const nodeIds = new Set(all.map((n) => n.id));
  const list = (
    <div className="ui-lg-list">
      <section aria-labelledby={`${uid}-ln`}>
        <h3 id={`${uid}-ln`} className="ui-lg-listtitle">
          {p.listLabels?.nodes ?? tr('項目')}
        </h3>
        <ul>
          {all.map((n) => {
            const size = sizeOf(n);
            return listItem(
              n.id,
              n.id === sel,
              !near(n.id),
              p.onSelect ? () => pick(n.id, n.id === sel) : undefined,
              <span className="ui-lg-code">{n.name || n.id}</span>,
              n.external && !n.shared ? (
                <span className="ui-lg-limeta">
                  {tr('，')}
                  {externalText}
                </span>
              ) : size != null ? (
                <span className="ui-lg-limeta">
                  {tr('，')}
                  {monoNums(sizeText.replace('{n}', '\u0001'), [size])}
                </span>
              ) : null,
            );
          })}
        </ul>
      </section>
      <section aria-labelledby={`${uid}-le`}>
        <h3 id={`${uid}-le`} className="ui-lg-listtitle">
          {p.listLabels?.edges ?? tr('關係')}
        </h3>
        <ul>
          {p.edges
            .filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to))
            .map((e, i) =>
              listItem(
                edgeId(e) + ':' + i,
                e === selEdge,
                focus && !related(e) && !(selShared && e.to === selShared),
                pickEdge && edges.includes(e) ? () => choose(e) : undefined,
                <>
                  <span className="ui-lg-code">{nameOf(e.from)}</span> → <span className="ui-lg-code">{nameOf(e.to)}</span>
                </>,
                <span className="ui-lg-limeta">
                  {tr('：')}
                  {labelParts(edgeText(e))}
                </span>,
              ),
            )}
        </ul>
      </section>
    </div>
  );
  const showList = p.listView !== false && view === 'list';
  return (
    <div className={cx('ui-graph ui-lg', p.className)}>
      {p.listView === false ? null : (
        <div className="ui-lg-bar">
          <Tabs
            label={tr('顯示方式')}
            value={view}
            onChange={setView}
            items={[
              { id: 'graph', label: tr('圖') },
              { id: 'list', label: tr('清單') },
            ]}
          />
        </div>
      )}
      {showList ? list : null}
      <div className={cx('ui-lg-scroller', scrollMore && 'has-more', showList && 'is-hidden')}>
        <div className="ui-lg-scroll" ref={scrollRef} onScroll={onScrollKeep}>
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
      {showList ? null : <ScrollHint show={overflows} done={scrolled} />}
      {shared.length && !showList ? (
        <div className="ui-lg-shared">
          <div className="ui-lg-shared-title">{p.sharedLabel || tr('共用項目')}</div>
          <div className="ui-lg-chips">{sharedBoxes}</div>
        </div>
      ) : null}
      {showList || p.legend === false || (!p.legendItems && !edges.some((e) => pos[e.from] && pos[e.to])) ? null : (
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
