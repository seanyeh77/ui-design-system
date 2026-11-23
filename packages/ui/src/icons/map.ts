/* The `icons` export: the markup of every built-in icon. Importing it puts every icon in the page's code. */
import { ALL } from './all';
import { PH_ALIAS, type IconName, type PhosphorName } from './names';
import { addLoadedIcons } from './store';

// A page that imports `icons` has every icon: an Icon never waits for one.
addLoadedIcons(ALL);

/** Names the first bundle used for a few icons; kept so old pages keep working. Pass the Phosphor name instead. */
const LEGACY: Record<string, PhosphorName> = {
  close: 'x',
  edit: 'pencil-simple',
  more: 'dots-three',
  spinner: 'circle-notch',
  alert: 'warning-circle',
  warn: 'warning',
  chevronRight: 'caret-right',
  chevronDown: 'caret-down',
  panelClose: 'sidebar-simple',
  panelOpen: 'sidebar-simple',
  filter: 'funnel',
  refresh: 'arrows-clockwise',
};

const REGULAR = Object.fromEntries(ALL.map((g) => [g.n, g.r])) as Record<PhosphorName, string>;

/** Markup of every built-in icon by name, aliases included. Importing it puts every icon in the page's code. */
export const icons: Readonly<Record<IconName, string>> = Object.freeze({
  ...Object.fromEntries(Object.entries(LEGACY).map(([alias, target]) => [alias, REGULAR[target]])),
  ...REGULAR,
  ...Object.fromEntries(Object.entries(PH_ALIAS).map(([alias, target]) => [alias, REGULAR[target]])),
} as Record<IconName, string>);
