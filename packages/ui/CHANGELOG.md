# @seanyeh77/ui

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
