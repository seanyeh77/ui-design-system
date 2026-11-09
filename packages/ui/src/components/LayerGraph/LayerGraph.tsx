import * as React from 'react';
import { GraphLegend, type GraphLegendItem } from '../Graph/Graph';
import { Tabs } from '../Tabs/Tabs';
import { IconButton } from '../IconButton/IconButton';
import { tr } from '../../i18n';
import { format } from '../../format';
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
  /** Declared by the project, e.g. in a config file, rather than seen by a compiler: long-short dashes and labelled
   *  like an inferred edge, but with a basis. Wins over `inferred`. */
  declared?: boolean;
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
  /** Labels on lines at first: 'shown' (default) always; 'hover' only while the pointer is on the line or its label, the
   *  line has keyboard focus, or it is selected or belongs to the selected box. The diagram keeps the room for every
   *  label. People switch with the tag button next to 「圖／清單」; their choice is remembered (localStorage). */
  edgeLabels?: 'shown' | 'hover';
  /** false: no button to show or hide line labels. Default true (shown when the diagram has labelled lines). */
  labelToggle?: boolean;
  /** px. Default 200. */
  nodeWidth?: number;
  /** Text under a box's size bar: a string with {n}, or a function of the size for words that change with the number
   *  (`(n) => n === 1 ? '1 function' : `${n} functions``). Default 「{n} 個項目」. */
  sizeLabel?: string | ((n: number) => string);
  /** Label of a selected edge's count: a string with {n}, or a function of the count (`(n) => n === 1 ? '1 call' : …`).
   *  Default 「{n} 次」 (English 「1 call」, 「2 calls」). */
  countLabel?: string | ((n: number) => string);
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
  /** The word for declared edges, after a label in the list. Default 「宣告」. */
  declaredLabel?: string;
  /** The legend entry for declared edges. Default 「專案宣告的關係」. */
  declaredLegend?: string;
  /** Explains declared edges in the legend (a Term), e.g. which file declares them. */
  declaredText?: string;
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

/** A label with a number: {n} in a string, or a function of the number; the number comes back as \u0001 (monoNums). */
function withNum(label: string | ((n: number) => string) | undefined, n: number, fallback: (n: number) => string): string {
  if (typeof label === 'function') {
    const t = label(n);
    for (const s of [format.number(n), String(n)]) if (t.includes(s)) return t.replace(s, '\u0001');
    return t;
  }
  return (label ?? fallback(n)).replace('{n}', '\u0001');
}

/** The default for one (「1 call」) where the language has its own word for it, else the {n} form. */
function byCount(n: number, one: string, many: string): string {
  const t = n === 1 ? tr(one) : '';
  return t && t !== one ? t : tr(many);
}

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
// The line-label button keeps its choice in localStorage under this prefix and the diagram's key.
const LABELS_KEY = 'ui-lg-labels:';
const allIds = (nodes: LayerGraphNode[]) => nodes.map((n) => n.id).join('|');
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
    if (prev != null && (unit || /^[）」』、，。：；！？)\],;!?]/.test(t) || /[（「『([]$/.test(prev))) atoms[atoms.length - 1] = prev + t;
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
 *  shared items are listed under the diagram instead of drawn. Wider than its box: the boxes narrow (down to 120 px),
 *  then the whole diagram scales down (to 0.75 at least); past that it scrolls sideways at full width (PM, WA). */
export function LayerGraph(p: LayerGraphProps) {
  // PM: the width of the box the diagram sits in, and the fit worked out for that width.
  const [avail, setAvail] = React.useState(0);
  const [fit, setFit] = React.useState<{ at: number; nw: number; col: number; scale: number; full?: boolean } | null>(null);
  const fitted = fit && fit.at === avail ? fit : null;
  const NW = fitted?.nw ?? (p.nodeWidth || 200);
  const NH = 60;
  const GAP = 56;
  // Space added between boxes, 24 px at a time (up to 5 times), while a label still has to cover a line.
  // Kept per diagram and per width: other boxes or lines, or a resized box, start again from no added space.
  const spreadKey = avail + '#' + p.nodes.map((n) => n.id).join('|') + '#' + p.edges.map((e) => e.from + '>' + e.to + ':' + (e.label ?? '')).join('|');
  const [spreadAt, setSpread] = React.useState({ key: '', n: 0 });
  const spread = spreadAt.key === spreadKey ? spreadAt.n : 0;
  const COL = (fitted?.col ?? 40) + spread * 24;
  const scale = fitted?.scale ?? 1;
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
  // Lines with a label of their own and no count: inferred, or declared by the project (DC).
  const lab = (e: LayerGraphEdge) => !!(e.inferred || e.declared);
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
  // An external box alone in its row keeps its full width when the others narrow (PM), centred where it was, so its
  // name is not cut (「被追蹤的程式」).
  const extRow = byLayer.get(EXTERNAL) ?? [];
  const extW = Math.max(NW, Math.min(p.nodeWidth || 200, W - PAD));
  const boxOf = (id: string) => {
    const wide = extRow.length === 1 && extRow[0].id === id ? extW : NW;
    return { x: pos[id].x + (NW - wide) / 2, w: wide };
  };
  const placeRows = () => {
    for (const id in pos) pos[id].y = rowTop(layerIndex[id]);
    H = rowTop(layers.length - 1) + NH + PAD + (flatRow[layers.length - 1]?.length ? FLAT_ROOM : 0);
  };
  const maxSize = Math.max(1, ...main.map((n) => sizeOf(n) || 0));
  const maxCount = Math.max(1, ...edges.map((e) => e.count || 0));
  // A line to a higher layer (a data channel back up): it leaves the source's right side, runs up a lane along the
  // diagram's right edge and enters the target's right side. The diagram widens on the right for the lanes and labels.
  const isUp = (e: LayerGraphEdge) => !!pos[e.from] && !!pos[e.to] && layerIndex[e.to] < layerIndex[e.from];
  // A line between two boxes of one layer: out of the source's bottom, across the gap below the row, up into the
  // target's bottom (it used to be drawn as a line down and climbed through the target box).
  const isFlat = (e: LayerGraphEdge) => !!pos[e.from] && !!pos[e.to] && e.from !== e.to && layerIndex[e.to] === layerIndex[e.from];
  const flatIn: Record<string, LayerGraphEdge[]> = {};
  const flatRow: Record<number, LayerGraphEdge[]> = {};
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
    if (isFlat(e)) {
      (flatIn[e.to] ??= []).push(e);
      (flatRow[layerIndex[e.from]] ??= []).push(e);
      continue;
    }
    (ins[e.to] ??= []).push(e);
  }
  // The last row's flat lines need room under it; others use the gap below their row.
  const FLAT_ROOM = 20 + 10 * Math.max(0, (flatRow[layers.length - 1]?.length ?? 0) - 1);
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
  const [labelsOn, setLabelsOn] = React.useState<boolean>(() => {
    try {
      const v = window.localStorage.getItem(LABELS_KEY + (p.scrollKey ?? allIds(p.nodes)));
      if (v === '1' || v === '0') return v === '1';
    } catch {
      // Storage blocked: start from edgeLabels.
    }
    return p.edgeLabels !== 'hover';
  });
  const peek = !labelsOn;
  const switchLabels = () => {
    const on = !labelsOn;
    setLabelsOn(on);
    try {
      window.localStorage.setItem(LABELS_KEY + (p.scrollKey ?? allIds(p.nodes)), on ? '1' : '0');
    } catch {
      // Storage blocked or full: the labels still switch, the choice is just not remembered.
    }
  };
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
  const countText = (e: LayerGraphEdge) => {
    const n = e.count ?? 0;
    return typeof p.countLabel === 'function' ? p.countLabel(n) : (p.countLabel ?? byCount(n, '1 次', '{n} 次')).replace('{n}', format.number(n));
  };
  // The label a line down gets: its own label for an inferred line, else its count (when related to the selection).
  // Two or more lines with the same label (「執行 ibmon」 from two boxes) cannot be told apart: each gets its source in
  // front, 「來自 src/cli，…」.
  // In a language with capitals, 「Passes data…」 after 「From x, 」 starts lower case (not an acronym like 「SHM」).
  const midSentence = (t: string) => (/^[A-Z][a-z]/.test(t) && !/^zh/i.test(format.locale()) ? t[0].toLowerCase() + t.slice(1) : t);
  // Only labels the app wrote: lines without one all show the same 「推測」, and that needs no source.
  const sameLabel = new Map<string, number>();
  for (const e of edges) if (lab(e) && e.label && pos[e.from] && pos[e.to]) sameLabel.set(e.label, (sameLabel.get(e.label) ?? 0) + 1);
  const kindWord = (e: LayerGraphEdge) => (e.declared ? p.declaredLabel || tr('宣告') : p.inferredLabel || tr('推測'));
  const inferredText = (e: LayerGraphEdge) =>
    e.label && (sameLabel.get(e.label) ?? 0) > 1 ? tr('來自 {from}，{label}', { from: nameOf(e.from), label: midSentence(e.label) }) : e.label || kindWord(e);
  const markText = (e: LayerGraphEdge) => (lab(e) ? inferredText(e) : countText(e));
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

  // MA: two or more labelled lines down into one box each make their last turn at a height of their own in the gap
  // above it, LANE_H px apart, the rightmost arrow lowest; each label sits on its own line's height just past its
  // turn, so no other line runs through it. labelled: the lines that get a label (inferred, or related to the
  // selection, which shows the count).
  const LANE_H = 28;
  const txOf = (e: LayerGraphEdge) => Math.round(pos[e.to].x + (NW * (ins[e.to].indexOf(e) + 1)) / (ins[e.to].length + 1));
  const laneGroups: Record<string, LayerGraphEdge[]> = {};
  const laneCount: Record<string, number> = {};
  {
    const into: Record<string, LayerGraphEdge[]> = {};
    for (const e of edges) if (ins[e.to]?.includes(e) && (lab(e) || related(e))) (into[e.to] ??= []).push(e);
    for (const id in into) {
      if (into[id].length < 2) continue;
      // The rightmost arrow first: lane 0 (the lowest) in the default order.
      laneGroups[id] = into[id].sort((a, b) => txOf(b) - txOf(a));
      laneCount[id] = into[id].length;
    }
  }
  // Draws every line and places every label. A label of a line up that finds no spot clear of every line, even
  // wrapped, asks for a taller gap; the diagram is then drawn again with it.
  const draw = () => {
    const paths: React.ReactNode[] = [];
    const labels: React.ReactNode[] = [];
    const need = new Set<number>();
    // Gaps where a label found no spot even covering a line (it would sit on a box or another label).
    const crowd = new Set<number>();
    // Labels that found no spot clear of every line and cover one: the space between boxes then grows (see spread).
    let covered = 0;
    // Where a line down leaves, turns and arrives (no lanes yet): shared by the lane search and the drawing.
    const geomOf = (e: LayerGraphEdge) => {
      const a = pos[e.from];
      const b = pos[e.to];
      const oi = outs[e.from].indexOf(e);
      const on = outs[e.from].length;
      const sx = outX(a.x, oi, on);
      const sy = a.y + NH;
      const tx = txOf(e);
      const ty = b.y;
      const off = (oi - (on - 1) / 2) * 6;
      const skip = layerIndex[e.to] - layerIndex[e.from] > 1;
      const y1 = sy + gaps[layerIndex[e.from]] / 2 + off;
      let chx = sx;
      if (skip) {
        // Skipping a layer: go down a channel between the boxes of the next layer, the one nearest the middle.
        const next = (byLayer.get(layers[layerIndex[e.from] + 1]) ?? []).map((n) => pos[n.id]);
        const mid = (sx + tx) / 2;
        const chans = [next[0].x - COL / 2, ...next.map((q) => q.x + NW + COL / 2)].map((c) => Math.max(PAD / 2, Math.min(W - PAD / 2, c)));
        chx = chans.reduce((best, c) => (Math.abs(c - mid) < Math.abs(best - mid) ? c : best), chans[0]) + off;
      }
      // The last turn starts at from, after a vertical from startY.
      return { sx, sy, tx, ty, off, skip, y1, chx, from: skip ? chx : sx, startY: skip ? y1 : sy };
    };
    // MA: the turn heights of the labelled lines into one box. Every order is tried (up to 6 lines), each label on
    // either side of its own turn, and the order where the most labels miss every vertical line of the group wins;
    // a tie keeps the rightmost arrow lowest. A label still blocked falls back to the search below.
    const lanes = new Map<LayerGraphEdge, { y: number; side: 'right' | 'left' }>();
    // Where the lines leave a box: spread over its whole width, 16 px in from each edge, so the labels of the lines
    // that leave it have room between them; one line leaves from the middle.
    const outX = (x: number, i: number, n: number) => Math.round(n < 2 ? x + NW / 2 : x + 16 + ((NW - 32) * i) / (n - 1));
    // A flat line (same layer): its source x, its run's height in the gap below the row, its target x.
    const flatOf = (e: LayerGraphEdge) => {
      const a = pos[e.from];
      const b = pos[e.to];
      const oi = outs[e.from].indexOf(e);
      const on = outs[e.from].length;
      const sx = outX(a.x, oi, on);
      const j = flatRow[layerIndex[e.from]].indexOf(e);
      const ti = flatIn[e.to].indexOf(e);
      const tx = Math.round(b.x + NW - 24 - ti * 12);
      return { sx, sy: a.y + NH, y: a.y + NH + 14 + j * 10, tx, ty: b.y + NH };
    };
    // The vertical runs of every line, as drawn before lanes are chosen: what a label of the group must also miss
    // (a line skipping a layer down its channel, the lines into other boxes, the lanes of the lines up).
    const vertsOf = (e: LayerGraphEdge) => {
      if (isFlat(e)) {
        const f = flatOf(e);
        return [
          { x: f.sx, y0: f.sy, y1: f.y },
          { x: f.tx, y0: f.ty, y1: f.y },
        ];
      }
      if (isUp(e)) {
        const x = laneX(e);
        return [{ x, y0: pos[e.to].y, y1: pos[e.from].y + NH }];
      }
      const g = geomOf(e);
      if (!g.skip)
        return [
          { x: g.sx, y0: g.sy, y1: g.y1 },
          { x: g.tx, y0: g.y1, y1: g.ty },
        ];
      const y2 = g.ty - gaps[layerIndex[e.to] - 1] / 2 + g.off;
      return [
        { x: g.sx, y0: g.sy, y1: g.y1 },
        { x: g.chx, y0: g.y1, y1: y2 },
        { x: g.tx, y0: y2, y1: g.ty },
      ];
    };
    for (const id in laneGroups) {
      const group = laneGroups[id].map((e) => ({ e, g: geomOf(e), w: Math.ceil(labelWidth(markText(e))) }));
      const others = edges.filter((e) => !laneGroups[id].includes(e) && pos[e.from] && pos[e.to]).flatMap((e) => vertsOf(e).map((v) => ({ k: -1, ...v })));
      const n = group.length;
      const laneY = (j: number) => group[0].g.ty - 8 - 16 - j * LANE_H;
      const perms: number[][] = [];
      const permute = (rest: number[], acc: number[]) => {
        if (!rest.length) perms.push(acc);
        else rest.forEach((x, k) => permute([...rest.slice(0, k), ...rest.slice(k + 1)], [...acc, x]));
      };
      if (n <= 6) permute([...group.keys()], []);
      else perms.push([...group.keys()]);
      let best: { fails: number; ys: number[]; sides: ('right' | 'left')[] } | null = null;
      for (const perm of perms) {
        // perm[j] is the edge on lane j (0 the lowest).
        const ys: number[] = [];
        perm.forEach((k, j) => (ys[k] = laneY(j)));
        const verts = [
          ...group.flatMap((q, k) => [
            { k, x: q.g.from, y0: q.g.startY, y1: ys[k] },
            { k, x: q.g.tx, y0: ys[k], y1: q.g.ty - 8 },
          ]),
          ...others,
        ];
        // Past the left edge is fine: the diagram widens to the left for it.
        const free = (k: number, x0: number, x1: number) =>
          verts.every((v) =>
            v.k === k
              ? !(v.x > x0 - 1 && v.x < x1 + 1 && v.y0 < ys[k] + 7 && v.y1 > ys[k] - 7)
              : !(v.x > x0 - 5 && v.x < x1 + 5 && v.y0 < ys[k] + 10 && v.y1 > ys[k] - 10),
          );
        let fails = 0;
        const sides: ('right' | 'left')[] = [];
        group.forEach((q, k) => {
          const r0 = Math.max(q.g.from, q.g.tx) + 8;
          const l1 = Math.min(q.g.from, q.g.tx) - 8;
          if (free(k, r0, r0 + q.w)) sides[k] = 'right';
          else if (free(k, l1 - q.w, l1)) sides[k] = 'left';
          else {
            sides[k] = 'right';
            fails++;
          }
        });
        if (!best || fails < best.fails) best = { fails, ys, sides };
        if (!fails) break;
      }
      if (best) group.forEach((q, k) => lanes.set(q.e, { y: best.ys[k], side: best.sides[k] }));
    }
    const marks: {
      idx: number;
      e: LayerGraphEdge;
      text: string;
      tx: number;
      ty: number;
      left: boolean;
      r: boolean;
      dim: boolean;
      up?: boolean;
      flat?: boolean;
      lane?: number | null;
      from?: number;
      side?: 'right' | 'left';
    }[] = [];
    // How far right the labels reach: the diagram widens to keep a label whole (MA).
    let wide = 0;
    let least = 0;
    // Lines that labels must not cover: the horizontal runs of the up lines, as [left, right, top, bottom].
    const runs: number[][] = [];
    // Every straight piece of every line, for the labels of up lines.
    const segs: { idx: number; box: number[] }[] = [];
    // Each line's corner points, for the search along its own line.
    const ptsOf: Record<number, Pt[]> = {};
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
      // MA: the height of the line's last turn and where that turn starts (see laneOf).
      let laneAt: number | null = null;
      let turnFrom = 0;
      let laneSide: 'right' | 'left' = 'right';
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
        if (lab(e) || r) {
          const text = markText(e);
          marks.push({ idx, e, text, tx: L ? upLabelX : upLabelEndL, ty: Math.round((y0 + y1) / 2), left: !L, r, dim, up: true });
        }
      } else if (isFlat(e)) {
        const f = flatOf(e);
        tx = f.tx;
        ty = f.ty;
        pts = [
          [f.sx, f.sy],
          [f.sx, f.y],
          [f.tx, f.y],
          [f.tx, f.ty + 9],
        ];
        arrow = `M${tx - 5} ${ty + 9} L${tx + 5} ${ty + 9} L${tx} ${ty} Z`;
        arrows.push([tx - 5, tx + 5, ty, ty + 9]);
        runs.push([Math.min(f.sx, f.tx), Math.max(f.sx, f.tx), f.y - 3, f.y + 3]);
        if (lab(e) || r) {
          const text = markText(e);
          marks.push({ idx, e, text, tx: Math.round((f.sx + f.tx) / 2), ty: f.y, left: false, r, dim, flat: true });
        }
      } else {
        inn = ins[e.to].length;
        const g = geomOf(e);
        const { sx, sy, skip } = g;
        tx = g.tx;
        ty = g.ty;
        const lane = lanes.get(e);
        const laneY = lane ? lane.y : null;
        const y1 = !skip && laneY != null ? laneY : g.y1;
        if (skip) {
          const y2 = laneY ?? ty - gaps[layerIndex[e.to] - 1] / 2 + g.off;
          pts = [
            [sx, sy],
            [sx, y1],
            [g.chx, y1],
            [g.chx, y2],
            [tx, y2],
            [tx, ty - 8],
          ];
        } else {
          pts = [
            [sx, sy],
            [sx, y1],
            [tx, y1],
            [tx, ty - 8],
          ];
        }
        turnFrom = g.from;
        laneAt = laneY;
        laneSide = lane?.side ?? 'right';
        arrow = `M${tx - 5} ${ty - 9} L${tx + 5} ${ty - 9} L${tx} ${ty} Z`;
        arrows.push([tx - 5, tx + 5, ty - 9, ty]);
      }
      // Hover on a selectable line: darker and 2 px thicker.
      const w = (lab(e) ? 1.5 : 1.5 + 5.5 * ((e.count || 0) / maxCount)) + (picked ? 1.5 : 0) + (hovered ? 2 : 0);
      const cpts = clean(pts);
      ptsOf[idx] = cpts;
      for (let k = 1; k < cpts.length; k++) {
        const [ax, ay] = cpts[k - 1];
        const [bx, by] = cpts[k];
        segs.push({ idx, box: [Math.min(ax, bx) - 3, Math.max(ax, bx) + 3, Math.min(ay, by) - 3, Math.max(ay, by) + 3] });
      }
      const d = route(cpts, 10);
      paths.push(
        <path
          key={'p' + idx}
          className={cx('ui-lg-edge', e.declared ? 'is-declared' : e.inferred && 'is-inferred', r && 'is-related', dim && 'is-dim', hovered && 'is-hover')}
          d={d}
          strokeWidth={w}
        />,
      );
      if (!pickEdge && peek) {
        // edgeLabels 'hover' without selectable lines: an invisible path that only shows the label while hovered.
        hitPaths.push(
          <path key={'h' + idx} className="ui-lg-hit is-peek" d={d} onPointerEnter={() => setHover(edgeId(e))} onPointerLeave={() => setHover(null)} />,
        );
      }
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
              what: markText(e).replace(/`/g, ''),
            })}
            aria-pressed={picked}
            onClick={(ev) => {
              ev.stopPropagation();
              choose(e);
            }}
            onPointerEnter={() => setHover(edgeId(e))}
            onPointerLeave={() => setHover(null)}
            onFocus={peek ? () => setHover(edgeId(e)) : undefined}
            onBlur={peek ? () => setHover(null) : undefined}
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
      if (!up && !isFlat(e) && (lab(e) || r)) {
        const text = markText(e);
        // Several arrows into one box: an arrow in the left half puts its label on its left.
        marks.push({ idx, e, text, tx, ty, left: inn > 1 && tx < b.x + NW / 2, r, dim, lane: laneAt, from: turnFrom, side: laneSide });
      }
    });
    // Labels sit beside their arrowheads, inside the diagram; one that would touch a placed label or an arrowhead moves up 18 px.
    // Obstacles are [left, right, top, bottom, gap].
    const placed = [...arrows, ...runs];
    // Boxes, which the labels of up lines (placed in the gaps beside the lanes) must not cover.
    const boxRects = main.map((n) => [boxOf(n.id).x, boxOf(n.id).x + boxOf(n.id).w, pos[n.id].y, pos[n.id].y + NH]);
    const hits = (x0: number, x1: number, y0: number, y1: number) =>
      placed.some((q) => x0 < q[1] + (q[4] || 0) && q[0] < x1 + (q[4] || 0) && y0 < q[3] && q[2] < y1);
    // On its own line: the line itself, not the room around it, since the label sits beside its own arrowhead and lane.
    const cross = (q: number[], x0: number, lw: number, y0: number, y1: number) => x0 < q[1] - 1 && q[0] + 1 < x0 + lw && y0 < q[3] - 1 && q[2] + 1 < y1;
    // Along its own line: beside each vertical run (either side) and above or below each horizontal run, every 6 px,
    // on one line or wrapped; clear of every other line, box, arrowhead and placed label. The clear spot nearest the
    // arrowhead wins. Used when the spots beside the arrowhead (or the lane, for a line up) are all blocked.
    const alongLine = (m: { idx: number; text: string; tx: number; ty: number }) => {
      const pts = ptsOf[m.idx] ?? [];
      const ok = (x0: number, lw: number, y0: number, y1: number) =>
        x0 >= PAD / 2 &&
        x0 + lw <= W - PAD / 2 &&
        y0 >= 2 &&
        y1 <= H - 2 &&
        !hits(x0 - 2, x0 + lw + 2, y0 - 2, y1 + 2) &&
        !boxRects.some((q) => x0 < q[1] + 4 && q[0] < x0 + lw + 4 && y0 < q[3] + 4 && q[2] < y1 + 4) &&
        !segs.some((sg) =>
          sg.idx === m.idx ? cross(sg.box, x0, lw, y0, y1) : x0 < sg.box[1] + 2 && sg.box[0] < x0 + lw + 2 && y0 < sg.box[3] + 2 && sg.box[2] < y1 + 2,
        );
      for (const lines of wraps(m.text)) {
        const lw = Math.ceil(Math.max(...lines.map(labelWidth)));
        const lh = lines.length * 16;
        let best: { x0: number; top: number; d: number } | null = null;
        for (let k = 1; k < pts.length; k++) {
          const [ax, ay] = pts[k - 1];
          const [bx, by] = pts[k];
          const len = Math.hypot(bx - ax, by - ay);
          for (let t = 0; t <= len; t += 6) {
            const x = ax + ((bx - ax) * t) / len;
            const y = ay + ((by - ay) * t) / len;
            const cands =
              ax === bx
                ? [
                    [x + 8, y],
                    [x - 8 - lw, y],
                  ]
                : [
                    [x - lw / 2, y - 6 - lh / 2],
                    [x - lw / 2, y + 6 + lh / 2],
                  ];
            for (const [x0, top] of cands) {
              // The distance first: a spot no nearer than the best one is not checked against every line.
              const d = Math.hypot(x0 + lw / 2 - m.tx, top - m.ty);
              if (best && d >= best.d) continue;
              if (ok(x0, lw, top - lh / 2, top + lh / 2)) best = { x0, top, d };
            }
          }
        }
        if (best) return { x0: Math.round(best.x0), top: Math.round(best.top), lw, lh, lines };
      }
      return null;
    };
    const labelEl = (m: (typeof marks)[number], x0: number, top: number, lines: string[] = [m.text], over = false) => (
      // With onSelectEdge the label selects its edge too (a mouse and touch target; keyboard uses the line itself).
      <span
        key={'l' + m.idx}
        // The line's own button carries this text; read once, not again beside it.
        aria-hidden={pickEdge ? true : undefined}
        className={cx(
          'ui-lg-label',
          // Over a line (no clear spot): a solid ground, so the line stops at the label instead of showing between letters.
          over && 'is-over',
          pickEdge && 'is-clickable',
          pickEdge && hover === edgeId(m.e) && 'is-hover',
          m.r && 'is-related',
          m.dim && 'is-dim',
          // edgeLabels 'hover': hidden until its line is hovered, focused or selected; the room stays reserved.
          peek && !m.r && hover !== edgeId(m.e) && m.e !== selEdge && 'is-quiet',
        )}
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
    // A label of a line down with no spot clear of every line waits until every other label has its spot: it then
    // covers a line, and the labels that do have a clear spot keep it.
    const later: (typeof marks)[number][] = [];
    const place = (m: (typeof marks)[number], last: boolean) => {
      const w = Math.ceil(labelWidth(m.text));
      if (m.flat) {
        // Along its own line, nearest the middle of its run; else the gap below the row grows, and as a last resort
        // it sits above the middle of the run.
        let spot = alongLine(m);
        if (!spot) {
          const g = layerIndex[m.e.from];
          if (g < layers.length - 1) need.add(g);
          covered++;
          // Off boxes and labels at least: below the run, moved down 18 px at a time.
          const x0 = Math.max(PAD / 2, Math.min(W - PAD / 2 - w, m.tx - w / 2));
          const taken = (t: number) =>
            hits(x0, x0 + w, t - 10, t + 10) || boxRects.some((q) => x0 < q[1] + 2 && q[0] < x0 + w + 2 && t - 10 < q[3] && q[2] < t + 10);
          let top = m.ty + 14;
          for (let k = 0; k < 8 && taken(top); k++) top += 18;
          spot = { x0, top, lw: w, lh: 16, lines: [m.text] };
        }
        placed.push([spot.x0, spot.x0 + spot.lw, spot.top - spot.lh / 2 - 4, spot.top + spot.lh / 2 + 4, 6]);
        labels.push(labelEl(m, spot.x0, spot.top, spot.lines));
        return;
      }
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
        if (!spot) spot = alongLine(m);
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
          covered++;
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
      // MA: on its own turn's height, just past the turn, on one line; the diagram widens for it.
      // One line first; then 2 to 4 lines, narrower, still centred on its turn's height beside the turn.
      if (m.lane != null) {
        const lane = m.lane;
        for (const lines of wraps(m.text)) {
          if (spot) break;
          const lw = Math.ceil(Math.max(...lines.map(labelWidth)));
          const lh = lines.length * 16;
          const right = Math.max(m.tx, m.from ?? m.tx) + 8;
          const left = Math.min(m.tx, m.from ?? m.tx) - 8 - lw;
          // Past the left edge is allowed: the diagram then widens to the left (see the shift after drawing).
          for (const x0 of m.side === 'left' ? [left, right] : [right, left])
            if (!spot && clear(x0, lw, lane - lh / 2, lane + lh / 2)) spot = { x0, top: lane, lw, lh, lines };
        }
      }
      for (const lines of spot ? [] : wraps(m.text)) {
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
      if (!spot) spot = alongLine(m);
      if (!spot && !last) {
        later.push(m);
        return;
      }
      const over = !spot;
      if (!spot) {
        // No spot clear of every line: the gap grows while it can. Meanwhile, and once it cannot, the same search lets
        // the label cover a line (on its white ground), never a box or another label; as a last resort, as before
        // this rule: on its side, moved up off labels only.
        if (g >= 0) need.add(g);
        covered++;
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
      // 4 px above and below: a label placed later keeps a visible gap from this one (2 px read as touching).
      placed.push([spot.x0, spot.x0 + spot.lw, spot.top - spot.lh / 2 - 4, spot.top + spot.lh / 2 + 4, 6]);
      // 4 px for the label's own padding and the canvas measure's rounding.
      wide = Math.max(wide, spot.x0 + spot.lw + PAD / 2 + 4);
      least = Math.min(least, spot.x0 - PAD / 2 - 4);
      labels.push(labelEl(m, spot.x0, spot.top, spot.lines, over));
    };
    marks
      // Labels beside arrowheads first: their spot is fixed; the labels of lines up then look for room around them.
      .sort((m, n) => Number(!!m.up) - Number(!!n.up) || m.ty - n.ty || m.tx - n.tx)
      .forEach((m) => place(m, false));
    later.forEach((m) => place(m, true));
    return { paths, labels, hitPaths, need, crowd, wide, least, covered };
  };
  // Room for the lanes: LANE_H px per labelled line into one box, plus the arrow and a margin.
  for (const id in laneCount) {
    const g = layerIndex[id] - 1;
    if (g >= 0) gaps[g] = Math.max(gaps[g], laneCount[id] * LANE_H + 40);
  }
  // The least each gap gets: GAP, or the lanes' room.
  const floor = gaps.slice();
  placeRows();
  let drawn = draw();
  // At most GROW_MAX / GROW redraws: each one widens every gap that a label asked for.
  const grows = () => [...drawn.need].filter((g) => gaps[g] < floor[g] + GROW_MAX);
  for (let k = 0; k < GROW_MAX / GROW && grows().length; k++) {
    for (const g of grows()) gaps[g] = Math.min(floor[g] + GROW_MAX, gaps[g] + GROW);
    placeRows();
    drawn = draw();
  }
  // A gap that grew to the most and still did not help goes back to GAP: the room bought nothing.
  const stuck = [...drawn.need].filter((g) => gaps[g] >= floor[g] + GROW_MAX);
  if (stuck.length) {
    for (const g of stuck) gaps[g] = floor[g];
    placeRows();
    drawn = draw();
    // Then only as much room as the labels need to cover a line rather than a box or each other (several labelled
    // lines into one box, too close together for any label to miss the others' lines).
    const crowded = () => [...drawn.crowd].filter((g) => stuck.includes(g) && gaps[g] < floor[g] + GROW_MAX);
    for (let k = 0; k < GROW_MAX / GROW && crowded().length; k++) {
      for (const g of crowded()) gaps[g] = Math.min(floor[g] + GROW_MAX, gaps[g] + GROW);
      placeRows();
      drawn = draw();
    }
  }
  // A label written out past the left edge: everything moves right and the diagram widens by as much.
  // Moving the boxes also frees the channels beside them, which can move a label again: up to 3 times.
  for (let k = 0; k < 3 && drawn.least < 0; k++) {
    const shift = Math.ceil(-drawn.least);
    for (const id in pos) pos[id].x += shift;
    W += shift;
    drawn = draw();
  }
  // Past the right edge: the diagram widens to keep it whole.
  if (drawn.wide > W) {
    W = Math.ceil(drawn.wide);
    drawn = draw();
  }
  const { paths, labels, hitPaths } = drawn;
  const sizeText = (n: number) => withNum(p.sizeLabel, n, () => byCount(n, '1 個項目', '{n} 個項目'));
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
        style={{ left: boxOf(n.id).x, top: q.y, width: boxOf(n.id).w, height: NH }}
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
            <span className="ui-lg-count">{monoNums(sizeText(size), [format.number(size)])}</span>
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
    lab(e) ? (e.label ? tr('{label}（{inferred}）', { label: e.label, inferred: kindWord(e) }) : kindWord(e)) : countText(e);
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
                  {monoNums(sizeText(size), [format.number(size)])}
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
                // The whole line is the button, so its name says what the relation is, as on the diagram: three lines
                // between the same two boxes no longer share the name 「A → B」.
                <>
                  <span className="ui-lg-code">{nameOf(e.from)}</span> → <span className="ui-lg-code">{nameOf(e.to)}</span>
                  <span className="ui-lg-limeta">
                    {tr('：')}
                    {labelParts(edgeText(e))}
                  </span>
                </>,
                null,
              ),
            )}
        </ul>
      </section>
    </div>
  );
  const showList = p.listView !== false && view === 'list';
  // The tag button only where there are labels to hide (inferred lines), and only on the diagram.
  const toggleShown = p.labelToggle !== false && !showList && p.edges.some((e) => lab(e));
  // PM: measure the box; narrow the boxes when the diagram is wider, then scale what is still too wide.
  React.useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setAvail(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrollRef, showList]);
  React.useLayoutEffect(() => {
    if (!avail || showList) return;
    if (!fitted) {
      if (W <= avail + 0.5) return;
      const base = p.nodeWidth || 200;
      // The width to lose, over the columns; the space between columns goes from 40 to 24 px first.
      const lose = W - avail - (cols - 1) * (40 - 24);
      const nw = Math.max(Math.min(base, 120), Math.floor(base - Math.max(0, lose) / cols));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the width is known only after this layout is drawn
      setFit({ at: avail, nw, col: 24, scale: 1 });
      return;
    }
    // Scrolling anyway (WA): the boxes are back at their own width, names whole.
    if (fitted.full) return;
    // W changes after the fit: labels and the space for them widen it. The scale follows every change, so a diagram
    // that grew past its box shrinks again instead of scrolling (PM).
    const s = Math.floor((avail / W) * 1000) / 1000;
    // Smaller than 0.75: the text would be too small to read. It scrolls instead, and since it scrolls anyway the boxes
    // go back to their own width and spacing, so no name is cut (WA).
    if (W > avail + 0.5 && s < 0.75) {
      setFit({ ...fitted, nw: p.nodeWidth || 200, col: 40, scale: 1, full: true });
      return;
    }
    const want = W <= avail + 0.5 ? 1 : s;
    if (want !== fitted.scale) setFit({ ...fitted, scale: want });
  }, [avail, showList, fitted, W, p.nodeWidth, cols]);
  // A label still covering a line: more space between boxes, then drawn again (up to 120 px more).
  const coveredNow = drawn.covered;
  React.useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- known only after the labels are placed
    if (coveredNow && spread < 5) setSpread({ key: spreadKey, n: spread + 1 });
  }, [coveredNow, spread, spreadKey]);
  return (
    <div className={cx('ui-graph ui-lg', p.className)}>
      {p.listView === false && !toggleShown ? null : (
        <div className="ui-lg-bar">
          {toggleShown ? (
            // TC: a tag button beside 「圖／清單」; pressed (accent-soft, filled tag) while every label shows.
            <IconButton className="ui-lg-labels-btn" icon="tag" filled={labelsOn} label={tr('顯示線上文字')} aria-pressed={labelsOn} onClick={switchLabels} />
          ) : null}
          {p.listView === false ? null : (
            <Tabs
              label={tr('顯示方式')}
              value={view}
              onChange={setView}
              items={[
                { id: 'graph', label: tr('圖') },
                { id: 'list', label: tr('清單') },
              ]}
            />
          )}
        </div>
      )}
      {showList ? list : null}
      <div className={cx('ui-lg-scroller', scrollMore && 'has-more', showList && 'is-hidden')}>
        <div className="ui-lg-scroll" ref={scrollRef} onScroll={onScrollKeep}>
          <div
            className="ui-lg-canvas"
            style={
              scale === 1
                ? { width: W, height: H }
                : ({
                    width: W,
                    height: H,
                    transform: `scale(${scale})`,
                    transformOrigin: '0 0',
                    marginRight: W * (scale - 1),
                    marginBottom: H * (scale - 1),
                    // Touch areas grow back to 48 px on screen (styles.css).
                    '--lg-scale': scale,
                  } as React.CSSProperties)
            }
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
            {hitPaths.length && !pickEdge ? (
              // Hover-only paths (edgeLabels 'hover' without onSelectEdge): nothing to read or reach by keyboard.
              <svg className="ui-lg-hits" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
                {hitPaths}
              </svg>
            ) : hitPaths.length ? (
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
              ...(edges.some((e) => !lab(e) && pos[e.from] && pos[e.to]) ? [{ type: 'weight' as const, label: '次數越多線越粗' }] : []),
              ...(edges.some((e) => e.inferred && !e.declared && pos[e.from] && pos[e.to])
                ? [{ type: 'inferred' as const, label: p.inferredLabel || '推測的關係', text: p.inferredText }]
                : []),
              ...(edges.some((e) => e.declared && pos[e.from] && pos[e.to])
                ? [{ type: 'declared' as const, label: p.declaredLegend || '專案宣告的關係', text: p.declaredText }]
                : []),
            ]
          }
        />
      )}
    </div>
  );
}
