/* Development-only warnings for misuse an agent or a person is likely to make. Each message gives the
   cause and the fix. Bundlers drop them from production builds; the single-file build (bundle.js) keeps them. */

declare const process: { env: { NODE_ENV?: string } };
declare const __UI_DEV__: boolean | undefined;

export const DEV = typeof __UI_DEV__ === 'boolean' ? __UI_DEV__ : process.env.NODE_ENV !== 'production';

const seen = new Set<string>();

/** Logs once per message when cond is true. */
export function devWarn(cond: unknown, component: string, message: string): void {
  if (!DEV || !cond) return;
  const text = `[@seanyeh77/ui] ${component}: ${message}`;
  if (seen.has(text)) return;
  seen.add(text);
  console.warn(text);
}
