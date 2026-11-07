import * as React from 'react';
import { LoginCard, type LoginCardProps } from '@seanyeh77/ui';

/* Sign-in page. Pass the result of your sign-in check back as error: the cause and the fix, per field. */

export interface LoginProps {
  brand?: React.ReactNode;
  /** Resolves to null, or to the field errors (cause and fix). Throw only when the server cannot be reached. */
  signIn: (account: string, password: string) => Promise<LoginCardProps['error']>;
  forgotHref?: string;
}

export function Login({ brand, signIn, forgotHref }: LoginProps) {
  const [error, setError] = React.useState<LoginCardProps['error']>(null);
  const [loading, setLoading] = React.useState(false);
  return (
    <LoginCard
      brand={brand}
      forgotHref={forgotHref}
      loading={loading}
      error={error}
      onSubmit={async ({ account, password }) => {
        setLoading(true);
        try {
          setError(await signIn(account, password));
        } catch {
          setError({ password: '無法連線，請確認網路後再試一次。' });
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}
