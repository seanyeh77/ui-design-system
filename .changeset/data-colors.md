---
'@seanyeh77/tokens': minor
'@seanyeh77/ui': minor
---

新增資料用的顏色：熱度色階 `heat-1`…`heat-7`（冷藍 → 中性灰 → 橘紅）、差值發散色階 `diverge-neg-strong`…`diverge-pos-strong`（負藍、0 灰、正橘）、第 4 個類別色 `chart-4`（暖灰）與預測紋理的顏色 `forecast-stripe`，淺色深色都有。UI 新增 `textOn(fill)`（在深色與白色中選對比較高的字色）、`heatToken()`、`divergeToken()`，class `ui-forecast` 在填色上疊斜線紋理，`Tag` 新增 `variant="forecast"`（「預測」）與 `variant="demo"`（「示範資料」）。LineChart 最多四組資料。新增文件頁 DataColors，guidelines 補上監控畫面的最小字級、大螢幕縮放與危險動作規則。
