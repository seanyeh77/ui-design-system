import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/FileUpload', component: UI.FileUpload };

function D() {
  const s = React.useState<UI.UploadFile[]>([]);
  function add(list: { name: string; size: number }[]) {
    const fs = list.map((f, i): UI.UploadFile & { id: number; progress: number } => {
      return {
        id: Date.now() + i,
        name: f.name,
        size: (f.size / 1048576).toFixed(1) + ' MB',
        progress: 0,
        status: f.size > 104857600 ? 'error' : 'uploading',
        error: f.size > 104857600 ? '超過 100 MB 上限，請壓縮後再試。' : undefined,
      };
    });
    s[1]((o) => {
      return o.concat(fs);
    });
    fs.forEach((f) => {
      if (f.status === 'error') return;
      const t = setInterval(() => {
        s[1]((o) => {
          return o.map((x) => {
            if (x.id !== f.id) return x;
            const p = Math.min(100, (x.progress ?? 0) + 7);
            if (p >= 100) clearInterval(t);
            return { ...x, progress: p, status: p >= 100 ? 'done' : 'uploading' };
          });
        });
      }, 120);
    });
  }
  const demo = function () {
    add([
      { name: 'report-2026-q3.pdf', size: 2516582 },
      { name: 'cluster-photo.jpg', size: 5347737 },
      { name: 'big-dataset.zip', size: 220200960 },
    ]);
  };
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <UI.FileUpload
        label="附件"
        limitText="每個最大 100 MB"
        files={s[0]}
        onAdd={add}
        onRemove={function (f) {
          s[1](
            s[0].filter((x) => {
              return x.id !== f.id;
            }),
          );
        }}
        onRetry={function (f) {
          s[1](
            s[0].filter((x) => {
              return x.id !== f.id;
            }),
          );
        }}
      />
      <div>
        <UI.Button variant="secondary" onClick={demo}>
          放入示範檔
        </UI.Button>
      </div>
    </div>
  );
}
export const Default = { render: () => <D /> };
