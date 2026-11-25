import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Link } from '../../index';

test('Link: accent text with an underline; external opens a new tab and says so', () => {
  const { container } = render(
    <>
      <Link href="/a">訂單</Link>
      <Link href="https://example.com" external>
        說明
      </Link>
    </>,
  );
  const [a, b] = Array.from(container.querySelectorAll('a'));
  expect(getComputedStyle(a).textDecorationLine).toBe('underline');
  expect(getComputedStyle(a).color).not.toBe('rgb(0, 0, 238)');
  expect(a.querySelector('svg')).toBeNull();
  expect(b.getAttribute('target')).toBe('_blank');
  expect(b.getAttribute('rel')).toBe('noopener noreferrer');
  expect(b.textContent).toContain('在新分頁開啟');
  expect(b.querySelector('svg')).not.toBeNull();
});

test('Link: render hands the class and text to a router link', () => {
  const { container } = render(<Link render={<a href="/x" className="router" />}>全部</Link>);
  const a = container.querySelector('a') as HTMLAnchorElement;
  expect(a.className).toContain('ui-textlink');
  expect(a.className).toContain('router');
  expect(a.getAttribute('href')).toBe('/x');
  expect(a.textContent).toBe('全部');
});

test('a bare <a> gets the link colour, not the browser blue', () => {
  const { container } = render(<a href="#x">舊連結</a>);
  expect(getComputedStyle(container.querySelector('a') as Element).color).not.toBe('rgb(0, 0, 238)');
});
