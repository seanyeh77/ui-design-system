# MobileTabBar

手機寬度（小於 600 px）時的底部分頁列。

- 每個圖示下方一行 11 px 文字，選中的粗體、強調文字色；文字就是按鈕的名稱。360 px 寬時五個兩到四字的名稱都放得下。
- `labels={false}`：只有圖示，像相片類 app 那樣，名稱只在 `aria-label`。只在使用者已經認得每個圖示時用；AppShell 用 `tabLabels={false}` 傳下去。
- 按下已選中的分頁也會呼叫 `onChange`（例如「更多」每次都要打開）；只在頁面真的改變時才做事的話，先比對目前的值。
- 選中：圖示後方一塊 `accent-soft` 圓角矩形（`radius-md`），圖示變 `accent-text`。
- 切換動畫：水滴膠囊，和 Tabs 相同的拉伸方式（前端 120 ms、後端 440 ms）。
