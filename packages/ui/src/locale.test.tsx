import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { LocaleProvider, setLocale, t, useLocale } from './index';

afterEach(() => setLocale('zh-TW'));

function Words() {
  useLocale();
  return <p>{t('關閉')}</p>;
}

test('useLocale: setLocale renders the component again in the new language', () => {
  render(<Words />);
  expect(screen.getByText('關閉')).toBeTruthy();
  act(() => setLocale('en'));
  expect(screen.getByText('Close')).toBeTruthy();
});

test('LocaleProvider: the server render uses its locale; tr() outside React keeps working', () => {
  const html = renderToString(
    <LocaleProvider locale="en">
      <Words />
    </LocaleProvider>,
  );
  expect(html).toContain('Close');
  expect(t('關閉')).toBe('Close');
});

test('tr(): a context key shows only its text in zh-TW and its own translation in English', () => {
  expect(t('快選::上個月')).toBe('上個月');
  setLocale('en');
  expect(t('快選::上個月')).toBe('Last month');
  expect(t('上個月')).toBe('Previous month');
});
