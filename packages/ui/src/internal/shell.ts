import * as React from 'react';

/** Set by AppShell: whether its top bar shows the page title. A page heading inside (PageHeader, SettingsLayout)
 *  warns when it would show a second title. */
export const ShellTitle = React.createContext<{ inShell: boolean; title: boolean }>({ inShell: false, title: false });
