import { Term } from '../Term/Term';
import { tr } from '../../i18n';
import { cx } from '../../internal/util';

/** <defs> with the arrowheads #ui-arrow and #ui-arrow-accent; put it first inside your diagram's <svg>. */
export function GraphDefs() {
  const marker = (id: string, accent: boolean) => (
    <marker id={id} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" className={cx('ui-graph-arrow', accent && 'is-accent')} />
    </marker>
  );
  return (
    <defs>
      {marker('ui-arrow', false)}
      {marker('ui-arrow-accent', true)}
    </defs>
  );
}

export interface GraphLegendItem {
  /** edge: a confirmed line; inferred: a dashed line; declared: long-short dashes (declared by the project); external: a
   *  dashed box; node: a plain box; weight: thin and thick lines. */
  type: 'edge' | 'inferred' | 'declared' | 'external' | 'node' | 'weight';
  /** Your own words for it: 「呼叫」「推測的呼叫」「外部函式」. */
  label: string;
  /** Adds a Term with this explanation. */
  text?: string;
}

const LEGEND_DEFAULT: GraphLegendItem[] = [
  { type: 'edge', label: '確定的關係' },
  { type: 'inferred', label: '推測的關係' },
  { type: 'external', label: '外部項目' },
];

export interface GraphLegendProps {
  /** Default: 確定的關係, 推測的關係, 外部項目. Pass your domain's words. */
  items?: GraphLegendItem[];
  className?: string;
}

function Swatch({ type }: { type: GraphLegendItem['type'] }) {
  if (type === 'weight')
    return (
      <span className="ui-graph-legend-sw">
        {[1.5, 6].map((w) => (
          <svg key={w} width={22} height={8} aria-hidden="true">
            <line x1={0} y1={4} x2={22} y2={4} className="ui-graph-edge" style={{ strokeWidth: w }} />
          </svg>
        ))}
      </span>
    );
  if (type === 'external' || type === 'node')
    return (
      <svg width={22} height={14} aria-hidden="true">
        <rect x={1} y={1} width={20} height={12} rx={4} className={cx('ui-graph-node', type === 'external' && 'is-external')} />
      </svg>
    );
  return (
    <svg width={28} height={8} aria-hidden="true">
      <line x1={0} y1={4} x2={28} y2={4} className={cx('ui-graph-edge', type === 'inferred' && 'is-inferred', type === 'declared' && 'is-declared')} />
    </svg>
  );
}

/** The legend row under a diagram: what each line and box style means. */
export function GraphLegend({ items = LEGEND_DEFAULT, className }: GraphLegendProps) {
  return (
    <div className={cx('ui-graph-legend', className)}>
      {items.map((it, i) => (
        <span key={i} className="ui-graph-legend-item">
          <Swatch type={it.type} />
          {it.text ? (
            <Term title={it.label} text={it.text}>
              {tr(it.label)}
            </Term>
          ) : (
            tr(it.label)
          )}
        </span>
      ))}
    </div>
  );
}
