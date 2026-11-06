import { PH, PH_ALIAS, PH_FILL, type IconName, type PhosphorName } from './data';
import { cx } from '../internal/util';

export type { IconName } from './data';

/** Path data for a custom 24 x 24 stroke icon ('M4 12h16'), or SVG markup on a 256 x 256 viewBox. */
export type CustomIcon = `M${string}` | `m${string}` | `<${string}`;
/** What an `icon` prop takes: a built-in name (checked by TypeScript) or a custom icon. */
export type IconSource = IconName | CustomIcon;

const BY_MARKUP = new Map<string, PhosphorName>();
for (const k of Object.keys(PH) as PhosphorName[]) {
  BY_MARKUP.set(PH[k], k);
  BY_MARKUP.set(PH_FILL[k], k);
}

const isName = (s: string): s is IconName => s in PH || s in PH_ALIAS;

/** The Phosphor name behind a name, an alias or the markup of a built-in icon. */
export function iconKey(source: string | undefined): PhosphorName | undefined {
  if (!source) return undefined;
  if (isName(source)) return source in PH ? (source as PhosphorName) : PH_ALIAS[source as keyof typeof PH_ALIAS];
  return BY_MARKUP.get(source);
}

export interface IconProps {
  /** Built-in Phosphor name, e.g. 'house', 'trash' (Lucide names work as aliases). */
  name?: IconName;
  /** A custom icon when it is not built in: 24 px path data, or SVG markup. */
  d?: CustomIcon;
  /** Default 20. */
  size?: number;
  /** Stroke width of a custom path icon. Default 2. */
  strokeWidth?: number;
  /** The Fill version, for a selected item. */
  filled?: boolean;
  className?: string;
}

/** Phosphor icon, 20 px, inherits the text color. Decorative: label the control that holds it. */
export function Icon({ name, d, size = 20, strokeWidth = 2, filled, className }: IconProps) {
  const key = iconKey(name ?? d);
  const base = { className: cx('ui-icon', className), width: size, height: size, 'aria-hidden': true } as const;
  if (key) return <svg {...base} viewBox="0 0 256 256" fill="currentColor" dangerouslySetInnerHTML={{ __html: filled ? PH_FILL[key] : PH[key] }} />;
  if (d?.startsWith('<')) return <svg {...base} viewBox="0 0 256 256" fill="currentColor" dangerouslySetInnerHTML={{ __html: d }} />;
  return (
    <svg {...base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/** Renders an `icon` prop value: a name or a custom icon. */
export function IconOf({ icon, ...rest }: Omit<IconProps, 'name' | 'd'> & { icon: IconSource }) {
  return isName(icon) ? <Icon name={icon} {...rest} /> : <Icon d={icon} {...rest} />;
}

/** Markup of every built-in icon by name, aliases included. */
export const icons: Readonly<Record<IconName, string>> = Object.freeze({
  ...PH,
  ...Object.fromEntries(Object.entries(PH_ALIAS).map(([alias, target]) => [alias, PH[target as PhosphorName]])),
} as Record<IconName, string>);

export function Spinner() {
  return <Icon name="circle-notch" className="ui-spin" size={16} />;
}

/** The check mark of Checkbox and selected options, 24 px path. */
export const CHECK: CustomIcon = 'M4 12.5l5 5L20 6.5';
