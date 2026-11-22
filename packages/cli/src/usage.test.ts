import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summary, usageBlock } from './usage.ts';

const md = `# Button

## 用法

按鈕觸發一個動作。

\`\`\`md
## not a heading
\`\`\`

- 規則

## 細節

- 細節
`;

test('usageBlock stops at the next level-2 heading, not at one inside a code block', () => {
  const u = usageBlock(md);
  assert.ok(u);
  assert.ok(u.startsWith('# Button\n'));
  assert.ok(u.includes('## not a heading'));
  assert.ok(u.includes('- 規則'));
  assert.ok(!u.includes('細節'));
});

test('usageBlock is null without a 用法 section', () => {
  assert.equal(usageBlock('# 版面\n\n## 斷點\n'), null);
});

test('summary is the first sentence of 用法, or the first text line', () => {
  assert.equal(summary(md), '按鈕觸發一個動作。');
  assert.equal(summary('# 版面與導覽\n\n依使用情境選擇。其他的另外說明。\n'), '依使用情境選擇。');
  assert.equal(summary('# X\n\n## 用法\n\n顯示 `a。b` 的值。改用 Y。\n'), '顯示 `a。b` 的值。');
});
