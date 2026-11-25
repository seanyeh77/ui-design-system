# AppShell

## 用法

Dashboard 類頁面的外框：側邊欄、頂部列和內容區，平板的導覽抽屜和手機的底部分頁列也由它處理。頁面都從這裡開始，不要自己排側邊欄。全螢幕監控畫面用 ConsoleLayout，程式碼工具用 Workbench。

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
  brand={{ name: '專案中心', href: '/' }}
  title="總覽"
  onSearch={() => setSearchOpen(true)}
  actions={<NotificationBell items={notifications} />}
>
  <Page>…</Page>
</AppShell>
```

- `title` 是頁面標題，只出現一次：頁面裡不要再寫一次。詳細頁的標題是那筆資料的名稱（「訂單 #1024」），寫在內容最上方的 `PageHeader`，AppShell 不給 `title`；設定頁給 AppShell `title="設定"`，SettingsLayout 不給 `title`。兩個都給時開發模式會提醒。
- 麵包屑放在內容區最上方（`<Breadcrumb>`，PageHeader 之前），不放頂部列；`breadcrumb` prop 已停用。
- `tags`：頂部列標題旁的標記，例如整頁都是示範值時的 `<Tag icon="info">示範資料</Tag>`。
- 內容區裡用 `Page` 和 `Grid` 排版，每個區塊一張 Card。
- 頂部列右邊放 `onSearch`（接 CommandPalette）和 `actions`（NotificationBell、ProjectSwitcher）。
- 換頁後呼叫 `focusMain()`；變化用 `announce(text)` 念出（見下方「無障礙」）。

## 細節

- 電腦（1025 px 以上）：側邊欄預設不釘選，平常是 72 px 的圖示列，點圖示就能換頁。
  - 滑鼠停在圖示列上 100 ms，展開成 240 px，疊在內容上、帶陰影，內容不移動；滑鼠離開 300 ms 後收回。用 Tab 移進側邊欄時也會展開，焦點離開或按 Esc 時收回；選了頁面後收回。
  - 左下角的圖釘按鈕「釘選側邊欄」：釘選後側邊欄固定在內容旁邊（240 px），旁邊多一個收合按鈕，可以收合成 72 px，和以前一樣。圖釘變成實心強調色，按了「取消釘選」回到自動展開。
  - 釘選和收合都記在瀏覽器。以前存過收合或展開的人，升級後當作已釘選，畫面不變。
  - `defaultPinned`：沒有存過選擇時是否一開始就釘選，預設 false。
- 平板和窄視窗（600 到 1024 px）：沒有側邊欄，內容用滿整個寬度；頂部列左邊有選單按鈕（「開啟導覽」），點了從左邊打開完整導覽的抽屜，選了頁面後關閉。
- 手機（小於 600 px）：沒有側邊欄，最上層有圖示的項目變成底部分頁列，有子頁面的項目開啟第一個子頁面。分頁列到不了的頁面（沒有圖示、第 5 個以後、第二個以後的子頁面）放在最後一格「更多」，開啟完整的導覽。
- 頂部列：頁面標題（只出現一次，頁面裡不要再寫一次）和 `tags`，右邊放搜尋、NotificationBell、ProjectSwitcher、帳號選單（`<Menu icon="user" label="帳號" items={…} />`）。往下捲時隱藏，往上捲時出現。
- 內容區自己捲動，四周留 24 px（手機 16 px）。裡面用 `Page` 和 `Grid` 排版。

## 品牌（brand）

側邊欄最上方的產品名稱。傳 `{ mark, name, href }`：

```tsx
<AppShell brand={{ mark: <img src="/logo.svg" alt="" width={24} height={24} />, name: 'app', href: '/' }} …>
```

- 收合（72 px，包括沒釘選時平常的圖示列和釘選後收合）：只顯示 `mark`，名稱藏起來。仍是回首頁的連結，Tab 可以停，`aria-label` 是完整的 `name`。
- 展開或釘選（240 px）：`mark` 加 `name`。名稱跟著側邊欄展開淡入（300 ms，和變寬同一條曲線，晚 80 ms 開始），收回時 100 ms 淡出。
- `mark` 的位置在每個狀態都一樣：中心對齊下面項目的圖示（離左邊 31 px），展開時不移動。`mark` 最大 24 × 24 px。
- 只傳文字（`brand="專案中心"`）或沒給 `mark`：用名稱的第一個字放在 24 px 的強調色方塊裡當 `mark`（「專」）。沒有 `href` 時不是連結，螢幕閱讀器念完整名稱。
- `onClick` 可以代替 `href`（例如 app 自己切換頁面）。
- 舊寫法（傳一個元素，例如 `brand={<a href="/">…</a>}`）仍然可以用，但元件分不出哪部分是 logo：收合時整塊藏起來，開發模式在 console 提醒改用 `{ mark, name, href }`。
- 平板抽屜和手機的「更多」導覽不受影響。

## 無障礙

- 第一個可以 Tab 到的是「跳到主要內容」連結，平常看不到，聚焦時出現在左上角；按了把焦點移到內容。
- 內容區是 `main` landmark（`id="main"`，「跳到主要內容」連到這裡）。
- `focusMain()`：把焦點移到內容的第一個標題（`main` 裡的 `h1`／`h2`，沒有時用頂部列的標題），再沒有時移到 `main`。app 換頁後呼叫，例如從 CommandPalette 選了結果打開另一頁。標題沒有焦點框：最近一次是用鍵盤操作（Tab、Enter、方向鍵）時，標題左邊出現 3 px 強調色條；用滑鼠或觸控換頁時不顯示任何樣式，焦點仍在標題上，螢幕閱讀器照樣從新頁開始念。
- `announce(text)`：用頁面上唯一的 polite live region 告訴螢幕閱讀器發生了什麼，不移動焦點，例如 `announce('已儲存')`。元件自己會播報：TreeList 展開、DataTable 篩選或搜尋後的筆數、CommandPalette 的結果數、Tabs 和 SideNav 換頁。
