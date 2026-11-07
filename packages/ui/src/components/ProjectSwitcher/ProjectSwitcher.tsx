import type * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { tr } from '../../i18n';
import { CHECK, Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';

export type ProjectStatus = 'live' | 'stale' | 'offline';

const PS_STATUS: Record<ProjectStatus, string> = { live: '即時', stale: '已過期', offline: '離線' };

export interface ProjectOption {
  id: string;
  label: string;
  /** A second line, e.g. the environment or the last update. */
  detail?: string;
}

export interface ProjectSwitcherProps {
  /** The project and environment shown, e.g. 「web · production」. */
  project: string;
  /** Whether the data is live. Default 'live'. */
  status?: ProjectStatus;
  /** Replaces the status name (即時, 已過期, 離線). */
  statusLabel?: string;
  /** With onChange, a list to switch project. */
  options?: ProjectOption[];
  value?: string;
  onChange?: (id: string) => void;
  /** Under the list, e.g. a link to all projects. */
  footer?: React.ReactNode;
  className?: string;
}

/** The outlined chip in the top bar: which project is shown and whether its data is live; opens a list to switch. */
export function ProjectSwitcher({ project, status = 'live', statusLabel, options = [], value, onChange, footer, className }: ProjectSwitcherProps) {
  const st = PS_STATUS[status] ? status : 'live';
  const label = `${project} · ${statusLabel || tr(PS_STATUS[st])}`;
  const chip = (
    <>
      <span className="ui-projsw-dot" aria-hidden="true" />
      <span className="ui-projsw-text">{label}</span>
    </>
  );
  if (!options.length || !onChange)
    return (
      <span className={cx('ui-projsw', 'is-' + st, 'is-static', className)} role="status" aria-label={label}>
        {chip}
      </span>
    );
  return (
    <Menu.Root>
      <Menu.Trigger className={cx('ui-projsw', 'is-' + st, className)} aria-label={tr('切換專案，目前是 {name}', { name: label })}>
        {chip}
        <Icon name="caret-down" size={14} className="ui-projsw-caret" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="ui-float" side="bottom" align="end" sideOffset={6}>
          <Menu.Popup className="ui-projsw-pop" aria-label={tr('切換專案')}>
            <div className="ui-projsw-title">{tr('切換專案')}</div>
            <Menu.RadioGroup value={value} onValueChange={(id: string) => id !== value && onChange(id)}>
              {options.map((o) => (
                <Menu.RadioItem key={o.id} value={o.id} closeOnClick className={cx('ui-projsw-opt', o.id === value && 'is-on')}>
                  <span className="ui-projsw-optlabel">{o.label}</span>
                  {o.detail ? <span className="ui-projsw-optdetail">{o.detail}</span> : null}
                  <Menu.RadioItemIndicator className="ui-projsw-check">
                    <Icon d={CHECK} size={16} />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
            {footer ? <div className="ui-projsw-foot">{footer}</div> : null}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
