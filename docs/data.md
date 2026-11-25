# 表格、清單與圖表

細節在各元件的 README；這裡是選哪個元件，以及跨元件要一致的規則。清單頁、空清單和載入的規則見 [guidelines.md](guidelines.md) 的「常見頁面」與「狀態與回饋」。

## 選哪個元件

| 要呈現的 | 元件 |
|---|---|
| 有欄位的資料，要排序、篩選、換頁 | `DataTable` |
| 資料夾與檔案、可以展開的階層 | `TreeList`；不是檔案的階層（呼叫關係）用 `kind="plain"` |
| 一個項目的詳細欄位 | `DetailList` |
| 可以收合的段落 | `Section`，一組用 `SectionGroup` |
| 卡片上的多個操作 | `ActionBar` |
| 重點數字 | `KpiCard` |
| 趨勢 | `LineChart` |
| 類別比較 | `BarChart` |
| 知道進度 | `ProgressBar`；不知道要多久用 `LoadingBar`；達成率用 `ProgressRing` |
| 數值和它的界線 | `Meter` |
| 依數值上色的平面圖 | `ZoneMap` |
| 元件架構 | `LayerGraph`；其他方框與箭頭的圖用 Graph 的 class |

## 表格與結果清單

- 表格裡的數字不縮寫。金額、時間長度、日期的欄位格式（`format`）寫在 DataTable 的用法（`ui docs DataTable`）。
- 結果清單（檢查結果、審核清單）：上方用 DataTable 的 `summary` 當摘要（全部加各狀態，附筆數），點了就篩選。要處理的狀態（失敗）緊接在「全部」後面。排序看情況，預設照資料的順序。
- 摘要已經寫出各狀態的筆數，就不用 KPI 卡片重複；KPI 只放表格看不出來的數字（總時數、成功率、趨勢）。
- 合計列、固定第一欄、常用檢視、同一欄位多選：看情況，依資料決定要不要開。
- 字體：數字用 Geist Mono，單位、相對時間（「5 分鐘前」）和其他中文用一般字體加等寬數字。
- 階層清單的排序、展開方式（一次全部或一次一個）和勾選：看情況，見 TreeList。

## 數字與圖表

- 圖表配色依序 `chart-1` 藍、`chart-2` 青、`chart-3` 橘、`chart-4` 暖灰；只有一組資料時用 `chart-1`；`chart-4` 給「其他」這類次要的一類。類別超過 3 時，圖例一定有文字。
- 大數字的軸和數值用 `format="compact"`（「50 萬」）；KpiCard 自己縮寫。
- KpiCard 變化的好壞方向（`direction`，越低越好的指標）和比較期間（`compareLabel`）寫在 KpiCard 的用法（`ui docs KpiCard`）。
- 熱度色階 `heat-1`…`heat-7` 與差值的發散色階只用在資料的填色，上面的字用 `textOn(fill)`；狀態不只靠顏色，數值一定寫出來（見 DataColors）。
- 預測、非實測的數值：填色上疊斜線（`ui-forecast`），旁邊加 `Tag icon="trend-up" tone="info"`「預測」。
