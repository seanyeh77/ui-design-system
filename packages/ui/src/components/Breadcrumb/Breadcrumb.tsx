import { tr } from '../../i18n';
import { cx } from '../../internal/util';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  /** From the top level down; the last one is the current page. */
  items: BreadcrumbItem[];
  className?: string;
}

/** Where the page sits: links to each level, the current page last and not a link. */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cx('ui-crumb', className)} aria-label={tr('路徑')}>
      <ol>
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i}>
              {last ? <span aria-current="page">{it.label}</span> : it.href ? <a href={it.href}>{it.label}</a> : <span>{it.label}</span>}
              {last ? null : (
                <span className="ui-crumb-sep" aria-hidden="true">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
