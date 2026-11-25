/* The 用法 block of a component README: the part an agent reads by default (`ui docs <Name>`).
   A README starts with `# Name`, then `## 用法` (one sentence, a minimal example, the rules most often gotten wrong),
   then the detailed sections. */

const USAGE = /^## 用法[ \t]*$/m;

/** The title and the 用法 section, up to the next level-2 heading; null when the file has no 用法 section. */
export function usageBlock(md: string): string | null {
  const start = USAGE.exec(md);
  if (!start) return null;
  const after = start.index + start[0].length;
  // Skip fenced code: a line starting with ## inside an example is not a heading.
  let fenced = false;
  let end = md.length;
  let pos = after;
  for (const line of md.slice(after).split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    else if (!fenced && /^## /.test(line)) {
      end = pos;
      break;
    }
    pos += line.length + 1;
  }
  return md.slice(0, Math.min(end, md.length)).trimEnd() + '\n';
}

/** One sentence about the file: the first sentence of the 用法 section, or of the first text line after the title. */
export function summary(md: string): string {
  const start = USAGE.exec(md);
  const from = start ? md.slice(start.index + start[0].length) : md;
  const line =
    from
      .split('\n')
      .find((l) => l.trim() && !l.startsWith('#') && !l.startsWith('|'))
      ?.trim() ?? '';
  // Up to the first 。 outside backticks; a line without one is returned whole.
  let code = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '`') code = !code;
    else if (!code && line[i] === '。') return line.slice(0, i + 1);
  }
  return line;
}

/** The groups of the component list, in order, with their Chinese names (llms.txt and ui list use the same). */
export const GROUPS: Record<string, string> = {
  Foundations: '基礎',
  Layout: '版面',
  Actions: '按鈕',
  Forms: '表單',
  Data: '數據呈現',
  Status: '狀態',
  Feedback: '回饋',
  Overlays: '浮層',
  Navigation: '導覽',
  Appearance: '外觀',
  Pages: '頁面範本',
};

/** The reading order for an agent: the core rules every page needs, then a topic file only when the page has that topic. */
export const GUIDES: [string, string][] = [
  ['guidelines', 'Core rules every page needs (read first): look, type, controls, layout, formats, copy, status, accessibility, checks'],
  ['layout', 'Page frames, navigation, search and first-use tours: when you lay out a frame yourself'],
  ['forms', 'Which input component to use and how to arrange a form'],
  ['data', 'Tables, result lists, file trees, KPIs and charts'],
  ['monitoring', 'Full-screen always-on monitoring screens (ConsoleLayout and its parts)'],
  ['code', 'Code-reading tools: code views, architecture graphs, project docs'],
  ['theme', 'Every token, theme and accent settings, the accent derivation, the Slidev teaching preset'],
  ['motion', 'Animation durations and effects, when you animate something yourself'],
];

/** A component's group, from the first line of its preview.html: <!-- @dsCard group="Data" height=400 -->. */
export const groupOf = (previewHtml: string) => /group="([^"]+)"/.exec(previewHtml)?.[1] ?? 'Other';
