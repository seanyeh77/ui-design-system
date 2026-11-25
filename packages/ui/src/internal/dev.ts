/* Development-only warnings for misuse an agent or a person is likely to make. Each message gives the
   cause and the fix. Off in production builds (the bundler replaces NODE_ENV); the single-file build (bundle.js) keeps them on. */

declare const process: { env: { NODE_ENV?: string } };
declare const __UI_DEV__: boolean | undefined;

// Bundlers replace process.env.NODE_ENV; without a bundler there is no process, and the warnings stay off.
/** True in development builds (and in bundle.js). Wrap a check that costs time (loops over rows) in `if (DEV)`, or pass
 *  devWarn a function, so production builds skip it. */
export const DEV: boolean =
  typeof __UI_DEV__ === 'boolean'
    ? __UI_DEV__
    : (() => {
        try {
          return process.env.NODE_ENV !== 'production';
        } catch {
          return false;
        }
      })();

const seen = new Set<string>();

/** Logs once per message when cond is truthy, in development only. cond and message may be functions: they are then
 *  called only in development, so a check that loops over data costs nothing in production. Messages are in English,
 *  in the form 「cause. Fix.」. */
export function devWarn(cond: unknown, component: string, message: string | (() => string)): void {
  if (!DEV) return;
  if (!(typeof cond === 'function' ? (cond as () => unknown)() : cond)) return;
  const text = `[@seanyeh77/ui] ${component}: ${typeof message === 'function' ? message() : message}`;
  if (seen.has(text)) return;
  seen.add(text);
  console.warn(text);
}
