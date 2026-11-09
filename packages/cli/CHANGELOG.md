# @seanyeh77/ui-cli

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
