# @seanyeh77/ui-cli

## 0.42.0

### Patch Changes

- fb81a5d: 分檔 CSS 修正：每個 `css/<Name>.css` 都帶齊它需要的其他元件的檔（DatePicker 帶 Calendar、IconButton 帶 Tooltip、Button 帶 Dialog 等），需要的檔排在後面時 build 直接失敗；`LineChart`、`TextField` 等沒有自己樣式的元件也有 `css/<Name>.css`。`styles.css` 的規則順序跟著調整，畫面不變。`backdrop-filter` 與 `user-select` 的 `-webkit-` 寫法移到標準屬性之前，bundler 壓縮後不再丟掉背景模糊。`ui check` 新增一項：列出頁面沒放進 cascade layer、用元素或 `*` 選擇器、又蓋過元件宣告的 CSS（重設 CSS、範本附的 `index.css`）。每個套件加上 README。
- c4c3193: 新增 `ui shots`：在 390 px 與 1280 px、亮色與暗色下為頁面拍出可重現的截圖（固定時鐘、停用動畫與游標、等字型載入、縮放 1、整頁）。`--out` 寫出基準圖（像素相同的檔案不改寫，有 oxipng 時無損壓縮，`--prune` 刪除沒有對應頁面的基準圖）；`--compare` 與基準圖比對，色差超過 0.1 的像素多於 0.02 % 或尺寸改變即算改變，在 `--diff` 資料夾寫出差異圖、新截圖與 summary.md，並以 exit 1 結束。改變的截圖會重拍一次，第二次相符就通過。`ui check` 切換主題的方式與 `ui shots` 共用。
- Updated dependencies [ade4d1d]
- Updated dependencies [fb81a5d]
- Updated dependencies [ac4911e]
  - @seanyeh77/ui@0.42.0

## 0.41.0

### Patch Changes

- 75bbec2: `ui check` 新增兩項檢查：同一列工具列裡的控制項高度相差超過 1 px（例如「篩選」40 px、「欄位」32 px），以及表格列或卡片裡帶陰影的狀態標籤（`.ui-badge`）；兩項都寫出原因與修正方式。`docs/guidelines.md` 新增清單頁的做法（清單放在一張 Card，主要操作「新增」放在 Card 的 `actions`，筆數由表格工具列顯示）、按鈕層級（primary、secondary、quiet、danger）、表格與卡片裡的狀態圓點，以及時間長度格式（`46:42`、`1:54:49`）。`docs/data.md` 新增表格頁的規則：摘要已有筆數時不再用 KPI 卡片重複、要處理的狀態緊接在「全部」後面、摘要的欄位不再放進篩選、數字欄用 `numeric` 加 `unit`、失敗的列寫出原因並提供「重試」、執行中的進度寫在次要文字、列操作超過 2 個收進「⋯」、用 `rowHref` 打開一筆資料。`docs/motion.md` 的主題切換時間改為實際使用的 300 ms。
- b42450a: 文件改成依需要讀取：`docs/guidelines.md` 只留每一頁都需要的核心規則，其他規則分到主題檔（`layout`、`forms`、`data`、`monitoring`、`code`、`theme`、`motion`）和各元件的 README，套件的 `docs/` 一併附上這些主題檔。每個元件的 README 開頭新增「用法」：一句話說明、最短的範例與最常用錯的規則。`ui docs <Name>` 預設只印「用法」，加 `--full` 印整份 README；`ui docs` 也能印主題檔，`ui list` 列出主題檔與元件的一句話說明。
- 4a10b3c: 對比、焦點、字型與錯誤欄位的修正：
  
  - 淺色 `warning-text` 由 `#955e0b` 調成 `#945d0b`：在紅色色票（`#c53228`）算出的 `accent-soft` 上由 4.49:1 提高到 4.55:1。對比測試改為檢查所有文字 token 在每個推薦色票算出的 `accent-soft` 上達 4.5:1。
  - DataTable 格子裡的可聚焦元素改畫內側焦點外框；截斷的長文字裡的連結取得焦點時整段展開。CommandPalette 搜尋列有焦點時畫內側外框。SettingsLayout 分類與 LayerGraph 方框的焦點外框不再被捲動區切掉。
  - 中文不再用 Geist Mono：KpiCard 單位、TreeList 日期與 meta、ProgressBar 的「完成 ✓」改用一般字體（數字等寬）。LayerGraph 節點新增 `code`，名稱是路徑或模組時才用 Geist Mono，預設一般字體。
  - 表格列裡完成的 ProgressBar 改用 `success-text`，選中的列上也有 3:1。
  - 所有欄位的錯誤樣式一致：紅框、框內警告圖示、下方錯誤訊息。TextArea、Select、MultiSelect、DatePicker 新增 `error`；LoginCard 密碼欄補上圖示。
  - DataTable 的合計列在手機上不再隱藏，改成卡片下方的摘要。
  - `ui check` 在用 bundle.js 的頁面呼叫 `UI.setTheme()` 切換淺色與深色，深色檢查真的是深色。
  - 文件與範例裡的專案名稱換成通用的例子。
- Updated dependencies [be1018c]
- Updated dependencies [bc1608a]
- Updated dependencies [75bbec2]
- Updated dependencies [b42450a]
- Updated dependencies [0daa633]
- Updated dependencies [20b6f04]
- Updated dependencies [0daa633]
- Updated dependencies [6217554]
- Updated dependencies [0daa633]
- Updated dependencies [4a10b3c]
- Updated dependencies [0daa633]
- Updated dependencies [dbee37f]
- Updated dependencies [f7ac5f6]
- Updated dependencies [0daa633]
  - @seanyeh77/ui@0.41.0

## 0.40.0

### Patch Changes

- Updated dependencies [1674a47]
  - @seanyeh77/ui@0.40.0

## 0.39.0

### Patch Changes

- Updated dependencies [93bb051]
  - @seanyeh77/ui@0.39.0

## 0.38.0

### Patch Changes

- Updated dependencies [19a8794]
  - @seanyeh77/ui@0.38.0

## 0.37.0

### Patch Changes

- Updated dependencies [700b9fe]
  - @seanyeh77/ui@0.37.0

## 0.36.0

### Patch Changes

- Updated dependencies [f00ddb8]
  - @seanyeh77/ui@0.36.0

## 0.35.0

### Patch Changes

- Updated dependencies [67fd71a]
  - @seanyeh77/ui@0.35.0

## 0.34.0

### Patch Changes

- Updated dependencies [0b421ff]
  - @seanyeh77/ui@0.34.0

## 0.33.0

### Patch Changes

- Updated dependencies [78e2f8d]
  - @seanyeh77/ui@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [28072b2]
  - @seanyeh77/ui@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [3643238]
  - @seanyeh77/ui@0.31.0

## 0.30.1

### Patch Changes

- Updated dependencies [cd20daf]
  - @seanyeh77/ui@0.30.1

## 0.30.0

### Patch Changes

- Updated dependencies [e7fdf91]
  - @seanyeh77/ui@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [b80f894]
  - @seanyeh77/ui@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [3645cbd]
  - @seanyeh77/ui@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [2853e62]
- Updated dependencies [3e31067]
  - @seanyeh77/ui@0.27.0

## 0.26.0

### Patch Changes

- Updated dependencies [4bda68b]
  - @seanyeh77/ui@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [5d2bc51]
  - @seanyeh77/ui@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [1a1d289]
  - @seanyeh77/ui@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [aa3bdf7]
- Updated dependencies [6e419ac]
- Updated dependencies [a14edc4]
  - @seanyeh77/ui@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [17fc39f]
- Updated dependencies [b49dcea]
  - @seanyeh77/ui@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [09c2354]
- Updated dependencies [a52da0f]
  - @seanyeh77/ui@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [76caee8]
  - @seanyeh77/ui@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [e16d430]
  - @seanyeh77/ui@0.19.0

## 0.18.0

### Patch Changes

- Updated dependencies [0f1ccf9]
  - @seanyeh77/ui@0.18.0

## 0.17.0

### Patch Changes

- Updated dependencies [8bea9f6]
  - @seanyeh77/ui@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [1e412d0]
- Updated dependencies [dea1d71]
  - @seanyeh77/ui@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [d6377b3]
  - @seanyeh77/ui@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies [2a66f0d]
  - @seanyeh77/ui@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [86dd423]
  - @seanyeh77/ui@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies [a6b9352]
  - @seanyeh77/ui@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [a7fd3e7]
  - @seanyeh77/ui@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [99a6182]
  - @seanyeh77/ui@0.11.0

## 0.10.0

### Patch Changes

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
- Updated dependencies [cd96e15]
  - @seanyeh77/ui@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [7cdfbd9]
- Updated dependencies [0d5a351]
  - @seanyeh77/ui@0.9.0

## 0.8.1

### Patch Changes

- Updated dependencies [339b776]
- Updated dependencies [09d1537]
  - @seanyeh77/ui@0.8.1

## 0.8.0

### Patch Changes

- Updated dependencies [68b7c0f]
  - @seanyeh77/ui@0.8.0

## 0.7.1

### Patch Changes

- Updated dependencies [6119d5e]
  - @seanyeh77/ui@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [e991df7]
- Updated dependencies [4f5890f]
  - @seanyeh77/ui@0.7.0

## 0.6.1

### Patch Changes

- Updated dependencies [2e8d631]
  - @seanyeh77/ui@0.6.1

## 0.6.0

### Patch Changes

- 76f204a: LayerGraph: on touch screens the shared-item boxes no longer cover the whole page. Their enlarged touch area (::after) measured against the window because the box was `position: static`; it is `relative` now. Tooltip: closes when its trigger loses focus, only one is open at a time, and a closing Tooltip leaves at once instead of waiting for its entrance animation, so tabbing through cut-off DataTable cells no longer leaves Tooltips stacked. ui check: reports touch areas larger than their own control (they cover other controls) and no longer counts them as big enough targets.
- Updated dependencies [8f9e284]
- Updated dependencies [4e7a669]
- Updated dependencies [f920576]
- Updated dependencies [76f204a]
  - @seanyeh77/ui@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [87d835f]
- Updated dependencies [e17cbf2]
  - @seanyeh77/ui@0.5.0

## 0.4.1

### Patch Changes

- Updated dependencies [74d39d3]
- Updated dependencies [b036f55]
  - @seanyeh77/ui@0.4.1

## 0.4.0

### Patch Changes

- 9dc8165: LayerGraph: selectable edges. `LayerGraphEdge.id` (default `${from}->${to}`), controlled `selectedEdge` and `onSelectEdge`. A click on a line or its label selects it; again, or on the empty diagram, clears it. Tab, Enter or Space and Escape work on lines. Selecting a line clears the selected box and the other way round. Without `onSelectEdge` nothing changes.
  
  ui check lists LayerGraph's selectable lines as exempt touch targets: the label is the touch target.
- Updated dependencies [9dc8165]
- Updated dependencies [5c08281]
  - @seanyeh77/ui@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies [9e7a950]
  - @seanyeh77/ui@0.3.0
