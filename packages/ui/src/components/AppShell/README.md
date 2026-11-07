# AppShell

Dashboard 類頁面的外框：側邊欄、頂部列和內容區。頁面都從這裡開始，不要自己排側邊欄。

- 電腦（960 px 以上）：側邊欄 240 px，左下角的按鈕可以收合成 72 px，選擇會記在瀏覽器。
- 平板（600 到 959 px）：側邊欄固定收合成 72 px 圖示；有第二層的項目點了直接進第一個子頁面，頁面內用 Tabs 切換其他子頁面。
- 手機（小於 600 px）：沒有側邊欄，最上層有圖示的項目變成底部分頁列，有子頁面的項目開啟第一個子頁面。分頁列到不了的頁面（沒有圖示、第 5 個以後、第二個以後的子頁面）放在最後一格「更多」，開啟完整的導覽。
- 頂部列：頁面標題（只出現一次，頁面裡不要再寫一次）或麵包屑，右邊放搜尋、NotificationBell、ProjectSwitcher。往下捲時隱藏，往上捲時出現。
- 內容區自己捲動，四周留 24 px（手機 16 px）。裡面用 `Page` 和 `Grid` 排版。

```tsx
<AppShell
  nav={[
    {
      items: [
        { id: 'home', label: '總覽', icon: 'house' },
        { id: 'projects', label: '專案', icon: 'folder' },
      ],
    },
  ]}
  value={page}
  onNavigate={setPage}
  brand="專案中心"
  title="總覽"
  onSearch={() => setSearchOpen(true)}
  actions={<NotificationBell items={notifications} />}
>
  <Page>…</Page>
</AppShell>
```
