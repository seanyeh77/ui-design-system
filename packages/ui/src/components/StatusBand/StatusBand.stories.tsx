import * as UI from '../../index';

export default { title: 'Data/StatusBand', component: UI.StatusBand };

const CLASSES = [
  { value: 'ai', label: 'AI 最佳化' },
  { value: 'mix', label: '混合' },
  { value: 'pid', label: 'PID' },
  { value: 'manual', label: '人工' },
];

/** Which strategy was in use, every 10 minutes. */
export const Strategy = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <UI.StatusBand
        label="採用的策略"
        count={24}
        classes={CLASSES}
        segments={[
          { from: 0, to: 6, value: 'ai' },
          { from: 6, to: 10, value: 'mix' },
          { from: 10, to: 14, value: 'pid' },
          { from: 14, to: 16, value: 'manual' },
          { from: 16, to: 24, value: 'ai' },
        ]}
      />
    </div>
  ),
};
