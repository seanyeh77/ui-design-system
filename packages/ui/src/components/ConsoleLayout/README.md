# ConsoleLayout

## 用法

全螢幕監控畫面的版面：頂列、左邊主視覺、右邊側欄、主視覺下方的底列，填滿整個畫面、整頁不捲動。給常駐在大螢幕上、遠看的監控畫面；一般後台頁用 AppShell。

```js
h(UI.ConsoleLayout, {
  title: '設施監控',
  tags: h(UI.Tag, { icon: 'info' }, '示範資料'),
  status: 'AI 最佳化中',
  kpis: [h(UI.KpiCard, { key: 'e', size: 'compact', label: '預測誤差', value: 0.4, decimals: 1, unit: '°C', target: '目標 ≤ 0.5 °C' })],
  clock: '即時',
  main: h(UI.Card, { title: '設施分區' }, h(UI.ZoneMap, { label: '設施分區', zones: zones, fill: true })),
  side: [h(UI.Card, { key: 't' }, h(UI.TimeControl, timeProps))],
  bottom: h(UI.Card, { title: '進氣溫度' }, h(UI.LineChart, chartProps)),
});
```

- 頂列的字都是 16 px、同一個顏色：`status` 傳一般文字（例如「AI 最佳化中」），不要用 Badge 或狀態色。
- `kpis` 放 `KpiCard size="compact"`。
- 卡片由頁面自己放（Card）；主視覺裡的 ZoneMap 加 `fill` 撐滿卡片。
- 1440 × 900 以上整個版面等比放大，最多 1.5 倍；以下不縮小。

## 細節

- 頂列：左邊 `title`（整頁唯一的標題）和 `tags`（例如 `Tag icon="info"`「示範資料」）；右邊依序是 `status`、`kpis`、`clock`、全螢幕按鈕。頂列的字都是 16 px、同一個顏色：`status` 傳一般文字（例如「AI 最佳化中」），不要用 Badge 或狀態色。
- `kpis` 放 `KpiCard size="compact"`，在頂列裡去掉卡片底色和陰影，中間用 1 px 線分開。
- `main`：主視覺，例如裝 ZoneMap 的 Card；填滿左邊的格子，放不下時在卡片裡捲動。卡片裡是由上而下排的欄，ZoneMap 加 `fill` 就會撐滿卡片剩下的高度。
- `side`：側欄的卡片，由上到下，例如 TimeControl、EventTimeline。側欄 400 px（版面寬度小於 1280 px 時 360 px），放不下時側欄自己捲動。
- `bottom`：主視覺下方一列，高度跟著內容，例如裝 LineChart 的 Card；主視覺拿剩下的高度。
- `extras: [{ id, minHeight, node }]`：螢幕夠高才出現的卡片，加在側欄最後面。`minHeight` 比的是「邏輯高度」，也就是畫面高度 ÷ 放大倍數，例如 1040。
- 放大：1440 × 900 以上整個版面等比放大，倍數 = 寬 ÷ 1440 和 高 ÷ 900 的較小者，最多 1.5 倍（`consoleZoom(w, h)`）；以下維持原大小、不縮小。
- 全螢幕按鈕（「全螢幕」／「離開全螢幕」）讓版面佔滿整個螢幕；瀏覽器沒有全螢幕功能時不顯示，`fullscreen={false}` 可以拿掉。
- 手機（寬度小於 600 px）：排成一欄可以捲動的長頁：頂列（KPI 換到第二行，可以左右捲動）、主視覺、側欄的卡片、底列、`extras` 的卡片全部顯示。
- 卡片由頁面自己放（Card），版面本身只有頂列有底色和陰影。
- 地標：`title` 是 `h1`；主視覺和底列在 `main` 裡，側欄是 `aside`（「側欄」）；手機上頂列以下整欄都在 `main`。頁面不再另放 `h1` 或 `main`。

```js
h(UI.ConsoleLayout, {
  title: '設施監控',
  tags: h(UI.Tag, { icon: 'info' }, '示範資料'),
  status: 'AI 最佳化中',
  kpis: [
    h(UI.KpiCard, { key: 'e', size: 'compact', label: '預測誤差', value: 0.4, decimals: 1, unit: '°C', target: '目標 ≤ 0.5 °C' }),
    h(UI.KpiCard, { key: 'p', size: 'compact', label: 'PUE', value: 1.42, decimals: 2, target: '目標 ≤ 1.45' }),
  ],
  clock: '即時',
  main: h(UI.Card, { title: '設施分區' }, h(UI.ZoneMap, { label: '設施分區', zones: zones, fill: true })),
  side: [h(UI.Card, { key: 't' }, h(UI.TimeControl, timeProps)), h(UI.Card, { key: 'e', title: '事件' }, h(UI.EventTimeline, eventProps))],
  bottom: h(UI.Card, { title: '進氣溫度' }, h(UI.LineChart, chartProps)),
  extras: [{ id: 'meters', minHeight: 1040, node: h(UI.Card, { title: '各區進氣溫度' }, meters) }],
});
```
