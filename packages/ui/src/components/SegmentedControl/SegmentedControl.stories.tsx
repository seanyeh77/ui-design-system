import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Navigation/SegmentedControl', component: UI.SegmentedControl };

const ITEMS: UI.SegmentedItem<'preview' | 'source'>[] = [
  { id: 'preview', label: '預覽', icon: 'eye' },
  { id: 'source', label: '原始碼', icon: 'file-code' },
];

/** In a bar such as Workbench's mainBar: icons only, 28 px tall; the words show in a tooltip. */
export const IconsInABar = {
  render: function Render() {
    const [v, setV] = React.useState<'preview' | 'source'>('preview');
    return <UI.SegmentedControl label="顯示方式" iconOnly value={v} onChange={setV} items={ITEMS} />;
  },
};

/** With words, where there is room. */
export const Words = {
  render: function Render() {
    const [v, setV] = React.useState<'preview' | 'source'>('preview');
    return <UI.SegmentedControl label="顯示方式" value={v} onChange={setV} items={ITEMS} />;
  },
};
