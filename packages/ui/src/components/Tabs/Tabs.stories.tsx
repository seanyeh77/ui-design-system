import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Navigation/Tabs', component: UI.Tabs };

function Demo() {
  const [val, setVal] = React.useState('a');
  const data: Record<string, string[]> = {
    a: ['網站改版', '叢集監控', '課程平台'],
    b: ['部署 web-frontend', '更新文件', '修正登入'],
    c: ['[成員一]', '[成員二]', '[成員三]'],
  };
  return (
    <div className="ui-stack">
      <div>
        <UI.Tabs
          label="檢視"
          value={val}
          onChange={setVal}
          items={[
            { id: 'a', label: '總覽' },
            { id: 'b', label: '任務' },
            { id: 'c', label: '成員' },
          ]}
        />
      </div>
      <div key={val} className="ui-rise-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        {data[val].map((t) => {
          return (
            <div
              key={t}
              style={{
                height: 90,
                padding: 14,
                boxSizing: 'border-box',
                borderRadius: 14,
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-card)',
                fontWeight: 700,
              }}
            >
              {t}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export const Default = { render: () => <Demo /> };
