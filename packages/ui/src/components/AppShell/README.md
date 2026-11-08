# AppShell

Dashboard 類頁面的外框：側邊欄、頂部列和內容區。頁面都從這裡開始，不要自己排側邊欄。

- 電腦（1025 px 以上）：側邊欄 240 px，左下角的按鈕可以收合成 72 px，選擇會記在瀏覽器。
- 平板和窄視窗（600 到 1024 px）：沒有側邊欄，內容用滿整個寬度；頂部列左邊有選單按鈕（「開啟導覽」），點了從左邊打開完整導覽的抽屜，選了頁面後關閉。
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

## 無障礙

- 第一個可以 Tab 到的是「跳到主要內容」連結，平常看不到，聚焦時出現在左上角；按了把焦點移到內容。
- 內容區是 `main` landmark。
- `focusMain()`：把焦點移到內容的第一個標題（`main` 裡的 `h1`／`h2`，沒有時用頂部列的標題），再沒有時移到 `main`。app 換頁後呼叫，例如從 CommandPalette 選了結果打開另一頁。標題沒有焦點框：最近一次是用鍵盤操作（Tab、Enter、方向鍵）時，標題左邊出現 3 px 強調色條；用滑鼠或觸控換頁時不顯示任何樣式，焦點仍在標題上，螢幕閱讀器照樣從新頁開始念。
- `announce(text)`：用頁面上唯一的 polite live region 告訴螢幕閱讀器發生了什麼，不移動焦點，例如 `announce('已儲存')`。元件自己會播報：TreeList 展開、DataTable 篩選或搜尋後的筆數、CommandPalette 的結果數、Tabs 和 SideNav 換頁。
