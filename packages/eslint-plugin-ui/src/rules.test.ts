import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import { rules } from './index';

RuleTester.describe = describe;
RuleTester.it = it;
const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } });

tester.run('no-raw-color', rules['no-raw-color'], {
  valid: ['<div style={{ color: "var(--ink)" }} />', '<path fill="currentColor" />'],
  invalid: [{ code: '<div style={{ color: "#fff" }} />', errors: 1 }, { code: '<rect fill="#2457d6" />', errors: 1 }, { code: '<div style={{ background: `rgba(0,0,0,.2)` }} />', errors: 1 }],
});
tester.run('no-native-controls', rules['no-native-controls'], {
  valid: ['<Select options={[]} />', '<input type="text" />'],
  invalid: [{ code: '<select />', errors: 1 }, { code: '<input type="checkbox" />', errors: 1 }, { code: '<table />', errors: 1 }],
});
tester.run('no-nested-card', rules['no-nested-card'], {
  valid: ['<><Card /><Card /></>', '<Card><TreeList items={[]} /></Card>'],
  invalid: [{ code: '<Card><div><Card /></div></Card>', errors: 1 }],
});
tester.run('one-primary-button', rules['one-primary-button'], {
  valid: ['<Card><Button variant="primary">儲存</Button><Button>取消</Button></Card>'],
  invalid: [{ code: '<Card><Button variant="primary">儲存</Button><Button variant="primary">發布</Button></Card>', errors: 1 }],
});
tester.run('verb-labels', rules['verb-labels'], {
  valid: ['<Button>儲存</Button>'],
  invalid: [{ code: '<Button>確定</Button>', errors: 1 }],
});
tester.run('danger-confirm', rules['danger-confirm'], {
  valid: ['<Button variant="danger" confirm={{ title: "刪除？" }}>刪除</Button>', '<Button variant="danger" confirmed>刪除</Button>'],
  invalid: [{ code: '<Button variant="danger">刪除</Button>', errors: 1 }],
});
