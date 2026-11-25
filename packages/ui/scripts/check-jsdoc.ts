// Every prop of every exported *Props type has a one-line JSDoc: it becomes the props table of the docs site, and it is
// what an editor shows while an agent writes a page. Run by `pnpm test`; prints each prop without one and exits 1.
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const entry = new URL('src/index.ts', root).pathname;
const program = ts.createProgram([entry], {
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  allowImportingTsExtensions: true,
});
const checker = program.getTypeChecker();
const source = program.getSourceFile(entry);
if (!source) throw new Error(`check-jsdoc: cannot read ${entry}`);
const own = (d: ts.Declaration) => !d.getSourceFile().fileName.includes('/node_modules/');
const missing: string[] = [];
const moduleSymbol = checker.getSymbolAtLocation(source);
for (const exported of moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : []) {
  if (!/Props$/.test(exported.name)) continue;
  const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
  if (!(symbol.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias))) continue;
  const type = checker.getDeclaredTypeOfSymbol(symbol);
  // A union of prop sets (Dialog: confirm or actions) checks the props of each member.
  const members = type.isUnion() ? type.types : [type];
  const seen = new Set<string>();
  for (const member of members)
    for (const prop of checker.getPropertiesOfType(member)) {
      const decls = (prop.declarations ?? []).filter(own);
      if (!decls.length || seen.has(prop.name)) continue;
      seen.add(prop.name);
      if (!decls.some((d) => ts.getJSDocCommentsAndTags(d).length > 0)) {
        const d = decls[0];
        const at = d.getSourceFile();
        const { line } = at.getLineAndCharacterOfPosition(d.getStart());
        missing.push(`${exported.name}.${prop.name}  (${at.fileName.replace(new URL('src/', root).pathname, 'src/')}:${line + 1})`);
      }
    }
}
if (missing.length) {
  console.error(`check-jsdoc: ${missing.length} props without a JSDoc line (/** … */ above the prop):\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
console.log('check-jsdoc: every exported prop has a JSDoc line');
