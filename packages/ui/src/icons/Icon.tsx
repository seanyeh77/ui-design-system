import { useSyncExternalStore } from 'react';
import { cx } from '../internal/util';
import { devWarn } from '../internal/dev';
import type { IconName, PhosphorName } from './names';
import { fixedGlyph, isIconName, loadIcon, nameOfMarkup, phosphorName, readyGlyph, subscribeIcons } from './store';

export type { IconName } from './names';

/** Path data for a custom 24 x 24 stroke icon ('M4 12h16'), or SVG markup on a 256 x 256 viewBox. */
export type CustomIcon = `M${string}` | `m${string}` | `<${string}`;
/** What an `icon` prop takes: a built-in name (checked by TypeScript) or a custom icon. */
export type IconSource = IconName | CustomIcon;

/** The Phosphor name behind a name, an alias or the markup of a built-in icon. */
function iconKey(source: string | undefined): PhosphorName | undefined {
  if (!source) return undefined;
  if (isIconName(source)) return phosphorName(source);
  return nameOfMarkup(source);
}

export interface IconProps {
  /** Built-in Phosphor name, e.g. 'house', 'trash' (Lucide names work as aliases). */
  name?: IconName;
  /** A custom icon when it is not built in: 24 px path data, or SVG markup, which is inserted as HTML: never pass a
   *  string that came from a user or outside data. */
  d?: CustomIcon;
  /** Default 20. */
  size?: number;
  /** Stroke width of a custom path icon. Default 2. */
  strokeWidth?: number;
  /** The Fill version, for a selected item. */
  filled?: boolean;
  className?: string;
}

/**
 * Phosphor icon, 20 px, inherits the text color. Decorative: label the control that holds it. A name the page has not
 * shown before loads its module first and is an empty box of the same size until then (on the server too).
 */
export function Icon({ name, d, size = 20, strokeWidth = 2, filled, className }: IconProps) {
  const key = iconKey(name ?? d);
  const glyph = useSyncExternalStore(
    subscribeIcons,
    () => readyGlyph(key),
    () => fixedGlyph(key),
  );
  if (name !== undefined && !isIconName(name))
    devWarn(true, 'Icon', `"${String(name)}" is not a built-in icon name; use a Phosphor name (see \`icons\`) or pass a custom icon as \`d\`.`);
  // Starts loading in the browser on the first render; the store tells every Icon with this name when it arrives.
  if (key && !glyph && typeof document !== 'undefined')
    loadIcon(key).catch((err: unknown) => devWarn(true, 'Icon', `could not load the icon "${key}" (${String(err)}); it shows as an empty box.`));
  const base = { className: cx('ui-icon', className), width: size, height: size, 'aria-hidden': true } as const;
  if (key || name !== undefined)
    return <svg {...base} viewBox="0 0 256 256" fill="currentColor" dangerouslySetInnerHTML={glyph ? { __html: filled ? glyph.f : glyph.r } : undefined} />;
  if (d?.startsWith('<')) return <svg {...base} viewBox="0 0 256 256" fill="currentColor" dangerouslySetInnerHTML={{ __html: d }} />;
  return (
    <svg {...base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/** Renders an `icon` prop value: a name or a custom icon. */
export function IconOf({ icon, ...rest }: Omit<IconProps, 'name' | 'd'> & { icon: IconSource }) {
  return isIconName(icon) ? <Icon name={icon} {...rest} /> : <Icon d={icon} {...rest} />;
}

/** The check mark of Checkbox and selected options, 24 px path. */
export const CHECK: CustomIcon = 'M4 12.5l5 5L20 6.5';
