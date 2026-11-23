---
'@seanyeh77/ui': patch
---

在 jsdom 測試裡不必再自己補 API：DataTable 量欄寬時用到 jsdom 沒有的 `Range#getBoundingClientRect` 與 `ResizeObserver` 而當掉的問題已修正，Tabs、SegmentedControl、SplitPane、Markdown 表格、LayerGraph、Tour、Workbench 與表格的捲動漸層在沒有 `ResizeObserver` 時也不再當掉。LayerGraph 在沒有 canvas 時改用估計的文字寬度（不再印出 jsdom 的「Not implemented」錯誤），Section 與 LayerGraph 在沒有 `scrollIntoView` 時略過捲動，拖曳把手在沒有 pointer capture 時照常運作。量不到版面時元件維持預設欄寬與大小，瀏覽器裡的行為不變。每個 story 現在都在 jsdom 與 `renderToString` 下測試渲染與常用操作。
