---
'@seanyeh77/ui': minor
---

DataTable 多欄排序：

- Shift＋點欄位標題（鍵盤 Shift＋Enter）把那一欄加成下一層排序；有兩層以上時標題寫出它是第幾層，螢幕閱讀器也會念。
- 工具列新的「排序」按鈕直接寫出目前的排序（「排序：程式 ↑、ΔT ↓」，手機上寫層數），點開可以加一層、拖曳或 Alt＋↑ ↓ 調順序、切換方向、移除。
- 排序寫進網址（`?sort=prog,-dt`，有 `urlKey` 時加前綴）；新的 `defaultSort`；`maxSort` 限制層數（預設不限）。
- 新圖示 `sort-ascending`、`dots-six-vertical`。
