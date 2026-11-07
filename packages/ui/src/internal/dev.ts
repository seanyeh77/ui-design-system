/* Development-only warnings for misuse an agent or a person is likely to make. Each message gives the
   cause and the fix. Off in production builds (the bundler replaces NODE_ENV); the single-file build (bundle.js) keeps them on. */

declare const process: { env: { NODE_ENV?: string } };
declare const __UI_DEV__: boolean | undefined;

// Bundlers replace process.env.NODE_ENV; without a bundler there is no process, and the warnings stay off.
const DEV =
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

/** Logs once per message when cond is true. */
export function devWarn(cond: unknown, component: string, message: string): void {
  if (!DEV || !cond) return;
  const text = `[@seanyeh77/ui] ${component}: ${message}`;
  if (seen.has(text)) return;
  seen.add(text);
  console.warn(text);
}
