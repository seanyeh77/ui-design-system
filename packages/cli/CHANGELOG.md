# @seanyeh77/ui-cli

## 0.48.0

### Patch Changes

- 8c8aeea: codemap 回報的五項修正：
  
  - Workbench：`views` 或 `defaultLayout` 每次繪製都是新陣列時不再無限重繪（React #185）。版面只看 view 的 `id` 和 `defaultLayout` 的內容；`onLayoutChange` 只在版面內容改變時呼叫，可以直接傳 state 的 setter；分頁列的指示線位置不變時不再更新。
  - Workbench：桌面下方面板上緣的邊界點擊範圍往上延伸到 24 px（WCAG 2.5.8），不蓋住面板的分頁列。
  - 新增 `useFilePicker({ accept, multiple, onPick })`，回傳 `{ open }`：從 Button 的 `onClick` 或 Menu 項目的 `onSelect` 打開檔案選擇，hook 自己管隱藏的 `<input type="file">`。
  - `no-native-controls`：有 `hidden` 屬性的 `<input>` 不算；`<input type="file">` 的訊息提到 `useFilePicker`。
  - `ui check`：句子裡的 Term（`variant="inline"`，或旁邊有文字的預設樣式）和句子裡的連結一樣不算觸控目標，旁邊的文字在其他元素裡也一樣；「卡片外的文字」用 `overflow` 是 `hidden` 或 `clip` 的元素裁過、看得到的範圍量，`text-overflow: ellipsis` 截斷的文字不再被回報。
- Updated dependencies [8c8aeea]
  - @seanyeh77/ui@0.48.0

## 0.47.2

### Patch Changes

- Updated dependencies [95ea86e]
  - @seanyeh77/ui@0.47.2

## 0.47.1

### Patch Changes

- 9055a12: DataTable：`loading` 時 `relative` 欄的載入條和 `dateTime` 同寬（184 px），資料載入後欄寬不再跳動；手機卡片在第一欄是 `mono` 的 ID、表格又有主要欄時，改用主要欄當標題，ID 變成一行欄位。TextField：點前綴、後綴或單位文字會聚焦輸入框。`ui check`：file:// 頁面的字型被 CORS 擋下時不算 console 錯誤，改成一行 note，提醒用 http 開頁面才載得到字型。
- Updated dependencies [9055a12]
  - @seanyeh77/ui@0.47.1

## 0.47.0

### Minor Changes

- 6914fef: `ui check`：手寫的 `<button>`、`<a href>`、文字 `<input>` 和 `<textarea>` 也算原生控制項（元件的 `ui-*` class 和 Markdown 內容除外）；同一列控制項高度的檢查把 `.ui-field-box` 當成一個控制項；開著的對話框、抽屜和選單的截圖只拍視窗大小。Breadcrumb 的連結加上 `ui-crumb-link` class。

### Patch Changes

- 7dcac36: 範本（`ui add`）：清單與詳細頁的編輯抽屜改用 `useFormErrors`，「儲存」不再因為錯誤而停用，按下時說明哪裡錯並移到那個欄位；Dashboard 的示範資料涵蓋預設期間（最近 30 天），趨勢圖改為每日完成的任務。
- 481235c: `ui add` 只列出專案還沒裝的套件（`dependencies` 和 `devDependencies` 都看），包括 `react` 和 `react-dom`。
- Updated dependencies [122d806]
- Updated dependencies [bd4212e]
- Updated dependencies [41d01e7]
- Updated dependencies [f0bb1d2]
- Updated dependencies [2ca3d57]
- Updated dependencies [56a842b]
- Updated dependencies [f890a81]
- Updated dependencies [6e8a185]
- Updated dependencies [481235c]
- Updated dependencies [fafe0c5]
- Updated dependencies [bac70a8]
- Updated dependencies [acd850a]
- Updated dependencies [6914fef]
  - @seanyeh77/ui@0.47.0

## 0.46.0

### Minor Changes

- 01b316a: `ui check` 等動畫和轉場結束（最多 1.5 s）才量測，淡出中的列不再被誤報；每個寬度與主題那一行算進打開的狀態的問題，各狀態的問題列在它底下。新的檢查：同一列表單欄位不同高、390 px 時置中的兩行以上段落、AppShell 頁面的文件本身也在捲動。`--shots` 也存每個打開的狀態。`ui shots` 等網路閒置和字型、量到兩次相同的高度才截圖；檔名包含查詢字串（`iframe.html?id=button--primary` 是 `iframe-id-button-primary`），不再互相覆蓋。`ui docs` 不印 HTML 註解。新增 `ui add <dashboard|list-detail|settings|login> [dir]`，不連網路寫出頁面範本。升級方式：用含查詢字串的網址產生的基準圖要重新產生（檔名改了）。

### Patch Changes

- Updated dependencies [f5a21a0]
- Updated dependencies [08bc9ad]
- Updated dependencies [9bbe36a]
- Updated dependencies [ed5a2ce]
- Updated dependencies [0c1f10f]
- Updated dependencies [4b9fdd2]
- Updated dependencies [3689fc5]
- Updated dependencies [f781b8e]
- Updated dependencies [22ab76b]
- Updated dependencies [e598efe]
- Updated dependencies [526ae7c]
- Updated dependencies [7ebb98a]
- Updated dependencies [4f620c6]
- Updated dependencies [0b81a59]
- Updated dependencies [d605d46]
- Updated dependencies [2e98484]
- Updated dependencies [f01820e]
- Updated dependencies [9506ae1]
  - @seanyeh77/ui@0.46.0

## 0.45.0

### Minor Changes

- 85e523d: `ui check` 多檢查：被截斷又沒有 Tooltip 或 title 的介面文字、跑出卡片外的文字、1280 px 時小於 24 px 又擠著別的目標的目標（WCAG 2.5.8）、axe-core 的 WCAG 2.0、2.1、2.2 A 與 AA 規則（`--no-axe` 關掉），並自動點開分頁、SettingsLayout 分類和工具列選單檢查打開後的畫面（`--no-interact` 關掉；`--open <selector>` 加上自己的狀態）。頁面沒有 viewport meta 時只回報一次「缺 viewport meta」，不再把觸控目標算在元件頭上；整列可點的列連結（DataTable 的 `a.ui-dt-rowlink`）不算小目標。`ui check` 用和 `ui shots` 相同的 Chromium。`ui shots` 的整頁截圖包含 AppShell 主內容裡捲動的部分；網址的截圖檔名改用路徑加 hash，不含冒號，同一個網站的頁面不再互相覆蓋。`--help` 印出各指令的說明。`ui docs` 不加名稱時先印閱讀順序，`ui list` 依分組列出元件（`@seanyeh77/ui` 的 `docs/components.json` 提供分組）。升級方式：用網址產生的基準圖要重新產生（檔名改了）；新的檢查找出的問題要修，或暫時加 `--no-axe`、`--no-interact`。

### Patch Changes

- fdfaeb2: 文件整理：
  
  - AppShell 的導覽抽屜在 600 到 1023 px，1024 px 以上有側邊欄（剛好 1024 px 寬的視窗現在有側邊欄）；文件和 `bp-desktop` 的說明寫清楚 1024 px 只是導覽的邊界，頁面排版的斷點仍是 600、960、1280 px。
  - 套件的 `docs/` 多了 `agents.md`（做頁面的閱讀路徑）和 `icons.md`；`ui docs icons` 印出所有內建圖示名稱，`ui docs agents` 印出閱讀路徑。
  - guidelines 補上常見頁面（清單、詳細、Dashboard、設定、表單）與狀態回饋（載入、失敗、空清單、Toast）的規則；每條規則只說一次。DataTable、LayerGraph、TreeList、Workbench、CodeView、Markdown 的 README 縮短，實作規格移到 repo 的 `docs/maintaining/`。
  - 元件分組重新整理（`ui list`、llms.txt）：新增「版面與外框」「監控畫面」「程式碼與架構圖」「文字標記」，「頁面範本」改名「整頁元件」。`useFormErrors` 不再被 `ui docs` 當成指南。
  - 每個匯出元件的 prop 都有一行 JSDoc（編輯器和 props 表格看得到）。
  - tokens.json 的 `dur-toggle`、`dur-nav`、`space-5` 說明照實際用途改寫。
- d3a0f11: 全面審查修正的整合：
  
  - AppShell 自動放一個 Toaster：AppShell 裡的頁面直接呼叫 `toast()`；頁面自己放了 `<Toaster />` 時改用頁面的。Toaster 還沒出現前呼叫的 `toast()` 會排隊，不再遺失。
  - SettingsLayout 的 `toast` prop 改成 deprecated（開發時警告，仍可用）：改在儲存時呼叫 `toast('已儲存', { id: 'saved' })`。舊 prop 也經由 `toast()` 顯示，不再蓋住手機的分頁列。
  - FileUpload 的 `status: 'error'` 改名為 `'danger'`；舊值仍可用，開發時警告。
  - LoginCard 的「忘記密碼」改用 Link。觸控螢幕上清單選項與 DataTable 篩選的數字欄位至少 48 px；MultiSelect 打開清單時輸入框仍有名稱；DataTable 沒有資料時的 ARIA 表格結構完整；LineChart 資料表的「名稱（單位）」欄名有英文。
  - 新字串的英文：DataTable 排序順序與欄寬調整、KpiCard 的「改善／變差」、圖表資料表的欄名。
  - `ui check` 在頁面自己也跑 axe（Storybook 的無障礙 addon）時等它跑完，不再失敗。
- Updated dependencies [48b2b67]
- Updated dependencies [6d721ee]
- Updated dependencies [a7061b3]
- Updated dependencies [44764bc]
- Updated dependencies [92da534]
- Updated dependencies [fdfaeb2]
- Updated dependencies [4a6088e]
- Updated dependencies [183e1ff]
- Updated dependencies [4a6088e]
- Updated dependencies [d3a0f11]
- Updated dependencies [693c84a]
- Updated dependencies [523b0d5]
- Updated dependencies [4a6088e]
- Updated dependencies [85e523d]
  - @seanyeh77/ui@0.45.0

## 0.44.0

### Patch Changes

- e4cc89a: DataTable 的工具列變成一個完整的結構：摘要分段、搜尋框、「篩選」「排序」「⋯」和 `action`（「新增」）放得下時同一列（摘要靠左，可伸縮的搜尋框和按鈕靠右，全部 40 px），放不下時摘要自己一列；有摘要且沒有搜尋或篩選時不再重複顯示「4 / 4 筆」。欄寬重新分配：只貼合內容的文字欄最窄 128 px，主要欄和 `long` 欄各一份剩下的寬度，放得下時先各拿到一行的寬度（`long` 最多 512 px），不再讓長文字吃掉整張表。列操作不再蓋住最後一欄：最後一格右邊留好按鈕的寬度（量出來的，`actionsWidth` 可指定），日期和數字永遠完整。`ui check` 量工具列高度時把分段控制當成一個控制項。
- 8bf7f6e: Markdown：清單項目只有一個連結時（例如參考資料清單），連結撐滿整列，整列都能點，滑過有 `surface-sub` 底色；觸控螢幕上至少 48 px，滑鼠操作時 32 px。`ui check`：Markdown 內容裡的標題（`.ui-md-h`）可以換行，介面標題仍不能換行；程式碼區塊、表格框這類只為了用鍵盤捲動才能聚焦的內容不算觸控目標。
- Updated dependencies [d988360]
- Updated dependencies [1e25908]
- Updated dependencies [e4cc89a]
- Updated dependencies [8bf7f6e]
  - @seanyeh77/ui@0.44.0

## 0.43.1

### Patch Changes

- Updated dependencies [1e39a0b]
  - @seanyeh77/ui@0.43.1

## 0.43.0

### Patch Changes

- Updated dependencies [f3673a3]
  - @seanyeh77/ui@0.43.0

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
