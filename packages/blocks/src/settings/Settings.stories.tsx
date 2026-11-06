import * as React from 'react';
import { Settings, type SettingsValues } from './Settings';

export default { title: 'Blocks/Settings', component: Settings };

function Demo() {
  const [values, setValues] = React.useState<SettingsValues>({ name: 'SeanYeh', email: 'sean@example.com', notifyEmail: true, notifyWeekly: false });
  return <Settings values={values} onChange={setValues} onDeleteAccount={() => {}} />;
}

export const Default = { render: () => <Demo /> };
