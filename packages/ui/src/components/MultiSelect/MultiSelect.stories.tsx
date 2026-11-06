import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/MultiSelect', component: UI.MultiSelect };

const M = ['王小明', '李小華', '陳大同', '林美玲', '張志豪', '黃雅婷', '吳建宏', '周佳穎'].map((n) => {
  return { value: n, label: n };
});
function D() {
  const a = React.useState(['王小明', '李小華', '陳大同', '林美玲']),
    b = React.useState(['urgent']);
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420, minHeight: 380 }}>
      <UI.MultiSelect label="負責成員（只能從清單選）" options={M} value={a[0]} onChange={a[1]} emptyText="找不到符合的成員" />
      <UI.MultiSelect
        label="標籤（可以新增）"
        creatable={true}
        options={[
          { value: 'urgent', label: 'urgent' },
          { value: 'backend', label: 'backend' },
          { value: 'frontend', label: 'frontend' },
        ]}
        value={b[0]}
        onChange={b[1]}
      />
    </div>
  );
}
export const Default = { render: () => <D /> };
