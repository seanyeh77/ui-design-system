/* Light syntax colors for CodeView. A token is [class, text]; the classes are is-keyword, is-constant, is-comment,
   is-string and '' for plain text. Any highlighter that returns these classes can replace the built-in one (see shiki.ts). */

export type TokenClass = '' | 'is-keyword' | 'is-constant' | 'is-comment' | 'is-string';
export type Token = [TokenClass, string];
/** Splits each line into tokens. Block comments and strings may span lines. */
export type Tokenizer = (lines: string[], lang: string) => Token[][];

export type CodeLanguage = 'c' | 'js' | 'py' | 'sh' | 'plain';

const KEYWORDS: Record<Exclude<CodeLanguage, 'plain'>, Set<string>> = {
  c: new Set(
    'auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false NULL nullptr class namespace template typename public private protected virtual new delete'.split(
      ' ',
    ),
  ),
  js: new Set(
    'async await break case catch class const continue default delete do else export extends false finally for from function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while yield interface type enum implements'.split(
      ' ',
    ),
  ),
  py: new Set(
    'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield'.split(
      ' ',
    ),
  ),
  sh: new Set('if then else elif fi for while do done case esac in function return export local set unset echo exit'.split(' ')),
};

const EXT: Record<string, CodeLanguage> = {
  c: 'c',
  h: 'c',
  cc: 'c',
  cpp: 'c',
  hpp: 'c',
  cu: 'c',
  js: 'js',
  jsx: 'js',
  ts: 'js',
  tsx: 'js',
  mjs: 'js',
  py: 'py',
  sh: 'sh',
  bash: 'sh',
};

/** The language from a file's extension; 'plain' when unknown. */
export function languageOf(file: string | undefined): CodeLanguage {
  const m = /\.([A-Za-z0-9]+)$/.exec(file || '');
  return (m && EXT[m[1].toLowerCase()]) || 'plain';
}

export const LANGUAGE_NAMES: Record<string, string> = { c: 'C', js: 'JavaScript', py: 'Python', sh: 'Shell' };

/** The built-in tokenizer: keywords, CONSTANTS and numbers, comments, strings for C-like, JS, Python and shell. */
export const tokenize: Tokenizer = (lines, lang) => {
  const kw = KEYWORDS[lang as Exclude<CodeLanguage, 'plain'>];
  if (!kw) return lines.map((l) => [['', l]]);
  const hash = lang === 'py' || lang === 'sh';
  const re = hash
    ? /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|([A-Za-z_]\w*)|(\b\d[\w.]*)/g
    : /(\/\/.*$|\/\*.*?(?:\*\/|$))|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|([A-Za-z_]\w*)|(\b\d[\w.]*)/g;
  let inBlock = false;
  return lines.map((line) => {
    const out: Token[] = [];
    let i = 0;
    if (inBlock) {
      const e = line.indexOf('*/');
      if (e < 0) return [['is-comment', line]];
      out.push(['is-comment', line.slice(0, e + 2)]);
      i = e + 2;
      inBlock = false;
    }
    re.lastIndex = i;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      if (m.index > i) out.push(['', line.slice(i, m.index)]);
      const cls: TokenClass = m[1]
        ? 'is-comment'
        : m[2]
          ? 'is-string'
          : m[3]
            ? kw.has(m[3])
              ? 'is-keyword'
              : /^[A-Z][A-Z0-9_]+$/.test(m[3])
                ? 'is-constant'
                : ''
            : 'is-constant';
      if (m[1] && !hash && m[1].startsWith('/*') && !m[1].endsWith('*/')) inBlock = true;
      out.push([cls, m[0]]);
      i = m.index + m[0].length;
      if (!m[0].length) re.lastIndex++;
    }
    if (i < line.length) out.push(['', line.slice(i)]);
    return out.length ? out : [['', '']];
  });
};
