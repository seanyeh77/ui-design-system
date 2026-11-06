import * as React from 'react';
import { ListDetail, type Item } from './ListDetail';
import { sample } from './sample';

export default { title: 'Blocks/ListDetail', component: ListDetail, parameters: { layout: 'fullscreen' } };

function Demo() {
  const [items, setItems] = React.useState<Item[]>(sample.items);
  return <ListDetail items={items} owners={sample.owners} onSave={(it) => setItems(items.map((x) => (x.id === it.id ? it : x)))} />;
}

export const Default = { render: () => <Demo /> };
