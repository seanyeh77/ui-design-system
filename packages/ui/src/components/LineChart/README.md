# LineChart

折線圖。

- 平滑曲線，線寬 2.5 px，不填色；唯一的例外是兩組資料之間的差額帶（`band`，見下方）。
- 多組資料依序用 `chart-1`、`chart-2`、`chart-3`、`chart-4`（暖灰，給「其他」「人工」這類次要的一組）；超過一組時上方顯示有文字的圖例。
- 格線為淡色虛線，底線實線；數字刻度用等寬字。
- 滑過時出現垂直參考線、各組的點，以及浮起卡片顯示日期和數值（加單位）。
- 鍵盤：圖可以用 Tab 移到，← → 在時間點之間移動、Home／End 到兩端，和滑過一樣顯示參考線和數值卡片，螢幕閱讀器念「時間點：各組數值」。
- 進場時一條接一條畫出，間隔 150 ms。
- `label` 必填，作為圖表的 `aria-label`。

## 監控畫面：預測與實際、節能

- `min`：y 軸的下限（預設 0），溫度這類離 0 很遠的值要設，例如 `min: 22, max: 30`。
- 每組資料可以設 `dashed`（虛線，例如預測、基準）和 `color`（用第幾個 `chart-*`，例如預測用 3、基準用 4）。`values` 可以有 `null`：預測比實際長、或中間缺資料時，那裡不畫線。
- `band: { between: [0, 1], tone, label }`：兩組之間填色，這是「折線不填色」的例外，只用在兩組資料的差上（預測與實際、實際與基準），不疊在三組以上的圖。
  - `tone: 'diverge'`：第一組高於第二組填橘（`diverge-pos`），低於填藍（`diverge-neg`），各 30%。
  - `tone: 'success'`：填 `success` 28%，例如省下的電。
  - `label` 是圖例裡的文字；數值提示多一列「差」。
- `now`：那個時間點畫「現在」實線，之後的未來區疊預測斜線（和 `ui-forecast` 相同）。
- `thresholds: [{ value, label, tone }]`：水平 1.5 px 虛線，`warning` 是注意、`danger` 是上限，標籤靠右寫在線上方。
- `marker: { at, value, label }`：一個空心圓加標籤，例如下一回合的單點預測；顏色跟著那一組（預設最後一組）。
- `playhead` 加 `onPlayheadChange`：回放用的播放頭，強調色 2 px 線，x 軸上一個 16 px 圓形把手。滑鼠或觸控在圖上按下、拖曳移動；Tab 到圖上後 ← → 一格、Home／End 到兩端，螢幕閱讀器念那個時間點的數值。
- `headline`：圖上方的大字（25 px），例如「省 186 kWh（約 12%）」；數字用等寬字。來源說明寫在圖下方一行。
- `status`：圖底部貼一條 StatusBand，和時間點對齊。
- 沒有任何數值時，圖的中間寫「這段時間沒有資料」（`empty` 可以改字）。

```js
h(UI.LineChart, {
  label: '進氣溫度，預測與實際',
  unit: '°C',
  decimals: 1,
  min: 22,
  max: 30,
  labels: times,
  labelEvery: 4,
  series: [
    { name: '實際', values: actual },
    { name: '預測', values: forecast, dashed: true, color: 3 },
  ],
  band: { between: [0, 1], tone: 'diverge', label: '實際偏高／偏低' },
  now: 15,
  thresholds: [
    { value: 27, label: '注意 27 °C', tone: 'warning' },
    { value: 29, label: '上限 29 °C', tone: 'danger' },
  ],
  marker: { at: 16, value: 25.8, label: '下一回合 25.8 °C' },
  playhead: at,
  onPlayheadChange: setAt,
});
```
