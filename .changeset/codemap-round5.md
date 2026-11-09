---
'@seanyeh77/ui': minor
---

codemap 第五輪試用的修正。

- LayerGraph：標籤找不到空位時沿自己的線找，再不行加高層間空隙、加大方框間距，不再壓到線；方框出去的線分散在整個寬度；同一層方框之間的線改從下方繞，不穿過方框；文字相同的標籤前面加來源；repo 外的方框不跟著變窄；`countLabel`、`sizeLabel` 可以是數量的函式，英文預設「1 call」「1 item」；清單檢視的關係按鈕名稱包含說明。
- DataTable：不能換行的內容讓欄位自動加寬；操作欄固定在右緣；手機卡片不再把名稱從中間斷開；「a / b 筆」由 CSS 畫，頁面文字只有一份；`fullText` 改成格子的 `aria-description`；列的名稱是第一欄。
- CodeView：註解和字串裡的路徑可以變成連結（`refHref`、`onRef`）；英文介面的「Line 48: 」「Language: 」用半形冒號。DateRangePicker、TreeList 也是。
- TopBar：手機上專案名稱先截斷，頁面標題不會只剩一個字。
- Tour：步數「1 / 5」由 CSS 畫；目標比視窗高時開發警告。TextArea 字數同樣。
