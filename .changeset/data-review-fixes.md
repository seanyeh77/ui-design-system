---
'@seanyeh77/ui': minor
---

資料與圖表的全面審查修正。

- DataTable：搜尋、篩選、排序與分頁改用 `useMemo`，量欄寬一次只更新一次 state；勾選後的批次操作列移到表格上方（`role="toolbar"`），表頭保留；欄寬邊框的點擊範圍 24 px，點一下邊框依序加寬（不必拖曳）；排序面板每層多「上移」「下移」，方向 radio 改成方向鍵切換；字距或行距改變時重新量欄寬；手機卡片的欄名和值同一行、操作按鈕自己一行；筆數只在搜尋或篩選後顯示；新的 `toolbar={false}` 與欄位 `mono: true`；展開欄有標題；頁碼改成安靜樣式，停用的箭頭維持 4.5:1；列勾選框在深色模式不再是灰底。
- 表格（DataTable、Markdown）裡有連結的 InlineCode 只顯示連結色的等寬字。
- BarChart、LineChart：y 軸寬度依刻度文字、刻度改用 1、2、5 的整數步距、新的 `format="compact"`（「50 萬」）、y 軸上方顯示單位；BarChart 新的 `height`（數字或 `'fill'`）；LineChart 的 x 軸標籤不再超出圖；播放頭是 `role="slider"`，看數值時是 `role="application"`，圖後面附只給螢幕閱讀器的資料表。
- Graph、LayerGraph：變淡時只淡化線與底色，文字改成 `ink-muted`（4.5:1）。LayerGraph 排版與繞線改用 `useMemo`，滑過只切換 class。
- KpiCard：螢幕閱讀器念得到數值，好壞多念「改善／變差」；「萬」「億」照單位的樣式；變化跟著 `decimals`；內距改成 16 px。
- Skeleton 看得見（`line` 色）且在減少動態時不動；ProgressBar、Meter 在強制色彩模式下不再消失。
- TreeList：日期與大小的數字用 Geist Mono；下載鈕改 quiet；「全部展開」改成圖示按鈕；標題 17 px；項目名稱包含畫面上的 meta。
- ZoneMap：熱度色階預設用資料的最小與最大值；畫面上的數值和單位之間加空格。

升級方式（舊名稱下一版前仍可用，開發時 console 會提示）：

- LayerGraph：`fns` 已移除，改用 `size`。`sizeLabel`、`countLabel`、`externalLabel`、`sharedLabel`、`sharedMeta`、`useLabel`、`inferredLabel`、`inferredText`、`declaredLabel`、`declaredLegend`、`declaredText`、`listLabels` 改成 `labels={{ size, count, external, shared, sharedMeta, use, inferred, inferredText, declared, declaredLegend, declaredText, listNodes, listEdges }}`；`selected`、`onSelect` 改成 `value`、`onChange`；`heightKey`、`scrollKey` 改成一個 `storageKey`。沒有 `storageKey` 時不再寫入 localStorage（原本「線上文字」開關會以方框 id 為鍵名寫入）。
- TreeList：`selectedId`、`onSelect(node)` 改成 `value`、`onChange(id, node)`；`selected`、`onSelectChange` 改成 `values`、`onValuesChange`。
- ZoneMap：`selectedId`、`onSelect(zone)` 改成 `value`、`onChange(id, zone)`。沒給 `min`、`max` 時色階改用資料的範圍；溫度圖要維持原本的 20 到 30 請自己傳 `min={20} max={30}`。
- DataTable：沒有篩選時不再顯示「n / n 筆」；勾選時表頭不再換成批次列，若有測試找 `.ui-dt-head.ui-dt-bulk`，改找 `role="toolbar"`。
