import * as React from 'react';
import { cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';

/** True inside a Card: card-styled components drop their own shadow there. */
const InCard = React.createContext(false);

export interface CardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Heading at the top left. */
  title?: React.ReactNode;
  /** Buttons at the top right. */
  actions?: React.ReactNode;
  /** false: no inner padding, for a table or a tree that fills the card. */
  padding?: boolean;
  /** Element to render. Default 'section'. */
  as?: 'section' | 'div' | 'article' | 'aside' | 'form';
  children?: React.ReactNode;
}

/** The one container with a shadow. Never put a Card inside a Card: split the content into sections with headings instead. */
export function Card({ as: Tag = 'section', title, actions, padding = true, className, children, ...native }: CardProps) {
  const nested = React.useContext(InCard);
  devWarn(nested, 'Card', 'a Card inside a Card gives two shadows. Use one Card and separate its parts with headings or a divider.');
  return (
    <InCard.Provider value>
      <Tag {...native} className={cx('ui-card', !padding && 'is-flush', className)}>
        {title || actions ? (
          <div className="ui-card-head">
            {title ? <h2 className="ui-card-title">{title}</h2> : <span />}
            {actions ? <div className="ui-card-actions">{actions}</div> : null}
          </div>
        ) : null}
        {children}
      </Tag>
    </InCard.Provider>
  );
}
