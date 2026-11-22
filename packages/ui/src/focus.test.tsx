import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { userEvent as keys } from 'vitest/browser';
import { render } from '@testing-library/react';
import * as UI from './index';
import { setAccent, setTheme, toHex } from './theme';
import { DEFAULT_ACCENT } from './theme';

// The focus indicator (WCAG 1.4.11 and 2.4.7): every Tab stop of a sample of controls shows a solid outline of 2 px
// or more whose color reaches 3:1 against the background it is drawn on, in light and dark. Read from computed
// styles after a real Tab key, so :focus-visible applies as it does for a keyboard user.

const lum = (hex: string) =>
  [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/** The first opaque background from el up: what the outline is drawn on. An outline drawn inside (negative offset)
 *  sits on the element's own background. */
function groundOf(el: Element, inside: boolean): string {
  for (let n: Element | null = inside ? el : el.parentElement; n; n = n.parentElement) {
    const bg = getComputedStyle(n).backgroundColor;
    const alpha = /rgba\([^)]*,\s*([\d.]+)\)/.exec(bg);
    if (bg !== 'transparent' && !(alpha && Number(alpha[1]) === 0)) return toHex(bg) ?? '#000000';
  }
  return toHex(getComputedStyle(document.body).backgroundColor) ?? '#ffffff';
}

function Sample() {
  const [on, setOn] = React.useState(false);
  const [seg, setSeg] = React.useState<'a' | 'b'>('a');
  const [tab, setTab] = React.useState('all');
  const [env, setEnv] = React.useState('prod');
  return (
    <div data-testid="sample" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, background: 'var(--surface)' }}>
      <UI.Button variant="primary">儲存</UI.Button>
      <UI.Button>取消</UI.Button>
      <UI.Button variant="quiet">匯出</UI.Button>
      <UI.IconButton icon="pencil-simple" label="編輯" />
      <UI.IconButton variant="quiet" icon="magnifying-glass" label="搜尋" />
      <UI.Switch checked={on} onChange={setOn} label="通知" />
      <UI.Checkbox checked={on} onChange={setOn} label="同意" />
      <UI.SegmentedControl
        label="顯示方式"
        iconOnly
        value={seg}
        onChange={setSeg}
        items={[
          { id: 'a', label: '預覽', icon: 'eye' },
          { id: 'b', label: '原始碼', icon: 'file-code' },
        ]}
      />
      <UI.Tabs
        label="紀錄"
        unit="筆"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'all', label: '全部', count: 26 },
          { id: 'failed', label: '失敗', count: 3 },
        ]}
      />
      <UI.Select
        label="環境"
        value={env}
        onChange={setEnv}
        options={[
          { value: 'prod', label: '正式環境' },
          { value: 'staging', label: '測試環境' },
        ]}
      />
      <UI.TextField label="名稱" defaultValue="api-gateway" />
    </div>
  );
}

afterEach(() => {
  setTheme('light');
  setAccent(DEFAULT_ACCENT, true);
});

test.each(['light', 'dark'] as const)('%s: every Tab stop shows a 2 px outline at 3:1 on its ground', async (theme) => {
  setTheme(theme);
  const { getByTestId } = render(<Sample />);
  const box = getByTestId('sample');
  const seen: string[] = [];
  const fails: string[] = [];
  (document.activeElement as HTMLElement | null)?.blur();
  for (let i = 0; i < 30; i++) {
    await keys.keyboard('{Tab}');
    const el = document.activeElement;
    if (!el || !box.contains(el)) {
      if (seen.length) break;
      continue;
    }
    const cs = getComputedStyle(el);
    const name = `${el.className || el.tagName} ${el.getAttribute('aria-label') ?? el.textContent ?? ''}`.trim();
    seen.push(name);
    const width = parseFloat(cs.outlineWidth);
    const color = toHex(cs.outlineColor);
    if (cs.outlineStyle !== 'solid' || width < 2 || !color) {
      fails.push(`${name}: outline ${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`);
      continue;
    }
    const ground = groundOf(el, parseFloat(cs.outlineOffset) < 0);
    const r = contrast(color, ground);
    if (r < 3) fails.push(`${name}: outline ${color} on ${ground}: ${r.toFixed(2)}:1`);
  }
  // Buttons 3, icon buttons 2, switch, checkbox, one segment, one tab, the select and the text field.
  expect(seen.length).toBeGreaterThanOrEqual(11);
  expect(fails).toEqual([]);
});
