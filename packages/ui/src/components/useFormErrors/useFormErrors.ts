import * as React from 'react';

/** The errors a validate function returns: a sentence with the cause and the fix per field, undefined when it is right. */
export type FormErrors<V> = Partial<Record<keyof V & string, string | undefined>>;

export interface UseFormErrors<V> {
  /** The errors to show now: a field's error once it was left (blur) or the form was sent, gone as soon as it is right.
   *  Pass errors.name to the field's `error`. */
  errors: FormErrors<V>;
  /** The fields that were left at least once. */
  touched: Partial<Record<keyof V & string, boolean>>;
  /** Call from a field's onBlur: onBlur={() => form.onBlur('name')}. Its error shows from then on. */
  onBlur: (name: keyof V & string) => void;
  /** Wraps your submit handler: shows every error and focuses the first invalid field (by its `name`), or runs handler
   *  with the values when there are none. Use as <form onSubmit={form.submit(save)}> or onClick={form.submit(save)}. */
  submit: (handler: (values: V) => void) => (event?: React.SyntheticEvent) => void;
  /** Forgets what was left and sent (after a save, or a new item in the same form). */
  reset: () => void;
}

const FOCUSABLE = 'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Field errors the way the forms rules want them: shown when a field is left and when the form is sent, cleared as soon as
 *  the value is right, and on send focus goes to the first invalid field. validate(values) returns { field: '原因與修正' }. */
export function useFormErrors<V extends Record<string, unknown>>(values: V, validate: (values: V) => FormErrors<V>): UseFormErrors<V> {
  const [touched, setTouched] = React.useState<Partial<Record<keyof V & string, boolean>>>({});
  const [sent, setSent] = React.useState(false);
  const all = validate(values);
  const errors: FormErrors<V> = {};
  for (const k of Object.keys(all) as (keyof V & string)[]) if (all[k] && (sent || touched[k])) errors[k] = all[k];
  const latest = React.useRef({ values, validate });
  React.useLayoutEffect(() => {
    latest.current = { values, validate };
  });
  const onBlur = React.useCallback((name: keyof V & string) => setTouched((t) => (t[name] ? t : { ...t, [name]: true })), []);
  const submit = React.useCallback(
    (handler: (values: V) => void) => (event?: React.SyntheticEvent) => {
      event?.preventDefault();
      const { values: v, validate: check } = latest.current;
      const found = check(v);
      const bad = (Object.keys(found) as (keyof V & string)[]).filter((k) => found[k]);
      if (!bad.length) return handler(v);
      setSent(true);
      // The first invalid field in page order, found by its name (a hidden input of a picker: its visible control).
      const target = event?.currentTarget;
      const scope: ParentNode = target instanceof HTMLFormElement ? target : (target instanceof Element && target.closest('form')) || document;
      const els = bad
        .map((k) => {
          const el = scope.querySelector<HTMLElement>(`[name="${CSS.escape(k)}"]`);
          if (!el) return null;
          if (el instanceof HTMLInputElement && el.type === 'hidden') return el.closest('.ui-field')?.querySelector<HTMLElement>(FOCUSABLE) ?? null;
          return el;
        })
        .filter((e): e is HTMLElement => !!e)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      // After the errors render, so the field is read with its error.
      requestAnimationFrame(() => els[0]?.focus());
    },
    [],
  );
  const reset = React.useCallback(() => {
    setTouched({});
    setSent(false);
  }, []);
  return { errors, touched, onBlur, submit, reset };
}
