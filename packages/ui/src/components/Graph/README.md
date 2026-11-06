# Graph

方框與箭頭的圖的樣式：自己畫 SVG，套用這些 class，再加 `UI.GraphDefs` 和 `UI.GraphLegend`。

元件架構圖請直接用 `UI.LayerGraph`，它會自己排版和畫線。這裡的 class 給其他種類的圖用。

- 外層加 `ui-graph`，`<svg>` 裡第一個放 `h(UI.GraphDefs)`，提供箭頭 `url(#ui-arrow)` 和強調色的 `url(#ui-arrow-accent)`。
- 線：`<path class="ui-graph-edge">`，1.5 px、`graph-edge` 灰色，直角轉彎（`M x y V … H … V …`）。推測的關係加 `is-inferred`，變成虛線。
- 方框：`<rect class="ui-graph-node" rx="10">`，名稱用 `<text class="ui-graph-name">`（Geist Mono 13 px）。外部的項目加 `is-external`（虛線外框、不填色），選取的加 `is-selected`。
- 線上的標籤：`<text class="ui-graph-label">`（12 px 粗體，一般字體）。程式名稱、路徑和數字包在 `<tspan class="ui-graph-code">` 裡，用 Geist Mono，例如「`<tspan class="ui-graph-code">8</tspan> 次呼叫`」。外圍描一圈卡片底色，線從字後面穿過仍看得清楚。放在線的旁邊或轉角附近，不要蓋住箭頭。
- 選取時：沒有關係的方框和線包在 `<g class="is-dim">` 裡（淡到 40%），相關的線加 `is-related`（強調色，箭頭改用 `#ui-arrow-accent`），標籤也加 `is-related`。
- 圖例：`<GraphLegend />` 放在圖的下方，預設三項：確定的關係、推測的關係、外部項目。用 `items` 換成專案自己的說法（例如「呼叫」「推測的呼叫」「外部函式」），給 `text` 會變成可以點開說明的 Term。
- 圖放在卡片（`surface`）上。直接放在頁面底色上時，外層加 `style: { '--ui-graph-bg': 'var(--bg)' }`，標籤的描邊才會和底色一致。
- 深色模式的線和外框自動變亮。顏色只用 token：`graph-edge`、`graph-node`、`accent`、`accent-soft`。

```js
h('div', { className: 'ui-graph' },
  h('svg', { viewBox: '0 0 640 300', width: 640, height: 300 },
    h(UI.GraphDefs),
    h('path', { d: 'M320 56 V80 H320 V118', className: 'ui-graph-edge is-inferred is-related', markerEnd: 'url(#ui-arrow-accent)' }),
    h('text', { x: 320, y: 100, textAnchor: 'middle', className: 'ui-graph-label is-related' }, 'LD_PRELOAD'),
    h('rect', { x: 230, y: 120, width: 180, height: 40, rx: 10, className: 'ui-graph-node is-selected' }),
    h('text', { x: 320, y: 140, textAnchor: 'middle', dominantBaseline: 'central', className: 'ui-graph-name' }, 'trace_post_send')),
  h(UI.GraphLegend))
```
