import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Actions/IconButton', component: UI.IconButton };

export const Default = {
  render: () => (
    <div className="ui-row">
      <UI.IconButton label="設定" icon={'sliders-horizontal'} />
      <UI.IconButton label="關閉" icon={'x'} />
      <UI.IconButton label="收合側邊欄" icon={'panel-left-close'} />
    </div>
  ),
};

function WithHint() {
  const [hint, setHint] = React.useState(true);
  const [log, setLog] = React.useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 120 }}>
      <UI.TopBar title="流程">
        <UI.IconButton
          label="導覽"
          icon="question"
          onClick={() => setLog('開始導覽')}
          hint={
            hint
              ? {
                  text: '導覽：五個步驟介紹各頁。',
                  onAction: () => {
                    setHint(false);
                    setLog('開始導覽');
                  },
                  onDismiss: () => setHint(false),
                }
              : undefined
          }
        />
      </UI.TopBar>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>{log}</p>
    </div>
  );
}
export const Hint = { render: () => <WithHint /> };
