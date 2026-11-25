import * as React from 'react';
import { expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Button, Select, TextField, useFormErrors } from '../../index';

function Form({ onSave }: { onSave: (v: { name: string; env: string; email: string }) => void }) {
  const [v, setV] = React.useState({ name: '', env: '', email: '' });
  const form = useFormErrors(v, (x) => ({
    name: x.name.trim() ? undefined : '名稱不能空白，請輸入專案名稱。',
    env: x.env ? undefined : '請選擇環境',
    email: !x.email || x.email.includes('@') ? undefined : 'Email 格式不正確，例如 name@example.com',
  }));
  return (
    <form onSubmit={form.submit(onSave)} noValidate>
      <TextField
        label="名稱"
        name="name"
        value={v.name}
        onChange={(name) => setV({ ...v, name })}
        onBlur={() => form.onBlur('name')}
        error={form.errors.name}
      />
      <Select
        label="環境"
        name="env"
        value={v.env || null}
        onChange={(env) => setV({ ...v, env })}
        options={[
          { value: 'dev', label: '開發' },
          { value: 'prod', label: '正式' },
        ]}
        error={form.errors.env}
      />
      <TextField
        label="Email"
        name="email"
        value={v.email}
        onChange={(email) => setV({ ...v, email })}
        onBlur={() => form.onBlur('email')}
        error={form.errors.email}
      />
      <Button variant="primary" type="submit">
        儲存
      </Button>
    </form>
  );
}

test('useFormErrors: no error while typing; shown on blur; gone as soon as the value is right', async () => {
  render(<Form onSave={() => {}} />);
  const user = userEvent.setup();
  const email = screen.getByRole('textbox', { name: 'Email' });
  await user.type(email, 'sean');
  expect(email.getAttribute('aria-invalid')).toBeNull();
  await user.tab();
  expect(email.getAttribute('aria-invalid')).toBe('true');
  await user.type(email, '@x.tw');
  expect(email.getAttribute('aria-invalid')).toBeNull();
});

test('useFormErrors: submit shows every error and focuses the first invalid field; a valid form is saved', async () => {
  const onSave = vi.fn();
  render(<Form onSave={onSave} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '儲存' }));
  expect(onSave).not.toHaveBeenCalled();
  const name = screen.getByRole('textbox', { name: '名稱' });
  await waitFor(() => expect(document.activeElement).toBe(name));
  expect(name.getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByText('請選擇環境')).toBeTruthy();
  await user.type(name, 'api');
  await user.click(screen.getByRole('button', { name: '儲存' }));
  // The next invalid field is the picker: focus goes to its visible control, not its hidden input.
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('combobox', { name: '環境' })));
  await user.click(screen.getByRole('combobox', { name: '環境' }));
  await user.click(await screen.findByRole('option', { name: '開發' }));
  await user.click(screen.getByRole('button', { name: '儲存' }));
  expect(onSave).toHaveBeenCalledWith({ name: 'api', env: 'dev', email: '' });
});

test('useFormErrors: isValid(name), and onBlur returns whether the field is valid, so a settings page saves on blur only then', async () => {
  const save = vi.fn();
  function Settings() {
    const [v, setV] = React.useState({ name: 'api' });
    const form = useFormErrors(v, (x) => ({ name: x.name.trim() ? undefined : '名稱不能空白，請輸入專案名稱。' }));
    return (
      <>
        <TextField
          label="名稱"
          name="name"
          value={v.name}
          onChange={(name) => setV({ name })}
          onBlur={() => form.onBlur('name') && save(v.name)}
          error={form.errors.name}
        />
        <span data-testid="valid">{String(form.isValid('name'))}</span>
      </>
    );
  }
  render(<Settings />);
  const user = userEvent.setup();
  const name = screen.getByRole('textbox', { name: '名稱' });
  await user.clear(name);
  expect(screen.getByTestId('valid').textContent).toBe('false');
  await user.tab();
  expect(save).not.toHaveBeenCalled();
  expect(name.getAttribute('aria-invalid')).toBe('true');
  await user.type(name, 'web');
  expect(screen.getByTestId('valid').textContent).toBe('true');
  await user.tab();
  expect(save).toHaveBeenCalledWith('web');
});
