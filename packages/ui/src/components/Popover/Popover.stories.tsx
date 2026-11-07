import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Overlays/Popover', component: UI.Popover };

const S = [
  ['doing', '進行中'],
  ['review', '審核中'],
  ['done', '完成'],
  ['draft', '草稿'],
];
function D() {
  const [f, setF] = React.useState<Record<string, boolean>>({ doing: true });
  const n = S.filter((x) => {
    return f[x[0]];
  }).length;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 20, minHeight: 300 }}>
      <UI.Popover label="篩選" icon={'funnel'} count={n || undefined} title="篩選狀態">
        {(close) => {
          return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {S.map((x) => {
                return (
                  <UI.Checkbox
                    key={x[0]}
                    label={x[1]}
                    checked={!!f[x[0]]}
                    onChange={(v) => {
                      const o = { ...f };
                      o[x[0]] = v;
                      setF(o);
                    }}
                  />
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <UI.Button
                  variant="secondary"
                  onClick={() => {
                    setF({});
                  }}
                >
                  清除
                </UI.Button>
                <UI.Button variant="primary" onClick={close}>
                  套用
                </UI.Button>
              </div>
            </div>
          );
        }}
      </UI.Popover>
    </div>
  );
}
export const Default = { render: () => <D /> };
