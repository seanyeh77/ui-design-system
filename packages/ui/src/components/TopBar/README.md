# TopBar

Dashboard 類頁面的頂部列，高 64 px（`header-height`）。

- 左側放頁面標題（`title`，20 px、字重 700）。
- 麵包屑放在內容區、頁面內容的最上方，不放在頂部列。
- 右側：填色搜尋框（`surface-sub` 灰底、無外框，附 Ctrl K 提示，Mac 上寫 ⌘K），接著放頭像或其他元素（`children`）。
- 寬度小於 600 px 時，搜尋框換成搜尋圖示（觸控區 48 px）。兩者都呼叫 `onSearch`，通常接到 CommandPalette，也都有 `data-tour="search"`，Tour 可以直接用 `target: 'search'`。
- 頁首行為依版面規則：往下捲時隱藏，往上捲時出現。
- `onMenu`：左邊加一個「開啟導覽」選單按鈕（AppShell 在 600 到 1024 px 用來打開導覽抽屜）。
