# ZoneMap

## 用法

分區平面圖：分區是格線上的矩形，依數值填熱度色階，每區寫名稱、狀態、主數值和一行次要資訊。

```js
h(UI.ZoneMap, {
  label: '設施分區',
  value: sel,
  onChange: setSel,
  zones: [
    { id: 'a', name: 'A 區', value: 23.1, unit: '°C', detail: '進氣 21.8 °C' },
    { id: 'b', name: 'B 區', value: 28.4, unit: '°C', tone: 'warning', state: '注意', detail: '進氣 26.1 °C' },
    { id: 'd', name: 'D 區', value: 25.8, unit: '°C', forecast: true, detail: '下一回合' },
    { id: 'h', name: 'H 區', value: null },
  ],
});
```

- 需要注意：`tone: 'warning'`／`'danger'`，畫 4 px 內框，狀態前加「⚠」；和選取的外框樣子不同，可以同時出現。
- 預測：`forecast` 疊上預測斜線，狀態預設「預測」。
- 放在 ConsoleLayout 的主視覺卡片裡時加 `fill`，讓分區撐滿卡片。

## 細節

- 排法：第一行名稱（16 px 半粗）靠左、狀態（13 px 半粗）靠右；中間是主數值（31 px Geist Mono），單位縮成 16 px 一般粗細；最下一行次要資訊（13 px）。
- 填色：沒給 `fill` 時，用 `value` 在 `min`～`max` 之間對應 `heat-1`…`heat-7`。`min`、`max` 預設是各分區數值的最小值和最大值，溫度、濕度、負載都適用；要固定的範圍（例如溫度 20～30 °C，不同時間的地圖顏色才能比較）時自己給。字的顏色自動選深色或白色（`textOn()`），跟著主題切換。
- 選取：`ink` 色 2 px 外框，在分區外 4 px。
- 沒有資料（`value` 是 `null`）：虛線框，名稱加「沒有資料」，不能選。
- 位置：`area: { row, col, rows, cols }`（從 1 開始）；沒給時依序排入 `columns` 欄（預設 4）、每列 `rowHeight` px（預設 120）。目前只有矩形。
- `fill`：列高平分地圖拿到的高度，最少 `rowHeight` px，不留空白。
- 選取是受控的 `value`（選中分區的 `id`）加 `onChange(id, zone)`。從舊版升級：`selectedId`、`onSelect(zone)` 改名 `value`、`onChange`，舊名稱下一版前仍可用。
- 數值和單位之間有一個空格，畫面上寫「23.1 °C」，和按鈕的名稱一樣（WCAG 2.5.3）。
- 鍵盤：每個分區是按鈕，Tab 依序經過，Enter 或空白鍵選取（`aria-pressed`）。螢幕閱讀器念「B 區，28.4 °C，注意，進氣 26.1 °C」。
