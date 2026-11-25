# @seanyeh77/tokens

## 0.47.0

No changes in this release.

## 0.46.0

### Minor Changes

- 08bc9ad: 新增 `fonts-latin.css`（Inter、Geist Mono）和 `fonts-tc.css`（Noto Sans TC）：主 CSS 只放前者，中文字型的 CSS 另外非同步載入，不再擋住第一次畫面（做法見 AGENTS.md）。`fonts.css` 不變。

### Patch Changes

- 4b9fdd2: AppShell：頁面本身不再捲動。內容捲動區（`.ui-shell-main`）是絕對定位內容的定位框，圖表的隱藏資料表、KpiCard 念出的數值、外部連結的隱藏說明不再把文件撐高（390 px 時文件從 844 px 長到 1734 px，捲下去一片空白）；`.ui-visually-hidden` 加上 `clip-path: inset(50%)`。0.45.1 恢復導覽的平板邊界含 1024 px：600 到 1024 px 用導覽抽屜，大於 1024 px 才有側邊欄（0.45.0 誤改成 1023 px）。

## 0.45.0

### Minor Changes

- 6d721ee: 核心修正：SSR、主題、i18n 與日期。
  
  - SSR 與 hydration：存在 localStorage 的選擇（ThemePicker、AccentPicker、Section 的 `storageKey`、AppShell 側邊欄、`useTour`、DataTable 的 `widthKey`、LayerGraph 的高度與線上文字、Workbench 版面）和媒體查詢在伺服器與瀏覽器第一次渲染都用預設值，接手後才換成存下的值，不再有 hydration 不一致；其他分頁改了也會跟著變。ConsoleLayout 的全螢幕按鈕、KpiCard 與 ProgressRing 的數字動畫也一樣。
  - 主題：`initTheme({ preset: 'teaching' })`（或根元素的 `data-theme-preset`）讓 `setTheme()` 不再蓋掉 teaching preset。沒選過強調色時不再寫 inline 的 `--accent*`，由 `tokens.css` 決定；新增 `resetAccent()`、`pickedAccent()`、`themePreset()`，並匯出 `storedTheme()`、`storedAccent()`。在沒有 `window` 的環境呼叫主題函式不會出錯。遷移：自己用 CSS 覆寫 `--accent` 的頁面改用 `setAccent()`；自己設 `data-theme="teaching"` 的頁面改用 `initTheme({ preset: 'teaching' })`。
  - tokens：每個主題設 `color-scheme`（深色主題的原生捲軸與表單控制項跟著變深）；新匯出 `presets`；`usage` 說明統一成英文並修正 `space-5`、`sidebar-collapsed`。
  - 日期：`format.relative` 跨過午夜以日曆天計算（凌晨 1 點看前一晚 10 點是「昨天」，不是「3 小時前」），7 個日曆天以上寫完整日期。新元件 `RelativeTime` 每分鐘自己更新（全頁共用一個計時器），DataTable 的 `format: 'relative'` 改用它。DataTable 欄位格式改寫成 `format: 'dateTime'`；`'datetime'` 仍可用，開發時警告。
  - i18n：新增 `useLocale()`、`subscribeLocale()`、`<LocaleProvider locale>`（SSR 時一個請求一種語系）；`t()` 支援「情境::原文」的 key。補上缺少的英文翻譯，全形標點改經過翻譯。預設文字不再限定專案：LayerGraph 外部方框的預設標籤從「repo 外」改成「外部」（要原本的字請傳 `externalLabel="repo 外"`），英文的次數從「{n} calls」改成「{n} uses」，DataTable 長文字的「收合」英文仍是 Show less、其他地方的「收合」英文改成 Collapse。CommandPalette 的內建種類改用 `kind: 'page' | 'setting' | 'command' | 'file'`，名稱跟著語系；舊的中文種類名稱仍可用，開發時警告。GraphLegend 不再翻譯頁面自己傳的圖例文字。
  - 開發警告：全部改成英文；`devWarn` 的條件與訊息可以是函式，正式版不再為了警告每次渲染掃過所有列。
  - `consoleZoom` 標成 deprecated（開發時警告），之後的版本會從匯出移除；ConsoleLayout 自己會縮放。
  - `focusMain` 不再在 import 時掛上 document 的事件，改由 AppShell 與 `initTheme()` 啟用。

### Patch Changes

- fdfaeb2: 文件整理：
  
  - AppShell 的導覽抽屜在 600 到 1023 px，1024 px 以上有側邊欄（剛好 1024 px 寬的視窗現在有側邊欄）；文件和 `bp-desktop` 的說明寫清楚 1024 px 只是導覽的邊界，頁面排版的斷點仍是 600、960、1280 px。
  - 套件的 `docs/` 多了 `agents.md`（做頁面的閱讀路徑）和 `icons.md`；`ui docs icons` 印出所有內建圖示名稱，`ui docs agents` 印出閱讀路徑。
  - guidelines 補上常見頁面（清單、詳細、Dashboard、設定、表單）與狀態回饋（載入、失敗、空清單、Toast）的規則；每條規則只說一次。DataTable、LayerGraph、TreeList、Workbench、CodeView、Markdown 的 README 縮短，實作規格移到 repo 的 `docs/maintaining/`。
  - 元件分組重新整理（`ui list`、llms.txt）：新增「版面與外框」「監控畫面」「程式碼與架構圖」「文字標記」，「頁面範本」改名「整頁元件」。`useFormErrors` 不再被 `ui docs` 當成指南。
  - 每個匯出元件的 prop 都有一行 JSDoc（編輯器和 props 表格看得到）。
  - tokens.json 的 `dur-toggle`、`dur-nav`、`space-5` 說明照實際用途改寫。
- 183e1ff: 字型檔只放在 `@seanyeh77/tokens`：`@seanyeh77/ui` 改成依賴它（安裝時自動一起裝），`@seanyeh77/ui/fonts.css` 改成 `@import '@seanyeh77/tokens/fonts.css'`，由 bundler 解析（Vite、webpack、Next.js 都可以），套件從約 12 MB 降到約 1 MB；`dist/bundle.js.map` 不再放進套件。升級方式：用 bundler 的專案不必改；在瀏覽器直接載入 `node_modules/@seanyeh77/ui/dist/fonts.css` 或從 CDN 載入 `@seanyeh77/ui/dist/fonts.css` 的頁面，改載入 `@seanyeh77/tokens/fonts.css`，或用文件網站固定版本的 `/dist/<版本>/fonts.css`。

## 0.44.0

No changes in this release.

## 0.43.1

No changes in this release.

## 0.43.0

No changes in this release.

## 0.42.0

### Minor Changes

- ade4d1d: 樣式改放在 cascade layer `ui` 裡（`tokens.css` 在 `ui.tokens`，`styles.css` 在 `ui.components`）：頁面不加 layer 的 CSS 一定蓋過元件與 token，不必比 specificity 或加 `!important`。兩個檔案開頭宣告 `@layer theme, base, ui, components, utilities;`，配合 Tailwind v4 時 utility class 可蓋過元件、preflight 不會蓋掉元件（在主要 CSS 檔最前面寫同一行即可不受載入順序影響）。原本靠 layer 放自己規則的頁面：排在 `ui` 之前的 layer 現在會輸給元件。元件 CSS 的 `!important` 宣告比頁面沒有 layer 的 `!important` 優先。
  
  ES module 改為一個原始模組一個檔案，bundler 只留下頁面 import 的元件；`'use client'` 在每個元件模組開頭，`@seanyeh77/ui/format` 仍不含 `'use client'`。新增 `@seanyeh77/ui/css/<Name>.css` 分檔：先載入 `css/base.css`、再載入用到的元件、最後 `css/end.css`，只用 Button 時 CSS 從約 148 KB（gzip 25 KB）降到約 14 KB（gzip 3.6 KB）。`styles.css` 仍是預設載法，畫面不變（75 個預覽頁在 390 px、1280 px 亮暗共 300 張截圖與改動前相符）。

### Patch Changes

- fb81a5d: 分檔 CSS 修正：每個 `css/<Name>.css` 都帶齊它需要的其他元件的檔（DatePicker 帶 Calendar、IconButton 帶 Tooltip、Button 帶 Dialog 等），需要的檔排在後面時 build 直接失敗；`LineChart`、`TextField` 等沒有自己樣式的元件也有 `css/<Name>.css`。`styles.css` 的規則順序跟著調整，畫面不變。`backdrop-filter` 與 `user-select` 的 `-webkit-` 寫法移到標準屬性之前，bundler 壓縮後不再丟掉背景模糊。`ui check` 新增一項：列出頁面沒放進 cascade layer、用元素或 `*` 選擇器、又蓋過元件宣告的 CSS（重設 CSS、範本附的 `index.css`）。每個套件加上 README。

## 0.41.0

### Minor Changes

- 20b6f04: 焦點、填色與狀態記號一律達到 WCAG 對比：文字 4.5:1，非文字 3:1，淺色、深色、教材主題與 8 個推薦色票都成立。
  
  - 焦點：所有控制項改用同一種焦點樣式，2 px 實線外框、離控制項 2 px（貼齊會裁切的容器時畫在內側 2 px），顏色是新的 `focus` token（等於 `accent-text`，在每種底色上至少 4.5:1）。原本 3 px 的 `focus-ring` 光暈只有約 1.6:1（淺色）與 2:1（深色），已全部換掉；`styles.css` 也對其他 `:focus-visible` 元素預設同一種外框。`focus-ring` 保留為舊名稱，數值和 `focus` 相同；`danger-ring` 不再使用，數值改為 `danger-text`。
  - 強調色填色：`setAccent()` 換算出的 `accent` 在 `bg`、`surface`、`surface-sub`、`surface-chrome`、`accent-soft` 上至少 3:1，`on-accent` 在它上面至少 4.5:1；不夠時淺色混黑色（每步 4%）、深色混白色（每步 5%）。深色主題預設 `accent` 由 `#2457d6`（在 `surface-sub` 上 1.69:1）改為 `#6689e2`（3.09:1），`accent-hover`／`accent-press` 改為往亮的方向 `#7897e5`／`#88a3e8`，`on-accent` 改為 `#171512`。淺色的 8 個推薦色不變。
  - 語意實色：淺色 `success` `#1ca655` → `#1b9f52`、`warning` `#d68710` → `#bc770e`，深色 `danger` `#cd2823` → `#dc6965`，在各底色與表格列上至少 3:1；新增 `on-danger`（淺色白、深色 `#171512`）給危險按鈕與數字徽章的文字。必填星號改用 `danger-text`。
  - 狀態記號：Badge 的進度圓圈、TreeList 與 Workbench 的圓點、ProjectSwitcher 的狀態點、Meter 的標記與圓點、LineChart 的門檻線改用 `success-text`、`warning-text`、`danger-text`、`accent-text`，草稿用 `ink-muted`。
  - Tabs 與 SegmentedControl 選中的白塊加 1 px `line-strong` 框，選中處對灰底達到 3:1。
- dbee37f: 放在 `Card` 或 `DataTable` 裡的 Badge 不論寬度都自動變成圓點加文字、沒有陰影，圓點樣式只有失敗、審核中、進行中用狀態色，完成與草稿用 `ink-muted`；Button 新增 `variant="quiet"`（無外框、`ink-muted` 文字、滑過 `surface-sub` 底色）；新增 `radius-xs` 4 px 給行內程式碼、Term、按鍵與 SegmentedControl，Tabs 指示塊與分頁改用 `radius-sm`，所有膠囊圓角改用 `radius-full`；深色 `shadow-chip` 變淡、`surface-chrome` 調亮為 `#3d3834`、`accent-soft` 改為 `surface` 混入 22% 強調色（`#343c55`，`setAccent` 同步），`line-strong` 深色調亮為 `#988c80`，兩個主題在 `surface` 與 `surface-sub` 上都達 3:1；8 個推薦強調色在淺色主題本身就達 4.5:1，未達標的 6 個改深（紫 `#864ad1`、桃紅 `#ba3873`、紅 `#c53228`、橘 `#ab5101`、綠 `#077b42`、青 `#027874`），教材主題的強調色隨之改為 `#027874`；SearchField 清除鈕、`ui-link-btn`、SideNav 的圖釘與收合按鈕有 Focus 外光暈，圖釘與收合按鈕改用右側 Tooltip；Tooltip 新增 `side="right"`；TextField 的錯誤訊息改為 `role="alert"`，LoginCard 的帳號錯誤因此和密碼錯誤一樣會被念出，「忘記密碼？」改為「忘記密碼」；Grid 的說明改為實際的欄數變化。
- f7ac5f6: 新增字級（`--text-*`，12 px 到 49 px，Tailwind 的 `text-*` 帶行高）、動畫時間（`--dur-*`）、動畫曲線（`--ease-*`）和層級（`--z-*`）token，`styles.css` 的字級、動畫時間、曲線和 z-index 全部改用這些 token，數值不變；最小字級是 12 px，原本 9 px 和 11 px 的手機分頁列文字、通知數字、排序順序、副檔名標籤和層級數字改成 12 px。文字對比在 `surface-sub`、`surface-chrome` 和 `accent-soft` 上也達 4.5:1：深色 `accent-text`、`danger-text`、`info-text` 稍微調亮，淺色 `warning-text` 稍微調暗，`setAccent` 換算自訂強調色的文字色時也檢查這些底色。`pnpm test` 會檢查 `styles.css` 沒有寫死已有 token 的字級、時間和層級。

### Patch Changes

- 4a10b3c: 對比、焦點、字型與錯誤欄位的修正：
  
  - 淺色 `warning-text` 由 `#955e0b` 調成 `#945d0b`：在紅色色票（`#c53228`）算出的 `accent-soft` 上由 4.49:1 提高到 4.55:1。對比測試改為檢查所有文字 token 在每個推薦色票算出的 `accent-soft` 上達 4.5:1。
  - DataTable 格子裡的可聚焦元素改畫內側焦點外框；截斷的長文字裡的連結取得焦點時整段展開。CommandPalette 搜尋列有焦點時畫內側外框。SettingsLayout 分類與 LayerGraph 方框的焦點外框不再被捲動區切掉。
  - 中文不再用 Geist Mono：KpiCard 單位、TreeList 日期與 meta、ProgressBar 的「完成 ✓」改用一般字體（數字等寬）。LayerGraph 節點新增 `code`，名稱是路徑或模組時才用 Geist Mono，預設一般字體。
  - 表格列裡完成的 ProgressBar 改用 `success-text`，選中的列上也有 3:1。
  - 所有欄位的錯誤樣式一致：紅框、框內警告圖示、下方錯誤訊息。TextArea、Select、MultiSelect、DatePicker 新增 `error`；LoginCard 密碼欄補上圖示。
  - DataTable 的合計列在手機上不再隱藏，改成卡片下方的摘要。
  - `ui check` 在用 bundle.js 的頁面呼叫 `UI.setTheme()` 切換淺色與深色，深色檢查真的是深色。
  - 文件與範例裡的專案名稱換成通用的例子。

## 0.40.0

No changes in this release.

## 0.39.0

No changes in this release.

## 0.38.0

No changes in this release.

## 0.37.0

No changes in this release.

## 0.36.0

### Minor Changes

- f00ddb8: 新增資料用的顏色：熱度色階 `heat-1`…`heat-7`（冷藍 → 中性灰 → 橘紅）、差值發散色階 `diverge-neg-strong`…`diverge-pos-strong`（負藍、0 灰、正橘）、第 4 個類別色 `chart-4`（暖灰）與預測紋理的顏色 `forecast-stripe`，淺色深色都有。UI 新增 `textOn(fill)`（在深色與白色中選對比較高的字色）、`heatToken()`、`divergeToken()`，class `ui-forecast` 在填色上疊斜線紋理，`Tag` 新增 `variant="forecast"`（「預測」）與 `variant="demo"`（「示範資料」）。LineChart 最多四組資料。新增文件頁 DataColors，guidelines 補上監控畫面的最小字級、大螢幕縮放與危險動作規則。

## 0.35.0

No changes in this release.

## 0.34.0

No changes in this release.

## 0.33.0

No changes in this release.

## 0.32.0

No changes in this release.

## 0.31.0

No changes in this release.

## 0.30.1

No changes in this release.

## 0.30.0

No changes in this release.

## 0.29.0

No changes in this release.

## 0.28.0

No changes in this release.

## 0.27.0

No changes in this release.

## 0.26.0

No changes in this release.

## 0.25.0

### Minor Changes

- 5d2bc51: 預設的強調色都達 4.5:1（當文字放在 `bg` 上，以及白字放在它上面）：
  
  - `AccentPicker` 的三個推薦色加深到剛好達標，色相不變：橘 `#b85a0e`（原 `#c4600f`）、綠 `#1a844a`（原 `#1b8a4d`）、青 `#0e827d`（原 `#0f8a85`）。
  - 教材主題（`data-theme="teaching"`）的預設強調色改為青 `#0e827d`，取代 `#0f766e`；hover、按下、淺底與 focus ring 依強調色換算重新算出，強調色文字就是 `#0e827d`，強調色底上的文字為白色。

## 0.24.0

No changes in this release.

## 0.23.0

No changes in this release.

## 0.22.0

No changes in this release.

## 0.21.0

No changes in this release.

## 0.20.0

No changes in this release.

## 0.19.0

No changes in this release.

## 0.18.0

No changes in this release.

## 0.17.0

No changes in this release.

## 0.16.0

No changes in this release.

## 0.15.0

No changes in this release.

## 0.14.0

No changes in this release.

## 0.13.0

No changes in this release.

## 0.12.1

No changes in this release.

## 0.12.0

No changes in this release.

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

No changes in this release.

## 0.9.0

No changes in this release.

## 0.8.1

No changes in this release.

## 0.8.0

No changes in this release.

## 0.7.1

No changes in this release.

## 0.7.0

No changes in this release.

## 0.6.1

No changes in this release.

## 0.6.0

No changes in this release.

## 0.5.0

No changes in this release.

## 0.4.1

No changes in this release.

## 0.4.0

No changes in this release.

## 0.3.0

No changes in this release.
