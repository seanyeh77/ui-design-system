import * as React from 'react';
import { Button } from '../Button/Button';
import { TextField } from '../TextField/TextField';
import { Link } from '../Link/Link';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { FieldErrorIcon, FieldLabel, FieldMessage, QuietErrors } from '../../internal/Field';
import { includeIcons } from '../../icons/store';
import phEye from '../../icons/ph/eye';
import phEyeSlash from '../../icons/ph/eye-slash';

includeIcons(phEye, phEyeSlash);

export interface LoginCardProps {
  /** The product's mark (an <svg> or <img>, 32 px tall) beside the brand name. */
  logo?: React.ReactNode;
  /** Product name above the title. */
  brand?: React.ReactNode;
  /** Default 「登入」. */
  title?: string;
  /** Receives the account and password when both are filled. */
  onSubmit: (v: { account: string; password: string }) => void;
  /** Errors from your sign-in check, shown under each field: the cause and the fix; `backticks` are code. Focus moves to
   *  the first field with an error when it arrives. */
  error?: { account?: string; password?: string } | null;
  /** Adds 「忘記密碼」 beside the password label. */
  forgotHref?: string;
  /** The sign-in is running: the button shows a spinner and ignores presses, keeping focus. */
  loading?: boolean;
  /** Extra class on the root element. */
  className?: string;
}

/** A centered sign-in page: account, password with show-password, 「忘記密碼」 beside the password label, errors under each
 *  field. Pass error = { account, password } from your sign-in check. */
export function LoginCard(p: LoginCardProps) {
  const pwId = React.useId();
  const userId = React.useId();
  const [user, setUser] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [tried, setTried] = React.useState(false);
  const err = p.error || {};
  const uErr = tried && !user ? tr('請輸入帳號') : err.account;
  const pErr = tried && !pass ? tr('請輸入密碼') : err.password;
  // Focus goes to the first field with an error: the field reads its error (aria-describedby), one message at a time.
  const focusFirst = (u: boolean, pw: boolean) => {
    const id = u ? userId : pw ? pwId : null;
    if (id) document.getElementById(id)?.focus();
  };
  // An error from the sign-in check arrives after the request: focus its field then too.
  const errKey = `${err.account ?? ''}\u0000${err.password ?? ''}`;
  const lastErr = React.useRef(errKey);
  React.useEffect(() => {
    if (errKey === lastErr.current) return;
    lastErr.current = errKey;
    focusFirst(!!err.account, !!err.password);
  });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (user && pass) p.onSubmit({ account: user, password: pass });
    else focusFirst(!user, !pass);
  }
  return (
    <main className={cx('ui-loginpage', p.className)}>
      <QuietErrors.Provider value>
        <form className="ui-logincard" onSubmit={submit} noValidate>
          {p.logo || p.brand ? (
            <div className="ui-login-brand">
              {p.logo ? <span className="ui-login-logo">{p.logo}</span> : null}
              {p.brand}
            </div>
          ) : null}
          <h1 className="ui-login-title">{p.title || tr('登入')}</h1>
          <TextField id={userId} label={tr('帳號')} value={user} onChange={setUser} placeholder={tr('Email 或帳號')} autoComplete="username" error={uErr} />
          <div className={cx('ui-field', pErr && 'has-error')}>
            <div className="ui-login-pwlabel">
              <FieldLabel htmlFor={pwId}>{tr('密碼')}</FieldLabel>
              {p.forgotHref ? (
                <Link href={p.forgotHref} className="ui-login-forgot">
                  {tr('忘記密碼')}
                </Link>
              ) : null}
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
                onChange={(e) => setPass(e.target.value)}
              />
              {pErr ? <FieldErrorIcon inline /> : null}
              {/* One name, and pressed or not: 「顯示密碼，已按下」. */}
              <button type="button" className="ui-datefield-btn" aria-label={tr('顯示密碼')} aria-pressed={show} onClick={() => setShow(!show)}>
                <Icon name={show ? 'eye-slash' : 'eye'} size={18} />
              </button>
            </div>
            <FieldMessage id={pwId + '-err'} error={pErr} />
          </div>
          <Button variant="primary" type="submit" loading={p.loading} className="ui-login-submit">
            {tr('登入')}
          </Button>
        </form>
      </QuietErrors.Provider>
    </main>
  );
}
