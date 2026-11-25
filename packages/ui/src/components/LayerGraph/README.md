# LayerGraph

## 用法

架構圖：項目（元件、服務、模組）分層排列，箭頭表示關係。給資料就會自己排版和畫線，不用自己畫 SVG。其他種類的方框與箭頭的圖用 Graph 的 class。

```tsx
<LayerGraph
  nodes={[
    { id: 'web', name: 'web', code: true, layer: 0, size: 91 },
    { id: 'api', name: 'api', code: true, layer: 1, size: 114 },
    { id: 'common', name: 'common', code: true, shared: true },
  ]}
  edges={[
    { from: 'web', to: 'api', count: 18 },
    { from: 'web', to: 'common', count: 6 },
  ]}
  labels={{ size: '{n} 個端點', count: '{n} 次請求' }}
  value={selected}
  onChange={setSelected}
/>
```

- 名稱是路徑、檔案或模組時給 `code: true`（Geist Mono）；用文字寫的名稱不給，維持內文字型。
- `layer` 0 在最上面；幾乎每個項目都用到的放 `shared: true`，不畫線，排在圖的下方；專案外的項目放 `external: true`。
- 推測的關係 `inferred`（細虛線），專案宣告的關係 `declared`（長短交替的虛線）；有依據的關係不要畫成推測。
- 圖上的字全部在一個 `labels` 物件裡，只給要換的：`labels={{ size: '{n} 個端點', count: '{n} 次請求' }}`。
- 選取是受控的 `value` 加 `onChange(id)`；要記住讀者拖拉的高度和「線上文字」開關時給 `storageKey`，沒給時什麼都不存。
- 放在卡片上；比外框寬時自動縮窄方框、縮小，再不行才左右捲動。

## 參考

- 方框 `nodes`：`id`、`name`、`code`（Geist Mono）、`layer`（0 在最上面）、`size`（方框裡的大小長條和數字，文字用 `labels.size`）、`shared`（共用，排在圖下方）、`external`（外部，排在最上方）、`tag` 加 `tagTone`（名稱旁的短標籤，幾個字）。
- 線 `edges`：`from`、`to`、`count`（線的粗細）、`label`（箭頭旁的字，反引號是程式碼）、`inferred`、`declared`；同一對方框之間有兩條線時給 `id`（預設 `${from}->${to}`）。
- `labels`：`size`、`count`、`external`、`shared`、`sharedMeta`、`use`、`inferred`、`inferredText`、`declared`、`declaredLegend`、`declaredText`、`listNodes`、`listEdges`，`{n}` 換成數字。
- 選線：`selectedEdge` 加 `onSelectEdge(id | null)`，給了線才能點；細節面板由頁面自己畫（見下方範例）。
- 線上文字：預設全部顯示，「線上文字」開關切換成滑過才顯示；`edgeLabels="hover"` 一開始隱藏，`labelToggle="icon"` 改成圖示按鈕，`labelToggle={false}` 拿掉開關。
- `resizable`：圖下方可以拖拉高度的把手；`storageKey` 記住高度和線上文字開關。
- `toolbar`：頁面自己的控制項（例如「依元件／依檔案」的 Tabs），和「圖／清單」放在同一列；`listView={false}` 拿掉清單檢視。
- 圖例預設在下方，只列出圖上有的線；`legend={false}` 拿掉，`legendItems` 換成自己的。直接放在頁面底色上（不在卡片上）時，外層加 `style={{ '--ui-graph-bg': 'var(--bg)' }}`。

點線在旁邊顯示細節：

```tsx
const [box, setBox] = useState<string | null>(null);
const [edge, setEdge] = useState<string | null>(null);

<Grid columns={2}>
  <Card>
    <LayerGraph
      nodes={nodes}
      edges={[
        { id: 'shm', from: 'worker', to: 'lib', inferred: true, label: '環境變數 `APP_SHM`' },
        { from: 'cli', to: 'lib', count: 7 },
      ]}
      value={box}
      onChange={setBox}
      selectedEdge={edge}
      onSelectEdge={setEdge}
    />
  </Card>
  <Card title="關係">{edge ? <DetailList items={details[edge]} /> : '選一條線查看細節。'}</Card>
</Grid>;
```
