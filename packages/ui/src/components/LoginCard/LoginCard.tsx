import * as React from 'react';
import { Button } from '../Button/Button';
import { TextField } from '../TextField/TextField';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';


export interface LoginCardProps {
  /** Logo or product name above the title. */
  brand?: React.ReactNode;
  /** Default 「登入」. */
  title?: string;
  onSubmit: (v: { account: string; password: string }) => void;
  /** Errors from your sign-in check, shown under each field: the cause and the fix. */
  error?: { account?: string; password?: string } | null;
  /** Adds 「忘記密碼」 beside the password label. */
  forgotHref?: string;
  loading?: boolean;
  className?: string;
}

/* LoginCard: centered card on surface-sub: account and password (with show-password), 「忘記密碼」 beside the password
   label, errors under each field. Pass error = { account, password } from your sign-in check. */
/** A centered sign-in card: account, password with show-password, errors under each field. */
export function LoginCard(p: LoginCardProps) {
  const pwId = React.useId();
  const [user, setUser] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [tried, setTried] = React.useState(false);
  const err = p.error || {};
  const uErr = tried && !user ? tr('請輸入帳號') : err.account;
  const pErr = tried && !pass ? tr('請輸入密碼') : err.password;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (user && pass) p.onSubmit({ account: user, password: pass });
  }
  return (
    <div className={cx('ui-loginpage', p.className)}>
      <form className="ui-logincard" onSubmit={submit} noValidate>
        {p.brand ? <div className="ui-login-brand">
          {p.brand}
        </div> : null}
        <h1 className="ui-login-title">
          {p.title || tr('登入')}
        </h1>
        <TextField
          label={tr('帳號')}
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder={tr('Email 或帳號')}
          autoComplete="username"
          error={uErr} />
        <div className="ui-field">
          <div className="ui-login-pwlabel">
            <label htmlFor={pwId} className="ui-field-label">
              {tr('密碼')}
            </label>
            {p.forgotHref ? <a href={p.forgotHref} className="ui-link">
              {tr('忘記密碼')}
            </a> : null}
          </div>
          <div className={cx('ui-pwfield', pErr && 'is-invalid')}>
            <input
              id={pwId}
              className="ui-pwfield-input"
              type={show ? 'text' : 'password'}
              value={pass}
              autoComplete="current-password"
              aria-invalid={pErr ? true : undefined}
              aria-describedby={pErr ? pwId + '-err' : undefined}
              onChange={(e) => setPass(e.target.value)} />
            <button
              type="button"
              className="ui-datefield-btn"
              aria-label={show ? tr('隱藏密碼') : tr('顯示密碼')}
              aria-pressed={show}
              onClick={() => setShow(!show)}>
              <Icon name={show ? 'eye-slash' : 'eye'} size={18} />
            </button>
          </div>
          {pErr ? <div id={pwId + '-err'} className="ui-field-hint is-error" role="alert">
            {pErr}
          </div> : null}
        </div>
        <Button
          variant="primary"
          type="submit"
          loading={p.loading}
          className="ui-login-submit">
          {tr('登入')}
        </Button>
      </form>
    </div>
  );
}

