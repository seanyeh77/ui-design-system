import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/Select', component: UI.Select };

const S = React.useState;
const cities = ['台北', '新北', '桃園', '台中', '台南', '高雄', '基隆', '新竹', '嘉義', '苗栗', '彰化', '南投', '雲林', '屏東', '宜蘭', '花蓮', '台東'].map(
  (c) => {
    return { value: c, label: c };
  },
);
function D() {
  const a = S('week'),
    b = S('');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20, padding: 20, minHeight: 380, alignItems: 'start' }}>
      <UI.Select
        label="頻率（3 個選項）"
        value={a[0]}
        onChange={a[1]}
        options={[
          { value: 'day', label: '每天' },
          { value: 'week', label: '每週' },
          { value: 'month', label: '每月' },
        ]}
      />
      <UI.Select label="城市（17 個選項）" required={true} value={b[0]} onChange={b[1]} options={cities} />
    </div>
  );
}
export const Default = { render: () => <D /> };
