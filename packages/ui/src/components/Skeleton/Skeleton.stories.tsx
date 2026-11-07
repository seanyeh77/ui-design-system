import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Feedback/Skeleton', component: UI.Skeleton };

export const Default = {
  render: () => (
    <div className="ui-stack">
      {[
        ['32%', '18%'],
        ['44%', '14%'],
        ['26%', '20%'],
        ['38%', '16%'],
      ].map((w, i) => {
        return (
          <div key={i} style={{ display: 'flex', gap: 16 }}>
            <UI.Skeleton width={w[0]} />
            <UI.Skeleton width={w[1]} />
            <UI.Skeleton width="12%" />
          </div>
        );
      })}
    </div>
  ),
};
