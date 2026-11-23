declare module '*.css';
// Vite features the browser tests use (vite is not a direct dependency, so its client types are declared here).
declare module '*?raw' {
  const text: string;
  export default text;
}
interface ImportMeta {
  glob<T = unknown>(patterns: string | string[], options?: { query?: string; import?: string; eager?: boolean }): Record<string, T>;
}
