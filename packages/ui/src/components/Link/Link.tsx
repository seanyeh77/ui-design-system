import * as React from 'react';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { includeIcons } from '../../icons/store';
import phArrowSquareOut from '../../icons/ph/arrow-square-out';

includeIcons(phArrowSquareOut);

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'target'> {
  /** Where it goes. With `render`, give the address to the router link instead. */
  href?: string;
  /** Another site: opens in a new tab, with an arrow icon and 「在新分頁開啟」 read aloud. */
  external?: boolean;
  /** A router's link to render instead of `<a>`, e.g. `<NextLink href="/orders" />`: it gets the class, the text
   *  and the other props. */
  render?: React.ReactElement<Record<string, unknown>>;
  /** The link text: say where it goes (「查看訂單」), not 「點這裡」. */
  children: React.ReactNode;
  /** Ref to the anchor. */
  ref?: React.Ref<HTMLAnchorElement>;
}

/** A text link: accent text, underlined, the focus outline. A router link goes in `render`; an action that does not
 *  go anywhere is a Button variant="quiet". */
export function Link({ href, external, render, className, children, ...rest }: LinkProps) {
  devWarn(
    !href && !render,
    'Link',
    'a Link without `href` or `render` goes nowhere. Give it `href`, a router link in `render`, or use Button variant="quiet" for an action.',
  );
  const props: Record<string, unknown> = {
    ...rest,
    className: cx('ui-textlink', external && 'is-external', className),
    ...(href !== undefined ? { href } : null),
    ...(external ? { target: '_blank', rel: rest.rel ?? 'noopener noreferrer' } : null),
  };
  const content = (
    <>
      {children}
      {external ? (
        <>
          <Icon name="arrow-square-out" size={16} className="ui-textlink-icon" />
          <span className="ui-visually-hidden">{tr('（在新分頁開啟）')}</span>
        </>
      ) : null}
    </>
  );
  if (render) {
    const own = render.props;
    return React.cloneElement(render, { ...props, className: cx(props.className as string, own.className as string | undefined) }, content);
  }
  return <a {...props}>{content}</a>;
}
