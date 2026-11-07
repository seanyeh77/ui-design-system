import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import { rules } from './index';

RuleTester.describe = describe;
RuleTester.it = it;
const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } });

tester.run('no-raw-color', rules['no-raw-color'], {
  valid: [
    '<div style={{ color: "var(--ink)" }} />',
    '<path fill="currentColor" />',
    '<rect fill="url(#fade)" />',
    '<div style={{ color: map["red"] }} />',
    '<div style={{ color: tone[ok ? "green" : "red"] }} />',
    '<div style={{ background: tone[s ?? "red"] }} />',
    '<div style={{ color: s === "red" ? cssVar("danger") : cssVar("ink") }} />',
    '<div style={{ background: ["red", "green"].includes(s) ? cssVar("danger") : undefined }} />',
    '<div className="bg-surface text-ink" />',
  ],
  invalid: [
    { code: '<div style={{ color: "#fff" }} />', errors: 1 },
    { code: '<rect fill="#2457d6" />', errors: 1 },
    { code: '<div style={{ background: `rgba(0,0,0,.2)` }} />', errors: 1 },
    { code: '<div style={{ color: "red" }} />', errors: 1 },
    { code: '<div className="bg-[#fff] p-4" />', errors: 1 },
    { code: '<div style={{ color: ok ? "#16a34a" : "#dc2626" }} />', errors: 2 },
    { code: '<path fill={on ? "#2457d6" : "none"} />', errors: 1 },
    { code: '<div style={{ color: "#fff".toString() }} />', errors: 1 },
  ],
});
tester.run('no-native-controls', rules['no-native-controls'], {
  valid: ['<Select options={[]} />', '<input type="text" />'],
  invalid: [
    { code: '<select />', errors: 1 },
    { code: '<input type="checkbox" />', errors: 1 },
    { code: '<table />', errors: 1 },
  ],
});
tester.run('no-nested-card', rules['no-nested-card'], {
  valid: ['<><Card /><Card /></>', '<Card><TreeList items={[]} /></Card>'],
  invalid: [{ code: '<Card><div><Card /></div></Card>', errors: 1 }],
});
tester.run('one-primary-button', rules['one-primary-button'], {
  valid: [
    '<Card><Button variant="primary">儲存</Button><Button>取消</Button></Card>',
    '<Card>{editing ? <Button variant="primary">儲存</Button> : <Button variant="primary">編輯</Button>}</Card>',
  ],
  invalid: [
    { code: '<Card><Button variant="primary">儲存</Button><Button variant="primary">發布</Button></Card>', errors: 1 },
    { code: '<Card><Button variant="primary">儲存</Button>{open && <Button variant="primary">發布</Button>}</Card>', errors: 1 },
    { code: '<Card footer={<Button variant="primary">發布</Button>}><Button variant="primary">儲存</Button></Card>', errors: 1 },
  ],
});
tester.run('verb-labels', rules['verb-labels'], {
  valid: ['<Button>儲存</Button>'],
  invalid: [{ code: '<Button>確定</Button>', errors: 1 }],
});
tester.run('danger-confirm', rules['danger-confirm'], {
  valid: ['<Button variant="danger" confirm={{ title: "刪除？" }}>刪除</Button>', '<Button variant="danger" confirmed>刪除</Button>'],
  invalid: [{ code: '<Button variant="danger">刪除</Button>', errors: 1 }],
});

describe('configs.recommended', () => {
  it('parses TypeScript in .tsx files', async () => {
    const { Linter } = await import('eslint');
    const plugin = (await import('./index')).default;
    const out = new Linter().verify('interface P { a: string }\nexport const X = (p: P) => <select />;', [plugin.configs.recommended], 'x.tsx');
    if (out.length !== 1 || out[0].ruleId !== 'ui/no-native-controls') throw new Error(JSON.stringify(out));
  });
});

tester.run('no-tailwind-defaults', rules['no-tailwind-defaults'], {
  valid: [
    '<div className="bg-surface text-ink-muted rounded-md shadow-card border-line" />',
    '<div className="text-neutral-500 rounded-full shadow-overlay hover:bg-accent-soft" />',
    '<div className={`p-4 ${a ? "bg-surface" : "bg-surface-sub"}`} />',
    'const c = cn("bg-surface", tone["red"]);',
    "const c = cn(p.elevation === 'shadow' && 'shadow-card');",
    "<div className={cn(variant === 'rounded' && 'rounded-md', fmt(x, 'rounded'))} />",
    'const b = cva("p-2", { variants: { shadow: { none: "shadow-none" } } });',
  ],
  invalid: [
    { code: '<div className="bg-white rounded-xl shadow-lg p-4" />', errors: 3 },
    { code: '<p className="text-gray-500 hover:text-blue-600/80" />', errors: 2 },
    { code: '<div className={`border-t-slate-200 ${x}`} />', errors: 1 },
    { code: '<div className="hover:bg-gray-100! bg-gray-100/12.5 rounded shadow" />', errors: 4 },
    { code: 'const b = cva("rounded-md", { variants: { tone: { info: "bg-blue-50 text-blue-700" } } });', errors: 2 },
    { code: '<div className={cn("p-4", "text-zinc-500")} />', errors: 1 },
    { code: '<div className={clsx({ "bg-gray-100": on })} />', errors: 1 },
  ],
});
