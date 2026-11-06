import * as React from 'react';
import { LoginCard } from '@seanyeh77/ui';

/* Sign-in page. Pass the result of your sign-in check back as error: the cause and the fix, per field. */

export interface LoginProps {
  brand?: React.ReactNode;
  signIn: (account: string, password: string) => Promise<{ account?: string; password?: string } | null>;
  forgotHref?: string;
}

export function Login({ brand, signIn, forgotHref }: LoginProps) {
  const [error, setError] = React.useState<{ account?: string; password?: string } | null>(null);
  const [loading, setLoading] = React.useState(false);
  return (
    <LoginCard
      brand={brand}
      forgotHref={forgotHref}
      loading={loading}
      error={error}
      onSubmit={async ({ account, password }) => {
        setLoading(true);
        setError(await signIn(account, password));
        setLoading(false);
      }}
    />
  );
}
