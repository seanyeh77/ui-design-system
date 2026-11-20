import type * as React from 'react';
import { cx } from '../../internal/util';
import { format } from '../../format';
import { tr } from '../../i18n';
import { heatToken, textOn } from '../../theme';

export interface Zone {
  id: string;
  /** 「A 區」. */
  name: string;
  /** The main figure; null or undefined: no data (a dashed outline, not selectable). */
  value?: number | null;
  /** After the figure, smaller: '°C'. */
  unit?: string;
  /** Decimals of the figure. Default 1. */
  decimals?: number;
  /** The fill: a token name such as 'heat-5' or a color. Default: from the value on the heat scale (min, max). */
  fill?: string;
  /** `warning` or `danger`: a 4 px border in that color, and 「⚠」 before the state. Default normal. */
  tone?: 'normal' | 'warning' | 'danger';
  /** The state in words, e.g. 「正常」「注意」「超過上限」. Default 「正常」, or 「預測」 for a forecast. */
  state?: string;
  /** A forecast, not a measurement: the forecast stripes over the fill. */
  forecast?: boolean;
  /** One line of secondary information, e.g. 「進氣 26.1 °C」. */
  detail?: string;
  /** Where it sits on the grid (1-based); default: the next free cell. */
  area?: { row: number; col: number; rows?: number; cols?: number };
}

export interface ZoneMapProps {
  zones: Zone[];
  /** What the map shows, for screen readers, e.g. 「機房分區」. */
  label: string;
  /** Columns of the grid. Default 4. Where a zone would be narrower than 150 px (phones), fewer columns are used and
   *  `area` placements are dropped, so zones flow in order. */
  columns?: number;
  /** Height of one grid row in px. Default 120. */
  rowHeight?: number;
  /** The heat scale's range for zones without a fill. Default 20 to 30. */
  min?: number;
  max?: number;
  selectedId?: string | null;
  onSelect?: (zone: Zone) => void;
  className?: string;
}

/** A floor plan of zones as rectangles on a grid, each filled by its value (heat scale) with its name, state, figure
 *  and one detail line. Zones are buttons: Tab moves between them, Enter or Space selects. The selected zone has an
 *  ink outline outside it; a zone needing attention has a 4 px warning or danger border and 「⚠」 in its state. */
const DATA_TOKEN = /^(heat-[1-7]|diverge-(neg|pos)(-strong)?|diverge-zero|chart-[1-4])$/;

export function ZoneMap({ zones, label, columns = 4, rowHeight = 120, min = 20, max = 30, selectedId, onSelect, className }: ZoneMapProps) {
  return (
    <div
      className={cx('ui-zonemap', className)}
      role="group"
      aria-label={label}
      style={{ '--zone-cols': columns, gridAutoRows: rowHeight + 'px' } as React.CSSProperties}
    >
      {zones.map((z) => {
        const place = z.area ? { gridRow: `${z.area.row} / span ${z.area.rows ?? 1}`, gridColumn: `${z.area.col} / span ${z.area.cols ?? 1}` } : undefined;
        if (z.value == null && !z.forecast)
          return (
            <div key={z.id} className="ui-zone is-empty" style={place}>
              <span className="ui-zone-name">{z.name}</span>
              <span className="ui-zone-detail">{tr('沒有資料')}</span>
            </div>
          );
        const tone = z.tone ?? 'normal';
        const fill = z.fill ?? (z.value != null ? heatToken(z.value, min, max) : 'surface-sub');
        const bg = /^[a-z][a-z0-9-]*$/.test(fill) ? `var(--${fill})` : fill;
        const state = (tone === 'normal' ? '' : '⚠ ') + (z.state ?? (z.forecast ? tr('預測') : tr('正常')));
        const figure = z.value != null ? format.number(z.value, z.decimals ?? 1) : '—';
        const on = selectedId === z.id;
        return (
          <button
            key={z.id}
            type="button"
            className={cx('ui-zone', 'is-' + tone, z.forecast && 'ui-forecast', on && 'is-selected')}
            data-fill={fill}
            // Text on the data tokens comes from CSS (it follows the theme); other fills are measured here.
            style={{ ...place, background: bg, color: DATA_TOKEN.test(fill) ? undefined : textOn(fill) }}
            aria-pressed={on}
            aria-label={[z.name, figure + (z.unit ? ' ' + z.unit : ''), state.replace('⚠ ', ''), z.detail].filter(Boolean).join(tr('，'))}
            onClick={() => onSelect?.(z)}
          >
            <span className="ui-zone-head">
              <span className="ui-zone-name">{z.name}</span>
              <span className="ui-zone-state">{state}</span>
            </span>
            <span className="ui-zone-value">
              {figure}
              {z.unit ? <span className="ui-zone-unit">{z.unit}</span> : null}
            </span>
            {z.detail ? <span className="ui-zone-detail">{z.detail}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
