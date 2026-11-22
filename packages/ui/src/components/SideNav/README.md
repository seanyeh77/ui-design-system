# SideNav

## 用法

Dashboard 類頁面的左側導覽，可以收合。AppShell 已經內建（側邊欄、平板抽屜、手機分頁列都由它處理），通常不必單獨使用。

```tsx
<SideNav
  sections={[{ items: [{ id: 'home', label: '總覽', icon: 'house' }, { id: 'projects', label: '專案', icon: 'folder' }] }]}
  value={page}
  onChange={setPage}
  brand={{ name: '專案中心', href: '/' }}
/>
```

- 品牌傳 `{ mark, name, href }`；只有文字時用第一個字放在強調色方塊裡當 logo。
- 選中：左側 3 px 強調色指示條，用水滴方式移動到新項目。
- 有子項目的父項目：收合時點了直接進第一個子頁面，頁面內再切換其他子頁面（例如用 Tabs）。

## 細節

- 寬度：展開 240 px（`sidebar-width`），收合 72 px（`sidebar-collapsed`），底色 `surface-chrome`，右邊一條 `line`。
- 由上到下：品牌（logo 加名稱，見下方「品牌」）、選單項目、收合按鈕。品牌和收合按鈕固定大小；項目太多時，中間的選單自己捲動。
- 項目高度 40 px，滑過灰底（`surface-sub`），組與組之間用分隔線。
- 選中：左側 3 px 強調色指示條，用水滴方式移動到新項目；文字變粗、圖示變 `accent-text`。
- 子選單：點父項目展開，子項目縮排；收起時選中的子項目會標在父項目上。收合時，有子項目的父項目點了直接進第一個子頁面，頁面內再切換其他子頁面（例如用 Tabs）。
- 收合按鈕在左下角，只有圖示、沒有文字。收合後只剩圖示，滑過顯示名稱提示。
- 圖釘按鈕（`onPin`、`pinned`）：也在左下角、收合按鈕左邊，240 px 時兩個並排，72 px 時上下排。沒有釘選時是線條圖示「釘選側邊欄」，釘選時是實心強調色「取消釘選」（`aria-pressed`）。AppShell 用它切換自動展開與釘選；單獨使用 SideNav 時通常不需要。
- 圖釘和收合按鈕滑過或 focus 時，右側出現 Tooltip 寫出動作名稱；Focus 時有外光暈。
- `label` 是導覽的 `aria-label`，預設「主要導覽」。

## 品牌（brand）

側邊欄最上方的產品名稱。傳 `{ mark, name, href }`：

```tsx
<AppShell brand={{ mark: <img src="/logo.svg" alt="" width={24} height={24} />, name: 'codemap', href: '/' }} …>
```

- 收合（72 px，包括沒釘選時平常的圖示列和釘選後收合）：只顯示 `mark`，名稱藏起來。仍是回首頁的連結，Tab 可以停，`aria-label` 是完整的 `name`。
- 展開或釘選（240 px）：`mark` 加 `name`。名稱跟著側邊欄展開淡入（300 ms，和變寬同一條曲線，晚 80 ms 開始），收回時 100 ms 淡出。
- `mark` 的位置在每個狀態都一樣：中心對齊下面項目的圖示（離左邊 31 px），展開時不移動。`mark` 最大 24 × 24 px。
- 只傳文字（`brand="專案中心"`）或沒給 `mark`：用名稱的第一個字放在 24 px 的強調色方塊裡當 `mark`（「專」）。沒有 `href` 時不是連結，螢幕閱讀器念完整名稱。
- `onClick` 可以代替 `href`（例如 app 自己切換頁面）。
- 舊寫法（傳一個元素，例如 `brand={<a href="/">…</a>}`）仍然可以用，但元件分不出哪部分是 logo：收合時整塊藏起來，開發模式在 console 提醒改用 `{ mark, name, href }`。
- 平板抽屜和手機的「更多」導覽不受影響。
