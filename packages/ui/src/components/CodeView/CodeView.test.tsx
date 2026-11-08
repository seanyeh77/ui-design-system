import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { CodeView } from '../../index';

test('the language reads as a language, not a button', () => {
  const { container } = render(<CodeView file="src/ibmon/child.c" code={'int main(void) {}\n'} />);
  const lang = container.querySelector('.ui-cv-lang');
  expect(lang?.tagName).toBe('SPAN');
  expect(lang?.textContent).toBe('程式語言：C 語言');
  expect(lang?.querySelector('.ui-visually-hidden')?.textContent).toBe('程式語言：');
});
