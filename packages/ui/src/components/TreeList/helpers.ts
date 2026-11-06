import { I18N } from '../../i18n';
import type { TreeNode } from './TreeList';

/** File kind from the extension: picks the color of the document icon. */
export const FILE_KIND: Record<string, string> = {
  pdf: 'pdf',
  mp4: 'video',
  mov: 'video',
  mkv: 'video',
  webm: 'video',
  avi: 'video',
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  ppt: 'slides',
  pptx: 'slides',
  key: 'slides',
  odp: 'slides',
  doc: 'doc',
  docx: 'doc',
  txt: 'doc',
  md: 'doc',
  odt: 'doc',
  xls: 'sheet',
  xlsx: 'sheet',
  csv: 'sheet',
  ods: 'sheet',
  zip: 'archive',
  rar: 'archive',
  tar: 'archive',
  gz: 'archive',
  '7z': 'archive',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  svg: 'image',
  webp: 'image',
  py: 'code',
  js: 'code',
  ts: 'code',
  c: 'code',
  cpp: 'code',
  java: 'code',
  ipynb: 'code',
  sh: 'code',
};

/** The document outline of the file icon (30 x 36). */
export const DOC_SHAPE = 'M5 1.5h15l7.5 7.5v25.5H5z';

export function fileExt(n: TreeNode): string {
  const m = /\.([a-z0-9]+)$/i.exec(n.name || '');
  return String(n.ext || (m ? m[1] : '')).toLowerCase();
}

/** Every folder in a list, depth first. */
export const foldersOf = (list: TreeNode[], kids: (n: TreeNode) => TreeNode[] | null): TreeNode[] =>
  list.flatMap((n) => {
    const c = kids(n);
    return c ? [n, ...foldersOf(c, kids)] : n.hasChildren ? [n] : [];
  });

export const toDate = (d: TreeNode['date']): Date | null => (d == null ? null : d instanceof Date ? d : new Date(d));

/** The newest date in a node and everything under it. */
export function latest(n: TreeNode): Date | null {
  let best = toDate(n.date);
  for (const c of n.children ?? []) {
    const d = latest(c);
    if (d && (!best || d > best)) best = d;
  }
  return best;
}

export type TreeSort = 'newest' | 'oldest' | 'name' | false;

/** Folders first, then by the sort; ties keep their original order. keepOrder (plain trees without a sort) keeps the list as given. */
export function sortNodes(list: TreeNode[], sort: TreeSort, keepOrder = false): TreeNode[] {
  if (keepOrder) return [...list];
  return list
    .map((n, i) => [n, i] as const)
    .sort(([a, ia], [b, ib]) => {
      const fa = !!a.children;
      const fb = !!b.children;
      if (fa !== fb) return fa ? -1 : 1;
      if (!sort) return ia - ib;
      if (sort === 'name') return String(a.name).localeCompare(String(b.name), I18N.locale, { numeric: true }) || ia - ib;
      const da = +(latest(a) || 0);
      const db = +(latest(b) || 0);
      return (sort === 'oldest' ? da - db : db - da) || ia - ib;
    })
    .map(([n]) => n);
}

export function findNode(id: string, list: TreeNode[], kids: (n: TreeNode) => TreeNode[] | null): TreeNode | null {
  for (const n of list) {
    if (n.id === id) return n;
    const c = kids(n);
    const r = c && findNode(id, c, kids);
    if (r) return r;
  }
  return null;
}

/** The nodes from the top down to id, or null. */
export function pathTo(id: string, list: TreeNode[], kids: (n: TreeNode) => TreeNode[] | null, path: TreeNode[] = []): TreeNode[] | null {
  for (const n of list) {
    const p2 = [...path, n];
    if (n.id === id) return p2;
    const c = kids(n);
    const r = c && pathTo(id, c, kids, p2);
    if (r) return r;
  }
  return null;
}
