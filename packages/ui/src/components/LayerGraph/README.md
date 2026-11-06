# LayerGraph

架構圖：項目（元件、服務、模組）分層排列，箭頭表示關係。給資料就會自己排版和畫線，不用自己畫 SVG。

- 分層：`layer` 0 在最上面，同一層由左到右照資料順序，置中排列。
- 共用項目（`shared: true`，幾乎每個項目都會用到的，例如 `src/common`）不畫在圖上，改在圖的下方列出，預設寫「N 個項目使用，共 M 次」（`sharedMeta`，`{a}` 是項目數、`{b}` 是次數），標題預設「共用項目」（`sharedLabel`）。
- 方框：淡灰底，左側一條灰色色條；第一行是名稱（Geist Mono），第二行是大小長條和文字，長條長度和最大的項目相比。大小給 `size`（函式數、檔案數、端點數），文字用 `sizeLabel` 換成專案的單位，預設「{n} 個項目」。
- 線：直角轉彎、轉角是圓的，每條線接在方框上不同的位置。線的粗細依次數（`count`），全部灰色。推測的關係（`inferred`）是細虛線，箭頭旁寫 `label`。一個方框收到兩條以上有標籤的線時，左半邊箭頭的標籤寫在箭頭左側、右半邊的寫在右側，只有一條時寫在右側；仍會碰到已經放好的標籤或其他箭頭時往上移一行（18 px）。標籤不會超出圖的左右邊界：放不下時改放另一側。選取時的「N 次」（`countLabel`）也一樣。
- 選取（`selected`、`onSelect`）：點方框選取，再點一次取消。選取時相關的方框和線維持原樣、線變強調色並在箭頭旁寫「N 次」，其他淡到 40%。
- 層與層之間 56 px。圖比畫面寬時左右捲動，手機也一樣。
- 圖例預設放在下方：「次數越多線越粗」和「推測的關係」；`inferredText` 是推測的說明（Term），`inferredLabel` 換掉「推測」這個詞。
- 放在卡片上。直接放在頁面底色上時，外層加 `style: { '--ui-graph-bg': 'var(--bg)' }`。

```tsx
<LayerGraph
  nodes={[
    { id: 'web', name: 'web', layer: 0, size: 91 },
    { id: 'api', name: 'api', layer: 1, size: 114 },
    { id: 'common', name: 'common', shared: true },
  ]}
  edges={[
    { from: 'web', to: 'api', count: 18 },
    { from: 'web', to: 'common', count: 6 },
  ]}
  sizeLabel="{n} 個端點"
  countLabel="{n} 次請求"
  selected={selected}
  onSelect={setSelected}
/>
```

從舊版升級：`fns` 改名 `size`，原本寫死的「N 個函式」「被 N 個元件呼叫」改用 `sizeLabel`、`sharedMeta` 傳入。
