# TopBar

## 用法

Dashboard 類頁面的頂部列，高 64 px（`header-height`）。AppShell 已經內建，用 AppShell 時不必自己放。

```tsx
<TopBar title="專案" onSearch={() => setSearchOpen(true)}>
  <NotificationBell items={notifications} />
</TopBar>
```

- 左側頁面標題（`title`，20 px、字重 700）；頁面裡不再寫一次同樣的標題。
- 麵包屑放在內容區、頁面內容的最上方，不放在頂部列。
- `onSearch` 通常接到 CommandPalette；右側其他元素放 `children`。

## 細節

- 右側：填色搜尋框（`surface-sub` 灰底、無外框，附 Ctrl K 提示，Mac 上寫 ⌘K；觸控裝置（`pointer: coarse`）沒有實體鍵盤，不顯示快捷鍵，窄螢幕的搜尋圖示名稱也只念「搜尋」），接著放頭像或其他元素（`children`）。
- 空間不夠時（手機），右側的專案切換器名稱先截斷，標題最多保留頂部列 45 % 的寬度才用「…」。
- 寬度小於 600 px 時，搜尋框換成搜尋圖示（觸控區 48 px）。兩者都呼叫 `onSearch`，也都有 `data-tour="search"`，Tour 可以直接用 `target: 'search'`。
- 頁首行為依版面規則：往下捲時隱藏，往上捲時出現。
- `onMenu`：左邊加一個「開啟導覽」選單按鈕（AppShell 在 600 到 1024 px 用來打開導覽抽屜）。
