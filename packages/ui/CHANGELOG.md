# @seanyeh77/ui

## 0.44.0

### Minor Changes

- 1e25908: 清單頁的外觀整理：DataTable 新增 `action`，頁面的主要操作（「新增」）放在摘要那一列的右端（沒有摘要時在工具列右端），不再單獨占一列；Card 只有按鈕沒有標題、包著表格時開發模式會提醒改用 `action`。`rowActions` 不再占一欄：滑過或鍵盤移到列上時疊在列的右端，底色跟著列（新的 CSS 變數 `--dt-row-bg`），觸控螢幕一直顯示並在列尾留 `actionsWidth` 的空位，列裡的 IconButton 一律是安靜樣式。展開箭頭欄只在這一頁有 `long` 格子被截掉（或有 `fullText`）時出現；勾選欄改成 40 px、沒有邊框，表頭的全選框一直顯示。摘要分段上的筆數只寫數字（單位仍給螢幕閱讀器，Tabs 新增 `hideUnit`），Tabs 的筆數改用一般字體的等寬數字、次要文字色。空的格子寫灰色的「—」。`format.dateTime` 在「）」後面不再加空格（`2026/11/04（三）13:00`）。放在 `padding={false}` Card 裡、沒有頁碼的表格，最後一列直接到卡片底邊。手機上搜尋框、篩選、筆數和排序同一列，Card 裡的卡片清單不再有第二層陰影。
- e4cc89a: DataTable 的工具列變成一個完整的結構：摘要分段、搜尋框、「篩選」「排序」「⋯」和 `action`（「新增」）放得下時同一列（摘要靠左，可伸縮的搜尋框和按鈕靠右，全部 40 px），放不下時摘要自己一列；有摘要且沒有搜尋或篩選時不再重複顯示「4 / 4 筆」。欄寬重新分配：只貼合內容的文字欄最窄 128 px，主要欄和 `long` 欄各一份剩下的寬度，放得下時先各拿到一行的寬度（`long` 最多 512 px），不再讓長文字吃掉整張表。列操作不再蓋住最後一欄：最後一格右邊留好按鈕的寬度（量出來的，`actionsWidth` 可指定），日期和數字永遠完整。`ui check` 量工具列高度時把分段控制當成一個控制項。

### Patch Changes

- d988360: 修正 codemap 升級後回報的三個問題：
  
  - Workbench：手機上下方面板的拖曳把手在觸控螢幕上有 48 px 高的觸控範圍（看得到的部分仍是 20 px，往上延伸一塊透明範圍，不蓋住下面的分頁列），`ui check` 不再回報 `Panel height 390 x 20 px`。
  - ProjectSwitcher：「專案 · 狀態」的「·」前面少了空格（顯示成「audio-demo· 即時」），現在兩邊各一個空格。
  - 收字串的說明 prop 把反引號裡的文字顯示成行內程式碼（InlineCode），不顯示反引號；只有一個反引號時照原樣顯示。適用：EmptyState 的 `description`、`steps`，SettingsSection 的 `description`，TextField、TextArea、DatePicker 的 `hint`、`error`，Select、MultiSelect、LoginCard、FileUpload 檔案的 `error`，Alert、Toast、Dialog 字串內容，Drawer 的 `confirmText`，DangerZone、ErrorPage 的 `description`，EventTimeline 事件的 `text`，KpiCard 的 `target`、`verdict.text`，NotificationBell 通知的 `body`（Term 的 `text` 原本就支援）。CodeText 和 LayerGraph 標籤改用同一個解析函式；CodeText 開頭單獨一個反引號時不再被當成程式碼。
- 8bf7f6e: Markdown：清單項目只有一個連結時（例如參考資料清單），連結撐滿整列，整列都能點，滑過有 `surface-sub` 底色；觸控螢幕上至少 48 px，滑鼠操作時 32 px。`ui check`：Markdown 內容裡的標題（`.ui-md-h`）可以換行，介面標題仍不能換行；程式碼區塊、表格框這類只為了用鍵盤捲動才能聚焦的內容不算觸控目標。

## 0.43.1

### Patch Changes

- 1e39a0b: 在 jsdom 測試裡不必再自己補 API：DataTable 量欄寬時用到 jsdom 沒有的 `Range#getBoundingClientRect` 與 `ResizeObserver` 而當掉的問題已修正，Tabs、SegmentedControl、SplitPane、Markdown 表格、LayerGraph、Tour、Workbench 與表格的捲動漸層在沒有 `ResizeObserver` 時也不再當掉。LayerGraph 在沒有 canvas 時改用估計的文字寬度（不再印出 jsdom 的「Not implemented」錯誤），Section 與 LayerGraph 在沒有 `scrollIntoView` 時略過捲動，拖曳把手在沒有 pointer capture 時照常運作。量不到版面時元件維持預設欄寬與大小，瀏覽器裡的行為不變。每個 story 現在都在 jsdom 與 `renderToString` 下測試渲染與常用操作。

## 0.43.0

### Minor Changes

- f3673a3: 圖示改為按需載入：每個圖示是一個獨立模組，有 build 的專案只打包頁面用到的圖示（只用 Button 時 JS 從 357 KB 降到 303 KB），`<Icon name>`、`icon` 屬性、`IconName`、`icons` 與 `bundle.js` 的用法都不變。元件固定顯示的圖示隨元件打包、立即顯示；其他名稱第一次顯示時載入，載入前是同樣大小的空白方框。新增選用的 `preloadIcons()`，讓首屏圖示在第一次畫面就出現；`name` 不是內建名稱時有開發警告。

## 0.42.0

### Minor Changes

- ade4d1d: 樣式改放在 cascade layer `ui` 裡（`tokens.css` 在 `ui.tokens`，`styles.css` 在 `ui.components`）：頁面不加 layer 的 CSS 一定蓋過元件與 token，不必比 specificity 或加 `!important`。兩個檔案開頭宣告 `@layer theme, base, ui, components, utilities;`，配合 Tailwind v4 時 utility class 可蓋過元件、preflight 不會蓋掉元件（在主要 CSS 檔最前面寫同一行即可不受載入順序影響）。原本靠 layer 放自己規則的頁面：排在 `ui` 之前的 layer 現在會輸給元件。元件 CSS 的 `!important` 宣告比頁面沒有 layer 的 `!important` 優先。
  
  ES module 改為一個原始模組一個檔案，bundler 只留下頁面 import 的元件；`'use client'` 在每個元件模組開頭，`@seanyeh77/ui/format` 仍不含 `'use client'`。新增 `@seanyeh77/ui/css/<Name>.css` 分檔：先載入 `css/base.css`、再載入用到的元件、最後 `css/end.css`，只用 Button 時 CSS 從約 148 KB（gzip 25 KB）降到約 14 KB（gzip 3.6 KB）。`styles.css` 仍是預設載法，畫面不變（75 個預覽頁在 390 px、1280 px 亮暗共 300 張截圖與改動前相符）。

### Patch Changes

- fb81a5d: 分檔 CSS 修正：每個 `css/<Name>.css` 都帶齊它需要的其他元件的檔（DatePicker 帶 Calendar、IconButton 帶 Tooltip、Button 帶 Dialog 等），需要的檔排在後面時 build 直接失敗；`LineChart`、`TextField` 等沒有自己樣式的元件也有 `css/<Name>.css`。`styles.css` 的規則順序跟著調整，畫面不變。`backdrop-filter` 與 `user-select` 的 `-webkit-` 寫法移到標準屬性之前，bundler 壓縮後不再丟掉背景模糊。`ui check` 新增一項：列出頁面沒放進 cascade layer、用元素或 `*` 選擇器、又蓋過元件宣告的 CSS（重設 CSS、範本附的 `index.css`）。每個套件加上 README。
- ac4911e: Tabs：放得下的分頁列不再偶爾在右側出現捲動漸層（漸層改依最後一個分頁的位置判斷，不受移動中的選取框影響）。

## 0.41.0

### Minor Changes

- be1018c: DataTable：合計列一起量欄寬，「平均 63 %」不再被切掉；`width` 對每一種欄位都只是最小寬度，不再讓欄位變短（欄位短不短只看數字、單位、格式與狀態）；量欄寬改成每個畫面最多一次，只在列或欄位改變時進行。「/」只交給看得到的表格，焦點在清單、格線、選單、對話框時不接，搜尋框拿到焦點後才攔下按鍵。`rowHref` 的列：中鍵與 Ctrl、⌘、Shift＋點擊在新分頁開啟，選取文字時不開啟；新增 `onRowOpen(row, event)` 給 SPA 推路由。Shift＋點勾選框的起點在搜尋、篩選、排序或每頁筆數改變後重新開始。單位、相對時間、「合計」「平均」改用一般字體，只有數字用 Geist Mono（Markdown 表格的數字欄也一樣）。`padding={false}` 的 Card 裡，摘要分段控制和卡片邊緣隔 16 px；手機上捲動時停在完整的項目上。Card：沒有 `title` 時 `actions` 一樣靠右，不再有空的占位元素。TextField：錯誤訊息只在有錯誤時插入，新的錯誤念一次。
- bc1608a: DataTable 只給欄位就有合適的預設：
  
  - 欄寬：第一個文字欄和 `long` 欄占剩下的寬度，數字、單位、日期、長度、狀態、其他短文字和有 `width` 的欄貼合內容（量標題和格子）。`grow` 仍然優先。
  - 工具列：搜尋框（320 px，最窄 240 px，放大鏡 20 px）、「篩選」、「排序」和新的「⋯」（更多表格操作）都是 40 px 高；「欄位」（加「還原預設」）、「複製成 Markdown」、「放大表格」移進「⋯」，複製後在按鈕下方顯示「已複製」。
  - 按「/」移到第一個表格的搜尋框（`searchShortcut`，預設開），空白時框內顯示「/」。
  - 有篩選條件時「篩選」按鈕變強調色，工具列下方列出可移除的條件標籤和「清除全部」。
  - 新欄位設定：`secondary`（格子下的第二行）、`format: 'duration'`（46:42、1:54:49）；新的 `rowHref`（第一欄變連結、點整列開啟）。
  - 日期欄是 `<time>`，依時間排序；相對時間滑過時顯示完整日期。
  - 列的狀態：滑過是中性淡底，勾選是 `accent-soft` 加左緣 3 px 線，鍵盤所在列是左緣 2 px 線；表頭下緣改用 `line-strong`；深色主題的斑馬紋較淡。
  - `stickyFirst` 時勾選欄和展開箭頭欄也固定；`widthKey` 也記住顯示的欄位；Shift＋點勾選框選取一段。
  - 開發時警告：`summary` 和篩選或檢視篩同一欄、有單位的欄位收到含單位的字串。
  - 排序箭頭用 `ink-muted`；檢視分頁、取消選取、「顯示全部」加上焦點外光暈；移除手機卡片裡 Badge 的覆寫樣式（Badge 自己處理）。
  - 新增 `format.duration(seconds)`。
- 20b6f04: 焦點、填色與狀態記號一律達到 WCAG 對比：文字 4.5:1，非文字 3:1，淺色、深色、教材主題與 8 個推薦色票都成立。
  
  - 焦點：所有控制項改用同一種焦點樣式，2 px 實線外框、離控制項 2 px（貼齊會裁切的容器時畫在內側 2 px），顏色是新的 `focus` token（等於 `accent-text`，在每種底色上至少 4.5:1）。原本 3 px 的 `focus-ring` 光暈只有約 1.6:1（淺色）與 2:1（深色），已全部換掉；`styles.css` 也對其他 `:focus-visible` 元素預設同一種外框。`focus-ring` 保留為舊名稱，數值和 `focus` 相同；`danger-ring` 不再使用，數值改為 `danger-text`。
  - 強調色填色：`setAccent()` 換算出的 `accent` 在 `bg`、`surface`、`surface-sub`、`surface-chrome`、`accent-soft` 上至少 3:1，`on-accent` 在它上面至少 4.5:1；不夠時淺色混黑色（每步 4%）、深色混白色（每步 5%）。深色主題預設 `accent` 由 `#2457d6`（在 `surface-sub` 上 1.69:1）改為 `#6689e2`（3.09:1），`accent-hover`／`accent-press` 改為往亮的方向 `#7897e5`／`#88a3e8`，`on-accent` 改為 `#171512`。淺色的 8 個推薦色不變。
  - 語意實色：淺色 `success` `#1ca655` → `#1b9f52`、`warning` `#d68710` → `#bc770e`，深色 `danger` `#cd2823` → `#dc6965`，在各底色與表格列上至少 3:1；新增 `on-danger`（淺色白、深色 `#171512`）給危險按鈕與數字徽章的文字。必填星號改用 `danger-text`。
  - 狀態記號：Badge 的進度圓圈、TreeList 與 Workbench 的圓點、ProjectSwitcher 的狀態點、Meter 的標記與圓點、LineChart 的門檻線改用 `success-text`、`warning-text`、`danger-text`、`accent-text`，草稿用 `ink-muted`。
  - Tabs 與 SegmentedControl 選中的白塊加 1 px `line-strong` 框，選中處對灰底達到 3:1。
- dbee37f: 放在 `Card` 或 `DataTable` 裡的 Badge 不論寬度都自動變成圓點加文字、沒有陰影，圓點樣式只有失敗、審核中、進行中用狀態色，完成與草稿用 `ink-muted`；Button 新增 `variant="quiet"`（無外框、`ink-muted` 文字、滑過 `surface-sub` 底色）；新增 `radius-xs` 4 px 給行內程式碼、Term、按鍵與 SegmentedControl，Tabs 指示塊與分頁改用 `radius-sm`，所有膠囊圓角改用 `radius-full`；深色 `shadow-chip` 變淡、`surface-chrome` 調亮為 `#3d3834`、`accent-soft` 改為 `surface` 混入 22% 強調色（`#343c55`，`setAccent` 同步），`line-strong` 深色調亮為 `#988c80`，兩個主題在 `surface` 與 `surface-sub` 上都達 3:1；8 個推薦強調色在淺色主題本身就達 4.5:1，未達標的 6 個改深（紫 `#864ad1`、桃紅 `#ba3873`、紅 `#c53228`、橘 `#ab5101`、綠 `#077b42`、青 `#027874`），教材主題的強調色隨之改為 `#027874`；SearchField 清除鈕、`ui-link-btn`、SideNav 的圖釘與收合按鈕有 Focus 外光暈，圖釘與收合按鈕改用右側 Tooltip；Tooltip 新增 `side="right"`；TextField 的錯誤訊息改為 `role="alert"`，LoginCard 的帳號錯誤因此和密碼錯誤一樣會被念出，「忘記密碼？」改為「忘記密碼」；Grid 的說明改為實際的欄數變化。
- f7ac5f6: 新增字級（`--text-*`，12 px 到 49 px，Tailwind 的 `text-*` 帶行高）、動畫時間（`--dur-*`）、動畫曲線（`--ease-*`）和層級（`--z-*`）token，`styles.css` 的字級、動畫時間、曲線和 z-index 全部改用這些 token，數值不變；最小字級是 12 px，原本 9 px 和 11 px 的手機分頁列文字、通知數字、排序順序、副檔名標籤和層級數字改成 12 px。文字對比在 `surface-sub`、`surface-chrome` 和 `accent-soft` 上也達 4.5:1：深色 `accent-text`、`danger-text`、`info-text` 稍微調亮，淺色 `warning-text` 稍微調暗，`setAccent` 換算自訂強調色的文字色時也檢查這些底色。`pnpm test` 會檢查 `styles.css` 沒有寫死已有 token 的字級、時間和層級。

### Patch Changes

- 75bbec2: `ui check` 新增兩項檢查：同一列工具列裡的控制項高度相差超過 1 px（例如「篩選」40 px、「欄位」32 px），以及表格列或卡片裡帶陰影的狀態標籤（`.ui-badge`）；兩項都寫出原因與修正方式。`docs/guidelines.md` 新增清單頁的做法（清單放在一張 Card，主要操作「新增」放在 Card 的 `actions`，筆數由表格工具列顯示）、按鈕層級（primary、secondary、quiet、danger）、表格與卡片裡的狀態圓點，以及時間長度格式（`46:42`、`1:54:49`）。`docs/data.md` 新增表格頁的規則：摘要已有筆數時不再用 KPI 卡片重複、要處理的狀態緊接在「全部」後面、摘要的欄位不再放進篩選、數字欄用 `numeric` 加 `unit`、失敗的列寫出原因並提供「重試」、執行中的進度寫在次要文字、列操作超過 2 個收進「⋯」、用 `rowHref` 打開一筆資料。`docs/motion.md` 的主題切換時間改為實際使用的 300 ms。
- b42450a: 文件改成依需要讀取：`docs/guidelines.md` 只留每一頁都需要的核心規則，其他規則分到主題檔（`layout`、`forms`、`data`、`monitoring`、`code`、`theme`、`motion`）和各元件的 README，套件的 `docs/` 一併附上這些主題檔。每個元件的 README 開頭新增「用法」：一句話說明、最短的範例與最常用錯的規則。`ui docs <Name>` 預設只印「用法」，加 `--full` 印整份 README；`ui docs` 也能印主題檔，`ui list` 列出主題檔與元件的一句話說明。
- 0daa633: EmptyState 目前的步驟加上 `aria-current="step"`，不只靠顏色標示。
- 0daa633: `format.fileSize` 四捨五入後滿 1,024 KB 或 1,024.0 MB 時改寫成 1.0 MB 或 1.0 GB，`format.compact` 四捨五入成 10,000 萬時改寫成 1 億，英文介面的台幣金額寫成 `NT$486,000` 而不是 `$486,000`。
- 6217554: KpiCard 縮寫數字裡的「萬」「億」改用一般字型，Geist Mono 只用在數字上。
- 0daa633: ThemePicker 與 AccentPicker 的色票改成只有一個 Tab 停留點，方向鍵移到下一個選項並套用，與 RadioGroup、SegmentedControl 一致。
- 4a10b3c: 對比、焦點、字型與錯誤欄位的修正：
  
  - 淺色 `warning-text` 由 `#955e0b` 調成 `#945d0b`：在紅色色票（`#c53228`）算出的 `accent-soft` 上由 4.49:1 提高到 4.55:1。對比測試改為檢查所有文字 token 在每個推薦色票算出的 `accent-soft` 上達 4.5:1。
  - DataTable 格子裡的可聚焦元素改畫內側焦點外框；截斷的長文字裡的連結取得焦點時整段展開。CommandPalette 搜尋列有焦點時畫內側外框。SettingsLayout 分類與 LayerGraph 方框的焦點外框不再被捲動區切掉。
  - 中文不再用 Geist Mono：KpiCard 單位、TreeList 日期與 meta、ProgressBar 的「完成 ✓」改用一般字體（數字等寬）。LayerGraph 節點新增 `code`，名稱是路徑或模組時才用 Geist Mono，預設一般字體。
  - 表格列裡完成的 ProgressBar 改用 `success-text`，選中的列上也有 3:1。
  - 所有欄位的錯誤樣式一致：紅框、框內警告圖示、下方錯誤訊息。TextArea、Select、MultiSelect、DatePicker 新增 `error`；LoginCard 密碼欄補上圖示。
  - DataTable 的合計列在手機上不再隱藏，改成卡片下方的摘要。
  - `ui check` 在用 bundle.js 的頁面呼叫 `UI.setTheme()` 切換淺色與深色，深色檢查真的是深色。
  - 文件與範例裡的專案名稱換成通用的例子。
- 0daa633: SearchField 按「清除搜尋」後焦點留在搜尋框，不會因清除鈕消失而跑回頁面開頭。
- 0daa633: TextArea 的 `hint` 以 `aria-describedby` 連到輸入框，螢幕閱讀器會念出說明。

## 0.40.0

### Minor Changes

- 1674a47: ZoneMap 新增 `fill`：列高平分地圖拿到的高度（最少 `rowHeight`），在 ConsoleLayout 的主視覺卡片裡撐滿、不留空白。

## 0.39.0

### Minor Changes

- 93bb051: 新增 ConsoleLayout：全螢幕監控畫面的版面（頂列、主視覺、側欄、底列，整頁不捲動，大螢幕等比放大 1 到 1.5 倍，手機排成一欄）。LineChart 依實際寬度畫，字不再跟著圖變大，新增 `height`，x 軸標籤太擠時自動隔開，`marker` 標籤不超出右緣；Tag `variant="demo"` 改用旁邊文字的顏色；新增 corners-in 圖示。

## 0.38.0

### Minor Changes

- 19a8794: 新增 `ZoneMap`（分區平面圖：依數值填熱度色階，名稱和狀態同一行、31 px 主數值、一行次要資訊；選取外框和告警內框不同樣式，可以用鍵盤選取）、`EventTimeline`（事件由新到舊，時間、類型圖示、說明，附空狀態文字）、`TimeControl`（28 px 時鐘、兩行說明、「回放」／「停止回放」與「回到現在」）。`KpiCard` 新增 `size="compact"`（22 px 數字）、`verdict` 與 `target`：判定只在需要注意時取代目標那一行。`Tag variant="forecast"` 與 `variant="demo"` 改成圖示加文字、沒有底色，字級跟著旁邊的文字。新增圖示 arrows-left-right、sparkle、trend-up。

## 0.37.0

### Minor Changes

- 700b9fe: LineChart 新增監控畫面用的功能：y 軸下限 `min`；每組資料的 `dashed`、`color` 與 `null` 值；兩組之間的差額帶 `band`（依正負填色，或省下的量填 success）；「現在」線與未來區的預測斜線 `now`；注意與上限的虛線 `thresholds`；單點預測 `marker`；可拖曳、可用鍵盤移動的播放頭 `playhead`；圖上方的大字 `headline`；底部的狀態色帶 `status`；沒有資料時的文字。新增 `StatusBand`（沿時間軸的類別色帶，附圖例）與 `Meter`（8 px 閾值條，分段淡底、圓點標目前值，狀態和數值右側對齊）。

## 0.36.0

### Minor Changes

- f00ddb8: 新增資料用的顏色：熱度色階 `heat-1`…`heat-7`（冷藍 → 中性灰 → 橘紅）、差值發散色階 `diverge-neg-strong`…`diverge-pos-strong`（負藍、0 灰、正橘）、第 4 個類別色 `chart-4`（暖灰）與預測紋理的顏色 `forecast-stripe`，淺色深色都有。UI 新增 `textOn(fill)`（在深色與白色中選對比較高的字色）、`heatToken()`、`divergeToken()`，class `ui-forecast` 在填色上疊斜線紋理，`Tag` 新增 `variant="forecast"`（「預測」）與 `variant="demo"`（「示範資料」）。LineChart 最多四組資料。新增文件頁 DataColors，guidelines 補上監控畫面的最小字級、大螢幕縮放與危險動作規則。

## 0.35.0

### Minor Changes

- 67fd71a: CodeView 的 `peek` 也接受一段範圍 `{ from, to }`：範圍內每一行都用 peek 的外觀標示。整段放得進畫面時，以最小的捲動量讓整段都看得見，已經看得見時不捲動；整段比畫面高時，把第一行捲到頂端。捲的是程式碼本身，或包住它、可以捲動的最近一層。和單行一樣不移動焦點、不影響選取。

## 0.34.0

### Minor Changes

- 0b421ff: 新增 `SegmentedControl`：同一份內容的兩三種顯示方式之間切換（例如「預覽／原始碼」），高 28 px，`iconOnly` 只顯示圖示、文字放在提示裡，可以放進 Workbench 的 `mainBar`；Workbench README 寫明 `mainBar` 能放的東西與高度。IconButton 的第一次使用提示泡泡改放在按鈕左邊、同一列，不再蓋住下方的列（左邊放不下時才放在下方）。`AiMark` 改成句尾的灰色小字「AI 撰寫」，新增 `text` 顯示其他來源標示（例如「推測」）；Markdown 的 `[AI](ai:)` 不論寫在開頭或結尾，都畫在那一段的最後，`[推測](ai:)` 顯示「推測」。

## 0.33.0

### Minor Changes

- 78e2f8d: CodeView 新增 `onLine(line, how)`：讀者點一行或用鍵盤移到一行時呼叫，拖曳選取文字不算。新增 `peek` 屬性，從外部暫時標示一行，和 `target` 分開，需要時捲到看得見的位置，不移動焦點也不影響選取。`target` 改變或呼叫 `focusTarget()` 時，若讀者在程式碼裡選取了文字，保留選取，不搶焦點、不捲動。複製多行時只複製程式碼，不含行號與螢幕閱讀器文字。TreeList 再點一次已選取的列時不再展開或收合，也不重跑展開動畫。

## 0.32.0

### Minor Changes

- 28072b2: Term 新增 `variant="inline"`：句子裡的名詞畫灰色虛線，滑鼠停 500 ms 或鍵盤焦點時顯示說明卡，手機點一下從下方打開，螢幕閱讀器念「cookie，有說明」。CodeView 新增 `terms` 與 `termsMark`：只在註解和字串裡以整個字比對，預設每個檔案標第一次，名稱連結優先，← → 也會停在名詞上，Enter 打開說明。Markdown 新增 `terms` 與 `termsMark`（預設每個段落、清單項目或表格格子標第一次），也可以用 `[cookie](term:cookie)` 指定某一處。匯出 `TermDef`、`TermsMark` 型別。

## 0.31.0

### Minor Changes

- 3643238: `Workbench` 的麵包屑移到主畫面上方一條 36 px 的列，右邊用新的 `mainBar` 放頁面按鈕；檔案總管新增 `explorerFilter`，是同高的篩選列，三條橫線對齊。手機上麵包屑顯示完整路徑，不再被頂列按鈕擠到只剩一個字。`CodeView` 新增 `header`：`'float'` 不佔一列、語言和按鈕浮在右上角，`false` 完全不畫，兩者都照 `file` 判斷語言。按鍵說明平常不顯示，點鍵盤按鈕或在程式碼裡按 ? 才彈出。

## 0.30.1

### Patch Changes

- cd20daf: 修正 `Workbench`：在手機或窄螢幕上掛載時立刻呼叫 `show()`，打開的面板會在第一次量到寬度後被收掉。現在第一次量寬度不算「換寬度」，`show()` 也改用呼叫當下的實際寬度判斷要展開、疊上來或打開合併面板。

## 0.30.0

### Minor Changes

- e7fdf91: `Workbench` 新增 `useWorkbench().show(viewId)`：把某個分頁設成它那一邊目前的分頁並打開那一邊（窄螢幕疊上來、手機打開合併面板），不改變分頁位置。新增 `useWorkbench().layout`、`onLayoutChange` 讀取目前版面，以及 `ref`（`WorkbenchHandle`：`show`、`toggle`、`resetLayout`、`getLayout` 等）讓 Workbench 外面也能呼叫。

## 0.29.0

### Minor Changes

- b80f894: 新增 `Workbench`：像 VS Code 的編輯器版面（頂列、檔案總管、主畫面、右側欄、下方面板），邊界可拖曳與用鍵盤調整，分頁可在右側欄與下方面板之間拖曳或用按鈕移動，Ctrl B／Ctrl J／Ctrl Alt B，版面記在瀏覽器並可還原；窄螢幕改成抽屜，手機上分頁合成固定在下半部的面板。`IconButton` 新增 `variant="quiet"`（32 px、無外框）。`TreeList` 新增 `density="compact"`（每列 28 px）與節點標記 `mark`。

## 0.28.0

### Minor Changes

- 3645cbd: AppShell 與 SideNav 的 `brand` 可以傳 `{ mark, name, href }`：側邊欄收合（72 px）時只顯示 logo，仍是回首頁的連結、`aria-label` 是完整名稱；展開或釘選時名稱在 logo 右邊淡入，logo 不移動。只傳文字時用第一個字放在強調色方塊裡當 logo；傳一個元素的舊寫法收合時整塊隱藏。

## 0.27.0

### Minor Changes

- 3e31067: InlineCode 新增 `look="name"`（名稱：強調色等寬字，沒有底色）與 `look="location"`（檔案:行號：灰色 13 px）；Markdown 自動套用，`[AI](ai:)` 變成新的 `AiMark`。IconButton 新增 `hint`（圓點加泡泡的第一次使用提示），`useTour` 新增 `tour.hint(text)`：用了提示的頁面不再自動打開導覽。

### Patch Changes

- 2853e62: 修正強調文字色（`--accent-text`）在預設強調色下變成黑色：打包工具（Vite、esbuild、lightningcss）會把 `tokens.css` 的 `#ffffff` 縮寫成 `#fff`，`setAccent()` 讀不懂 3 位數色碼，對比算不出來，一路混入黑色，所有連結和行內程式碼連結都變黑。現在讀 `--bg`、`--surface` 時接受 `#rgb`、`#rrggbb`、帶透明度的寫法與 `rgb()`；仍然讀不出來時，`--accent-text` 就用強調色本身，不往黑或白混。

## 0.26.0

### Minor Changes

- 4bda68b: AppShell 電腦版側邊欄預設不釘選：
  
  - 平常是 72 px 的圖示列，點圖示就能換頁；滑鼠停在上面或用 Tab 移進去時展開成 240 px，疊在內容上（內容不移動），離開、按 Esc 或選了頁面後收回。
  - 左下角新的圖釘按鈕釘選側邊欄：釘選後和以前一樣固定在內容旁邊，可以收合成 72 px。選擇記在瀏覽器；以前存過收合或展開的人當作已釘選，畫面不變。
  - 新的 `defaultPinned` 讓頁面一開始就釘選；SideNav 新的 `onPin`、`pinned`；新圖示 `push-pin`。

## 0.25.0

### Minor Changes

- 5d2bc51: 預設的強調色都達 4.5:1（當文字放在 `bg` 上，以及白字放在它上面）：
  
  - `AccentPicker` 的三個推薦色加深到剛好達標，色相不變：橘 `#b85a0e`（原 `#c4600f`）、綠 `#1a844a`（原 `#1b8a4d`）、青 `#0e827d`（原 `#0f8a85`）。
  - 教材主題（`data-theme="teaching"`）的預設強調色改為青 `#0e827d`，取代 `#0f766e`；hover、按下、淺底與 focus ring 依強調色換算重新算出，強調色文字就是 `#0e827d`，強調色底上的文字為白色。

## 0.24.0

### Minor Changes

- 1a1d289: DataTable 工具列與高度：
  
  - 放大表格的圖示移到工具列最右邊，不再單獨佔一列。
  - 工具列依表格自己的寬度換行（container query）：760 px 以上一列；以下搜尋框一列、其他按鈕一列；480 px 以下「排序」只寫層數，按鈕多時「篩選」「欄位」只留圖示。旁邊開著面板的窄表格在大螢幕上也照窄的排。原本小於 600 px 時搜尋框會被擠成 0 寬。
  - 沒有搜尋框時，`caption` 和按鈕同一列；直接放在 Card 標題下面時，按鈕放進 Card 的標題列。
  - 手機上不顯示「複製成 Markdown」。
  - 有頁碼的表格不限高度；所有表格的捲動框捲到底後，滾輪接著捲動整頁（拿掉 `overscroll-behavior: contain`）。
  - DataTable 填滿父元素的寬度。

## 0.23.0

### Minor Changes

- aa3bdf7: DataTable 多欄排序：
  
  - Shift＋點欄位標題（鍵盤 Shift＋Enter）把那一欄加成下一層排序；有兩層以上時標題寫出它是第幾層，螢幕閱讀器也會念。
  - 工具列新的「排序」按鈕直接寫出目前的排序（「排序：程式 ↑、ΔT ↓」，手機上寫層數），點開可以加一層、拖曳或 Alt＋↑ ↓ 調順序、切換方向、移除。
  - 排序寫進網址（`?sort=prog,-dt`，有 `urlKey` 時加前綴）；新的 `defaultSort`；`maxSort` 限制層數（預設不限）。
  - 新圖示 `sort-ascending`、`dots-six-vertical`。
- a14edc4: 表格的兩處外觀：
  
  - 表格裡（DataTable 的列與展開詳細、Markdown 表格）的 InlineCode 改成白底（`surface`）加 1 px 框線（`line`）。原本和斑馬紋偶數列同色，偶數列上看不出程式碼的範圍。段落、清單裡的 InlineCode 不變。
  - DataTable 的 `caption` 從 20 px 改成 17 px，和 Card 標題同一個大小。

### Patch Changes

- 6e419ac: 修正三個樣式錯誤：
  
  - AppShell 的「跳到主要內容」連結在畫面外時不再帶陰影；原本陰影滲進畫面，讓側欄品牌名稱上方（深色模式最明顯）有一塊較黑的區域。按 Tab 時照樣出現，並帶陰影與焦點框。
  - `Card` 設 `padding: false` 時，標題列、DataTable 的工具列、分段控制、頁碼和捲動提示保留 16 px 內距；原本標題和搜尋欄貼齊卡片邊緣。表格本身貼齊卡片左右兩邊，拿掉自己的左右框線與圓角。
  - DataTable 欄位設 `unit` 時，數字和單位之間有空格（「212.4 ms」）；原本格子是 flex，空格被丟掉，顯示成「212.4ms」。

## 0.22.0

### Minor Changes

- 17fc39f: CodeView：程式碼裡的名稱可以是連結。
  
  - 新的選填 `links`（`{ line, text, col?, href?, label? }`）：名稱保留語法色，加淡色虛線底線；按住 Ctrl 或 ⌘ 點擊才開啟，一般點擊只選取文字，觸控螢幕點一下就開啟。
  - `onLink(link, e)` 收到傳進來的同一個物件；`preview(link)` 在滑鼠或鍵盤焦點停 500 ms 後顯示預覽卡片。
  - 有名稱連結時整個程式碼只有一個 Tab 停留點：↑ ↓ 換行、← → 換連結、Enter 開啟、Esc 回到那一行。
  - 沒有 `col` 時只比對這一行第一個完整的名稱；對不上的連結不加，開發模式下警告原因。
- b49dcea: DataTable 和 Markdown 表格的操作一致：
  
  - DataTable：表頭的欄位邊框可以拖拉調整欄寬（鍵盤 ← →，Enter 或雙擊回到預設）；新的選填 `widthKey` 把拖出的寬度記在 localStorage。
  - DataTable：表格右上方的「放大表格」圖示（`zoom`，預設開），在最寬 1200 px 的對話框裡顯示同一張表，搜尋、篩選、排序、分頁沿用。
  - DataTable：工具列的「複製成 Markdown」圖示（`copy`，預設開），複製篩選後的全部列；新的選填 `copyText` 自訂內容、`onCopyError`。
  - Markdown 表格與 DataTable：在放大對話框裡點連結，會先做連結的事再關閉對話框。拖拉邊框、放大對話框、複製圖示改用同一份實作。

## 0.21.0

### Minor Changes

- a52da0f: 表格調整與全部展開：
  
  - Markdown 表格：表頭的欄位邊框可以拖拉調整欄寬（鍵盤 ← →，Enter 或雙擊回到依內容的寬度）；右上方的「放大表格」圖示在全寬對話框裡看整張表。
  - SectionGroup：「全部展開」「全部收合」合成一個圖示按鈕。新的 `bar={false}` 與新元件 `SectionGroupToggle`，把按鈕放到卡片標題列。
  - 圖示：新增 `corners-out`。

### Patch Changes

- 09c2354: Markdown 表格：名稱與路徑不再被拆成一字一行。Markdown 改用 `overflow-wrap: break-word`（原本 `anywhere` 讓表格以為每欄都能縮到一個字寬，把 `VirtualRouter._probe_neighbor` 這類名稱壓成一字一行）；格子裡的路徑不換行，指令在空白處換行並至少 16 em 寬；放不下時表格左右捲動。

## 0.20.0

### Minor Changes

- 76caee8: LayerGraph：新的選填 `resizable` 與 `heightKey`。架構圖下面多一條可以拖拉的把手：往下拖拉開層與層之間的距離，往上拖到比原本矮時改成框內上下捲動；鍵盤 ↑↓、Enter 或雙擊回到原本的高度。

## 0.19.0

### Minor Changes

- e16d430: Markdown 撐起整份概觀：
  
  - Markdown：`<details><summary>` 可收合的區塊（只放行這兩個標籤，屬性去掉；頁內搜尋找到時自動展開）。
  - Markdown：GitHub 的 `> [!NOTE]`、`[!TIP]`、`[!IMPORTANT]`、`[!WARNING]`、`[!CAUTION]` 用 Alert 顯示。
  - Markdown：表格格子裡的行內程式碼換行；表格不到 480 px 時每列一張卡片。
  - Markdown：新的選填 `schemes`，自訂 scheme（例如 `fn:`）交給 `linkHref` 與 `onLink`；`javascript:`、`data:`、`vbscript:` 一律擋掉。`topLevel` 可設 1 到 6。
  - Section：新的選填 `actions`，放在摘要右邊，點它不會開合；不到 480 px 時摘要移到標題下一行。
  - LayerGraph：新的選填 `toolbar`，頁面的控制項放在「圖／清單」同一列的左邊。

## 0.18.0

### Minor Changes

- 0f1ccf9: 可收合段落、Markdown 與 DetailList 寬面板：
  
  - 新元件 `Section`：可收合的段落，標題 20 px、右邊一行摘要、段落之間一條線、260 ms；`defaultOpen` 或 `open`＋`onOpenChange`、`id` 錨點自動展開、`lazy`、`storageKey`。預設收合的內容留在頁面上，頁內搜尋找到時自動展開。
  - 新元件 `SectionGroup`：一組 Section，上方有帶圖示的「全部展開」「全部收合」。
  - 新元件 `Markdown`：段落、標題（`#` 顯示成 h4）、粗體斜體、行內程式碼、程式碼區塊（CodeView）、連結、清單、引用、表格、水平線；不執行 HTML，連結只允許 http、https、mailto 與相對路徑；`linkHref`、`onLink`、`refHref`、`onRef`、`inline`、`size="small"`。
  - CodeView：新的選填 `copy`，標題列右邊的複製小圖示；`onCopy`、`onCopyError`。新的選填 `lineNumbers`。行號左邊留 12 px、和程式碼隔 16 px（原本貼著左邊框、隔 12 px）。
  - Markdown 的程式碼區塊：32 px 的矮標題列、沒有分隔線、沒有行號。
  - DetailList：新的選填 `labelWidth`（`'auto'` 或 px）與 `labelSize`（`'small'`、`'body'`）。
  - 圖示：新增 `arrows-out-line-vertical`、`arrows-in-line-vertical`。

## 0.17.0

### Minor Changes

- 8bea9f6: codemap 第 7 輪試用回饋：
  
  - LayerGraph：方框新的選填 `tag`（名稱右邊的短標籤，名稱先截斷、標籤完整，清單和螢幕閱讀器也帶上）與 `tagTone: 'warning'`（warning 色加鎖頭圖示）。有名稱會被截到不到 8 個字時（例如手機），標籤改到名稱下一行，方框加高到 76 px。
  - LayerGraph：線念「起點 到 終點，標籤」，不再念「→」；清單畫面上仍寫「→」。
  - CommandPalette：每筆說明最多兩行；面板最高延伸到視窗底部留 24 px（原本最高 560 px）。

## 0.16.0

### Minor Changes

- 1e412d0: codemap lab3 試用回饋：
  
  - MobileTabBar：每個圖示下方加一行 11 px 文字（選中的粗體），文字就是按鈕的名稱。只有圖示的樣式保留成 `labels={false}`；AppShell 用 `tabLabels` 傳下去。
  - TreeList：整棵樹只佔一個 Tab 停點。列裡的連結和按鈕不在 Tab 順序裡，在列上按 → 進入，← 或 Esc 回到列，↑ ↓ 到上下一列。第 5 層以後的「L5」標記滑過時顯示「第 5 層」。
  - CommandPalette：結果清單下方一行「共 N 筆」；新的選填 `total`，呼叫端截斷結果時寫「顯示 N 筆，另有 M 筆，請輸入更長的字」，螢幕閱讀器也念這一句。已列出結果、還在載入更多時，清單下方一行「搜尋中」。
  - CodeView：焦點在程式碼裡時，Home／End 到第一行／最後一行，PageUp／PageDown 一次 20 行；新的選填 `sections`，`[` `]` 跳到上一段／下一段並念出段落名稱。
  - Switch README：要讓點文字也能切換，把文字和開關包在同一個 `<label>` 裡。

### Patch Changes

- dea1d71: CodeView：螢幕閱讀器在行號後面念出行首縮排，例如「第 550 行，縮排 16 格：」，tab 念成「1 個 tab」。螢幕閱讀器會略過行首空白，Python 這類靠縮排表示區塊的程式原本聽不出一行屬於哪個 `if`。畫面和複製的內容不變。

## 0.15.0

### Minor Changes

- d6377b3: 強調色的文字對比保護：淺色主題選了淺色強調色時（例如 `#ffe066`），`accent-text` 由強調色混入黑色、每步 4%，直到對 `bg` 與 `surface` 都達 4.5:1（`#ffe066` → `#7a6c31`）；強調色本身已經達標時不變（預設 `#2457d6` 不變）。深色主題同樣改成對 `bg` 與 `surface` 都達 4.5:1。`accent` 本身（填色、進度條、選取框、色點）不受影響。Badge「進行中」的符號和 Alert（info）的圖示改讀 `accent-text`。

## 0.14.0

### Minor Changes

- 2a66f0d: codemap 第八輪回饋：
  
  - LayerGraph 清單檢視：每一條關係都能選取，包括連到共用項目、圖上沒有畫成線的關係。點一下、Enter 或空白鍵都會呼叫 `onSelectEdge`，和點圖上的線一樣；選中的那一行 `aria-pressed="true"`。
  - Tour：說明卡依序試目標下方、上方、右側、左側，選第一個放得進視窗而且不蓋住目標的位置；新增步驟選項 `keepVisible`，說明卡也不蓋住指定的內容（例如目標下方的表格）。都放不下時先捲動頁面，再不行才選蓋住目標最少的位置（原本是放在目標裡面）。
  - LayerGraph 手機寬度：圖要左右捲動時，一開始捲到方框的最左邊，不再停在標籤留下的空白；一開始有選取時捲到該方框，之後選取的方框不在畫面內時捲到看得到它。
  - LayerGraph 線上文字：標籤的位置要離自己的線比離其他線近，不會停在別條線旁；找不到這種位置時改成線上的編號圓點，圖的下方依編號列出完整文字，滑過或選取那條線時完整文字也浮在圖上（原本蓋在線上）。修正往上的線在方框右移後從方框後面穿過的錯誤。
  - ProjectSwitcher：專案名稱和狀態分開，寬度不夠時先截斷狀態；手機上只寫名稱，狀態用圓點，完整文字在 `aria-label` 和 `title`。圓點的形狀也表示狀態：即時實心、已過期空心、離線空心加斜線（10 px）。
  - 文件網站的 LayerGraph、Tour、DataTable、ProjectSwitcher 示範加上 codemap 的重現案例。

## 0.13.0

### Minor Changes

- 86dd423: LayerGraph：顯示或隱藏線上文字的控制預設改成 Switch 加文字「線上文字」（英文 Line labels），開著表示標籤顯示。`labelToggle="icon"` 保留原本的標籤圖示切換按鈕。

## 0.12.1

### Patch Changes

- a6b9352: codemap 第七輪回饋：
  
  - LayerGraph：往上的線的標籤靠近自己那條線，離自己的線比離其他線近，不再貼在別條線旁；清單的英文在逗號前不再多出空格。
  - Tabs：可以捲動時那一側邊緣淡出，選中的分頁自動捲進畫面。
  - CommandPalette：輸入新的文字或 `loading` 結束時，結果數和上次一樣也會重新播報。

## 0.12.0

### Minor Changes

- a7fd3e7: codemap 第六輪回饋：
  
  - LayerGraph：方框變窄後標籤和線的空間讓圖變寬時，縮小比例跟著重算（PM 原本只算一次，1366、1440 px 會變成左右捲動、右側方框被切掉）；標籤之間上下至少留 4 px；找不到不碰線的位置的標籤最後才放，蓋在線上時用實心底色；換行時逗號不放在行首。
  - Tabs、DataTable `summary`：`unit` 可以傳函式（單複數）；字串單位在數字是 1 時使用「1 <單位>」的翻譯，預設「筆」在英文是「1 row」。分頁的字不換行，放不下時整排左右捲動，不再互相重疊。
  - CommandPalette：新增 `noResultsText`，找不到結果時的提示文字，不算一筆結果。
  - LayerGraph `declared`：專案宣告的關係畫成長短交替的虛線，圖例「專案宣告的關係」（DC）；GraphLegend 加 `declared`。
  - LayerGraph：縮到 0.75 倍還放不下、改回左右捲動時，方框回到原本的寬度，名稱不截斷（WA）。
  - 匯出 `CountUnit` 型別。

## 0.11.0

### Minor Changes

- 99a6182: codemap 第五輪試用的修正。
  
  - LayerGraph：標籤找不到空位時沿自己的線找，再不行加高層間空隙、加大方框間距，不再壓到線；方框出去的線分散在整個寬度；同一層方框之間的線改從下方繞，不穿過方框；文字相同的標籤前面加來源；repo 外的方框不跟著變窄；`countLabel`、`sizeLabel` 可以是數量的函式，英文預設「1 call」「1 item」；清單檢視的關係按鈕名稱包含說明。
  - DataTable：不能換行的內容讓欄位自動加寬；手機卡片不再把名稱從中間斷開；「a / b 筆」由 CSS 畫，頁面文字只有一份；`fullText` 改成格子的 `aria-description`；列的名稱是第一欄。
  - CodeView：註解和字串裡的路徑可以變成連結（`refHref`、`onRef`）；英文介面的「Line 48: 」「Language: 」用半形冒號。DateRangePicker、TreeList 也是。
  - TopBar：手機上專案名稱先截斷，頁面標題不會只剩一個字。
  - Tour：步數「1 / 5」由 CSS 畫；目標比視窗高時開發警告。TextArea 字數同樣。
  - 全面檢查的修正：TreeList、DataTable 的 id 含空格時，`aria-owns`、`aria-controls` 仍找得到對象；焦點遞補用同一份清單算位置；`zh-CN` 等其他中文語系會用 app 加的翻譯；`format.fileSize(0)` 是「0 KB」；AppShell 平板的導覽抽屜在視窗變寬再變窄後不會自己打開。
  - tokens：寫死的顏色改成 token，數值不變：`on-solid`、`danger-ring`、`mark`、`scrim`、`scrim-strong`、`edge-shadow`、`file-*`。
  - LayerGraph：沿線找標籤位置時先比距離，較遠的位置不再逐一檢查；加大的方框間距在寬度改變時重新計算。DataTable：欄寬只在內容改變或字型載入後重新量，不再每次重繪都量。
  - Menu、DangerZone 預設的確認標題經過翻譯（英文「Delete?」）；NotificationBell 的未讀狀態螢幕閱讀器念得到；DatePicker 必填時告訴螢幕閱讀器；DateRangePicker 的日期跟著語言；Switch 觸控被捲動取消時圓點復原；dashboard 範本的摘要加上單位。
  - BarChart、LineChart 可以用鍵盤看每個數值；Calendar 支援方向鍵、Home、End、PageUp、PageDown；DatePicker 打到一半不顯示錯誤，離開欄位才顯示；FileUpload 的進度條有檔名；ProgressBar 新增 `aria-label`。

## 0.10.0

### Minor Changes

- cd96e15: - Tour：說明卡不再蓋住目標：上下放不下時先捲動頁面騰出位置，再不行放在目標右側或左側；新的一步會被螢幕閱讀器念出標題和說明。
  - DataTable：長文字依欄寬截斷（拿掉 20 em 上限）；隱藏欄位或內容改變後重新判斷是否要顯示捲動提示；篩選彈出框留在表格範圍內；新增欄位選項 `fullText`，滑過或取得焦點時顯示完整文字。
  - LayerGraph：清單檢視和線的名稱的分隔標點經過 `UI.t()`，英文介面用半形。TreeList 名稱的分隔也是。
  - Term：說明框留在詞所在的區塊（卡片、SplitPane 的一邊、主要內容區），不蓋到旁邊的面板。
  - FloatingPanel 內部新增 `boundary`。
  - LayerGraph：同一個方框收到多條有標籤的線時，每條線在兩層之間走自己的高度再轉彎，標籤緊貼在轉角旁，沒有線穿過標籤，標籤不截斷。圖比外框寬時先把方框變窄（最窄 120 px），再整張縮小（最小 0.75 倍），更小才左右捲動。
  - SplitPane：分隔線中間加上 10 × 40 px 的膠囊把手，滑過、拖拉或鍵盤移到時變強調色。
  - DataTable：有展開箭頭時，點列上任何地方都會展開或收合（連結、按鈕、勾選框除外），滑過時游標變手指。
  - ui check：整張縮小的元件（例如縮小後的 LayerGraph）裡，觸控範圍讀出祖先元素的 `transform`，照縮小後的大小判斷，不再誤報「比控制項大」。
  - LayerGraph：「圖／清單」左邊新增標籤圖示按鈕，讓使用者切換線上的文字全部顯示或滑過才顯示，選擇會記住；`edgeLabels: 'shown' | 'hover'` 設定一開始的狀態，`labelToggle={false}` 拿掉按鈕。縮小後觸控範圍仍是 48 px。
  - Icon：新增 `tag`。IconButton 新增 `filled`，按下或選取時用實心圖示。

## 0.9.0

### Minor Changes

- 7cdfbd9: - Tour：Tab 和 Shift + Tab 只在卡片的按鈕之間循環，不會跑到頁面上；Escape 關閉後焦點回到開啟前的元素。
  - TreeList、Tabs、RadioGroup：按住 Alt、⌘ 或 Ctrl 的方向鍵留給瀏覽器（Alt + ← 回上一頁）。
  - TopBar：觸控裝置不顯示 Ctrl K 提示；Mac 判斷先看 `navigator.userAgentData`。
  - 新增 `UI.format.fraction` 和 `UI.format.fractionLabel`：畫面上「6 / 6 筆」，螢幕閱讀器念「6 筆中的 6 筆」。DataTable 的筆數和 TextArea 的字數改用它。
  - DataTable：有長文字欄位時，每列左邊有展開箭頭，展開後在列下方列出長文字的全文；觸控裝置不再用滑過的 Tooltip（點一下會一直留在畫面上）。
  - `focusMain()`：標題不畫焦點框；鍵盤操作後標題左邊有 3 px 強調色條，滑鼠或觸控時不顯示。
  - TreeList：標籤的文字念在名稱裡，新增 `ariaLabel`；點有子項目的列（或按 Enter）同時展開或收合。
  - LayerGraph：共用項目的「N 個項目使用，共 M 次」也算其他共用項目的使用，和清單檢視一致。
- 0d5a351: - LayerGraph：新增 `external`（repo 外的項目）：畫在所有分層上方，虛線外框，名稱下方寫「repo 外」（`externalLabel`），沒有大小條；線、選取和清單和一般方框一樣。往下的線的標籤留在箭頭正上方的空隙，不再越過方框。
  - 新元件 SplitPane：主要區域和側邊面板之間可以拖拉的分隔線（`role="separator"`，← → 16 px、Home、End、雙擊或 Enter 回到預設寬度），兩邊有最小寬度（`minA`、`minB`），寬度用 `storageKey` 記住；960 px 以下上下排列。

## 0.8.1

### Patch Changes

- 339b776: 焦點救援（ActionBar、Tabs）：按下後變成停用的按鈕，焦點有時沒有移到旁邊的按鈕、留在 `body`。瀏覽器在下一次畫面更新時才把焦點移走，現在會在那時再檢查一次。
- 09d1537: CommandPalette、Tour：關閉時如果有關閉動畫，或電腦比較慢，焦點有時留在 `body`，沒有回到開啟的按鈕或新頁面的標題。現在關閉後會每一格畫面檢查，直到視窗真的移除（最多 2 秒）；焦點掉到 `body` 時移回開啟的按鈕，按鈕不在了就移到主要內容的標題。

## 0.8.0

### Minor Changes

- 68b7c0f: DataTable：欄位新增 `hidden?: boolean`（預設 `false`）。設為 `true` 的欄位一開始不顯示，仍列在「欄位」選單裡，勾選後顯示；給新的 `resetKey` 時欄位的勾選回到預設。

## 0.7.1

### Patch Changes

- 6119d5e: LayerGraph：標籤避開所有的線。往上的線的標籤一行放不下時換成 2 到 4 行，還是沒有位置就把兩層之間的空隙加高（每次 24 px，最多 144 px）；往下的線的標籤也一樣，先換到箭頭另一側。數字和單位不拆開。範例加上同一對方框同時有往下和往上的線、手機寬度的例子。

## 0.7.0

### Minor Changes

- e991df7: Accessibility from codemap's screen-reader, tablet and phone run. New `announce(text)` (one polite live region) and `focusMain()`. Focus never falls to the page: Tour and CommandPalette give it back to their opener on close (or move it to the new page's title when the opener is gone), Tabs keep it on the selected tab, ActionBar hands it to a neighbour when the pressed button goes away or turns disabled. Components announce: TreeList 「已展開，3 個子項目」, DataTable 「顯示 6 筆」, CommandPalette 「找到 6 筆結果」 and 「找不到…」, Tabs and SideNav the new page. AppShell has a 「跳到主要內容」 skip link. LayerGraph's line buttons sit in a group instead of an image, and labels are not read twice. CodeView reads line by line (「第 62 行」, not copied), names its code block, marks the target with `aria-current` and gets `ref.focusTarget()`. TreeList names are 「名稱，meta，path」, children sit in `role="group"`. Term reads 「說明 caller」, Tour 「第 1 步，共 5 步」, Tabs 「全部 26 個」. Touch screens: a Tooltip closes on a tap elsewhere or a scroll.
- 4f5890f: LayerGraph: a 「圖／清單」 switch shows every box and line as a selectable text list (`listView`, `listLabels`); the sideways scroll is remembered when the diagram comes back (`scrollKey`); a line up a layer keeps its label beside the lane, between the layers, instead of widening the diagram. AppShell: from 600 to 1024 px there is no sidebar; TopBar's new `onMenu` button opens the navigation in a drawer from the left (Drawer's new `side`).

## 0.6.1

### Patch Changes

- 2e8d631: MobileTabBar: back to icons only (T0), as before 0.6.0: no names under the icons, each tab named by its `aria-label`, the bar 60 px tall.

## 0.6.0

### Minor Changes

- 8f9e284: LayerGraph draws lines to a higher layer (for example a data channel back up through a shared item). The line leaves the source's side, runs up a lane beside the boxes and enters the target's side, the arrow pointing at the box: the left lane when the target is the leftmost box of its layer, the right lane otherwise, and from below when the target sits between two boxes. The diagram widens on that side; the label sits outside the lanes and never covers a box, another label or a line. These lines are selectable like the others (`selectedEdge`, `onSelectEdge`, hover, keyboard).
- f920576: MobileTabBar: every tab shows its name under the icon (12 px; the bar is 64 px tall), and the name is its accessible name. Tour on phones: the target scrolls up under the top bar and the card sits below it, above the bottom tabs, never covering either; a target too tall for both gets the card over its lower part, still above the tabs. Tour: the target now scrolls fully into view on every width (a smooth scroll stopped halfway under the modal's scroll lock).

### Patch Changes

- 4e7a669: From codemap's touch, dark-mode and keyboard run. InlineCode: a link on its own (no text beside it) gets the 48 px touch area on touch screens, like Term; links inside a sentence keep their line. Dark mode: code links mix 25% `ink` into `accent-text` and reach 5:1 on their chip (4.18:1 before). CodeView: a wrapped line's continuation has a 2 px bar in its indent, and lines break after commas, dots, opening brackets and operators, never inside `->`, `==` or `&&`. Scroll hint: 「向右捲動」 with a mouse, 「左右滑動」 on touch screens. CommandPalette: screen readers hear the kind first, 「環境變數 IBTRACE_SHM」, without the extra comma.
- 76f204a: LayerGraph: on touch screens the shared-item boxes no longer cover the whole page. Their enlarged touch area (::after) measured against the window because the box was `position: static`; it is `relative` now. Tooltip: closes when its trigger loses focus, only one is open at a time, and a closing Tooltip leaves at once instead of waiting for its entrance animation, so tabbing through cut-off DataTable cells no longer leaves Tooltips stacked. ui check: reports touch areas larger than their own control (they cover other controls) and no longer counts them as big enough targets.

## 0.5.0

### Minor Changes

- e17cbf2: DataTable: a long cell cut off on desktop shows its whole text in a Tooltip on hover or keyboard focus. A table wider than its container (e.g. beside a detail panel) gets a fade on the right edge and a 「左右滑動」 hint under it until the first sideways scroll. LayerGraph: shared items are small boxes under the diagram, selectable with the same `selected` and `onSelect`; the boxes that use the selected one show 「使用 N 次」 (`useLabel`). Tooltip: `wrap` for long text and `disabled`.

### Patch Changes

- 87d835f: Fixes from codemap's first-time-user feedback. Tabs: `unit` (and `TabItem.unit`) after each count, with a dev warning when a count has none. DataTable: `summary.unit` (default 「筆」) after the summary counts, 「筆」 after view counts, and no 「第 1–6 筆，共 6 筆」 line when everything fits on one page. LayerGraph: the legend lists only the kinds of line the diagram has; edge aria-labels drop the backticks; the 「左右滑動」 hint sits under the diagram instead of over a box and keeps its space after the first scroll. CodeView: the language reads 「C 語言」 instead of a lone 「C」, as plain muted text, and screen readers hear 「程式語言：C 語言」.

## 0.4.1

### Patch Changes

- 74d39d3: LayerGraph: a diagram wider than its box keeps scrolling at full size, now with a fade on the right while more is to the right and a 「左右滑動」 hint until the first scroll. Hovering a selectable line makes it darker and 2 px thicker and underlines its label.
- b036f55: Tour: measure the card when its popup mounts. 0.4.0 measured too early, saw a 0 px card and put it above a target almost as tall as the window, so it ran off the top. Now neither side fits and the card sits inside the target at the bottom center of the window.

## 0.4.0

### Minor Changes

- 9dc8165: LayerGraph: selectable edges. `LayerGraphEdge.id` (default `${from}->${to}`), controlled `selectedEdge` and `onSelectEdge`. A click on a line or its label selects it; again, or on the empty diagram, clears it. Tab, Enter or Space and Escape work on lines. Selecting a line clears the selected box and the other way round. Without `onSelectEdge` nothing changes.
  
  ui check lists LayerGraph's selectable lines as exempt touch targets: the label is the touch target.

### Patch Changes

- 5c08281: Tour: the card always stays inside the window, 12 px (`--space-3`) from every edge. When neither side of the target has room, it sits inside the target at the bottom center of the window; a card taller than the window scrolls its text and keeps the buttons at the bottom. A target taller than the window scrolls into view from its top.

## 0.3.0

### Minor Changes

- 9e7a950: Breaking: DataTable `format: 'percent'` no longer adds the % sign; add `unit: '%'` (as KpiCard). Rows hidden by filters, search, views or the summary are unchecked, so `bulkActions` only gets visible rows. Drawer `actions` can be `(requestClose) => …` so the footer 取消 asks before discarding changes. A collapsed SideNav parent opens its first page. Every check box uses the same drawn check, drawn only when it turns on.
  
  New ESLint rule `ui/no-tailwind-defaults` (error in `recommended`): Tailwind's own palette, radii and shadows, in className and in cn()/clsx()/cva() calls.
