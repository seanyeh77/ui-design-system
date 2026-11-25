import { consoleZoom as zoom } from './components/ConsoleLayout/ConsoleLayout';
import { devWarn } from './internal/dev';

/** @deprecated ConsoleLayout's own zoom rule, exported by mistake: it leaves the exports in a later version.
 *  ConsoleLayout zooms itself; a page that needs its own zoom computes it. */
export function consoleZoom(w: number, h: number): number {
  devWarn(
    true,
    'consoleZoom',
    'consoleZoom is internal and will be removed from the exports in a later version. Let ConsoleLayout zoom itself, or compute your own zoom.',
  );
  return zoom(w, h);
}
