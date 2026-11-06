# LayerGraph

元件架構圖：元件分層排列，箭頭表示呼叫。給資料就會自己排版和畫線，不用自己畫 SVG。

- 分層：`layer` 0 在最上面，同一層由左到右照資料順序，置中排列。
- 共用元件（`shared: true`，幾乎每個元件都會用到的，例如 `src/common`）不畫在圖上，改在圖的下方列出「被 N 個元件呼叫 M 次」。
- 方框：淡灰底，左側一條灰色色條；第一行是名稱（Geist Mono），第二行是函式數長條和「N 個函式」，長條長度和最大的元件相比。
- 線：直角轉彎、轉角是圓的，每條線接在方框上不同的位置。線的粗細依呼叫次數（`count`），全部灰色。推測的關係（`inferred`）是細虛線，箭頭旁寫 `label`。
- 選取（`selected`、`onSelect`）：點方框選取，再點一次取消。選取時相關的方框和線維持原樣、線變強調色並在箭頭旁寫「N 次」，其他淡到 40%。
- 層與層之間 56 px。圖比畫面寬時左右捲動，手機也一樣。
- 圖例預設放在下方：「呼叫次數越多線越粗」和「推測（規則）」；`inferredText` 是推測的說明（Term）。
- 放在卡片上。直接放在頁面底色上時，外層加 `style: { '--ui-graph-bg': 'var(--bg)' }`。

```js
h(UI.LayerGraph, {
  nodes: [
    { id: 'ibmon', name: 'src/ibmon', layer: 0, fns: 91 },
    { id: 'lib', name: 'src/libibtrace', layer: 1, fns: 114 },
    { id: 'common', name: 'src/common', shared: true }
  ],
  edges: [
    { from: 'ibmon', to: 'lib', inferred: true, label: '環境變數 `IBTRACE_SHM`' },
    { from: 'ibmon', to: 'common', count: 6 }
  ],
  selected, onSelect: setSelected,
  inferredText: '由規則推得，編譯器無法確認。'
})
```
