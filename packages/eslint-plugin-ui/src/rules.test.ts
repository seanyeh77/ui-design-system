import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import tsParser from '@typescript-eslint/parser';
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
  valid: [
    '<Select options={[]} />',
    '<TextField label="名稱" />',
    '<Link href="/docs">文件</Link>',
    '<ui.Button>儲存</ui.Button>',
    '<input type="hidden" name="id" value="1" />',
    '<input type={kind} />',
    '<input type="file" hidden accept=".json" onChange={read} />',
    '<input type="file" hidden={true} />',
    '<button type="button" className="ui-link-btn" onClick={go}>重看導覽</button>',
    { code: '<a href="/docs">文件</a>', options: [{ allow: ['a'] }] },
    { code: '<input type="range" />', options: [{ allow: ['input[type=range]'] }] },
  ],
  invalid: [
    { code: '<select />', errors: 1 },
    { code: '<input type="checkbox" />', errors: 1 },
    { code: '<table />', errors: 1 },
    { code: '<textarea />', errors: 1 },
    { code: '<input />', errors: 1 },
    { code: '<input type="text" />', errors: 1 },
    { code: '<input type="search" />', errors: 1 },
    { code: '<input type="email" />', errors: 1 },
    { code: '<input type="password" />', errors: 1 },
    { code: '<input type="number" />', errors: 1 },
    { code: '<input type="range" />', errors: 1 },
    {
      code: '<input type="file" />',
      errors: [
        { message: '<input type="file">: use FileUpload for a drop area, or useFilePicker to open the picker from a button or menu item from @seanyeh77/ui.' },
      ],
    },
    { code: '<input type="file" hidden={!show} />', errors: 1 },
    { code: '<input type={secret ? "password" : "text"} />', errors: 2 },
    { code: '<a href="/docs">文件</a>', errors: [{ message: 'Native <a>: use Link from @seanyeh77/ui.' }] },
    { code: '<button onClick={go}>儲存</button>', errors: 1 },
    { code: '<button />', options: [{ allow: ['a'] }], errors: 1 },
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
    { code: '<Card><Button variant="primary">儲存</Button><Button variant={main ? "primary" : "secondary"}>發布</Button></Card>', errors: 1 },
    { code: '<Card><Button variant={a && "primary"}>儲存</Button><Button variant="primary">發布</Button></Card>', errors: 1 },
  ],
});
tester.run('verb-labels', rules['verb-labels'], {
  valid: [
    '<Button>儲存</Button>',
    ...[
      '送出',
      '新增',
      '建立',
      '刪除',
      '移除',
      '編輯',
      '更新',
      '匯出',
      '匯入',
      '下載',
      '上傳',
      '複製',
      '重試',
      '還原',
      '套用',
      '清除',
      '登入',
      '登出',
      '搜尋',
      '篩選',
      '排序',
      '前往',
      '開啟',
      '關閉',
      '取消',
      '確認刪除',
      'Submit',
    ].map((v) => `<Button>${v}</Button>`),
  ],
  invalid: ['確定', '確認', '好', 'OK', '是', '否', 'Yes', 'No'].map((v) => ({ code: `<Button>${v}</Button>`, errors: 1 })),
});
tester.run('danger-confirm', rules['danger-confirm'], {
  valid: [
    '<Button variant="danger" confirm={{ title: "刪除？" }}>刪除</Button>',
    '<Button variant="danger" confirmed>刪除</Button>',
    '<Button variant={busy ? "secondary" : "quiet"}>取消</Button>',
    '<Button variant={x ? "danger" : "quiet"} confirm={{ title: "刪除？" }}>刪除</Button>',
  ],
  invalid: [
    { code: '<Button variant="danger">刪除</Button>', errors: 1 },
    { code: '<Button variant={x ? "danger" : "quiet"}>刪除</Button>', errors: 1 },
    { code: '<Button variant={x ? "quiet" : "danger"}>刪除</Button>', errors: 1 },
    { code: '<Button variant={(x && "danger") as Variant}>刪除</Button>', errors: 1, languageOptions: { parser: tsParser } },
  ],
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
    'const b = cva("p-2", { defaultVariants: { shape: "rounded" }, compoundVariants: [{ shape: "rounded", class: "rounded-md" }] });',
  ],
  invalid: [
    { code: '<div className="bg-white rounded-xl shadow-lg p-4" />', errors: 3 },
    { code: '<p className="text-gray-500 hover:text-blue-600/80" />', errors: 2 },
    { code: '<div className={`border-t-slate-200 ${x}`} />', errors: 1 },
    { code: '<div className="hover:bg-gray-100! bg-gray-100/12.5 rounded shadow" />', errors: 4 },
    { code: 'const b = cva("rounded-md", { variants: { tone: { info: "bg-blue-50 text-blue-700" } } });', errors: 2 },
    { code: '<div className={cn("p-4", "text-zinc-500")} />', errors: 1 },
    { code: '<div className={clsx({ "bg-gray-100": on })} />', errors: 1 },
    { code: 'const c = clsx(["p-2", { "rounded-2xl": on }]);', errors: 1 },
    { code: 'const c = cn(`p-2 rounded-xl ${x}`);', errors: 1 },
    { code: 'const b = cva("p-2", { compoundVariants: [{ shape: "rounded", class: "shadow-lg" }] });', errors: 1 },
  ],
});

tester.run('no-raw-size', rules['no-raw-size'], {
  valid: [
    '<div style={{ padding: "var(--space-4)", gap: cssVar("space-2") }} />',
    '<div style={{ margin: 0, padding: "0", borderRadius: "var(--radius-md)" }} />',
    '<div style={{ width: 320, height: "12px", top: 4 }} />',
    '<div style={{ padding: "var(--space-4, 16px)" }} />',
    '<div style={{ marginLeft: "auto", boxShadow: "none", fontFamily: "var(--font-mono)" }} />',
    '<div style={{ padding: `calc(var(--space-4) * 2)` }} />',
    '<div style={{ gap: wide ? "var(--space-4)" : "var(--space-2)" }} />',
    '<div className="p-4 gap-2 text-small rounded-md shadow-card font-mono w-[320px]" />',
    '<div className="p-[var(--space-3)] text-[#fff] text-[length:var(--text-small)]" />',
  ],
  invalid: [
    { code: '<div style={{ padding: 12 }} />', errors: 1 },
    { code: '<div style={{ padding: "12px 16px" }} />', errors: 1 },
    { code: '<div style={{ marginTop: "0.75rem" }} />', errors: 1 },
    { code: '<div style={{ gap: wide ? 16 : 8 }} />', errors: 2 },
    { code: '<div style={{ fontSize: 13 }} />', errors: [{ message: /text-small/ }] },
    { code: '<div style={{ borderRadius: "10px" }} />', errors: [{ message: /radius-md/ }] },
    { code: '<div style={{ boxShadow: "0 1px 2px rgba(0,0,0,.1)" }} />', errors: 1 },
    { code: '<div style={{ fontFamily: "Inter, sans-serif" }} />', errors: [{ message: /font-sans/ }] },
    { code: '<div style={{ padding: `${x}px 8px` }} />', errors: 1 },
    { code: '<div className="text-[13px] p-[7px]" />', errors: 2 },
    { code: '<div className="hover:rounded-[10px] shadow-[0_1px_2px_black] font-[Inter]" />', errors: 3 },
    { code: 'const c = cn("gap-[6px]", on && "-mt-[2px]");', errors: 2 },
  ],
});

describe('configs.recommended includes no-raw-size', () => {
  it('warns on a raw padding', async () => {
    const { Linter } = await import('eslint');
    const plugin = (await import('./index')).default;
    const out = new Linter().verify('export const X = () => <div style={{ padding: 12 }} />;', [plugin.configs.recommended], 'x.tsx');
    if (out.length !== 1 || out[0].ruleId !== 'ui/no-raw-size' || out[0].severity !== 1) throw new Error(JSON.stringify(out));
  });
});
