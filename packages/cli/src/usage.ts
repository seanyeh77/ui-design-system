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
