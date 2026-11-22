# KpiCard

## 用法

KPI 卡片，放在 Dashboard 最上方，用 `Grid` 排成一列。本身就是卡片，不再包 Card。

```tsx
<Grid columns={4}>
  <KpiCard label="本月營收" value={12840000} format="money" delta={8.2} spark={revenue} />
  <KpiCard label="錯誤率" value={0.42} unit="%" decimals={2} delta={12} good={false} />
</Grid>
```

- 由上到下：標籤、大數字加單位、迷你折線（`spark`）、變化（`delta`）。
- 變化的顏色看好壞、不看方向：`good` 預設為 `delta > 0`；錯誤率這種上升是壞事的指標設 `good={false}`。
- 單位寫在 `unit`（人、ms、%）；金額用 `format="money"`；百分比的指標，變化用 `deltaUnit="pt"`（「個百分點」）。
- 監控畫面的頂列用 `size="compact"`（見下方）。

## 細節

- 數字 31 px、Geist Mono、等寬數字；單位寫在數字後面，用一般字體（「個」「人」「天」不用 Geist Mono）。
- 大數字縮寫只出現在 KPI 卡片：1 萬以上寫成「1,284 萬」（`compact={false}` 可以關掉）。金額顯示成「NT$ 1,284 萬」。`format="percent"` 只決定一位小數，% 用 `unit: '%'` 加上。
- 數字進場時從 0 數上來（900 ms）。跳動途中用和最終值相同的單位和小數位數，寬度先保留給最終值，所以不會忽寬忽窄。
- 卡片太窄、最終數字放不下時，字級自動從 31 px 縮小，最小 20 px。
- 變化：▲／▼ 加百分比，後面接灰色「較上週」（`compareLabel` 可改）。

## 緊湊版（`size="compact"`）

放進監控畫面頂列的小卡：標籤、22 px 數字、一行 13 px 灰字目標（`target`，例如「目標 ≤ 0.5 °C（示意）」）。不畫迷你折線。

- `verdict: { tone, text }`：判定。`success`（例如「預測準確」）時畫面上只有目標那一行，螢幕閱讀器仍會念判定；`warning`（「偏差變大」）或 `danger`（「需要校正」）時，目標那一行換成那個顏色的半粗字「偏差變大（目標 ≤ 0.5 °C（示意））」。不加符號、不加底色，用文字說出狀態。

```js
h(UI.KpiCard, {
  size: 'compact',
  label: '近 1 小時誤差',
  value: 0.9,
  decimals: 1,
  unit: '°C',
  verdict: { tone: 'warning', text: '偏差變大' },
  target: '目標 ≤ 0.5 °C（示意）',
});
```
