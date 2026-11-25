import * as React from 'react';
import { I18N, emitLocale, subscribeLocale } from './i18n';

/* The interface language in React. tr() and format read one module-wide locale, so they keep working outside React;
   these follow it so a page renders again when it changes. */

const getLocale = () => I18N.locale;

/** The current locale (setLocale); the component that calls it renders again when the locale changes, and with it the
 *  elements it creates. Call it in the component that builds the page, so the whole page switches language. */
export function useLocale(): string {
  return React.useSyncExternalStore(subscribeLocale, getLocale, getLocale);
}

export interface LocaleProviderProps {
  /** The locale of this render, e.g. 'en-US'. */
  locale: string;
  /** The currency of format.money; default: the current one. */
  currency?: string;
  children?: React.ReactNode;
}

/** Sets the locale for the tree it wraps before the tree renders: on the server (one locale per request, the request's
 *  own render) and in the browser's first render, so both use the same words. Changing the prop later switches the
 *  locale like setLocale. The locale is module-wide: render one request at a time (renderToString, or a stream that
 *  finishes before the next request renders). */
export function LocaleProvider({ locale, currency, children }: LocaleProviderProps) {
  // During render, before the children: without notifying, since no other component may update while this one renders.
  // eslint-disable-next-line react-hooks/immutability -- the module-wide locale is set on purpose
  if (I18N.locale !== locale) I18N.locale = locale;
  // eslint-disable-next-line react-hooks/immutability -- the same for the currency
  if (currency && I18N.currency !== currency) I18N.currency = currency;
  const first = React.useRef(true);
  React.useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
    // A later change of the prop: components elsewhere that read useLocale() follow.
    if (!first.current) emitLocale();
    first.current = false;
  }, [locale, currency]);
  return <>{children}</>;
}
