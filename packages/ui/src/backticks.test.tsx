import * as React from 'react';
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as UI from './index';
import { codeSpans } from './internal/codeSpans';

// Sentence props that take a string read `backticks` as code, the same way CodeText and LayerGraph labels do.
const CODE = '執行 `make deps` 安裝相依套件。';
const PLAIN = '先建立第一個專案。';
const LONE = '用 ` 分隔欄位。';

const must = <T,>(x: T | null | undefined): T => {
  if (x == null) throw new Error('not rendered');
  return x;
};
const codes = (el: Element) => Array.from(el.querySelectorAll('.ui-code')).map((c) => c.textContent);

test('codeSpans: pairs are code, a lone backtick stays text', () => {
  expect(codeSpans(CODE)).toEqual([
    { code: false, text: '執行 ' },
    { code: true, text: 'make deps' },
    { code: false, text: ' 安裝相依套件。' },
  ]);
  expect(codeSpans(PLAIN)).toEqual([{ code: false, text: PLAIN }]);
  expect(codeSpans(LONE)).toEqual([{ code: false, text: LONE }]);
  // A backtick at the start without its pair is text, not a code span that loses its last character.
  expect(codeSpans('`foo bar')).toEqual([{ code: false, text: '`foo bar' }]);
  expect(codeSpans('``')).toEqual([{ code: false, text: '``' }]);
  expect(codeSpans(undefined)).toEqual([]);
});

test('CodeText: a lone backtick at the start stays text', () => {
  const { container } = render(<UI.CodeText text="`foo bar" />);
  expect(container.textContent).toBe('`foo bar');
  expect(container.querySelector('.ui-code')).toBeNull();
});

// Each case renders the component with one sentence and returns the element that shows it.
const cases: [string, (t: string) => React.ReactElement, string][] = [
  ['EmptyState description', (t) => <UI.EmptyState title="還沒有專案" description={t} />, '.ui-empty-desc'],
  ['EmptyState steps', (t) => <UI.EmptyState title="還沒有專案" steps={[t, '第二步']} />, '.ui-steps li > span:last-child'],
  ['SettingsSection description', (t) => <UI.SettingsSection title="帳號" description={t} />, '.ui-settings-desc'],
  ['TextField hint', (t) => <UI.TextField label="指令" hint={t} />, '.ui-field-hint'],
  ['TextField error', (t) => <UI.TextField label="指令" error={t} />, '.ui-field-error'],
  ['TextArea hint', (t) => <UI.TextArea label="說明" value="" onChange={() => {}} hint={t} />, '.ui-field-hint'],
  ['TextArea error', (t) => <UI.TextArea label="說明" value="" onChange={() => {}} error={t} />, '.ui-field-error'],
  ['Select error', (t) => <UI.Select label="部門" value="" onChange={() => {}} options={[{ value: 'a', label: 'A' }]} error={t} />, '.ui-field-error'],
  [
    'FileUpload error',
    (t) => <UI.FileUpload label="附件" files={[{ id: 1, name: 'a.csv', status: 'error', error: t }]} onAdd={() => {}} />,
    '.ui-upload-error',
  ],
  ['Alert children', (t) => <UI.Alert tone="warning">{t}</UI.Alert>, '.ui-alert-body'],
  ['Toast children', (t) => <UI.Toast>{t}</UI.Toast>, '.ui-toast > span'],
  [
    'Dialog children',
    (t) => (
      <UI.Dialog open title="刪除專案？" onClose={() => {}}>
        {t}
      </UI.Dialog>
    ),
    '.ui-dialog-body',
  ],
  ['DangerZone description', (t) => <UI.DangerZone description={t} onAction={() => {}} confirm={{ title: '刪除？' }} />, '.ui-danger-row p'],
  ['ErrorPage description', (t) => <UI.ErrorPage code={404} description={t} />, '.ui-errorpage-desc'],
  ['EventTimeline text', (t) => <UI.EventTimeline label="事件" events={[{ id: 'a', time: new Date(), kind: 'manual', text: t }]} />, '.ui-events-text'],
  ['KpiCard target', (t) => <UI.KpiCard label="延遲" value={12} unit="ms" target={t} />, '.ui-kpi-target'],
  ['KpiCard verdict', (t) => <UI.KpiCard label="延遲" value={12} unit="ms" verdict={{ tone: 'warning', text: t }} />, '.ui-kpi-verdict'],
];

test.each(cases)('%s: `code` shows as InlineCode, without backticks', (_, el, sel) => {
  const { unmount } = render(el(CODE));
  const node = must(document.querySelector(sel));
  expect(codes(node)).toEqual(['make deps']);
  expect(node.textContent).toBe('執行 make deps 安裝相依套件。');
  expect(node.textContent).not.toContain('`');
  unmount();
});

test.each(cases)('%s: plain text and a lone backtick stay as they are', (_, el, sel) => {
  for (const t of [PLAIN, LONE]) {
    const { unmount } = render(el(t));
    const node = must(document.querySelector(sel));
    expect(node.textContent).toBe(t);
    expect(node.querySelector('.ui-code')).toBeNull();
    unmount();
  }
});

test('Term text: `code` shows as InlineCode in the card', async () => {
  render(
    <p>
      見{' '}
      <UI.Term title="daemon" text={CODE}>
        daemon
      </UI.Term>
    </p>,
  );
  await userEvent.setup().click(screen.getByRole('button', { name: /daemon/ }));
  const body = await screen.findByText((_, n) => !!n?.classList.contains('ui-term-body'));
  expect(codes(body)).toEqual(['make deps']);
  expect(body.textContent).not.toContain('`');
});

test('NotificationBell body: `code` shows as InlineCode', async () => {
  render(<UI.NotificationBell items={[{ id: 1, title: '部署完成', body: CODE }]} />);
  await userEvent.setup().click(screen.getByRole('button', { name: /通知/ }));
  const b = await screen.findByText((_, n) => !!n?.classList.contains('ui-noti-b'));
  expect(codes(b)).toEqual(['make deps']);
  expect(b.textContent).not.toContain('`');
});

test('Drawer confirmText: `code` shows as InlineCode in the close confirmation', async () => {
  render(
    <UI.Drawer open dirty title="編輯" onClose={() => {}} confirmText={CODE}>
      <p>內容</p>
    </UI.Drawer>,
  );
  await userEvent.setup().click(screen.getByRole('button', { name: '關閉' }));
  const body = await screen.findByText((_, n) => !!n?.classList.contains('ui-dialog-body'));
  expect(codes(body)).toEqual(['make deps']);
  expect(body.textContent).toBe('執行 make deps 安裝相依套件。');
});
