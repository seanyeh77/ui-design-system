import type { ListDetailProps } from './ListDetail';

const now = new Date(2026, 10, 4, 15, 0);

export const sample: Omit<ListDetailProps, 'onSave'> = {
  owners: ['王小明', '李小華', '陳大同'],
  items: [
    {
      id: '1',
      name: '網站改版',
      owner: '王小明',
      status: 'doing',
      note: '首頁與定價頁先上線，其餘頁面下個月。',
      updated: new Date(now.getTime() - 2 * 3600 * 1000),
    },
    {
      id: '2',
      name: '叢集監控',
      owner: '李小華',
      status: 'fail',
      note: 'node-3 的代理程式版本太舊，需要更新後重新部署。',
      updated: new Date(now.getTime() - 26 * 3600 * 1000),
    },
    { id: '3', name: '課程平台', owner: '陳大同', status: 'review', note: '', updated: new Date(now.getTime() - 72 * 3600 * 1000) },
    { id: '4', name: '帳務整合', owner: '王小明', status: 'done', note: '已和會計系統對帳完成。', updated: new Date(now.getTime() - 216 * 3600 * 1000) },
  ],
};
