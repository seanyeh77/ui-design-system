import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/TreeList', component: UI.TreeList };

const now = Date.now(),
  H = 3600e3,
  D = 24 * H,
  MB = 1048576;
const items = [
  {
    id: 'rec',
    name: '上課錄影',
    children: [
      { id: 'r1', name: 'SDNFV_20260917_Lab1說明.mp4', date: now - 33 * D, size: 42.2 * MB },
      { id: 'r3', name: 'SDNFV_20261022_Lab3說明.mp4', date: now - 13 * D, size: 54.9 * MB },
      { id: 'r4', name: 'SDNFV_20261029_1.mp4', date: now - 13 * H, size: 137.6 * MB, unseen: true },
      { id: 'r5', name: 'SDNFV_20261029_2.mp4', date: now - 14 * H, size: 107.7 * MB, unseen: true },
    ],
  },
  {
    id: 'lec',
    name: '上課講義',
    children: [
      { id: 'l0', name: 'Lecture00 - Syllabus.pdf', date: now - 44 * D, size: 0.67 * MB },
      { id: 'l3', name: 'Lecture03 - Software-Defined Networking.pdf', date: now - 14 * D, size: 3.2 * MB },
      { id: 'l4', name: 'Lecture04 - Kernel Datapath Tuning.pdf', date: now - 4 * D, size: 1.8 * MB, unseen: true },
    ],
  },
  {
    id: 'lab',
    name: 'Lab',
    children: [
      { id: 'lab1', name: 'Lab 1', children: [{ id: 'lab1a', name: 'lab1-SDN-controller.pptx', date: now - 49 * D, size: 0.186 * MB }] },
      {
        id: 'lab2',
        name: 'Lab 2',
        children: [
          { id: 'lab2a', name: 'lab2-measure-intro.pdf', date: now - 17 * D, size: 0.496 * MB },
          { id: 'lab2b', name: 'lab2-template.zip', date: now - 17 * D, size: 2.4 * MB, unseen: true },
        ],
      },
    ],
  },
  { id: 'f1', name: '課程評分方式.docx', date: now - 44 * D, size: 0.052 * MB },
];
function Demo() {
  const [note, setNote] = React.useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <UI.TreeList
        title="課程教材"
        items={items}
        defaultOpen={['rec', 'lec']}
        selectable={true}
        onDownload={function (files) {
          setNote(
            '下載 ' +
              files.length +
              ' 個檔案：' +
              files
                .map((f) => {
                  return f.name;
                })
                .join('、'),
          );
        }}
      />
      <div style={{ fontSize: 13, color: 'var(--ink-muted)', minHeight: 20 }}>{note}</div>
    </div>
  );
}
export const Default = { render: () => <Demo /> };
