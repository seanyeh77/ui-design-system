import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/Calendar', component: UI.Calendar };

const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function D() {
  const [day, setDay] = React.useState(new Date(2026, 10, 14));
  return (
    <div style={{ padding: '20px 0' }}>
      <UI.Calendar focus={day} onPick={setDay} dayState={(d) => ({ selected: same(d, day) })} />
    </div>
  );
}
export const Default = { render: () => <D /> };
