import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { AiMark } from '../../index';

test('AiMark: shows 「AI 撰寫」 but is read 「（AI 撰寫）」, once; not a Tab stop', () => {
  const { container } = render(
    <p>
      這段摘要由模型產生。
      <AiMark />
    </p>,
  );
  const shown = container.querySelector('.ui-aimark') as HTMLElement;
  expect(shown.textContent).toBe('AI 撰寫');
  expect(shown.getAttribute('aria-hidden')).toBe('true');
  expect(container.querySelector('.ui-visually-hidden')?.textContent).toBe('（AI 撰寫）');
  expect(container.querySelector('a, button, [tabindex]')).toBeNull();
});

test('AiMark: another source mark, and a label that differs from it', () => {
  const { container } = render(
    <>
      <AiMark text="推測" />
      <AiMark text="AI" label="（由 AI 撰寫）" />
    </>,
  );
  const hidden = Array.from(container.querySelectorAll('.ui-visually-hidden')).map((e) => e.textContent);
  expect(hidden).toEqual(['（推測）', '（由 AI 撰寫）']);
});
